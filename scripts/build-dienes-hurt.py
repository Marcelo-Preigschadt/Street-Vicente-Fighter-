"""Measure three physical hurt bands for every isolated Dienes sprite."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
image=np.asarray(Image.open(ROOT/'assets/runtime/dienes-v2.webp').convert('RGBA'))
meta=json.loads((ROOT/'assets/runtime/dienes-v2.json').read_text())
profiles={}
for atlas,sheet in meta['atlases'].items():
    scale=sheet['scale'];profiles[atlas]=[]
    for frame in sheet['frames']:
        x,y,w,h=frame['rect'];mask=image[y:y+h,x:x+w,3]>110;bands=[]
        for top,bottom in zip(np.linspace(0,h,4,dtype=int)[:-1],np.linspace(0,h,4,dtype=int)[1:]):
            ys,xs=np.nonzero(mask[top:bottom])
            if not len(xs):raise ValueError(f'Empty {atlas} band {len(profiles[atlas])}')
            left,right=xs.min(),xs.max()+1
            bands.append([round((left-frame['anchor'])*scale,1),round((h-top)*scale,1),round((right-left)*scale,1),round((bottom-top)*scale,1)])
        profiles[atlas].append(bands[::-1])
(ROOT/'src/dienes-data.js').write_text('/* Dienes hurtboxes measured from her painted silhouettes. */\nexport const DIENES_HURT='+json.dumps(profiles,separators=(',',':'))+';\n')
print('32 Dienes hurtbox profiles')
