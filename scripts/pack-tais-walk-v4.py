"""Repack eight painted gait phases while preserving world-scale body height."""
import json,sys
from pathlib import Path
from PIL import Image
from tais_sheet import isolate
old=json.loads(Path('assets/story/tais-walk-v3.json').read_text())
figures=isolate(Image.open(sys.argv[1]).convert('RGBA'),4,2)
packed=Image.new('RGBA',(2048,1100));frames=[];x=y=2;row_height=0
for i,f in enumerate(figures):
 w,h=f.size;scale=round(old[i]['h']*old[i]['scale']/h,6)
 if x+w+2>2048:x=2;y+=row_height+2;row_height=0
 packed.alpha_composite(f,(x,y));frames.append(dict(rect=[x,y,w,h],x=0,y=0,w=w,h=h,anchor=round(w*.48,2),bottom=h,scale=scale))
 x+=w+2;row_height=max(row_height,h)
packed.crop((0,0,2048,y+row_height+2)).save('assets/story/tais-walk-v4.webp',quality=94)
Path('assets/story/tais-walk-v4.json').write_text(json.dumps(frames,separators=(',',':')))
