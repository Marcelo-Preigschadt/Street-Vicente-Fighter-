"""Pack generated 4x4 frames; keep one world scale per character, including falls."""
from PIL import Image
from pathlib import Path
import numpy as np,json,sys
from scipy.ndimage import label,binary_dilation
paths=json.load(open(sys.argv[1]));heights={'lab':285,'elite':285,'kungfu':290,'inspector':285};metadata={}
for name,path in paths.items():
 im=Image.open(path).convert('RGBA');a=np.array(im);frames=[];pieces=[];origins=[]
 for i in range(16):
  x0=round(i%4*im.width/4);x1=round((i%4+1)*im.width/4);y0=round(i//4*im.height/4);y1=round((i//4+1)*im.height/4)
  tile=a[y0:y1,x0:x1].copy();tile[:2,:,3]=0;tile[-2:,:,3]=0;tile[:,:2,3]=0;tile[:,-2:,3]=0;components,n=label(tile[:,:,3]>100);counts=np.bincount(components.ravel());counts[0]=0
  mask=binary_dilation(components==counts.argmax(),iterations=1);ys,xs=np.where(mask);l,r,t,b=xs.min(),xs.max()+1,ys.min(),ys.max()+1
  crop=tile[t:b,l:r].copy();crop[:,:,3]=np.where(mask[t:b,l:r],crop[:,:,3],0);pieces.append(crop)
  # Pelvis anchors track the body, not an extended weapon or leading foot.
  centers=[]
  if i<13:
   for y in range(t+round((b-t)*.5),t+round((b-t)*.62)):
    xx=np.where(mask[y])[0]
    if len(xx):centers.append((xx.min()+xx.max())/2)
  origins.append(float(np.median(centers))-l if centers else crop.shape[1]/2)
 scale=heights[name]/np.median([piece.shape[0] for piece in pieces[:9]])
 out=Image.new('RGBA',(sum(c.shape[1]+6 for c in pieces),max(c.shape[0] for c in pieces)+4));x=3
 for i,crop in enumerate(pieces):
  h,w=crop.shape[:2];out.paste(Image.fromarray(crop),(x,2));frames.append({'rect':[x,2,w,h],'height':h,'anchorX':round(origins[i],2),'bottom':h});x+=w+6
 file=f'assets/story/{name}-animation-v4.webp';out.save(file,quality=93,method=6)
 metadata[name]={'file':file,'scale':round(scale,6),'frames':frames};print(name,'height',heights[name],'standing range',*[round(c.shape[0]*scale) for c in pieces[:9]])
Path('assets/story/enemy-animation-v4.json').write_text(json.dumps(metadata,indent=2)+'\n')
