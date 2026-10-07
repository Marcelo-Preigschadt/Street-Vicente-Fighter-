"""Pack full painted Tais sprites from generated sheets; no runtime face grafts."""
import json, sys
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
from tais_sheet import isolate

root = Path('assets/runtime')
old = json.loads((root/'tais-v1.json').read_text())
meta = {'atlases': {}, 'portrait': None}
hurt = {}
packed = Image.new('RGBA',(2048,2300))
x=y=2;row_height=0
placements = {'base':[.5,.5,.5,.5,.5,.5,.45,.32,.45,.28,.5,.5,.5,.3,.5,.5],
              'combat':[.5,.32,.5,.35,.5,.32,.5,.3,.5,.5,.5,.35,.5,.5,.4,.5]}

for atlas,path in [('base',sys.argv[1]),('combat',sys.argv[2])]:
    sheet=Image.open(path).convert('RGBA')
    figures=isolate(sheet,4,4)
    if atlas=='base':base_figure=figures[0]
    profiles=[];hurt[atlas]=[]
    for i,f in enumerate(figures):
        if atlas=='base' and i in (9,14):
            f=f.copy();f.paste((0,0,0,0),(0,0,f.width,22 if i==9 else 18))
        fw,fh=f.size
        old_frame=old['atlases'][atlas]['frames'][i]
        scale=round(old_frame['h']*old_frame['scale']/fh,6)
        anchor=round(fw*placements[atlas][i],2)
        if x+fw+2>2048:x=2;y+=row_height+2;row_height=0
        packed.alpha_composite(f,(x,y))
        profiles.append(dict(x=0,y=0,w=fw,h=fh,anchor=anchor,bottom=fh,scale=scale,rect=[x,y,fw,fh]))
        cuts=[0,round(fh*.24),round(fh*.62),fh];bands=[]
        for top,bottom in zip(cuts,cuts[1:]):
            box=f.getchannel('A').crop((0,top,fw,bottom)).point(lambda a:255 if a>64 else 0).getbbox()
            if box:bands.append([round((box[0]-anchor)*scale,2),round((fh-top-box[3])*scale,2),round((box[2]-box[0])*scale,2),round((box[3]-box[1])*scale,2)])
        hurt[atlas].append(bands)
        x+=fw+2;row_height=max(row_height,fh)
    meta['atlases'][atlas]={'scale':1,'frames':profiles}

portrait=Image.open(sys.argv[3]).convert('RGBA').crop((75,0,1255,1180))
background=Image.new('RGBA',portrait.size,'#214e62');background.alpha_composite(portrait)
portrait=background.resize((320,320),Image.Resampling.LANCZOS).convert('RGB')
portrait.save(root/'tais-head-menu-v4.webp',quality=95)
portrait_small=portrait.resize((80,81),Image.Resampling.LANCZOS).convert('RGBA')
py=y+row_height+2
packed.alpha_composite(portrait_small,(2,py));meta['portrait']=[2,py,80,81]
packed.crop((0,0,2048,py+82)).save(root/'tais-v2.webp',quality=94)
(root/'tais-v2.json').write_text(json.dumps(meta,separators=(',',':')))
preview=Image.new('RGBA',(240,300));f=base_figure.copy();f.thumbnail((220,282),Image.Resampling.LANCZOS)
preview.alpha_composite(f,((240-f.width)//2,294-f.height));preview.save(root/'tais-preview-v2.webp',quality=94)
print('Tais: 32 complete illustrated native sprites and portrait; combat collision tuning unchanged')
