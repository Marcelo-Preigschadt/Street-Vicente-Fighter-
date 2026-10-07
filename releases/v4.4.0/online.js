import {STORY_HEROES} from './story-data.js';
import { PROTOCOL,MOVES,validCharacter,snapshot,applySnapshot } from './net-state.js';
import {RollbackGame} from './netplay.js';
import {RelayPeer} from './relay.js';

const QUEUE='street-vicente-fighter-440-waiting';
const PREFIX='street-vicente-fighter-440-room-';
export function loadPeer() { return Promise.resolve(RelayPeer); }
export function roomCode(random=crypto.getRandomValues(new Uint8Array(8))) {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(random,n=>alphabet[n%32]).join('');
}
export function normalizeCode(code) { return String(code).trim().toUpperCase().replace(/[\s-]/g,''); }
export class OnlineMatch {
  constructor({engine,prepare,onStart,onStatus,onEnd,onCorrection=()=>{},onLobby=()=>{},directory=null,PeerClass=null,now=()=>performance.now()}={}) {
    Object.assign(this,{engine,prepare,onStart,onStatus,onEnd,onCorrection,onLobby,directory,PeerClass,now});this.generation=0;this.active=false;this.running=false;this.slot=0;
  }
  validChoice(id){return validCharacter(id)&&(this.gameMode!=='story'||STORY_HEROES.includes(id));}
  status(text) { if(this.gameMode==='story')text=text.replaceAll('adversário','parceiro').replaceAll('Adversário','Parceiro').replace('Partida online','Resgate cooperativo online');this.onStatus?.(text); }
  async begin(kind,character,code='',retry=0,gameMode=this.gameMode??'versus') {
    this.close();this.gameMode=gameMode==='story'?'story':'versus';this.directory?.setMode?.(this.gameMode);const gen=this.generation;this.active=true;this.character=character;this.kind=kind;this.code='';this.retry=retry;this.events=[];this.seq=0;this.lastSeq=0;this.matchId=null;this.votes=[false,false];this.lobby=false;this.preparing=false;this.pair=null;this.confirmed=[false,false];this.choiceSerial=0;this.serials=[0,0];this.lobbyRevision=-1;
    if(!this.validChoice(character))return this.fail('Escolha um lutador.');
    code=normalizeCode(code);
    if(kind==='join'&&!/^[A-HJ-NP-Z2-9]{8}$/.test(code))return this.fail('Digite os 8 caracteres do código da sala.');
    try{
      this.status('Conectando ao modo online…');this.PeerClass??=await loadPeer();if(gen!==this.generation)return;
      if(kind==='quick'&&this.PeerClass.relay){
        if(!this.directory)throw new Error('A lista de salas não está disponível.');
        await this.directory.refresh();if(gen!==this.generation)return;
        const room=this.directory.rooms.find(r=>r.status==='waiting'&&(r.game_mode??'versus')===this.gameMode&&(!r.protocol||r.protocol===PROTOCOL));
        return this.begin(room?'join':'create',character,room?.code??'');
      }
      if(kind==='quick')await this.quick(gen);
      else if(kind==='create'){
        this.slot=0;this.code=roomCode();await this.openPeer(PREFIX+this.code,gen);if(gen!==this.generation)return;
        this.directory?.register(this.code,this.character,this.gameMode).catch(()=>{});
        this.status(`Sala ${this.code} criada. Aguardando outro jogador…`);
      }else{this.slot=1;this.code=code;await this.openPeer(undefined,gen);if(gen!==this.generation)return;this.status('Entrando na sala…');this.connect(PREFIX+code,gen);}
    }catch(error){if(gen===this.generation)this.fail(this.message(error));}
  }
  async quick(gen) {
    this.slot=0;
    try{await this.openPeer(QUEUE+'-'+this.gameMode,gen);if(gen!==this.generation)return;this.status('Procurando adversário… Deixe esta aba aberta.');}
    catch(error){
      if(gen!==this.generation)return;
      if(error.type!=='unavailable-id')throw error;
      this.slot=1;await this.openPeer(undefined,gen);if(gen!==this.generation)return;
      this.status('Jogador encontrado. Conectando a luta…');this.connect(QUEUE+'-'+this.gameMode,gen);
    }
  }
  openPeer(id,gen) {
    this.peer?.destroy();
    return new Promise((resolve,reject)=>{
      const p=new this.PeerClass(id,{secure:true,debug:1,config:this.ice});this.peer=p;
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
        if(gen!==this.generation||this.slot!==0||this.conn||conn.metadata?.protocol!==PROTOCOL||!this.validChoice(conn.metadata?.character)||(conn.metadata?.gameMode??'versus')!==this.gameMode){
          conn.on('open',()=>{conn.send({t:'busy'});setTimeout(()=>conn.close(),100);});return;
        }
        this.attach(conn,gen,true);
        this.status('Conectando o outro jogador…');
      });
    });
  }
  connect(id,gen) {
    const c=this.peer.connect(id,{reliable:true,serialization:'json',metadata:{protocol:PROTOCOL,character:this.character,gameMode:this.gameMode}});
    this.attach(c,gen,false);
  }
  attach(conn,gen,host) {
    this.conn=conn;this.connectedAt=this.now();this.lastReceived=this.now();this.lastSnapshot=0;this.lastPing=0;this.lastInput=-1000;this.lastInputKey='';this.lastRemoteInput=-1;this.inputSequence=0;
    this.connectTimer=setTimeout(()=>{if(gen===this.generation&&!this.running)this.failedConnection(gen);},35000);
    const pc=conn.peerConnection;
    pc?.addEventListener('iceconnectionstatechange',()=>console.info(`[online] ICE: ${pc.iceConnectionState}`));
    pc?.addEventListener('icecandidate',e=>{if(e.candidate)console.info(`[online] candidate: ${e.candidate.type}`);});
    pc?.addEventListener('icecandidateerror',e=>console.warn(`[online] ICE error ${e.errorCode}: ${e.errorText}`));
    conn.on('error',()=>{if(gen===this.generation)this.failedConnection(gen);});
    conn.on('close',()=>{if(gen===this.generation)this.fail('O outro jogador saiu da partida. Encontre um novo adversário.');});
    conn.on('data',data=>{if(gen===this.generation)this.receive(data,gen);});
    conn.on('open',()=>{
      if(gen!==this.generation){conn.close();return;}
      clearTimeout(this.connectTimer);
      if(host){
        this.pair=[this.character,conn.metadata.character];this.matchId=crypto.randomUUID();this.lobby=true;
        this.localReady=false;this.remoteReady=false;this.remoteSynced=false;this.publishLobby();
        if(this.kind==='create')this.directory?.update('playing',this.character).catch(()=>{});
      }
    });
  }
  notifyLobby() {
    if(!this.lobby||this.running)return;
    this.onLobby?.({pair:[...this.pair],confirmed:[...this.confirmed],slot:this.slot,loading:this.preparing});
    this.status(this.preparing?'Escolhas confirmadas. Carregando os lutadores…':this.confirmed[this.slot]?'Personagem confirmado. Aguardando a confirmação do adversário…':'Adversário conectado. Escolham e confirmem seus personagens.');
  }
  publishLobby() {
    this.lobbyRevision++;
    this.send({t:'lobby',protocol:PROTOCOL,gameMode:this.gameMode,matchId:this.matchId,pair:this.pair,confirmed:this.confirmed,serials:this.serials,revision:this.lobbyRevision,locked:this.preparing});
    this.notifyLobby();
    if(!this.preparing&&this.confirmed.every(Boolean)){
      this.preparing=true;this.localReady=false;this.remoteReady=false;this.remoteSynced=false;
      this.publishLobby();this.preparePair(this.generation);
    }
  }
  selectCharacter(character) {
    if(!this.active||this.running||this.preparing||this.confirmed?.[this.slot]||!this.validChoice(character))return false;
    this.character=character;
    if(this.kind==='create')this.directory?.update(this.conn?.open?'playing':'waiting',character).catch(()=>{});
    if(!this.lobby)return true;
    this.pair[this.slot]=character;this.confirmed[this.slot]=false;
    this.submitChoice();return true;
  }
  confirm() {
    if(!this.lobby||this.running||this.preparing)return false;
    this.confirmed[this.slot]=!this.confirmed[this.slot];this.submitChoice();return true;
  }
  submitChoice() {
    this.choiceSerial++;
    if(this.slot===0){this.serials[0]=this.choiceSerial;this.publishLobby();}
    else{this.send({t:'choice',matchId:this.matchId,character:this.character,confirmed:this.confirmed[1],serial:this.choiceSerial});this.notifyLobby();}
  }
  async preparePair(gen) {
    this.status('Escolhas confirmadas. Preparando os dois lutadores…');
    clearTimeout(this.connectTimer);this.connectTimer=setTimeout(()=>{if(gen===this.generation&&!this.running)this.fail('O carregamento dos personagens demorou. Entre na sala novamente.');},60000);
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
    if(m.t==='lobby'&&this.slot===1&&!this.running){
      if(m.protocol!==PROTOCOL||(m.gameMode??'versus')!==this.gameMode||typeof m.matchId!=='string'||!Array.isArray(m.pair)||m.pair.length!==2||!m.pair.every(id=>this.validChoice(id))||
        !Array.isArray(m.confirmed)||m.confirmed.length!==2||!m.confirmed.every(x=>typeof x==='boolean')||
        !Array.isArray(m.serials)||m.serials.length!==2||!m.serials.every(x=>Number.isSafeInteger(x)&&x>=0)||
        !Number.isSafeInteger(m.revision)||typeof m.locked!=='boolean')return this.fail('As versões do jogo são diferentes. Atualize a página.');
      if(this.matchId&&m.matchId!==this.matchId)return;
      if(m.revision<=this.lobbyRevision)return;
      const first=!this.matchId,desired=this.character;
      this.matchId=m.matchId;this.lobbyRevision=m.revision;this.lobby=true;this.pair=[...m.pair];this.serials=[...m.serials];
      const ownConfirmed=this.confirmed[1];this.confirmed=[...m.confirmed];
      if(m.serials[1]>=this.choiceSerial||m.locked)this.character=m.pair[1];
      else{this.pair[1]=this.character;this.confirmed[1]=ownConfirmed;}
      if(first&&desired!==m.pair[1]){this.selectCharacter(desired);return;}
      if(m.locked&&!this.preparing){
        if(!m.confirmed.every(Boolean))return this.fail('Confirmação de jogadores inválida.');
        this.preparing=true;this.localReady=false;this.notifyLobby();this.preparePair(gen);
      }else this.notifyLobby();
      return;
    }
    if(m.matchId!==this.matchId||!this.matchId)return;
    if(m.t==='choice'&&this.slot===0&&this.lobby&&!this.running&&!this.preparing){
      if(!this.validChoice(m.character)||typeof m.confirmed!=='boolean'||!Number.isSafeInteger(m.serial)||m.serial<=this.serials[1])return;
      this.serials[1]=m.serial;this.pair[1]=m.character;this.confirmed[1]=m.confirmed;this.publishLobby();return;
    }
    if(m.t==='ready'&&this.slot===0&&this.preparing&&Number.isFinite(m.clientTime)){
      this.remoteReady=true;this.send({t:'sync',matchId:this.matchId,clientTime:m.clientTime,hostTime:this.now()});return;
    }
    if(m.t==='sync'&&this.slot===1&&Number.isFinite(m.clientTime)&&Number.isFinite(m.hostTime)){
      this.ping=Math.max(0,this.now()-m.clientTime);this.clockOffset=m.hostTime-(this.now()+m.clientTime)/2;
      this.send({t:'synced',matchId:this.matchId});return;
    }
    if(m.t==='synced'&&this.slot===0&&this.preparing){this.remoteSynced=true;if(this.localReady&&!this.running)this.startHost();return;}
    if(m.t==='start'&&this.slot===1&&(!this.running||this.engine.phase==='result')&&this.preparing&&this.confirmed.every(Boolean)&&this.localReady&&Number.isFinite(m.startAt)){
      this.netplay=null;this.lastSeq=0;this.running=true;this.votes=[false,false];this.engine.start(this.pair[0],this.gameMode==='story'?'story-online':'online',this.pair[1]);
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
    if(this.running&&this.engine.phase!=='result')return;
    if(!this.preparing||!this.confirmed.every(Boolean)||!this.localReady||!this.remoteReady||!this.remoteSynced)return;
    this.netplay=null;this.running=true;this.events=[];this.votes=[false,false];this.seq=0;this.engine.start(this.pair[0],this.gameMode==='story'?'story-online':'online',this.pair[1]);
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
    if(!this.active||!this.conn?.open)return;
    const now=this.now();
    if(now-this.lastReceived>12000)return this.fail('A conexão com o outro jogador foi perdida. Encontre um novo adversário.');
    if(now-this.lastPing>=1000){this.send({t:'ping',sent:now});this.lastPing=now;
      if(this.running&&!this.votes[this.slot])this.status(`Partida online · Você é P${this.slot+1}${Number.isFinite(this.ping)?` · ${this.ping} ms`:''}${this.engine.paused?' · Pausada':''}`);
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
    if(this.kind==='quick'&&!this.running&&this.retry<2){
      this.status('Reorganizando a busca de adversário…');this.begin('quick',this.character,'',this.retry+1);return;
    }
    this.fail('Não foi possível conectar à sala. Confira o código e mantenha as duas abas abertas. Se necessário, tente outra rede.');
  }
  message(error) { return error?.type==='unavailable-id'?'Esta sala já está ocupada. Crie outra sala.':error?.message||'Não foi possível conectar. Tente novamente.'; }
  fail(message) { this.close();this.status(message);this.onEnd?.(message); }
  close() {
    this.directory?.remove().catch(()=>{});
    this.send({t:'leave',matchId:this.matchId});this.generation++;this.active=false;this.running=false;this.lobby=false;this.preparing=false;this.pair=null;this.confirmed=[false,false];this.netplay=null;this.openReject?.();this.openReject=null;
    clearTimeout(this.connectTimer);this.conn?.close();this.peer?.destroy();this.conn=null;this.peer=null;
  }
}
