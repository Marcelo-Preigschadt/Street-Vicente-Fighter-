import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, FIXED_STEP, WORLD, fighterPose } from '../src/engine.js';
import { FIGHTING_STYLES, styleStrike } from '../src/styles.js';
import { STYLE_HURT } from '../src/styles-data.js';

function scene(id,slot=0,other=id==='marcelo'?'gustavo':'marcelo') {
  const events=[],game=new FightEngine({random:()=>.6,onEvent:e=>events.push(e)});
  game.start(slot===0?id:other,'local',slot===0?other:id); game.phase='fight';
  game.fighters[0].x=450; game.fighters[1].x=570;
  return { game,events,f:game.fighters[slot],target:game.fighters[1-slot],slot };
}
const advance=(game,seconds)=>{for(let i=0;i<seconds/FIXED_STEP;i++)game.update(FIXED_STEP);};
function until(game,condition,seconds=1.5){for(let i=0;i<seconds/FIXED_STEP&&!condition();i++)game.update(FIXED_STEP);assert.ok(condition());}

test('cada modalidade tem alcance e tempo próprios; boxe usa apenas punhos em todos os contextos',()=>{
 const m=scene('marcelo'),r=scene('rafael'),g=scene('gustavo');
 for(const s of [m,r,g]){s.game.queue(0,'punch',0);advance(s.game,.01);}
 assert.ok(r.f.moveData.startup<m.f.moveData.startup);
 for(const s of [m,r,g]){s.game.clearAction(s.f);s.game.queue(0,'kick');advance(s.game,.01);}
 assert.ok(styleStrike(m.f).reach<styleStrike(g.f).reach);
 assert.equal(m.f.moveData.technique,'Joelhada');assert.equal(r.f.moveData.technique,'Gancho');assert.equal(g.f.moveData.technique,'Chute circular');
 for(const names of Object.values(FIGHTING_STYLES.rafael.names))for(const name of names)assert.doesNotMatch(name,/chute|joelh|rasteira/i);
});

test('as doze sequências completas acertam, escalam o dano e mostram o nome, nos dois lados e contra todos os rivais',()=>{
 for(const id of Object.keys(FIGHTING_STYLES))for(const other of Object.keys(FIGHTING_STYLES).filter(v=>v!==id))for(const slot of [0,1])for(const route of FIGHTING_STYLES[id].combos){
  const {game,events,f,target}=scene(id,slot,other);let raw=0;
  for(const [index,step] of route.steps.entries()){
   const [move,strength]=step.split(':');game.setInput(slot,{down:['crouchPunch','sweep'].includes(move)});game.queue(slot,move,Number(strength));
   until(game,()=>events.filter(e=>e.type==='hit'&&e.fighter===slot).length===index+1);
   raw+=f.moveData.damage*f.character.power;
   assert.equal(f.combo,index+1);assert.ok(game.fighters[1].x-game.fighters[0].x>=112-1e-8);
  }
  assert.equal(f.comboName,route.name);assert.ok(f.comboNameTime>0);
  assert.equal(events.filter(e=>e.type==='swing'&&e.chained).length,route.steps.length-1);
  assert.ok(1000-target.hp<Math.round(raw));
 }
});

test('uma sequência bloqueada pode encadear, mas não vira contador de acertos nem atravessa a defesa',()=>{
 for(const id of Object.keys(FIGHTING_STYLES)){
  const {game,events,target}=scene(id);const route=FIGHTING_STYLES[id].combos[0];game.setInput(1,{block:true});
  for(const [i,s]of route.steps.entries()){
   const [move,strength]=s.split(':');game.queue(0,move,Number(strength));
   until(game,()=>events.filter(e=>e.type==='block').length===i+1);
  }
  assert.equal(target.hp,1000);assert.equal(game.fighters[0].combo,0);assert.equal(game.fighters[0].comboName,'');
 }
});

test('golpe no vazio, comando fora da sequência e janela vencida não cancelam a recuperação',()=>{
 for(const kind of ['miss','wrong','late']){
  const {game,events,f}=scene('rafael');if(kind==='miss')game.fighters[1].x=1050;
  game.queue(0,'punch',0);until(game,()=>f.action==='punch');
  if(kind==='miss')until(game,()=>f.movePhase==='recovery');else until(game,()=>f.actionHit);
  if(kind==='late')advance(game,.32);
  const chained=events.filter(e=>e.chained).length;
  game.queue(0,kind==='wrong'?'kick':'punch',kind==='wrong'?2:1);advance(game,.0084);
  assert.equal(events.filter(e=>e.chained).length,chained);
 }
});

test('sequências têm final e não aceitam loops de jab ou cancelamento aéreo',()=>{
 const {game,events,f}=scene('rafael');game.queue(0,'punch',0);until(game,()=>f.actionHit);
 game.queue(0,'punch',0);advance(game,.03);assert.equal(events.filter(e=>e.chained).length,0);
 const air=scene('gustavo');air.game.fighters[1].x=1050;air.game.setInput(0,{jump:true});advance(air.game,.08);air.game.setInput(0,{});
 air.game.queue(0,'punch',0);advance(air.game,.05);air.game.queue(0,'kick');advance(air.game,.04);
 assert.equal(air.events.filter(e=>e.type==='swing').length,1);
});

test('gancho no corpo do boxe não derruba e pode ser bloqueado alto ou baixo',()=>{
 for(const slot of [0,1])for(const guard of [null,false,true]){
  const {game,events,target}=scene('rafael',slot);game.setInput(slot,{down:true});
  if(guard!==null)game.setInput(1-slot,{block:true,down:guard});
  game.queue(slot,'kick');until(game,()=>events.some(e=>e.type===(guard===null?'hit':'block')));
  assert.equal(target.knocked,false);assert.equal(target.hp<1000,guard===null);
 }
});

test('o uppercut normal do boxe finaliza a sequência sem consumir super nem emitir poder',()=>{
 const {game,events,f,target}=scene('rafael');f.meter=61;game.queue(0,'kick',2);until(game,()=>target.knocked);
 assert.equal(f.moveData.technique,'Uppercut');assert.equal(f.state,'kick');assert.equal(f.y,WORLD.floor);
 assert.ok(f.meter>=61);assert.equal(events.some(e=>e.type==='special'||e.type==='superStart'),false);
});

test('guarda e golpes de estilo usam as mesmas silhuetas vulneráveis nos dois sentidos',()=>{
 for(const id of Object.keys(FIGHTING_STYLES)){
  const {game,f}=scene(id);assert.equal(STYLE_HURT[id].length,16);
  for(const direction of [-1,1])for(const state of ['idle','punch','kick','crouchPunch','sweep','airPunch','airKick','throw']){
   f.direction=direction;f.state=state;f.action=null;f.moveData={startup:.1,active:.2,strength:1};f.actionTime=.12;
   const pose=fighterPose(f);assert.equal(pose.atlas,'style');
   const expected=STYLE_HURT[id][pose.index].map(([x,h,w,height])=>({x:f.x+(direction>0?x:-x-w),y:f.y-h,w,h:height}));
   assert.deepEqual(f.hurtboxes,expected);
  }
 }
});

test('CPU usa os mesmos combos e reset de round limpa só a sequência e mantém a carga',()=>{
 const {game,events,f}=scene('rafael',1);game.cpu=true;game.ai.timer=1;game.ai.actionTimer=1;
 game.queue(1,'punch',0);until(game,()=>events.some(e=>e.type==='swing'&&e.chained));
 assert.ok(f.chain.length>1);f.meter=57;game.newRound();assert.deepEqual(f.chain,[]);assert.equal(f.comboName,'');assert.equal(f.meter,57);
});
