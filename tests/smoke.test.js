import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,FIXED_STEP,WORLD,CHEMISTRY} from '../src/engine.js';
import {DIZZY} from '../src/motion.js';
import {FightEffects} from '../src/fight-fx.js';

const advance=(g,t)=>{for(let n=0;n<Math.ceil(t/FIXED_STEP);n++)g.update(FIXED_STEP);};
function until(g,predicate,t=4){for(let n=0;n<t/FIXED_STEP&&!predicate();n++)g.update(FIXED_STEP);assert.ok(predicate(),'condição de combate atingida');}
function scene(slot=0,opponent='marcelo'){
 const events=[],g=new FightEngine({random:()=>.6,onEvent:e=>events.push(e)});
 g.start(slot===0?'gustavo':opponent,'local',slot===0?opponent:'gustavo');g.phase='fight';
 g.fighters[0].x=340;g.fighters[1].x=860;
 return {g,events,f:g.fighters[slot],target:g.fighters[1-slot]};
}
test('a névoa real atinge uma vez, anuncia sua fala e deixa tonto em um único acerto nos dois lados',()=>{
 for(const slot of [0,1])for(const opponent of ['marcelo','rafael'])for(const strength of [0,1,2]){
  const {g,f,target,events}=scene(slot,opponent);g.queue(slot,'special',strength);
  until(g,()=>g.projectiles.length===1);assert.equal(g.projectiles[0].effect,'chemicalSmoke');
  assert.equal(g.projectiles[0].radius,CHEMISTRY.smokeRadius);
  until(g,()=>target.state==='dizzy');assert.equal(f.combo,1);assert.equal(target.dizzyCause,'chemicalSmoke');
  assert.ok(target.dizzyTime>1.8&&target.dizzyTime<=CHEMISTRY.smokeDuration);
  assert.equal(target.canAct,false);assert.equal(target.guard.active,false);assert.ok(target.hp<1000);
  assert.equal(events.filter(e=>e.type==='hit').length,1);assert.equal(events.filter(e=>e.type==='dizzy').length,1);
  assert.deepEqual(events.filter(e=>e.type==='special').map(e=>[e.name,e.quote]),[['Névoa Atômica','Névoa atômica!']]);
  until(g,()=>target.canAct);assert.equal(target.dizzyCause,null);assert.ok(target.dizzyProtection>3.9);
 }
});
test('guarda alta ou baixa bloqueia a fumaça sem tontura nem acúmulo de stun',()=>{
 for(const slot of [0,1])for(const down of [false,true]){
  const {g,target,events}=scene(slot);g.setInput(1-slot,{block:true,down});g.queue(slot,'special');
  until(g,()=>events.some(e=>e.type==='block'));advance(g,.5);
  assert.equal(target.dizzyPending,false);assert.equal(target.dizzyTime,0);assert.equal(target.stunGauge,0);
  assert.ok(target.hp>=995);assert.ok(!events.some(e=>e.type==='dizzy'));
 }
});
test('a fumaça respeita invulnerabilidade e pode ser evitada saltando por cima dela',()=>{
 for(const evade of ['invulnerable','jump']){
  const {g,target,events}=scene();g.queue(0,'special');
  if(evade==='invulnerable')target.invincible=3.2;
  else {advance(g,.125);g.setInput(1,{jump:true,left:true});advance(g,.08);g.setInput(1,{});}
  advance(g,3.3);assert.equal(target.hp,1000);assert.equal(target.dizzyTime,0);assert.equal(target.dizzyPending,false);
  assert.equal(events.filter(e=>e.type==='hit').length,0);
 }
});
test('outro golpe interrompe a tontura química e a proteção impede renovar a trava com outra fumaça',()=>{
 const {g,f,target,events}=scene();g.queue(0,'special');until(g,()=>target.state==='dizzy');
 g.hit({attacker:f,target,move:'punch',x:target.x,y:target.y-220});
 assert.equal(target.dizzyTime,0);assert.equal(target.dizzyCause,null);assert.equal(target.state,'hit');
 assert.ok(target.dizzyProtection>3.9);until(g,()=>target.canAct);const hp=target.hp;
 g.queue(0,'special');until(g,()=>target.hp<hp);advance(g,.5);
 assert.equal(target.dizzyPending,false);assert.equal(target.dizzyTime,0);assert.equal(events.filter(e=>e.type==='dizzy').length,1);
});
test('a proteção natural após a névoa expirar permite receber dano sem novo atordoamento imediato',()=>{
 const {g,target,events}=scene();g.queue(0,'special');until(g,()=>target.state==='dizzy');until(g,()=>target.canAct);
 const hp=target.hp;g.queue(0,'special');until(g,()=>target.hp<hp);advance(g,.3);
 assert.equal(target.dizzyPending,false);assert.equal(target.dizzyTime,0);assert.equal(events.filter(e=>e.type==='dizzy').length,1);
});
test('pausa mantém o tempo da névoa e troca de round limpa o status preservando as barras',()=>{
 const {g,f,target}=scene();g.queue(0,'special');until(g,()=>g.projectiles.length>0);
 const p={...g.projectiles[0]};g.togglePause();advance(g,1);assert.equal(g.projectiles[0].x,p.x);assert.equal(g.projectiles[0].life,p.life);
 g.togglePause();until(g,()=>target.state==='dizzy');const time=target.dizzyTime;g.togglePause();advance(g,1);assert.equal(target.dizzyTime,time);
 g.togglePause();f.meter=67;target.meter=83;g.newRound();assert.equal(f.meter,67);assert.equal(target.meter,83);
 assert.equal(target.pendingDizzyDuration,0);assert.equal(target.dizzyCause,null);assert.equal(target.pendingDizzyCause,null);assert.equal(target.dizzyTime,0);
 assert.equal(g.projectiles.length,0);assert.equal(target.y,WORLD.floor);
});
test('um nocaute por fumaça termina o round sem iniciar tontura',()=>{
 const {g,target,events}=scene();target.hp=1;g.queue(0,'special');until(g,()=>g.phase==='roundEnd');
 assert.equal(target.hp,0);assert.equal(target.dizzyTime,0);assert.equal(target.dizzyPending,false);assert.ok(!events.some(e=>e.type==='dizzy'));
});
test('vapor de impacto é limitado e desaparece, inclusive ao trocar de round',()=>{
 const fx=new FightEffects();for(let n=0;n<30;n++)fx.event({type:'hit',effect:'chemicalSmoke',x:400,y:430,color:'#77dcf5'});
 assert.equal(fx.vapors.length,8);fx.update(1);assert.equal(fx.vapors.length,0);
 fx.event({type:'block',effect:'chemicalSmoke',x:400,y:430});assert.equal(fx.vapors.length,1);
 fx.event({type:'round'});assert.equal(fx.vapors.length,0);assert.equal(DIZZY.protection,4);
});
