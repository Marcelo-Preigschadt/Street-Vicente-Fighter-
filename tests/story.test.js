import test from 'node:test';
import assert from 'node:assert/strict';
import {StoryEngine,StoryEnemy,validStoryState} from '../src/story.js';
import {STORY_ACTS,ENEMY_TYPES} from '../src/story-data.js';
import {FIXED_STEP,WORLD,Fighter} from '../src/engine.js';
import {snapshot,applySnapshot} from '../src/net-state.js';
import {RollbackGame} from '../src/netplay.js';
const advance=(e,seconds)=>{for(let i=0;i<Math.ceil(seconds/FIXED_STEP);i++)e.update(FIXED_STEP);};
const start=(mode='story-solo',id='marcelo',act=0)=>{const e=new StoryEngine();e.start(id,mode,id==='rafael'?'gustavo':'rafael',{act});e.queue(0,'storyNext');return e;};

test('história tem quatro atos, oito lutadores e versus mantém todos os personagens',()=>{
  assert.equal(STORY_ACTS.length,4);assert.equal(Object.keys(ENEMY_TYPES).length,16);
  const e=start();assert.equal(e.cpu,true);assert.equal(e.heroes.length,1);assert.equal(e.fighters[1].hp,0);assert.equal(e.timer,900);
  e.start('ruan','story-solo','rafael');assert.equal(e.heroes.length,1);assert.equal(e.heroes[0].character.id,'ruan');assert.throws(()=>e.start('inexistente','story-solo','rafael'),RangeError);
  e.start('ruan','local','joao');assert.equal(e.storyActive,false);assert.equal(e.phase,'intro');assert.equal(e.fighters[1].character.id,'joao');
});
test('narrativa e pausa não consomem o turno e a tentativa reinicia o checkpoint do ato',()=>{
  const e=new StoryEngine();e.start('gustavo','story-solo','rafael',{act:2,timer:660});advance(e,10);assert.equal(e.timer,660);
  e.queue(0,'storyNext');advance(e,1);const t=e.timer;e.togglePause();advance(e,5);assert.equal(e.timer,t);e.togglePause();
  e.fighters[0].hp=0;advance(e,.02);assert.equal(e.phase,'result');e.queue(0,'storyRetry');assert.equal(e.phase,'storyDialog');assert.equal(e.story.act,2);assert.equal(e.timer,660);assert.equal(e.fighters[0].hp,1000);
});
test('onda bloqueia avanço, desaparece depois da vitória e camera permite atravessar o bloco',()=>{
  const e=start();e.fighters[0].x=600;advance(e,.02);assert.equal(e.story.wave,1);assert.equal(e.enemies.length,3);
  e.fighters[0].x=1700;advance(e,.02);assert.ok(e.fighters[0].x<=1370);
  e.enemies.forEach(n=>n.hp=0);for(let i=0;i<1900;i++){e.setInput(0,{right:true});e.update(FIXED_STEP);}assert.equal(e.story.wave,2);assert.ok(e.camera>0);
});
test('cooperação não causa dano ao parceiro; soco e poder acertam os robôs',()=>{
  const e=start('story-local');const [a,b]=e.fighters;a.x=420;b.x=530;a.direction=1;b.direction=-1;
  e.queue(0,'punch',2);advance(e,.5);assert.equal(b.hp,1000);
  a.x=420;const robot=e.spawnEnemy('lab',555);e.queue(0,'punch',2);advance(e,.5);assert.ok(robot.hp<robot.maxHp);
  robot.hp=0;advance(e,.2);const target=e.spawnEnemy('elite',850);const hp=target.hp;e.queue(0,'special',2);advance(e,1);assert.ok(target.hp<hp);assert.equal(b.hp,1000);
});
test('poderes e socos no ar funcionam para cada professor em campanha',()=>{
  for(const id of ['marcelo','rafael','gustavo'])for(const move of ['punch','special']){
    const e=start('story-solo',id),f=e.fighters[0];f.y=440;f.vy=-300;e.queue(0,move);advance(e,.07);assert.equal(f.action,move==='punch'?'airPunch':'special');
  }
});
test('mesa e cadeira arremessadas atingem inimigos sem ferir o parceiro',()=>{
  const e=start('story-local'),f=e.fighters[0];f.x=600;const robot=e.spawnEnemy('cleaner',830),before=robot.hp;
  e.queue(0,'throw');assert.equal(e.thrown[0].kind,'table');advance(e,.5);assert.ok(robot.hp<before);assert.equal(e.fighters[1].hp,1000);
});
test('máquina lança lata explosiva quando atingida e só aceita o próximo golpe depois do intervalo',()=>{
  const e=start(),f=e.fighters[0],soda=e.props.find(p=>p.kind==='soda');e.damageProp(soda,45,f);assert.equal(e.thrown.length,1);e.damageProp(soda,45,f);assert.equal(e.thrown.length,1);assert.equal(e.thrown[0].kind,'can');
});
test('ácido atinge quem fica no chão e um salto atravessa a área sem dano',()=>{
  const e=start('story-local','marcelo',1),h=e.hazards[0],[a,b]=e.fighters;h.clock=h.warning+.2;a.x=b.x=h.x;b.y=420;b.vy=-250;e.update(FIXED_STEP);assert.ok(a.hp<1000);assert.equal(b.hp,1000);
});
test('estante anuncia a queda e pode ferir jogador e inimigo na área',()=>{
  const e=start('story-solo','marcelo',2),f=e.fighters[0],s=e.props[0];f.x=s.x+100;const robot=e.spawnEnemy('scanner',s.x+150);e.damageProp(s,200,f);assert.ok(s.fall>0);advance(e,.9);assert.ok(robot.hp<robot.maxHp);assert.ok(f.hp<1000);
});
test('chefes usam duelo individual, permitem troca segura e a reserva assume após KO',()=>{
  const e=start('story-local');e.beginBoss();e.queue(0,'storyNext');assert.equal(e.heroes.length,1);assert.equal(e.story.duelist,0);
  e.queue(1,'storySwap');assert.equal(e.story.duelist,1);assert.equal(e.heroes[0].slot,1);e.fighters[1].hp=0;e.update(FIXED_STEP);assert.equal(e.story.duelist,0);assert.equal(e.phase,'fight');
});
test('cada padrão de chefe é anunciado antes do ataque e bloqueio frontal protege o jogador',()=>{
  for(const kind of ['inspector','fairRobot','substitute','aula','exo']){
    const e=start();e.beginBoss();e.enemies=[];const boss=e.spawnEnemy(kind,700);const f=e.fighters[0];f.x=500;e.queue(0,'storyNext');boss.aiTime=0;boss.cooldown=0;e.update(FIXED_STEP);assert.ok(boss.telegraph>0,kind);assert.equal(f.hp,1000);e.setInput(0,{block:true,down:kind==='exo'});advance(e,1);assert.ok(f.hp>850,kind);if(kind==='inspector')assert.ok(f.hp<1000,`bloqueio tem desgaste: ${kind}`);
  }
});
test('A.U.L.A. passa ao exoesqueleto e a campanha só termina após derrotar as duas fases',()=>{
  const e=start('story-solo','marcelo',3);e.beginBoss();assert.equal(e.fighters[0].meter,100);e.queue(0,'storyNext');e.enemies[0].hp=0;e.update(FIXED_STEP);
  assert.equal(e.phase,'storyDialog');assert.equal(e.story.dialog,'exo');assert.equal(e.story.bossPhase,2);e.queue(0,'storyNext');assert.equal(e.enemies[0].kind,'exo');assert.equal(e.phase,'fight');
  e.enemies[0].hp=0;e.update(FIXED_STEP);assert.equal(e.story.dialog,'clear');e.queue(0,'storyNext');assert.equal(e.phase,'result');assert.equal(e.story.ending,true);
});
test('todos os atos exigem três ondas e um chefe antes de liberar o próximo bloco',()=>{
  const e=start();for(let act=0;act<4;act++){
    assert.equal(e.story.act,act);
    for(let wave=0;wave<3;wave++){e.fighters[0].x=[600,1500,2400][wave];e.camera=Math.max(0,e.fighters[0].x-700);e.update(FIXED_STEP);assert.equal(e.story.wave,wave+1);assert.equal(e.enemies.filter(n=>n.hp>0).length,STORY_ACTS[act].waves[wave].length);e.enemies.forEach(n=>n.hp=0);e.update(FIXED_STEP);}
    e.fighters[0].x=3200;e.camera=2320;e.update(FIXED_STEP);assert.equal(e.story.dialog,'boss');e.queue(0,'storyNext');e.enemies[0].hp=0;e.update(FIXED_STEP);
    if(act===3){assert.equal(e.story.dialog,'exo');e.queue(0,'storyNext');e.enemies[0].hp=0;e.update(FIXED_STEP);}
    assert.equal(e.story.dialog,'clear');e.queue(0,'storyNext');if(act<3)e.queue(0,'storyNext');
  }assert.equal(e.phase,'result');assert.equal(e.story.ending,true);assert.equal(e.story.defeated,49);
});
test('snapshot online preserva protótipos, inimigos, objetos e semente e rejeita campanha inválida',()=>{
  const a=start('story-online'),b=start('story-online');a.fighters[0].x=600;a.update(FIXED_STEP);a.interact(a.fighters[0]);
  const state=JSON.parse(JSON.stringify(snapshot(a,1)));assert.equal(applySnapshot(b,state),true);assert.ok(b.enemies.every(e=>e instanceof StoryEnemy));assert.ok(b.fighters.every(e=>e instanceof Fighter));assert.deepEqual(b.exportStoryState(),a.exportStoryState());
  state.seq++;state.campaign.enemies[0].kind='ruan';assert.equal(applySnapshot(b,state,1),false);assert.equal(validStoryState(state.campaign),false);
});
test('rollback do cooperativo restaura a onda e os projéteis sem duplicar inimigos ou pontuação',()=>{
  let now=0;const engines=[start('story-online'),start('story-online')];for(const e of engines)e.fighters[0].x=590;
  const pending=[[],[]],nets=engines.map((engine,slot)=>new RollbackGame({engine,slot,now:()=>now,startAt:0,send:frames=>pending[slot].push(...frames),onEvent:()=>{}}));
  for(let i=0;i<170;i++){now+=1000/120;nets[0].input({right:i<90});nets[1].input({right:i<120});if(i%55===0)nets[1].attack('special',1);nets.forEach(n=>n.advance());if(i%8===0){nets[0].receive(pending[1].splice(0));nets[1].receive(pending[0].splice(0));}}
  nets[0].receive(pending[1]);nets[1].receive(pending[0]);assert.ok(nets[0].rollbacks+nets[1].rollbacks>0);assert.deepEqual(engines[0].exportStoryState(),engines[1].exportStoryState());assert.deepEqual(snapshot(engines[0],1),snapshot(engines[1],1));
});
test('Névoa Atômica atordoa robôs por 1,9 s e não faz um drone flutuante cair por gravidade',()=>{
 const e=start('story-solo','gustavo'),f=e.fighters[0];f.x=350;const enemy=e.spawnEnemy('snack',650);enemy.aiTime=5;e.queue(0,'special',2);advance(e,.7);assert.ok(enemy.dizzyTime>1);const y=enemy.y;advance(e,.2);assert.ok(enemy.hitstun>0);assert.equal(enemy.y,y);
});
test('uma atualização longa para imediatamente no fim do turno e emite derrota só uma vez',()=>{
 const events=[],e=new StoryEngine({onEvent:e=>events.push(e)});e.start('marcelo','story-solo','rafael');e.queue(0,'storyNext');e.timer=.004;e.update(.1);assert.equal(e.phase,'result');assert.equal(e.timer,0);assert.equal(events.filter(e=>e.type==='storyResult').length,1);
});
