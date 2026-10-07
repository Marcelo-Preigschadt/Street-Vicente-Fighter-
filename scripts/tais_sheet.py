import numpy as np
from scipy import ndimage
from PIL import Image

def isolate(sheet,cols,rows):
    arr=np.asarray(sheet.convert('RGBA'))
    labels,_=ndimage.label(arr[:,:,3]>=95,structure=np.ones((3,3)))
    frames=[];winners=[]
    for i in range(cols*rows):
        lx,rx=round(i%cols*sheet.width/cols),round((i%cols+1)*sheet.width/cols)
        ty,by=round(i//cols*sheet.height/rows),round((i//cols+1)*sheet.height/rows)
        ids,counts=np.unique(labels[ty:by,lx:rx],return_counts=True)
        count,winner=max((int(n),int(k)) for k,n in zip(ids,counts) if k)
        assert count>=10000,(i,count)
        winners.append(winner)
    for i,winner in enumerate(winners):
        mask=labels==winner
        # A boot and the next pose's hair touch across two row boundaries.
        if winners.count(winner)>1:
            indices=[j for j,k in enumerate(winners) if k==winner]
            cut=round((indices[0]//cols+1)*sheet.height/rows)+13
            mask=mask & ((np.indices(mask.shape)[0]<cut) if i==indices[0] else (np.indices(mask.shape)[0]>=cut))
            parts,count=ndimage.label(mask,structure=np.ones((3,3)))
            if count>1:
                area=np.bincount(parts.ravel());area[0]=0;mask=parts==area.argmax()
        ys,xs=np.where(mask)
        l,r=max(0,xs.min()-2),min(sheet.width,xs.max()+3)
        t,b=max(0,ys.min()-2),min(sheet.height,ys.max()+3)
        cut=arr[t:b,l:r].copy();cut[~mask[t:b,l:r]]=0
        frames.append(Image.fromarray(cut,'RGBA'))
    return frames
