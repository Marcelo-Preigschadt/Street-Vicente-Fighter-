"""Extract isolated atlas components; no runtime alpha scanning."""
from PIL import Image
import numpy as np
from scipy.ndimage import label,find_objects,binary_dilation
from pathlib import Path
import json,sys
im=Image.open(sys.argv[1]).convert('RGBA');a=np.array(im);lab,n=label(a[:,:,3]>128);pieces=[]
for i,s in enumerate(find_objects(lab)):
 if s is None or (lab[s]==i+1).sum()<500:continue
 pieces.append((i+1,s))
if len(pieces)!=8:raise ValueError(f'Expected 8 isolated objects, got {len(pieces)}')
pieces.sort(key=lambda z:(z[1][0].start>im.height//2,z[1][1].start))
metadata={}
for (id,s),(name,height) in zip(pieces,[('table',115),('chair',120),('soda',250),('shelf',310),('tank',160),('cabinet',260),('medkit',42),('can',34)]):
 mask=binary_dilation(lab==id,iterations=1);ys,xs=np.where(mask);x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
 crop=a[y0:y1,x0:x1].copy();crop[:,:,3]=np.where(mask[y0:y1,x0:x1],np.minimum(255,crop[:,:,3].astype(float)*255/253),0).astype('uint8')
 path=Path(f'assets/story/{name}-prop-v3.webp');Image.fromarray(crop).save(path,quality=94,method=6)
 metadata[name]={'height':height,'width':round(height*crop.shape[1]/crop.shape[0],2),'file':str(path)}
Path('assets/story/props-v3.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(metadata)
