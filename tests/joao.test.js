import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,FIXED_STEP,WORLD,CHARACTERS} from '../src/engine.js';
import {validCharacter} from '../src/net-state.js';
import {WILD_LAYOUT,WILD_HURT} from '../src/wild-data.js';
import {Renderer} from '../src/render.js';
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t/FIXED_STEP);i++)g.update(FIXED_STEP);};
function scene(slot=0,distance=210){
  const events=[],g=new FightEngine({random:()=>.47,onEvent:e=>events.push(e)});
  g.start(slot?'rafael':'joao','local',slot?'joao':'rafael');g.phase='fight';
  g.fighters[0].x=450;g.fighters[1].x=450+distance;
  return {g,events,f:g.fighters[slot],target:g.fighters[1-slot],slot};
}
test('aluno 301 tem 32 poses calibradas e pode ser selecionado online sem remover professores',()=>{
  assert.equal(CHARACTERS.joao.category,'students');assert.equal(CHARACTERS.joao.classroom,'301');assert.ok(validCharacter('joao'));
  assert.equal(Object.values(CHARACTERS).filter(f=>f.category==='teachers').length,6);
  for(const atlas of ['base','combat']){
    assert.equal(WILD_LAYOUT[atlas].length,16);assert.equal(WILD_HURT[atlas].length,16);
    for(const bands of WILD_HURT[atlas])assert.ok(bands.every(b=>b.every(Number.isFinite)&&b[2]>0&&b[3]>0));
  }
});
test('Super Soco acerta nos dois lados, é defendível e erra fora do alcance sem projéteis',()=>{
  for(const slot of [0,1])for(const guard of [false,true]){
    const s=scene(slot);s.g.setInput(1-slot,{block:guard});s.g.beginMove(s.f,'special',1);advance(s.g,.7);
    assert.ok(s.events.some(e=>e.type===(guard?'block':'hit')&&e.move==='special'));
    assert.equal(s.events.filter(e=>e.type==='special').length,1);assert.equal(s.g.projectiles.length,0);assert.equal(s.g.drones.length,0);
  }
  const s=scene(0,550);s.g.beginMove(s.f,'special',1);advance(s.g,.7);assert.equal(s.target.hp,1000);
});
test('Rolamento Selvagem é uma investida aérea nos dois lados e intercepta alvo que salta',()=>{
  for(const slot of [0,1]){
    const s=scene(slot,170);s.target.y=WORLD.floor-100;s.target.vy=-100;const x=s.f.x;
    s.g.beginMove(s.f,'uppercut',1);advance(s.g,.4);
    assert.ok(s.f.airborne);assert.ok((s.f.x-x)*s.f.direction>30);assert.ok(s.target.hp<1000);
    advance(s.g,1);assert.equal(s.f.action,null);assert.equal(s.g.projectiles.length,0);
  }
});
test('Curto-Circuito 301 exige barra cheia, derruba uma vez e permite defesa ou afastamento',()=>{
  for(const slot of [0,1])for(const guarded of [false,true]){
    const s=scene(slot,175);s.f.meter=99;assert.equal(s.g.beginMove(s.f,'super',1),false);
    s.f.meter=100;s.g.setInput(1-slot,{block:guarded});assert.ok(s.g.beginMove(s.f,'super',1));assert.equal(s.f.meter,0);
    advance(s.g,1.7);assert.equal(s.events.filter(e=>e.type===(guarded?'block':'hit')&&e.move==='super').length,1);
    assert.equal(s.g.projectiles.length,0);assert.equal(s.g.drones.length,0);
    assert.ok(guarded?s.target.hp>950:s.target.hp<650);
  }
  const s=scene(0,500);s.f.meter=100;s.g.beginMove(s.f,'super',1);advance(s.g,1.7);assert.equal(s.target.hp,1000);
});
test('trocas repetidas de elenco liberam arte antiga e preservam os quatro personagens recentes',async t=>{
  const old=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});t.after(()=>{globalThis.matchMedia=old;});
  const r=new Renderer({getContext:()=>({})});r.loadBackground=async()=>{};
  r.loadCharacter=function(id){this.characterLoads??=new Map();this.characterLoads.delete(id);this.characterLoads.set(id,Promise.resolve());this.sheets[id]={};this.portraits[id]={};return Promise.resolve();};
  for(const id of Object.keys(CHARACTERS).filter(id=>id!=='marcelo'))await r.load(['marcelo',id]);
  assert.equal(r.characterLoads.size,4);assert.equal(Object.keys(r.sheets).length,4);assert.ok(r.sheets.marcelo&&r.sheets.joao);
  assert.equal(r.sheets.rafael,undefined);
});
