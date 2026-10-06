import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine,FIXED_STEP,WORLD,MOVES,fighterPose } from '../src/engine.js';
import { FOOTWORK,DIZZY } from '../src/motion.js';
import { MOTION_HURT } from '../src/motion-data.js';
import { FIGHTING_STYLES } from '../src/styles.js';

const advance=(g,seconds)=>{for(let n=0;n<Math.round(seconds/FIXED_STEP);n++)g.update(FIXED_STEP);};
function until(g,condition,seconds=3){for(let n=0;n<seconds/FIXED_STEP&&!condition();n++)g.update(FIXED_STEP);assert.ok(condition());}
function scene(id='marcelo',slot=0,random=()=>.6) {
 const events=[],g=new FightEngine({random,onEvent:e=>events.push(e)}),other=id==='marcelo'?'gustavo':'marcelo';
 g.start(slot===0?id:other,'local',slot===0?other:id);g.phase='fight';g.fighters[0].x=450;g.fighters[1].x=570;
 return {g,events,f:g.fighters[slot],target:g.fighters[1-slot],slot};
}
const input=sign=>({left:sign<0,right:sign>0});
function tapStep(g,f,kind) {
 const sign=f.direction*(kind==='advance'?1:-1);
 g.setInput(f.slot,input(sign));advance(g,.025);g.setInput(f.slot,{});advance(g,.025);g.setInput(f.slot,input(sign));
}
function bigCombo(s) {
 const route=FIGHTING_STYLES[s.f.character.id].combos.find(c=>c.steps.length===4);
 for(const [i,token]of route.steps.entries()){
  const [move,strength]=token.split(':');s.g.setInput(s.slot,{down:['sweep','crouchPunch'].includes(move)});s.g.queue(s.slot,move,Number(strength));
  until(s.g,()=>s.events.filter(e=>e.type==='hit'&&e.fighter===s.slot).length===i+1);
 }
 s.g.setInput(s.slot,{});return route;
}

test('dois toques separados pelo neutro produzem passos diferentes de cada modalidade, nos dois lados',()=>{
 for(const id of Object.keys(FOOTWORK))for(const slot of [0,1])for(const kind of ['advance','retreat']) {
  const {g,f,target}=scene(id,slot);f.x=slot?950:300;target.x=slot?250:1000;
  tapStep(g,f,kind);assert.equal(f.footwork.kind,kind);assert.equal(fighterPose(f).atlas,['gelton','marcelino','marcos'].includes(id)?'base':'motion');
  const x=f.x,sign=f.footwork.sign;g.setInput(slot,{});advance(g,FOOTWORK[id][kind].duration+.01);
  assert.ok(Math.abs(f.x-x-sign*FOOTWORK[id][kind].distance)<1e-7);assert.equal(f.footwork,null);
 }
 assert.ok(FOOTWORK.rafael.retreat.duration<FOOTWORK.gustavo.retreat.duration);
 assert.equal(new Set(Object.values(FOOTWORK).map(v=>v.stride)).size,6);
});

test('segurar uma direção, toques atrasados e comandos diagonais de poder não viram passos',()=>{
 for(const type of ['held','late','motion']) {
  const {g,f,target}=scene();target.x=1000;
  if(type==='motion')for(const value of [{right:true},{},{down:true},{down:true,right:true},{right:true}]){g.setInput(0,value);advance(g,.02);}
  else {g.setInput(0,{right:true});advance(g,type==='late'?.3:.1);g.setInput(0,type==='held'?{right:true}:{});g.setInput(0,{right:true});}
  assert.equal(f.footwork,null);
 }
});

test('passos respeitam paredes, corpos e vulnerabilidade; não atravessam o adversário',()=>{
 for(const slot of [0,1]) {
  const {g,f,target}=scene('rafael',slot);tapStep(g,f,'advance');g.setInput(slot,{});advance(g,.25);
  assert.ok(g.fighters[1].x-g.fighters[0].x>=112-1e-8);assert.ok(f.hurtboxes.length>0);
  f.x=slot?1170:110;target.x=slot?500:800;f.footworkCooldown=0;
  assert.ok(g.beginFootwork(f,'retreat'));advance(g,.3);assert.equal(f.x,slot?1170:110);
 }
 const s=scene('rafael');s.target.x=900;s.g.beginFootwork(s.f,'retreat');
 const hp=s.f.hp;s.g.hit({attacker:s.target,target:s.f,move:'special',data:MOVES.special,x:s.f.x,y:s.f.y-200});
 assert.ok(s.f.hp<hp);assert.equal(s.f.footwork,null);assert.equal(s.f.invincible,0);
});

test('entrada pode terminar em ataque após sua preparação; recuo precisa terminar antes de atacar',()=>{
 for(const id of Object.keys(FOOTWORK))for(const kind of ['advance','retreat']) {
  const {g,f,target}=scene(id);target.x=1000;assert.ok(g.beginFootwork(f,kind));
  assert.equal(g.beginMove(f,'punch',0),false);
  advance(g,kind==='advance'?FOOTWORK[id].advance.cancelAt:FOOTWORK[id].retreat.duration/2);
  const began=g.beginMove(f,'punch',0);assert.equal(began,kind==='advance');
  if(began)assert.equal(f.footwork,null);
 }
});

test('passos têm o mesmo deslocamento a 30, 60 e 120 Hz e param durante a pausa',()=>{
 for(const id of Object.keys(FOOTWORK))for(const fps of [30,60,120]) {
  const {g,f,target}=scene(id);f.x=300;target.x=1000;g.beginFootwork(f,'advance');
  const x=f.x;g.togglePause();for(let n=0;n<fps;n++)g.update(1/fps);assert.equal(f.x,x);assert.equal(f.footwork.time,0);
  g.togglePause();for(let n=0;n<fps;n++)g.update(1/fps);
  assert.ok(Math.abs(f.x-x-FOOTWORK[id].advance.distance)<1e-7);
 }
});

test('a silhueta física segue as novas poses de passo, recuo e tontura nos dois sentidos',()=>{
 for(const id of Object.keys(MOTION_HURT))for(const direction of [-1,1]) {
  const {f}=scene(id);f.direction=direction;
  for(const index of [8,9,10,11,12,13,14,15]) {
   f.state=index>=12?'dizzy':'stepIn';f.animTime=(index-12)/7+.001;
   f.footwork=index<12?{kind:index<10?'advance':'retreat',time:index%2?.08:0,duration:.1}:null;
   const pose=fighterPose(f);assert.equal(pose.index,index);
   assert.deepEqual(f.hurtboxes,MOTION_HURT[id][index].map(([x,h,w,height])=>({x:f.x+(direction>0?x:-x-w),y:f.y-h,w,h:height})));
  }
 }
});

test('as três sequências de quatro acertos deixam o adversário tonto depois da reação final, nos dois lados',()=>{
 for(const id of Object.keys(FOOTWORK))for(const slot of [0,1]) {
  const s=scene(id,slot);bigCombo(s);assert.equal(s.f.combo,4);assert.equal(s.target.dizzyPending,true);
  assert.equal(s.target.dizzyTime,0);until(s.g,()=>s.target.state==='dizzy');
  assert.ok(s.target.dizzyTime>2);assert.equal(s.target.y,WORLD.floor);assert.equal(s.target.knocked,false);
  assert.equal(s.events.filter(e=>e.type==='dizzy').length,1);assert.equal(s.target.canAct,false);
  s.g.setInput(1-slot,{block:true,jump:true,right:true});s.g.queue(1-slot,'super');
  const x=s.target.x,y=s.target.y;advance(s.g,.1);
  assert.equal(s.target.guard.active,false);assert.equal(s.target.action,null);assert.equal(s.target.x,x);assert.equal(s.target.y,y);
 }
});

test('bloqueios, golpes no vazio e uma sequência curta não provocam tontura',()=>{
 for(const kind of ['block','whiff','short']) {
  const s=scene('rafael');if(kind==='block')s.g.setInput(1,{block:true});if(kind==='whiff')s.target.x=1050;
  if(kind==='short') {
   for(const [i,strength]of [0,1].entries()){s.g.queue(0,'punch',strength);until(s.g,()=>s.events.filter(e=>e.type==='hit').length===i+1);}
  } else {s.g.queue(0,'punch',0);advance(s.g,.6);}
  assert.equal(s.target.dizzyPending,false);assert.equal(s.target.dizzyTime,0);
  if(kind!=='short')assert.equal(s.target.stunGauge,0);
 }
});

test('tontura termina sozinha ou mais cedo com comandos alternados; segurar e repetição no mesmo tick não aceleram',()=>{
 const recover=kind=>{
  const s=scene('rafael');bigCombo(s);until(s.g,()=>s.target.state==='dizzy');s.g.setInput(1,{});
  let ticks=0;for(;ticks<400&&s.target.dizzyTime>0;ticks++) {
   if(kind==='mash'&&ticks%12===0)s.g.queue(1,'punch');
   if(kind==='held')s.g.setInput(1,{right:true});
   if(kind==='spam')for(let n=0;n<20;n++)s.g.queue(1,'punch');
   s.g.update(FIXED_STEP);
  }
  assert.ok(s.target.dizzyProtection>0);assert.equal(s.target.buffer,null);return ticks;
 };
 const normal=recover('normal');assert.ok(normal>270&&normal<285);
 assert.ok(recover('mash')<normal-50);assert.ok(recover('held')>=normal-8);
 assert.ok(recover('spam')>160);
});

test('acertar um oponente tonto abre nova sequência e impede tontura repetida imediatamente',()=>{
 const s=scene('marcelo');bigCombo(s);until(s.g,()=>s.target.state==='dizzy');
 s.g.hit({attacker:s.f,target:s.target,move:'punch',data:MOVES.punch,x:s.target.x,y:s.target.y-200});
 assert.equal(s.target.state,'hit');assert.equal(s.target.dizzyTime,0);assert.ok(s.target.dizzyProtection>3);
 assert.equal(s.f.combo,1);
 for(let n=0;n<6;n++)s.g.hit({attacker:s.f,target:s.target,move:'punch',data:MOVES.punch,x:s.target.x,y:s.target.y-200});
 assert.equal(s.target.dizzyPending,false);assert.equal(s.target.stunGauge,0);
});

test('carga de tontura decai com intervalo sem acertos; nocaute e novo round limpam tontura e preservam super',()=>{
 const s=scene();s.target.stunGauge=75;advance(s.g,1);assert.ok(s.target.stunGauge<60);
 s.f.meter=67;s.target.meter=83;s.target.dizzyPending=true;s.g.startDizzy(s.target);
 s.g.newRound();assert.deepEqual(s.g.fighters.map(f=>f.meter),[67,83]);
 assert.ok(s.g.fighters.every(f=>f.dizzyTime===0&&!f.dizzyPending&&f.stunGauge===0&&f.footwork===null));
 s.g.phase='fight';s.target.hp=1;s.g.hit({attacker:s.f,target:s.target,move:'punch',data:MOVES.punch,x:s.target.x,y:s.target.y-200});
 assert.equal(s.target.hp,0);assert.equal(s.target.dizzyPending,false);
});

test('punir preparação ou recuperação dá contra-ataque; acertar guarda ou alvo parado não',()=>{
 for(const phase of ['startup','recovery','idle','guard']) {
  const {g,f,target,events}=scene('rafael');target.x=1000;
  if(['startup','recovery'].includes(phase)) {g.beginMove(target,'kick',2);if(phase==='recovery')target.actionTime=target.moveData.startup+target.moveData.active+.01;}
  if(phase==='guard')g.setInput(1,{block:true});
  g.hit({attacker:f,target,move:'punch',data:MOVES.punch,x:target.x,y:target.y-200});
  const e=events.find(e=>e.type==='hit');
  if(phase==='guard'){assert.equal(e,undefined);assert.equal(target.hp,1000);}else {
   assert.equal(e.counter,['startup','recovery'].includes(phase));assert.equal(e.damage,Math.round(MOVES.punch.damage*(e.counter?1.12:1)));
  }
 }
});

test('CPU busca pressão curta, recuo de boxe e distância de chutes em decisões diferentes',()=>{
 for(const id of Object.keys(FOOTWORK)) {
  const {g,f,target}=scene(id,1,()=>.9);g.cpu=true;f.x=650;target.x=490;g.ai.timer=0;g.ai.actionTimer=1;
  g.updateAI(FIXED_STEP);
  if(id==='gustavo')assert.equal(f.input.right,true);else assert.equal(f.input.right,false);
 }
 const r=scene('rafael',1,()=>.1);r.g.cpu=true;r.g.beginMove(r.target,'punch',2);r.g.updateAI(FIXED_STEP);assert.equal(r.f.footwork?.kind,'retreat');
 const m=scene('marcelo',1,()=>.1);m.f.x=820;m.target.x=480;m.g.cpu=true;m.g.updateAI(FIXED_STEP);assert.equal(m.f.footwork?.kind,'advance');
});
