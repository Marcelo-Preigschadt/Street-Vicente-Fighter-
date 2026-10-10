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

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / 'assets/runtime'
SOURCE = ROOT / 'assets/source'
IDS = ['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan','tais','luciana','khauany','dienes']
WALK_HURT = {}
MOTION_GEOMETRY = {}

def owned(image, left_boundary=0):
    a = np.array(image.convert('RGBA'))
    # A neighboring shoe touches Luciana's heel in source walk frame 4.
    # Spatial ownership must precede connected-component analysis: connectivity
    # alone cannot distinguish that shoe from this character's complete heel.
    a[:, :left_boundary] = 0
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
            # Transparent borders are part of the frame. Preserve its world
            # pivot so extended limbs and antialiasing keep their exact place.
            padded=Image.new('RGBA',(im.width+6,im.height+6));padded.alpha_composite(im,(3,3));im=padded
            profile={**profile,'x':profile.get('x',0)-3,'y':profile.get('y',0)-3}
            if 'landmarks' in profile:profile['landmarks']=[[px+3,py+3] for px,py in profile['landmarks']]
            if 'footContacts' in profile:profile['footContacts']=[[px+3,py+3] for px,py in profile['footContacts']]
            if 'headBottom' in profile:profile['headBottom']+=3
            if 'contact' in profile:profile['contact']={**profile['contact'],'source':[n+3 for n in profile['contact']['source']]}
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
        x0,x1=max(0,o[1].start-2),min(image.width,o[1].stop+2);y0,y1=max(0,o[0].start-2),min(image.height,o[0].stop+2)
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
                profile.update(anchor=154,bottom=430,contact={'source':[510,191],'move':'airKick','game':[217.16,145.79]})
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
    if id in ['marcelo','rafael','gustavo']:
        originals=atlases['motion'][:8]
    else:
        v=4 if id=='tais' else 2 if id in ['luciana','khauany','dienes'] else 3
        stem=ROOT/f'assets/story/{id}-walk-v{v}'
        meta=json.loads(stem.with_suffix('.json').read_text());sheet=Image.open(stem.with_suffix('.webp')).convert('RGBA')
        originals=[]
        for f in meta:
            x,y,w,h=f['rect'];originals.append((sheet.crop((x,y,x+w,y+h)),f))
    frames=[];target_height=atlases['base'][0][0].height*atlases['base'][0][1]['scale']
    images=[owned(im, 20 if id=='luciana' and index==4 else 0)
            for index,(im,_) in enumerate(originals)]
    scale=target_height/float(np.median([im.height for im in images]))
    for index,(im,old) in enumerate(zip(images,[f for _,f in originals])):
        anchor=old['anchor']-old.get('x',0)
        points=landmarks(im,anchor)
        profile=dict(x=0,y=0,anchor=anchor,bottom=im.height,scale=round(scale,8),landmarks=points,headBottom=im.height*.245,footContacts=[points[6],points[10]],sourceFrame=index)
        if id=='luciana' and index==4:
            profile['sourceOwnershipBounds']=[20,0,im.width-20,im.height]
        frames.append((im,profile))
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
