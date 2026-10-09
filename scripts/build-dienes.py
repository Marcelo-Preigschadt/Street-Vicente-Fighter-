"""Isolate Dienes' painted poses, excluding generation-edge artifacts."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'; RUNTIME=ASSETS/'runtime'
SOURCES={'base':ROOT.parent/'generated_images/exec-46639f01-b461-4ccc-b6bb-653e4fa103d9.png',
         'combat':ROOT.parent/'generated_images/exec-d562afe6-4095-4111-a09a-ca9dfcf36f18.png'}
PORTRAIT=ROOT.parent/'generated_images/exec-6607a02d-557f-4939-8f69-0b99130fa9ab.png'

def isolate(path):
    raw=np.asarray(Image.open(path).convert('RGBA')).copy()
    # Bright red model-edge noise is distinct from the garment's magenta/pink.
    artifact=(raw[:,:,0]>150)&(raw[:,:,1]<100)&(raw[:,:,2]<90)
    mask=(raw[:,:,3]>110)&~artifact
    labels,_=ndimage.label(mask,np.ones((3,3),bool))
    sizes=np.bincount(labels.ravel())
    groups=[]
    for i in range(1,len(sizes)):
        if sizes[i]<7000:continue
        yy,xx=np.nonzero(labels==i)
        groups.append((int(i),int(sizes[i]),int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())))
    return raw,labels,groups

def cut(raw,labels,group,top=None,bottom=None):
    ident,_,x1,y1,x2,y2=group
    if top is not None:y1=max(y1,top)
    if bottom is not None:y2=min(y2,bottom)
    selected=labels[y1:y2+1,x1:x2+1]==ident
    selected=ndimage.binary_dilation(selected,iterations=1)
    part=raw[y1:y2+1,x1:x2+1].copy()
    part[~selected]=0
    yy,xx=np.nonzero(part[:,:,3]>110)
    if len(xx)<3000:raise ValueError('Incomplete pose '+str(ident))
    return Image.fromarray(part[yy.min():yy.max()+1,xx.min():xx.max()+1], 'RGBA')

base_raw,base_labels,bg=isolate(SOURCES['base'])
combat_raw,combat_labels,cg=isolate(SOURCES['combat'])
assert len(cg)==16,('combat components',len(cg))
def ordered(groups):
    result=[[] for _ in range(4)]
    for g in groups:
        col=min(3,int((g[2]+g[4])/2*4/1347))
        result[col].append(g)
    if any(len(x)!=4 for x in result):raise ValueError('Grid cannot be isolated '+str([len(x) for x in result]))
    layout=[[None]*4 for _ in range(4)]
    for col,items in enumerate(result):
        for row,g in enumerate(sorted(items,key=lambda t:t[3])):layout[row][col]=g
    return [g for row in layout for g in row]

combat=[cut(combat_raw,combat_labels,g) for g in ordered(cg)]
# The third row of the first painting meets the bottom row at two high kicks.
# Use matching independent poses from the combat painting for those two cells.
base_indices=[1,4,2,3,30,36,31,34,51,None,None,50,74,None,None,104]
by_id={g[0]:g for g in bg}
base=[]
for i,ident in enumerate(base_indices):
    if ident is None:
        base.append(combat[{9:2,10:5,13:13,14:14}[i]].copy())
    else:base.append(cut(base_raw,base_labels,by_id[ident]))

for key,path in SOURCES.items():
    Image.open(path).save(ASSETS/f'dienes-{key}-v1.webp',quality=89,method=6)
portrait=Image.open(PORTRAIT).convert('RGBA')
portrait.save(ASSETS/'dienes-portrait-v1.webp',quality=91,method=6)
# Crop to head and shoulders so the face remains legible in the roster.
head=portrait.crop((180,50,1000,890)).resize((320,320),Image.Resampling.LANCZOS)
head.save(RUNTIME/'dienes-head-menu-v1.webp',quality=90,method=6)
preview=Image.new('RGBA',(240,300))
pose=base[0];factor=min(216/pose.width,280/pose.height)
size=(round(pose.width*factor),round(pose.height*factor))
preview.alpha_composite(pose.resize(size,Image.Resampling.LANCZOS),((240-size[0])//2,294-size[1]))
preview.save(RUNTIME/'dienes-preview-v1.webp',quality=90,method=6)

items=[('base',f) for f in base]+[('combat',f) for f in combat]
items.append(('portrait',head.resize((80,81),Image.Resampling.LANCZOS)))
positions=[];x=y=2;row_height=0
for _,frame in items:
    if x+frame.width+2>2048:x,y,row_height=2,y+row_height+2,0
    positions.append([x,y,frame.width,frame.height]);x+=frame.width+2;row_height=max(row_height,frame.height)
packed=Image.new('RGBA',(2048,y+row_height+2))
meta={'atlases':{key:{'scale':round(300/frames[0].height,5),'frames':[]} for key,frames in [('base',base),('combat',combat)]},'portrait':None}
for (atlas,frame),rect in zip(items,positions):
    packed.alpha_composite(frame,(rect[0],rect[1]))
    if atlas=='portrait':meta['portrait']=rect;continue
    w,h=frame.size
    meta['atlases'][atlas]['frames'].append({'x':0,'y':0,'w':w,'h':h,'anchor':round(w*.5,2),'bottom':h,'rect':rect})
packed.save(RUNTIME/'dienes-v1.webp',quality=88,method=6)
(RUNTIME/'dienes-v1.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
print('Dienes:',packed.size,'32 complete alpha poses; base scale',meta['atlases']['base']['scale'])
