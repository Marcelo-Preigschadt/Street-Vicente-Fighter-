"""Extract complete connected sprites, including limbs crossing grid boundaries."""
import numpy as np
from scipy import ndimage
from PIL import Image

def extract_frames(image, columns=4, rows=4):
    pixels=np.asarray(image.convert('RGBA'))
    labels,_=ndimage.label(pixels[:,:,3]>=95,structure=np.ones((3,3)))
    boxes=ndimage.find_objects(labels)
    used=set();frames=[]
    for i in range(columns*rows):
        col,row=i%columns,i//columns
        left,right=round(col*image.width/columns),round((col+1)*image.width/columns)
        top,bottom=round(row*image.height/rows),round((row+1)*image.height/rows)
        values,counts=np.unique(labels[top:bottom,left:right],return_counts=True)
        candidates=[(int(count),int(value)) for value,count in zip(values,counts) if value]
        assert candidates,f'pose {i} missing'
        _,winner=max(candidates)
        assert winner not in used,f'poses touch across cell {i}'
        used.add(winner)
        ys,xs=boxes[winner-1]
        x1,x2=max(0,xs.start-2),min(image.width,xs.stop+2)
        y1,y2=max(0,ys.start-2),min(image.height,ys.stop+2)
        cut=pixels[y1:y2,x1:x2].copy()
        mask=ndimage.binary_dilation(labels[y1:y2,x1:x2]==winner,iterations=2)
        cut[:,:,3]=np.where(mask,cut[:,:,3],0)
        frames.append((Image.fromarray(cut),(x1,y1,x2,y2)))
    return frames
