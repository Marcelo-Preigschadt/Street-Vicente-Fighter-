// Integration smoke test against the existing public relay. Removes only its own temporary room.
import assert from 'node:assert/strict';
import {OnlineMatch} from '../src/online.js';
import {StoryEngine} from '../src/story.js';
import {RoomDirectory} from '../src/rooms.js';
import {snapshot} from '../src/net-state.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const until=async predicate=>{const end=Date.now()+15000;while(!predicate()){if(Date.now()>end)throw new Error('Timed out');await delay(25);}};
let clock=0;const dirs=[new RoomDirectory({onError:message=>console.log('Directory:',message)}),new RoomDirectory({onError:message=>console.log('Directory:',message)})];dirs.forEach(d=>d.gameMode='story');
const clients=dirs.map(directory=>{let net;const engine=new StoryEngine({onEvent:event=>net?.event(event)});net=new OnlineMatch({engine,directory,now:()=>clock,prepare:async()=>{},onStart:()=>{},onEnd:()=>{},onStatus:()=>{}});return net;});
const [host,guest]=clients;
try{
 await host.begin('create','ruan','',0,'story');await until(()=>!!dirs[0].owner);await dirs[0].queue;await dirs[1].refresh();assert.ok(dirs[1].rooms.some(r=>r.code===host.code&&r.status==='waiting'));console.log('Room visible: waiting, Ruan selectable');
 await guest.begin('join','joao',host.code,0,'story');await until(()=>clients.every(c=>c.lobby));host.confirm();guest.confirm();await until(()=>clients.every(c=>c.running));assert.deepEqual(host.pair,['ruan','joao']);
 for(let i=0;i<270;i++){clock+=1000/120;if(i===50)guest.queue(1,'storyNext');host.setInput(0,{right:i>70,up:i>90&&i<140});guest.setInput(1,{right:i>70,down:i<120});if(i===210)host.queue(0,'special',2);clients.forEach(c=>c.advance());if(i%3===0)await delay(10);}
 await delay(500);assert.equal(host.engine.phase,'fight');assert.equal(host.engine.story.wave,1);assert.deepEqual(snapshot(host.engine,1),snapshot(guest.engine,1));await dirs[0].queue;await dirs[1].refresh();assert.ok(dirs[1].rooms.some(r=>r.code===host.code&&r.status==='playing'));
 console.log('Two peers agree: phase, wave, depth, projectiles and enemies; room playing');
 console.log('Rollback corrections:',clients.map(c=>c.netplay.rollbacks));
}finally{clients.forEach(c=>c.close());await Promise.all(dirs.map(d=>d.queue));console.log('Temporary room removed');}
