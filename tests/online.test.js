import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {FightEngine,FIXED_STEP,Fighter} from '../src/engine.js';
import {OnlineMatch,normalizeCode,roomCode} from '../src/online.js';
import {snapshot,applySnapshot,sanitizeInput} from '../src/net-state.js';

function fakePeers(){
  const registry=new Map();let next=1;
  class Connection extends EventEmitter{
    constructor(peer,metadata){super();this.peer=peer;this.metadata=metadata;this.open=false;this.dataChannel={bufferedAmount:0};}
    send(data){const copy=JSON.parse(JSON.stringify(data));queueMicrotask(()=>{if(this.other.open)this.other.emit('data',copy);});}
    close(){if(!this.open)return;this.open=false;this.other.open=false;queueMicrotask(()=>{this.emit('close');this.other.emit('close');});}
  }
  return class Peer extends EventEmitter{
    constructor(id){super();this.id=id??`test-${next++}`;this.connections=[];queueMicrotask(()=>{
      if(this.destroyed)return;
      if(registry.has(this.id)){this.emit('error',{type:'unavailable-id'});return;}
      registry.set(this.id,this);this.emit('open',this.id);
    });}
    connect(id,{metadata}){
      const a=new Connection(id,metadata);this.connections.push(a);
      queueMicrotask(()=>{
        const target=registry.get(id);if(!target){this.emit('error',{type:'peer-unavailable'});return;}
        const b=new Connection(this.id,metadata);a.other=b;b.other=a;target.connections.push(b);target.emit('connection',b);
        queueMicrotask(()=>{a.open=b.open=true;b.emit('open');a.emit('open');});
      });return a;
    }
    disconnect(){if(registry.get(this.id)===this)registry.delete(this.id);}
    destroy(){this.destroyed=true;this.disconnect();for(const c of this.connections)c.close();}
  };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function clients(PeerClass){
  let clock=0;
  const out=Array.from({length:2},()=>{
    const events=[],statuses=[],engine=new FightEngine({onEvent:e=>{events.push(e);net.event(e);}});
    const net=new OnlineMatch({engine,PeerClass,now:()=>clock,prepare:async()=>{},onStart:()=>{},onStatus:s=>statuses.push(s),onEnd:()=>{}});
    return {engine,net,events,statuses};
  });out.step=async(seconds)=>{
    for(let i=0;i<Math.ceil(seconds/FIXED_STEP);i++){
      clock+=FIXED_STEP*1000;
      for(const c of out){c.net.advance();c.net.tick();}await flush();
    }
  };return out;
}
test('salas normalizam códigos e snapshots mantêm os protótipos de Fighter',()=>{
  assert.equal(normalizeCode(' ab23-cd45 '),'AB23CD45');assert.match(roomCode(new Uint8Array(8)),/^[A-HJ-NP-Z2-9]{8}$/);
  const a=new FightEngine(),b=new FightEngine();a.start('marcos','online','marcos');b.start('marcos','online','marcos');
  const packet=JSON.parse(JSON.stringify(snapshot(a,1,[])));assert.ok(applySnapshot(b,packet));
  assert.ok(b.fighters.every(f=>f instanceof Fighter));assert.equal(b.fighters[0].character.id,'marcos');
  assert.equal(applySnapshot(b,packet,1),false);
  packet.seq=2;packet.fighters[0].hp=Infinity;assert.equal(applySnapshot(b,packet,1),false);
  assert.deepEqual(sanitizeInput({left:true,right:'true',admin:true}),{left:true,right:false,jump:false,down:false,block:false});
});
test('dois clientes independentes entram por código e compartilham golpes, vida e eventos',async t=>{
  const cs=clients(fakePeers()),[host,guest]=cs;t.after(()=>cs.forEach(c=>c.net.close()));
  await host.net.begin('create','marcos');await guest.net.begin('join','marcelino',host.net.code);await flush();await flush();
  assert.ok(host.net.running&&guest.net.running);assert.equal(host.net.slot,0);assert.equal(guest.net.slot,1);
  await cs.step(2.85);assert.equal(guest.engine.phase,'fight');
  for(const c of cs){c.engine.fighters[0].x=450;c.engine.fighters[1].x=570;}
  guest.net.setInput(1,{down:true});await cs.step(.05);assert.equal(host.engine.fighters[1].input.down,true);
  guest.net.setInput(1,{});host.net.queue(0,'punch',1);await cs.step(.8);
  assert.ok(host.engine.fighters[1].hp<1000);assert.equal(guest.engine.fighters[1].hp,host.engine.fighters[1].hp);
  assert.ok(guest.events.some(e=>e.type==='hit'));
  const before=host.engine.fighters[0].hp;
  for(const c of cs){c.engine.fighters[0].x=450;c.engine.fighters[1].x=580;}
  guest.net.queue(1,'punch',2);await flush();await cs.step(.7);
  assert.ok(host.engine.fighters[0].hp<before);assert.equal(guest.engine.fighters[0].hp,host.engine.fighters[0].hp);
  assert.equal(guest.engine.fighters[1].character.id,'marcelino');
});
test('busca pública reúne dois jogadores e libera a fila para a próxima dupla',async t=>{
  const Peer=fakePeers(),a=clients(Peer),b=clients(Peer);t.after(()=>[...a,...b].forEach(c=>c.net.close()));
  await a[0].net.begin('quick','gelton');await a[1].net.begin('quick','gelton');await flush();await flush();
  assert.ok(a.every(c=>c.net.running));assert.equal(a[0].engine.fighters[0].character.id,a[0].engine.fighters[1].character.id);
  await b[0].net.begin('quick','marcelo');await b[1].net.begin('quick','rafael');await flush();await flush();
  assert.ok(b.every(c=>c.net.running));assert.notEqual(a[0].net.matchId,b[0].net.matchId);
});
test('pausa é compartilhada, revanche exige os dois e desconexão encerra a sessão',async t=>{
  const cs=clients(fakePeers()),[a,b]=cs;t.after(()=>cs.forEach(c=>c.net.close()));
  await a.net.begin('create','marcos');await b.net.begin('join','rafael',a.net.code);await flush();await flush();
  b.net.pause();await flush();await cs.step(.1);assert.ok(a.engine.paused&&b.engine.paused);
  a.net.pause();await cs.step(.1);assert.equal(b.engine.paused,false);
  for(const c of cs)c.engine.phase='result';await cs.step(.1);assert.equal(b.engine.phase,'result');
  b.net.rematch();await flush();assert.equal(a.engine.phase,'result');a.net.rematch();await flush();await flush();
  assert.equal(a.engine.phase,'intro');assert.equal(b.engine.phase,'intro');assert.equal(a.engine.fighters[0].hp,1000);
  b.net.close();await flush();assert.equal(a.net.active,false);assert.ok(a.statuses.some(s=>s.includes('saiu')));
});
test('pacotes duplicados e golpes inválidos não alteram os comandos já confirmados',async t=>{
  const cs=clients(fakePeers()),[a,b]=cs;t.after(()=>cs.forEach(c=>c.net.close()));
  await a.net.begin('create','marcos');await b.net.begin('join','rafael',a.net.code);await flush();await flush();await cs.step(2.85);
  const frame=a.net.netplay.lastRemote,original=a.net.netplay.remote.get(frame);
  b.net.send({t:'frames',matchId:a.net.matchId,frames:[{frame,input:{right:true},attacks:[]}]});await flush();
  assert.deepEqual(a.net.netplay.remote.get(frame),original);
  const next=frame+1;
  b.net.send({t:'frames',matchId:a.net.matchId,frames:[{frame:next,input:{},attacks:[{move:'roubarVida',strength:1}]}]});await flush();
  assert.equal(a.net.netplay.remote.has(next),false);
  b.net.send({t:'frames',matchId:'outra-sala',frames:[{frame:next,input:{right:true},attacks:[]}]});await flush();
  assert.equal(a.net.netplay.remote.has(next),false);
});
