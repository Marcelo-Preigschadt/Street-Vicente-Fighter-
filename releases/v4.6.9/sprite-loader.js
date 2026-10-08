// Silhouette extraction is done at build time. Browsers only decode and draw rectangles.
export async function loadPreparedSprites(id,loadImage) {
  const stem=`assets/runtime/${id}-v${id==='tais'?2:1}`;
  const revision=id==='ruan'?'?v=362':id==='joao'?'?v=362':id==='luciana'?'?v=467':'';
  const [image,response]=await Promise.all([loadImage(`${stem}.webp${revision}`),fetch(`${stem}.json${revision}`)]);
  if(!response.ok)throw new Error(`Não foi possível preparar ${id}: HTTP ${response.status}`);
  const metadata=await response.json(),sheets={};
  for(const [atlas,profile] of Object.entries(metadata.atlases)) {
    const frames=profile.frames.map(data=>{
      const frame={...data,image};let cutout;
      Object.defineProperty(frame,'cutout',{get(){
        if(!cutout){cutout=document.createElement('canvas');cutout.width=frame.w;cutout.height=frame.h;
          cutout.getContext('2d').drawImage(image,...frame.rect,0,0,frame.w,frame.h);}
        return cutout;
      }});
      return frame;
    });
    sheets[atlas]={image,scale:profile.scale,frames};
  }
  const base=sheets.base;for(const [atlas,sheet]of Object.entries(sheets))if(atlas!=='base')base[atlas]=sheet;
  if(!base.style)base.style=base;
  const portrait=document.createElement('canvas');portrait.width=80;portrait.height=81;
  portrait.getContext('2d').drawImage(image,...metadata.portrait,0,0,80,81);
  return {base,portrait};
}
