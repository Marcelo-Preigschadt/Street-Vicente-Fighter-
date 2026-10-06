import test from 'node:test';
import assert from 'node:assert/strict';
import {StoryEngine} from '../src/story.js';
import {STORY_HEROES,STORY_RULES} from '../src/story-data.js';
import {FIXED_STEP,WORLD} from '../src/engine.js';
import {snapshot,applySnapshot,sanitizeInput} from '../src/net-state.js';
import {RollbackGame} from '../src/netplay.js';
const tick=(e,s)=>{for(let i=0;i<Math.ceil(s/FIXED_STEP);i++)e.update(FIXED_STEP);};
const game=(id='marcelo',mode='story-solo')=>{const e=new StoryEngine();e.start(id,mode,'rafael');e.queue(0,'storyNext');return e;};
test('os oito lutadores entram e reiniciam solo com apenas um jogador ativo',()=>{
 for(const id of STORY_HEROES){const e=game(id);tick(e,.2);assert.deepEqual(e.heroes.map(f=>f.character.id),[id]);assert.equal(e.fighters[1].hp,0);e.fighters[0].hp=0;e.freeze=0;e.update(FIXED_STEP);assert.equal(e.phase,'result');e.queue(0,'storyRetry');e.queue(0,'storyNext');assert.equal(e.party.length,1);e.beginBoss();assert.equal(e.heroes.length,1);assert.equal(e.fighters[1].hp,0);}
});
test('andar na profundidade não salta nem agacha e o salto preserva a faixa do chão',()=>{
 const e=game(),f=e.fighters[0];e.setInput(0,{up:true});tick(e,.4);assert.ok(f.lane<600);assert.equal(f.y,WORLD.floor);assert.equal(f.state,'walk');e.setInput(0,{jump:true});tick(e,.13);assert.ok(f.airborne);const lane=f.lane;e.setInput(0,{down:true});tick(e,.1);assert.equal(f.lane,lane);e.setInput(0,{});tick(e,1);assert.equal(f.y,WORLD.floor);e.setInput(0,{down:true});tick(e,1);assert.equal(f.lane,STORY_RULES.laneBottom);assert.equal(f.input.down,false);
});
test('soco e projétil só atingem inimigos alinhados na profundidade',()=>{
 const e=game(),f=e.fighters[0];f.x=400;f.lane=625;const far=e.spawnEnemy('lab',525,520);far.aiTime=100;far.cooldown=100;far.hitstun=100;e.queue(0,'punch',2);tick(e,.5);assert.equal(far.hp,far.maxHp);e.clearAction(f);e.queue(0,'special',2);tick(e,.7);assert.equal(far.hp,far.maxHp);e.clearAction(f);e.projectiles=[];far.lane=625;e.queue(0,'punch',2);tick(e,.5);assert.ok(far.hp<far.maxHp);
});
test('inspetor mantém a direção anunciada, permite esquiva e recupera depois da carga e dos golpes',()=>{
 const e=game();e.beginBoss();e.queue(0,'storyNext');const b=e.enemies[0],f=e.fighters[0];f.x=600;b.x=750;b.attackSerial=2;b.aiTime=0;b.cooldown=0;e.update(FIXED_STEP);assert.equal(b.attackMode,'charge');const facing=b.direction;e.setInput(0,{up:true});tick(e,.8);assert.equal(b.direction,facing);assert.equal(f.hp,1000);e.setInput(0,{});tick(e,1.2);assert.equal(b.attackLife,0);assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));
 e.hit({attacker:f,target:b,move:'uppercut',data:{damage:100,strength:1,stun:.5,blockstun:.1,push:200,meter:0,level:'mid',chip:0,knockdown:true,launch:400},x:b.x,y:450},b.guard);tick(e,1);assert.equal(b.knocked,false);assert.equal(b.y,WORLD.floor);assert.ok(Number.isFinite(b.x));
});
test('ameaças desativam um jogador parado e defender não é invulnerabilidade permanente',()=>{
 for(const block of [false,true]){const e=game();e.beginBoss();e.queue(0,'storyNext');e.fighters[0].x=700;e.enemies[0].x=860;e.setInput(0,{block});tick(e,14);assert.ok(e.fighters[0].hp<700,`block=${block}`);}
});
test('câmera avança sem salto e correr avança mais que andar',()=>{
 const walk=game(),run=game();run.beginFootwork(run.fighters[0],'advance');for(const e of [walk,run]){e.setInput(0,{right:true});tick(e,.5);}assert.ok(run.fighters[0].x>walk.fighters[0].x+50);
 const e=game();e.story.wave=3;e.story.dropWave=3;e.fighters[0].x=1400;e.camera=800;e.setInput(0,{right:true});let old=e.camera;for(let i=0;i<60;i++){e.update(FIXED_STEP);assert.ok(e.camera>=old);assert.ok(e.camera-old<200);old=e.camera;}assert.ok(e.camera>800);
});
test('snapshot rejeita profundidade inválida e preserva professor e aluno no cooperativo',()=>{
 const a=game('ruan','story-online'),b=game('ruan','story-online');a.setInput(0,{up:true});tick(a,.2);a.spawnEnemy('inspector',1000,580);const s=JSON.parse(JSON.stringify(snapshot(a,1)));assert.ok(applySnapshot(b,s));assert.equal(a.fighters[0].lane,b.fighters[0].lane);s.seq++;s.campaign.enemies[0].lane=-100;assert.equal(applySnapshot(b,s,1),false);assert.deepEqual(sanitizeInput({up:true,crouch:true}).up,true);
});
test('rollback transmite quatro direções, salto e posição dos projéteis na profundidade',()=>{
 let now=0;const engines=[game('joao','story-online'),game('joao','story-online')],pending=[[],[]];engines.forEach(e=>{e.fighters[0].x=590;});const nets=engines.map((engine,slot)=>new RollbackGame({engine,slot,now:()=>now,startAt:0,send:f=>pending[slot].push(...f),onEvent:()=>{}}));
 for(let i=0;i<180;i++){now+=1000/120;nets[0].input({up:i<50,down:i>100,right:i<100,jump:i===80});nets[1].input({down:i<30,right:i<120});if(i===90)nets[0].attack('special',2);nets.forEach(n=>n.advance());if(i%9===0){nets[0].receive(pending[1].splice(0));nets[1].receive(pending[0].splice(0));}}
 nets[0].receive(pending[1]);nets[1].receive(pending[0]);assert.ok(nets[0].rollbacks+nets[1].rollbacks>0);assert.deepEqual(snapshot(engines[0],1),snapshot(engines[1],1));
});
