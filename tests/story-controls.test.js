import test from 'node:test';
import assert from 'node:assert/strict';
import {StoryEngine} from '../src/story.js';
import {snapshot,applySnapshot,MOVES} from '../src/net-state.js';
const start=()=>{const e=new StoryEngine();e.start('ruan','story-solo');e.queue(0,'storyNext');return e;};
const advance=(e,t)=>{for(let i=0;i<Math.ceil(t*120);i++)e.update(1/120);};
test('soco pega, transporta e arremessa cadeira sem atingir o parceiro',()=>{
 const e=start(),f=e.fighters[0],p=e.props.find(p=>p.kind==='chair');e.camera=Math.max(0,p.x-200);e.story.wave=3;f.x=p.x;f.lane=p.lane;e.queue(0,'punch');assert.equal(f.carry.kind,'chair');assert.equal(e.thrown.length,0);
 e.setInput(0,{right:true});advance(e,.3);assert.ok(f.x>p.x);e.setInput(0,{});e.queue(0,'punch');assert.equal(f.carry.kind,'chair');advance(e,.14);assert.equal(f.carry,null);assert.equal(e.thrown[0].kind,'chair');assert.equal(e.thrown[0].lane,f.lane);
});
test('alvo em alcance recebe soco e não perde prioridade para objeto',()=>{
 const e=start(),f=e.fighters[0],p=e.props.find(p=>p.kind==='chair');e.camera=Math.max(0,p.x-200);e.story.wave=3;e.story.dropWave=3;f.x=p.x-70;f.lane=p.lane;const enemy=e.spawnEnemy('cleaner',f.x+100,f.lane);e.queue(0,'punch');assert.equal(f.carry,null);advance(e,.18);assert.ok(enemy.hp<enemy.maxHp);assert.equal(p.used,false);
});
test('objeto transportado é sincronizado e cai ao sofrer dano',()=>{
 const e=start(),f=e.fighters[0],p=e.props.find(p=>p.kind==='chair');f.x=p.x;f.lane=p.lane;e.queue(0,'punch');const peer=start();assert.ok(applySnapshot(peer,snapshot(e,1)));assert.deepEqual(peer.fighters[0].carry,f.carry);
 const enemy=e.spawnEnemy('cleaner',f.x+100,f.lane);e.hit({attacker:enemy,target:f,move:'punch',data:{damage:50,strength:1,stun:.2,blockstun:.1,push:0,meter:0,level:'mid',chip:0},x:f.x,y:f.y-100});assert.equal(f.carry,null);assert.equal(e.thrown[0].kind,'chair');
});
test('botão especial usa poder e passa a super com barra cheia para todo elenco',()=>{
 assert.ok(MOVES.has('storySpecial'));
 for(const id of ['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan'])for(const meter of [25,100]){const e=start();e.start(id,'story-solo');e.queue(0,'storyNext');const f=e.fighters[0];f.meter=meter;e.queue(0,'storySpecial');advance(e,.03);assert.equal(f.action,meter===100?'super':'special',id);}
});
test('arranque e parada não saltam posição; profundidade anima uma passada real',()=>{
 const e=start(),f=e.fighters[0];e.setInput(0,{right:true});e.update(1/120);assert.ok(f.vx>0&&f.vx<f.character.speed);advance(e,.2);assert.ok(f.vx>150&&f.vx<190);e.setInput(0,{});advance(e,.2);assert.equal(f.vx,0);assert.ok(f.walkBlend<.02);
 const distance=f.walkDistance;e.setInput(0,{up:true});advance(e,.2);assert.equal(f.state,'walk');assert.ok(f.walkDistance>distance);assert.ok(f.walkBlend>.9);
});
