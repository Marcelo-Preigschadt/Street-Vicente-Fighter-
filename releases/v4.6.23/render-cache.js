// Prepare the few filtered poses at their calibrated world size before the fight.
// No animation, anchor or collision measurement changes here.
const surface = (width, height) => {
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(width));canvas.height=Math.max(1,Math.ceil(height));return canvas;
};
const seal = async canvas => {
  if(typeof createImageBitmap !== 'function')return canvas;
  const image=await createImageBitmap(canvas);canvas.width=1;canvas.height=1;return image;
};

export async function cacheSpriteEffects(sheet, frame, color, variants = []) {
  const scale=frame.scale??sheet.scale, normal=surface(frame.w*scale,frame.h*scale);
  normal.getContext('2d').drawImage(frame.cutout,0,0,frame.w,frame.h,0,0,frame.w*scale,frame.h*scale);
  const effects={};
  for(const variant of variants) {
    const padding=variant==='power'?32:0,image=surface(normal.width+padding*2,normal.height+padding*2),c=image.getContext('2d');
    if(variant==='power'){c.shadowColor=color;c.shadowBlur=12;}
    else c.filter=variant==='guard'?'brightness(1.3) sepia(.1)':'brightness(1.5) saturate(.6)';
    c.drawImage(normal,padding,padding);effects[variant]={image:await seal(image),padding};
  }
  normal.width=1;normal.height=1;frame.effects=effects;
}

export async function cachePortrait(sheet, portrait) {
  const frame=sheet.frames[0],image=surface(80,81),c=image.getContext('2d');
  const headX=portrait?portrait.x*sheet.image.width-frame.sx:frame.x+frame.w*.37,
    headY=portrait?portrait.y*sheet.image.height-frame.sy:frame.y,
    headW=portrait?portrait.w*sheet.image.width:frame.w*.45,headH=portrait?portrait.h*sheet.image.height:frame.h*.30;
  c.drawImage(frame.cutout,headX-frame.x,headY-frame.y,headW,headH,0,0,80,81);return seal(image);
}
