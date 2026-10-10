// Render every shipping frame and combat state with the game's Canvas compositor.
// This is a visual review artifact, not a claim that automated checks certify anatomy.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Renderer} from '../src/render.js';
import {CHARACTERS,Fighter,FightEngine,FIXED_STEP,WORLD,fighterPose} from '../src/engine.js';
import {StoryEngine,StoryEnemy} from '../src/story.js';
import {resetFeet} from '../src/locomotion.js';
import {RIG_BIND,GAITS,BONES,referenceJoints} from '../src/locomotion-data.js';
import {ENEMY_TYPES} from '../src/story-data.js';
import {drawStoryEnemy} from '../src/story-render.js';
import {paintedGeometry,evaluatePaintedPose} from '../src/painted-motion.js';
import {entityScale} from '../src/story-world.js';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(path){super.src=typeof path==='string'?path.split('?')[0]:path;}get src(){return super.src;}};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const directory=process.argv[2]??'docs/sprite-audit/after';
await mkdir(directory,{recursive:true});
const canvas=createCanvas(1280,720),r=new Renderer(canvas),ids=Object.keys(CHARACTERS);
await r.load(ids);await r.loadStory();
const report={version:JSON.parse(await readFile('package.json')).version,characters:[],enemies:[],limitations:['Photographic references are not included in the repository. Approved painted portraits and source atlases are used.','Joint overlays are source estimates plus measured soles. They require visual review and cannot certify anatomy.','State sheets are synthetic pose sampling; locomotion sheets and tests/visual-review.html execute the real simulation.']};
const label=(c,s,x,y)=>{c.fillStyle='#eff5f9';c.font='13px sans-serif';c.fillText(s,x,y);};
const background=(w,h)=>{const im=createCanvas(w,h),c=im.getContext('2d');c.fillStyle='#253441';c.fillRect(0,0,w,h);return im;};
const save=async(name,im)=>writeFile(`${directory}/${name}.png`,im.toBuffer('image/png'));
function drawFrame(c,frame,sheet,x,y,view=.55){const scale=(frame.scale??sheet.scale)*view;c.drawImage(frame.image??frame.cutout,...(frame.rect??[0,0,frame.w,frame.h]),x+(frame.x-frame.anchor)*scale,y+(frame.y-frame.bottom)*scale,frame.w*scale,frame.h*scale);}
for(const id of ids){
 globalThis.gc?.();
 const base=r.sheets[id],atlases={base,...Object.fromEntries(Object.entries(base).filter(([k,v])=>v?.frames&&v!==base))};
 const metrics={id,frames:0,atlases:{},issues:[],stateFrames:[]};
 for(const [atlas,sheet] of Object.entries(atlases)){
  const extent=Math.max(...sheet.frames.map(f=>Math.max(Math.abs(f.x-f.anchor),Math.abs(f.x-f.anchor+f.w))*(f.scale??sheet.scale)*.55));
  const top=Math.max(...sheet.frames.map(f=>(f.bottom-f.y)*(f.scale??sheet.scale)*.55));
  const cellWidth=Math.max(256,Math.ceil(extent*2+40)),cellHeight=Math.max(235,Math.ceil(top+65));
  const rows=Math.ceil(sheet.frames.length/8),im=background(cellWidth*8,rows*cellHeight+30),c=im.getContext('2d');label(c,`${id} / ${atlas} / actual game scale × 0.55`,12,21);
  const frames=[];
  for(const [index,f]of sheet.frames.entries()){
   const x=index%8*cellWidth+cellWidth/2,y=Math.floor(index/8)*cellHeight+cellHeight-25;drawFrame(c,f,sheet,x,y);
   c.strokeStyle='#95bece';c.lineWidth=1;c.beginPath();c.moveTo(x-110,y);c.lineTo(x+122,y);c.stroke();
   label(c,`${atlas}[${index}] · ${(f.h*(f.scale??sheet.scale)).toFixed(1)}px`,index%8*cellWidth+10,y+20);
   const cutout=createCanvas(f.w,f.h);cutout.getContext('2d').drawImage(f.image??f.cutout,...(f.rect??[0,0,f.w,f.h]),0,0,f.w,f.h);
   const data=cutout.getContext('2d').getImageData(0,0,f.w,f.h).data;let pixels=0,edge=0;
   for(let yy=0;yy<f.h;yy++)for(let xx=0;xx<f.w;xx++)if(data[(yy*f.w+xx)*4+3]>95){pixels++;if(xx===0||xx===f.w-1||yy===0||yy===f.h-1)edge++;}
   const scale=f.scale??sheet.scale;
   const record={index,w:f.w,h:f.h,scale,anchor:f.anchor,bottom:f.bottom,alphaPixels:pixels,opaqueEdgePixels:edge,sha256:createHash('sha256').update(data).digest('hex')};frames.push(record);metrics.frames++;
   if(pixels<100||!Number.isFinite(scale)||scale<=0)metrics.issues.push(`${atlas}:${index}: empty or invalid scale`);
  }
  metrics.atlases[atlas]=frames;await save(`${id}-${atlas}`,im);
 }
 const states=['idle','walk','stepIn','stepBack','crouch','preJump','jump','landing','punch','kick','crouchPunch','sweep','airPunch','airKick','block','lowBlock','hit','dizzy','knockdown','wake','special','uppercut','super','throw','guardCounter','victory','ko'];
 const proof=background(3456,states.length*260+40),c=proof.getContext('2d');
 for(const [row,state]of states.entries()){
  label(c,`${id} · ${state}`,8,row*260+28);
  for(let sample=0;sample<8;sample++){
   const f=new Fighter(id,sample%2);f.x=sample*432+216;f.y=WORLD.floor;
   // State sampling is intentionally separate from the real simulation below.
   f.state=state;f.direction=sample%2?-1:1;f.animTime=sample*.09;f.actionTime=sample*.06;
   if(['punch','kick','crouchPunch','sweep','airPunch','airKick','special','uppercut','super','throw','guardCounter'].includes(state)){f.action=state;f.moveData={startup:.12,active:.14,recovery:.18,strength:1};}
   f.walkDistance=sample*24;f.walkBlend=state==='walk'?1:0;
   c.save();c.translate(f.x,row*260+235);c.scale(.51,.51);c.translate(-f.x,-f.y);r.c=c;r.drawFighter(f);c.restore();
   const pose=fighterPose(f);metrics.stateFrames.push({state,sample,facing:f.direction,...pose});label(c,`${pose.atlas}:${pose.index}`,sample*432+18,row*260+253);
  }
 }
 await save(`${id}-states`,proof);
 const walk=background(4160,900),wc=walk.getContext('2d');
 for(const [row,back]of [false,true].entries()){
  const engine=new FightEngine({random:()=>.6});engine.start(id,'local',id==='rafael'?'marcelo':'rafael');engine.phase='fight';const f=engine.fighters[0];f.x=320;f.prevX=f.x;engine.fighters[1].x=1170;resetFeet(f);engine.setInput(0,{left:back,right:!back});
  for(let tick=0;tick<112;tick++){
   engine.update(FIXED_STEP);if(tick%14)continue;const sample=tick/14,x=sample*520+260,y=row*450+395;
   wc.save();wc.translate(x,y);wc.scale(.8,.8);wc.translate(-f.x,-f.y);r.c=wc;r.drawFighter(f);
   wc.strokeStyle='#77f9b2';wc.lineWidth=1;for(const foot of f.motion.feet){wc.beginPath();wc.arc(foot.x,WORLD.floor-foot.lift,5,0,Math.PI*2);wc.stroke();}wc.restore();label(wc,`${back?'retreat':'advance'} · ${tick}/120s`,sample*520+8,y+24);
  }
 }
 await save(`${id}-locomotion`,walk);
 const jointSheet=background(1600,900),jc=jointSheet.getContext('2d');
 for(let index=0;index<8;index++){
  const f=new Fighter(id,0);f.x=0;f.prevX=0;resetFeet(f);const frame=base.motion.frames[index],pose={atlas:'motion',index},geometry=paintedGeometry(f,pose);
  // Mark the source painting before any contact correction; the game overlay
  // in visual-review.html additionally marks the evaluated world contacts.
  const x=index%4*400+190,y=Math.floor(index/4)*450+385;drawFrame(jc,frame,base.motion,x,y,.9);
  const joints=geometry?.points;if(joints){jc.strokeStyle='#72ffd0';jc.lineWidth=1.5;for(const [a,b]of BONES){jc.beginPath();jc.moveTo(x+joints[a][0]*.9,y+joints[a][1]*.9);jc.lineTo(x+joints[b][0]*.9,y+joints[b][1]*.9);jc.stroke();}for(const [i,p]of joints.entries()){jc.fillStyle=i===6||i===10?'#75ffc5':'#ffd477';jc.beginPath();jc.arc(x+p[0]*.9,y+p[1]*.9,3,0,7);jc.fill();}}
  label(jc,`${id} motion[${index}] · estimated joints / measured soles`,index%4*400+10,y+35);
 }
 await save(`${id}-joints`,jointSheet);
 const reference=background(1120,450),fc=reference.getContext('2d');
 const portrait=r.portraits[id];fc.drawImage(portrait,50,45,280,284);label(fc,'Approved in-game portrait',20,370);
 const bind=RIG_BIND[id],sheet=bind.atlas==='base'?base:base[bind.atlas],frame=sheet.frames[bind.index];drawFrame(fc,frame,sheet,540,375,1);label(fc,'Approved stance / prior sprite',370,420);
 const f=new Fighter(id,0);f.x=920;f.y=WORLD.floor;f.prevX=f.x;resetFeet(f);f.animTime=.25;fc.save();fc.translate(0,375-WORLD.floor);r.c=fc;r.drawFighter(f);fc.restore();label(fc,'Rendered stance / current sprite',790,420);
 await save(`${id}-identity`,reference);
 const overlay=background(500,450),oc=overlay.getContext('2d');drawFrame(oc,frame,sheet,230,395,1);
 const joints=referenceJoints(id,new Float64Array(34));oc.strokeStyle='#71ffc5';oc.lineWidth=2;for(const [a,b]of BONES){oc.beginPath();oc.moveTo(230+joints[a*2],395+joints[a*2+1]);oc.lineTo(230+joints[b*2],395+joints[b*2+1]);oc.stroke();}for(let i=0;i<17;i++){oc.fillStyle='#ffe590';oc.beginPath();oc.arc(230+joints[i*2],395+joints[i*2+1],3,0,Math.PI*2);oc.fill();label(oc,String(i),234+joints[i*2],391+joints[i*2+1]);}await save(`${id}-bind`,overlay);
 report.characters.push(metrics);
 console.log(`${id}: ${metrics.frames} frames, ${states.length} states, both facings`);
}
for(const kind of Object.keys(ENEMY_TYPES)){
 const native=r.storyArt.animations[kind],rig=r.storyArt.rigs[kind];
 const extent=Math.max(100,...(native?.frames??[]).map(f=>Math.max(Math.abs(f.anchorX),Math.abs(f.rect[2]-f.anchorX))*native.scale*.65));
 const top=Math.max(200,...(native?.frames??[]).map(f=>f.bottom*native.scale*.65));
 const cellWidth=Math.ceil(extent*2+50),cellHeight=Math.ceil(top+80),im=background(cellWidth*8,Math.ceil((native?.frames.length??16)/8)*cellHeight+35),c=im.getContext('2d');label(c,`${kind} · native drawings / original mechanism`,10,20);
 for(const [i,f]of (native?.frames??[]).entries()){const s=native.scale*.65,x=i%8*cellWidth+cellWidth/2,y=Math.floor(i/8)*cellHeight+cellHeight-35;c.drawImage(native.image,...f.rect,x-f.anchorX*s,y-f.bottom*s,f.rect[2]*s,f.rect[3]*s);label(c,`${kind}[${i}]`,i%8*cellWidth+5,y+22);}
 if(rig)for(let i=0;i<16;i++){const e=new StoryEnemy(kind,10,i%8*cellWidth+cellWidth/2);e.y=Math.floor(i/8)*cellHeight+cellHeight-35;e.direction=i%2?-1:1;e.state='walk';e.animTime=i*.1;drawStoryEnemy(c,e,r.storyArt,i*.1,false);label(c,`${kind} mechanism · ${i*.1}s`,i%8*cellWidth+8,Math.floor(i/8)*cellHeight+cellHeight-12);}
 await save(`enemy-${kind}`,im);
 const sequence=background(3720,2160),sc=sequence.getContext('2d');
 for(const [row,phase]of ['walk','attack','damage','defeat'].entries()){
  const e=new StoryEngine({random:()=>.6});e.start('marcelo','story-local','rafael');e.queue(0,'storyNext');e.clearField();e.story.wave=1;e.fighters[0].x=phase==='walk'?400:560;e.fighters[1].x=100;const n=e.spawnEnemy(kind,phase==='walk'?960:660);n.aiTime=0;n.cooldown=0;
  if(phase==='damage'){n.hitstun=.32;n.state='hit';}if(phase==='defeat'){n.hp=0;n.deadTime=0;}
  for(let tick=0;tick<120;tick++){e.update(FIXED_STEP);if(tick%20)continue;const sample=tick/20,x=sample*620+310,y=row*540+500;sc.save();sc.translate(x-n.x,y-n.y);drawStoryEnemy(sc,n,r.storyArt,tick*FIXED_STEP,false);sc.restore();label(sc,`${kind} ${phase} · tick ${tick}`,sample*620+8,y+26);}
 }
 await save(`enemy-${kind}-states`,sequence);report.enemies.push({kind,frames:native?.frames.length??0,mechanicalRig:!!rig,realAIPhases:['walk','attack','damage','defeat']});
}
await writeFile(`${directory}/inventory.json`,JSON.stringify(report,null,2)+'\n');
console.log(`Review saved to ${directory}`);
