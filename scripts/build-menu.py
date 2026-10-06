from pathlib import Path
import json
from PIL import Image
for file in Path('assets/runtime').glob('*-v1.json'):
    name=file.name.removesuffix('-v1.json')
    data=json.loads(file.read_text());sheet=Image.open(file.with_suffix('.webp'))
    x,y,w,h=data['atlases']['base']['frames'][0]['rect']
    frame=sheet.crop((x,y,x+w,y+h))
    # Extract the full top of the silhouette, keeping hats and hair intact.
    top=frame.crop((0,0,w,round(h*.36)))
    box=top.getbbox();top=top.crop(box)
    canvas=Image.new('RGBA',(160,160));top.thumbnail((154,154),Image.Resampling.LANCZOS)
    canvas.alpha_composite(top,((160-top.width)//2,(160-top.height)//2))
    canvas.save(f'assets/runtime/{name}-head-menu-v1.webp',quality=92)
