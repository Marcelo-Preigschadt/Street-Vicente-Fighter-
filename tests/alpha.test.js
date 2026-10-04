import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,FIXED_STEP,WORLD,ALPHA,MOVES,fighterPose} from '../src/engine.js';
import {FIGHTING_STYLES} from '../src/styles.js';
import {FightEffects} from '../src/fight-fx.js';
import {TECHNIQUE_HURT} from '../src/technique-data.js';
const advance=(g,s)=>{for(let i=0;i<Math.round(s/FIXED_STEP);i++)g.update(FIXED_STEP);};
function until(g,condition,seconds=3){for(let i=0;i<seconds/FIXED_STEP&&!condition();i++)g.update(FIXED_STEP);assert.ok(condition());}
function scene(id='marcelo',slot=0){
 const events=[],g=new FightEngine({onEvent:e=>events.push(e)}),other=id==='marcelo'?'rafael':'marcelo';
 g.start(slot===0?id:other,'local',slot===0?other:id);g.phase='fight';g.fighters[0].x=450;g.fighters[1].x=570;
 return {g,events,f:g.fighters[slot],target:g.fighters[1-slot],slot};
}
test('sequências reais de três golpes fortes já deixam os três rivais tontos, nos dois lados',()=>{
 for(const id of Object.keys(FIGHTING_STYLES))for(const slot of [0,1]){
  const s=scene(id,slot),route=FIGHTING_STYLES[id].combos.find(c=>c.steps.length===3);
  for(const [i,token]of route.steps.entries()){
   const [move,strength]=token.split(':');s.g.setInput(slot,{down:move==='crouchPunch'});s.g.queue(slot,move,Number(strength));
   until(s.g,()=>s.events.filter(e=>e.type==='hit'&&e.fighter===slot).length===i+1);
  }
  assert.equal(s.f.combo,3);assert.equal(s.target.dizzyPending,true);assert.equal(s.target.dizzyTime,0);
  until(s.g,()=>s.target.state==='dizzy');assert.ok(s.target.dizzyTime>2);assert.equal(s.target.canAct,false);
 }
});
test('normais mostram preparação, rotação, contato e recolhimento; colisões seguem cada desenho',()=>{
 for(const id of Object.keys(TECHNIQUE_HURT))for(const direction of [-1,1])for(const [move,strength]of [['punch',1],['punch',2],['kick',1],['kick',2],['crouchPunch',1],['sweep',1]]){
  const {g,f,target}=scene(id);target.x=1100;f.direction=direction;assert.ok(g.beginMove(f,move,strength));
  const m=f.moveData,indices=[];
  for(const t of [0,m.startup*.7,m.startup+.005,m.startup+m.active+.01]){
   f.actionTime=t;const pose=fighterPose(f);indices.push(pose.index%4);
   assert.equal(f.attackbox!==null,t>=m.startup&&t<m.startup+m.active);
   const body=TECHNIQUE_HURT[id][pose.atlas][pose.index];
   assert.deepEqual(f.hurtboxes.slice(0,3),body.map(([x,h,w,height])=>({x:f.x+(direction>0?x:-x-w),y:f.y-h,w,h:height})));
  }assert.deepEqual(indices,[0,1,2,3]);
 }
});
test('impacto na cabeça, no corpo ou agachado escolhe sua própria reação e recupera em quatro poses',()=>{
 for(const id of Object.keys(TECHNIQUE_HURT))for(const region of ['head','body','crouch']){
  const {g,f,target}=scene(id);target.state=region==='crouch'?'crouch':'idle';
  g.hit({attacker:f,target,move:'punch',x:target.x,y:target.y-(region==='head'?240:150)});
  const row=region==='crouch'?3:region==='head'?1:2;
  for(const [i,p]of [0,.3,.6,.9].entries()){
   target.hitstun=target.hitDuration*(1-p);assert.deepEqual(fighterPose(target),{atlas:'reaction',index:row*4+i});
  }
 }
});
test('Combo Livre cobra meia barra, cancela no vazio e não permite fugir, pular nem defender',()=>{
 for(const slot of [0,1]){
  const {g,f,target}=scene('marcelo',slot);f.x=slot?1000:280;target.x=slot?200:1080;
  f.meter=49;g.queue(slot,'custom');assert.equal(f.customTime,0);assert.equal(f.meter,49);
  f.meter=100;g.queue(slot,'custom');assert.equal(f.meter,50);assert.equal(f.customTime,ALPHA.customDuration);
  g.setInput(slot,{left:f.direction>0,right:f.direction<0,jump:true,block:true});const x=f.x;advance(g,.08);
  assert.ok((f.x-x)*f.direction>0);assert.equal(f.airborne,false);assert.equal(f.guard.active,false);assert.equal(g.beginFootwork(f,'retreat'),false);
  g.setInput(slot,{});g.queue(slot,'punch',0);until(g,()=>f.movePhase==='active');assert.equal(f.actionHit,false);
  const contactX=f.x;advance(g,2/60);assert.ok((f.x-contactX)*f.direction>0);
  g.queue(slot,'kick',1);advance(g,FIXED_STEP);assert.equal(f.action,'kick');assert.equal(f.customMoves,2);
  assert.equal(f.meter,50);assert.equal(f.moveData.meter,0);
 }
});
test('Combo Livre para ao receber golpe, na pausa e na troca de round; sua sequência tem limite',()=>{
 const {g,f,target}=scene();target.x=1100;f.meter=100;g.queue(0,'custom');
 const time=f.customTime;g.togglePause();advance(g,1);assert.equal(f.customTime,time);g.togglePause();
 for(let n=0;n<ALPHA.customLimit;n++){
  g.queue(0,'punch',0);until(g,()=>f.customMoves===n+1);until(g,()=>f.actionTime>=f.moveData.startup+2/60);
 }
 const count=f.customMoves;g.queue(0,'punch',0);advance(g,.15);assert.equal(f.customMoves,count);
 g.hit({attacker:target,target:f,move:'punch',x:f.x,y:f.y-210});assert.equal(f.customTime,0);
 f.meter=73;f.customTime=1;g.newRound();assert.equal(f.customTime,0);assert.equal(f.meter,73);
});
test('contra de defesa exige impacto bloqueado e barra, derruba perto e falha à distância',()=>{
 for(const slot of [0,1])for(const far of [false,true]){
  const {g,f,target}=scene('marcelo',slot);f.meter=100;
  g.queue(slot,'guardCounter');assert.equal(f.action,null);assert.equal(f.meter,100);
  g.setInput(slot,{block:true});g.hit({attacker:target,target:f,move:'punch',x:f.x,y:f.y-210});
  f.meter=24;const stun=f.blockstun;g.queue(slot,'guardCounter');assert.equal(f.blockstun,stun);assert.equal(f.meter,24);
  f.meter=100;if(far)target.x=slot?200:1080;g.queue(slot,'guardCounter');
  assert.equal(f.meter,75);assert.equal(f.action,'guardCounter');assert.equal(f.blockstun,0);assert.ok(f.invincible>0);
  advance(g,.4);assert.equal(target.knocked,!far);assert.equal(target.hp<1000,!far);
 }
});
test('levantamento rápido exige um toque novo ao cair; agarrão e tontura impedem',()=>{
 for(const kind of ['normal','held','throw','dizzy','late']){
  const {g,f,target,events}=scene();if(kind==='held')g.setInput(1,{down:true});
  g.hit({attacker:f,target,move:kind==='throw'?'throw':'sweep',data:MOVES[kind==='throw'?'throw':'sweep'],x:target.x,y:target.y-40});
  if(kind==='dizzy')target.dizzyPending=true;
  until(g,()=>!target.airborne);if(kind==='late')advance(g,.2);
  g.setInput(1,{down:true});advance(g,.025);
  assert.equal(events.some(e=>e.type==='quickRise'),kind==='normal');
  if(kind==='normal'){advance(g,.25);assert.equal(target.knocked,false);assert.equal(target.wakeTime,0);assert.equal(target.invincible,0);}
 }
});
test('impactos e efeitos têm limite, respeitam pausa e limpam no round',()=>{
 const fx=new FightEffects();for(let i=0;i<60;i++)fx.event({type:'hit',x:600,y:400,strength:2});assert.equal(fx.impacts.length,24);
 fx.event({type:'projectile',x:600,y:400});fx.event({type:'land',x:600});fx.update(0);assert.equal(fx.impacts[0].age,0);
 fx.update(.5);assert.equal(fx.impacts.length,0);assert.equal(fx.casts.length,0);assert.equal(fx.dust.length,0);
 fx.event({type:'customStart',x:600,y:400});fx.event({type:'round'});assert.equal(fx.casts.length,0);
});
