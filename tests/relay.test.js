import test from 'node:test';
import assert from 'node:assert/strict';
import {RelayPeer} from '../src/relay.js';
import {OnlineMatch} from '../src/online.js';
import {FightEngine} from '../src/engine.js';
function sockets(){
 const all=new Set();
 return class Socket extends EventTarget {
  constructor(){super();this.readyState=0;this.bufferedAmount=0;all.add(this);queueMicrotask(()=>{this.readyState=1;this.dispatchEvent(new Event('open'));});}
  message(data){queueMicrotask(()=>{if(this.readyState===1)this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)}));});}
  send(raw){const m=JSON.parse(raw);if(m.event==='phx_join'){this.topic=m.topic;this.message({...m,event:'phx_reply',payload:{status:'ok'}});}else if(m.event==='broadcast')for(const s of all)if(s!==this&&s.topic===m.topic)s.message(m);}
  close(){this.readyState=3;all.delete(this);this.dispatchEvent(new Event('close'));}
 };
}
const flush=()=>new Promise(r=>setImmediate(r));
test('relay sincroniza personagens, confirmação, início e saída sem WebRTC',async t=>{
 const Socket=sockets();class Peer extends RelayPeer{constructor(id){super(id,{WebSocketClass:Socket});}}
 const pair=Array.from({length:2},()=>new OnlineMatch({PeerClass:Peer,engine:new FightEngine(),prepare:async()=>{},onStart:()=>{},onEnd:()=>{}}));
 t.after(()=>pair.forEach(p=>p.close()));const [a,b]=pair;
 await a.begin('create','marcelo');await b.begin('join','rafael',a.code);await flush();await flush();
 assert.equal(a.lobby,true);assert.equal(b.lobby,true);assert.deepEqual(b.pair,['marcelo','rafael']);
 b.selectCharacter('marcos');await flush();assert.deepEqual(a.pair,['marcelo','marcos']);
 a.confirm();await flush();assert.deepEqual(b.confirmed,[true,false]);assert.equal(a.running,false);
 b.confirm();await flush();await flush();assert.equal(a.running,true);assert.equal(b.running,true);
 b.close();await flush();assert.equal(a.active,false);
});
test('relay mantém a primeira dupla quando uma terceira pessoa tenta entrar',async t=>{
 const Socket=sockets();class Peer extends RelayPeer{constructor(id){super(id,{WebSocketClass:Socket});}}
 const host=new Peer('room'),guest=new Peer(),third=new Peer();t.after(()=>[host,guest,third].forEach(p=>p.destroy()));
 let first,extra;host.on('connection',c=>{if(first){extra=c;c.on('open',()=>c.send('busy'));}else{first=c;c.on('data',d=>c.send(d));}});
 await flush();const a=guest.connect('room',{metadata:{}});await flush();const b=third.connect('room',{metadata:{}});let busy;b.on('data',d=>busy=d);await flush();assert.equal(busy,'busy');extra.close();await flush();assert.equal(a.open,true);
 let echoed;a.on('data',d=>echoed=d);a.send('playing');await flush();assert.equal(echoed,'playing');
});
