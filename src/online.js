import { PROTOCOL,MOVES,validCharacter,snapshot,applySnapshot } from './net-state.js?v=23';
import {RollbackGame} from './netplay.js?v=23';

const QUEUE='street-vicente-fighter-300-waiting';
const PREFIX='street-vicente-fighter-300-room-';
let peerScript;
export function loadPeer() {
  if(globalThis.Peer)return Promise.resolve(globalThis.Peer);
  if(!peerScript)peerScript=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='src/vendor/peerjs-1.5.5.min.js';
    script.onload=()=>resolve(globalThis.Peer);script.onerror=()=>{script.remove();peerScript=null;reject(new Error('Não foi possível carregar a conexão online. Tente novamente.'));};
    document.head.append(script);
  });return peerScript;
}
export function roomCode(random=crypto.getRandomValues(new Uint8Array(8))) {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(random,n=>alphabet[n%32]).join('');
}
export function normalizeCode(code) { return String(code).trim().toUpperCase().replace(/[\s-]/g,''); }
export class OnlineMatch {
  constructor({engine,prepare,onStart,onStatus,onEnd,onCorrection=()=>{},PeerClass=null,now=()=>performance.now()}={}) {
    Object.assign(this,{engine,prepare,onStart,onStatus,onEnd,onCorrection,PeerClass,now});this.generation=0;this.active=false;this.running=false;this.slot=0;
  }
  status(text) { this.onStatus?.(text); }
  async begin(kind,character,code='') {
    this.close();const gen=this.generation;this.active=true;this.character=character;this.kind=kind;this.code='';this.events=[];this.seq=0;this.lastSeq=0;this.matchId=null;this.votes=[false,false];
    if(!validCharacter(character))return this.fail('Escolha um professor.');
    code=normalizeCode(code);
    if(kind==='join'&&!/^[A-HJ-NP-Z2-9]{8}$/.test(code))return this.fail('Digite os 8 caracteres do código da sala.');
    try{
      this.status('Conectando ao modo online…');this.PeerClass??=await loadPeer();if(gen!==this.generation)return;
      if(kind==='quick')await this.quick(gen);
      else if(kind==='create'){
        this.slot=0;this.code=roomCode();await this.openPeer(PREFIX+this.code,gen);if(gen!==this.generation)return;
        this.status(`Sala ${this.code} criada. Aguardando outro jogador…`);
      }else{this.slot=1;this.code=code;await this.openPeer(undefined,gen);if(gen!==this.generation)return;this.connect(PREFIX+code,gen);}
    }catch(error){if(gen===this.generation)this.fail(this.message(error));}
  }
  async quick(gen) {
    this.slot=0;
    try{await this.openPeer(QUEUE,gen);if(gen!==this.generation)return;this.status('Procurando adversário… Deixe esta aba aberta.');}
    catch(error){
      if(gen!==this.generation)return;
      if(error.type!=='unavailable-id')throw error;
      this.slot=1;await this.openPeer(undefined,gen);if(gen!==this.generation)return;
      this.status('Jogador encontrado. Conectando a luta…');this.connect(QUEUE,gen);
    }
  }
  openPeer(id,gen) {
    this.peer?.destroy();
    return new Promise((resolve,reject)=>{
      const p=new this.PeerClass(id,{secure:true,debug:0});this.peer=p;
      let settled=false;const timer=setTimeout(()=>{if(!settled){settled=true;p.destroy();reject(new Error('O serviço online demorou para responder. Tente novamente.'));}},12000);
      this.openReject=()=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error('Busca cancelada.'));}};
      p.on('open',()=>{if(gen!==this.generation){p.destroy();return;}settled=true;clearTimeout(timer);this.openReject=null;resolve(p);});
      p.on('error',error=>{
        if(gen!==this.generation||p!==this.peer)return;
        if(!settled){settled=true;clearTimeout(timer);reject(error);}
        else if(!this.running&&error.type!=='peer-unavailable')this.fail(this.message(error));
        else if(!this.running&&error.type==='peer-unavailable')this.failedConnection(gen);
      });
      p.on('connection',conn=>{
        if(gen!==this.generation||this.slot!==0||this.conn||conn.metadata?.protocol!==PROTOCOL||!validCharacter(conn.metadata?.character)){
          conn.on('open',()=>{conn.send({t:'busy'});setTimeout(()=>conn.close(),100);});return;
        }
        this.attach(conn,gen,true);
      });
    });
  }
  connect(id,gen) {
    const c=this.peer.connect(id,{reliable:true,serialization:'json',metadata:{protocol:PROTOCOL,character:this.character}});
    this.attach(c,gen,false);
  }
  attach(conn,gen,host) {
    this.conn=conn;this.connectedAt=this.now();this.lastReceived=this.now();this.lastSnapshot=0;this.lastPing=0;this.lastInput=-1000;this.lastInputKey='';this.lastRemoteInput=-1;this.inputSequence=0;
    this.connectTimer=setTimeout(()=>{if(gen===this.generation&&!this.running)this.failedConnection(gen);},20000);
    conn.on('error',()=>{if(gen===this.generation)this.failedConnection(gen);});
    conn.on('close',()=>{if(gen===this.generation)this.fail('O outro jogador saiu da partida. Encontre um novo adversário.');});
    conn.on('data',data=>{if(gen===this.generation)this.receive(data,gen);});
    conn.on('open',()=>{
      if(gen!==this.generation){conn.close();return;}
      if(host){
        this.pair=[this.character,conn.metadata.character];this.matchId=crypto.randomUUID();this.localReady=false;this.remoteReady=false;this.remoteSynced=false;
        this.send({t:'offer',protocol:PROTOCOL,pair:this.pair,matchId:this.matchId});this.preparePair(gen);
      }
    });
  }
  async preparePair(gen) {
    this.status('Adversário conectado. Preparando os dois professores…');
    try{await this.prepare(this.pair,this.slot);if(gen!==this.generation)return;this.localReady=true;
      if(this.slot===0){if(this.remoteReady&&this.remoteSynced)this.startHost();else this.status('Aguardando o outro jogador carregar…');}
      else this.send({t:'ready',matchId:this.matchId,clientTime:this.now()});
    }catch(error){if(gen===this.generation)this.fail('Não foi possível carregar os personagens. Tente entrar novamente.');}
  }
  send(data) {
    if(!this.conn?.open)return false;
    // Stop rather than queue stale commands behind a congested data channel.
    if(data.t==='frames'&&(this.conn.dataChannel?.bufferedAmount??0)>128000)return false;
    try{this.conn.send(data);return true;}catch{return false;}
  }
  receive(m,gen) {
    if(!m||typeof m!=='object'||JSON.stringify(m).length>160000)return;
    this.lastReceived=this.now();
    if(m.t==='busy'){this.failedConnection(gen);return;}
    if(m.t==='ping'){this.send({t:'pong',sent:m.sent});return;}
    if(m.t==='pong'){this.ping=Math.max(0,Math.round(this.now()-m.sent));return;}
    if(m.t==='offer'&&this.slot===1&&!this.matchId){
      if(m.protocol!==PROTOCOL||!Array.isArray(m.pair)||m.pair.length!==2||!m.pair.every(validCharacter)||m.pair[1]!==this.character||typeof m.matchId!=='string')return this.fail('As versões do jogo são diferentes. Atualize a página.');
      this.pair=m.pair;this.matchId=m.matchId;this.localReady=false;this.preparePair(gen);return;
    }
    if(m.matchId!==this.matchId||!this.matchId)return;
    if(m.t==='ready'&&this.slot===0&&Number.isFinite(m.clientTime)){
      this.remoteReady=true;this.send({t:'sync',matchId:this.matchId,clientTime:m.clientTime,hostTime:this.now()});return;
    }
    if(m.t==='sync'&&this.slot===1&&Number.isFinite(m.clientTime)&&Number.isFinite(m.hostTime)){
      this.ping=Math.max(0,this.now()-m.clientTime);this.clockOffset=m.hostTime-(this.now()+m.clientTime)/2;
      this.send({t:'synced',matchId:this.matchId});return;
    }
    if(m.t==='synced'&&this.slot===0){this.remoteSynced=true;if(this.localReady&&!this.running)this.startHost();return;}
    if(m.t==='start'&&this.slot===1&&this.localReady&&Number.isFinite(m.startAt)){
      this.netplay=null;this.lastSeq=0;this.running=true;this.votes=[false,false];this.engine.start(...[this.pair[0],'online',this.pair[1]]);
      if(!applySnapshot(this.engine,m.state,0))return this.fail('Não foi possível sincronizar a luta. Entre na sala novamente.');
      this.lastSeq=m.state.seq;
      this.createNetplay(m.startAt-(this.clockOffset??0));
      clearTimeout(this.connectTimer);this.onStart(this.pair,this.slot);this.status('Partida online · Você é P2');return;
    }
    if(!this.running)return;
    if(m.t==='frames'){this.netplay?.receive(m.frames);return;}
    if(m.t==='pause'&&this.slot===0&&typeof m.paused==='boolean'){this.changePause(m.paused);return;}
    if(m.t==='paused'&&this.slot===1&&Number.isSafeInteger(m.frame)&&typeof m.paused==='boolean'){
      if(m.paused)this.netplay.pauseAt(m.frame);else this.netplay.resumeAt(m.startAt-(this.clockOffset??0));
      this.lagRequested=false;this.engine.onEvent({type:'pause',paused:m.paused,_netplay:true});return;
    }
    if(m.t==='rematch'&&this.engine.phase==='result'){
      this.votes[1-this.slot]=true;if(this.slot===0&&this.votes.every(Boolean))this.startHost();return;
    }
    if(m.t==='leave')this.fail('O outro jogador saiu da partida. Encontre um novo adversário.');
  }
  startHost() {
    this.netplay=null;this.running=true;this.events=[];this.votes=[false,false];this.seq=0;this.engine.start(this.pair[0],'online',this.pair[1]);
    const startAt=this.now()+350;this.createNetplay(startAt);
    this.send({t:'start',matchId:this.matchId,startAt,state:snapshot(this.engine,++this.seq,[])});this.events=[];
    clearTimeout(this.connectTimer);this.lastReceived=this.now();this.onStart(this.pair,0);this.status('Partida online · Você é P1');
    // Release the public waiting seat so the next pair can find each other.
    if(this.kind==='quick')this.peer.disconnect();
  }
  setInput(slot,input) {
    if(!this.running)return;
    this.netplay?.input(input);
  }
  queue(slot,move,strength=1) {
    if(!this.running||!MOVES.has(move))return;
    this.netplay?.attack(move,strength);
  }
  createNetplay(startAt){
    this.lagRequested=false;this.netplay=new RollbackGame({engine:this.engine,slot:this.slot,now:this.now,startAt,
      send:frames=>{if(!this.send({t:'frames',matchId:this.matchId,frames}))this.pauseForLag('A conexão está congestionada. A partida foi pausada.');},
      onEvent:e=>this.engine.onEvent({...e,_netplay:true}),onCorrection:this.onCorrection,
      onLag:message=>this.pauseForLag(message)});
  }
  pauseForLag(message){if(!this.lagRequested){this.lagRequested=true;this.status(message);if(this.slot===0)this.changePause(true);else this.send({t:'pause',matchId:this.matchId,paused:true});}}
  event(e) { if(this.running&&this.netplay&&!e._netplay){this.netplay.event(e);return true;}return false; }
  tick() {
    if(!this.running)return;
    const now=this.now();
    if(now-this.lastReceived>12000)return this.fail('A conexão com o outro jogador foi perdida. Encontre um novo adversário.');
    if(now-this.lastPing>=1000){this.send({t:'ping',sent:now});this.lastPing=now;
      if(!this.votes[this.slot])this.status(`Partida online · Você é P${this.slot+1}${Number.isFinite(this.ping)?` · ${this.ping} ms`:''}${this.engine.paused?' · Pausada':''}`);
    }
  }
  advance(){this.netplay?.advance();}
  changePause(paused){
    if(!this.netplay||this.engine.paused===paused)return;
    const frame=Math.min(this.netplay.frame,this.netplay.lastRemote),startAt=this.now()+350;
    this.send({t:'paused',matchId:this.matchId,paused,frame,startAt});
    if(paused)this.netplay.pauseAt(frame);else this.netplay.resumeAt(startAt);
    this.lagRequested=false;this.engine.onEvent({type:'pause',paused,_netplay:true});
  }
  pause() { if(this.running){if(this.slot===0)this.changePause(!this.engine.paused);else this.send({t:'pause',matchId:this.matchId,paused:!this.engine.paused});} }
  rematch() {
    if(!this.running||this.engine.phase!=='result')return;this.votes[this.slot]=true;this.send({t:'rematch',matchId:this.matchId});
    this.status('Revanche solicitada. Aguardando o outro jogador…');if(this.slot===0&&this.votes.every(Boolean))this.startHost();
  }
  failedConnection(gen) {
    if(gen!==this.generation)return;
    if(this.kind==='quick'&&!this.running){
      this.status('Reorganizando a busca de adversário…');this.begin('quick',this.character);return;
    }
    this.fail('Não foi possível conectar à sala. Confira o código e mantenha as duas abas abertas. Se necessário, tente outra rede.');
  }
  message(error) { return error?.type==='unavailable-id'?'Esta sala já está ocupada. Crie outra sala.':error?.message||'Não foi possível conectar. Tente novamente.'; }
  fail(message) { this.close();this.status(message);this.onEnd?.(message); }
  close() {
    this.send({t:'leave',matchId:this.matchId});this.generation++;this.active=false;this.running=false;this.netplay=null;this.openReject?.();this.openReject=null;
    clearTimeout(this.connectTimer);this.conn?.close();this.peer?.destroy();this.conn=null;this.peer=null;
  }
}
