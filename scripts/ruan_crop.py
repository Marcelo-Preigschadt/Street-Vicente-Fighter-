"""Extract complete connected sprites, including limbs crossing grid boundaries."""
import numpy as np
from scipy import ndimage
from PIL import Image

def extract_frames(image, columns=4, rows=4, joao_base=False):
    pixels=np.asarray(image.convert('RGBA'))
    mask=pixels[:,:,3]>=(140 if joao_base else 95)
    if joao_base:
        # The source hit shoe and victory fist touch. Separate that seam only;
        # never include an adjacent pose when measuring height or hurtboxes.
        from PIL import ImageDraw
        seam=Image.new('L',image.size)
        ImageDraw.Draw(seam).line([(0,847),(60,847),(80,850),(123,850),(140,847),(344,847)],fill=255,width=2)
        mask[np.asarray(seam)>0]=False
    labels,_=ndimage.label(mask,structure=np.ones((3,3)))
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
        if joao_base and i==12:y1=min(y1,840)
        cut=pixels[y1:y2,x1:x2].copy()
        mask=ndimage.binary_dilation(labels[y1:y2,x1:x2]==winner,iterations=2)
        mask &= (labels[y1:y2,x1:x2]==0)|(labels[y1:y2,x1:x2]==winner)
        if joao_base and i in (8,12):
            yy,xx=np.mgrid[y1:y2,x1:x2]
            skin=(cut[:,:,0]>cut[:,:,1]*1.1)&(cut[:,:,1]>cut[:,:,2]*1.1)
            victory=(yy>850)|((yy>=840)&(xx>=60)&(xx<=130)&skin)
            if i==12: mask |= (yy>=840)&(yy<=850)&(xx>=60)&(xx<=130)&skin
            mask &= victory if i==12 else ~victory
        cut[:,:,3]=np.where(mask,cut[:,:,3],0)
        frames.append((Image.fromarray(cut),(x1,y1,x2,y2)))
    return frames
