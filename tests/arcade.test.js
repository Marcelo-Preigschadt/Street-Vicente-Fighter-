import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,CHARACTERS,FIXED_STEP} from '../src/engine.js';
import {ArcadeRun,ArcadeFlow,ARCADE_ROUTE_SECONDS,ARCADE_RECORD_KEY,readArcadeRecord,saveArcadeRecord,formatScore} from '../src/arcade.js';
const roster=Object.keys(CHARACTERS);
const tick=(e,seconds)=>{for(let i=0;i<Math.ceil(seconds/FIXED_STEP);i++)e.update(FIXED_STEP);};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function scene(prepare=async()=>{},record=0){
 let flow;const battles=[],routes=[],results=[],errors=[],records=[];
 const engine=new FightEngine({random:()=>.5,onEvent:e=>flow?.event(e)});engine.updateAI=()=>{};
 flow=new ArcadeFlow({engine,roster,prepare,record,onBattle:r=>battles.push(r.opponentId),onRoute:r=>routes.push(r.opponentId),onResult:r=>results.push(r.state),onError:e=>errors.push(e.message),onRecord:s=>records.push(s)});
 flow.beginPrepared('adriano','rafael');return {engine,flow,battles,routes,results,errors,records};
}
function finishRound(e,winner=0,hp=1000){e.phase='fight';e.timer=90;e.fighters[winner].hp=hp;e.fighters[1-winner].hp=0;e.endRound();tick(e,3.2);}
function finishMatch(e,winner=0,hp=1000){finishRound(e,winner,hp);finishRound(e,winner,hp);}

test('cada personagem enfrenta todo o elenco, sem repetir ou enfrentar a si mesmo, começando pelo rival escolhido',()=>{
 for(const id of roster)for(const rival of roster.filter(r=>r!==id)){
  const run=new ArcadeRun({roster,playerId:id,firstOpponent:rival});assert.equal(run.total,12);assert.equal(run.opponentId,rival);
  assert.equal(new Set(run.opponents).size,12);assert.equal(run.opponents.includes(id),false);assert.deepEqual([...run.opponents].sort(),roster.filter(r=>r!==id).sort());
 }
 assert.throws(()=>new ArcadeRun({roster,playerId:'adriano',firstOpponent:'adriano'}),RangeError);
});
test('pontuação soma dano, combo, vida, tempo, round e super sem conceder pontos aos acertos da CPU',()=>{
 const {engine:e,flow}=scene(),run=flow.run;e.phase='fight';
 e.event('hit',{fighter:1,target:0,damage:400,combo:4});assert.equal(run.score,0);
 e.event('hit',{fighter:0,target:1,damage:73,combo:3,move:'super'});
 e.fighters[0].hp=800;e.fighters[1].hp=0;e.timer=32.4;e.endRound();
 assert.equal(run.score,9480);assert.deepEqual(run.breakdown,{combat:730,combo:100,round:1000,life:4000,time:1650,perfect:0,super:2000,match:0,clear:0});
 e.event('roundEnd',{winner:0,perfect:false});assert.equal(run.score,9480);
});
test('Perfect exige vida integral, inclusive sem dano de chip, e usa o vencedor correto nos dois lados',()=>{
 for(const winner of [0,1])for(const hp of [1000,999]){
  const events=[],e=new FightEngine({onEvent:v=>events.push(v)});e.start('adriano','local','rafael');e.phase='fight';e.fighters[winner].hp=hp;e.fighters[1-winner].hp=0;e.endRound();
  const event=events.find(v=>v.type==='roundEnd');assert.equal(event.winner,winner);assert.equal(event.perfect,hp===1000);
 }
});
test('empate não concede Perfect, bônus de vitória ou avanço e continua o mesmo confronto',()=>{
 const {engine:e,flow}=scene();e.phase='fight';e.timer=0;e.endRound();tick(e,3.2);
 assert.equal(flow.run.score,0);assert.equal(flow.run.index,0);assert.equal(flow.run.state,'fighting');assert.equal(e.round,2);assert.ok(e.fighters.every(f=>f.wins===0));
});
test('vitória por tempo usa vida e relógio reais, sem depender de KO',()=>{
 const {engine:e,flow}=scene();e.phase='fight';e.timer=0;e.fighters[0].hp=600;e.fighters[1].hp=400;e.endRound();
 assert.equal(flow.run.breakdown.time,0);assert.equal(flow.run.breakdown.life,3000);assert.equal(flow.run.score,4000);assert.equal(e.roundWinner,0);
});
test('um round vencido não avança; a luta termina com duas vitórias e gera uma única rota',async()=>{
 const {engine:e,flow,routes}=scene();finishRound(e);assert.equal(flow.run.state,'fighting');assert.equal(flow.run.wins,0);
 finishRound(e);await flush();assert.equal(flow.run.state,'route');assert.equal(flow.run.wins,1);assert.equal(routes.length,1);assert.equal(flow.run.score,34000);
 e.event('result',{winner:0});assert.equal(flow.run.score,34000);assert.equal(routes.length,1);
});
test('o circuito inteiro avança automaticamente, restaura o próximo confronto e termina em campeão',async()=>{
 const {engine:e,flow,battles,results}=scene();
 for(let i=0;i<12;i++){
  assert.equal(flow.run.index,i);assert.equal(e.fighters[0].hp,1000);assert.equal(e.fighters[0].wins,0);assert.equal(e.fighters[0].meter,0);assert.equal(e.round,1);
  finishMatch(e);await flush();if(i<11){assert.equal(flow.run.state,'route');flow.tick(ARCADE_ROUTE_SECONDS);assert.equal(flow.run.state,'fighting');assert.equal(e.phase,'intro');}
 }
 assert.equal(flow.run.state,'complete');assert.equal(flow.run.wins,12);assert.equal(flow.run.perfects,24);assert.equal(flow.run.score,428000);assert.equal(new Set(battles).size,12);assert.deepEqual(results,['complete']);
 flow.tick(100);assert.equal(battles.length,12);
});
test('derrota oferece continuação no mesmo rival, zera pontos e preserva o recorde',async()=>{
 const {engine:e,flow,results}=scene();e.event('hit',{fighter:0,target:1,damage:100,combo:1});finishMatch(e,1);
 assert.equal(flow.run.state,'defeated');assert.deepEqual(results,['defeated']);assert.equal(flow.run.score,1000);assert.equal(flow.run.record,1000);
 await flow.continue();assert.equal(flow.run.index,0);assert.equal(flow.run.opponentId,'rafael');assert.equal(flow.run.score,0);assert.equal(flow.run.record,1000);assert.equal(flow.run.continues,1);assert.equal(e.phase,'intro');
});
test('preparação atrasada aguarda os assets mesmo quando Enter adianta a animação',async()=>{
 let resolve;const ready=new Promise(r=>resolve=r),{engine:e,flow,battles}=scene(()=>ready);finishMatch(e);flow.skip();flow.tick(20);
 assert.equal(flow.run.state,'route');assert.equal(battles.length,1);resolve();await flush();flow.tick(0);assert.equal(flow.run.state,'fighting');assert.equal(battles.length,2);
});
test('erro de carregamento mantém a rota e permite tentar novamente sem pular adversários',async()=>{
 let calls=0;const {engine:e,flow,errors}=scene(async()=>{if(++calls===1)throw new Error('Falha no atlas');});finishMatch(e);await flush();flow.tick(10);
 assert.equal(flow.run.state,'route');assert.deepEqual(errors,['Falha no atlas']);flow.skip();await flush();flow.tick(0);assert.equal(flow.run.index,1);assert.equal(calls,2);
});
test('sair do circuito invalida uma preparação pendente e não inicia uma luta após o retorno ao menu',async()=>{
 let resolve;const ready=new Promise(r=>resolve=r),{engine:e,flow,battles}=scene(()=>ready);finishMatch(e);flow.reset();e.phase='selection';resolve();await flush();flow.tick(20);
 assert.equal(flow.run,null);assert.equal(e.arcadeRun,null);assert.equal(e.phase,'selection');assert.equal(battles.length,1);
});
test('continuação bloqueia cliques duplicados e também respeita cancelamento durante carregamento',async()=>{
 let resolve;const ready=new Promise(r=>resolve=r),{engine:e,flow,battles}=scene(()=>ready);finishMatch(e,1);const first=flow.continue();assert.equal(await flow.continue(),false);
 flow.reset();resolve();assert.equal(await first,false);assert.equal(battles.length,1);
});
test('eventos de História e partidas locais ou online não contam pontos nem avançam o circuito',()=>{
 const run=new ArcadeRun({roster,playerId:'adriano',firstOpponent:'rafael'});
 for(const other of [{cpu:false,storyActive:false},{cpu:true,storyActive:true}]){
  assert.equal(run.event({type:'result',winner:0},other),null);assert.equal(run.event({type:'hit',fighter:0,target:1,damage:100},other),null);
 }assert.equal(run.score,0);assert.equal(run.state,'fighting');
});
test('recorde local tolera armazenamento indisponível e valores inválidos, sem travar o jogo',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};assert.equal(readArcadeRecord(storage),0);
 saveArcadeRecord(storage,12345);assert.equal(values.get(ARCADE_RECORD_KEY),'12345');assert.equal(readArcadeRecord(storage),12345);assert.equal(formatScore(12345),'00012345');
 for(const v of ['NaN','-1','1.5','9999999999999999999']){values.set(ARCADE_RECORD_KEY,v);assert.equal(readArcadeRecord(storage),0);}
 const blocked={getItem(){throw Error('Storage bloqueado');},setItem(){throw Error('Quota');}};assert.equal(readArcadeRecord(blocked),0);assert.doesNotThrow(()=>saveArcadeRecord(blocked,10));
 saveArcadeRecord(()=>storage,90);assert.equal(readArcadeRecord(()=>storage),90);
 const denied=()=>{throw Error('Getter de localStorage bloqueado');};assert.equal(readArcadeRecord(denied),0);assert.doesNotThrow(()=>saveArcadeRecord(denied,10));
});
