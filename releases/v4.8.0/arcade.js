export const ARCADE_ROUTE_SECONDS=5.6;
export const ARCADE_RECORD_KEY='svf-arcade-record-v1';
export const ARCADE_STOPS=Object.freeze([
 {name:'PORTÃO',x:120,y:120},{name:'PÁTIO',x:440,y:120},{name:'CANTINA',x:760,y:120},{name:'BIBLIOTECA',x:1080,y:120},
 {name:'LAB. QUÍMICA',x:1080,y:310},{name:'QUADRA',x:760,y:310},{name:'SALA DE ARTES',x:440,y:310},{name:'AUDITÓRIO',x:120,y:310},
 {name:'LAB. FÍSICA',x:120,y:500},{name:'SALA 301',x:440,y:500},{name:'LAB. INFORMÁTICA',x:760,y:500},{name:'NÚCLEO DO NIT',x:1080,y:500}
]);
const cleanScore=value=>Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):0;
export const formatScore=value=>String(cleanScore(value)).padStart(8,'0');
export function readArcadeRecord(storage){try{return cleanScore(storage?.getItem(ARCADE_RECORD_KEY));}catch{return 0;}}
export function saveArcadeRecord(storage,score){try{storage?.setItem(ARCADE_RECORD_KEY,String(cleanScore(score)));}catch{}}
const breakdown=()=>({combat:0,combo:0,round:0,life:0,time:0,perfect:0,super:0,match:0,clear:0});

export class ArcadeRun {
 constructor({roster,playerId,firstOpponent,record=0}){
  if(!Array.isArray(roster)||new Set(roster).size!==roster.length||!roster.includes(playerId)||!roster.includes(firstOpponent)||playerId===firstOpponent)throw new RangeError('Circuito Arcade exige um elenco válido e adversários diferentes.');
  this.playerId=playerId;this.opponents=[firstOpponent,...roster.filter(id=>id!==playerId&&id!==firstOpponent)];
  this.index=0;this.score=0;this.record=cleanScore(record);this.wins=0;this.perfects=0;this.continues=0;this.state='fighting';this.attempt=0;this.beginAttempt();
 }
 get opponentId(){return this.opponents[this.index];}
 get nextOpponentId(){return this.opponents[this.index+1]??null;}
 get stop(){return ARCADE_STOPS[this.index%ARCADE_STOPS.length];}
 get nextStop(){return ARCADE_STOPS[(this.index+1)%ARCADE_STOPS.length];}
 get total(){return this.opponents.length;}
 get fightScore(){return Object.values(this.breakdown).reduce((sum,n)=>sum+n,0);}
 beginAttempt(){this.attempt++;this.rounds=new Set();this.breakdown=breakdown();this.lastHit=null;}
 add(kind,points){const n=Math.max(0,Math.round(points));this.breakdown[kind]+=n;this.score+=n;this.record=Math.max(this.record,this.score);}
 event(e,engine){
  if(this.state!=='fighting'||!engine.cpu||engine.storyActive)return null;
  if(e.type==='round')this.lastHit=null;
  if(e.type==='hit'&&e.fighter===0&&e.target===1){
   this.add('combat',Math.max(0,Math.min(1000,e.damage??0))*10);
   this.add('combo',Math.max(0,(e.combo??1)-1)*50+(e.comboName?500:0));this.lastHit=e.move;
  }
  if(e.type==='roundEnd'&&!this.rounds.has(engine.round)){
   this.rounds.add(engine.round);
   if(e.winner===0){
    this.add('round',1000);this.add('life',Math.max(0,Math.min(1000,engine.fighters[0].hp))*5);this.add('time',Math.max(0,Math.ceil(engine.timer))*50);
    if(e.perfect){this.add('perfect',5000);this.perfects++;}
    if(this.lastHit==='super'&&engine.fighters[1].hp<=0)this.add('super',2000);
   }
  }
  if(e.type==='result'){
   if(e.winner!==0){this.state='defeated';return this.state;}
   this.add('match',3000);this.wins++;
   this.state=this.nextOpponentId?'route':'complete';if(this.state==='complete')this.add('clear',20000);
   return this.state;
  }
  return null;
 }
 advance(){if(this.state!=='route')return false;this.index++;this.state='fighting';this.beginAttempt();return true;}
 continue(){if(!['defeated','fighting'].includes(this.state))return false;this.score=0;this.continues++;this.state='fighting';this.beginAttempt();return true;}
}

// The circuit is local CPU state. It does not enter online snapshots or alter
// rounds, health, moves, physics or the cooperative campaign.
export class ArcadeFlow {
 constructor({engine,roster,prepare,onBattle=()=>{},onRoute=()=>{},onResult=()=>{},onError=()=>{},onRecord=()=>{},record=0}){
  Object.assign(this,{engine,roster,prepare,onBattle,onRoute,onResult,onError,onRecord});this.record=cleanScore(record);this.run=null;this.generation=0;this.routeTime=0;this.loading=false;this.prepared=false;this.error=null;
 }
 reset(){this.generation++;this.run=null;this.engine.arcadeRun=null;this.loading=false;this.prepared=false;this.error=null;}
 beginPrepared(playerId,firstOpponent){this.reset();this.run=new ArcadeRun({roster:this.roster,playerId,firstOpponent,record:this.record});this.launch();}
 launch(){this.engine.arcadeRun=this.run;this.onBattle(this.run);this.engine.start(this.run.playerId,'cpu',this.run.opponentId);}
 event(e){
  if(!this.run)return false;const previousRecord=this.record,outcome=this.run.event(e,this.engine);
  this.record=Math.max(this.record,this.run.record);if(this.record>previousRecord)this.onRecord(this.record);
  if(!outcome)return false;
  if(outcome==='route'){this.routeTime=0;this.prepared=false;this.error=null;this.onRoute(this.run);void this.prepareRoute();}
  else this.onResult(this.run);
  return true;
 }
 async prepareRoute(){
  if(this.run?.state!=='route'||this.loading)return;
  const generation=this.generation,run=this.run;this.loading=true;this.error=null;
  try{await this.prepare([run.playerId,run.nextOpponentId]);if(generation!==this.generation||run!==this.run)return;this.prepared=true;}
  catch(error){if(generation!==this.generation||run!==this.run)return;this.error=error;this.onError(error);}
  finally{if(generation===this.generation&&run===this.run)this.loading=false;}
 }
 tick(dt){if(this.run?.state!=='route')return;this.routeTime=Math.min(ARCADE_ROUTE_SECONDS,this.routeTime+Math.max(0,dt));if(this.prepared&&this.routeTime>=ARCADE_ROUTE_SECONDS){this.prepared=false;this.run.advance();this.launch();}}
 skip(){if(this.run?.state!=='route')return;this.routeTime=ARCADE_ROUTE_SECONDS;if(this.error)void this.prepareRoute();else this.tick(0);}
 async continue(){
  if(!this.run||this.loading||!['defeated','fighting'].includes(this.run.state))return false;
  const run=this.run,generation=this.generation;this.loading=true;
  try{await this.prepare([run.playerId,run.opponentId]);if(generation!==this.generation||run!==this.run)return false;run.continue();this.launch();return true;}
  catch(error){if(generation===this.generation)this.onError(error);return false;}
  finally{if(generation===this.generation)this.loading=false;}
 }
}
