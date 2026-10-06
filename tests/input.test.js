import test from 'node:test';
import assert from 'node:assert/strict';
import { Inputs } from '../src/input.js';
import { FightEngine, FIXED_STEP } from '../src/engine.js';
const advance = (g,s) => {for(let i=0;i<Math.ceil(s/FIXED_STEP);i++)g.update(FIXED_STEP);};
function prepare(t) {
  const events=[],game=new FightEngine({onEvent:e=>events.push(e)});game.start('marcelo','local');game.phase='fight';game.fighters[1].x=1000;
  const old={window:globalThis.window,document:globalThis.document,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
  globalThis.window=new EventTarget();
  const buttons=['down','kick','special','punch','custom','guardCounter','block','drone'].map(action=>{const b=new EventTarget();b.dataset={action};b.pressed=false;b.setPointerCapture=()=>{};b.classList={add:()=>{b.pressed=true;},remove:()=>{b.pressed=false;}};return b;});
  globalThis.document={querySelectorAll:q=>q==='[data-action]'?buttons:buttons.filter(b=>b.pressed)};
  const pad={axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};let connected=false,connectedPads=[pad];
  Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>connected?connectedPads:[]},configurable:true});
  t.after(()=>{for(const key of ['window','document'])if(old[key]===undefined)delete globalThis[key];else globalThis[key]=old[key];if(old.navigator)Object.defineProperty(globalThis,'navigator',old.navigator);else delete globalThis.navigator;});
  const input=new Inputs(game);
  const emit=(target,type,props)=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
  return {game,events,input,buttons,pad,connect:(pads=[pad])=>{connected=true;connectedPads=pads;},key:(code,type='keydown',repeat=false)=>emit(window,type,{code,repeat}),pointer:(action,type,id)=>emit(buttons.find(b=>b.dataset.action===action),type,{pointerId:id})};
}
test('teclado captura baixo antes do chute e não perde a rasteira',t=>{const s=prepare(t);s.key('KeyS');s.key('KeyG');advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');});
test('comando direcional do teclado dispara poder sem depender de um frame entre teclas',t=>{const s=prepare(t);s.key('KeyS');s.key('KeyD');s.key('KeyS','keyup');s.key('KeyF');advance(s.game,.03);assert.equal(s.game.fighters[0].action,'special');});
test('os seis botões escolhem força e segurar a tecla não repete ataques',t=>{const s=prepare(t);s.key('KeyY');advance(s.game,.03);assert.equal(s.game.fighters[0].moveData.strength,2);s.key('KeyY','keydown',true);advance(s.game,1);assert.equal(s.events.filter(e=>e.type==='swing').length,1);});
test('toque permite agachar e chutar simultaneamente com dedos distintos',t=>{const s=prepare(t);s.pointer('down','pointerdown',1);s.pointer('kick','pointerdown',2);advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');s.pointer('kick','pointerup',2);assert.equal(s.game.fighters[0].input.down,true);s.pointer('down','pointerup',1);assert.equal(s.game.fighters[0].input.down,false);});
test('gamepad aplica direcional antes da borda do botão de ataque',t=>{const s=prepare(t);s.connect();s.pad.axes[1]=.8;s.pad.buttons[1].pressed=true;s.input.update();advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');});

test('enxame de Marcelo entra por Z, I, toque e L3, com barra completa sem substituir os botões de defesa',t=>{
 const s=prepare(t);s.game.fighters[0].meter=100;s.key('KeyZ');advance(s.game,.03);assert.equal(s.game.fighters[0].action,'super');s.key('KeyZ','keyup');
 s.game.start('gustavo','local','marcelo');s.game.phase='fight';s.game.fighters[1].meter=100;s.key('KeyI');advance(s.game,.03);assert.equal(s.game.fighters[1].action,'super');s.key('KeyI','keyup');
 s.game.start('marcelo','local','gustavo');s.game.phase='fight';s.game.fighters[0].meter=100;s.pointer('drone','pointerdown',4);advance(s.game,.03);assert.equal(s.game.fighters[0].action,'super');s.pointer('drone','pointerup',4);
 s.game.clearAction(s.game.fighters[0]);s.game.fighters[0].meter=100;s.game.freeze=0;s.connect();s.pad.buttons[10].pressed=true;s.input.update();advance(s.game,.03);assert.equal(s.game.fighters[0].action,'super');
 s.key('KeyR');assert.equal(s.game.fighters[0].input.block,true);s.key('KeyO');assert.equal(s.game.fighters[1].input.block,true);
});
test('meia-lua para trás espelhada aciona o enxame com barra completa nos dois lados',t=>{
 const s=prepare(t);
 for(const slot of [0,1]){
  s.game.start(slot===0?'marcelo':'gustavo','local',slot===0?'gustavo':'marcelo');s.game.phase='fight';s.input.release();s.game.fighters[slot].meter=100;
  const [down,back,punch]=slot===0?['KeyS','KeyA','KeyF']:['ArrowDown','ArrowRight','KeyJ'];
  s.key(down);s.key(back);s.key(down,'keyup');s.key(punch);advance(s.game,.03);
  assert.equal(s.game.fighters[slot].action,'super');s.key(back,'keyup');s.key(punch,'keyup');
 }
});

test('rasteira continua sendo rasteira quando baixo é solto antes do próximo frame',t=>{const s=prepare(t);s.key('KeyS');s.key('KeyG');s.key('KeyS','keyup');advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');});

test('botões de toque leve e forte fornecem as forças necessárias aos combos',t=>{
 const s=prepare(t),button=s.buttons.find(b=>b.dataset.action==='punch');
 button.dataset.strength='0';s.pointer('punch','pointerdown',3);advance(s.game,.02);assert.equal(s.game.fighters[0].moveData.strength,0);
 s.pointer('punch','pointerup',3);advance(s.game,.5);
 button.dataset.strength='2';s.pointer('punch','pointerdown',4);advance(s.game,.02);assert.equal(s.game.fighters[0].moveData.strength,2);
});

test('Combo Livre entra por teclado, toque e gamepad sem repetir o custo ao segurar',t=>{
 const s=prepare(t),f=s.game.fighters[0];f.meter=100;s.key('KeyC');assert.equal(f.meter,50);assert.ok(f.customTime>0);
 s.key('KeyC','keydown',true);assert.equal(f.meter,50);s.key('KeyC','keyup');
 f.customTime=0;f.meter=100;s.pointer('custom','pointerdown',4);assert.equal(f.meter,50);s.pointer('custom','pointerup',4);
 f.customTime=0;f.meter=100;s.connect();s.pad.buttons[9].pressed=true;s.input.update();assert.equal(f.meter,50);s.input.update();assert.equal(f.meter,50);
});
test('atalhos dos dois jogadores cancelam somente o impacto bloqueado, por teclado e toque',t=>{
 const s=prepare(t);
 for(const slot of [0,1]){
  const f=s.game.fighters[slot],attacker=s.game.fighters[1-slot];s.game.setInput(slot,{block:true});
  s.game.hit({attacker,target:f,move:'punch',x:f.x,y:f.y-200});f.meter=100;
  s.key(slot===0?'KeyX':'Comma');assert.equal(f.action,'guardCounter');assert.equal(f.meter,75);assert.equal(f.blockstun,0);
  s.key(slot===0?'KeyX':'Comma','keyup');s.game.clearAction(f);f.invincible=0;s.game.setInput(slot,{});
 }
 const f=s.game.fighters[0];s.pointer('block','pointerdown',1);
 s.game.hit({attacker:s.game.fighters[1],target:f,move:'punch',x:f.x,y:f.y-200});f.meter=100;
 s.pointer('guardCounter','pointerdown',2);assert.equal(f.action,'guardCounter');assert.equal(f.meter,75);
});


test('modo local recebe dois joysticks independentes e atalhos de poder com LT',t=>{
 const s=prepare(t),pad2={axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};
 s.connect([null,s.pad,null,pad2]);s.pad.axes[0]=.8;pad2.axes[0]=-.8;
 s.pad.buttons[2].pressed=true;pad2.buttons[1].pressed=true;s.input.update();advance(s.game,.02);
 assert.equal(s.game.cpu,false);assert.equal(s.game.fighters[0].action,'punch');assert.equal(s.game.fighters[1].action,'kick');
 assert.equal(s.game.fighters[0].input.right,true);assert.equal(s.game.fighters[1].input.left,true);
 for(const [button,move] of [[2,'special'],[3,'uppercut'],[5,'super']]){
  s.game.start('rafael','local','gustavo');s.game.phase='fight';s.input.release();
  for(const pad of [s.pad,pad2]){pad.axes=[0,0];pad.buttons.forEach(b=>b.pressed=false);pad.buttons[6].pressed=true;pad.buttons[button].pressed=true;}
  s.game.fighters.forEach(f=>f.meter=100);s.input.update();advance(s.game,.02);
  assert.deepEqual(s.game.fighters.map(f=>f.action),[move,move]);
 }
});
