// Exercises the shipping Canvas compositor and simulation, including foot-lock metrics.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Renderer} from '../src/render.js';
import {FightEngine,CHARACTERS,FIXED_STEP} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {evaluateRig,resetFeet} from '../src/locomotion.js';
import {entityScale} from '../src/story-world.js';
import {referenceJoints} from '../src/locomotion-data.js';
const require=createRequire(import.meta.url);let canvasModule;try{canvasModule=require('@napi-rs/canvas');}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('Instale @napi-rs/canvas para a conferência visual (os testes de simulação não dependem dele).',{cause:error});canvasModule=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);}const {createCanvas,Image}=canvasModule;
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});globalThis.Image=class extends Image{set src(path){super.src=typeof path==='string'?path.split('?')[0]:path;}get src(){return super.src;}};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const directory=process.argv[2]??'/tmp/svf-locomotion';await mkdir(directory,{recursive:true});
const canvas=createCanvas(1280,720),r=new Renderer(canvas);await r.load(Object.keys(CHARACTERS));await r.loadStory();
const ids=['marcelo','rafael','gustavo','tais'],metrics=[];
for(const id of ids){
 const g=new FightEngine({random:()=>.6});g.start(id,'local',id==='rafael'?'marcelo':'rafael');g.phase='fight';g.fighters[0].x=270;g.fighters[1].x=1170;
 const f=g.fighters[0];f.prevX=f.x;resetFeet(f);const sheet=createCanvas(1280,740),c=sheet.getContext('2d');c.fillStyle='#090d14';c.fillRect(0,0,1280,740);
 let maxDrift=0,maxStretch=0,maxSoleDrift=0;const reference=referenceJoints(id,new Float64Array(34)),soleSamples=new Map();g.setInput(0,{right:true});
 for(let frame=0;frame<120;frame++){
  const anchors=f.motion.feet.map(foot=>({...foot}));g.update(1/60);
  for(let i=0;i<2;i++)if(anchors[i].support&&f.motion.feet[i].support)maxDrift=Math.max(maxDrift,Math.abs(anchors[i].x-f.motion.feet[i].x),Math.abs(anchors[i].lane-f.motion.feet[i].lane));
  const p=evaluateRig(f),distance=(v,a,b)=>Math.hypot(v[a*2]-v[b*2],v[a*2+1]-v[b*2+1]);
  for(const [h,k,a]of [[3,4,5],[7,8,9]])maxStretch=Math.max(maxStretch,(distance(p,h,k)+distance(p,k,a))/(distance(reference,h,k)+distance(reference,k,a)));
  r.c=canvas.getContext('2d');r.c.clearRect(0,0,1280,720);r.drawFighter(f);const rig=r.locomotionRigs[id];
  for(let i=0;i<rig.vertices.length;i++){const v=rig.vertices[i],side=v.first===5?0:v.first===9?1:-1;if(side<0||v.weight!==1||v.sy<rig.height*.98)continue;const foot=f.motion.feet[side],x=f.x+rig.positions[i*2]*f.direction*entityScale(f),y=f.y+rig.positions[i*2+1]*entityScale(f),last=soleSamples.get(i);
   if(last?.support&&foot.support&&last.lift===0&&foot.lift===0)maxSoleDrift=Math.max(maxSoleDrift,Math.hypot(x-last.x,y-last.y));soleSamples.set(i,{x,y,support:foot.support,lift:foot.lift});}
  if(frame%15===0&&frame<120){const sample=frame/15;c.save();c.translate((sample%4)*320+150-f.x,Math.floor(sample/4)*360+325-f.y);r.c=c;r.drawFighter(f);c.restore();c.fillStyle='#d6e4eb';c.font='15px Arial';c.fillText(`${id} · ${f.motion.state} · ${frame}/60 s`,sample%4*320+12,Math.floor(sample/4)*360+347);}
  if(frame<72&&id==='marcelo'){r.c=canvas.getContext('2d');r.c.fillStyle='#000';r.c.fillRect(0,0,1280,720);r.drawFighter(f);await writeFile(`${directory}/walk-${String(frame).padStart(3,'0')}.png`,canvas.toBuffer('image/png'));}
 }
 await writeFile(`${directory}/${id}-forward.png`,sheet.toBuffer('image/png'));metrics.push({id,maxSupportDrift:maxDrift,maxSoleDrift,maxLegLengthRatio:maxStretch});
 g.setInput(0,{left:true});for(let i=0;i<40;i++)g.update(FIXED_STEP);
 r.c=canvas.getContext('2d');r.c.fillStyle='#000';r.c.fillRect(0,0,1280,720);r.drawFighter(f);await writeFile(`${directory}/${id}-backward.png`,canvas.toBuffer('image/png'));
 g.setInput(0,{});for(let i=0;i<18;i++)g.update(FIXED_STEP);r.draw(g,0,1);await writeFile(`${directory}/${id}-versus.png`,canvas.toBuffer('image/png'));
}
const e=new StoryEngine({onEvent:event=>r.event(event)});
for(let act=0;act<4;act++){
 e.start('marcelo','story-local','rafael',{act});e.queue(0,'storyNext');e.fighters[0].x=430;e.fighters[1].x=590;e.spawnWave();e.setInput(0,{right:true});for(let i=0;i<30;i++)e.update(FIXED_STEP);
 r.c=canvas.getContext('2d');r.draw(e,.016,1);await writeFile(`${directory}/story-${act}.png`,canvas.toBuffer('image/png'));
}
e.start('tais','story-solo');e.queue(0,'storyNext');e.story.wave=3;e.story.dropWave=3;const p=e.props.find(p=>p.kind==='chair'),f=e.fighters[0];f.x=p.x-20;f.prevX=f.x;f.lane=p.lane;f.prevLane=f.lane;e.camera=f.x-400;resetFeet(f);e.handleCarry(f);e.setInput(0,{left:true});for(let i=0;i<25;i++)e.update(FIXED_STEP);r.draw(e,.016,1);await writeFile(`${directory}/carry.png`,canvas.toBuffer('image/png'));
e.setInput(0,{});e.queue(0,'kick');for(let i=0;i<18;i++)e.update(FIXED_STEP);r.draw(e,.016,1);await writeFile(`${directory}/carry-attack.png`,canvas.toBuffer('image/png'));
for(let i=0;i<80;i++)e.update(FIXED_STEP);e.queue(0,'punch');for(let i=0;i<40;i++){e.update(FIXED_STEP);if(i===17){r.draw(e,.016,1);await writeFile(`${directory}/carry-throw.png`,canvas.toBuffer('image/png'));}}
const timings=[];
for(const kind of ['versus','story']){const engine=kind==='versus'?new FightEngine():new StoryEngine();engine.start('marcelo',kind==='versus'?'local':'story-local','rafael');if(kind==='versus')engine.phase='fight';else{engine.queue(0,'storyNext');engine.spawnWave();}engine.setInput(0,{right:true});const samples=[];
 for(let i=0;i<180;i++){const start=performance.now();engine.update(1/60);r.draw(engine,1/60,.5);samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);timings.push({kind,p50:samples[90],p95:samples[171],mean:samples.reduce((a,b)=>a+b,0)/samples.length});}
await writeFile(`${directory}/timings.json`,JSON.stringify(timings,null,2)+'\n');console.log('CANVAS_TIMINGS '+JSON.stringify(timings));
for(const metric of metrics)if(metric.maxSupportDrift>.01||metric.maxSoleDrift>.01||metric.maxLegLengthRatio>1.08)throw new Error(`Apoio/anatomia fora do limite: ${JSON.stringify(metric)}`);
await writeFile(`${directory}/metrics.json`,JSON.stringify(metrics,null,2)+'\n');console.log(JSON.stringify({directory,metrics}));

if(process.env.SVF_EMIT_VISUAL==='1')console.log('SVF_VISUAL carry.png '+await readFile(`${directory}/carry.png`,'base64'));
