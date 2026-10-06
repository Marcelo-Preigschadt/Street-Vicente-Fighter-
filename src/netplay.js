import {FIXED_STEP} from './engine.js?v=27';
import {MOVES,sanitizeInput,snapshot} from './net-state.js?v=27';

const LIMIT=180;
const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function restore(engine,state){
  for(const key of ['phase','phaseTime','paused','time','timer','round','roundWinner','freeze','nextDroneId'])engine[key]=state[key];
  state.fighters.forEach((data,i)=>{for(const key of Object.keys(engine.fighters[i]))if(key!=='character'&&key!=='slot'&&Object.hasOwn(data,key))engine.fighters[i][key]=copy(data[key]);});
  for(const key of ['projectiles','drones','lasers'])engine[key]=copy(state[key]);
  if(state.campaign)engine.importStoryState(state.campaign);
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export class RollbackGame {
  constructor({engine,slot,send,onEvent,onCorrection=()=>{},onLag=()=>{},now=()=>performance.now(),startAt=now()}){
    Object.assign(this,{engine,slot,send,onEvent,onCorrection,onLag,now,startAt});this.frame=0;this.held=sanitizeInput();this.attacks=[];
    this.local=new Map();this.remote=new Map();this.history=new Map();this.effects=new Map();this.pending=[];this.lastSend=now();this.lastRemote=0;this.lastRemoteAt=now();this.stepFrame=0;
    this.initial=copy(snapshot(engine,1,[]));this.rollbacks=0;
  }
  input(input){this.held=sanitizeInput(input);}
  attack(move,strength=1){if(MOVES.has(move)&&[0,1,2].includes(strength)&&this.attacks.length<4)this.attacks.push({move,strength});}
  event(event){
    const key=JSON.stringify(event);let used=this.effects.get(this.stepFrame);
    if(!used){used=new Set();this.effects.set(this.stepFrame,used);}
    if(!used.has(key)){used.add(key);this.onEvent(event);}
  }
  advance(){
    if(this.engine.paused)return;
    const target=Math.max(0,Math.floor((this.now()-this.startAt)/(FIXED_STEP*1000)));
    // Small stalls catch up; an overloaded or suspended tab pauses instead of piling up seconds of input.
    if(target-this.frame>60){this.onLag('O jogo perdeu o ritmo nesta aba. A partida foi pausada.');return;}
    let steps=0;
    while(this.frame<target&&steps++<12){
      const frame=this.frame+1,p={frame,input:{...this.held},attacks:this.attacks.splice(0)};
      this.local.set(frame,p);this.pending.push(p);this.simulate(frame);this.frame=frame;this.trim();
    }
    if(this.pending.length&&(this.pending.length>=2||this.now()-this.lastSend>=16)){
      this.send(this.pending.splice(0));this.lastSend=this.now();
    }
    if(this.now()-this.lastRemoteAt>750&&this.frame>60)this.onLag('Aguardando a conexão do outro jogador. A partida foi pausada.');
  }
  previousRemote(frame){return this.history.get(frame-1)?.inputs[1-this.slot]?.input??sanitizeInput();}
  simulate(frame){
    const local=this.local.get(frame),remote=this.remote.get(frame)??{frame,input:{...this.previousRemote(frame)},attacks:[]};
    const inputs=this.slot===0?[local,remote]:[remote,local];
    this.history.set(frame,{before:copy(snapshot(this.engine,frame,[])),inputs:copy(inputs)});this.stepFrame=frame;
    // Both machines apply directions and attack edges in the same slot order.
    for(let i=0;i<2;i++)this.engine.setInput(i,inputs[i].input);
    for(let i=0;i<2;i++)for(const a of inputs[i].attacks)this.engine.queue(i,a.move,a.strength);
    this.engine.update(FIXED_STEP);
  }
  receive(packets){
    if(!Array.isArray(packets)||packets.length>24)return false;
    let earliest=Infinity;
    for(const raw of packets){
      if(!raw||!Number.isSafeInteger(raw.frame)||raw.frame<1||raw.frame>this.frame+120||!Array.isArray(raw.attacks)||raw.attacks.length>4)continue;
      if(raw.attacks.some(a=>!a||!MOVES.has(a.move)||![0,1,2].includes(a.strength)))continue;
      if(this.remote.has(raw.frame))continue;
      if(raw.frame<=this.frame-LIMIT){this.onLag('A conexão atrasou demais. A partida foi pausada.');return false;}
      const p={frame:raw.frame,input:sanitizeInput(raw.input),attacks:raw.attacks.map(a=>({move:a.move,strength:a.strength}))};
      this.remote.set(p.frame,p);this.lastRemote=Math.max(this.lastRemote,p.frame);this.lastRemoteAt=this.now();
      const old=this.history.get(p.frame)?.inputs[1-this.slot];if(old&&!equal(old,p))earliest=Math.min(earliest,p.frame);
    }
    if(Number.isFinite(earliest))this.rollback(earliest);return true;
  }
  rollback(frame){
    const entry=this.history.get(frame);if(!entry)return;
    const paused=this.engine.paused;restore(this.engine,entry.before);for(let n=frame;n<=this.frame;n++)this.simulate(n);this.engine.paused=paused;
    this.rollbacks++;this.onCorrection();
  }
  pauseAt(frame){
    frame=Math.min(frame,this.frame);
    if(frame<this.frame){const saved=this.history.get(frame+1)?.before;if(saved)restore(this.engine,saved);}
    this.frame=frame;this.attacks=[];this.pending=[];this.held=sanitizeInput();
    for(const map of [this.local,this.remote,this.history,this.effects])for(const n of map.keys())if(n>frame)map.delete(n);
    this.engine.paused=true;this.onCorrection();
  }
  resumeAt(startAt){this.startAt=startAt-this.frame*FIXED_STEP*1000;this.lastRemoteAt=this.now();this.engine.paused=false;}
  trim(){for(const map of [this.local,this.remote,this.history,this.effects])for(const n of map.keys())if(n<this.frame-LIMIT)map.delete(n);}
}
