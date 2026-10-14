"""Pack Adriano's authored drawings without repainting or borrowing other actors.

Each connected silhouette owns its original pixels, including portions beyond
nominal grid boundaries. Only generated matte noise is excluded. The four
source sheets and portrait make the build reproducible from this repository.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/adriano'
RUNTIME = ROOT / 'assets/runtime'
BODY_SCALE = .88
BODY_HEIGHT = 300 * BODY_SCALE
VERSION = 2


def extract(name, rows=4):
    path = SOURCE / f'{name}.png'
    pixels = np.asarray(Image.open(path).convert('RGBA')).copy()
    r, g, b, a = [pixels[:, :, i].astype(float) for i in range(4)]
    fringe = ((r > 140) & (r > g * 2.5) & (r > b * 2.5)) | ((r > 180) & (g > 170) & (abs(r-g) < 50) & (b < 75))
    mask = (a > 90) & ~fringe
    labels, _ = ndimage.label(mask, np.ones((3, 3), bool))
    sizes = np.bincount(labels.ravel())
    components = np.argsort(sizes[1:])[-rows*4:] + 1
    owners = {}
    for ident in components:
        yy, xx = np.nonzero(labels == ident)
        cells = np.minimum(rows-1, yy*rows//pixels.shape[0])*4 + np.minimum(3, xx*4//pixels.shape[1])
        index = int(np.argmax(np.bincount(cells, minlength=rows*4)))
        assert index not in owners, (name, 'two silhouettes in cell', index)
        assert len(xx) > 3500, (name, index, 'incomplete silhouette')
        x1, y1, x2, y2 = int(xx.min()), int(yy.min()), int(xx.max())+1, int(yy.max())+1
        part = pixels[y1:y2, x1:x2].copy()
        owned = labels[y1:y2, x1:x2] == ident
        # Retain source antialiasing immediately adjoining the opaque body.
        owned = ndimage.binary_dilation(owned, iterations=1) & ~fringe[y1:y2, x1:x2]
        part[~owned] = 0
        part[part[:, :, 3] == 0] = 0
        owners[index] = Image.fromarray(part), [x1,y1,x2-x1,y2-y1]
    assert len(owners) == rows*4
    return [owners[i] for i in range(rows*4)]


def anchor(image, airborne=False):
    mask = np.asarray(image)[:, :, 3] > 90
    h, w = mask.shape
    if airborne:
        ys, xs = np.nonzero(mask[int(h*.35):int(h*.58)])
    else:
        ys, xs = np.nonzero(mask[max(0,h-12):])
    return round((float(xs.min())+float(xs.max()))/2 if len(xs) else w/2, 5)


def profile(image, axis, scale):
    mask = np.asarray(image)[:, :, 3] > 90
    h, w = mask.shape
    result = []
    for top, bottom in [(0,.24),(.24,.68),(.68,1)]:
        y1, y2 = int(h*top), max(int(h*top)+1, int(h*bottom))
        yy, xx = np.nonzero(mask[y1:y2])
        if not len(xx): continue
        left, right = float(np.percentile(xx,2)), float(np.percentile(xx,98))+1
        result.append([round((left-axis)*scale,5),round((h-y1)*scale,5),round((right-left)*scale,5),round((y2-y1)*scale,5)])
    return result


def pack(items, path, scales, previous=None):
    width = 2048
    placements = []
    x = y = 3
    row_height = 0
    for atlas, index, pose, source_rect in items:
        if x+pose.width+3 > width:
            x, y, row_height = 3, y+row_height+6, 0
        placements.append([x,y,pose.width,pose.height])
        x += pose.width+6
        row_height = max(row_height,pose.height)
    sheet = Image.new('RGBA',(width,y+row_height+3))
    meta = {'atlases':{name:{'scale':scale,'frames':[]} for name,scale in scales.items()},'portrait':None}
    geometry = {name:[] for name in scales}
    for (atlas,index,pose,source_rect), rect in zip(items,placements):
        sheet.alpha_composite(pose,(rect[0],rect[1]))
        if atlas == 'portrait':
            meta['portrait'] = rect
            continue
        airborne = atlas == 'base' and index == 4 or atlas == 'combat' and index in [4,5,6,7]
        axis = anchor(pose,airborne)
        data = {'x':0,'y':0,'w':pose.width,'h':pose.height,'anchor':axis,'bottom':pose.height,'rect':rect}
        meta['atlases'][atlas]['frames'].append(data)
        geometry[atlas].append(profile(pose,axis,scales[atlas]))
    image_path = path.with_suffix('.webp')
    # A scale-only release keeps the authored bitmap byte-for-byte when the
    # newly assembled pixels match the original atlas.
    if previous and Image.open(previous).convert('RGBA').tobytes() == sheet.tobytes():
        image_path.write_bytes(previous.read_bytes())
    else:
        sheet.save(image_path,lossless=True,exact=True,method=6)
    assert Image.open(image_path).size == sheet.size, (image_path, 'invalid packed image')
    path.with_suffix('.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
    return meta, geometry


def main():
    sheets = {name:extract(name) for name in ['base','combat','strike']}
    walking = extract('walk',2)
    scale = round(BODY_HEIGHT/sheets['base'][0][0].height,8)
    portrait = Image.open(SOURCE/'portrait.png').convert('RGBA')
    head = portrait.resize((320,320),Image.Resampling.LANCZOS)
    head.save(RUNTIME/'adriano-head-menu-v1.webp',quality=95,method=6)
    items = [(name,i,pose,rect) for name,frames in sheets.items() for i,(pose,rect) in enumerate(frames)]
    items.append(('portrait',0,head.resize((80,81),Image.Resampling.LANCZOS),None))
    meta, geometry = pack(items,RUNTIME/f'adriano-v{VERSION}',{name:scale for name in sheets},RUNTIME/'adriano-v1.webp')
    walk_scale = round(BODY_HEIGHT/np.median([pose.height for pose,_ in walking]),8)
    motion, motion_geometry = pack([('motion',i,pose,rect) for i,(pose,rect) in enumerate(walking)],ROOT/f'assets/story/adriano-walk-v{VERSION}',{'motion':walk_scale},ROOT/'assets/story/adriano-walk-v1.webp')
    # The existing loader consumes a flat list with a scale on each walk frame.
    frames = motion['atlases']['motion']['frames']
    for frame in frames: frame['scale'] = walk_scale
    (ROOT/f'assets/story/adriano-walk-v{VERSION}.json').write_text(json.dumps(frames,separators=(',',':'))+'\n')
    geometry['motion'] = motion_geometry['motion']
    sockets = {}
    for atlas,frames in {**meta['atlases'],'motion':{'scale':walk_scale,'frames':frames}}.items():
        for i,frame in enumerate(frames['frames']):
            w,h,axis = frame['w'],frame['h'],frame['anchor']
            size = frame.get('scale',frames['scale'])
            hand_x = w*.92 if atlas == 'base' and i in [12,13] or atlas == 'strike' and i in [12,14] else w*.72
            sockets[f'{atlas}:{i}'] = {'anchor':axis,'hand':[round((hand_x-axis)*size,5),round(-h*.68*size,5)],'hurt':geometry[atlas][i]}
    (ROOT/'src/adriano-data.js').write_text(f'export const ADRIANO_BODY_SCALE={BODY_SCALE};\n'+'export const ADRIANO_HURT='+json.dumps(geometry,separators=(',',':'))+';\nexport const ADRIANO_STORY_GEOMETRY='+json.dumps(sockets,separators=(',',':'))+';\n')
    pose = sheets['base'][0][0]
    factor = min(216/pose.width,280/pose.height) * BODY_SCALE
    thumbnail = pose.resize((round(pose.width*factor),round(pose.height*factor)),Image.Resampling.LANCZOS)
    preview = Image.new('RGBA',(240,300))
    preview.alpha_composite(thumbnail,((240-thumbnail.width)//2,294-thumbnail.height))
    pixels=np.asarray(preview).copy();pixels[pixels[:, :, 3] == 0]=0
    Image.fromarray(pixels).save(RUNTIME/f'adriano-preview-v{VERSION}.webp',lossless=True,exact=True,method=6)
    board = Image.new('RGB',(1440,5*365),'#1c2836')
    draw = ImageDraw.Draw(board)
    all_frames = [(name,i,p) for name,poses in sheets.items() for i,(p,_) in enumerate(poses)] + [('motion',i,p) for i,(p,_) in enumerate(walking)]
    for n,(name,i,p) in enumerate(all_frames):
        visual_scale = (walk_scale if name == 'motion' else scale)*.44
        tile = p.resize((round(p.width*visual_scale),round(p.height*visual_scale)),Image.Resampling.LANCZOS)
        x, y = n%12*120, n//12*365
        board.paste(tile,(x+(120-tile.width)//2,y+325-tile.height),tile)
        draw.text((x+5,y+340),f'{name}:{i}',fill='white')
    output = ROOT/'docs/adriano-review'; output.mkdir(exist_ok=True)
    board.save(output/'poses.webp',quality=94)
    proof = {'character':'adriano','poses':56,'bodyScale':BODY_SCALE,'bodyHeight':BODY_HEIGHT,'baseScale':scale,'walkScale':walk_scale,'sources':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in SOURCE.glob('*.png')},'sourceRects':{name:[rect for _,rect in poses] for name,poses in sheets.items()},'existingCharacterAssetsChanged':False}
    (output/'packing.json').write_text(json.dumps(proof,indent=2)+'\n')
    print(json.dumps(proof,ensure_ascii=False))


if __name__ == '__main__': main()
