import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,Fighter,CHARACTERS,FIXED_STEP,WORLD,fighterPose,FIGHTING_STYLES} from '../src/engine.js';
import {JUDO_HURT,JUDO_LAYOUT} from '../src/judo-data.js';
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t/FIXED_STEP);i++)g.update(FIXED_STEP);};
function scene(slot=0,distance=140){
  const events=[],g=new FightEngine({random:()=>.47,onEvent:e=>events.push(e)});
  g.start(slot?'rafael':'marcos','local',slot?'marcos':'rafael');g.phase='fight';
  g.fighters[0].x=450;g.fighters[1].x=450+distance;
  return {g,events,f:g.fighters[slot],target:g.fighters[1-slot],slot};
}
test('Marcos tem 32 poses próprias e silhuetas de Judô finitas e completas',()=>{
  assert.equal(FIGHTING_STYLES.marcos.name,'Judô');
  for(const atlas of ['base','combat']){
    assert.equal(JUDO_LAYOUT[atlas].length,16);assert.equal(JUDO_HURT[atlas].length,16);
    for(const bands of JUDO_HURT[atlas])assert.ok(bands.every(b=>b.every(Number.isFinite)&&b[2]>0&&b[3]>0));
  }
  const f=new Fighter('marcos',0);f.moveData={startup:.1,active:.2};f.actionTime=.15;
  for(const [state,index]of [['punch',2],['sweep',6],['throw',10],['uppercut',14],['super',10]]){
    f.state=state;assert.deepEqual(fighterPose(f),{atlas:'combat',index});
  }
});
test('Sequestro de Sessão vence guarda alta e baixa nos dois lados e não cria projéteis',()=>{
  for(const slot of [0,1])for(const down of [false,true]){
    const s=scene(slot,200);s.g.setInput(1-slot,{block:true,down});assert.ok(s.g.beginMove(s.f,'special',1));
    advance(s.g,.7);assert.ok(s.target.hp<1000);assert.ok(s.events.some(e=>e.type==='hit'&&e.move==='special'));
    assert.equal(s.events.some(e=>e.type==='block'),false);assert.equal(s.g.projectiles.length,0);assert.equal(s.g.drones.length,0);
  }
});
test('agarrão especial erra contra adversário distante e contra alvo aéreo',()=>{
  for(const airborne of [false,true]){
    const s=scene(0,airborne?140:450);s.target.y=airborne?WORLD.floor-180:WORLD.floor;s.target.vy=airborne?-500:0;
    s.g.beginMove(s.f,'special',1);advance(s.g,.35);assert.equal(s.target.hp,1000);
  }
});
test('agarrões de Marcos preservam o avanço quando o jogador segura para frente',()=>{
  for(const slot of [0,1])for(const move of ['special','super']){
    const s=scene(slot,200);s.f.meter=100;
    s.g.setInput(slot,{left:slot===1,right:slot===0});
    assert.ok(s.g.beginMove(s.f,move,1));assert.ok(s.f.moveData.advance>0);
    advance(s.g,.7);assert.ok(s.target.hp<1000);
  }
});
test('Pilha Reversa projeta alvo aéreo mantendo o judoca no chão',()=>{
  const s=scene(0,115);s.target.y=WORLD.floor-100;s.target.vy=-100;
  s.g.beginMove(s.f,'uppercut',1);advance(s.g,.26);
  assert.ok(s.target.hp<1000);assert.equal(s.f.airborne,false);assert.equal(s.target.knocked,true);
  assert.equal(s.g.projectiles.length,0);
});
test('Kernel Panic exige barra cheia e aplica uma projeção única, com recuperação punível',()=>{
  for(const slot of [0,1]){
    const s=scene(slot,200);s.f.meter=99;assert.equal(s.g.beginMove(s.f,'super',1),false);
    s.f.meter=100;s.g.setInput(1-slot,{block:true});assert.ok(s.g.beginMove(s.f,'super',1));assert.equal(s.f.meter,0);
    advance(s.g,1.2);assert.equal(s.events.filter(e=>e.type==='hit'&&e.move==='super').length,1);
    assert.ok(s.target.hp<=604);assert.equal(s.g.projectiles.length,0);assert.equal(s.g.drones.length,0);
  }
});
test('Judô joga contra todos os professores em P1 e P2, inclusive CPU',()=>{
  for(const other of Object.keys(CHARACTERS).filter(id=>id!=='marcos'))for(const slot of [0,1]){
    const g=new FightEngine({random:()=>.47});g.start(slot?other:'marcos','cpu',slot?'marcos':other);
    advance(g,6);for(const f of g.fighters){assert.ok(Number.isFinite(f.x));assert.ok(f.hurtboxes.every(b=>Object.values(b).every(Number.isFinite)));}
  }
});
