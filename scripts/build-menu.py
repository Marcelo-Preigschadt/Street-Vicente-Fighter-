from pathlib import Path
import json
import sys
from PIL import Image
# Exact crops of the same base frame used by the fighting-pose preview.
# Coordinates are relative to that extracted frame, individually calibrated.
heads={
 'marcelo':(99,0,182,79),
 'rafael':(93,0,158,67),
 'gustavo':(80,0,170,81),
 'gelton':(127,0,229,83),
 'marcelino':(80,0,160,76),
 'marcos':(105,0,199,91),
 'joao':(150,0,278,99),
}
for name,bounds in heads.items():
    if len(sys.argv)>1 and name not in sys.argv[1:]:continue
    metadata=json.loads(Path(f'assets/runtime/{name}-v1.json').read_text())
    x,y,w,h=metadata['atlases']['base']['frames'][0]['rect']
    sheet=Image.open(f'assets/runtime/{name}-v1.webp').convert('RGBA')
    head=sheet.crop((x,y,x+w,y+h)).crop(bounds)
    # Equal square framing; preserve all original facial pixels and aspect ratio.
    zoom={'gelton':(86,56),'joao':(104,80)}
    side,center=zoom.get(name,(max(head.size)+10,head.width/2))
    portrait=Image.new('RGBA',(side,side),'#214e62')
    # Composite through a square viewport to enlarge the face without distortion.
    layer=Image.new('RGBA',(max(side,head.width)+40,max(side,head.height)+20))
    layer.alpha_composite(head,(20,5))
    left=round(20+center-side/2)
    viewport=layer.crop((left,0,left+side,side))
    portrait.alpha_composite(viewport,(0,0))
    portrait.resize((320,320),Image.Resampling.LANCZOS).convert('RGB').save(f'assets/runtime/{name}-head-menu-v{4 if name in zoom else 3}.webp',quality=96)
