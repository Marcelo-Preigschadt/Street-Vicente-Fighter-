// Head art generated separately at high resolution from the supplied photograph.
// Composite once when decoding the character; combat keeps drawImage-only frames.
export function prepareSavateFaces(sheet,head,anchors){
 for(const [atlas,entries] of Object.entries(anchors)){
  const source=atlas==='base'?sheet:sheet[atlas];
  for(const [i,anchor] of entries.entries()){
   const frame=source.frames[i],canvas=document.createElement('canvas');canvas.width=frame.w;canvas.height=frame.h;
   const c=canvas.getContext('2d');c.drawImage(frame.image,...frame.rect,0,0,frame.w,frame.h);
   const pixels=c.getImageData(0,0,frame.w,frame.h),hair=[];for(let y=0;y<Math.min(frame.h,anchor.y+65);y++)for(let x=0;x<Math.min(frame.w,anchor.x-anchor.w*.45);x++){const i=(y*frame.w+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];if(r>45&&r<120&&g<85&&b<60&&r>g*1.35&&g>b*1.12)hair.push([x,y]);}for(const [x,y]of hair)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<frame.w&&yy>=0&&yy<frame.h)pixels.data[(yy*frame.w+xx)*4+3]=0;}c.putImageData(pixels,0,0);
   c.save();c.translate(anchor.x,anchor.y);c.rotate(anchor.angle??0);
   // Remove the generic face/hair crown before placing the identity head part.
   c.globalCompositeOperation='destination-out';c.beginPath();c.ellipse(0,-anchor.h*.43,anchor.w*.55,anchor.h*.56,0,0,Math.PI*2);c.fill();
   c.globalCompositeOperation='source-over';c.drawImage(head,265,5,715,955,-anchor.w*.55,-anchor.h,anchor.w,anchor.h);c.restore();
   source.frames[i]={...frame,image:canvas,rect:[0,0,frame.w,frame.h],cutout:canvas};
  }
 }
}
