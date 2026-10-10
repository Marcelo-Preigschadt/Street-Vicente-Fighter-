// Silhouette extraction is done at build time. Browsers only decode and draw rectangles.
export const RUNTIME_VERSIONS=Object.freeze({tais:2,khauany:2,dienes:3});
export async function loadPreparedSprites(id,loadImage) {
  const stem=`assets/runtime/${id}-v${RUNTIME_VERSIONS[id]??1}`;
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
  const walkStem=`assets/story/${id}-walk-v5`;
  const [walkImage,walkResponse]=await Promise.all([loadImage(`${walkStem}.webp`),fetch(`${walkStem}.json`)]);
  if(!walkResponse.ok)throw new Error(`Não foi possível carregar a caminhada de ${id}`);
  const walk=(await walkResponse.json()).atlases.walk;
  // Original burst steps and stun reactions remain available after the eight
  // native walk frames. New locomotion does not replace any authored attacks.
  const extras=base.motion?.frames.slice(8)??[];
  base.motion={scale:walk.scale,frames:[...walk.frames.map(frame=>({...frame,image:walkImage})),...extras]};
  const portrait=document.createElement('canvas');portrait.width=80;portrait.height=81;
  portrait.getContext('2d').drawImage(image,...metadata.portrait,0,0,80,81);
  return {base,portrait};
}
