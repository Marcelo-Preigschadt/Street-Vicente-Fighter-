"""Pack generated whole-body poses and measure their alpha silhouettes for gameplay."""
from pathlib import Path
from PIL import Image
import json,sys
from ruan_crop import extract_frames
sources={'base':Path(sys.argv[1]),'combat':Path(sys.argv[2])}
# Crown-to-chin lengths measured in the source pixels. Keep anatomy stable;
# total pose height changes naturally when crouching, sweeping or jumping.
head_pixels={'base':[105]*16,'combat':[105]*16}
head_world=105
anchors={'base':[.5]*16,'combat':[.5,.5,.35,.5,.5,.5,.33,.5,.5,.5,.5,.5,.5,.5,.5,.5]}
metadata={'atlases':{},'portrait':None};hurt={};frames={};packed=Image.new('RGBA',(2048,1600));x=y=2;row_h=0
def place_pixels(image,position):
 global packed
 required=position[1]+image.height
 if required>packed.height:
  grown=Image.new('RGBA',(2048,max(required,packed.height*2)));grown.alpha_composite(packed);packed=grown
 packed.alpha_composite(image,position)
for atlas,path in sources.items():
 im=Image.open(path).convert('RGBA');out=[];hurt[atlas]=[];frames[atlas]=[]
 assert im.getchannel('A').getextrema()[0]==0,'sprite background must be transparent'
 for i,(frame,_) in enumerate(extract_frames(im,joao_base=atlas=='base')):
  w,h=frame.size;scale=head_world/head_pixels[atlas][i];anchor=w*anchors[atlas][i]
  if x+w+2>2048:x=2;y+=row_h+2;row_h=0
  place_pixels(frame,(x,y));profile=dict(x=0,y=0,w=w,h=h,anchor=anchor,bottom=h,scale=round(scale,6),rect=[x,y,w,h],headPixels=head_pixels[atlas][i])
  out.append(profile);frames[atlas].append(frame);x+=w+2;row_h=max(row_h,h)
  bands=[];cuts=[0,round(h*.24),round(h*.62),h]
  for top,bottom in zip(cuts,cuts[1:]):
   mask=frame.getchannel('A').crop((0,top,w,bottom)).point(lambda a:255 if a>64 else 0);b=mask.getbbox()
   if b:bands.append([round((b[0]-anchor)*scale,2),round((h-top-b[1])*scale,2),round((b[2]-b[0])*scale,2),round((b[3]-b[1])*scale,2)])
  hurt[atlas].append(bands)
 metadata['atlases'][atlas]={'scale':1,'frames':out}
 # Keep source atlas alongside the runtime pack for reproducible builds.
 target=Path(f'assets/joao-{atlas}-v1.webp')
 if path.resolve()!=target.resolve():im.save(target,quality=96)
f=frames['base'][0];head=f.crop((150,0,278,105))
portrait=head.resize((80,81),Image.Resampling.LANCZOS);place_pixels(portrait,(2,y+row_h+2));metadata['portrait']=[2,y+row_h+2,80,81]
root=Path('assets/runtime');root.mkdir(exist_ok=True)
packed.crop((0,0,2048,y+row_h+85)).save(root/'joao-v1.webp',quality=90)
(root/'joao-v1.json').write_text(json.dumps(metadata,separators=(',',':')))
preview=Image.new('RGBA',(240,300));thumb=f.copy();thumb.thumbnail((220,282),Image.Resampling.LANCZOS);preview.alpha_composite(thumb,((240-thumb.width)//2,294-thumb.height));preview.save(root/'joao-preview-v1.webp',quality=90)
side=head.height+10
head_square=Image.new('RGBA',(side,side),'#214e62');head_square.alpha_composite(head,(-round(head.width*.16),0));head_square.resize((320,320),Image.Resampling.LANCZOS).convert('RGB').save(root/'joao-head-menu-v4.webp',quality=96)
layout={k:[{'scale':f['scale'],'anchor':anchors[k][i]} for i,f in enumerate(v['frames'])] for k,v in metadata['atlases'].items()}
Path('src/wild-data.js').write_text('export const WILD_LAYOUT='+json.dumps(layout,separators=(',',':'))+';\nexport const WILD_HURT='+json.dumps(hurt,separators=(',',':'))+';\n')
print('João: 32 poses, transparent sprites, calibrated hurtboxes, runtime pack and menu ready.')
