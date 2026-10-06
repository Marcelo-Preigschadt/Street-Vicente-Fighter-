from pathlib import Path
from PIL import Image
# Dedicated close-up portraits, ordered row-major in a 4 x 2 atlas.
ids=['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao']
sheet=Image.open('assets/menu-portraits-atlas-v2.webp')
for i,name in enumerate(ids):
    col,row=i%4,i//4
    bounds=(round(col*sheet.width/4),round(row*sheet.height/2),round((col+1)*sheet.width/4),round((row+1)*sheet.height/2))
    portrait=sheet.crop(bounds).resize((320,320),Image.Resampling.LANCZOS)
    portrait.save(f'assets/runtime/{name}-head-menu-v2.webp',quality=92)
