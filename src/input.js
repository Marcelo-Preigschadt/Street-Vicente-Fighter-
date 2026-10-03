const KEYMAP = [
  { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'down', KeyF: 'punch', KeyG: 'kick', KeyH: 'special', KeyR: 'block' },
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'down', KeyJ: 'punch', KeyK: 'kick', KeyL: 'special', KeyO: 'block' },
];
const ATTACKS = new Set(['punch', 'kick', 'special']);
export class Inputs {
  constructor(engine) {
    this.engine = engine; this.held = new Set(); this.touch = new Set(); this.gamepadPrevious = [{}, {}];
    window.addEventListener('keydown', e => {
      if (engine.phase === 'selection' || engine.phase === 'result' || engine.paused) return;
      const match = KEYMAP.findIndex(m => m[e.code]); if (match < 0) return;
      if (match === 1 && engine.cpu) return;
      e.preventDefault(); this.held.add(e.code); if (!e.repeat && ATTACKS.has(KEYMAP[match][e.code])) engine.queue(match, KEYMAP[match][e.code]);
    });
    window.addEventListener('keyup', e => this.held.delete(e.code));
    window.addEventListener('blur', () => this.release());
    document.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); this.touch.add(action); button.classList.add('pressed'); if (ATTACKS.has(action)) engine.queue(0, action); });
      const up = e => { e.preventDefault(); this.touch.delete(action); button.classList.remove('pressed'); };
      button.addEventListener('pointerup', up); button.addEventListener('pointercancel', up); button.addEventListener('lostpointercapture', up);
    });
  }
  release() { this.held.clear(); this.touch.clear(); document.querySelectorAll('.touch-controls .pressed').forEach(b => b.classList.remove('pressed')); }
  update() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    for (let slot = 0; slot < 2; slot++) {
      if (slot === 1 && this.engine.cpu) continue;
      const input = { left: false, right: false, jump: false, down: false, block: false };
      for (const code of this.held) if (KEYMAP[slot][code] && !ATTACKS.has(KEYMAP[slot][code])) input[KEYMAP[slot][code]] = true;
      if (slot === 0) for (const action of this.touch) if (!ATTACKS.has(action)) input[action] = true;
      const pad = pads[slot];
      if (pad) {
        input.left ||= pad.axes[0] < -.3 || pad.buttons[14]?.pressed; input.right ||= pad.axes[0] > .3 || pad.buttons[15]?.pressed;
        input.jump ||= pad.axes[1] < -.5 || pad.buttons[12]?.pressed; input.down ||= pad.axes[1] > .5 || pad.buttons[13]?.pressed;
        input.block ||= !!pad.buttons[2]?.pressed || !!pad.buttons[4]?.pressed;
        for (const [button, action] of [[0, 'punch'], [1, 'kick'], [3, 'special']]) { const pressed = !!pad.buttons[button]?.pressed; if (pressed && !this.gamepadPrevious[slot][action]) this.engine.queue(slot, action); this.gamepadPrevious[slot][action] = pressed; }
      }
      this.engine.setInput(slot, input);
    }
  }
}
