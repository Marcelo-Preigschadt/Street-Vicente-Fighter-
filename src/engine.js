export const WORLD = Object.freeze({ width: 1280, height: 720, floor: 625, gravity: 2100 });
export const FIXED_STEP = 1 / 120;
export const CHARACTERS = Object.freeze({
  marcelo: { id: 'marcelo', name: 'Prof. Marcelo', quote: 'Bora NIT', color: '#b8ed68', accent: '#69daaa',
    speed: 330, backSpeed: 225, power: 1.08, sprite: 'assets/marcelo.webp', combatSprite: 'assets/marcelo-combat.webp',
    powers: { special: 'Rajada de Código', uppercut: 'Firewall', super: 'Kernel Panic' },
    powerQuotes: { special: 'Código na tela!', uppercut: 'Barreira digital ativada!', super: 'Bora NIT! Pane no sistema!' },
    voiceDuration: { special: 1.84, uppercut: 2.40, super: 4.30 },
    strikes: { punch: { near: 42, reach: 155, height: 200, h: 32 }, kick: { near: 60, reach: 201, height: 251, h: 48 },
      crouchPunch: { near: 35, reach: 161, height: 140, h: 34 }, sweep: { near: 35, reach: 208, height: 49, h: 54 },
      airPunch: { near: 30, reach: 170, height: 188, h: 34 }, airKick: { near: 30, reach: 187, height: 128, h: 62 },
      uppercut: { near: -25, reach: 82, height: 297, h: 100 } }, projectile: { offset: 154, height: 199 } },
  rafael: { id: 'rafael', name: 'Prof Rafael', quote: 'No meu tempo não era assim', color: '#ffa14c', accent: '#ffd08a',
    speed: 360, backSpeed: 245, power: 1, sprite: 'assets/rafael.webp', combatSprite: 'assets/rafael-combat.webp',
    powers: { special: 'Crônicas', uppercut: 'Linha do Tempo', super: 'Marcha dos Séculos' },
    powerQuotes: { special: 'Abram as crônicas!', uppercut: 'Viagem pela história!', super: 'No meu tempo não era assim! Marcha dos séculos!' },
    voiceDuration: { special: 2.40, uppercut: 3.12, super: 4.80 },
    strikes: { punch: { near: 42, reach: 153, height: 229, h: 28 }, kick: { near: 60, reach: 193, height: 238, h: 42 },
      crouchPunch: { near: 35, reach: 148, height: 119, h: 30 }, sweep: { near: 35, reach: 205, height: 52, h: 38 },
      airPunch: { near: 30, reach: 157, height: 145, h: 32 }, airKick: { near: 30, reach: 175, height: 110, h: 36 },
      uppercut: { near: -25, reach: 87, height: 303, h: 80 } }, projectile: { offset: 150, height: 214 } },
});

const frames = n => n / 60;
// Startup, active and recovery are gameplay frames at 60 Hz; physics runs at 120 Hz.
const NORMALS = {
  punch: [[4, 3, 9, 44, 17, 120], [6, 4, 12, 68, 19, 185], [10, 4, 20, 96, 24, 270]],
  kick: [[5, 4, 12, 50, 17, 155], [8, 5, 18, 80, 22, 245], [12, 5, 23, 112, 27, 330]],
  crouchPunch: [[4, 3, 8, 40, 17, 110], [6, 4, 12, 64, 19, 175], [9, 5, 19, 88, 23, 260]],
  sweep: [[6, 4, 17, 58, 21, 230], [8, 5, 22, 86, 26, 315], [11, 5, 27, 110, 29, 370]],
  airPunch: [[4, 12, 8, 48, 19, 155], [5, 14, 10, 72, 23, 225], [7, 16, 12, 98, 27, 290]],
  airKick: [[4, 14, 8, 54, 21, 185], [5, 18, 10, 86, 25, 265], [7, 19, 12, 114, 29, 340]],
};
function moveData(name, strength = 1) {
  strength = Math.max(0, Math.min(2, strength));
  if (NORMALS[name]) {
    const [startup, active, recovery, damage, stun, push] = NORMALS[name][strength];
    return { name, strength, startup: frames(startup), active: frames(active), recovery: frames(recovery), damage, stun: frames(stun),
      blockstun: frames(Math.max(9, stun - 5)), push, meter: 5 + strength * 3, level: name === 'sweep' ? 'low' : name.startsWith('air') ? 'overhead' : 'mid',
      knockdown: name === 'sweep', cancellable: name === 'punch' || name === 'crouchPunch' || (name === 'kick' && strength < 2) };
  }
  if (name === 'special') return { name, strength, startup: frames(12), active: frames(1), recovery: frames(24), damage: 98 + strength * 12,
    stun: frames(26), blockstun: frames(18), push: 330, meter: 8, level: 'mid', projectile: true, chip: .1, speed: 460 + strength * 150 };
  if (name === 'uppercut') return { name, strength, startup: frames(5), active: frames(13), recovery: frames(28), damage: 105 + strength * 17,
    stun: frames(30), blockstun: frames(22), push: 420, meter: 10, level: 'mid', knockdown: true, launch: 620, invincibility: frames(8) };
  if (name === 'super') return { name, strength, startup: frames(8), active: frames(17), recovery: frames(30), damage: 85,
    stun: frames(26), blockstun: frames(18), push: 250, meter: 0, level: 'mid', projectile: true, chip: .1, speed: 860, cost: 100, invincibility: frames(10) };
  if (name === 'throw') return { name, strength, startup: frames(5), active: frames(2), recovery: frames(23), damage: 130,
    stun: frames(30), blockstun: 0, push: 650, meter: 9, level: 'throw', knockdown: true, launch: 340 };
  return null;
}
export const MOVES = Object.freeze(Object.fromEntries([...Object.keys(NORMALS), 'special', 'uppercut', 'super', 'throw'].map(name => [name, moveData(name)])));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const approach = (value, target, step) => value + clamp(target - value, -step, step);
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const idleInput = () => ({ left: false, right: false, down: false, jump: false, block: false });
const LEFT_WALL = 110, RIGHT_WALL = WORLD.width - 110, BODY_WIDTH = 112;
const POWERS = new Set(['special', 'uppercut', 'super']);

export class Fighter {
  constructor(id, slot) { this.character = CHARACTERS[id]; this.slot = slot; this.wins = 0; this.reset(); }
  reset() {
    const x = this.slot === 0 ? 360 : 920;
    Object.assign(this, { x, y: WORLD.floor, prevX: x, prevY: WORLD.floor, vx: 0, vy: 0, knockback: 0, direction: this.slot === 0 ? 1 : -1,
      hp: 1000, displayHP: 1000, meter: 0, action: null, moveData: null, actionTime: 0, prevActionTime: 0, actionHit: false, contactTime: -10, shotsSent: 0,
      hitstun: 0, blockstun: 0, flash: 0, blockFlash: 0, combo: 0, comboTime: 0, lastAttacker: null, state: 'idle', input: idleInput(),
      buffer: null, jumpBuffer: 0, airAttackUsed: false, landing: 0, knocked: false, knockdownTime: 0, wakeTime: 0, invincible: 0,
      animTime: 0, quoteTime: 0, walkTime: 0, directions: [], lastDirection: 5, powerName: '', powerQuote: '', blockLow: false });
  }
  get airborne() { return this.y < WORLD.floor - .01; }
  get canAct() { return this.hp > 0 && this.hitstun <= 0 && this.blockstun <= 0 && !this.action && !this.knocked && this.wakeTime <= 0 && this.landing <= 0; }
  get crouching() { return !this.airborne && ['crouch', 'crouchPunch', 'sweep', 'lowBlock'].includes(this.state); }
  get pushHeight() { return this.knocked ? 48 : this.airborne ? 145 : this.crouching ? 125 : 180; }
  get guard() {
    const back = this.direction > 0 ? this.input.left && !this.input.right : this.input.right && !this.input.left;
    return { active: (back || this.input.block) && !this.airborne && !this.action && !this.knocked && this.wakeTime <= 0 && this.hitstun <= 0,
      low: !!this.input.down, direction: this.direction };
  }
  get hurtboxes() {
    if (this.knocked || this.wakeTime > 0 || this.invincible > 0 || this.hp <= 0) return [];
    const box = (offset, height, w, h) => ({ x: this.x + offset * this.direction - w / 2, y: this.y - height, w, h });
    if (this.state === 'sweep') return [box(18, 146, 54, 54), box(3, 99, 90, 72), box(12, 42, 122, 38)];
    if (this.state === 'airKick') {
      const height = this.character.id === 'marcelo' ? 220 : 190;
      return [box(9, height, 54, 58), box(0, height - 58, 86, 108), box(8, 65, 102, 60)];
    }
    if (this.crouching) return [box(25, 208, 54, 54), box(6, 154, 88, 98), box(0, 60, 114, 56)];
    if (this.airborne) return [box(14, 242, 54, 58), box(0, 184, 86, 108), box(0, 78, 98, 72)];
    return [box(18, 290, 54, 62), box(0, 228, 86, 140), box(0, 88, 104, 84)];
  }
  get attackbox() {
    const strike = this.character.strikes[this.action];
    if (!strike) return null;
    return { x: this.x + (this.direction > 0 ? strike.near : -strike.reach), y: this.y - strike.height - strike.h / 2,
      w: strike.reach - strike.near, h: strike.h };
  }
}

export class FightEngine {
  constructor({ random = Math.random, onEvent = () => {} } = {}) {
    this.random = random; this.onEvent = onEvent; this.phase = 'selection'; this.paused = false; this.time = 0;
    this.fighters = [new Fighter('marcelo', 0), new Fighter('rafael', 1)]; this.projectiles = []; this.freeze = 0;
    this.ai = { timer: 0, input: idleInput(), actionTimer: 0 }; this.cpu = true;
  }
  event(type, data = {}) { this.onEvent({ type, ...data }); }
  start(id = 'marcelo', mode = 'cpu') {
    this.cpu = mode === 'cpu'; this.playerId = id; this.mode = mode;
    this.fighters = [new Fighter(id, 0), new Fighter(id === 'marcelo' ? 'rafael' : 'marcelo', 1)];
    this.round = 1; this.paused = false; this.ai = { timer: 0, input: idleInput(), actionTimer: 0 }; this.newRound();
  }
  newRound() {
    this.fighters.forEach(f => f.reset()); this.projectiles = []; this.freeze = 0; this.timer = 90;
    this.phase = 'intro'; this.phaseTime = 0; this.time = 0; this.roundWinner = null;
    this.event('round', { round: this.round });
  }
  setInput(slot, input) {
    const f = this.fighters[slot], next = { ...idleInput(), ...input };
    if (next.jump && !f.input.jump && this.phase === 'fight' && !this.paused) f.jumpBuffer = .14;
    f.input = next;
    if (this.phase !== 'fight' || this.paused) return;
    const horizontal = (Number(next.right) - Number(next.left)) * f.direction;
    const vertical = next.down ? -1 : next.jump ? 1 : 0;
    const direction = vertical === -1 ? (horizontal < 0 ? 1 : horizontal > 0 ? 3 : 2)
      : vertical === 1 ? (horizontal < 0 ? 7 : horizontal > 0 ? 9 : 8) : horizontal < 0 ? 4 : horizontal > 0 ? 6 : 5;
    if (direction !== f.lastDirection) { f.directions.push({ direction, time: this.time }); f.lastDirection = direction; }
    f.directions = f.directions.filter(d => this.time - d.time <= .8);
  }
  motion(f, pattern, window = .42) {
    const history = f.directions.filter(d => d.direction !== 5 && this.time - d.time <= window);
    if (!history.length || this.time - history.at(-1).time > .16) return false;
    const tail = history.slice(-pattern.length);
    return tail.length === pattern.length && tail.every((d, i) => d.direction === pattern[i]);
  }
  queue(slot, move, strength = 1) {
    if (this.phase !== 'fight' || this.paused || !MOVES[move]) return;
    const f = this.fighters[slot];
    if (move === 'punch' && !f.airborne) {
      if (f.meter >= 100 && this.motion(f, [2, 3, 6, 2, 3, 6], .75)) move = 'super';
      else if (this.motion(f, [6, 2, 3])) move = 'uppercut';
      else if (this.motion(f, [2, 3, 6]) || this.motion(f, [2, 6], .23)) move = 'special';
      if (POWERS.has(move)) { f.directions = []; f.lastDirection = 5; }
    }
    // Preserve a low attack even if down is released before the next simulation tick.
    if (['punch', 'kick'].includes(move) && f.input.down && !f.airborne && f.jumpBuffer <= 0) move = move === 'punch' ? 'crouchPunch' : 'sweep';
    f.buffer = { move, strength, life: .20 };
  }
  contextualMove(f, move) {
    if (move === 'punch') return f.airborne ? 'airPunch' : f.input.down ? 'crouchPunch' : 'punch';
    if (move === 'kick') return f.airborne ? 'airKick' : f.input.down ? 'sweep' : 'kick';
    return move;
  }
  beginMove(f, baseMove, strength = 1, cancel = false) {
    const move = this.contextualMove(f, baseMove), m = moveData(move, strength);
    if (!m || f.hp <= 0 || f.hitstun > 0 || f.blockstun > 0 || f.knocked || f.wakeTime > 0 || f.landing > 0 || (f.action && !cancel)) return false;
    if (f.airborne && (!move.startsWith('air') || f.airAttackUsed)) return false;
    if (!f.airborne && move.startsWith('air')) return false;
    if (!f.airborne && f.input.block) return false;
    if (m.cost && f.meter < m.cost) return false;
    if (move === 'special' && this.projectiles.some(p => p.owner === f.slot && p.move === 'special' && p.life > 0)) return false;
    f.action = move; f.moveData = m; f.actionTime = 0; f.prevActionTime = 0; f.actionHit = false; f.contactTime = -10; f.shotsSent = 0; f.state = move; f.animTime = 0;
    if (f.airborne) f.airAttackUsed = true;
    else f.vx = 0;
    if (m.cost) f.meter -= m.cost;
    if (m.invincibility) f.invincible = m.invincibility;
    if (POWERS.has(move)) {
      f.powerName = f.character.powers[move];
    } else this.event('swing', { move, strength, fighter: f.slot });
    return true;
  }
  updateAI(dt) {
    const ai = this.ai, f = this.fighters[1], foe = this.fighters[0]; ai.timer -= dt; ai.actionTimer -= dt;
    if (ai.timer > 0) { this.setInput(1, ai.input); return; }
    ai.timer = .11 + this.random() * .13;
    const dist = Math.abs(f.x - foe.x), toward = Math.sign(foe.x - f.x);
    const threat = foe.action && dist < 260, incoming = this.projectiles.some(p => p.owner !== f.slot && Math.abs(p.x - f.x) < 310);
    ai.input = idleInput();
    if ((threat || incoming) && this.random() < .65) { ai.input.block = true; ai.input.down = foe.action === 'sweep' || (!foe.airborne && this.random() < .3); }
    else if (dist > 140) { ai.input.left = toward < 0; ai.input.right = toward > 0; }
    else if (this.random() < .15) { ai.input.left = toward > 0; ai.input.right = toward < 0; }
    if (incoming && !ai.input.block && this.random() < .6) ai.input.jump = true;
    if (dist > 200 && dist < 480 && !incoming && this.random() < .14) ai.input.jump = true;
    if (!ai.input.block && dist < 220 && this.random() < .26) ai.input.down = true;
    this.setInput(1, ai.input);
    if (ai.input.block || ai.actionTimer > 0 || (!f.canAct && !f.airborne)) return;
    if (f.airborne && !f.airAttackUsed && f.vy > 0 && dist < 245) { this.queue(1, 'kick', 1); ai.actionTimer = .35; }
    else if (f.canAct && !f.airborne) {
      if (foe.airborne && dist < 210 && this.random() < .55) this.queue(1, 'uppercut');
      else if (f.meter >= 100 && dist > 210 && this.random() < .6) this.queue(1, 'super');
      else if (dist > 260 && dist < 850 && this.random() < .44) this.queue(1, 'special');
      else if (dist < 140 && this.random() < .18) this.queue(1, 'throw');
      else if (dist < 230) this.queue(1, dist > 157 || this.random() > .5 ? 'kick' : 'punch', this.random() < .2 ? 0 : 1);
      ai.actionTimer = .25 + this.random() * .35;
    }
  }
  update(dt) {
    let remaining = Math.min(Math.max(0, dt), .1);
    while (remaining > 1e-9) { const step = Math.min(FIXED_STEP, remaining); this.step(step); remaining -= step; }
  }
  step(dt) {
    if (this.paused || this.phase === 'selection' || this.phase === 'result') return;
    for (const f of this.fighters) { f.prevX = f.x; f.prevY = f.y; f.prevActionTime = f.actionTime; }
    for (const p of this.projectiles) p.prevX = p.x;
    if (this.freeze > 0) { this.freeze = Math.max(0, this.freeze - dt); return; }
    this.phaseTime += dt; this.time += dt;
    if (this.phase === 'intro') {
      this.fighters.forEach(f => { f.animTime += dt; });
      if (this.phaseTime >= 2.35) { this.phase = 'fight'; this.phaseTime = 0; this.event('fight'); } return;
    }
    if (this.phase === 'roundEnd') {
      this.fighters.forEach(f => { f.animTime += dt; this.integrate(f, dt); });
      if (this.phaseTime >= 3) {
        if (this.fighters.some(f => f.wins >= 2)) { this.phase = 'result'; this.event('result', { winner: this.fighters.find(f => f.wins >= 2).slot }); }
        else { this.round++; this.newRound(); }
      } return;
    }
    this.timer = Math.max(0, this.timer - dt);
    if (this.cpu) this.updateAI(dt);
    for (const f of this.fighters) this.updateFighter(f, dt);
    this.resolvePushboxes();
    for (const f of this.fighters) if (f.state === 'walk') f.walkTime += Math.abs(f.x - f.prevX) / f.character.speed;
    const contacts = [];
    for (const f of this.fighters) {
      const m = f.moveData;
      if (!f.action || f.actionHit || m.projectile || f.actionTime < m.startup || f.actionTime >= m.startup + m.active) continue;
      const target = this.fighters[1 - f.slot];
      if (m.level === 'throw') {
        if (!target.airborne && !target.knocked && target.wakeTime <= 0 && target.invincible <= 0 && target.hitstun <= 0 && target.blockstun <= 0
          && target.hp > 0 && Math.abs(f.x - target.x) <= 143) {
          f.actionHit = true; contacts.push({ attacker: f, target, move: f.action, data: m, x: target.x, y: target.y - 145 });
        }
        continue;
      }
      const strike = f.attackbox, body = strike && target.hurtboxes.find(box => overlaps(strike, box));
      if (body) {
        f.actionHit = true;
        contacts.push({ attacker: f, target, move: f.action, data: m, x: clamp(f.x + f.direction * f.character.strikes[f.action].reach, body.x, body.x + body.w),
          y: clamp(strike.y + strike.h / 2, body.y, body.y + body.h) });
      }
    }
    this.updateProjectiles(dt, contacts);
    // Snapshot posture so simultaneous contacts trade and use the same facing/guard state.
    const guards = this.fighters.map(f => f.guard);
    for (const contact of contacts) this.hit(contact, guards[contact.target.slot]);
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > -100 && p.x < WORLD.width + 100);
    if (this.fighters.some(f => f.hp <= 0) || this.timer <= 0) this.endRound();
  }
  updateFighter(f, dt) {
    const opponent = this.fighters[1 - f.slot]; f.animTime += dt;
    for (const timer of ['flash', 'blockFlash', 'hitstun', 'blockstun', 'quoteTime', 'comboTime', 'landing', 'invincible']) f[timer] = Math.max(0, f[timer] - dt);
    if (f.comboTime <= 0) f.combo = 0;
    if (f.hitstun <= 0 && !f.knocked) f.lastAttacker = null;
    f.displayHP += (f.hp - f.displayHP) * (1 - Math.exp(-dt * 6));
    if (f.knocked) {
      f.vx = 0; f.state = 'knockdown';
      f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
      if (!f.airborne) { f.knockdownTime = Math.max(0, f.knockdownTime - dt); if (f.knockdownTime <= 0) { f.knocked = false; f.wakeTime = .24; f.state = 'wake'; } }
      if (f.buffer) { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
      this.integrate(f, dt); return;
    }
    if (f.wakeTime > 0) {
      f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
      if (f.buffer) { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
      f.wakeTime = Math.max(0, f.wakeTime - dt); f.state = 'wake'; f.vx = 0;
      if (f.wakeTime <= 0) { f.invincible = .10; f.state = 'idle'; f.hitstun = 0; }
      this.integrate(f, dt); return;
    }
    if (!f.action && f.hitstun <= 0 && !f.airborne) f.direction = opponent.x >= f.x ? 1 : -1;
    if (f.action) {
      f.actionTime += dt; const m = f.moveData;
      if (f.action === 'uppercut' && f.actionTime >= m.startup && f.shotsSent === 0) {
        f.shotsSent = 1; f.vy = -760; f.y -= .02; f.vx = f.direction * 135;
        this.announcePower(f);
      }
      if (m.projectile) {
        const count = f.action === 'super' ? 3 : 1;
        while (f.shotsSent < count && f.actionTime >= m.startup + f.shotsSent * .11) { this.spawnProjectile(f, m, f.shotsSent++); }
      }
      const total = m.startup + m.active + m.recovery;
      if (f.actionTime >= total && (f.action !== 'uppercut' || !f.airborne)) this.clearAction(f);
    }
    const movement = Number(f.input.right) - Number(f.input.left);
    if (f.jumpBuffer > 0 && f.canAct && !f.airborne && !f.input.block) {
      f.vy = -1020; f.y -= .02; f.vx = movement * f.character.speed * 1.05;
      f.jumpBuffer = 0; f.airAttackUsed = false; this.event('jump', { fighter: f.slot });
    } else f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
    if (f.buffer) {
      const cancel = f.action && f.moveData.cancellable && f.actionHit && POWERS.has(f.buffer.move)
        && f.actionTime <= f.moveData.startup + f.moveData.active + .10;
      if (this.beginMove(f, f.buffer.move, f.buffer.strength, cancel)) f.buffer = null;
      else { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
    }
    if (f.hp <= 0) f.state = 'ko';
    else if (f.hitstun > 0) { f.state = 'hit'; f.vx = approach(f.vx, 0, 9000 * dt); }
    else if (f.blockstun > 0) { f.state = f.input.down ? 'lowBlock' : 'block'; f.vx = 0; }
    else if (f.action) { f.state = f.action; if (!f.airborne) f.vx = 0; }
    else if (f.landing > 0) { f.state = 'landing'; f.vx = 0; }
    else if (f.airborne) f.state = 'jump'; // Horizontal jump velocity is locked at takeoff.
    else {
      const backwards = movement * f.direction < 0, speed = backwards ? f.character.backSpeed : f.character.speed;
      const target = f.input.down || f.input.block ? 0 : movement * speed;
      f.vx = approach(f.vx, target, (target === 0 ? 14000 : 10500) * dt);
      f.state = f.input.down ? (f.input.block ? 'lowBlock' : 'crouch') : f.input.block ? 'block' : Math.abs(f.vx) > 8 ? 'walk' : 'idle';
    }
    this.integrate(f, dt);
  }
  clearAction(f) { f.action = null; f.moveData = null; f.actionTime = 0; f.prevActionTime = 0; }
  spawnProjectile(f, data, wave) {
    if (wave === 0) this.announcePower(f);
    const { offset, height } = f.character.projectile, x = f.x + f.direction * offset;
    this.projectiles.push({ owner: f.slot, character: f.character.id, direction: f.direction, move: f.action, data: { ...data }, wave,
      x, prevX: x, y: f.y - height, radius: f.action === 'super' ? 32 : 27, speed: data.speed, life: 3.1 });
    this.event('projectile', { fighter: f.slot, move: f.action });
  }
  announcePower(f) {
    f.quoteTime = f.character.voiceDuration[f.action] + .1; f.powerQuote = f.character.powerQuotes[f.action];
    this.event('special', { fighter: f.slot, move: f.action, name: f.powerName, quote: f.powerQuote });
  }
  updateProjectiles(dt, contacts) {
    for (const p of this.projectiles) { p.prevX = p.x; p.x += p.direction * p.speed * dt; p.life -= dt; }
    for (let i = 0; i < this.projectiles.length; i++) for (let j = i + 1; j < this.projectiles.length; j++) {
      const a = this.projectiles[i], b = this.projectiles[j];
      if (a.life <= 0 || b.life <= 0 || a.owner === b.owner || Math.abs(a.y - b.y) > a.radius + b.radius) continue;
      const before = a.prevX - b.prevX, after = a.x - b.x;
      if (Math.min(before, after) <= a.radius + b.radius && Math.max(before, after) >= -a.radius - b.radius) {
        a.life = 0; b.life = 0; this.event('clash', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, color: '#fff4ce' });
      }
    }
    for (const p of this.projectiles) {
      if (p.life <= 0) continue;
      const target = this.fighters[1 - p.owner];
      if (target.action === 'uppercut' && target.invincible > 0 && Math.abs(p.x - target.x) < 105) {
        p.life = 0; this.event('clash', { x: p.x, y: p.y, color: target.character.color }); continue;
      }
      const relativeStart = p.prevX - target.prevX, relativeEnd = p.x - target.x;
      const body = target.hurtboxes.find(box => {
        const left = box.x - target.x, right = left + box.w;
        return Math.min(relativeStart, relativeEnd) - p.radius < right && Math.max(relativeStart, relativeEnd) + p.radius > left
          && p.y + p.radius > box.y && p.y - p.radius < box.y + box.h;
      });
      if (body) {
        contacts.push({ attacker: this.fighters[p.owner], target, move: p.move, data: p.data,
          x: clamp(p.x, body.x, body.x + body.w), y: p.y, direction: p.direction }); p.life = 0;
      }
    }
  }
  integrate(f, dt) {
    const wasAirborne = f.airborne;
    f.x = clamp(f.x + (f.vx + f.knockback) * dt, LEFT_WALL, RIGHT_WALL);
    if (f.airborne || f.vy < 0) { f.y += f.vy * dt + .5 * WORLD.gravity * dt * dt; f.vy += WORLD.gravity * dt; }
    if (f.y >= WORLD.floor) {
      f.y = WORLD.floor; f.vy = 0;
      if (wasAirborne) {
        f.vx = 0; f.airAttackUsed = false;
        if (!f.knocked && f.hp > 0) { if (f.action?.startsWith('air') || f.action === 'uppercut') this.clearAction(f); f.landing = .09; f.state = 'landing'; }
        this.event('land', { fighter: f.slot, x: f.x });
      }
    }
    f.knockback *= Math.exp(-dt * 8);
    if (Math.abs(f.knockback) < .5) f.knockback = 0;
    if (this.phase === 'roundEnd') f.vx = approach(f.vx, 0, 9000 * dt);
  }
  resolvePushboxes() {
    const [a, b] = this.fighters;
    if (a.knocked || b.knocked) return;
    const verticalOverlap = (ay, by) => ay > by - b.pushHeight && by > ay - a.pushHeight;
    if (!verticalOverlap(a.y, b.y)) return;
    const oldOrder = verticalOverlap(a.prevY, b.prevY) && Math.abs(a.prevX - b.prevX) > .01;
    const aOnLeft = oldOrder ? a.prevX < b.prevX : a.x <= b.x;
    const left = aOnLeft ? a : b, right = aOnLeft ? b : a, overlap = left.x + BODY_WIDTH - right.x;
    if (overlap <= 0) return;
    let shiftLeft = Math.min(overlap / 2, left.x - LEFT_WALL), shiftRight = Math.min(overlap / 2, RIGHT_WALL - right.x);
    let remaining = overlap - shiftLeft - shiftRight;
    const extraLeft = Math.min(remaining, left.x - LEFT_WALL - shiftLeft); shiftLeft += extraLeft; remaining -= extraLeft;
    shiftRight += Math.min(remaining, RIGHT_WALL - right.x - shiftRight);
    left.x -= shiftLeft; right.x += shiftRight;
  }
  hit({ attacker, target, move, data = MOVES[move], x, y, direction = attacker.direction }, guard = target.guard) {
    if (target.hp <= 0) return;
    const front = direction === -guard.direction;
    const correctHeight = data.level === 'low' ? guard.low : data.level === 'overhead' ? !guard.low : data.level !== 'throw';
    const blocked = guard.active && front && correctHeight;
    attacker.contactTime = this.time;
    if (blocked) {
      const chip = data.chip ? Math.round(data.damage * data.chip) : 0;
      target.hp = Math.max(1, target.hp - chip); target.knockback = direction * data.push * .42; target.blockFlash = .15; target.blockstun = data.blockstun;
      target.blockLow = guard.low; target.state = guard.low ? 'lowBlock' : 'block'; target.vx = 0;
      target.meter = Math.min(100, target.meter + 5); attacker.meter = Math.min(100, attacker.meter + 4);
      this.freeze = Math.max(this.freeze, frames(4)); this.event('block', { x, y, move, fighter: target.slot, color: target.character.color }); return;
    }
    const continued = target.hitstun > 0 && target.lastAttacker === attacker.slot;
    const combo = continued ? attacker.combo + 1 : 1, scaling = Math.max(.55, 1 - (combo - 1) * .08);
    const damage = Math.round(data.damage * attacker.character.power * scaling * (target.airborne ? .93 : 1));
    target.hp = Math.max(0, target.hp - damage); target.knockback = direction * data.push; target.hitstun = data.stun; target.flash = .12;
    this.clearAction(target); target.buffer = null; target.jumpBuffer = 0; target.vx = 0; target.lastAttacker = attacker.slot;
    target.state = target.hp <= 0 ? 'ko' : 'hit';
    if (data.knockdown || (target.airborne && move === 'uppercut')) {
      target.knocked = true; target.knockdownTime = .58; target.wakeTime = 0; target.state = 'knockdown';
      if (data.launch) { target.vy = -data.launch; target.y -= .02; }
      else { target.vy = -210; target.y -= .02; }
    }
    attacker.meter = Math.min(100, attacker.meter + data.meter); target.meter = Math.min(100, target.meter + 7);
    attacker.combo = combo; attacker.comboTime = 1.2;
    this.freeze = Math.max(this.freeze, frames(move === 'super' || move === 'uppercut' ? 7 : data.strength === 2 ? 6 : 5));
    this.event('hit', { x, y, damage, move, fighter: attacker.slot, target: target.slot, combo, color: attacker.character.color });
  }
  endRound() {
    const [a, b] = this.fighters, winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
    this.phase = 'roundEnd'; this.phaseTime = 0; this.projectiles = []; this.freeze = .08;
    this.fighters.forEach(f => {
      this.clearAction(f); f.buffer = null; f.jumpBuffer = 0; f.input = idleInput(); f.knocked = false; f.wakeTime = 0;
      f.state = f.hp <= 0 ? 'ko' : winner === f ? 'victory' : 'idle';
    });
    if (winner) { winner.wins++; winner.quoteTime = 2.75; winner.powerName = 'ROUND VENCIDO'; winner.powerQuote = winner.character.quote; }
    this.roundWinner = winner?.slot ?? null;
    this.event('roundEnd', { winner: this.roundWinner, timeout: this.timer <= 0, quote: winner?.character.quote });
  }
  togglePause() {
    if (!['intro', 'fight', 'roundEnd'].includes(this.phase)) return;
    this.paused = !this.paused; this.event('pause', { paused: this.paused });
  }
}
