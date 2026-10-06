"""Pack generated whole-body poses and measure their alpha silhouettes for gameplay."""
from pathlib import Path
from PIL import Image
import json,sys
sources={'base':Path(sys.argv[1]),'combat':Path(sys.argv[2])}
heights={'base':[300,300,300,300,245,210,285,285,300,300,300,280,285,285,320,95],
         'combat':[210,210,170,150,245,245,240,245,300,205,290,300,110,200,280,210]}
anchors={'base':[.5,.48,.47,.47,.5,.45,.36,.32,.45,.26,.5,.58,.5,.3,.5,.5],
         'combat':[.48,.28,.55,.33,.42,.28,.5,.27,.5,.45,.5,.5,.5,.45,.48,.5]}
metadata={'atlases':{},'portrait':None};hurt={};frames={};packed=Image.new('RGBA',(2048,1600));x=y=2;row_h=0
for atlas,path in sources.items():
 im=Image.open(path).convert('RGBA');out=[];hurt[atlas]=[];frames[atlas]=[]
 assert im.getchannel('A').getextrema()[0]==0,'sprite background must be transparent'
 for i in range(16):
  col,row=i%4,i//4
  cell=im.crop((round(col*im.width/4)+6,round(row*im.height/4)+6,round((col+1)*im.width/4)-6,round((row+1)*im.height/4)-6))
  box=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();assert box,f'{atlas} pose {i} missing'
  frame=cell.crop(box);w,h=frame.size;scale=heights[atlas][i]/h;anchor=w*anchors[atlas][i]
  if x+w+2>2048:x=2;y+=row_h+2;row_h=0
  packed.alpha_composite(frame,(x,y));profile=dict(x=0,y=0,w=w,h=h,anchor=anchor,bottom=h,scale=round(scale,6),rect=[x,y,w,h])
  out.append(profile);frames[atlas].append(frame);x+=w+2;row_h=max(row_h,h)
  bands=[];cuts=[0,round(h*.24),round(h*.62),h]
  for top,bottom in zip(cuts,cuts[1:]):
   mask=frame.getchannel('A').crop((0,top,w,bottom)).point(lambda a:255 if a>64 else 0);b=mask.getbbox()
   if b:bands.append([round((b[0]-anchor)*scale,2),round((h-top-b[1])*scale,2),round((b[2]-b[0])*scale,2),round((b[3]-b[1])*scale,2)])
  hurt[atlas].append(bands)
 metadata['atlases'][atlas]={'scale':1,'frames':out}
 # Keep source atlas alongside the runtime pack for reproducible builds.
 im.save(f'assets/ruan-{atlas}-v1.webp',quality=96)
f=frames['base'][0];head=f.crop((round(f.width*.38),0,round(f.width*.84),round(f.height*.28)))
portrait=head.resize((80,81),Image.Resampling.LANCZOS);packed.alpha_composite(portrait,(2,y+row_h+2));metadata['portrait']=[2,y+row_h+2,80,81]
root=Path('assets/runtime');root.mkdir(exist_ok=True)
packed.crop((0,0,2048,y+row_h+85)).save(root/'ruan-v1.webp',quality=90)
(root/'ruan-v1.json').write_text(json.dumps(metadata,separators=(',',':')))
preview=Image.new('RGBA',(240,300));thumb=f.copy();thumb.thumbnail((220,282),Image.Resampling.LANCZOS);preview.alpha_composite(thumb,((240-thumb.width)//2,294-thumb.height));preview.save(root/'ruan-preview-v1.webp',quality=90)
side=head.height+10
head_square=Image.new('RGBA',(side,side),'#214e62');head_square.alpha_composite(head,(-round(head.width*.16),0));head_square.resize((320,320),Image.Resampling.LANCZOS).convert('RGB').save(root/'ruan-head-menu-v3.webp',quality=96)
Path('src/karate-data.js').write_text('export const KARATE_HURT='+json.dumps(hurt,separators=(',',':'))+';\n')
print('Ruan: 32 poses, transparent sprites, calibrated hurtboxes, runtime pack and menu ready.')
