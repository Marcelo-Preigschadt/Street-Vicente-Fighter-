import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FightEngine,FIXED_STEP,CHARACTERS,fighterPose} from '../src/engine.js';
import {FIGHTING_STYLES} from '../src/styles.js';
import {StoryEngine} from '../src/story.js';
import {STORY_HEROES} from '../src/story-data.js';
import {storyHeroPose,storyHeroGeometry} from '../src/story-hero.js';
import {validCharacter,snapshot} from '../src/net-state.js';
import {RollbackGame} from '../src/netplay.js';
import {SOUNDS} from '../src/audio.js';
import {ADRIANO_HURT} from '../src/adriano-data.js';
import {adrianoHurt} from '../src/adriano.js';
import {ADRIANO_TRANSITION_GEOMETRY} from '../src/adriano-transition-data.js';

const advance=(e,t)=>{for(let i=0;i<Math.ceil(t/FIXED_STEP);i++)e.update(FIXED_STEP);};
function scene(slot=0,story=false){
 const events=[],e=story?new StoryEngine({onEvent:v=>events.push(v)}):new FightEngine({random:()=>.5,onEvent:v=>events.push(v)});
 e.start(slot?'rafael':'adriano',story?'story-local':'local',slot?'adriano':'rafael');
 if(story){e.queue(0,'storyNext');e.enemies=[];e.props=[];e.hazards=[];e.checkProgress=()=>{};e.spawnWave=()=>{};}
 else e.phase='fight';
 e.fighters[0].x=250;e.fighters[1].x=950;
 return {e,f:e.fighters[slot],events};
}
test('Adriano é professor de História nos catálogos local, campanha e online, com Karatê individual',()=>{
 assert.equal(CHARACTERS.adriano.name,'Prof. Adriano');assert.equal(CHARACTERS.adriano.category,'teachers');
 assert.ok(STORY_HEROES.includes('adriano'));assert.ok(validCharacter('adriano'));
 assert.notDeepEqual(FIGHTING_STYLES.adriano.names,FIGHTING_STYLES.ruan.names);
 assert.notDeepEqual(FIGHTING_STYLES.adriano.combos,FIGHTING_STYLES.ruan.combos);
 for(const move of ['special','uppercut','super'])assert.notEqual(CHARACTERS.adriano.powers[move],CHARACTERS.rafael.powers[move]);
 const html=readFileSync('index.html','utf8');assert.match(html,/data-fighter="adriano"/);assert.match(html,/<option value="adriano">/);
});
test('as três forças de soco e chute selecionam seis técnicas visuais próprias durante o contato',()=>{
 const poses=[];
 for(const move of ['punch','kick'])for(let strength=0;strength<3;strength++){
  const {e,f}=scene();assert.ok(e.beginMove(f,move,strength));f.actionTime=f.moveData.startup+FIXED_STEP;
  const p=fighterPose(f);assert.equal(p.atlas,'strike');poses.push(p.index);assert.ok(f.attackbox);
  f.actionTime=0;assert.deepEqual(fighterPose(f),strength===1?{atlas:'base',index:0}:{atlas:'strike',index:p.index-1});assert.equal(f.attackbox,null);
 }
 assert.equal(new Set(poses).size,6);
});
test('piloto de soco/chute médios percorre desenhos completos sem adiantar o contato e com colisões idênticas à campanha',()=>{
 for(const story of [false,true])for(const slot of [0,1])for(const move of ['punch','kick']){
  const {e,f}=scene(slot,story);assert.ok(e.beginMove(f,move,1));
  const m=f.moveData,end=m.startup+m.active+m.recovery,seen=new Set();
  const chamber=move==='punch'?2:8;
  for(let tick=0;tick<Math.ceil(end/FIXED_STEP);tick++){
   f.actionTime=tick*FIXED_STEP;const p=fighterPose(f);seen.add(`${p.atlas}:${p.index}`);
   const active=f.actionTime>=m.startup&&f.actionTime<m.startup+m.active;
   assert.equal(!!f.attackbox,active,`${move}/${story}/${slot}/${tick}`);
   if(active)assert.deepEqual(p,{atlas:'strike',index:chamber+1});
   assert.deepEqual(storyHeroGeometry(f).hurt,adrianoHurt(f));
   assert.ok(f.hurtboxes.length);assert.ok(f.hurtboxes.every(b=>[b.x,b.y,b.w,b.h].every(Number.isFinite)));
   if(p.atlas==='transition')assert.deepEqual(adrianoHurt(f),ADRIANO_TRANSITION_GEOMETRY[`transition:${p.index}`].hurt);
  }
  assert.equal(seen.size,7);assert.equal([...seen].filter(p=>p.startsWith('transition:')).length,4);
  assert.deepEqual(fighterPose(f),{atlas:'base',index:0});assert.equal(f.canAct,false);
  advance(e,end+.1);assert.equal(f.action,null);assert.equal(f.canAct,true);
 }
});
test('Selo do Império sai na direção correta nos dois lados e não exige super',()=>{
 for(const slot of [0,1]){
  const {e,f,events}=scene(slot);assert.ok(e.beginMove(f,'special',1));advance(e,.32);
  const p=e.projectiles[0];assert.equal(p.character,'adriano');assert.equal(p.effect,'imperialSeal');assert.equal(p.direction,f.direction);
  assert.equal(events.filter(v=>v.type==='special').length,1);assert.equal(f.meter,0);
 }
});
test('Ascensão da Muralha usa chute ascendente próprio, derruba e recupera sem travar',()=>{
 for(const slot of [0,1]){
  const {e,f,events}=scene(slot);e.fighters[1-slot].x=f.x+f.direction*145;
  assert.ok(e.beginMove(f,'uppercut'));advance(e,.18);assert.equal(fighterPose(f).atlas,'combat');assert.equal(fighterPose(f).index,11);
  assert.ok(f.airborne);advance(e,1.6);assert.equal(f.action,null);assert.equal(f.airborne,false);
  assert.ok(events.some(v=>v.type==='hit'&&v.move==='uppercut'));
 }
});
test('Cerco cria três frentes defendíveis em alturas e direções distintas e só o selo final derruba',()=>{
 for(const slot of [0,1])for(const story of [false,true]){
  const {e,f,events}=scene(slot,story);if(story){const enemy=e.spawnEnemy('lab',600,625);enemy.invincible=20;}
  f.meter=99;assert.equal(e.beginMove(f,'super'),false);f.meter=100;assert.ok(e.beginMove(f,'super'));
  for(let wave=0;wave<3;wave++)e.spawnProjectile(f,f.moveData,wave);
  const ps=e.projectiles;assert.equal(f.meter,0);assert.equal(ps.length,3);
  assert.deepEqual(ps.map(p=>p.direction),[f.direction,-f.direction,f.direction]);
  assert.equal(new Set(ps.map(p=>p.y)).size,3);assert.equal(new Set(ps.map(p=>p.originX)).size,3);
  assert.deepEqual(ps.map(p=>p.data.knockdown),[false,false,true]);
  assert.ok(ps.every(p=>p.data.level==='mid'&&p.prevX===p.originX));
  assert.equal(events.filter(v=>v.type==='special'&&v.move==='super').length,1);
  if(story)for(const p of ps){const event=events.find(v=>v.type==='projectile'&&v.wave===p.wave);assert.equal(event.x,p.x);assert.equal(event.y,p.y+p.lane-625);}
 }
});
test('poses da campanha e colisões usam o mesmo quadro em todas as oito fases de caminhada',()=>{
 const {e,f}=scene(0,true);f.state='walk';f.walkBlend=1;
 for(let i=0;i<8;i++){
  f.walkDistance=250*f.worldScale*(i+.1)/8;const p=storyHeroPose(f);assert.equal(p.atlas,'motion');assert.equal(p.index,i);
  assert.deepEqual(storyHeroGeometry(f).hurt,ADRIANO_HURT.motion[i]);assert.ok(f.hurtboxes.length);
 }
});
test('quatro falas exclusivas existem em PCM e as durações de combate correspondem aos arquivos',()=>{
 for(const move of ['select','special','uppercut','super']){
  const path=SOUNDS['adriano-'+move];assert.ok(path.includes('/adriano-'));
  assert.ok(Object.entries(SOUNDS).every(([key,value])=>key==='adriano-'+move||value!==path));
  const bytes=readFileSync(path);assert.equal(bytes.toString('ascii',0,4),'RIFF');
  let rate,size;for(let at=12;at+8<=bytes.length;){const n=bytes.readUInt32LE(at+4),tag=bytes.toString('ascii',at,at+4);if(tag==='fmt ')rate=bytes.readUInt32LE(at+16);if(tag==='data')size=n;at+=8+n+(n%2);}
  const duration=size/rate;if(move!=='select')assert.ok(Math.abs(duration-CHARACTERS.adriano.voiceDuration[move])<.002);
 }
});
test('super de Adriano converge após rollback com jitter e pacotes fora de ordem',()=>{
 let now=0;const wire=[],nets=[],events=[[],[]];
 for(let slot=0;slot<2;slot++){
  const e=new FightEngine({random:()=>.5,onEvent:v=>nets[slot]?.event(v)});e.start('adriano','online','ruan');e.phase='fight';e.fighters.forEach(f=>f.meter=100);
  nets.push(new RollbackGame({engine:e,slot,now:()=>now,startAt:0,onEvent:v=>events[slot].push(v),send:packets=>wire.push({target:1-slot,due:now+30+(packets[0].frame*17+slot*31)%120,packets:structuredClone(packets)})}));
 }
 const deliver=()=>{for(let i=wire.length-1;i>=0;i--)if(wire[i].due<=now){const p=wire.splice(i,1)[0];nets[p.target].receive(p.packets);}};
 nets[0].attack('super');nets[1].attack('super');
 for(let tick=1;tick<=240;tick++){now=tick*FIXED_STEP*1000+.001;deliver();nets.forEach(n=>n.advance());deliver();}
 for(const n of nets)if(n.pending.length)n.send(n.pending.splice(0));now+=2000;deliver();
 assert.deepEqual(JSON.parse(JSON.stringify(snapshot(nets[0].engine,1))),JSON.parse(JSON.stringify(snapshot(nets[1].engine,1))));
 assert.ok(nets.some(n=>n.rollbacks>0));
 for(const es of events)assert.equal(es.filter(v=>v.type==='special'&&v.character==='adriano'&&v.move==='super').length,1);
});
test('novas transições de soco/chute mantêm os dois clientes iguais após rollback durante o contato',()=>{
 let now=0;const wire=[],nets=[];
 for(let slot=0;slot<2;slot++){
  const e=new FightEngine({random:()=>.5,onEvent:v=>nets[slot]?.event(v)});e.start('adriano','online','adriano');e.phase='fight';
  e.fighters[0].x=e.fighters[0].prevX=520;e.fighters[1].x=e.fighters[1].prevX=680;
  nets.push(new RollbackGame({engine:e,slot,now:()=>now,startAt:0,onEvent:()=>{},send:packets=>wire.push({target:1-slot,due:now+25+(packets[0].frame*19+slot*29)%110,packets:structuredClone(packets)})}));
 }
 const deliver=()=>{for(let i=wire.length-1;i>=0;i--)if(wire[i].due<=now){const p=wire.splice(i,1)[0];nets[p.target].receive(p.packets);}};
 for(let tick=1;tick<=300;tick++){
  now=tick*FIXED_STEP*1000+.001;
  if([1,80,180].includes(tick))nets[0].attack(tick===80?'kick':'punch',1);
  if([42,130,220].includes(tick))nets[1].attack(tick===130?'kick':'punch',1);
  deliver();nets.forEach(n=>n.advance());deliver();
 }
 for(const n of nets)if(n.pending.length)n.send(n.pending.splice(0));now+=2000;deliver();
 assert.deepEqual(JSON.parse(JSON.stringify(snapshot(nets[0].engine,1))),JSON.parse(JSON.stringify(snapshot(nets[1].engine,1))));
 assert.ok(nets.some(n=>n.rollbacks>0));assert.ok(nets[0].engine.fighters.some(f=>f.hp<1000));
});
