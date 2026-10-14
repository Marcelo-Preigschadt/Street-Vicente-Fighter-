"""Pack the pilot's additional authored poses; never repaint existing sprites.

Source cells 1,3,5,6 and 9,11,13,14 supply preparation and recovery only.
The approved chamber/contact drawings, attack timings and body scale are kept.
This structural check does not certify identity or temporal animation quality.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/adriano/transitions-v1.png'
STEM = ROOT / 'assets/runtime/adriano-transitions-v1'
CELLS = [1, 3, 5, 6, 9, 11, 13, 14]


def main():
    image = Image.open(SOURCE).convert('RGBA')
    assert image.width == image.height, 'Source must be square; inspect clipped rows'
    pixels = np.asarray(image)
    r,g,b = [pixels[:,:,i].astype(float) for i in range(3)]
    # The same generated matte residue excluded by the original Adriano packer.
    fringe = ((r>140)&(r>g*2.5)&(r>b*2.5)) | ((r>180)&(g>170)&(abs(r-g)<50)&(b<75))
    mask = (pixels[:, :, 3] > 90) & ~fringe
    labels, _ = ndimage.label(mask, np.ones((3, 3), bool))
    sizes = np.bincount(labels.ravel())
    owners = {}
    for ident in np.argsort(sizes[1:])[-16:] + 1:
        yy, xx = np.nonzero(labels == ident)
        cell = np.minimum(3, yy*4//image.height)*4 + np.minimum(3, xx*4//image.width)
        index = int(np.argmax(np.bincount(cell, minlength=16)))
        assert index not in owners and len(xx) > 3500, (index, 'incomplete or merged silhouette')
        assert xx.min() > 1 and yy.min() > 1 and xx.max() < image.width-2 and yy.max() < image.height-2, (index, 'clipped source')
        rect = [int(xx.min()), int(yy.min()), int(xx.max()-xx.min()+1), int(yy.max()-yy.min()+1)]
        x, y, w, h = rect
        part = pixels[y:y+h, x:x+w].copy()
        owned = ndimage.binary_dilation(labels[y:y+h, x:x+w] == ident, iterations=1) & ~fringe[y:y+h,x:x+w]
        part[~owned] = 0
        part[part[:, :, 3] == 0] = 0
        owners[index] = (Image.fromarray(part), rect)
    assert len(owners) == 16
    # One common scale preserves changes in stance and knee bend. Never stretch
    # individual limbs or normalize each pose by its varying bounding height.
    scale = round(264 / np.median([owners[i][0].height for i in [0,7,8,15]]), 8)
    width = 2048
    x = y = 3
    row = 0
    placements = []
    for cell in CELLS:
        pose, rect = owners[cell]
        if x+pose.width+3 > width:
            x, y, row = 3, y+row+6, 0
        placements.append([x,y,pose.width,pose.height])
        x += pose.width+6
        row = max(row,pose.height)
    packed = Image.new('RGBA',(width,y+row+3))
    frames, geometry = [], {}
    sha = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    for index, (cell, dest) in enumerate(zip(CELLS,placements)):
        pose, source = owners[cell]
        packed.alpha_composite(pose,tuple(dest[:2]))
        alpha = np.asarray(pose)[:,:,3] > 90
        h,w = alpha.shape
        _, feet = np.nonzero(alpha[max(0,h-12):])
        axis = float(feet.min()+feet.max())/2
        frame = dict(x=0,y=0,w=w,h=h,anchor=axis,bottom=h,rect=dest,
                     source=dict(sha256=sha,cell=cell,rect=source))
        frames.append(frame)
        hurt = []
        for top,bottom in [(0,.24),(.24,.68),(.68,1)]:
            a,b = int(h*top),max(int(h*top)+1,int(h*bottom))
            yy,xx = np.nonzero(alpha[a:b])
            assert len(xx)
            left,right = np.percentile(xx,2),np.percentile(xx,98)+1
            hurt.append([round((left-axis)*scale,5),round((h-a)*scale,5),round((right-left)*scale,5),round((b-a)*scale,5)])
        geometry[f'transition:{index}'] = dict(anchor=axis,hand=[round((w*.72-axis)*scale,5),round(-h*.68*scale,5)],hurt=hurt)
    packed.save(STEM.with_suffix('.webp'),lossless=True,exact=True,method=6)
    STEM.with_suffix('.json').write_text(json.dumps(dict(scale=scale,frames=frames),separators=(',',':'))+'\n')
    (ROOT/'src/adriano-transition-data.js').write_text('// Generated from additional drawings by scripts/pack-adriano-transitions.py.\nexport const ADRIANO_TRANSITION_GEOMETRY='+json.dumps(geometry,separators=(',',':'))+';\n')
    output = ROOT/'docs/adriano-transitions'
    output.mkdir(exist_ok=True)
    board = Image.new('RGB',(1280,700),'#182633')
    draw = ImageDraw.Draw(board)
    for i,cell in enumerate(CELLS):
        pose,_ = owners[cell]
        thumb = pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.LANCZOS)
        px,py = i%4*320, i//4*350
        board.paste(thumb,(px+(320-thumb.width)//2,py+310-thumb.height),thumb)
        draw.text((px+12,py+326),f'{"punch" if i<4 else "kick"} transition:{i} / source:{cell}',fill='white')
    board.save(output/'new-poses.webp',quality=94)
    proof = dict(source='assets/source/adriano/transitions-v1.png',sha256=sha,
                 sourcePoses=16,additionalPosesUsed=8,cells=CELLS,scale=scale,
                 existingBitmapsModified=False,existingContactFramesModified=False)
    (output/'packing.json').write_text(json.dumps(proof,indent=2)+'\n')
    print(json.dumps(proof))


if __name__ == '__main__':
    main()
