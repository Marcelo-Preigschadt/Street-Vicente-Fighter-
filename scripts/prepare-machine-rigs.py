"""Pack ImageGen's separate mechanical components; leave source images intact."""
from PIL import Image
from pathlib import Path
import json,sys
inputs=json.loads(Path(sys.argv[1]).read_text())
metadata={}
for name,path in inputs.items():
    im=Image.open(path).convert('RGBA');w,h=im.size;parts=[]
    if name=='snack':
        for region in [(0,0,round(w*.59),h),(round(w*.59),0,w,h)]:
            tile=im.crop(region);parts.append(tile.crop(tile.getchannel('A').getbbox()))
    split=round(h*.59)
    for i in range(0 if name=='snack' else 8):
        x1=round(i%4*w/4);x2=round((i%4+1)*w/4)
        tile=im.crop((x1,0 if i<4 else split,x2,split if i<4 else h))
        box=tile.getchannel('A').getbbox()
        if not box:raise ValueError(f'{name} missing part {i}')
        parts.append(tile.crop(box))
    atlas=Image.new('RGBA',(sum(p.width+4 for p in parts),max(p.height for p in parts)+4));frames=[];x=2
    for p in parts:
        atlas.alpha_composite(p,(x,2));frames.append([x,2,p.width,p.height]);x+=p.width+4
    target=f'assets/story/{name}-rig-v5.webp';atlas.save(target,'WEBP',quality=92,method=4)
    metadata[name]={'file':target,'parts':frames}
Path('assets/story/machine-rigs-v5.json').write_text(json.dumps(metadata,separators=(',',':'))+'\n')
