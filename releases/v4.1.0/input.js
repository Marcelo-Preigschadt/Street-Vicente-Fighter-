const KEYMAP = [
  { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'down', KeyR: 'block',
    KeyT: 'punch:0', KeyF: 'punch:1', KeyY: 'punch:2', KeyV: 'kick:0', KeyG: 'kick:1', KeyB: 'kick:2',
    KeyH: 'special:1', KeyU: 'uppercut:1', KeyQ: 'super:1', KeyE: 'throw:1', KeyC:'custom:1', KeyX:'guardCounter:1', KeyZ:'drone:1' },
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'down', KeyO: 'block',
    Numpad7: 'punch:0', Numpad8: 'punch:1', Numpad9: 'punch:2', Numpad4: 'kick:0', Numpad5: 'kick:1', Numpad6: 'kick:2',
    KeyJ: 'punch:1', KeyK: 'kick:1', KeyL: 'special:1', Semicolon: 'uppercut:1', Period: 'super:1', KeyN: 'throw:1', KeyM:'custom:1', Comma:'guardCounter:1', KeyI:'drone:1' },
];
const DIRECTIONS = new Set(['left', 'right', 'down', 'up', 'crouch', 'jump', 'block']);
const STORY_KEYS=KEYMAP.map((map,i)=>({...map,...(i===0?{KeyW:'up',Space:'jump',ControlLeft:'crouch'}:{ArrowUp:'up',ShiftRight:'jump',ControlRight:'crouch'})}));
const PAD_ATTACKS = [[2, 'punch', 0], [3, 'punch', 1], [5, 'punch', 2], [0, 'kick', 0], [1, 'kick', 1], [7, 'kick', 2], [8, 'throw', 1], [9,'custom',1], [11,'guardCounter',1], [10,'drone',1]];
export class Inputs {
  constructor(engine) {
    this.engine = engine; this.sink=engine;this.onlineSlot=null;this.held = new Set(); this.touch = new Map(); this.gamepadPrevious = [{}, {}]; this.padInput = [{}, {}];
    window.addEventListener('keydown', e => {
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
    this.held.clear(); this.touch.clear(); this.padInput = [{}, {}]; this.gamepadPrevious = [{}, {}];
    for (let slot = 0; slot < (this.onlineSlot===null?2:1); slot++) if (!(slot === 1 && this.engine.cpu)) {
      this.sink.setInput(this.onlineSlot??slot, {});
      if(this.onlineSlot!==null)continue;
      this.engine.fighters[slot].buffer = null; this.engine.fighters[slot].jumpBuffer = 0;
      this.engine.fighters[slot].tapDirection = 0; this.engine.fighters[slot].tapReleased = false;
    }
    document.querySelectorAll('.touch-controls .pressed').forEach(b => b.classList.remove('pressed'));
  }
  update() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    for (let slot = 0; slot < (this.onlineSlot===null?2:1); slot++) {
      if (slot === 1 && this.engine.cpu) continue;
      const pad = pads[slot];
      this.padInput[slot] = pad ? {
        left: pad.axes[0] < -.3 || !!pad.buttons[14]?.pressed, right: pad.axes[0] > .3 || !!pad.buttons[15]?.pressed,
        ...(this.engine.storyActive?{up:pad.axes[1]<-.3||!!pad.buttons[12]?.pressed,jump:!!pad.buttons[0]?.pressed}:{jump:pad.axes[1]<-.5||!!pad.buttons[12]?.pressed}), down: pad.axes[1] > .5 || !!pad.buttons[13]?.pressed,
        block: !!pad.buttons[4]?.pressed,
      } : {};
      this.applyHeld(slot);
      if (!pad) { this.gamepadPrevious[slot] = {}; continue; }
      if(this.engine.storyActive){const advance=!!pad.buttons[9]?.pressed;if(advance&&!this.gamepadPrevious[slot].storyAdvance)this.queue(slot,this.engine.phase==='storyDialog'?'storyNext':this.engine.phase==='result'?'storyRetry':'storySwap',1);this.gamepadPrevious[slot].storyAdvance=advance;}
      for (const [button, move, strength] of (this.engine.storyActive?PAD_ATTACKS.filter(a=>![0,9].includes(a[0])):PAD_ATTACKS)) {
        const pressed = !!pad.buttons[button]?.pressed;
        if (pressed && !this.gamepadPrevious[slot][button]) this.queue(slot, pad.buttons[6]?.pressed ? ({2:'special',3:'uppercut',5:'super'}[button]??move) : move, strength);
        this.gamepadPrevious[slot][button] = pressed;
      }
    }
  }
}
