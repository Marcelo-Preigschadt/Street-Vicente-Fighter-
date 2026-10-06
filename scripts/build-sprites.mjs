import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {Renderer} from '../src/render.js';
import {CHARACTERS} from '../src/engine.js';
import {costumeAsset,alignCostumeSheet,COSTUME_LAYOUT} from '../src/costume-data.js';
import {GELTON_LAYOUT} from '../src/gelton-layout.js';
import {MUAY_THAI_LAYOUT} from '../src/muay-thai-data.js';
import {JUDO_LAYOUT} from '../src/judo-data.js';
import {cachePortrait} from '../src/render-cache.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.matchMedia=()=>({matches:false});
const r=new Renderer(createCanvas(1,1));await mkdir('assets/runtime',{recursive:true});
async function webp(canvas,path,quality=88){
  const png=path.replace('.webp','.png');await writeFile(png,canvas.toBuffer('image/png'));
  execFileSync('python3',['-c','from PIL import Image;import sys;from pathlib import Path;p=Path(sys.argv[1]);Image.open(p).save(sys.argv[2],quality=int(sys.argv[3]));p.unlink()',png,path,String(quality)]);
}
for(const [id,f]of Object.entries(CHARACTERS)) {
  const sheets={};
  if(['gelton','marcelino','marcos'].includes(id)) {
    sheets.base=r.analyzeSheet(await loadImage(f.sprite),false,4,96);
    sheets.combat=r.analyzeSheet(await loadImage(f.combatSprite),false,4,96);
    if(id==='gelton')sheets.combat.frames[9]=r.analyzeSheet(await loadImage(f.superSprite),false,1,0,1).frames[0];
    const layout={gelton:GELTON_LAYOUT,marcelino:MUAY_THAI_LAYOUT,marcos:JUDO_LAYOUT}[id];
    for(const [atlas,sheet]of Object.entries(sheets))for(const [i,frame]of sheet.frames.entries()){
      frame.scale=layout[atlas][i].scale;frame.anchor=frame.x+frame.w*layout[atlas][i].anchor;
    }
  } else {
    const paths={base:costumeAsset(id,'base',f.sprite),combat:costumeAsset(id,'combat',f.combatSprite)};
    for(const atlas of ['style','motion','strike','reaction','low'])paths[atlas]=costumeAsset(id,atlas,`assets/${id}-${atlas}${['strike','reaction','low'].includes(atlas)?'-v3':''}.webp`);
    for(const [atlas,path]of Object.entries(paths)) {
      const im=await loadImage(path);
      sheets[atlas]=atlas==='base'?r.analyzeSheet(im):atlas==='combat'?r.analyzeSheet(im,true):atlas==='style'?r.analyzeStyleSheet(im):atlas==='motion'?r.analyzeMotionSheet(im):r.analyzeTechniqueSheet(im,atlas);
      alignCostumeSheet(sheets[atlas],id,atlas);
    }
  }
  const metadata={atlases:{},portrait:null},items=[];let x=2,y=2,rowHeight=0;
  function place(w,h){if(x+w+2>2048){x=2;y+=rowHeight+2;rowHeight=0;}const rect=[x,y,w,h];x+=w+2;rowHeight=Math.max(rowHeight,h);return rect;}
  for(const [atlas,sheet]of Object.entries(sheets)) {
    metadata.atlases[atlas]={scale:sheet.scale,frames:[]};
    for(const frame of sheet.frames) {
      const rect=place(frame.w,frame.h),{cutout,...profile}=frame;
      metadata.atlases[atlas].frames.push({...profile,rect});items.push({image:cutout,rect});
    }
  }
  const portrait=await cachePortrait(sheets.base,COSTUME_LAYOUT[id]?.base.portrait);
  metadata.portrait=place(80,81);items.push({image:portrait,rect:metadata.portrait});
  const packed=createCanvas(2048,y+rowHeight+2),c=packed.getContext('2d');
  for(const {image,rect}of items)c.drawImage(image,...rect);
  await webp(packed,`assets/runtime/${id}-v1.webp`);
  await writeFile(`assets/runtime/${id}-v1.json`,JSON.stringify(metadata));
  const preview=createCanvas(240,300),p=preview.getContext('2d'),frame=sheets.base.frames[0],scale=Math.min(216/frame.w,280/frame.h);
  p.drawImage(frame.cutout,0,0,frame.w,frame.h,(240-frame.w*scale)/2,294-frame.h*scale,frame.w*scale,frame.h*scale);
  await webp(preview,`assets/runtime/${id}-preview-v1.webp`,84);
  console.log(id,Object.values(sheets).reduce((n,s)=>n+s.frames.length,0)+' frames',packed.width+'×'+packed.height);
}
