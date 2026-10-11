// Offline visual audit using the same Renderer and engine modules as the game.
// Canvas captures support inspection; they do not substitute for browser approval.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const repo=resolve(option('--source')??'.'),directory=resolve(option('--output')??'docs/audit-20261010-render');
process.chdir(repo);await mkdir(directory,{recursive:true});
const require=createRequire(import.meta.url);let native;
try{native=require('@napi-rs/canvas');}catch(e){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw e;native=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);}
const {createCanvas,Image}=native;
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const mod=path=>import(pathToFileURL(`${repo}/src/${path}`).href);
 const [{Renderer},{FightEngine,CHARACTERS,FIXED_STEP},{StoryEngine},{resetFeet,evaluateRig,usesRig},{entityScale},{BONES,referenceJoints}]=await Promise.all([
 mod('render.js'),mod('engine.js'),mod('story.js'),mod('locomotion.js'),mod('story-world.js'),mod('locomotion-data.js')]);
const experimental=args.includes('--experimental-rig');
const canvas=createCanvas(1280,720),r=new Renderer(canvas,{experimentalActorRig:experimental}),ids=Object.keys(CHARACTERS),metrics=[];
await r.load(ids);await r.loadStory();
function scene(id,mode='versus',direction=1){
 const slot=direction>0?0:1,other=id==='rafael'?'marcelo':'rafael';
 const e=mode==='story'?new StoryEngine():new FightEngine({random:()=>.6});e.start(slot===0?id:other,mode==='story'?'story-solo':'local',slot===1?id:other);
 if(mode==='story'){e.queue(0,'storyNext');e.enemies=[];e.spawnWave=()=>{};}
 else e.phase='fight';
 for(const fighter of e.fighters)fighter.experimentalActorRig=experimental;
 const f=e.fighters[slot];f.x=direction>0?450:830;f.prevX=f.x;f.direction=direction;f.hp=1000;e.fighters[1-slot].x=direction>0?1180:110;resetFeet(f);return {e,f};
}
function step(e,count){for(let i=0;i<count;i++)e.update(FIXED_STEP);}
function until(e,predicate,label,limit=480){for(let tick=0;tick<limit;tick++){e.update(FIXED_STEP);if(predicate())return;}throw new Error(`Estado não alcançado: ${label}`);}
function draw(c,f,x,y,scale=1,overlay=false){
 c.save();c.translate(x,y);c.scale(scale,scale);c.translate(-f.x,-f.y);r.c=c;r.drawFighter(f);
 if(overlay&&r.experimentalActorRig&&usesRig(f)){const joints=evaluateRig(f,new Float64Array(34)),s=entityScale(f),sx=s*(f.character.visualWidth??1);c.strokeStyle='#54dbbd';c.lineWidth=1;
  for(const [a,b]of BONES){c.beginPath();c.moveTo(f.x+joints[a*2]*sx*f.direction,f.y+joints[a*2+1]*s);c.lineTo(f.x+joints[b*2]*sx*f.direction,f.y+joints[b*2+1]*s);c.stroke();}
  for(let a=0;a<17;a++){c.fillStyle=a===5||a===9?'#ffcc6e':'#f4fcff';c.beginPath();c.arc(f.x+joints[a*2]*sx*f.direction,f.y+joints[a*2+1]*s,2,0,Math.PI*2);c.fill();}
 }
 c.restore();
}
function label(c,text,x,y){c.fillStyle='#e1eaf5';c.font='14px Arial';c.fillText(text,x,y);}
const states=['idle','forward','backward','stop','crouch','preJump','jump','landing','block','hit','dizzy','knockdown','wake','punch','kick','crouchPunch','sweep','airPunch','airKick','special','uppercut','super','victory','ko'];
for(const id of ids){
 for(const direction of [1,-1]){
 const board=createCanvas(1440,2304),c=board.getContext('2d');c.fillStyle='#172334';c.fillRect(0,0,board.width,board.height);
 for(const [index,state]of states.entries()){
  const {e,f}=scene(id,'versus',direction);const x=index%4*360,y=Math.floor(index/4)*384;
  if(['forward','backward','stop'].includes(state)){const sign=direction*(state==='backward'?-1:1);e.setInput(f.slot,{right:sign>0,left:sign<0});step(e,48);if(state==='stop'){e.setInput(f.slot,{});step(e,16);}}
  else if(state==='crouch'){e.setInput(f.slot,{down:true});step(e,3);}
  else if(['preJump','jump','landing'].includes(state)){
   e.setInput(f.slot,{jump:true});step(e,1);e.setInput(f.slot,{});
   if(state==='jump')until(e,()=>f.airborne&&f.vy>=0,`${id} jump`);
   else if(state==='landing')until(e,()=>f.landing>0,`${id} landing`);
   else if(f.preJump<=0)throw new Error(`${id}: preJump ausente`);
  }
  else if(state==='block'){e.setInput(f.slot,{block:true});step(e,3);}
  else if(['punch','kick','crouchPunch','sweep','airPunch','airKick','special','uppercut','super'].includes(state)){
   f.meter=100;if(state.startsWith('air')){f.y-=100;f.prevY=f.y;f.vy=-100;}if(['sweep','crouchPunch'].includes(state))e.setInput(f.slot,{down:true});
   if(!e.beginMove(f,state,1))throw new Error(`${id}: golpe ${state} recusado`);
   until(e,()=>f.movePhase==='active',`${id} ${state} active`);
  }else if(['hit','knockdown'].includes(state)){
   const attacker=e.fighters[1-f.slot],move=state==='knockdown'?'uppercut':'punch';
   attacker.meter=100;if(!e.beginMove(attacker,move,1))throw new Error(`${id}: ataque de auditoria recusado`);
   e.hit({attacker,target:f,move,data:attacker.moveData,x:f.x,y:f.y-180});step(e,3);
  }else if(state==='dizzy'){f.state='dizzy';f.dizzyTime=1;}
  else if(state==='wake'){f.state='wake';f.wakeTime=.16;}
  else if(state==='victory')f.state='victory';else if(state==='ko'){f.state='ko';f.hp=0;f.knocked=true;}
  else step(e,30);
  draw(c,f,x+178,y+342,1,['idle','forward','backward'].includes(state));label(c,`${id} · ${state} → ${f.state}`,x+8,y+371);
 }
 await writeFile(`${directory}/${id}-states${direction<0?'-left':''}.webp`,board.toBuffer('image/webp'));
 }
 const {e,f}=scene(id);e.setInput(0,{right:true});let supportDrift=0,soleDrift=0,stretch=1,rootOffset=0,flip=0;const oldSoles=new Map(),ref=referenceJoints(id,new Float64Array(34));
 for(let tick=0;tick<130;tick++){
  const old=f.motion.feet.map(foot=>({...foot}));e.update(FIXED_STEP);const p=evaluateRig(f),s=entityScale(f),sx=s*(f.character.visualWidth??1);
  for(let side=0;side<2;side++)if(old[side].support&&f.motion.feet[side].support)supportDrift=Math.max(supportDrift,Math.hypot(old[side].x-f.motion.feet[side].x,old[side].lane-f.motion.feet[side].lane));
  for(const [h,k,a]of [[3,4,5],[7,8,9]]){const length=(v,a,b)=>Math.hypot(v[a*2]-v[b*2],v[a*2+1]-v[b*2+1]);stretch=Math.max(stretch,(length(p,h,k)+length(p,k,a))/(length(ref,h,k)+length(ref,k,a)));}
  rootOffset=Math.max(rootOffset,Math.abs(p[0]-ref[0]));
  r.c=canvas.getContext('2d');r.c.clearRect(0,0,1280,720);r.drawFighter(f);
  const rig=r.locomotionRigs?.[id];if(!rig)continue;
  for(const [i,j,k]of rig.triangles){const q=rig.positions,area=(q[j*2]-q[i*2])*(q[k*2+1]-q[i*2+1])-(q[j*2+1]-q[i*2+1])*(q[k*2]-q[i*2]);if(area<=0)flip++;}
  for(const [i,v]of rig.vertices.entries()){
   const side=v.first===5?0:v.first===9?1:-1;if(side<0||v.weight!==1||v.sy<rig.height*.98)continue;
   const foot=f.motion.feet[side],x=f.x+rig.positions[i*2]*f.direction*sx,y=f.y+rig.positions[i*2+1]*s,last=oldSoles.get(i);
   if(last?.support&&foot.support&&last.lift===0&&foot.lift===0)soleDrift=Math.max(soleDrift,Math.hypot(x-last.x,y-last.y));oldSoles.set(i,{x,y,support:foot.support,lift:foot.lift});
  }
 }
 metrics.push({id,maxSupportDrift:supportDrift,maxRenderedSoleDrift:r.locomotionRigs?.[id]?soleDrift:null,maxLegLengthRatio:stretch,maxPelvisOffset:rootOffset,flippedTriangles:flip});
 console.log(`${id}: estados e contato capturados`);
}
// Approved portrait and actual renderer samples, at equal world scale. Original
// private photographs are inspected separately and never copied into this repo.
const identity=createCanvas(1800,1440),ic=identity.getContext('2d');ic.fillStyle='#172334';ic.fillRect(0,0,1800,1440);
for(const [i,id]of ids.entries()){
 const x=i%3*600,y=Math.floor(i/3)*360;const portrait=r.portraits[id];ic.drawImage(portrait,x+10,y+100,120,122);label(ic,'Retrato aprovado',x+8,y+250);
 const idle=scene(id),walk=scene(id);step(idle.e,30);walk.e.setInput(0,{right:true});step(walk.e,48);
 draw(ic,idle.f,x+270,y+320,.82);draw(ic,walk.f,x+455,y+320,.82);label(ic,id,x+150,y+344);label(ic,'idle',x+225,y+344);label(ic,'caminhada',x+408,y+344);
}
await writeFile(`${directory}/identity-render.webp`,identity.toBuffer('image/webp'));
await writeFile(`${directory}/metrics.json`,JSON.stringify({renderer:'game Canvas Renderer',experimentalActorRig:r.experimentalActorRig===true,source:repo,metrics,browserApproval:false},null,2)+'\n');
if(args.includes('--video')){
 const movie=createCanvas(1440,1080),c=movie.getContext('2d'),scenes=ids.map(id=>scene(id));
 const ffmpeg=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1440x1080','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p',`${directory}/roster-motion.mp4`],{stdio:['pipe','ignore','inherit']});const finished=once(ffmpeg,'close');
 for(let frame=0;frame<240;frame++){
  c.fillStyle='#172334';c.fillRect(0,0,1440,1080);
  const mode=frame<60?'idle':frame<120?'forward':frame<180?'backward':'stop';
  for(const [i,{e,f}]of scenes.entries()){
   e.setInput(0,{right:mode==='forward',left:mode==='backward'});e.update(1/60);draw(c,f,i%4*360+180,Math.floor(i/4)*360+325,.88,true);label(c,`${ids[i]} · ${mode}`,i%4*360+8,Math.floor(i/4)*360+348);
  }
  if(!ffmpeg.stdin.write(Buffer.from(c.getImageData(0,0,1440,1080).data)))await once(ffmpeg.stdin,'drain');
  if(frame%60===0)console.log(`vídeo ${frame}/240`);
 }
 ffmpeg.stdin.end();const [code]=await finished;if(code)throw new Error(`ffmpeg: ${code}`);
}
console.log(JSON.stringify({directory,metrics}));
