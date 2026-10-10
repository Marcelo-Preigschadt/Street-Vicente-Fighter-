"""Reproducible, non-destructive preparation of painted animation resources.

Sources remain untouched. Scale is per clip, not per bounding-box height.
Detached components need spatial ownership; a largest-component rule alone is
not used to certify the anatomy. Human review is recorded in the audit report.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage
from sprite_geometry import landmarks
from painted_walk_extraction import extract_walk_frames

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / 'assets/runtime'
SOURCE = ROOT / 'assets/source'
IDS = ['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan','tais','luciana','khauany','dienes']
WALK_HURT = {}
MOTION_GEOMETRY = {}

def owned(image):
    a = np.array(image.convert('RGBA'))
    lab, n = ndimage.label(a[:,:,3] > 80, np.ones((3,3)))
    sizes = np.bincount(lab.ravel()); sizes[0] = 0
    main = lab == sizes.argmax()
    # Preserve nearby antialiasing, hair wisps and garment fragments, but exclude
    # distant pieces of another figure. Explicit bounds in generated sources
    # are reviewed separately; this operates on already isolated walk frames.
    distance = ndimage.distance_transform_edt(~main)
    keep = main.copy()
    for k in range(1,n+1):
        component = lab == k
        if sizes[k] > 3 and np.min(distance[component]) < 7:
            keep |= component
    keep = ndimage.binary_dilation(keep, iterations=1)
    a[~keep] = 0
    return Image.fromarray(a)

def bands(im, anchor, bottom, scale):
    a = np.array(im)[:,:,3]
    result = []
    cuts = [0,round(im.height*.25),round(im.height*.62),im.height]
    for top, end in zip(cuts,cuts[1:]):
        yy, xx = np.nonzero(a[top:end] > 100)
        if len(xx):
            result.append([round((xx.min()-anchor)*scale,3),round((bottom-top-yy.min())*scale,3),round((xx.max()-xx.min()+1)*scale,3),round((yy.max()-yy.min()+1)*scale,3)])
    return result


def pack(path, atlases, portrait=None):
    meta={'schemaVersion':2,'atlases':{},'portrait':None,'sourcePreserved':True}
    x=y=3; row=0; items=[]
    for atlas,frames in atlases.items():
        profiles=[]
        for im,profile in frames:
            if x+im.width+3>2048:x=3;y+=row+3;row=0
            rect=[x,y,im.width,im.height]
            profiles.append({**profile,'rect':rect,'w':im.width,'h':im.height})
            items.append((im,rect));x+=im.width+3;row=max(row,im.height)
        meta['atlases'][atlas]={'scale':1,'frames':profiles}
    if portrait:
        im=portrait
        if x+im.width+3>2048:x=3;y+=row+3;row=0
        meta['portrait']=[x,y,im.width,im.height];items.append((im,meta['portrait']));row=max(row,im.height)
    out=Image.new('RGBA',(2048,y+row+3))
    for im,rect in items:out.alpha_composite(im,(rect[0],rect[1]))
    temporary=path.with_suffix('.tmp.webp')
    out.save(temporary,lossless=True,method=6)
    assert temporary.stat().st_size>1000
    with Image.open(temporary) as verified:verified.verify()
    temporary.replace(path.with_suffix('.webp'))
    temporary=path.with_suffix('.tmp.json');temporary.write_text(json.dumps(meta,separators=(',',':'))+'\n');temporary.replace(path.with_suffix('.json'))
    return meta

def existing(id):
    version=2 if id in ['tais','dienes'] else 1
    meta=json.loads((RUNTIME/f'{id}-v{version}.json').read_text());image=Image.open(RUNTIME/f'{id}-v{version}.webp').convert('RGBA')
    atlas={}
    for name,sheet in meta['atlases'].items():
        atlas[name]=[]
        for f in sheet['frames']:
            x,y,w,h=f['rect'];profile={**f,'scale':f.get('scale',sheet['scale'])};profile.pop('rect')
            atlas[name].append((image.crop((x,y,x+w,y+h)),profile))
    x,y,w,h=meta['portrait']
    return atlas,image.crop((x,y,x+w,y+h))

def generated(id):
    image=Image.open(SOURCE/f'{id}-repairs-v1.png').convert('RGBA');a=np.array(image)
    labels,n=ndimage.label(a[:,:,3]>120,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());objects=ndimage.find_objects(labels)
    groups=[(k,o) for k,o in enumerate(objects,1) if o and sizes[k]>12000]
    rows=[sorted([g for g in groups if (g[1][0].start+g[1][0].stop)/2<image.height/2],key=lambda g:g[1][1].start),
          sorted([g for g in groups if (g[1][0].start+g[1][0].stop)/2>=image.height/2],key=lambda g:g[1][1].start)]
    assert [len(r) for r in rows]==[4,4],(id,'invalid source layout')
    result=[]
    for ident,o in rows[0]+rows[1]:
        x0,x1=o[1].start,o[1].stop;y0,y1=o[0].start,o[0].stop
        tile=a[y0:y1,x0:x1].copy();mask=ndimage.binary_dilation(labels[y0:y1,x0:x1]==ident,iterations=1);tile[~mask]=0
        im=Image.fromarray(tile);anchor=landmarks(im,im.width*.45)[0][0]
        # A fixed scale for the entire generated clip preserves head/body size.
        scale=.60 if id=='dienes' else .61
        profile=dict(x=0,y=0,anchor=round(anchor,3),bottom=im.height,scale=scale,source=f'assets/source/{id}-repairs-v1.png',sourceBounds=[x0,y0,x1-x0,y1-y0])
        if id=='khauany' and len(result)>=4:
            # Aerial poses pivot around the same combat root, not around the
            # cropped tucked boot. Contact annotation comes from visual review.
            profile['bottom']=im.height+67
            profile['anchor']=im.width*.30
            if len(result)==6:
                profile.update(anchor=154,bottom=430,contact={'source':[508,189],'move':'airKick','game':[216,147]})
        result.append((im,profile))
    return result

for id in IDS:
    atlases,_=existing(id)
    for name in ['base','style','reaction']:
        if name not in atlases: continue
        geometry=[]
        for im,p in atlases[name][:4]:
            axis=p['anchor']-p.get('x',0); scale=p['scale']
            points=landmarks(im,axis)
            geometry.append(dict(points=[[(x-axis)*scale,(y-im.height)*scale] for x,y in points],headBottom=(im.height*.245-im.height)*scale))
        MOTION_GEOMETRY[f'{id}:{name}']=geometry
    direct_walk_source = id in ['luciana','khauany','dienes']
    if direct_walk_source:
        # The raw strips use irregular spacing and touching contours. Reusing
        # the old rectangular walk-v2 crops truncates a glove and retains the
        # adjacent figure's sneakers; extract owned source pixels instead.
        originals=extract_walk_frames(SOURCE/f'{id}-walk-v2.png')
    elif id in ['marcelo','rafael','gustavo']:
        originals=atlases['motion'][:8]
    else:
        v=4 if id=='tais' else 2 if id in ['luciana','khauany','dienes'] else 3
        stem=ROOT/f'assets/story/{id}-walk-v{v}'
        meta=json.loads(stem.with_suffix('.json').read_text());sheet=Image.open(stem.with_suffix('.webp')).convert('RGBA')
        originals=[]
        for f in meta:
            x,y,w,h=f['rect'];originals.append((sheet.crop((x,y,x+w,y+h)),f))
    frames=[];target_height=atlases['base'][0][0].height*atlases['base'][0][1]['scale']
    images=[im if direct_walk_source else owned(im) for im,_ in originals]
    if id=='tais':
        # The two rows of the approved v4 sheet were painted at different
        # source sizes. Preserve the old anatomy calibration before applying
        # one scale to the clip; do not normalize by each pose's bbox height.
        approved_scale=float(np.median([old['scale'] for _,old in originals]))
        calibrated=[]; profiles=[]
        for index,(im,(_,old)) in enumerate(zip(images,originals)):
            factor=old['scale']/approved_scale
            width=max(1,round(im.width*factor));height=max(1,round(im.height*factor))
            calibrated.append(im.resize((width,height),Image.Resampling.LANCZOS))
            profiles.append(dict(old,anchor=old['anchor']*factor,
                x=old.get('x',0)*factor,y=old.get('y',0)*factor,
                bottom=old['bottom']*factor,
                sourceCalibration=dict(file='assets/story/tais-walk-v4.webp',
                    frame=index,approvedScale=old['scale'],pixelFactor=factor,
                    sourceSize=[im.width,im.height])))
        images=calibrated;originals=list(zip(images,profiles))
    scale=target_height/float(np.median([im.height for im in images]))
    for index,(im,old) in enumerate(zip(images,[f for _,f in originals])):
        anchor=old['anchor']-old.get('x',0)
        points=landmarks(im,anchor)
        provenance={k:old[k] for k in ['source','sourceBounds','extraction',
            'seedErosion','sourceVisiblePixels','sourceCalibration'] if k in old}
        frames.append((im,dict(x=0,y=0,anchor=anchor,bottom=im.height,scale=round(scale,8),landmarks=points,headBottom=im.height*.245,footContacts=[points[6],points[10]],sourceFrame=index,**provenance)))
    meta=pack(ROOT/f'assets/story/{id}-walk-v5',{'walk':frames})
    MOTION_GEOMETRY[f'{id}:motion']=[dict(points=[[(x-p['anchor'])*p['scale'],(y-p['bottom'])*p['scale']] for x,y in p['landmarks']],headBottom=(p['headBottom']-p['bottom'])*p['scale']) for im,p in frames]
    WALK_HURT[id]=[bands(im,p['anchor'],p['bottom'],p['scale']) for im,p in frames]
    print(id,'walk:',len(frames),'uniform scale',round(scale,4))

for id in ['khauany','dienes']:
    atlases,portrait=existing(id);new=generated(id)
    if id=='khauany':
        atlases['sweep']=new[:4];atlases['airkick']=new[4:]
        atlases['combat'][14]=new[2];atlases['combat'][3]=new[6]
        version=2
    else:
        # damage[3] returns to guard. Its generated painting reaches the PNG
        # edge and truncates a toe, so use the complete approved base guard.
        guard,guard_profile=atlases['base'][0]
        new[3]=(guard.copy(),dict(guard_profile,
            source='assets/runtime/dienes-v2.webp',sourceAtlas='base',sourceFrame=0,
            recoveryFrom=dict(file='assets/runtime/dienes-v2.webp',atlas='base',frame=0)))
        atlases['damage']=new[:4];atlases['win']=new[4:6];atlases['getup']=new[6:]
        atlases['base'][11]=new[1];atlases['base'][14]=new[4]
        version=3
    pack(RUNTIME/f'{id}-v{version}',atlases,portrait)
    for name,frames in atlases.items():
        if name not in ['base','combat']:
            WALK_HURT[f'{id}:{name}']=[bands(im,p['anchor'],p['bottom'],p['scale']) for im,p in frames]
    for name,index in [('base',11),('base',14)] if id=='dienes' else [('combat',3),('combat',14)]:
        im,p=atlases[name][index];WALK_HURT[f'{id}:{name}:{index}']=bands(im,p['anchor'],p['bottom'],p['scale'])
    print(id,'runtime v',version,'preserved portrait and all other painted frames')

(ROOT/'src/painted-hurt-data.js').write_text('// Measured from prepared full-body drawings; generated by prepare-roster-animation.py.\nexport const PAINTED_HURT='+json.dumps(WALK_HURT,separators=(',',':'))+';\n')
(ROOT/'src/painted-motion-data.js').write_text('// Source landmarks in game units. Rebuild with prepare-roster-animation.py.\nexport const PAINTED_MOTION='+json.dumps(MOTION_GEOMETRY,separators=(',',':'))+';\n')
