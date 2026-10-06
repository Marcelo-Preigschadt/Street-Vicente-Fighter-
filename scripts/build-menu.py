from pathlib import Path
import json
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
    metadata=json.loads(Path(f'assets/runtime/{name}-v1.json').read_text())
    x,y,w,h=metadata['atlases']['base']['frames'][0]['rect']
    sheet=Image.open(f'assets/runtime/{name}-v1.webp').convert('RGBA')
    head=sheet.crop((x,y,x+w,y+h)).crop(bounds)
    # Equal square framing; preserve all original facial pixels and aspect ratio.
    side=max(head.size)+10
    portrait=Image.new('RGBA',(side,side),'#214e62')
    portrait.alpha_composite(head,((side-head.width)//2,5))
    portrait.resize((320,320),Image.Resampling.LANCZOS).convert('RGB').save(f'assets/runtime/{name}-head-menu-v3.webp',quality=96)
