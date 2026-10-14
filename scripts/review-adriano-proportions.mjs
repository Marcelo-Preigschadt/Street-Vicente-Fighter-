// Compare the actual renderers at equal ground lines and retain the original
// bitmap bytes. This evidence does not replace an interactive playtest.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async p=>new Response(await readFile(p.split('?')[0]));
const [{Renderer},{Fighter,CHARACTERS},{drawStoryHero,storyHeroPose,STORY_WALK_STRIDE},{STORY_WORLD,entityScale},{NATIVE_WALK_STRIDES}]=await Promise.all([
 import('../src/render.js'),import('../src/engine.js'),import('../src/story-hero.js'),import('../src/story-world.js'),import('../src/native-walk.js')]);
const canvas=createCanvas(1280,1440),r=new Renderer(canvas),c=r.c;
await r.load(Object.keys(CHARACTERS));
const old=JSON.parse(await readFile('assets/runtime/adriano-v1.json'));
const current=r.sheets.adriano;
const original={...current};
for(const [atlas,profile] of Object.entries(old.atlases)){
 const sheet=atlas==='base'?current:current[atlas];
 const copy={...sheet,scale:profile.scale,frames:sheet.frames.map((frame,i)=>({...frame,...profile.frames[i]}))};
 if(atlas==='base')Object.assign(original,copy);else original[atlas]=copy;
}
const oldWalk=JSON.parse(await readFile('assets/story/adriano-walk-v1.json'));
original.motion={...current.motion,frames:current.motion.frames.map((frame,i)=>({...frame,...oldWalk[i]}))};
const report={scaleReductionPercent:12,originalBitmapsPreserved:true,comparisons:[],roster:[]};
for(const stem of ['assets/runtime/adriano','assets/story/adriano-walk'])assert.deepEqual(await readFile(`${stem}-v2.webp`),await readFile(`${stem}-v1.webp`));
c.fillStyle='#1c2836';c.fillRect(0,0,1280,1440);
for(const [i,id] of Object.keys(CHARACTERS).entries()){
 const f=new Fighter(id,0);f.x=i%4*320+160;f.y=Math.floor(i/4)*360+330;f.animTime=0;
 const {sheet,index}=r.poseFor(f),frame=sheet.frames[index],scale=frame.scale??sheet.scale;
 r.drawFighter(f);const dimensions={id,width:frame.w*scale*(f.character.visualWidth??1),height:frame.h*scale};report.roster.push(dimensions);
 c.strokeStyle='#52656a';c.beginPath();c.moveTo(i%4*320+10,f.y);c.lineTo(i%4*320+310,f.y);c.stroke();
 c.fillStyle='white';c.font='15px DejaVu Sans';c.fillText(`${id}: ${Math.round(dimensions.width)} × ${Math.round(dimensions.height)}`,i%4*320+10,f.y+20);
}
await writeFile('docs/adriano-review/roster-proportions-v2.webp',canvas.toBuffer('image/webp'));
canvas.height=1080;c.fillStyle='#1c2836';c.fillRect(0,0,1280,1080);
for(const [row,mode] of ['versus idle','versus walk','story idle'].entries())for(const [col,id] of ['adriano','adriano','rafael','ruan'].entries()){
 const before=col===0;r.sheets.adriano=before?original:current;
 const f=new Fighter(id,0);f.x=col*320+160;f.y=row*360+330;f.animTime=0;
 const story=mode.startsWith('story');if(story)f.worldScale=STORY_WORLD.actorScale;
 if(mode.endsWith('walk')){f.state='walk';f.walkBlend=1;f.walkDistance=(story?STORY_WALK_STRIDE:NATIVE_WALK_STRIDES[id])*entityScale(f)*.3;}
 const pose=story?storyHeroPose(f):null;
 const selected=story?{sheet:pose.atlas==='base'?r.sheets[id]:r.sheets[id][pose.atlas],index:pose.index}:r.poseFor(f);
 const frame=selected.sheet.frames[selected.index],scale=(frame.scale??selected.sheet.scale)*entityScale(f);
 if(story)drawStoryHero(r,f,{effects:false});else r.drawFighter(f);
 report.comparisons.push({mode,id,before,width:frame.w*scale*(f.character.visualWidth??1),height:frame.h*scale});
 c.strokeStyle='#52656a';c.beginPath();c.moveTo(col*320+10,f.y);c.lineTo(col*320+310,f.y);c.stroke();
 c.fillStyle='white';c.font='14px DejaVu Sans';c.fillText(`${mode}: ${id}${before?' antes':' agora'}`,col*320+10,f.y+20);
}
r.sheets.adriano=current;
await writeFile('docs/adriano-review/proportion-comparison-v2.webp',canvas.toBuffer('image/webp'));
await writeFile('docs/adriano-review/proportion-metrics-v2.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
