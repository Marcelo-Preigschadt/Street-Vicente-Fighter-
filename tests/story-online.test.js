import test from 'node:test';
import assert from 'node:assert/strict';
import {RelayPeer} from '../src/relay.js';
import {OnlineMatch} from '../src/online.js';
import {StoryEngine} from '../src/story.js';
import {snapshot,PROTOCOL} from '../src/net-state.js';
import {RoomDirectory} from '../src/rooms.js';
const flush=()=>new Promise(r=>setImmediate(r));
function sockets(){const all=new Set();return class Socket extends EventTarget {
 constructor(){super();this.readyState=0;this.bufferedAmount=0;all.add(this);queueMicrotask(()=>{this.readyState=1;this.dispatchEvent(new Event('open'));});}
 message(data){queueMicrotask(()=>{if(this.readyState===1)this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)}));});}
 send(raw){const m=JSON.parse(raw);if(m.event==='phx_join'){this.topic=m.topic;this.message({...m,event:'phx_reply',payload:{status:'ok'}});}else if(m.event==='broadcast')for(const s of all)if(s!==this&&s.topic===m.topic)s.message(m);}
 close(){this.readyState=3;all.delete(this);this.dispatchEvent(new Event('close'));}
};}
function clients(){const Socket=sockets();class Peer extends RelayPeer{constructor(id){super(id,{WebSocketClass:Socket});}}let clock=0;const cs=Array.from({length:2},()=>{
 let net;const engine=new StoryEngine({onEvent:e=>net?.event(e)});net=new OnlineMatch({PeerClass:Peer,engine,now:()=>clock,prepare:async()=>{},onStart:()=>{},onEnd:()=>{}});return net;
});cs.step=async(n)=>{for(let i=0;i<n;i++){clock+=1000/120;cs.forEach(c=>c.advance());await flush();}};return cs;}

test('relay cooperativo confirma professores e compartilha diálogos, ondas, golpes, pausa e nova tentativa',async t=>{
 const cs=clients(),[host,guest]=cs;t.after(()=>cs.forEach(c=>c.close()));
 await host.begin('create','marcelo','',0,'story');await guest.begin('join','gustavo',host.code,0,'story');await flush();await flush();
 assert.deepEqual(guest.pair,['marcelo','gustavo']);assert.equal(host.lobby,true);host.confirm();guest.confirm();await flush();await flush();
 assert.ok(cs.every(c=>c.running&&c.engine.storyActive));assert.equal(host.engine.phase,'storyDialog');guest.queue(1,'storyNext');await cs.step(55);assert.ok(cs.every(c=>c.engine.phase==='fight'));
 host.setInput(0,{right:true});guest.setInput(1,{right:true});await cs.step(190);host.setInput(0,{});guest.setInput(1,{});host.queue(0,'special',2);guest.queue(1,'special',2);await cs.step(170);
 assert.equal(host.engine.story.wave,1);assert.deepEqual(snapshot(host.engine,1),snapshot(guest.engine,1));
 guest.pause();await flush();assert.ok(cs.every(c=>c.engine.paused));host.pause();await flush();assert.ok(cs.every(c=>!c.engine.paused));await cs.step(55);
 for(const c of cs){c.engine.freeze=0;c.engine.fighters.forEach(f=>f.hp=0);c.engine.update(1/120);}assert.equal(host.engine.phase,'result');guest.queue(1,'storyRetry');await cs.step(12);assert.equal(host.engine.phase,'storyDialog');assert.deepEqual(host.engine.exportStoryState(),guest.engine.exportStoryState());
});
test('sala história não aceita jogadores do versus e aceita alunos na equipe',async t=>{
 const cs=clients(),[host,guest]=cs;t.after(()=>cs.forEach(c=>c.close()));await host.begin('create','marcelo','',0,'story');assert.equal(host.selectCharacter('ruan'),true);
 await guest.begin('join','rafael',host.code,0,'versus');await flush();await flush();assert.equal(host.lobby,false);assert.equal(guest.running,false);assert.equal(host.active,true);
});
test('diretório registra modo e protocolo sem segredo e uma resposta antiga não repõe salas do outro modo',async()=>{
 let finish;const calls=[];const d=new RoomDirectory({fetcher:async(url,options)=>{calls.push({url,...options});if(options.method==='GET'&&url.includes('game_mode=eq.versus'))await new Promise(r=>finish=r);return {ok:true,status:options.method==='GET'?200:204,json:async()=>[{code:'ABCDEFGH',game_mode:url.includes('eq.story')?'story':'versus'}]};}});
 const old=d.refresh();d.setMode('story');finish();await old;assert.equal(d.rooms[0].game_mode,'story');await d.register('HGFEDCBA','rafael');const body=JSON.parse(calls.find(c=>c.method==='POST').body);assert.equal(body.game_mode,'story');assert.equal(body.protocol,PROTOCOL);assert.equal(body.token,undefined);assert.match(body.owner_hash,/^[a-f0-9]{64}$/);await d.remove();
});
