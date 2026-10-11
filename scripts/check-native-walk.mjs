// Capture the real whole-pose renderer and movement engines. These controlled
// offline scenes compare animation; they are not a browser gameplay approval.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const args=process.argv.slice(2),opt=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const repo=resolve(opt('--source')??'.'),output=resolve(opt('--output')??'docs/audit-20261011-heroes');
process.chdir(repo);await mkdir(output,{recursive:true});
const require=createRequire(import.meta.url),{createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async p=>new Response(await readFile(p.split('?')[0]));
const mod=path=>import(pathToFileURL(`${repo}/src/${path}`).href);
const [{Renderer},{FightEngine,CHARACTERS,FIXED_STEP,fighterPose},{StoryEngine},{resetFeet},{entityScale}]=await Promise.all([mod('render.js'),mod('engine.js'),mod('story.js'),mod('locomotion.js'),mod('story-world.js')]);
const ids=Object.keys(CHARACTERS),canvas=createCanvas(1536,1020),c=canvas.getContext('2d'),renderer=new Renderer(canvas);
await renderer.load(ids);
function scene(id,mode,slot=0){
 const other=id==='rafael'?'marcelo':'rafael',e=mode==='story'?new StoryEngine():new FightEngine({random:()=>.5});
 e.start(slot?other:id,mode==='story'?'story-solo':'local',slot?id:other);
 if(mode==='story'){e.queue(0,'storyNext');e.enemies=[];e.props=[];e.hazards=[];e.checkProgress=()=>{};e.spawnWave=()=>{};}
 else e.phase='fight';
 const f=e.fighters[slot];f.x=slot?900:290;f.prevX=f.x;f.direction=slot?-1:1;
 e.fighters[1-slot].x=slot?100:1180;
 resetFeet(f);return {e,f};
}
function paint(ctx,f,x,y,size=1){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.translate(-f.x,-f.y);renderer.c=ctx;renderer.drawFighter(f);ctx.restore();
}
const metrics={source:repo,renderer:'actual game Renderer',browserApproval:false,controlledOfflineScene:true,characters:[]};
for(const mode of ['versus','story']){
 const scenes=ids.map(id=>scene(id,mode));
 const perHero=ids.map(id=>({id,mode,posesSeen:[],distanceDuringForward:0,forwardFrameChanges:0,backwardFrameChanges:0,scaledHeight:0}));
 const frames=360,fps=60;
 let encoder,finished;
 if(args.includes('--video')){encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1536x1020','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p',`${output}/${mode}-walk.mp4`],{stdio:['pipe','ignore','inherit']});finished=once(encoder,'close');}
 const sheet=createCanvas(1536,1020*3),sc=sheet.getContext('2d');
 for(let frame=0;frame<frames;frame++){
  const second=frame/fps,phase=second<1?'idle':second<2?'forward':second<3?'stop':second<4?'backward':second<5?(mode==='story'?'depth':'forward'):'stop';
  c.fillStyle='#1c2836';c.fillRect(0,0,canvas.width,canvas.height);
  for(const [i,{e,f}]of scenes.entries()){
   // Story turns to the direction pressed. Keep that world input fixed;
   // deriving it from the newly flipped facing would alternate left/right.
   const sign=mode==='story'?(phase==='backward'?-1:1):f.direction*(phase==='backward'?-1:1),previous=fighterPose(f),oldDistance=f.walkDistance;
   e.setInput(0,{right:['forward','backward'].includes(phase)&&sign>0,left:['forward','backward'].includes(phase)&&sign<0,up:phase==='depth'});
   e.update(FIXED_STEP);e.update(FIXED_STEP);
   const pose=fighterPose(f),key=`${pose.atlas}:${pose.index}`,m=perHero[i];
   if(!m.posesSeen.includes(key))m.posesSeen.push(key);
   if(phase==='forward'&&second<2){m.distanceDuringForward+=f.walkDistance-oldDistance;if(key!==`${previous.atlas}:${previous.index}`)m.forwardFrameChanges++;}
   if(phase==='backward'&&key!==`${previous.atlas}:${previous.index}`)m.backwardFrameChanges++;
   const x=i%4*384,y=Math.floor(i/4)*340,s=entityScale(f);
   c.strokeStyle='#60737c';c.beginPath();c.moveTo(x+8,y+315);c.lineTo(x+376,y+315);c.stroke();
   // Ticks are anchored to the simulated world rather than to the actor.
   for(let world=Math.floor((f.x-220)/50)*50;world<f.x+220;world+=50){const gx=x+192+world-f.x;c.beginPath();c.moveTo(gx,y+312);c.lineTo(gx,y+323);c.stroke();}
   paint(c,f,x+192,y+315+(f.y-625)+(mode==='story'?f.lane-625:0));
   c.fillStyle='#f1eadc';c.font='15px Arial';c.fillText(`${f.character.name} · ${mode==='story'&&phase==='backward'?'left':phase}`,x+9,y+23);
   c.fillText(`${mode} · ${pose.atlas}[${pose.index}]`,x+9,y+333);
   const selected=renderer.poseFor(f),sprite=selected.sheet.frames[selected.index];
   m.scaledHeight=Math.round(sprite.h*(sprite.scale??selected.sheet.scale)*s*1000)/1000;
  }
  if([90,210,270].includes(frame))sc.drawImage(canvas,0,[90,210,270].indexOf(frame)*1020);
  if(encoder&&!encoder.stdin.write(Buffer.from(c.getImageData(0,0,canvas.width,canvas.height).data)))await once(encoder.stdin,'drain');
 }
 if(encoder){encoder.stdin.end();const [code]=await finished;if(code)throw new Error(`ffmpeg ${mode}: ${code}`);}
 await writeFile(`${output}/${mode}-samples.webp`,sheet.toBuffer('image/webp'));
 metrics.characters.push(...perHero);
 console.log(`${mode}: ${ids.length} heróis / 360 frames do motor real`);
}
// Equal-scale standing/recovery samples make pose-selection defects visible.
const recovery=createCanvas(800,430),rc=recovery.getContext('2d');rc.fillStyle='#1c2836';rc.fillRect(0,0,800,430);
for(const [i,state]of ['idle','wake'].entries()){
 const {f}=scene('luciana','versus');f.state=state;f.animTime=0;
 paint(rc,f,200+i*400,385);rc.fillStyle='#fff';rc.font='18px Arial';rc.fillText(`Luciana ${state} → ${JSON.stringify(fighterPose(f))}`,i*400+8,26);
}
await writeFile(`${output}/luciana-recovery.webp`,recovery.toBuffer('image/webp'));
await writeFile(`${output}/native-walk-metrics.json`,JSON.stringify(metrics,null,2)+'\n');
