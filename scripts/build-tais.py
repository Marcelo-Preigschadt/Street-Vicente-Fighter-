"""Pack original generated Savate poses; one anatomical scale, alpha-based hurtboxes."""
from pathlib import Path
from PIL import Image
import json,sys
import numpy as np
from scipy import ndimage
from ruan_crop import extract_frames
root=Path('assets/runtime');root.mkdir(exist_ok=True)
metadata={'atlases':{},'portrait':None};hurt={};images={};faces={};packed=Image.new('RGBA',(2048,2048));x=y=2;row_h=0
anchors={'base':[.5,.5,.5,.5,.5,.5,.45,.32,.45,.28,.5,.5,.5,.3,.5,.5],'combat':[.5,.32,.5,.35,.5,.32,.5,.3,.5,.5,.5,.35,.5,.5,.4,.5]}
# Measured head heights (crown to chin), never total pose heights.
heads={'base':[52,52,52,52,52,52,52,52,52,52,52,52,52,52,52,52], 'combat':[52]*16}
for atlas,path in zip(['base','combat'],sys.argv[1:3]):
 im=Image.open(path).convert('RGBA');images[atlas]=[];hurt[atlas]=[];faces[atlas]=[];profiles=[]
 for i,(f,_) in enumerate(extract_frames(im)):
  images[atlas].append(f);w,h=f.size
  pixels=np.asarray(f);skin=(pixels[:,:,0]>pixels[:,:,1]*1.1)&(pixels[:,:,1]>pixels[:,:,2]*1.15)&(pixels[:,:,0]>105)&(pixels[:,:,3]>128)
  if not (atlas=='base' and i==15):skin[round(h*.52):]=False
  labels,n=ndimage.label(skin);sizes=np.bincount(labels.ravel());sizes[0]=0;winner=sizes.argmax();ys,xs=ndimage.find_objects(labels)[winner-1]
  fh=ys.stop-ys.start;hh=62;head_top=max(0,ys.start-24);angle=0
  if atlas=='base' and i==15:hh=62;angle=1.57079632679
  faces[atlas].append(dict(x=round((xs.start+xs.stop)/2,2),y=round(head_top+hh,2),w=round(hh*.749,2),h=round(hh,2),angle=angle))
  scale=52/heads[atlas][i];anchor=w*anchors[atlas][i]
  if x+w+2>2048:x=2;y+=row_h+2;row_h=0
  if y+h+2>packed.height:
   grown=Image.new('RGBA',(2048,packed.height*2));grown.alpha_composite(packed);packed=grown
  packed.alpha_composite(f,(x,y));profiles.append(dict(x=0,y=0,w=w,h=h,anchor=anchor,bottom=h,scale=scale,rect=[x,y,w,h]));x+=w+2;row_h=max(row_h,h)
  bands=[];cuts=[0,round(h*.24),round(h*.62),h]
  for top,bottom in zip(cuts,cuts[1:]):
   b=f.getchannel('A').crop((0,top,w,bottom)).point(lambda a:255 if a>64 else 0).getbbox()
   if b:bands.append([round((b[0]-anchor)*scale,2),round((h-top-b[1])*scale,2),round((b[2]-b[0])*scale,2),round((b[3]-b[1])*scale,2)])
  hurt[atlas].append(bands)
 metadata['atlases'][atlas]={'scale':1,'frames':profiles};im.save(f'assets/tais-{atlas}-v1.webp',quality=94)
# Original photograph supplies the HUD and menu portrait, preserving identity.
photo=Image.open(sys.argv[3]).convert('RGB');photo=photo.crop((430,210,1500,1280))
photo.resize((320,320),Image.Resampling.LANCZOS).save(root/'tais-head-menu-v3.webp',quality=96)
portrait=photo.resize((80,81),Image.Resampling.LANCZOS).convert('RGBA');py=y+row_h+2
if py+81>packed.height:
 grown=Image.new('RGBA',(2048,py+81));grown.alpha_composite(packed);packed=grown
packed.alpha_composite(portrait,(2,py));metadata['portrait']=[2,py,80,81]
packed.crop((0,0,2048,py+81)).save(root/'tais-v1.webp',quality=94)
(root/'tais-v1.json').write_text(json.dumps(metadata,separators=(',',':')))
f=images['base'][0];preview=Image.new('RGBA',(240,300));f=f.copy();f.thumbnail((220,282),Image.Resampling.LANCZOS);preview.alpha_composite(f,((240-f.width)//2,294-f.height));preview.save(root/'tais-preview-v1.webp',quality=94)
Path('assets/runtime/tais-head-anchors-v1.json').write_text(json.dumps(faces,separators=(',',':')))
Path('src/savate-data.js').write_text('export const SAVATE_HURT='+json.dumps(hurt,separators=(',',':'))+';\n')
print('Tais: 32 complete Savate poses, calibrated hurtboxes, original-photo portraits.')
