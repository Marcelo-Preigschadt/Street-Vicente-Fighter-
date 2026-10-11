// Render the real story compositor in a native Canvas adapter. This is an
// offline visual check, not a substitute for the browser gameplay review.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {Renderer} from '../src/render.js';
import {StoryEngine} from '../src/story.js';
import {StoryEnemy} from '../src/story.js';
import {ENEMY_TYPES} from '../src/story-data.js';
import {loadPreparedSprites} from '../src/sprite-loader.js';
import {prepareLocomotionRig} from '../src/locomotion-render.js';
import {resetFeet,updateLocomotion} from '../src/locomotion.js';
import {prepareEnemyMotion,updateEnemyMechanicalFeet,mechanicalWalkerPose} from '../src/story-enemy-motion.js';
import {drawStoryEnemy} from '../src/story-render.js';
import {STORY_PROP_DIMENSIONS} from '../src/story-props.js';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const directory=process.argv[2]??'docs/audit-20261010-story';await mkdir(directory,{recursive:true});
const experimental=process.argv.includes('--experimental');
const canvas=createCanvas(1280,720),renderer=new Renderer(canvas),ids=['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan','tais','luciana','khauany','dienes'];
renderer.experimentalActorRig=experimental;
for(const id of ids){const {base,portrait}=await loadPreparedSprites(id,path=>loadImage(path.split('?')[0]));renderer.sheets[id]=base;renderer.portraits[id]=portrait;renderer.locomotionRigs[id]=prepareLocomotionRig(id,base);}
const art={backgrounds:await Promise.all(['patio','quimica','biblioteca','nit'].map(id=>loadImage(`assets/story/${id}-panorama-v2.webp`))),enemies:await Promise.all(Array.from({length:16},(_,i)=>loadImage(`assets/story/enemy-${i}.webp`)))};
art.experimentalActorRig=experimental;
art.inspector=await Promise.all(Array.from({length:4},(_,i)=>loadImage(`assets/story/inspector-pose-${i}-v2.webp`)));art.inspectorFrames=JSON.parse(await readFile('assets/story/inspector-poses-v2.json'));
art.propFrames=JSON.parse(await readFile('assets/story/props-v3.json'));for(const [kind,size]of Object.entries(STORY_PROP_DIMENSIONS))Object.assign(art.propFrames[kind],size);
art.props=Object.fromEntries(await Promise.all(Object.entries(art.propFrames).map(async([id,frame])=>[id,await loadImage(frame.file)])));
for(const [name,file]of [['animations','assets/story/enemy-animation-v5.json'],['rigs','assets/story/machine-rigs-v6.json'],['mechanical','assets/story/mechanical-walkers-v1.json']]){
  const metadata=JSON.parse(await readFile(file));art[name]=Object.fromEntries(await Promise.all(Object.entries(metadata).map(async([id,item])=>[id,{...item,image:await loadImage(item.file)}])));
}
prepareEnemyMotion(art);renderer.storyArt=art;
const advance=(engine,seconds)=>{for(let t=0;t<seconds;t+=1/120)engine.update(1/120);};
const states=['idle','pickup','lift','walk','depth','jump','block','throw'];
const sheet=createCanvas(states.length*310,12*260),sc=sheet.getContext('2d');sc.fillStyle='#213135';sc.fillRect(0,0,sheet.width,sheet.height);
for(const [row,id]of ids.entries())for(const [column,state]of states.entries()){
  const engine=new StoryEngine();engine.start(id,'story-solo',id==='rafael'?'gustavo':'rafael');engine.queue(0,'storyNext');engine.story.wave=3;engine.story.dropWave=3;engine.props=[];engine.enemies=[];engine.hazards=[];
  const f=engine.fighters[0];f.experimentalActorRig=experimental;f.x=640;f.prevX=f.x;resetFeet(f);f.carry={kind:['pickup','lift','depth','block'].includes(state)?'chair':'table',id:'proof',elapsed:state==='pickup'?0:state==='lift'?.09:.18,originX:f.x+22,originY:625,originLane:f.lane};
  if(state==='walk')engine.setInput(0,{right:true});if(state==='depth')engine.setInput(0,{up:true});if(state==='jump')engine.setInput(0,{jump:true});if(state==='block')engine.setInput(0,{block:true});
  if(!['pickup','lift'].includes(state))advance(engine,state==='walk'?.34:state==='jump'?.18:.1);
  if(state==='throw'){engine.queue(0,'punch');advance(engine,.06);}
  f.prevX=f.x;f.prevY=f.y;renderer.draw(engine,0,1);
  const x=column*310,y=row*260;sc.drawImage(canvas,f.x-170,310,340,335,x,y+24,310,230);sc.fillStyle='#fff';sc.font='17px Arial';sc.fillText(`${id}: ${state}`,x+6,y+20);
}
await writeFile(`${directory}/carry-all-12.png`,sheet.toBuffer('image/png'));
const enemies=createCanvas(4*350,4*350),ec=enemies.getContext('2d');ec.fillStyle='#213135';ec.fillRect(0,0,enemies.width,enemies.height);
const mechanical=[];
for(const [index,[kind,profile]]of Object.entries(ENEMY_TYPES).entries()){
  const e=new StoryEnemy(kind,10,0);e.x=0;e.prevX=0;e.direction=1;resetFeet(e);
  for(let tick=0;tick<60;tick++){e.prevX=e.x;e.prevLane=e.lane;e.x+=profile.speed*e.worldScale/120;e.brawlerWalkDistance+=Math.abs(e.x-e.prevX);e.vx=profile.speed*e.worldScale;e.state='walk';e.animTime+=1/120;updateLocomotion(e,1/120);updateEnemyMechanicalFeet(e,1/120);}
  const x=index%4*350,y=Math.floor(index/4)*350;ec.save();ec.translate(x+175-e.x,y+315-e.y);
  drawStoryEnemy(ec,e,art,e.animTime,false);ec.restore();
  ec.fillStyle='#fff';ec.font='17px Arial';ec.fillText(`${kind} / movimento`,x+6,y+22);
  if(art.mechanicalWalkers[kind])mechanical.push({kind,legs:mechanicalWalkerPose(e,art.mechanicalWalkers[kind]).legs.map(p=>({reachable:p.reachable,error:Math.hypot(p.target[0]-p.toe[0],p.target[1]-p.toe[1])}))});
}
await writeFile(`${directory}/enemies-continuous.png`,enemies.toBuffer('image/png'));
await writeFile(`${directory}/mechanical-contact.json`,JSON.stringify(mechanical,null,2));
if(process.argv.includes('--clip')){
  const frameDirectory=`${directory}/mechanical-frames`;await mkdir(frameDirectory,{recursive:true});
  const cv=createCanvas(900,470),c=cv.getContext('2d'),walkers=['vial','scanner'].map((kind,i)=>{const e=new StoryEnemy(kind,2+i,170);e.direction=1;resetFeet(e);return e;});
  const temporal=createCanvas(900,470*4),tc=temporal.getContext('2d');
  const metrics={frames:144,fps:30,maxFootError:0,unreachable:[]};
  for(let frame=0;frame<144;frame++){
    for(let tick=0;tick<4;tick++)for(const e of walkers){e.prevX=e.x;e.prevLane=e.lane;e.state='walk';e.vx=(frame<72?1:-1)*e.profile.speed*e.worldScale;e.x+=e.vx/120;e.animTime+=1/120;e.lane=625+Math.sin(e.animTime*2)*12;updateLocomotion(e,1/120);updateEnemyMechanicalFeet(e,1/120);}
    c.fillStyle='#203033';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#fff';c.font='16px Arial';c.fillText(`Passadas reais: avanço, recuo e profundidade • ${(frame/30).toFixed(2)}s`,20,24);
    for(let i=0;i<walkers.length;i++){
      const e=walkers[i],base=215+i*220,w=art.mechanicalWalkers[e.kind],pose=mechanicalWalkerPose(e,w),s=w.actorHeight/w.height*e.worldScale;
      c.strokeStyle='#597064';c.lineWidth=1;for(let x=30;x<880;x+=45){c.beginPath();c.moveTo(x,base-14);c.lineTo(x,base+23);c.stroke();}c.beginPath();c.moveTo(30,base);c.lineTo(880,base);c.stroke();
      c.save();c.translate(0,base-625+e.lane-625);drawStoryEnemy(c,e,art,e.animTime,false);c.restore();
      c.strokeStyle='#f1b354';c.beginPath();c.moveTo(e.x,base-175);c.lineTo(e.x,base+22);c.stroke();
      for(let j=0;j<pose.legs.length;j++){const p=pose.legs[j],points=[p.hip,p.knee,p.toe].map(([x,y])=>[e.x+(x-w.width/2)*e.direction*s,base+e.lane-625+(y-w.height)*s]);c.strokeStyle=j===1&&e.kind==='vial'?'#cc81ff':'#9effbd';c.beginPath();c.moveTo(...points[0]);c.lineTo(...points[1]);c.lineTo(...points[2]);c.stroke();for(const point of points){c.beginPath();c.arc(...point,2,0,Math.PI*2);c.stroke();}}
      const error=Math.max(...pose.legs.map(p=>Math.hypot(p.toe[0]-p.target[0],p.toe[1]-p.target[1])));metrics.maxFootError=Math.max(metrics.maxFootError,error);if(pose.legs.some(p=>!p.reachable))metrics.unreachable.push({frame,kind:e.kind,error});
      c.fillStyle='#fff';c.fillText(e.kind,570,base-135);c.fillText(`${pose.legs.length} apoios • erro ${error.toFixed(3)}px`,570,base-108);
    }
    await writeFile(`${frameDirectory}/${String(frame).padStart(4,'0')}.png`,cv.toBuffer('image/png'));
    if([0,36,72,108].includes(frame))tc.drawImage(cv,0,[0,36,72,108].indexOf(frame)*470);
  }
  await writeFile(`${directory}/mechanical-sequence.png`,temporal.toBuffer('image/png'));
  await writeFile(`${directory}/mechanical-sequence-metrics.json`,JSON.stringify(metrics,null,2));
}
if(process.argv.includes('--enemy-clip')){
  const cv=createCanvas(1400,1400),c=cv.getContext('2d'),actors=Object.keys(ENEMY_TYPES).map(kind=>{const e=new StoryEnemy(kind,10,500);e.direction=1;resetFeet(e);return e;});
  const encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1400x1400','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p',`${directory}/enemy-states.mp4`],{stdio:['pipe','ignore','inherit']});
  const finished=once(encoder,'close');
  for(let frame=0;frame<144;frame++){
    c.fillStyle='#213135';c.fillRect(0,0,1400,1400);
    for(const [index,e]of actors.entries()){
      const time=frame/30,phase=time<1.6?'walk':time<2?'windup':time<2.8?'attack':time<3.6?'hit':'ko';
      for(let tick=0;tick<4;tick++){
        e.prevX=e.x;e.prevLane=e.lane;e.state=phase;e.animTime+=1/120;e.telegraph=phase==='windup'?2-time:0;e.attackLife=phase==='attack'?2.8-time:0;e.hitstun=phase==='hit'?.2:0;e.hp=phase==='ko'?0:e.maxHp;e.deadTime=phase==='ko'?time-3.6:0;
        e.attackMode=e.kind==='fairRobot'?'flame':e.kind==='exo'?'charge':e.profile.ranged?'shot':'melee';
        const attackProgress=Math.max(0,time-2)/.8,contact=e.profile.boss?11:14;
        e.brawlerReverse=attackProgress>.5;e.brawlerFrame=contact-2+Math.max(0,Math.min(2,Math.floor((attackProgress>.5?1-attackProgress:attackProgress)*6)));e.brawlerFrameTime=time%(.8/6);
        e.vx=phase==='walk'?e.profile.speed*e.worldScale:0;e.x+=e.vx/120;e.brawlerWalkDistance+=Math.abs(e.x-e.prevX);updateLocomotion(e,1/120);updateEnemyMechanicalFeet(e,1/120);
      }
      const x=index%4*350,y=Math.floor(index/4)*350;c.save();c.translate(x+175-e.x,y+315-e.y);drawStoryEnemy(c,e,art,e.animTime,false);c.restore();
      c.fillStyle='#fff';c.font='17px Arial';c.fillText(`${e.kind} / ${phase}`,x+6,y+22);
    }
    if(!encoder.stdin.write(Buffer.from(c.getImageData(0,0,1400,1400).data)))await once(encoder.stdin,'drain');
  }
  encoder.stdin.end();const [code]=await finished;if(code)throw new Error(`enemy clip encoder: ${code}`);
}
console.log(`Story compositor: ${ids.length*states.length} carry views and all 16 enemy mechanisms rendered in ${directory}`);
