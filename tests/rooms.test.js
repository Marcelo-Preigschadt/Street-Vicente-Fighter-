import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomDirectory,roomLabel} from '../src/rooms.js';
test('registro lento seguido de saída remove a sala depois da criação, sem publicar o segredo',async()=>{
  let release;const calls=[],directory=new RoomDirectory({fetcher:async(url,options)=>{
    calls.push({url,...options});if(options.method==='POST')await new Promise(resolve=>{release=resolve;});
    return {ok:true,status:options.method==='GET'?200:204,json:async()=>[]};
  }});
  const registered=directory.register('ABCDEFGH','marcelo');
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  const removed=directory.remove();release();await registered;await removed;
  assert.deepEqual(calls.map(x=>x.method),['POST','GET','DELETE','GET']);
  const body=JSON.parse(calls[0].body);assert.match(body.owner_hash,/^[a-f0-9]{64}$/);assert.equal(body.token,undefined);
  assert.equal(calls[0].headers['x-room-token'],calls[2].headers['x-room-token']);
  assert.equal(directory.owner,null);
});
test('erros não interrompem a fila de encerramento nem são apresentados como lista vazia',async()=>{
  const errors=[];let fail=true;const directory=new RoomDirectory({onError:e=>errors.push(e),fetcher:async(url,options)=>{
    if(options.method==='POST'&&fail){fail=false;return {ok:false,status:503};}
    return {ok:true,status:204,json:async()=>[]};
  }});
  await assert.rejects(directory.register('ABCDEFGH','marcelo'));await directory.remove();
  assert.equal(errors.length,1);assert.equal(directory.owner,null);
  assert.equal(roomLabel('waiting'),'Aguardando jogador');assert.equal(roomLabel('playing'),'Jogando');
});

test('fetch padrão conserva o contexto Window exigido pelo navegador',async t=>{
  const original=globalThis.fetch;let called=false;
  globalThis.fetch=function(){assert.equal(this,globalThis);called=true;return Promise.resolve({ok:true,status:200,json:async()=>[]});};
  t.after(()=>{globalThis.fetch=original;});
  const directory=new RoomDirectory();await directory.refresh();assert.equal(called,true);assert.deepEqual(directory.rooms,[]);
});
