"""Shared source-pixel landmarks; visual overlays require human review."""
import numpy as np

def landmarks(im, anchor):
    """Stance landmarks plus measured sole centers; no facial image synthesis."""
    w,h = im.size; a = np.array(im)[:,:,3] > 100
    feet = []
    for left,right in [(0,round(anchor)),(round(anchor),w)]:
        yy,xx = np.nonzero(a[round(h*.68):,left:right])
        if not len(xx):
            feet.append([w*(.16 if left==0 else .84),h*.97]); continue
        yy=yy+round(h*.68); xx=xx+left; end=yy.max()
        sole=xx[yy>=end-6]
        feet.append([float(np.median(sole)),float(end-5)])
    hips=[[anchor-w*.07,h*.56],[anchor+w*.07,h*.56]]
    knees=[]
    for side,(hip,foot) in enumerate(zip(hips,feet)):
        y=round(hip[1]+(foot[1]-hip[1])*.5)
        lo,hi=(0,round(anchor)) if side==0 else (round(anchor),w)
        xx=np.nonzero(a[max(0,y-3):y+4,lo:hi])[1]+lo
        knee_x=float(np.median(xx)) if len(xx) else (hip[0]+foot[0])*.5
        knees.append([knee_x,float(y)])
    # The painted guard provides the arm motion; only small breathing/weight
    # corrections are applied to these points. Facial vertices are rigid.
    neck=[anchor+w*.06,h*.23];head=[anchor+w*.10,h*.11]
    return [[anchor,h*.56],neck,head,hips[0],knees[0],feet[0],[feet[0][0],feet[0][1]+5],
            hips[1],knees[1],feet[1],[feet[1][0],feet[1][1]+5],
            [anchor-w*.12,h*.30],[anchor-w*.11,h*.42],[anchor+w*.09,h*.31],
            [anchor+w*.17,h*.29],[anchor+w*.30,h*.42],[anchor+w*.28,h*.25]]
