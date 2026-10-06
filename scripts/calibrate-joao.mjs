import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {Renderer} from '../src/render.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});
const r=new Renderer(createCanvas(1,1)),layout={},hurt={};
const heights={base:[260,260,260,260,220,215,294,205,260,200,95,220,320,260,205,240],combat:[260,260,260,260,245,225,205,245,210,200,200,220,225,225,225,245]};
for(const atlas of ['base','combat']){
 const sheet=r.analyzeSheet(await loadImage(`assets/joao-${atlas}-v1.webp`),false,4,96);
 layout[atlas]=[];hurt[atlas]=[];
 const contact=createCanvas(1120,1000),ctx=contact.getContext('2d');ctx.fillStyle='#24342a';ctx.fillRect(0,0,1120,1000);
 for(const [i,f]of sheet.frames.entries()){
  const scale=heights[atlas][i]/f.h,anchor=atlas==='combat'&&i===2?.35:atlas==='base'&&i===14?.40:.5;
  layout[atlas].push({scale:Number(scale.toFixed(6)),anchor});
  const image=f.cutout,c=image.getContext('2d'),pixels=c.getImageData(0,0,f.w,f.h).data,bands=[];
  for(const [lo,hi]of [[0,.25],[.25,.62],[.62,1]]){
   const y1=Math.floor(f.h*lo),y2=Math.min(f.h-1,Math.ceil(f.h*hi)-1);let left=f.w,right=-1;
   for(let y=y1;y<=y2;y++)for(let x=0;x<f.w;x++)if(pixels[(y*f.w+x)*4+3]>=140){left=Math.min(left,x);right=Math.max(right,x);}
   if(right>=left)bands.push([(left-f.w*anchor)*scale,(f.h-y1)*scale,(right-left+1)*scale,(y2-y1+1)*scale].map(v=>Number(v.toFixed(2))));
  }
  hurt[atlas].push(bands);
  const drawScale=Math.min(240/f.w,215/f.h),x=(i%4)*280+(280-f.w*drawScale)/2,y=Math.floor(i/4)*250+235-f.h*drawScale;
  ctx.drawImage(image,x,y,f.w*drawScale,f.h*drawScale);ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(`${atlas} ${i} · ${f.w}×${f.h}`,i%4*280+10,Math.floor(i/4)*250+20);
 }
 await writeFile(`../joao-${atlas}-contact.png`,contact.toBuffer('image/png'));
}
await writeFile('src/wild-data.js',`// Whole-body scale, body axis, and alpha silhouette bands; no limb deformation.\nexport const WILD_LAYOUT=${JSON.stringify(layout)};\nexport const WILD_HURT=${JSON.stringify(hurt)};\n`);
