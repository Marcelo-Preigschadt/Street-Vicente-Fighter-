import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,CHARACTERS,WORLD,FIXED_STEP} from '../src/engine.js';
const advance=(g,s)=>{for(let i=0;i<Math.ceil(s/FIXED_STEP);i++)g.update(FIXED_STEP);};
function scene(id){
 const events=[],g=new FightEngine({onEvent:e=>events.push(e)});
 g.start(id,'local',id==='rafael'?'marcelo':'rafael');g.phase='fight';g.fighters[0].x=250;g.fighters[1].x=1050;
 g.setInput(0,{jump:true});advance(g,.16);assert.ok(g.fighters[0].airborne);return {g,f:g.fighters[0],events};
}
for(const id of Object.keys(CHARACTERS))for(const move of ['punch','kick','special','uppercut','super']){
 test(`${id} executa ${move} no ar mesmo segurando pulo`,()=>{
  const {g,f,events}=scene(id);f.meter=100;const y=f.y;
  g.queue(0,move);advance(g,FIXED_STEP);
  assert.equal(f.action,move==='punch'?'airPunch':move==='kick'?'airKick':move);assert.ok(f.airborne);assert.ok(f.y<=y);
  if(move==='super'){assert.equal(f.meter,0);assert.ok(events.some(e=>e.type==='superStart'));}
  advance(g,.50);
  if(['special','uppercut','super'].includes(move))assert.ok(events.some(e=>e.type==='special'&&e.move===move));
  if(move==='special'&&f.character.projectile&&!['marcos','joao'].includes(id)){
   const shot=events.find(e=>e.type==='projectile');assert.ok(shot);assert.ok(shot.y<WORLD.floor-f.character.projectile.height);
  }
 });
}
test('soco aéreo recuperado permite poder no mesmo salto sem sobrepor golpes',()=>{
 const {g,f}=scene('rafael');g.setInput(0,{});g.queue(0,'punch',0);advance(g,.05);assert.equal(f.action,'airPunch');
 g.queue(0,'special');advance(g,.12);assert.equal(f.action,'airPunch');
 advance(g,.26);assert.equal(f.action,null);assert.ok(f.airborne);g.queue(0,'special');advance(g,FIXED_STEP);assert.equal(f.action,'special');
});
test('meia-lua com soco dispara poder durante o salto',()=>{
 const {g,f}=scene('gustavo');for(const input of [{down:true},{down:true,right:true},{right:true}])g.setInput(0,input);
 g.queue(0,'punch');advance(g,FIXED_STEP);assert.equal(f.action,'special');assert.ok(f.airborne);
});
test('Marcos usa os poderes de agarrão contra rival aéreo próximo, sem pegar rival distante verticalmente',()=>{
 for(const move of ['special','super'])for(const sameHeight of [true,false]){
  const {g,f}=scene('marcos'),target=g.fighters[1];g.setInput(0,{});f.y=WORLD.floor-350;f.vy=0;f.x=450;f.meter=100;
  target.x=575;target.y=sameHeight?f.y:WORLD.floor;target.vy=0;
  g.queue(0,move);advance(g,move==='super'?.43:.32);assert.equal(target.hp<1000,sameHeight);
 }
});
