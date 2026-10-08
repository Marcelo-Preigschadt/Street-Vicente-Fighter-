import {GamepadMappings,GamepadPresence,connectedPads,deviceKey,pressed,readController,PAD_ACTIONS} from './gamepad.js';

const KEYMAP = [
  { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'down', KeyR: 'block',
    KeyT: 'punch:0', KeyF: 'punch:1', KeyY: 'punch:2', KeyV: 'kick:0', KeyG: 'kick:1', KeyB: 'kick:2',
    KeyH: 'special:1', KeyU: 'uppercut:1', KeyQ: 'super:1', KeyE: 'throw:1', KeyC:'custom:1', KeyX:'guardCounter:1', KeyZ:'drone:1' },
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'down', KeyO: 'block',
    Numpad7: 'punch:0', Numpad8: 'punch:1', Numpad9: 'punch:2', Numpad4: 'kick:0', Numpad5: 'kick:1', Numpad6: 'kick:2',
    KeyJ: 'punch:1', KeyK: 'kick:1', KeyL: 'special:1', Semicolon: 'uppercut:1', Period: 'super:1', KeyN: 'throw:1', KeyM:'custom:1', Comma:'guardCounter:1', KeyI:'drone:1' },
];
const DIRECTIONS = new Set(['left', 'right', 'down', 'up', 'crouch', 'jump', 'block']);
const STORY_KEYS=KEYMAP.map((map,i)=>({...map,...(i===0?{KeyW:'up',Space:'jump',ControlLeft:'crouch',KeyH:'storySpecial:1'}:{ArrowUp:'up',ShiftRight:'jump',ControlRight:'crouch',KeyL:'storySpecial:1'})}));
const EXTRA_PAD_ATTACKS = [[5,'punch',2],[7,'kick',2],[8,'throw',1],[10,'drone',1],[11,'guardCounter',1]];
const PAD_NAV_REPEAT=210;
export class Inputs {
  constructor(engine) {
    this.engine = engine; this.sink=engine;this.onlineSlot=null;this.held = new Set(); this.touch = new Map();
    this.gamepadPrevious = [{}, {}];this.padInput = [{}, {}];this.padStatus='';this.gamepadMappings=new GamepadMappings();this.gamepadPresence=new GamepadPresence();this.gamepadDisconnects=0;
    this.onGamepadStatus=null;this.onGamepadAction=null;this.onGamepadBinding=null;this.onGamepadSignal=null;this.onGamepadDiagnostic=null;
    this.capture=null;this.padRepeat=[{},{}];this.gamepadUiLocked=false;
    window.addEventListener('gamepadconnected',()=>this.reportGamepads());
    window.addEventListener('gamepaddisconnected',()=>{
      // USB disconnect events are advisory; confirm absence over several polls.
      this.gamepadDisconnects++;this.onGamepadDiagnostic?.(this.gamepadDisconnects);
      this.reportGamepads();
    });
    window.addEventListener('keydown', e => {
      if(e.target.closest?.('button,input,select,textarea,a,summary'))return;
      if(engine.storyActive&&!engine.paused&&e.code==='Tab'&&engine.phase==='fight'){e.preventDefault();if(!e.repeat)this.queue(0,'storySwap',1);return;}
      if (engine.phase === 'selection' || engine.phase === 'result' || engine.paused) return;
      const slot = this.maps.findIndex(m => m[e.code]); if (slot < 0 || (slot === 1 && (engine.cpu || this.onlineSlot!==null))) return;
      e.preventDefault(); this.held.add(e.code);
      // Capture the held direction before the attack edge, including fast diagonal inputs.
      this.applyHeld(slot);
      const action = this.maps[slot][e.code];
      if (!e.repeat && !DIRECTIONS.has(action)) { const [move, strength] = action.split(':'); this.queue(slot, move, Number(strength)); }
    });
    window.addEventListener('keyup', e => { this.held.delete(e.code); const slot = this.maps.findIndex(m => m[e.code]); if (slot >= 0 && !(slot === 1 && (engine.cpu||this.onlineSlot!==null))) this.applyHeld(slot); });
    window.addEventListener('blur', () => this.release());
    document.querySelectorAll('[data-action]').forEach(button => {
      const actionFor=()=>engine.storyActive?(button.dataset.storyAction??button.dataset.action):button.dataset.action;
      button.addEventListener('pointerdown', e => {
        const action=actionFor();e.preventDefault(); if (engine.paused || engine.phase !== 'fight') return;
        button.setPointerCapture(e.pointerId); this.touch.set(e.pointerId, action); button.classList.add('pressed'); this.applyHeld(0);
        if (!DIRECTIONS.has(action)) this.queue(0, action, Number(button.dataset.strength ?? 1));
      });
      const up = e => {
        const action=actionFor();e.preventDefault(); this.touch.delete(e.pointerId); if (![...this.touch.values()].includes(action)) button.classList.remove('pressed'); this.applyHeld(0);
      };
      button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
    });
  }
  get maps(){return this.engine.storyActive&&this.engine.phase!=='selection'?STORY_KEYS:KEYMAP;}
  connectedGamepads(){return connectedPads();}
  stableGamepads(){return this.gamepadPresence.snapshot().map(entry=>entry.pad);}
  reportGamepads(pads=this.connectedGamepads()){
    const slots=this.gamepadPresence.update(pads);
    const status=slots.map(entry=>entry.key).join('||');
    if(status!==this.padStatus){this.padStatus=status;this.onGamepadStatus?.(slots.map(entry=>entry.pad));}
    return slots;
  }
  startCapture(action,pad=this.connectedGamepads()[0]){
    if(!pad||!PAD_ACTIONS.includes(action))return false;
    this.capture={action,key:deviceKey(pad),previous:pad.buttons.map((_,i)=>pressed(pad,i))};return true;
  }
  cancelCapture(){this.capture=null;}
  resetGamepad(pad=this.connectedGamepads()[0]){if(pad){this.gamepadMappings.reset(pad);this.onGamepadBinding?.(null,null,pad);}}
  network(sink=null,slot=null) { this.release();this.sink=sink??this.engine;this.onlineSlot=slot; }
  queue(slot,move,strength) { this.sink.queue(this.onlineSlot??slot,move,strength); }
  applyHeld(slot) {
    const input = { left: false, right: false, jump: false, down: false, block: false,...(this.engine.storyActive?{up:false,crouch:false}:{}) };
    for (const code of this.held) { const action = this.maps[slot][code]; if (DIRECTIONS.has(action)) input[action] = true; }
    if (slot === 0) for (const action of this.touch.values()) if (DIRECTIONS.has(action)) input[action] = true;
    for (const action of DIRECTIONS) input[action] ||= !!this.padInput[slot][action];
    this.sink.setInput(this.onlineSlot??slot, input);
  }
  release() {
    this.held.clear(); this.touch.clear(); this.padInput = [{}, {}];
    for (let slot = 0; slot < (this.onlineSlot===null?2:1); slot++) if (!(slot === 1 && this.engine.cpu)) {
      this.sink.setInput(this.onlineSlot??slot, {});
      if(this.onlineSlot!==null)continue;
      this.engine.fighters[slot].buffer = null; this.engine.fighters[slot].jumpBuffer = 0;
      this.engine.fighters[slot].tapDirection = 0; this.engine.fighters[slot].tapReleased = false;
    }
    document.querySelectorAll('.touch-controls .pressed').forEach(b => b.classList.remove('pressed'));
  }
  update() {
    const slots=this.reportGamepads(this.connectedGamepads());
    const menus=this.gamepadUiLocked||this.engine.phase==='selection'||this.engine.phase==='result'||this.engine.paused||this.engine.phase==='storyDialog';
    for(let slot=0;slot<(this.onlineSlot===null?2:1);slot++){
      const observed=slots[slot],pad=observed?.live?observed.pad:null,previous=this.gamepadPrevious[slot]??{},repeat=this.padRepeat[slot]??{};
      if(!pad){
        // Discard held directions while retaining button edges across a transient gap.
        this.padInput[slot]={};this.onGamepadSignal?.(null,null,slot);
        if(!observed){this.gamepadPrevious[slot]={};this.padRepeat[slot]={};}
        if(['fight','intro','roundEnd'].includes(this.engine.phase)&&!this.engine.paused&&!(slot===1&&this.engine.cpu))this.applyHeld(slot);
        continue;
      }
      const binding=this.gamepadMappings.for(pad),state=readController(pad,binding);
      this.onGamepadSignal?.(pad,state,slot);
      if(this.capture&&this.capture.key===deviceKey(pad)){
        const next=state.raw.findIndex((value,i)=>value&&!this.capture.previous[i]);
        this.capture.previous=state.raw;
        if(next>=0){const action=this.capture.action;this.gamepadMappings.bind(pad,action,next);this.capture=null;this.onGamepadBinding?.(action,next,pad);}
        this.padInput[slot]={};this.gamepadPrevious[slot]={};continue;
      }
      if(this.capture){this.padInput[slot]={};this.gamepadPrevious[slot]={};continue;}
      if(menus){
        if(!this.gamepadUiLocked){
          const directions=['up','down','left','right'],currentTime=globalThis.performance?.now?.()??Date.now();
          for(const action of directions){
            if(state[action]&&(!previous[action]||currentTime>=(repeat[action]??0))){this.onGamepadAction?.(action,slot);repeat[action]=currentTime+PAD_NAV_REPEAT;}
            else if(!state[action])repeat[action]=0;
          }
          if(state.confirm&&!previous.confirm)this.onGamepadAction?.('confirm',slot);
          if(state.back&&!previous.back)this.onGamepadAction?.('back',slot);
          if(state.buttons.pause&&!previous.pause)this.onGamepadAction?.('start',slot);
        }
        this.padInput[slot]={};
      }else if(!this.engine.paused&&['fight','intro','roundEnd'].includes(this.engine.phase)){
        this.padInput[slot]={left:state.left,right:state.right,up:state.up,down:state.down,
          ...(this.engine.storyActive?{jump:state.buttons.jump,crouch:false}:{jump:state.buttons.jump}),block:state.buttons.block};
        if(!(slot===1&&this.engine.cpu))this.applyHeld(slot);
        if(state.buttons.pause&&!previous.pause){
          if(pressed(pad,6)&&binding.pause!==6&&!this.engine.storyActive)this.queue(slot,'custom',1);
          else if(this.engine.storyActive)this.queue(slot,'storySwap',1);
          else this.onGamepadAction?.('pause',slot);
        }
        if(state.buttons.punch&&!previous.punch)this.queue(slot,pressed(pad,6)&&binding.punch!==6&&!this.engine.storyActive?'special':'punch',1);
        if(state.buttons.kick&&!previous.kick)this.queue(slot,'kick',1);
        if(state.buttons.special&&!previous.special)this.queue(slot,pressed(pad,6)&&binding.special!==6&&!this.engine.storyActive?'uppercut':this.engine.storyActive?'storySpecial':'special',1);
        for(const [button,move,strength]of EXTRA_PAD_ATTACKS){
          const isAssigned=Object.values(binding).includes(button),active=pressed(pad,button),was=!!previous[`extra${button}`];
          if(active&&!was&&!isAssigned){
            const adjusted=!this.engine.storyActive&&pressed(pad,6)&&button===5?'super':move;
            this.queue(slot,adjusted,strength);
          }
          previous[`extra${button}`]=active;
        }
      }
      this.gamepadPrevious[slot]={...previous,...state,...state.buttons};this.padRepeat[slot]=repeat;
    }
  }
}
