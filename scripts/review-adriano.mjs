// Captures the actual game renderer and engine. Offline evidence is explicitly
// separate from an interactive browser or a physical USB-controller playtest.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async p=>new Response(await readFile(p.split('?')[0]));
const [{Renderer},{FightEngine,FIXED_STEP,fighterPose},{StoryEngine},{storyHeroPose},{entityScale}]=await Promise.all([
 import('../src/render.js'),import('../src/engine.js'),import('../src/story.js'),import('../src/story-hero.js'),import('../src/story-world.js')]);
const output='docs/adriano-review';await mkdir(output,{recursive:true});
const canvas=createCanvas(1280,720),renderer=new Renderer(canvas);
await renderer.load(['adriano','ruan','rafael']);await renderer.loadStory();
const metrics={renderer:'actual Renderer',browserPlaytest:false,physicalUsbController:false,clips:[]};
for(const mode of ['versus','story']){
 const events=[];
 const engine=mode==='story'?new StoryEngine({onEvent:e=>{events.push(e);renderer.event(e);}}):new FightEngine({random:()=>.5,onEvent:e=>{events.push(e);renderer.event(e);}});
 engine.start('adriano',mode==='story'?'story-solo':'local',mode==='story'?'rafael':'ruan');
 if(mode==='story'){
  engine.queue(0,'storyNext');engine.enemies=[];engine.props=[];engine.hazards=[];engine.checkProgress=()=>{};engine.spawnWave=()=>{};
  const target=engine.spawnEnemy('lab',760,625);target.cooldown=999;target.aiTime=999;target.hitstun=999;target.hp=5000;target.maxHp=5000;
 }else engine.phase='fight';
 const f=engine.fighters[0];f.x=f.prevX=350;engine.fighters[1].x=engine.fighters[1].prevX=800;f.meter=100;
 const encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1280x720','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p',`${output}/${mode}.mp4`],{stdio:['pipe','ignore','inherit']});
 const finished=once(encoder,'close'),board=createCanvas(1280,460),context=board.getContext('2d');
 context.fillStyle='#1c2836';context.fillRect(0,0,1280,460);
 const samples=[0,25,45,68,95,130,177,211],actions=new Map([[45,['punch',0]],[68,['kick',2]],[95,['special',1]],[130,['uppercut',1]],[177,['super',1]]]);
 const seen=new Set(),walk=new Set();
 for(let frame=0;frame<240;frame++){
  engine.setInput(0,{right:frame>=4&&frame<25,left:frame>=27&&frame<39});
  if(actions.has(frame)){engine.clearAction(f);f.landing=0;f.preJump=0;f.hitstun=0;f.blockstun=0;f.meter=100;engine.queue(0,...actions.get(frame));}
  for(let tick=0;tick<4;tick++)engine.update(FIXED_STEP);
  const pose=mode==='story'?storyHeroPose(f):fighterPose(f);seen.add(`${pose.atlas}:${pose.index}`);if(pose.atlas==='motion')walk.add(pose.index);
  renderer.draw(engine,1/30,1);
  if(samples.includes(frame)){const n=samples.indexOf(frame);context.drawImage(canvas,n%4*320,Math.floor(n/4)*230,320,180);context.fillStyle='white';context.font='14px DejaVu Sans';context.fillText(`${mode} ${frame/30}s ${pose.atlas}:${pose.index}`,n%4*320+5,Math.floor(n/4)*230+205);}
  if(!encoder.stdin.write(Buffer.from(canvas.getContext('2d').getImageData(0,0,1280,720).data)))await once(encoder.stdin,'drain');
 }
 encoder.stdin.end();const [code]=await finished;if(code)throw Error(`ffmpeg ${mode}: ${code}`);
 await writeFile(`${output}/${mode}-samples.webp`,board.toBuffer('image/webp'));
 metrics.clips.push({mode,frames:240,fps:30,duration:8,posesSeen:[...seen],walkingFrames:[...walk],worldScale:entityScale(f),powerEvents:events.filter(e=>e.type==='special').map(e=>({move:e.move,name:e.name})),invalidState:[f.x,f.y,f.hp,f.meter].some(v=>!Number.isFinite(v))});
}
await writeFile(`${output}/renderer-metrics.json`,JSON.stringify(metrics,null,2)+'\n');
console.log(JSON.stringify(metrics));
