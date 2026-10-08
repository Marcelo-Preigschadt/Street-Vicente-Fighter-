import {FightEngine,FIXED_STEP,WORLD} from '../releases/v4.6.1/engine.js';
import {Renderer} from '../releases/v4.6.1/render.js';
import {resetFeet,usesRig} from '../releases/v4.6.1/locomotion.js';
import {interpolateFighter} from '../releases/v4.6.1/locomotion-render.js';
const canvas=document.getElementById('lab'),renderer=new Renderer(canvas),c=renderer.c;
const ids=['marcelo','rafael','gustavo','tais'],names=['Marcelo · Kung Fu','Rafael · Boxe','Gustavo · Kickboxing','Tais · Savate'];
const stages=[
 {label:'IDLE',seconds:.9,direction:0},
 {label:'WALK_FORWARD',seconds:1.2,direction:1},
 {label:'MOVE_STOP',seconds:.45,direction:0},
 {label:'WALK_BACKWARD',seconds:1.2,direction:-1},
 {label:'MOVE_STOP',seconds:.45,direction:0},
 {label:'WALK → ATTACK',seconds:.75,direction:1,attack:'punch'},
 {label:'ATTACK → WALK',seconds:.8,direction:1},
 {label:'SPECIAL',seconds:1.1,direction:0,attack:'special'},
 {label:'RECOVERY → IDLE',seconds:.65,direction:0}
];
const engines=ids.map(id=>{const e=new FightEngine({random:()=>.6});e.start(id,'local',id==='rafael'?'marcelo':'rafael');e.phase='fight';return e;});
const views=ids.map(()=>({motion:{feet:[{},{}]}}));
const before=ids.map(()=>[{x:0,lane:0,support:false},{x:0,lane:0,support:false}]);
const soles=ids.map(()=>[]),stats={frames:0,elapsed:0,cost:0,maxCost:0,maxSupportDrift:0,maxSoleDrift:0,loops:0};
let index=0,stageTime=0,queued=false,running=true,last=0,accumulator=0,reportTime=0,loaded=false;
function reset(){
 for(const e of engines){for(const f of e.fighters)f.reset();const f=e.fighters[0],other=e.fighters[1];f.x=f.prevX=360;other.x=other.prevX=1170;other.invincible=1000;resetFeet(f);resetFeet(other);e.projectiles.length=0;e.phase='fight';e.timer=99;}
 for(const list of soles)for(const sample of list)sample.valid=false;
}
function enter(next){
 index=next;stageTime=0;queued=false;
 for(const e of engines){const f=e.fighters[0];f.directions.length=0;f.tapTime=-10;const d=stages[index].direction;e.setInput(0,{right:d>0,left:d<0});}
}
function advanceStage(){if(index+1===stages.length){stats.loops++;reset();enter(0);}else enter(index+1);}
function step(){
 stageTime+=FIXED_STEP;
 if(stages[index].attack&&!queued&&stageTime>=.25){for(const e of engines)e.queue(0,stages[index].attack,1);queued=true;}
 for(let i=0;i<engines.length;i++){
  const e=engines[i],f=e.fighters[0],feet=f.motion.feet;
  for(let j=0;j<2;j++){before[i][j].x=feet[j].x;before[i][j].lane=feet[j].lane;before[i][j].support=feet[j].support;}
  e.update(FIXED_STEP);
  for(let j=0;j<2;j++)if(before[i][j].support&&feet[j].support)stats.maxSupportDrift=Math.max(stats.maxSupportDrift,Math.abs(feet[j].x-before[i][j].x),Math.abs(feet[j].lane-before[i][j].lane));
 }
 if(stageTime>=stages[index].seconds)advanceStage();
}
function draw(alpha){
 c.fillStyle='#000';c.fillRect(0,0,canvas.width,canvas.height);
 for(let i=0;i<engines.length;i++){
  const f=interpolateFighter(engines[i].fighters[0],alpha,views[i]),column=i%2,row=Math.floor(i/2);
  c.save();c.translate(column*640+320-f.x,row*380+330-f.y);renderer.drawFighter(f);c.restore();
  c.fillStyle='#e4edf4';c.font='16px system-ui';c.fillText(names[i],column*640+18,row*380+24);
  const rig=renderer.locomotionRigs[ids[i]],active=usesRig(f),list=soles[i];
  for(let k=0;k<list.length;k++){
   const sample=list[k],foot=f.motion.feet[sample.side],valid=active&&foot.support&&foot.lift===0&&foot.angle===0;
   const x=f.x+rig.positions[sample.vertex*2]*f.direction,y=f.y+rig.positions[sample.vertex*2+1];
   if(valid&&sample.valid)stats.maxSoleDrift=Math.max(stats.maxSoleDrift,Math.hypot(x-sample.x,y-sample.y));
   sample.x=x;sample.y=y;sample.valid=valid;
  }
 }
}
function report(){
 document.getElementById('state').textContent=stages[index].label+'\n'+engines.map((e,i)=>names[i]+': '+e.fighters[0].motion.state+(e.fighters[0].movePhase?' / '+e.fighters[0].movePhase:'')).join('\n');
 const fps=stats.elapsed>0?stats.frames/stats.elapsed:0,mean=stats.frames>0?stats.cost/stats.frames:0;
 document.getElementById('metrics').textContent='FPS observado: '+fps.toFixed(1)+' · CPU média update + draw: '+mean.toFixed(2)+' ms · máximo: '+stats.maxCost.toFixed(2)+' ms\nDeriva máxima do apoio: '+stats.maxSupportDrift.toExponential(2)+' px · sola desenhada: '+stats.maxSoleDrift.toExponential(2)+' px · ciclos: '+stats.loops;
}
function frame(now){
 const elapsed=last?Math.max(0,(now-last)/1000):0;last=now;
 if(running&&loaded){
  const started=performance.now(),dt=Math.min(elapsed,.066);accumulator+=dt;
  while(accumulator>=FIXED_STEP){step();accumulator-=FIXED_STEP;}
  renderer.clock+=dt;draw(accumulator/FIXED_STEP);
  const cost=performance.now()-started;stats.frames++;stats.elapsed+=elapsed;stats.cost+=cost;stats.maxCost=Math.max(stats.maxCost,cost);reportTime+=elapsed;
  if(reportTime>=.25){reportTime=0;report();}
 }
 requestAnimationFrame(frame);
}
document.getElementById('play').addEventListener('click',()=>{running=!running;last=performance.now();document.getElementById('play').textContent=running?'Pausar':'Continuar';report();});
document.getElementById('next').addEventListener('click',()=>{advanceStage();accumulator=0;last=performance.now();draw(1);report();});
try{
 await renderer.load(ids);reset();
 for(let i=0;i<ids.length;i++){const rig=renderer.locomotionRigs[ids[i]];for(let k=0;k<rig.vertices.length;k++){const v=rig.vertices[k],side=v.first===5?0:v.first===9?1:-1;if(side>=0&&v.weight===1&&v.sy>=rig.height*.98)soles[i].push({vertex:k,side,x:0,y:0,valid:false});}}
 loaded=true;enter(0);draw(1);report();requestAnimationFrame(frame);
}catch(error){document.getElementById('state').textContent='Erro: '+error.message;throw error;}
// Read-only diagnostics for the isolated browser regression page.
window.locomotionLab={snapshot:()=>({...stats,loaded,stage:stages[index].label,states:engines.map(e=>e.fighters[0].motion.state)})};
