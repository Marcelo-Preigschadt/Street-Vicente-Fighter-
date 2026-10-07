from PIL import Image
from pathlib import Path
import json,statistics,argparse
parser=argparse.ArgumentParser(description="Convert upstream Mostafa BMP sprite atlases for the browser")
parser.add_argument("--source-dir",type=Path,required=True)
args=parser.parse_args()
out=Path('assets/story/mostafa');out.mkdir(exist_ok=True)
meta={}
for name,cw,ch,cols,n in [('ferris',120,100,6,30),('gneiss',120,100,6,30),('butcher',200,149,3,15)]:
 src={'ferris':'enemy-1','gneiss':'enemy-2','butcher':'enemy-butcher'}[name]
 im=Image.open(args.source_dir/(src+'.bmp')).convert('RGBA')
 data=list(im.getdata());im.putdata([(r,g,b,0 if (r,g,b)==(0,0,248) else 255) for r,g,b,a in data])
 frames=[]
 for i in range(n):
  x=i%cols*cw;y=i//cols*ch;cell=im.crop((x,y,x+cw,y+ch));bbox=cell.getbbox()
  frames.append({'rect':[x,y,cw,ch],'anchorX':cw/2,'bottom':bbox[3] if bbox else ch,'height':bbox[3]-bbox[1] if bbox else ch})
 # A single scale for the whole animation: falling cannot magically grow/shrink.
 scale=(310 if name=='butcher' else 276)/statistics.median([f['height'] for f in frames[:3]])
 im.save(out/(name+'.webp'),lossless=True)
 meta[name]={'file':str(out/(name+'.webp')),'scale':scale,'frames':frames}
(out/'frames.json').write_text(json.dumps(meta,indent=2)+'\n')
