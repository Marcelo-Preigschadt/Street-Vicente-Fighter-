// Offline rendering of the real compositor and simulation. No browser claim.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const args=process.argv.slice(2),option=n=>args[args.indexOf(n)+1];
const repo=process.cwd(),out=resolve(option('--output')||'docs/audit-story-20261012');
await mkdir(out,{recursive:true});
const require=createRequire(import.meta.url),{createCanvas,Image}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image {set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const [{Renderer},{StoryEngine},{CHARACTERS,FIXED_STEP},{storyHeroPose,storyHandSocket},{drawStoryHero}]=await Promise.all([
 import('../src/render.js'),import('../src/story.js'),import('../src/engine.js'),import('../src/story-hero.js'),import('../src/story-hero.js')
]);
const canvas=createCanvas(1280,720),r=new Renderer(canvas),ids=Object.keys(CHARACTERS);
await r.load(ids);await r.loadStory();
function game(id,act=0){const e=new StoryEngine({onEvent:v=>r.event(v)});e.start(id,'story-solo','rafael',{act});e.queue(0,'storyNext');e.props=[];e.hazards=[];e.checkProgress=()=>{};return e;}
const advance=(e,n)=>{for(let i=0;i<n;i++)e.update(FIXED_STEP);};
const metrics={browserPlaytest:'not_run',realCompositor:true,heroes:[],entry:[],powerSamples:[],versusPixels:[]};

// Gallery of all twelve real story walkers. Each tile is cropped from the
// story compositor, so background/feet share the moving world coordinates.
const games=ids.map(id=>game(id)),gallery=createCanvas(1440,840),gc=gallery.getContext('2d'),samples=createCanvas(1440,840*3),sc=samples.getContext('2d');
const encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1440x840','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p',`${out}/story-walk.mp4`],{stdio:['pipe','ignore','inherit']});const done=once(encoder,'close');
for(let frame=0;frame<150;frame++){
 gc.fillStyle='#182b37';gc.fillRect(0,0,1440,840);
 for(const [i,e]of games.entries()){
  const f=e.fighters[0],phase=frame<15?'idle':frame<85?'walk':frame<100?'stop':frame<135?'depth':'stop';
  e.setInput(0,{right:phase==='walk',up:phase==='depth'});advance(e,4);r.draw(e,1/30,1);
  const x=(i%4)*360,y=Math.floor(i/4)*280,fx=f.x-(r.storyViewCamera??0);
  gc.drawImage(canvas,fx-180,360,360,280,x,y,360,280);
  gc.fillStyle='#fff';gc.font='15px Arial';gc.fillText(`${f.character.name} / ${phase}`,x+7,y+20);
 }
 if([40,85,130].includes(frame))sc.drawImage(gallery,0,[40,85,130].indexOf(frame)*840);
 if(!encoder.stdin.write(Buffer.from(gc.getImageData(0,0,1440,840).data)))await once(encoder.stdin,'drain');
}
encoder.stdin.end();if((await done)[0])throw Error('Video encoding failed');
await writeFile(`${out}/story-walk.webp`,samples.toBuffer('image/webp'));
metrics.heroes=games.map(e=>({id:e.fighters[0].character.id,worldTravel:e.fighters[0].walkDistance,pose:storyHeroPose(e.fighters[0])}));
console.log('Story walkers: twelve heroes, real engine/compositor');

// All four wave entrances, including actors approaching from behind.
const entrance=createCanvas(1280,720),ec=entrance.getContext('2d'),entrances=[0,1,2,3].map(act=>{const e=game('marcelo',act);e.fighters[0].x=600;e.fighters[0].prevX=600;e.spawnWave();return e;});
const incoming=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1280x720','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p',`${out}/enemy-entrances.mp4`],{stdio:['pipe','ignore','inherit']});const incomingDone=once(incoming,'close');
for(let frame=0;frame<210;frame++){
 for(const [act,e]of entrances.entries()){
  const before=e.enemies.map(v=>v.x);advance(e,4);r.draw(e,1/30,1);
  ec.drawImage(canvas,(act%2)*640,Math.floor(act/2)*360,640,360);
  const max=e.enemies.reduce((n,v,i)=>Math.max(n,Math.abs(v.x-before[i])),0);
  metrics.entry[act]??={act:act+1,maxTravelPerVideoFrame:0,visibleFrames:0};metrics.entry[act].maxTravelPerVideoFrame=Math.max(metrics.entry[act].maxTravelPerVideoFrame,max);
  if(e.enemies.some(v=>v.x>e.camera&&v.x<e.camera+1280))metrics.entry[act].visibleFrames++;
 }
 if(!incoming.stdin.write(Buffer.from(ec.getImageData(0,0,1280,720).data)))await once(incoming.stdin,'drain');
 if(frame===100)await writeFile(`${out}/enemy-entrances.webp`,entrance.toBuffer('image/webp'));
}
incoming.stdin.end();if((await incomingDone)[0])throw Error('Entrance encoding failed');
console.log('Wave entrances: all four acts');

// Charge, first release and later volley: the tiny marker records the socket
// inspected against the painted hand. Everything else is the actual renderer.
const powers=createCanvas(1200,12*235),pc=powers.getContext('2d');pc.fillStyle='#182b37';pc.fillRect(0,0,powers.width,powers.height);
for(const [row,id]of ids.entries())for(const [col,phase]of ['charge','release','volley'].entries()){
 r.superFX.clear();r.fightFX.clear();
 const e=game(id),f=e.fighters[0],move=phase==='volley'?'super':'special';f.x=620;f.prevX=f.x;f.meter=100;e.beginMove(f,move);
 const wanted=phase==='charge'?f.moveData.startup*.7:phase==='release'?f.moveData.startup+.008:f.moveData.startup+.23;
 for(let n=0;n<200&&f.actionTime<wanted;n++){e.update(FIXED_STEP);r.superFX.update(FIXED_STEP);r.fightFX.update(FIXED_STEP);r.clock+=FIXED_STEP;}
 r.draw(e,0,1);const hand=storyHandSocket(f),x=col*400,y=row*235;
 pc.drawImage(canvas,440,390,400,235,x,y,400,235);
 pc.strokeStyle='#fff';pc.lineWidth=1;pc.beginPath();pc.arc(x+hand.x-440,y+hand.y+f.lane-625-390,3,0,Math.PI*2);pc.stroke();
 pc.fillStyle='#fff';pc.font='14px Arial';pc.fillText(`${id} / ${phase}`,x+5,y+16);
 metrics.powerSamples.push({id,move,phase,pose:storyHeroPose(f),hand,projectiles:e.projectiles.map(p=>({originX:p.originX,originY:p.originY,lane:p.lane}))});
}
await writeFile(`${out}/power-hands.webp`,powers.toBuffer('image/webp'));
console.log('Power origins: twelve heroes, three phases');

// Byte-for-byte visual comparison against the deployed version, including
// every fighter's walk, charge and release. Baseline code imports separately.
const baseline=option('--baseline');
if(baseline){
 const baseRoot=resolve(baseline),[{Renderer:OldRenderer},{Fighter:OldFighter}]=await Promise.all([
  import(pathToFileURL(`${baseRoot}/src/render.js`)),import(pathToFileURL(`${baseRoot}/src/engine.js`))]);
 const oldCanvas=createCanvas(440,390),oldR=new OldRenderer(oldCanvas),cv=createCanvas(440,390),c=cv.getContext('2d');
 // Assets and all versus drawing modules must match before comparing output.
 for(const name of ['engine.js','render.js','native-walk.js','motion.js','sprite-loader.js','locomotion.js','locomotion-render.js']){
  if(!(await readFile(`${repo}/src/${name}`)).equals(await readFile(`${baseRoot}/src/${name}`)))throw Error(`Versus source changed: ${name}`);
 }
 oldR.sheets=r.sheets;oldR.clock=1.25;r.clock=1.25;
 for(const id of ids)for(const state of ['walk','special','super'])for(const q of [.4,1.1]){
  const f=new OldFighter(id,0),e=game(id);f.x=220;f.prevX=220;f.y=365;f.prevY=365;f.direction=1;f.state=state;
  if(state==='walk'){f.walkDistance=q*200;f.walkBlend=1;}else{const tmp=e.fighters[0];tmp.meter=100;e.beginMove(tmp,state);f.moveData=tmp.moveData;f.action=state;f.actionTime=f.moveData.startup*q;}
  for(const [ctx,renderer]of [[oldCanvas.getContext('2d'),oldR],[c,r]]){ctx.fillStyle='#182b37';ctx.fillRect(0,0,440,390);renderer.c=ctx;renderer.drawFighter(f);}
  const a=Buffer.from(oldCanvas.getContext('2d').getImageData(0,0,440,390).data),b=Buffer.from(c.getImageData(0,0,440,390).data);
  if(!a.equals(b))throw Error(`Versus pixels changed: ${id}/${state}/${q}`);
  metrics.versusPixels.push({id,state,q,sha256:createHash('sha256').update(a).digest('hex')});
 }
 r.c=canvas.getContext('2d');console.log(`${metrics.versusPixels.length} versus samples match the deployed pixels exactly`);
}
await writeFile(`${out}/metrics.json`,JSON.stringify(metrics,null,2)+'\n');
