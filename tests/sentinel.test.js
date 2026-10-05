import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, FIXED_STEP, WORLD, MOVES, SENTINEL, fighterPose } from '../src/engine.js';

const advance=(g,t)=>{for(let n=0;n<Math.round(t/FIXED_STEP);n++)g.update(FIXED_STEP);};
function until(g,predicate,t=4){for(let n=0;n<t/FIXED_STEP&&!predicate();n++)g.update(FIXED_STEP);assert.ok(predicate());}
function scene(slot=0,other='gustavo') {
  const events=[],g=new FightEngine({onEvent:e=>events.push({...e,time:g.time})});
  g.start(slot===0?'marcelo':other,'local',slot===0?other:'marcelo');g.phase='fight';
  g.fighters[0].x=340;g.fighters[1].x=900;
  return {g,events,f:g.fighters[slot],target:g.fighters[1-slot],slot};
}
function deploy(s){s.g.queue(s.slot,'drone');until(s.g,()=>s.g.drones.length>0);return s.g.drones[0];}

test('a sentinela dispara uma vez exatamente 2 s após a implantação, nos dois lados, com dano fraco',()=>{
  for(const slot of [0,1]){
    const s=scene(slot),d=deploy(s);assert.equal(d.age,0);assert.equal(d.y,WORLD.floor-SENTINEL.groundHeight);
    advance(s.g,SENTINEL.delay-FIXED_STEP);assert.equal(s.events.filter(e=>e.type==='droneFire').length,0);assert.equal(s.target.hp,1000);
    advance(s.g,FIXED_STEP);const fire=s.events.find(e=>e.type==='droneFire');assert.ok(Math.abs(fire.time-d.createdAt-2)<1e-8);
    assert.equal(s.events.filter(e=>e.type==='hit').length,1);assert.ok(1000-s.target.hp>0&&1000-s.target.hp<=35);
    assert.equal(s.target.knocked,false);assert.equal(s.f.meter,3);
    assert.deepEqual(s.events.filter(e=>e.type==='special').map(e=>[e.name,e.quote]),[['Sentinela Automática','Sentinela ativada!']]);
    advance(s.g,1);assert.equal(s.events.filter(e=>e.type==='droneFire').length,1);assert.equal(s.g.drones.length,0);assert.equal(s.g.lasers.length,0);
  }
});
test('Marcelo recupera durante a carga, mantém os poderes anteriores e não pode empilhar sentinelas',()=>{
  const s=scene(),d=deploy(s);advance(s.g,.45);assert.ok(s.f.canAct);
  s.g.queue(0,'drone');advance(s.g,.2);assert.equal(s.g.drones.length,1);assert.equal(s.g.drones[0],d);
  s.g.queue(0,'special');until(s.g,()=>s.g.projectiles.length>0);
  assert.ok(s.events.some(e=>e.type==='special'&&e.name==='Rajada de Código'));
  assert.equal(s.g.drones.length,1);assert.equal(s.events.filter(e=>e.type==='droneDeploy').length,1);
});
test('implantação aérea conserva a trajetória do salto, a altura do robô e o limite de um ataque aéreo',()=>{
  for(const slot of [0,1]){
    const s=scene(slot);s.g.setInput(slot,{jump:true,...(slot===0?{right:true}:{left:true})});advance(s.g,.13);s.g.setInput(slot,{});
    const vx=s.f.vx;s.g.queue(slot,'drone');advance(s.g,FIXED_STEP);assert.equal(s.f.action,'drone');assert.equal(s.f.vx,vx);
    assert.equal(fighterPose(s.f).index,4);assert.equal(s.f.airAttackUsed,true);
    until(s.g,()=>s.g.drones.length>0);const d=s.g.drones[0],position=[d.x,d.y];assert.equal(d.airborne,true);assert.ok(d.y<WORLD.floor-180);
    s.g.queue(slot,'kick');advance(s.g,.05);assert.ok(!s.events.some(e=>e.type==='swing'));
    until(s.g,()=>s.f.y===WORLD.floor);assert.deepEqual([d.x,d.y],position);assert.equal(s.f.airAttackUsed,false);
    until(s.g,()=>s.events.some(e=>e.type==='droneFire'));assert.equal(s.target.hp,1000);
  }
});
test('pousar antes da preparação aérea terminar cancela a implantação, sem lançamento atrasado no chão',()=>{
  const s=scene();s.g.setInput(0,{jump:true});advance(s.g,.60);s.g.setInput(0,{});assert.ok(s.f.airborne);
  s.g.queue(0,'drone');advance(s.g,.5);assert.equal(s.g.drones.length,0);assert.ok(!s.events.some(e=>e.type==='special'));
});
test('a mira permanece na direção original, sem perseguir o rival após a troca de lado',()=>{
  const s=scene(),d=deploy(s);s.target.x=160;s.f.x=750;advance(s.g,.5);assert.equal(s.f.direction,-1);
  until(s.g,()=>s.events.some(e=>e.type==='droneFire'));assert.equal(d.direction,1);assert.equal(s.target.hp,1000);
  assert.equal(s.g.lasers[0].endX,WORLD.width);
});
test('o laser pode ser defendido alto ou baixo, sem dano de chip',()=>{
  for(const slot of [0,1])for(const down of [false,true]){
    const s=scene(slot);s.g.setInput(1-slot,{block:true,down});deploy(s);
    until(s.g,()=>s.events.some(e=>e.type==='droneFire'));assert.equal(s.target.hp,1000);
    assert.equal(s.events.filter(e=>e.type==='block'&&e.move==='drone').length,1);assert.equal(s.target.dizzyPending,false);
  }
});
test('o laser respeita invulnerabilidade, a queda e a esquiva por cima do disparo baixo',()=>{
  for(const evade of ['invulnerable','knockdown','jump']){
    const s=scene();deploy(s);
    if(evade==='invulnerable')s.target.invincible=3;
    else if(evade==='knockdown'){s.target.knocked=true;s.target.knockdownTime=3;}
    else {advance(s.g,1.75);s.g.setInput(1,{jump:true});advance(s.g,.06);s.g.setInput(1,{});}
    until(s.g,()=>s.events.some(e=>e.type==='droneFire'));assert.equal(s.target.hp,1000);
    assert.ok(!s.events.some(e=>e.type==='hit'&&e.move==='drone'));
  }
});
test('um golpe baixo destrói o robô antes do disparo e libera uma nova implantação',()=>{
  const s=scene(),d=deploy(s);s.target.x=d.x+150;s.g.setInput(1,{down:true});s.g.queue(1,'kick');
  until(s.g,()=>s.events.some(e=>e.type==='droneDestroyed'));assert.equal(s.g.drones.length,0);
  advance(s.g,.7);s.g.queue(0,'drone');until(s.g,()=>s.events.filter(e=>e.type==='droneDeploy').length===2);
});
test('um projétil rápido atinge o drone à frente do corpo, sem atravessá-lo nem ferir Marcelo',()=>{
  for(const slot of [0,1]){
    const s=scene(slot),d=deploy(s),direction=-d.direction;
    s.g.projectiles.push({owner:1-slot,character:'gustavo',move:'special',data:MOVES.special,direction,
      x:d.x-direction*90,prevX:d.x-direction*90,y:d.y,radius:12,speed:30000,life:2});
    advance(s.g,FIXED_STEP);assert.equal(s.g.drones.length,0);assert.equal(s.g.projectiles.length,0);assert.equal(s.f.hp,1000);
    assert.equal(s.events.filter(e=>e.type==='droneDestroyed').length,1);
  }
});
test('um projétil não escolhe o drone atrás de Marcelo quando o corpo é atingido primeiro',()=>{
  const s=scene(),d=deploy(s);s.f.x=d.x+150;
  s.g.projectiles.push({owner:1,character:'gustavo',move:'special',data:MOVES.special,direction:-1,
    x:s.f.x+100,prevX:s.f.x+100,y:d.y,radius:12,speed:30000,life:2});
  advance(s.g,FIXED_STEP);assert.ok(s.f.hp<1000);assert.equal(s.g.drones.length,1);
  assert.ok(!s.events.some(e=>e.type==='droneDestroyed'));
});
test('a sentinela permanece autônoma depois que Marcelo recebe um golpe',()=>{
  const s=scene();deploy(s);s.g.hit({attacker:s.target,target:s.f,move:'punch',x:s.f.x,y:s.f.y-200});
  until(s.g,()=>s.events.some(e=>e.type==='droneFire'));assert.ok(s.target.hp<1000);assert.equal(s.events.filter(e=>e.type==='droneFire').length,1);
});
test('pausa e hitstop congelam a carga; KO e round novo limpam drone e laser preservando a barra',()=>{
  const s=scene(),d=deploy(s);advance(s.g,.4);const age=d.age,time=s.g.time;
  s.g.togglePause();advance(s.g,1);assert.equal(d.age,age);assert.equal(s.g.time,time);
  s.g.togglePause();s.g.freeze=.2;advance(s.g,.2);assert.equal(d.age,age);assert.equal(s.g.time,time);
  until(s.g,()=>s.events.some(e=>e.type==='droneFire'));s.f.meter=81;s.target.meter=63;s.g.newRound();
  assert.equal(s.g.drones.length,0);assert.equal(s.g.lasers.length,0);assert.deepEqual(s.g.fighters.map(f=>f.meter),[81,63]);
  s.g.phase='fight';deploy(s);s.target.hp=0;advance(s.g,FIXED_STEP);assert.equal(s.g.phase,'roundEnd');assert.equal(s.g.drones.length,0);
});
test('a CPU de Marcelo instala uma sentinela para pressionar a recuperação do adversário',()=>{
  const s=scene(1);s.g.cpu=true;s.g.random=()=>.5;s.target.knocked=true;s.target.knockdownTime=3;
  until(s.g,()=>s.events.some(e=>e.type==='droneDeploy'));assert.equal(s.g.drones[0].owner,1);
});
test('Rafael e Gustavo não ganham o poder nem têm os ataques bloqueados pelo comando do drone',()=>{
  for(const id of ['rafael','gustavo']){
    const g=new FightEngine();g.start(id,'local','marcelo');g.phase='fight';g.queue(0,'drone');assert.equal(g.fighters[0].buffer,null);
    g.queue(0,'punch');advance(g,.02);assert.equal(g.fighters[0].action,'punch');assert.equal(g.drones.length,0);
  }
});
test('a carga e o dano do laser são iguais em atualizações de 30, 60 e 120 Hz',()=>{
  const run=hz=>{const s=scene();s.g.queue(0,'drone');for(let n=0;n<hz*3;n++)s.g.update(1/hz);
    return {hp:s.target.hp,fires:s.events.filter(e=>e.type==='droneFire').map(e=>e.time),drones:s.g.drones.length};};
  const expected=run(120);for(const hz of [30,60]){const actual=run(hz);assert.equal(actual.hp,expected.hp);assert.equal(actual.drones,0);
    assert.ok(Math.abs(actual.fires[0]-expected.fires[0])<1e-8);}
});
