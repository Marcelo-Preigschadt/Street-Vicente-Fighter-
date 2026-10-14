// Actual game engine/renderer, scripted inputs. This does not represent a
// manual browser playtest or certify the full roster's animation quality.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async p=>new Response(await readFile(p.split('?')[0]));
const [{Renderer},{FightEngine,FIXED_STEP,fighterPose},{storyHeroGeometry},{adrianoHurt}]=await Promise.all([
 import('../src/render.js'),import('../src/engine.js'),import('../src/story-hero.js'),import('../src/adriano.js')]);
const out='docs/adriano-transitions';await mkdir(out,{recursive:true});
const canvas=createCanvas(1280,720),r=new Renderer(canvas),c=r.c;
await r.load(['adriano','rafael']);
function legacy(f){
 if(f.moveData&&['punch','kick'].includes(f.state)){
  const active=f.actionTime>=f.moveData.startup&&f.actionTime<f.moveData.startup+f.moveData.active;
  return {sheet:r.sheets.adriano.strike,index:(f.state==='kick'?8:2)+Number(active)};
 }
 return r.poseFor(f);
}
const encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1280x720','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',`${out}/comparison.mp4`],{stdio:['pipe','ignore','inherit']});
const finished=once(encoder,'close');
const e=new FightEngine({random:()=>.5,onEvent:event=>r.event(event)});e.start('adriano','local','rafael');e.phase='fight';
const f=e.fighters[0];f.x=f.prevX=320;e.fighters[1].x=1150;
const starts=new Map([[20,'punch'],[70,'punch'],[125,'kick'],[195,'kick'],[265,'punch'],[315,'kick']]);
const seen={punch:new Set(),kick:new Set()},samples=createCanvas(1600,800),sc=samples.getContext('2d');
sc.fillStyle='#182633';sc.fillRect(0,0,1600,800);
const sampleTimes=[.02,.28,.52,.82];
for(let frame=0;frame<390;frame++){
 if(starts.has(frame)){e.clearAction(f);e.beginMove(f,starts.get(frame),1);}
 for(let tick=0;tick<2;tick++)e.update(FIXED_STEP);
 const pose=fighterPose(f);if(seen[f.action])seen[f.action].add(`${pose.atlas}:${pose.index}`);
 c.fillStyle='#182633';c.fillRect(0,0,1280,720);
 c.fillStyle='#293b49';c.fillRect(0,625,1280,95);
 c.strokeStyle='#55727e';c.beginPath();c.moveTo(0,625);c.lineTo(1280,625);c.stroke();
 c.strokeStyle='#718a95';c.beginPath();c.moveTo(640,35);c.lineTo(640,680);c.stroke();
 c.fillStyle='white';c.textAlign='center';c.font='bold 28px DejaVu Sans';
 c.fillText('ANTES · 2 POSES',320,62);c.fillText('PILOTO · TRANSIÇÕES DESENHADAS',960,62);
 c.font='20px DejaVu Sans';c.fillStyle='#cae0e7';
 c.fillText('Mesmo tempo de preparação, contato e recuperação',640,116);
 c.fillText(f.action==='punch'?'SOCO MÉDIO':f.action==='kick'?'CHUTE MÉDIO':'GUARDA',640,178);
 f.x=320;r.drawShadow(f);r.drawFighter(f,legacy(f));
 f.x=960;r.drawShadow(f);r.drawFighter(f);f.x=320;
 c.font='17px DejaVu Sans';c.fillStyle='#cae0e7';
 c.fillText('Reprodução pelo motor e renderer do jogo · 60 FPS · sem efeitos extras',640,678);
 if(f.action){
  const row=f.action==='punch'?0:1,m=f.moveData,q=f.actionTime/(m.startup+m.active+m.recovery);
  for(let i=0;i<sampleTimes.length;i++)if(Math.abs(q-sampleTimes[i])<.025&&(row===0?frame<70:frame<195)){
   sc.fillStyle='#182633';sc.fillRect(i*400,row*400,400,400);
   sc.drawImage(canvas,720,290,480,365,i*400,row*400+10,400,305);
   sc.fillStyle='white';sc.font='17px DejaVu Sans';sc.fillText(`${f.action} ${Math.round(q*100)}% · ${pose.atlas}:${pose.index}`,i*400+12,row*400+350);
  }
 }
 if(!encoder.stdin.write(Buffer.from(c.getImageData(0,0,1280,720).data)))await once(encoder.stdin,'drain');
}
encoder.stdin.end();const [code]=await finished;if(code)throw Error(`ffmpeg: ${code}`);
await writeFile(`${out}/sequence-samples.webp`,samples.toBuffer('image/webp'));
const geometry=[];
for(const move of ['punch','kick']){
 e.clearAction(f);e.beginMove(f,move,1);const m=f.moveData;
 for(let time=0;time<m.startup+m.active+m.recovery;time+=FIXED_STEP){
  f.actionTime=time;const p=fighterPose(f),g=storyHeroGeometry(f,p);
  if(!g||JSON.stringify(adrianoHurt(f))!==JSON.stringify(g.hurt))throw Error(`Geometry mismatch ${move} ${time}`);
 }
 geometry.push({move,geometryMatchesVersusAndStory:true});
}
const report={scriptedRenderer:true,manualPlaytest:false,fps:60,seconds:6.5,
 posesSeen:Object.fromEntries(Object.entries(seen).map(([k,v])=>[k,[...v]])),geometry,
 scope:'Adriano medium punch and medium kick only; existing contact poses/timing retained'};
await writeFile(`${out}/validation.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
