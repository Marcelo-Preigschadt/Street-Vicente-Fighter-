import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,FIXED_STEP,CHARACTERS} from '../src/engine.js';
import {validCharacter} from '../src/net-state.js';
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t/FIXED_STEP);i++)g.update(FIXED_STEP);};
function scene(slot=0){const g=new FightEngine({random:()=>.47});g.start(slot?'rafael':'ruan','local',slot?'ruan':'rafael');g.phase='fight';g.fighters[0].x=100;g.fighters[1].x=1200;return {g,f:g.fighters[slot]};}
test('Ruan tem Karatê próprio e é aceito no elenco online',()=>{assert.equal(CHARACTERS.ruan.category,'students');assert.ok(validCharacter('ruan'));assert.notEqual(CHARACTERS.ruan.powers.special,CHARACTERS.joao.powers.special);});
test('Pulso de Choque é direcional nos dois lados e não exige barra',()=>{for(const slot of [0,1]){const {g,f}=scene(slot);assert.ok(g.beginMove(f,'special',1));advance(g,.25);assert.equal(g.projectiles.length,1);const p=g.projectiles[0];assert.equal(p.character,'ruan');assert.equal(p.direction,f.direction);assert.equal(p.data.effect,'karateLightning');}});
test('Kata lança três ondas e só a última derruba',()=>{for(const slot of [0,1]){const {g,f}=scene(slot);f.meter=99;assert.equal(g.beginMove(f,'super',1),false);f.meter=100;assert.ok(g.beginMove(f,'super',1));advance(g,.7);assert.equal(f.meter,0);assert.equal(g.projectiles.length,3);assert.deepEqual(g.projectiles.map(p=>p.data.knockdown),[false,false,true]);}});
