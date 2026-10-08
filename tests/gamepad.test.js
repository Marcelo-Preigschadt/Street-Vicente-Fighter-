import test from 'node:test';
import assert from 'node:assert/strict';
import {GamepadMappings,GamepadPresence,connectedPads,directions,readController,PAD_DEFAULT} from '../src/gamepad.js';
const pad=(id='USB Gamepad',axes=[0,0],n=16)=>({id,mapping:'',connected:true,axes,buttons:Array.from({length:n},()=>({pressed:false,value:0}))});
test('API tolera ausência, índices vazios e dispositivos desconectados',()=>{
 const p=pad();assert.deepEqual(connectedPads({getGamepads:()=>[null,p,undefined,{...p,connected:false}]}),[p]);
 assert.deepEqual(connectedPads({}),[]);assert.deepEqual(connectedPads({getGamepads:()=>{throw Error('blocked')}}),[]);
});
test('XInput usa botões padrão e D-pad digital',()=>{
 const p=pad('Xbox',[0,0]);p.mapping='standard';p.buttons[2].pressed=true;p.buttons[15].pressed=true;
 const s=readController(p);assert.equal(s.right,true);assert.equal(s.buttons.punch,true);assert.equal(s.buttons.jump,false);
});
test('controle USB genérico usa eixos 6/7 do direcional',()=>{
 const p=pad('Generic USB joystick',[0,0,0,0,0,0,-1,1],12);
 assert.deepEqual(directions(p),{left:true,right:false,up:false,down:true});
});
test('mapeamento persiste por dispositivo sem alterar outro controle',()=>{
 const mem=new Map(),storage={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)};
 const a=pad('USB JOYSTICK',[0,0],12),b=pad('XBOX',[0,0],16);
 const m=new GamepadMappings(storage);assert.equal(m.bind(a,'punch',7),true);assert.equal(m.bind(a,'punch',55),false);
 assert.equal(new GamepadMappings(storage).for(a).punch,7);assert.equal(new GamepadMappings(storage).for(b).punch,PAD_DEFAULT.punch);
 m.reset(a);assert.equal(new GamepadMappings(storage).for(a).punch,PAD_DEFAULT.punch);
});
test('botão remapeado funciona em um dispositivo USB de dez botões',()=>{
 const p=pad('USB',[0,0],10);p.buttons[5].pressed=true;const m={...PAD_DEFAULT,jump:5};
 assert.equal(readController(p,m).buttons.jump,true);assert.equal(readController(p,m).confirm,true);
});

test('leitura vazia momentânea mantém conexão visual sem manter comandos pressionados',()=>{
  let tick=0;const monitor=new GamepadPresence({now:()=>tick,lossGraceMs:1500});
  const p=pad('USB instável');p.index=0;
  let current=monitor.update([p]);assert.equal(current.length,1);assert.equal(current[0].live,true);
  tick=50;current=monitor.update([]);assert.equal(current.length,1);assert.equal(current[0].live,false);
  tick=600;current=monitor.update([p]);assert.equal(current.length,1);assert.equal(current[0].live,true);
  tick=700;monitor.update([]);tick=2300;assert.equal(monitor.update([]).length,0);
});
test('queda temporária de P1 não desloca P2 para a primeira posição',()=>{
  let tick=0;const monitor=new GamepadPresence({now:()=>tick,lossGraceMs:1500});
  const a=pad('A'),b=pad('B');a.index=0;b.index=1;
  monitor.update([a,b]);tick=10;
  const slots=monitor.update([b]);assert.equal(slots.length,2);
  assert.equal(slots[0].live,false);assert.equal(slots[1].live,true);
  assert.equal(slots[1].pad.id,'B');
});
