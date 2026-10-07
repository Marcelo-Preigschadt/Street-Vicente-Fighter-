"""Prepare eight full-body locomotion frames, with fixed pelvis/ground anchors."""
from PIL import Image
import numpy as np
from scipy.ndimage import label,find_objects,binary_dilation
from pathlib import Path
import json,sys
paths=json.load(open(sys.argv[1]))
for id,path in paths.items():
 im=Image.open(path).convert('RGBA');a=np.array(im);pieces=[]
 # The generated sheet uses a strict 4 x 2 grid.
 for row in range(2):
  for col in range(4):
   x0=round(col*im.width/4);x1=round((col+1)*im.width/4);y0=round(row*im.height/2);y1=round((row+1)*im.height/2)
   tile=a[y0:y1,x0:x1].copy();lab,n=label(tile[:,:,3]>128);sizes=np.bincount(lab.ravel());sizes[0]=0;main=int(sizes.argmax());mask=binary_dilation(lab==main,iterations=1);ys,xs=np.where(mask);l,r,t,b=xs.min(),xs.max()+1,ys.min(),ys.max()+1
   crop=tile[t:b,l:r].copy();crop[:,:,3]=np.where(mask[t:b,l:r],crop[:,:,3],0)
   pieces.append(crop)
 original=json.load(open(f'assets/runtime/{id}-v1.json'))['atlases']['base']['frames'][0];height=original['h']*original['scale'];scale=height/np.median([c.shape[0] for c in pieces]);frames=[];width=sum(c.shape[1]+4 for c in pieces);out=Image.new('RGBA',(width,max(c.shape[0] for c in pieces)+4));x=2
 for crop in pieces:
  h,w=crop.shape[:2];centers=[]
  for y in range(round(h*.55),round(h*.64)):
   xs=np.where(crop[y,:,3]>140)[0]
   if len(xs):centers.append((xs.min()+xs.max())/2)
  anchor=float(np.mean(centers));out.paste(Image.fromarray(crop),(x,2));frames.append({'rect':[x,2,w,h],'x':0,'y':0,'w':w,'h':h,'anchor':round(anchor,2),'bottom':h,'scale':round(scale,6)});x+=w+4
 out.save(f'assets/story/{id}-walk-v3.webp',quality=94,method=6);Path(f'assets/story/{id}-walk-v3.json').write_text(json.dumps(frames,indent=2)+'\n');print(id,round(height,1),[round(c.shape[0]*scale,1) for c in pieces],flush=True)
