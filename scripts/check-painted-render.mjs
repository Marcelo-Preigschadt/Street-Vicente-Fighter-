// Pixel checks use the shipping Renderer, not a second animation renderer.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Renderer} from '../src/render.js';
import {FightEngine,CHARACTERS,FIXED_STEP,fighterPose} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {resetFeet,usesRig} from '../src/locomotion.js';
import {entityScale} from '../src/story-world.js';
import {paintedGeometry,evaluatePaintedPose} from '../src/painted-motion.js';
import {prepareLocomotionRig,deformLocomotionRig} from '../src/locomotion-render.js';
const require=createRequire(import.meta.url),{createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(path){super.src=typeof path==='string'?path.split('?')[0]:path;}get src(){return super.src;}};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const directory=process.argv[2]??'/tmp/svf-painted-render';await mkdir(directory,{recursive:true});
const ids=process.argv[3]?.split(',')??Object.keys(CHARACTERS);
if(ids.some(id=>!CHARACTERS[id]))throw new Error('Unknown character in validation selection');
const canvas=createCanvas(1280,720),expected=createCanvas(1280,720),r=new Renderer(canvas);await r.load(ids);
const report={renderer:'src/render.js',version:JSON.parse(await readFile('package.json')).version,startedAt:new Date().toISOString(),selection:ids,characters:[],failures:[],limits:{contactPixels:6,legLengthRatio:1.001,plantedWorldDrift:.01},limitations:['The source landmarks are estimates, except for measured sole centers.','Portrait equality is a pixel check; facial likeness of new paintings also requires visual review.']};
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const id of ids){
 const metric={id,samples:0,maxSupportDrift:0,maxPixelContactDistance:0,maxLegLengthRatio:1,maxPelvisCorrection:0,facePixelsCompared:0,facePixelDifferences:0,minTriangleAreaRatio:Infinity,maxTriangleAreaRatio:0,poses:[],portraitPreserved:false};
 const oldVersion=['tais','dienes'].includes(id)?2:1,oldMeta=JSON.parse(await readFile(`assets/runtime/${id}-v${oldVersion}.json`)),oldImage=new Image();await new Promise((resolve,reject)=>{oldImage.onload=resolve;oldImage.onerror=reject;oldImage.src=`assets/runtime/${id}-v${oldVersion}.webp`;});
 const oldPortrait=createCanvas(80,81);oldPortrait.getContext('2d').drawImage(oldImage,...oldMeta.portrait,0,0,80,81);
 const newPortrait=createCanvas(80,81);newPortrait.getContext('2d').drawImage(r.portraits[id],0,0,80,81);
 metric.portraitPreserved=hash(oldPortrait.getContext('2d').getImageData(0,0,80,81).data)===hash(newPortrait.getContext('2d').getImageData(0,0,80,81).data);
 const poses=new Set();
 if(id==='luciana'){
  const frame=r.sheets[id].motion.frames[4],tile=createCanvas(frame.w,frame.h),tc=tile.getContext('2d');
  tc.drawImage(frame.image??frame.cutout,...(frame.rect??[0,0,frame.w,frame.h]),0,0,frame.w,frame.h);
  const pixels=tc.getImageData(0,0,frame.w,frame.h).data;
  metric.neighborShoePixels=0;metric.retainedHeelPixels=0;
  for(let y=0;y<frame.h;y++)for(let x=0;x<23;x++)if(pixels[(y*frame.w+x)*4+3]>80)metric.neighborShoePixels++;
  for(let y=frame.h-60;y<frame.h;y++)for(let x=23;x<60;x++)if(pixels[(y*frame.w+x)*4+3]>80)metric.retainedHeelPixels++;
  if(metric.neighborShoePixels||metric.retainedHeelPixels<100)report.failures.push({id,error:'neighboring shoe remains or owned heel is lost',neighborPixels:metric.neighborShoePixels,heelPixels:metric.retainedHeelPixels});
 }
 for(const mode of ['versus','story'])for(const facing of [1,-1])for(const motion of ['advance','retreat','depth','run','stop']){
  const e=mode==='versus'?new FightEngine({random:()=>.6}):new StoryEngine({random:()=>.6});
  e.start(id,mode==='versus'?'local':'story-local',id==='rafael'?'marcelo':'rafael');
  if(mode==='versus')e.phase='fight';else{e.queue(0,'storyNext');e.clearField();e.story.wave=1;}
  const f=e.fighters[0];f.x=640;f.prevX=f.x;f.direction=facing;e.fighters[1].x=facing>0?1210:70;resetFeet(f);
  const sign=facing*(motion==='retreat'?-1:1);e.setInput(0,{left:sign<0,right:sign>0,up:motion==='depth'&&mode==='story'});if(motion==='run'&&mode==='story')f.runUntil=10;
  for(let tick=0;tick<96;tick++){
   if(motion==='stop'&&tick===45)e.setInput(0,{});
   const previous=f.motion.feet.map(foot=>({foot,x:foot.x,lane:foot.lane,support:foot.support}));e.update(FIXED_STEP);
   for(const before of previous)if(before.support&&before.foot.support){const drift=Math.hypot(before.x-before.foot.x,before.lane-before.foot.lane);if(drift>metric.maxSupportDrift){metric.maxSupportDrift=drift;metric.supportCase={mode,facing,motion,tick,state:f.motion.state};}}
   if(tick%6||!usesRig(f))continue;
   const pose=fighterPose(f),geometry=paintedGeometry(f,pose),p=evaluatePaintedPose(f,geometry);if(!p)continue;
   poses.add(`${pose.atlas}[${pose.index}]`);metric.samples++;
   metric.maxLegLengthRatio=Math.max(metric.maxLegLengthRatio,p.maxStretch);metric.maxPelvisCorrection=Math.max(metric.maxPelvisCorrection,p.down);
   const c=canvas.getContext('2d');c.clearRect(0,0,1280,720);r.c=c;c.save();c.translate(0,(f.lane??625)-625);r.drawFighter(f);c.restore();
   const pixels=c.getImageData(0,0,1280,720).data;
   for(const foot of f.motion.feet){
    const x=foot.x,y=f.y+foot.lane-625-foot.lift;let distance=20;
    for(let yy=Math.max(0,Math.floor(y-12));yy<=Math.min(719,Math.ceil(y+12));yy++)for(let xx=Math.max(0,Math.floor(x-12));xx<=Math.min(1279,Math.ceil(x+12));xx++)if(pixels[(yy*1280+xx)*4+3]>95)distance=Math.min(distance,Math.hypot(xx+.5-x,yy+.5-y));
    metric.maxPixelContactDistance=Math.max(metric.maxPixelContactDistance,distance);
    if(distance>6&&report.failures.length<50)report.failures.push({id,mode,facing,motion,tick,pose,error:'rendered sole misses physical contact',distance});
   }
   const selected=r.poseFor(f),frame=selected.sheet.frames[pose.index],rig=r.paintedRigs.get(frame),ec=expected.getContext('2d'),s=entityScale(f),width=f.character.visualWidth??1;
   ec.clearRect(0,0,1280,720);ec.save();ec.translate(f.x,f.y+(f.lane??625)-625);ec.scale(f.direction*s*width,s);ec.drawImage(rig.image,rig.source[0],rig.source[1],rig.width,rig.headHeight,-rig.axis*rig.scale+p.shift,-rig.bottom*rig.scale+p.down,rig.width*rig.scale,rig.headHeight*rig.scale);ec.restore();
   const ep=ec.getImageData(0,0,1280,720).data,top=f.y+(f.lane??625)-625+(-rig.bottom*rig.scale+p.down)*s,edge=top+rig.headHeight*rig.scale*s-4;
   for(let yy=Math.max(0,Math.ceil(top+2));yy<Math.min(720,Math.floor(edge));yy++)for(let xx=Math.max(0,Math.floor(f.x-180));xx<Math.min(1280,Math.ceil(f.x+180));xx++){
    const n=(yy*1280+xx)*4;if(ep[n+3]<180)continue;metric.facePixelsCompared++;if(ep[n]!==pixels[n]||ep[n+1]!==pixels[n+1]||ep[n+2]!==pixels[n+2])metric.facePixelDifferences++;
   }
   for(const [a,b,d]of rig.triangles){const v=rig.vertices,q=rig.positions,source=(v[b].sx-v[a].sx)*(v[d].sy-v[a].sy)-(v[b].sy-v[a].sy)*(v[d].sx-v[a].sx),target=(q[b*2]-q[a*2])*(q[d*2+1]-q[a*2+1])-(q[b*2+1]-q[a*2+1])*(q[d*2]-q[a*2]);const ratio=target/(source*rig.scale**2);metric.minTriangleAreaRatio=Math.min(metric.minTriangleAreaRatio,ratio);metric.maxTriangleAreaRatio=Math.max(metric.maxTriangleAreaRatio,ratio);}
  }
 }
 metric.poses=[...poses];report.characters.push(metric);
 if(!metric.portraitPreserved||metric.maxSupportDrift>.01||metric.maxLegLengthRatio>1.001||metric.facePixelDifferences)report.failures.push({id,error:'portrait, planted support, limb length or face translation failed'});
 console.log(`${id}: ${metric.samples} render samples, contact ${metric.maxPixelContactDistance.toFixed(2)}px, stretch ${metric.maxLegLengthRatio.toFixed(4)}, face changes ${metric.facePixelDifferences}, triangle ${metric.minTriangleAreaRatio.toFixed(2)}..${metric.maxTriangleAreaRatio.toFixed(2)}`);
}
report.status=report.failures.length?'FAIL':'PASS';report.finishedAt=new Date().toISOString();await writeFile(`${directory}/painted-render.json`,JSON.stringify(report,null,2)+'\n');
if(report.failures.length)throw new Error(`Painted-render checks failed: ${report.failures.length}; see ${directory}/painted-render.json`);
