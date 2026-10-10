import {Renderer} from '../src/render.js';
import {FightEngine,CHARACTERS,FIXED_STEP,WORLD,fighterPose,MOVES} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {ENEMY_TYPES} from '../src/story-data.js';
import {resetFeet,usesRig} from '../src/locomotion.js';
import {paintedGeometry,evaluatePaintedPose} from '../src/painted-motion.js';
import {BONES} from '../src/locomotion-data.js';
import {entityScale} from '../src/story-world.js';
import {schoolEnemyFrame} from '../src/story-presentation.js';

const $=id=>document.getElementById(id),canvas=$('review'),r=new Renderer(canvas);
const ids=Object.keys(CHARACTERS),kinds=Object.keys(ENEMY_TYPES),moves=['idle','advance','retreat','depth','run','crouch','jump','punch','kick','crouchPunch','sweep','airPunch','airKick','block','hit','dizzy','knockdown','special','uppercut','super','victory','defeat'];
for(const id of ids)$('fighter').add(new Option(CHARACTERS[id].name,id));
for(const kind of kinds)$('enemy').add(new Option(ENEMY_TYPES[kind].name,kind));
for(const move of moves)$('action').add(new Option(move,move));
const query=new URLSearchParams(location.search);if(ids.includes(query.get('fighter')))$('fighter').value=query.get('fighter');
if(['story','versus','enemy'].includes(query.get('mode')))$('mode').value=query.get('mode');
if(moves.includes(query.get('action')))$('action').value=query.get('action');
let engine,f,target,slot=0,paused=false,running=false,age=0,last=0,report=null,events=[],viewMode='versus';
const oldEvent=e=>{events.push(e);r.event(e);};
await r.load(ids);await r.loadStory();

function scene(id=$('fighter').value,which=slot,mode=$('mode').value,kind=$('enemy').value){
 viewMode=mode;
 events=[];const other=id==='rafael'?'marcelo':'rafael';
 engine=mode==='versus'?new FightEngine({onEvent:oldEvent,random:()=>.61}):new StoryEngine({onEvent:oldEvent,random:()=>.61});
 if(mode==='versus'){engine.start(which?other:id,'local',which?id:other);engine.phase='fight';f=engine.fighters[which];target=engine.fighters[1-which];engine.fighters[0].x=500;engine.fighters[1].x=650;}
 else{
  engine.start(which?other:id,'story-local',which?id:other);engine.queue(0,'storyNext');engine.clearField();engine.story.wave=1;engine.camera=0;
  f=engine.fighters[which];f.x=which?650:500;engine.fighters[1-which].x=100;
  target=engine.spawnEnemy(mode==='enemy'?kind:'lab',which?545:605);target.aiTime=999;target.cooldown=999;
  f.direction=which?-1:1;target.direction=-f.direction;
 }
 f.prevX=f.x;target.prevX=target.x;resetFeet(f);resetFeet(target);f.meter=100;age=0;
 r.superFX.clear();r.fightFX.clear();r.shake=0;r.flash=0;
}
function receive(move='punch',damage=75,extra={}){
 engine.hit({attacker:target,target:f,move,data:{...MOVES.punch,damage,stun:.2,...extra},x:f.x,y:f.y-160},{active:false});
}
function startAction(action=$('action').value){
 const dir=f.direction;
 if(['advance','retreat','run'].includes(action)){const sign=dir*(action==='retreat'?-1:1);engine.setInput(f.slot,{left:sign<0,right:sign>0});if(action==='run'&&engine.storyActive)f.runUntil=engine.time+2;}
 else if(action==='depth'&&engine.storyActive)engine.setInput(f.slot,{up:true,right:true});
 else if(action==='crouch')engine.setInput(f.slot,{down:true});
 else if(action==='jump')engine.setInput(f.slot,{jump:true,right:dir>0,left:dir<0});
 else if(action==='block'){engine.setInput(f.slot,{block:true});engine.hit({attacker:target,target:f,move:'punch',data:MOVES.punch,x:f.x,y:f.y-150},f.guard);}
 else if(action==='hit')receive();
 else if(action==='dizzy'){for(let i=0;i<4;i++){f.invincible=0;receive('punch',15);} }
 else if(action==='knockdown')receive('sweep',65,{knockdown:true,launch:300});
 else if(action==='defeat')receive('punch',1100);
 else if(action==='victory'){engine.hit({attacker:f,target,move:'punch',data:{...MOVES.punch,damage:target.hp+100},x:target.x,y:target.y-150},{active:false});if(engine.storyActive)engine.finish(true);}
 else if(action!=='idle'){
  if(action.startsWith('air')){f.y=WORLD.floor-80;f.prevY=f.y;f.vy=-120;}
  if(['sweep','crouchPunch'].includes(action))engine.setInput(f.slot,{down:true});
  engine.beginMove(f,action,1);
 }
 if(viewMode==='enemy'){
  target.aiTime=0;target.cooldown=0;target.x=730;target.prevX=target.x;
  if(action==='hit'||action==='defeat')engine.hit({attacker:f,target,move:'punch',data:{...MOVES.punch,damage:action==='defeat'?target.hp+10:45},x:target.x,y:target.y-100},{active:false});
 }
}
function overlay(){
 if(!$('overlay').checked)return;
 const c=r.c;for(const v of [viewMode==='enemy'?target:f]){
  const pose=v.storyEnemy?{atlas:'enemy',index:schoolEnemyFrame(v)}:fighterPose(v),p=evaluatePaintedPose(v,paintedGeometry(v,pose));
  const s=entityScale(v),width=v.character.visualWidth??1,lane=v.lane??625;
  c.save();c.translate(v.x,v.y+lane-625);c.scale(v.direction*s*width,s);c.strokeStyle='#70ffd0';c.lineWidth=1/s;
  if(p){for(const [a,b]of BONES){c.beginPath();c.moveTo(p.joints[a*2],p.joints[a*2+1]);c.lineTo(p.joints[b*2],p.joints[b*2+1]);c.stroke();}for(let i=0;i<17;i++){c.fillStyle='#ffe19c';c.beginPath();c.arc(p.joints[i*2],p.joints[i*2+1],2.5/s,0,7);c.fill();}}
  c.restore();c.strokeStyle='#74ffd0';c.lineWidth=2;
  for(const foot of v.motion.feet){c.beginPath();c.arc(foot.x,v.y+foot.lane-625-foot.lift,5,0,7);c.stroke();}
  c.strokeStyle='#f3e6a888';c.beginPath();c.moveTo(v.x,190);c.lineTo(v.x,650);c.stroke();
  if(v.attackbox){const b=v.attackbox;c.strokeStyle='#ff9298';c.strokeRect(b.x,b.y+lane-625,b.w,b.h);}
 }
}
function paint(){r.draw(engine,0,1);overlay();const v=viewMode==='enemy'?target:f,pose=v.storyEnemy?{atlas:'enemy',index:schoolEnemyFrame(v)}:fighterPose(v);$('status').textContent=`${v.storyEnemy?v.profile.name:v.character.name} · ${engine.storyActive?'História':'1 × 1'} · ${v.state} ${v.movePhase??''} · ${pose.atlas}[${pose.index}] · ${v.direction>0?'direita':'esquerda'}\nHP ${Math.round(v.hp)} · apoios ${v.motion.feet.map(p=>p.support?'solo':'livre').join(' / ')}`;}
function restart(){scene();startAction();paint();}
for(const id of ['fighter','mode','enemy','action'])$(id).addEventListener('change',restart);
$('restart').onclick=restart;$('flip').onclick=()=>{slot=1-slot;restart();};$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Continuar':'Pausar';};
$('export').onclick=()=>{if(!report)return;const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));link.download='browser-audit.json';link.click();URL.revokeObjectURL(link.href);};
restart();
function loop(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(!running&&!paused){age+=dt;for(let i=0;i<Math.round(dt/FIXED_STEP);i++)engine.update(FIXED_STEP);if(age>3.1)restart();r.draw(engine,dt,1);overlay();}requestAnimationFrame(loop);}
requestAnimationFrame(loop);

const yieldFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
$('suite').onclick=async()=>{
 running=true;$('suite').disabled=true;report={startedAt:new Date().toISOString(),renderer:'src/render.js',characters:[],enemies:[],failures:[],limitations:['No photographic references in the repository','USB hardware and two-person online session are not exercised here']};
 try{
  for(const id of ids){
   const entry={id,cases:0,renderedSamples:0,hits:0,facings:[1,-1],modes:['versus','story'],actions:moves,caseResults:[]};
   for(const mode of ['versus','story'])for(const which of [0,1])for(const action of moves){
    scene(id,which,mode);startAction(action);let active=false,recovery=false;const hp=target.hp,indices=new Set(),states=new Set(),duration=action==='knockdown'?300:150;
    for(let tick=0;tick<duration;tick++){
     engine.update(FIXED_STEP);active||=f.movePhase==='active';recovery||=f.movePhase==='recovery'||(action.startsWith('air')||action==='uppercut')&&f.landing>0;indices.add(JSON.stringify(fighterPose(f)));states.add(f.state);
     if([4,15,35,80,duration-1].includes(tick)){paint();entry.renderedSamples++;}
    }
    if(target.hp<hp)entry.hits++;
    if(['punch','kick','crouchPunch','sweep','airPunch','airKick','uppercut'].includes(action)&&(!active||!recovery))report.failures.push({id,which,mode,action,error:'attack phases missing'});
    if(['advance','retreat'].includes(action)&&indices.size<2)report.failures.push({id,which,mode,action,error:'walking pose frozen'});
    entry.caseResults.push({mode,which,action,active,recovery,states:[...states],poses:[...indices].map(p=>JSON.parse(p)),hit:target.hp<hp});
    entry.cases++;await yieldFrame();
   }
   report.characters.push(entry);$('results').textContent=JSON.stringify(report,null,2);$('status').textContent=`Auditado ${id}: ${entry.cases} casos, ${entry.renderedSamples} desenhos renderizados`;
  }
  for(const kind of kinds){
   const seen=new Set(),phaseResults=[];let samples=0;
   for(const phase of ['walk','attack','damage','defeat']){
    scene('marcelo',0,'enemy',kind);target.aiTime=0;target.cooldown=0;
    if(phase==='walk'){f.x=400;f.prevX=f.x;target.x=960;target.prevX=target.x;resetFeet(f);resetFeet(target);}
    if(phase==='damage'||phase==='defeat')engine.hit({attacker:f,target,move:'punch',data:{...MOVES.punch,damage:phase==='defeat'?target.hp+10:45},x:target.x,y:target.y-100},{active:false});
    const startX=target.x,phaseFrames=new Set(),phaseStates=new Set();
    for(let tick=0;tick<240;tick++){engine.update(FIXED_STEP);const frame=schoolEnemyFrame(target);seen.add(frame);phaseFrames.add(frame);phaseStates.add(target.state);if(tick%30===0){paint();samples++;}}
    phaseResults.push({phase,frames:[...phaseFrames],states:[...phaseStates],displacement:target.x-startX});
    if(phase==='walk'&&(Math.abs(target.x-startX)<1||phaseFrames.size<2))report.failures.push({kind,phase,error:'enemy did not move and animate during the approach fixture'});
    await yieldFrame();
   }
   report.enemies.push({kind,renderedSamples:samples,observedFrames:[...seen],phaseResults});
  }
  report.finishedAt=new Date().toISOString();report.status=report.failures.length?'FAIL':'PASS';$('status').textContent=`${report.status}: 12 lutadores, 16 inimigos, ${report.characters.reduce((n,c)=>n+c.cases,0)} casos. Confira também as pranchas e os rostos.`;$('results').textContent=JSON.stringify(report,null,2);
 }catch(error){report.status='ERROR';report.failures.push({error:String(error),stack:error.stack});$('status').textContent=String(error);$('results').textContent=JSON.stringify(report,null,2);}
 finally{running=false;paused=true;$('pause').textContent='Continuar';$('suite').disabled=false;}
};
