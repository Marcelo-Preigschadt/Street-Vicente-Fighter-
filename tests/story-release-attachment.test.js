import test from 'node:test';
import assert from 'node:assert/strict';
import {StoryEngine,validStoryState} from '../src/story.js';
import {CHARACTERS,FIXED_STEP,WORLD,FightEngine} from '../src/engine.js';
import {STORY_ACTS} from '../src/story-data.js';
import {storyHeroPose,storyHandSocket,STORY_WALK_STRIDE} from '../src/story-hero.js';
import {STORY_HERO_GEOMETRY} from '../src/story-hero-geometry.js';
import {entityScale} from '../src/story-world.js';
import {schoolEnemyFrame} from '../src/story-presentation.js';
import {snapshot,applySnapshot} from '../src/net-state.js';
import {readFile} from 'node:fs/promises';
const game=(id='marcelo',act=0)=>{const e=new StoryEngine();e.start(id,'story-solo','rafael',{act});e.queue(0,'storyNext');e.props=[];e.hazards=[];e.checkProgress=()=>{};return e;};
const tick=(e,n)=>{for(let i=0;i<n;i++)e.update(FIXED_STEP);};

for(const act of [0,1,2,3])test(`ato ${act+1}: a onda inteira entra de fora da tela sem teletransporte`,()=>{
 const e=game('marcelo',act);e.camera=act*600;e.fighters[0].x=e.camera+600;e.fighters[0].prevX=e.fighters[0].x;
 e.spawnWave();
 for(const enemy of e.enemies){const margin=e.enemyExtent(enemy.kind);assert.ok(enemy.x<=e.camera-margin||enemy.x>=e.camera+WORLD.width+margin);assert.equal(enemy.entering,true);}
 let visible=0;
 for(let n=0;n<900;n++){
  const before=e.enemies.map(x=>x.x);e.update(FIXED_STEP);
  e.enemies.forEach((enemy,i)=>{assert.ok(Math.abs(enemy.x-before[i])<6,'entrada não pode saltar até o limite da câmera');if(enemy.x>e.camera&&enemy.x<e.camera+WORLD.width)visible++;});
 }
 assert.ok(visible>0);assert.ok(e.enemies.every(x=>!x.entering));
});

test('rollback restaura inimigos em entrada, inclusive à esquerda do cenário',()=>{
 const a=game(),b=game();a.spawnWave();assert.ok(a.enemies.some(x=>x.x<0));
 const s=JSON.parse(JSON.stringify(snapshot(a,1)));assert.ok(validStoryState(s.campaign));assert.ok(applySnapshot(b,s));
 for(let n=0;n<300;n++){a.update(FIXED_STEP);b.update(FIXED_STEP);assert.deepEqual(a.exportStoryState(),b.exportStoryState());}
 s.campaign.enemies[0].x=-900;assert.equal(validStoryState(s.campaign),false);
});

test('holograma e voadores acumulam deslocamento real e não recebem gravidade em voo',async()=>{
 const meta=JSON.parse(await readFile('assets/story/enemy-animation-v5.json'));
 for(const kind of ['snack','book','archaeologist','aula','projector']){
  const e=game();e.fighters[0].x=500;e.fighters[0].prevX=500;const f=e.spawnEnemy(kind,1100,625),seen=new Set();f.aiTime=100;f.cooldown=100;
  for(let n=0;n<240;n++){const x=f.x,z=f.lane,travel=f.brawlerWalkDistance;e.update(FIXED_STEP);if(f.state==='walk'){assert.ok(Math.abs(f.brawlerWalkDistance-travel-Math.hypot(f.x-x,f.lane-z))<1e-7);seen.add(schoolEnemyFrame(f,meta[kind]));}assert.equal(f.vy,0);assert.ok(f.profile.fly?f.y<WORLD.floor-60:f.y===WORLD.floor);}
  assert.ok(f.brawlerWalkDistance>50);
  if(kind==='aula'||kind==='archaeologist')assert.ok(seen.size>=4,`${kind}: ciclo não pode ficar congelado`);
 }
});

test('passada completa da campanha usa distância física e ritmo próprio nos 12 heróis',()=>{
 for(const id of Object.keys(CHARACTERS)){
  const e=game(id),f=e.fighters[0],start=f.x;e.setInput(0,{right:true});tick(e,120);
  assert.ok(Math.abs(f.walkDistance-(f.x-start))<1e-6);
  const phase=f.walkDistance/(STORY_WALK_STRIDE*entityScale(f));
  assert.equal(storyHeroPose(f).index,Math.floor(phase*8)%8);
  assert.ok(phase>.5&&phase<1.05,'uma caminhada não deve ciclar 3–4 passos curtos por segundo');
  e.setInput(0,{});tick(e,8);assert.equal(f.state,'idle');
  const pose=storyHeroPose(f);if(pose.atlas==='motion')assert.ok([0,4].includes(pose.index),'parada termina em apoio, não com joelho suspenso');
 }
});

test('recuo dos inimigos inverte o ciclo sem trocar a direção da guarda',()=>{
 const e=game(),f=e.fighters[0];f.x=500;f.prevX=500;
 const enemy=e.spawnEnemy('elite',800,625);enemy.brawlerState='orbit';enemy.brawlerOrbit=1;
 enemy.brawlerTargetX=950;enemy.brawlerTargetLane=625;enemy.cooldown=100;enemy.aiTime=100;
 tick(e,40);assert.equal(enemy.direction,-1);assert.ok(enemy.x>800);assert.ok(enemy.brawlerWalkDistance<0);
 const pose=schoolEnemyFrame(enemy);assert.ok(pose>=1&&pose<=8);
});

for(const id of Object.keys(CHARACTERS))test(`${id}: toda rajada usa a mão da pose, com espelhamento, profundidade e salto`,()=>{
 for(const facing of [1,-1])for(const air of [false,true])for(const move of ['special','super']){
  const e=game(id),f=e.fighters[0],events=[];e.onEvent=v=>events.push(v);
  f.x=800;f.prevX=f.x;f.direction=facing;f.lane=550;f.prevLane=550;f.y=air?470:WORLD.floor;f.prevY=f.y;f.meter=100;
  assert.ok(e.beginMove(f,move));const m=f.moveData;if(!m.projectile)continue;
  if(id==='adriano'&&move==='super')continue; // Siege fronts have independent origins, covered by adriano.test.js.
  const count=m.waves??(move==='super'?3:1);
  for(let wave=0;wave<count;wave++){
   f.actionTime=m.startup+wave*.11+1e-8;f.state=move;
   const pose=storyHeroPose(f),g=STORY_HERO_GEOMETRY[id][`${pose.atlas}:${pose.index}`];assert.ok(g,'a mão de disparo precisa de registro pintado');
   e.spawnProjectile(f,m,wave);const p=e.projectiles.at(-1),s=entityScale(f),width=f.character.visualWidth??1;
   assert.ok(Math.abs(p.originX-(f.x+facing*g.hand[0]*s*width))<1e-7);
   assert.ok(Math.abs(p.originY-(f.y+g.hand[1]*s))<1e-7);assert.equal(p.prevX,p.originX);assert.equal(p.lane,550);
   const event=events.findLast(v=>v.type==='projectile');assert.equal(event.x,p.originX);assert.equal(event.y,p.originY+550-WORLD.floor);
  }
 }
});

test('drones saem da mão, seguem uma trajetória e o sentinela atinge o corpo do inimigo',()=>{
 for(const move of ['drone','super']){
  const e=game(),f=e.fighters[0];f.x=800;f.prevX=f.x;f.meter=100;
  const enemy=e.spawnEnemy('lab',1100,625);enemy.hitstun=100;enemy.aiTime=100;
  e.beginMove(f,move);f.state=move;f.actionTime=f.moveData.startup;const hand=storyHandSocket(f);
  if(move==='drone')e.deployDrone(f,f.moveData);else e.deploySwarm(f,f.moveData);
  for(const d of e.drones){assert.equal(d.x,hand.x);assert.equal(d.y,hand.y);assert.equal(d.lane,f.lane);}
  const first=e.drones[0],origin=first.x;e.time+=.16;e.updateDrones(FIXED_STEP,[]);assert.ok(first.x!==origin);assert.ok(first.x!==first.dockX);
  f.shotsSent=1;tick(e,320);assert.ok(enemy.hp<enemy.maxHp);
 }
});

test('poderes ascendentes também usam mãos registradas nas poses de preparação e contato',()=>{
 for(const id of Object.keys(CHARACTERS))for(const facing of [1,-1]){
  const e=game(id),f=e.fighters[0];f.direction=facing;e.beginMove(f,'uppercut');f.state='uppercut';
  for(const phase of [.3,.6,1.1]){
   f.actionTime=f.moveData.startup*phase;
   const pose=storyHeroPose(f),g=STORY_HERO_GEOMETRY[id][`${pose.atlas}:${pose.index}`];assert.ok(g,`${id}/${pose.atlas}:${pose.index}`);
   const socket=storyHandSocket(f);assert.equal(socket.x,f.x+facing*g.hand[0]*entityScale(f)*(f.character.visualWidth??1));
   assert.equal(socket.y,f.y+g.hand[1]*entityScale(f));
  }
 }
});

test('a física de versus também permanece idêntica ao alternar entre história e local',()=>{
 const a=new FightEngine(),b=game();a.start('marcelo','local','rafael');b.start('marcelo','local','rafael');a.phase=b.phase='fight';
 for(let n=0;n<120;n++){const input={right:n<70,left:n>=85};a.setInput(0,input);b.setInput(0,input);a.update(FIXED_STEP);b.update(FIXED_STEP);assert.deepEqual(snapshot(a,1),snapshot(b,1));}
});
