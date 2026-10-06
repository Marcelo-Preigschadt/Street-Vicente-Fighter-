import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,Fighter,CHARACTERS,FIXED_STEP,WORLD,fighterPose,FIGHTING_STYLES} from '../src/engine.js';
import {muayThaiHurt} from '../src/muay-thai.js';
import {MUAY_THAI_LAYOUT,MUAY_THAI_HURT} from '../src/muay-thai-data.js';
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t/FIXED_STEP);i++)g.update(FIXED_STEP);};
function scene(slot=0,other='rafael') {
  const events=[],g=new FightEngine({random:()=>.47,onEvent:e=>events.push(e)});
  g.start(slot?other:'marcelino','local',slot?'marcelino':other);g.phase='fight';
  g.fighters[0].x=450;g.fighters[1].x=605;
  return {g,events,slot,f:g.fighters[slot],target:g.fighters[1-slot]};
}
test('Marcelino possui 32 poses e perfis completos de Muay Thai sem alterar o elenco anterior',()=>{
  assert.equal(Object.keys(CHARACTERS).length,6);assert.equal(FIGHTING_STYLES.marcelino.name,'Muay Thai');
  assert.equal(CHARACTERS.marcelo.quote,'Bora NIT');
  for(const atlas of ['base','combat']){
    assert.equal(MUAY_THAI_LAYOUT[atlas].length,16);assert.equal(MUAY_THAI_HURT[atlas].length,16);
    for(const bands of MUAY_THAI_HURT[atlas])assert.ok(bands.every(b=>b.every(Number.isFinite)&&b[2]>0&&b[3]>0));
  }
});
test('cotovelo, circular, low kick e joelhada escolhem poses distintas no contato',()=>{
  const f=new Fighter('marcelino',0);f.moveData={startup:.1,active:.2};f.actionTime=.15;
  for(const [state,index]of [['punch',14],['kick',2],['sweep',6],['airKick',10],['uppercut',10]]){
    f.state=state;assert.deepEqual(fighterPose(f),{atlas:'combat',index});
  }
});
test('recuo não produz índice negativo; passos e guarda preservam um corpo completo',()=>{
  const f=new Fighter('marcelino',0);f.state='walk';
  for(let d=-400;d<401;d+=13){f.walkDistance=d;const p=fighterPose(f);assert.ok(p.index>=0&&p.index<4);}
  f.footwork={kind:'retreat'};assert.deepEqual(fighterPose(f),{atlas:'base',index:3});
});
test('áreas vulneráveis acompanham pose, esquiva e espelhamento nos dois lados',()=>{
  const f=new Fighter('marcelino',0);
  for(const state of ['idle','crouch','block','sweep','uppercut','hit','victory'])for(const direction of [-1,1]){
    f.state=state;f.direction=direction;
    assert.deepEqual(f.hurtboxes,muayThaiHurt(f).map(([x,h,w,height])=>({x:f.x+(direction>0?x:-x-w),y:f.y-h,w,h:height})));
  }
  f.state='crouch';assert.ok(f.hurtboxes.every(b=>b.y>=WORLD.floor-192-.01));
});
test('low kick exige defesa baixa e somente o forte provoca derrubada',()=>{
  for(const slot of [0,1])for(const down of [false,true]){
    const s=scene(slot);s.g.setInput(1-slot,{block:true,down});s.g.setInput(slot,{down:true});s.g.queue(slot,'kick',1);advance(s.g,.8);
    assert.equal(s.events.some(e=>e.type==='block'),down);assert.equal(s.target.hp<1000,!down);assert.equal(s.target.knocked,false);
  }
});
test('impulso atinge à distância, joelhada lança o rival e super exige barra e lança cinco ondas',()=>{
  for(const slot of [0,1]){
    const s=scene(slot);s.f.x=slot?1010:270;s.target.x=slot?270:1010;
    s.g.queue(slot,'super');advance(s.g,.6);assert.equal(s.g.projectiles.length,0);
    s.g.queue(slot,'special');advance(s.g,1.5);assert.ok(s.target.hp<1000);
    s.g.newRound();s.g.phase='fight';s.f.x=slot?605:450;s.target.x=slot?450:605;
    s.g.queue(slot,'uppercut');advance(s.g,.25);assert.ok(s.events.some(e=>e.type==='hit'&&e.move==='uppercut'));assert.ok(s.target.y<WORLD.floor);
    s.g.newRound();s.g.phase='fight';s.f.meter=100;s.g.queue(slot,'super');advance(s.g,1.5);
    assert.equal(s.events.filter(e=>e.type==='projectile'&&e.move==='super').length,5);assert.equal(s.f.meter,0);
  }
});
test('Marcelino funciona como P1/P2 e CPU contra os outros quatro professores',()=>{
  for(const id of Object.keys(CHARACTERS).filter(id=>id!=='marcelino'))for(const slot of [0,1]){
    const g=new FightEngine({random:()=>.39});g.start(slot?id:'marcelino','cpu',slot?'marcelino':id);g.phase='fight';
    for(let i=0;i<1800;i++){if(i%100===0)g.queue(0,i%200?'kick':'punch');if(i%700===0){g.fighters[0].meter=100;g.queue(0,'super');}g.update(FIXED_STEP);}
    assert.ok(g.fighters.every(f=>[f.x,f.y,f.hp,f.meter].every(Number.isFinite)));
  }
});
