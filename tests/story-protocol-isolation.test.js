import test from 'node:test';
import assert from 'node:assert/strict';
import {PROTOCOL,STORY_PROTOCOL} from '../src/net-state.js';
import {OnlineMatch} from '../src/online.js';
import {RoomDirectory} from '../src/rooms.js';

test('salas e handshake isolam as novas silhuetas de combate dos clientes anteriores',async()=>{
 assert.equal(PROTOCOL,'svf-online-4-9-0');assert.equal(STORY_PROTOCOL,'svf-story-4-9-0');
 const wire=new OnlineMatch();wire.gameMode='versus';assert.equal(wire.protocol,'svf-online-4-9-0');
 wire.gameMode='story';assert.equal(wire.protocol,STORY_PROTOCOL);assert.notEqual(wire.protocol,PROTOCOL);
 const calls=[],d=new RoomDirectory({fetcher:async(url,options)=>{calls.push({url,...options});return {ok:true,status:options.method==='GET'?200:204,json:async()=>[]};}});
 await d.register('ABCDEFGH','marcelo','versus');
 assert.equal(JSON.parse(calls.find(v=>v.method==='POST').body).protocol,'svf-online-4-9-0');
 assert.ok(calls.some(v=>v.url.includes('protocol=eq.svf-online-4-9-0')));await d.remove();
 calls.length=0;d.gameMode='story';await d.register('ABCDEFGH','marcelo','story');
 assert.equal(JSON.parse(calls.find(v=>v.method==='POST').body).protocol,STORY_PROTOCOL);
 assert.ok(calls.some(v=>v.url.includes('protocol=eq.'+STORY_PROTOCOL)));await d.remove();
});
