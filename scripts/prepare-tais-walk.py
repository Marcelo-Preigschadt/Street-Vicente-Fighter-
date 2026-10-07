from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np,json
meta=json.load(open('assets/story/tais-walk-v3.json'));im=Image.open('assets/story/tais-walk-v3.webp').convert('RGBA');anchors=[];hurt=[]
for f in meta:
 x,y,w,h=f['rect'];p=np.asarray(im.crop((x,y,x+w,y+h)));skin=(p[:,:,0]>p[:,:,1]*1.1)&(p[:,:,1]>p[:,:,2]*1.15)&(p[:,:,0]>105)&(p[:,:,3]>128);skin[round(h*.52):]=False
 labels,n=ndimage.label(skin);sizes=np.bincount(labels.ravel());sizes[0]=0;ys,xs=ndimage.find_objects(labels)[sizes.argmax()-1];hh=62/f['scale'];anchors.append(dict(x=round((xs.start+xs.stop)/2,2),y=round(max(0,ys.start-24/f['scale'])+hh,2),w=round(hh*.749,2),h=round(hh,2)))
 bands=[];cuts=[0,round(h*.24),round(h*.62),h]
 for top,bottom in zip(cuts,cuts[1:]):
  b=Image.fromarray(p).getchannel('A').crop((0,top,w,bottom)).point(lambda a:255 if a>64 else 0).getbbox()
  if b:bands.append([round((b[0]-f['anchor'])*f['scale'],2),round((h-top-b[1])*f['scale'],2),round((b[2]-b[0])*f['scale'],2),round((b[3]-b[1])*f['scale'],2)])
 hurt.append(bands)
Path('assets/story/tais-walk-head-anchors-v1.json').write_text(json.dumps(anchors,separators=(',',':')))
Path('src/savate-walk-data.js').write_text('export const SAVATE_WALK_HURT='+json.dumps(hurt,separators=(',',':'))+';\n')
