"""Pack ImageGen's separate mechanical components; leave source images intact."""
from PIL import Image
from pathlib import Path
import json,sys
import numpy as np
from scipy.ndimage import label,find_objects
def component(tile):
    labels,n=label(np.array(tile.getchannel('A'))>128)
    counts=np.bincount(labels.ravel());counts[0]=0;i=int(counts.argmax())
    area=find_objects(labels)[i-1]
    y,x=area
    return tile.crop((max(0,x.start-3),max(0,y.start-3),min(tile.width,x.stop+3),min(tile.height,y.stop+3)))
inputs=json.loads(Path(sys.argv[1]).read_text())
metadata={}
for name,path in inputs.items():
    im=Image.open(path).convert('RGBA');w,h=im.size;parts=[]
    if name=='snack':
        for region in [(0,0,round(w*.59),h),(round(w*.59),0,w,h)]:
            tile=im.crop(region);parts.append(component(tile))
    split=round(h*.59)
    for i in range(0 if name=='snack' else 8):
        x1=round(i%4*w/4);x2=round((i%4+1)*w/4)
        tile=im.crop((x1,0 if i<4 else split,x2,split if i<4 else h))
        parts.append(component(tile))
    atlas=Image.new('RGBA',(sum(p.width+4 for p in parts),max(p.height for p in parts)+4));frames=[];x=2
    for p in parts:
        atlas.alpha_composite(p,(x,2));frames.append([x,2,p.width,p.height]);x+=p.width+4
    target=f'assets/story/{name}-rig-v6.webp';atlas.save(target,'WEBP',quality=92,method=4)
    metadata[name]={'file':target,'parts':frames}
Path('assets/story/machine-rigs-v6.json').write_text(json.dumps(metadata,separators=(',',':'))+'\n')
