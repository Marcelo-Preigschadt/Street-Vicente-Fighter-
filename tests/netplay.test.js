import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,FIXED_STEP,CHARACTERS} from '../src/engine.js';
import {RollbackGame} from '../src/netplay.js';
import {snapshot} from '../src/net-state.js';

function simulation(pair,delay){
  let time=0;const wire=[],sent=[],lag=[],events=[[],[]],nets=[];
  for(let slot=0;slot<2;slot++){
    const e=new FightEngine({random:()=>.5,onEvent:event=>nets[slot]?.event(event)});e.start(pair[0],'online',pair[1]);
    e.phase='fight';e.fighters[0].x=450;e.fighters[1].x=590;e.fighters.forEach(f=>f.meter=100);
    nets.push(new RollbackGame({engine:e,slot,now:()=>time,startAt:0,onEvent:e=>events[slot].push(e),onLag:m=>lag.push(m),
      send:packets=>{sent.push(structuredClone(packets));wire.push({target:1-slot,due:time+delay(slot,packets[0].frame),packets:structuredClone(packets)});}}));
  }
  function deliver(){for(let i=wire.length-1;i>=0;i--)if(wire[i].due<=time){const p=wire.splice(i,1)[0];nets[p.target].receive(p.packets);}}
  return {nets,events,lag,sent,step(frame){time=frame*FIXED_STEP*1000+.001;deliver();for(const n of nets)n.advance();deliver();},
    drain(){for(const n of nets)if(n.pending.length)n.send(n.pending.splice(0));time+=2000;deliver();},
    state(slot){const state=snapshot(nets[slot].engine,1,[]);return JSON.parse(JSON.stringify(state));}};
}
test('comando local inicia no próximo frame mesmo com 300 ms de rede',()=>{
  const s=simulation(['marcos','marcelino'],()=>300);
  s.nets[1].attack('punch',1);s.step(1);
  assert.equal(s.nets[1].engine.fighters[1].action,'punch');
  assert.equal(s.nets[0].engine.fighters[1].action,null);
  for(let frame=2;frame<=80;frame++)s.step(frame);s.drain();
  assert.deepEqual(s.state(0),s.state(1));assert.equal(s.lag.length,0);
});
test('rollback converge com jitter, pacotes fora de ordem, defesas e ataques dos seis professores',()=>{
  const ids=Object.keys(CHARACTERS);
  for(let k=0;k<ids.length;k++){
    const s=simulation([ids[k],ids[(k+1)%ids.length]],(slot,f)=>20+((f*17+slot*59)%170));
    for(let f=1;f<=240;f++){
      for(let slot=0;slot<2;slot++){
        s.nets[slot].input({left:slot===1&&f<30,right:slot===0&&f<30,down:f%70>55,block:f%80>65});
        if(f%35===1)s.nets[slot].attack(f%105===1?'special':'punch',1);
        if(f===140)s.nets[slot].attack('uppercut',1);
      }s.step(f);
    }s.drain();assert.deepEqual(s.state(0),s.state(1),ids[k]);assert.equal(s.lag.length,0);assert.ok(s.nets.some(n=>n.rollbacks>0));
  }
});
test('supers simultâneos e enxame conservam barras, projéteis e vida sob atraso',()=>{
  const s=simulation(['marcelo','gelton'],(slot,f)=>slot?120:50);
  s.nets[0].attack('super',1);s.nets[1].attack('super',1);
  for(let f=1;f<=240;f++)s.step(f);s.drain();
  assert.deepEqual(s.state(0),s.state(1));assert.equal(s.nets[0].engine.fighters[0].meter,s.nets[1].engine.fighters[0].meter);
  assert.equal(s.nets[0].engine.drones.length,s.nets[1].engine.drones.length);
  for(const events of s.events)assert.equal(events.filter(e=>e.type==='superStart'&&e.fighter===0).length,1);
  const drones=simulation(['marcelo','rafael'],()=>90);
  for(const n of drones.nets)n.engine.fighters[1].x=1000;
  drones.nets[0].attack('super');for(let f=1;f<=180;f++)drones.step(f);drones.drain();
  assert.deepEqual(drones.state(0),drones.state(1));
  for(const events of drones.events)assert.equal(events.filter(e=>e.type==='droneDeploy').length,6);
});
test('histórico é limitado e pausa corta comandos pendentes antes da retomada',()=>{
  const s=simulation(['marcos','rafael'],()=>0);
  for(let f=1;f<=350;f++)s.step(f);
  assert.ok(s.nets.every(n=>n.history.size<=181));
  for(const n of s.nets){n.attack('super');n.pauseAt(348);assert.equal(n.attacks.length,0);assert.equal(n.frame,348);assert.ok(n.engine.paused);}
  s.drain();assert.deepEqual(s.state(0),s.state(1));
});

test('broadcast agrupa frames sem exceder limite do receptor ou saturar a sala',()=>{
  const s=simulation(['marcelo','rafael'],()=>180);
  for(let f=1;f<=240;f++)s.step(f);
  s.drain();
  assert.ok(s.sent.length<=110,`Broadcasts excessivos: ${s.sent.length}`);
  assert.ok(s.sent.every(batch=>batch.length>=1&&batch.length<=24));
  assert.deepEqual(s.state(0),s.state(1));assert.equal(s.lag.length,0);
});
