import test from 'node:test';
import assert from 'node:assert/strict';
import { Inputs } from '../src/input.js';
import { FightEngine, FIXED_STEP } from '../src/engine.js';
const advance = (g,s) => {for(let i=0;i<Math.ceil(s/FIXED_STEP);i++)g.update(FIXED_STEP);};
function prepare(t) {
  const events=[],game=new FightEngine({onEvent:e=>events.push(e)});game.start('marcelo','local');game.phase='fight';game.fighters[1].x=1000;
  const old={window:globalThis.window,document:globalThis.document,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
  globalThis.window=new EventTarget();
  const buttons=['down','kick','special'].map(action=>{const b=new EventTarget();b.dataset={action};b.pressed=false;b.setPointerCapture=()=>{};b.classList={add:()=>{b.pressed=true;},remove:()=>{b.pressed=false;}};return b;});
  globalThis.document={querySelectorAll:q=>q==='[data-action]'?buttons:buttons.filter(b=>b.pressed)};
  const pad={axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};let connected=false;
  Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>connected?[pad]:[]},configurable:true});
  t.after(()=>{for(const key of ['window','document'])if(old[key]===undefined)delete globalThis[key];else globalThis[key]=old[key];if(old.navigator)Object.defineProperty(globalThis,'navigator',old.navigator);else delete globalThis.navigator;});
  const input=new Inputs(game);
  const emit=(target,type,props)=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
  return {game,events,input,buttons,pad,connect:()=>{connected=true;},key:(code,type='keydown',repeat=false)=>emit(window,type,{code,repeat}),pointer:(action,type,id)=>emit(buttons.find(b=>b.dataset.action===action),type,{pointerId:id})};
}
test('teclado captura baixo antes do chute e não perde a rasteira',t=>{const s=prepare(t);s.key('KeyS');s.key('KeyG');advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');});
test('comando direcional do teclado dispara poder sem depender de um frame entre teclas',t=>{const s=prepare(t);s.key('KeyS');s.key('KeyD');s.key('KeyS','keyup');s.key('KeyF');advance(s.game,.03);assert.equal(s.game.fighters[0].action,'special');});
test('os seis botões escolhem força e segurar a tecla não repete ataques',t=>{const s=prepare(t);s.key('KeyY');advance(s.game,.03);assert.equal(s.game.fighters[0].moveData.strength,2);s.key('KeyY','keydown',true);advance(s.game,1);assert.equal(s.events.filter(e=>e.type==='swing').length,1);});
test('toque permite agachar e chutar simultaneamente com dedos distintos',t=>{const s=prepare(t);s.pointer('down','pointerdown',1);s.pointer('kick','pointerdown',2);advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');s.pointer('kick','pointerup',2);assert.equal(s.game.fighters[0].input.down,true);s.pointer('down','pointerup',1);assert.equal(s.game.fighters[0].input.down,false);});
test('gamepad aplica direcional antes da borda do botão de ataque',t=>{const s=prepare(t);s.connect();s.pad.axes[1]=.8;s.pad.buttons[1].pressed=true;s.input.update();advance(s.game,.02);assert.equal(s.game.fighters[0].action,'sweep');});
