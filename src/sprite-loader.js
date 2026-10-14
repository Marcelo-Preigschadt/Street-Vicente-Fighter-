// Silhouette extraction is done at build time. Browsers only decode and draw rectangles.
export const PREPARED_SPRITE_VERSIONS=Object.freeze({adriano:1,marcelo:1,rafael:1,gustavo:1,gelton:1,marcelino:1,marcos:1,joao:1,ruan:1,tais:2,luciana:1,khauany:2,dienes:2});
export const MOTION_SPRITE_STEMS=Object.freeze({adriano:'assets/story/adriano-walk-v1',gelton:'assets/story/gelton-walk-v3',marcelino:'assets/story/marcelino-walk-v3',marcos:'assets/story/marcos-walk-v3',joao:'assets/story/joao-walk-v3',ruan:'assets/story/ruan-walk-v3',tais:'assets/story/tais-walk-v4',luciana:'assets/story/luciana-walk-v2',khauany:'assets/story/khauany-walk-v3',dienes:'assets/story/dienes-walk-v2'});

export function preparedSpriteStem(id) {
  if(!Object.hasOwn(PREPARED_SPRITE_VERSIONS,id))throw new Error(`Personagem sem atlas preparado: ${id}`);
  const version=PREPARED_SPRITE_VERSIONS[id];
  return `assets/runtime/${id}-v${version}`;
}

const invalidAtlas=(id,message)=>{throw new Error(`${id}: atlas inválido (${message})`);};
const finite=value=>typeof value==='number'&&Number.isFinite(value);
function validateImageSize(image,id){
  if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<=0||image.height<=0)invalidAtlas(id,'imagem');
}
function validateRectangle(value,image,id,name){
  if(!Array.isArray(value)||value.length!==4||value.some(v=>!Number.isInteger(v)))invalidAtlas(id,`${name}: retângulo`);
  const [x,y,w,h]=value;
  if(x<0||y<0||w<=0||h<=0||x+w>image.width||y+h>image.height)invalidAtlas(id,`${name}: recorte fora da imagem`);
}
export function validateSpriteFrames(sheet,image,id='sprite',atlas='frames'){
  validateImageSize(image,id);
  if(!sheet||!finite(sheet.scale)||sheet.scale<=0||!Array.isArray(sheet.frames)||!sheet.frames.length)invalidAtlas(id,`${atlas}: escala/quadros`);
  for(const [index,frame] of sheet.frames.entries()){
    const name=`${atlas}[${index}]`;validateRectangle(frame?.rect,image,id,name);
    if(frame.w!==frame.rect[2]||frame.h!==frame.rect[3])invalidAtlas(id,`${name}: dimensões divergentes`);
    for(const key of ['x','y','anchor','bottom'])if(!finite(frame[key]))invalidAtlas(id,`${name}: ${key}`);
    if(frame.scale!==undefined&&(!finite(frame.scale)||frame.scale<=0))invalidAtlas(id,`${name}: escala`);
  }
  return sheet;
}
export function validateSpriteMetadata(metadata,image,id='sprite') {
  const fail=message=>invalidAtlas(id,message);
  validateImageSize(image,id);
  if(!metadata?.atlases)fail('metadados');
  for(const required of ['base','combat'])if(!metadata.atlases[required]||metadata.atlases[required].frames?.length!==16)fail(`${required}: 16 poses obrigatórias`);
  for(const [atlas,sheet] of Object.entries(metadata.atlases))validateSpriteFrames(sheet,image,id,atlas);
  validateRectangle(metadata.portrait,image,id,'retrato');
  return metadata;
}

export async function loadPreparedSprites(id,loadImage) {
  const stem=preparedSpriteStem(id);
  const revision=id==='ruan'?'?v=362':id==='joao'?'?v=362':id==='luciana'?'?v=467':'';
  const [image,response]=await Promise.all([loadImage(`${stem}.webp${revision}`),fetch(`${stem}.json${revision}`)]);
  if(!response.ok)throw new Error(`Não foi possível preparar ${id}: HTTP ${response.status}`);
  const metadata=validateSpriteMetadata(await response.json(),image,id),sheets={};
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
  const motionStem=MOTION_SPRITE_STEMS[id];
  if(motionStem){
    const [motionImage,motionResponse]=await Promise.all([loadImage(`${motionStem}.webp`),fetch(`${motionStem}.json`)]);
    if(!motionResponse.ok)throw new Error(`Não foi possível carregar a caminhada de ${id}: HTTP ${motionResponse.status}`);
    const motionFrames=await motionResponse.json();
    if(!Array.isArray(motionFrames)||motionFrames.length!==8)throw new Error(`${id}: caminhada inválida (8 poses obrigatórias)`);
    validateSpriteFrames({scale:1,frames:motionFrames},motionImage,id,'motion');
    base.motion={scale:1,frames:motionFrames.map(frame=>({...frame,image:motionImage}))};
  }
  const portrait=document.createElement('canvas');portrait.width=80;portrait.height=81;
  portrait.getContext('2d').drawImage(image,...metadata.portrait,0,0,80,81);
  return {base,portrait};
}
