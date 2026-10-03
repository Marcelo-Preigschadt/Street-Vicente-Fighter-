export const WORLD = Object.freeze({ width: 1280, height: 720, floor: 625, gravity: 1760 });
export const FIXED_STEP = 1 / 120;
export const CHARACTERS = Object.freeze({
  marcelo: { id: 'marcelo', name: 'Prof. Marcelo', quote: 'Bora NIT', color: '#b8ed68', accent: '#69daaa', speed: 255, power: 1.1, sprite: 'assets/marcelo.webp',
    // Coordinates measured from the hand/foot in the existing attack sprites.
    strikes: { punch: { near: 42, reach: 155, height: 200, h: 30 }, kick: { near: 60, reach: 201, height: 251, h: 48 } }, projectile: { offset: 154, height: 199 } },
  rafael: { id: 'rafael', name: 'Prof Rafael', quote: 'No meu tempo não era assim', color: '#ffa14c', accent: '#ffd08a', speed: 288, power: 1, sprite: 'assets/rafael.webp',
    strikes: { punch: { near: 42, reach: 153, height: 229, h: 26 }, kick: { near: 60, reach: 193, height: 238, h: 42 } }, projectile: { offset: 150, height: 214 } },
});
export const MOVES = Object.freeze({
  punch: { startup: .10, active: .105, recovery: .18, damage: 76, reach: 155, push: 225, stun: .24, meter: 9 },
  kick: { startup: .18, active: .115, recovery: .25, damage: 109, reach: 201, push: 330, stun: .31, meter: 12 },
  special: { startup: .32, active: .10, recovery: .32, damage: 176, reach: 0, push: 440, stun: .42, cost: 40, meter: 0 },
});
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const approach = (value, target, step) => value + clamp(target - value, -step, step);
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const idleInput = () => ({ left: false, right: false, down: false, jump: false, block: false });
const LEFT_WALL = 110, RIGHT_WALL = WORLD.width - 110, BODY_WIDTH = 112;

export class Fighter {
  constructor(id, slot) { this.character = CHARACTERS[id]; this.slot = slot; this.wins = 0; this.reset(); }
  reset() {
    const x = this.slot === 0 ? 360 : 920;
    Object.assign(this, { x, y: WORLD.floor, prevX: x, prevY: WORLD.floor, vx: 0, vy: 0, knockback: 0, direction: this.slot === 0 ? 1 : -1,
      hp: 1000, displayHP: 1000, meter: 50, action: null, actionTime: 0, prevActionTime: 0, actionHit: false, projectileSent: false,
      hitstun: 0, blockstun: 0, flash: 0, blockFlash: 0, combo: 0, comboTime: 0, slow: 0, state: 'idle', input: idleInput(),
      buffer: null, jumpBuffer: 0, animTime: 0, quoteTime: 0, walkTime: 0 });
  }
  get airborne() { return this.y < WORLD.floor - .01; }
  get canAct() { return this.hp > 0 && this.hitstun <= 0 && this.blockstun <= 0 && !this.action; }
  get pushHeight() { return this.state === 'crouch' ? 128 : this.state === 'jump' ? 150 : 174; }
  get hurtboxes() {
    const box = (offset, height, w, h) => ({ x: this.x + offset * this.direction - w / 2, y: this.y - height, w, h });
    if (this.state === 'crouch') return [box(25, 208, 54, 54), box(6, 154, 88, 98), box(0, 60, 114, 56)];
    if (this.state === 'jump') return [box(14, 238, 54, 58), box(0, 180, 86, 108), box(0, 72, 98, 68)];
    return [box(18, 290, 54, 62), box(0, 228, 86, 140), box(0, 88, 104, 84)];
  }
  get attackbox() {
    if (!this.action || this.action === 'special') return null;
    const strike = this.character.strikes[this.action];
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
    if (next.jump && !f.input.jump && this.phase === 'fight' && !this.paused) f.jumpBuffer = .13;
    f.input = next;
  }
  queue(slot, move) {
    if (this.phase !== 'fight' || this.paused || !MOVES[move]) return;
    this.fighters[slot].buffer = { move, life: .20 };
  }
  beginMove(f, move, cancel = false) {
    if (f.hp <= 0 || f.hitstun > 0 || f.blockstun > 0 || (f.action && !cancel) || (f.input.block && !f.airborne)
      || (move === 'special' && (f.airborne || f.meter < MOVES.special.cost))) return false;
    f.action = move; f.actionTime = 0; f.prevActionTime = 0; f.actionHit = false; f.projectileSent = false; f.state = move; f.animTime = 0;
    if (move === 'special') { f.meter -= MOVES.special.cost; f.quoteTime = 2.25; this.event('special', { fighter: f.slot, quote: f.character.quote }); }
    else this.event('swing', { move, fighter: f.slot });
    return true;
  }
  updateAI(dt) {
    const ai = this.ai, f = this.fighters[1], foe = this.fighters[0]; ai.timer -= dt; ai.actionTimer -= dt;
    if (ai.timer <= 0) {
      ai.timer = .13 + this.random() * .14;
      const dist = Math.abs(f.x - foe.x), toward = Math.sign(foe.x - f.x), threatened = foe.action && foe.action !== 'special' && dist < 220;
      const incoming = this.projectiles.some(p => p.owner !== f.slot && Math.abs(p.x - f.x) < 270);
      ai.input = idleInput();
      if ((threatened || incoming) && this.random() < .7) ai.input.block = true;
      else if (dist > 132) { ai.input.left = toward < 0; ai.input.right = toward > 0; }
      else if (this.random() < .16) { ai.input.left = toward > 0; ai.input.right = toward < 0; }
      if (incoming && !ai.input.block && this.random() < .45) ai.input.jump = true;
      if (dist < 210 && this.random() < .12) ai.input.jump = true;
      if (!ai.input.block && ai.actionTimer <= 0 && f.canAct) {
        if (f.meter >= 40 && dist > 230 && dist < 730 && this.random() < .48) { this.queue(1, 'special'); ai.actionTimer = 1.1; }
        else if (dist < 190) { this.queue(1, dist > 125 || this.random() > .5 ? 'kick' : 'punch'); ai.actionTimer = .42 + this.random() * .38; }
      }
    }
    this.setInput(1, ai.input);
  }
  update(dt) {
    // Subdivide caller delays as well: collisions and gravity behave identically at 30/60/120 Hz.
    let remaining = Math.min(Math.max(0, dt), .1);
    while (remaining > 1e-9) { const step = Math.min(FIXED_STEP, remaining); this.step(step); remaining -= step; }
  }
  step(dt) {
    if (this.paused || this.phase === 'selection' || this.phase === 'result') return;
    for (const f of this.fighters) { f.prevX = f.x; f.prevY = f.y; f.prevActionTime = f.actionTime; }
    for (const p of this.projectiles) p.prevX = p.x;
    // Keep buffered commands alive through the short impact pause.
    if (this.freeze > 0) { this.freeze = Math.max(0, this.freeze - dt); return; }
    this.phaseTime += dt; this.time += dt;
    if (this.phase === 'intro') {
      this.fighters.forEach(f => { f.animTime += dt; });
      if (this.phaseTime >= 2.35) { this.phase = 'fight'; this.phaseTime = 0; this.event('fight'); } return;
    }
    if (this.phase === 'roundEnd') {
      this.fighters.forEach(f => { f.animTime += dt; this.integrate(f, dt); });
      if (this.phaseTime >= 3) {
        if (this.fighters.some(f => f.wins >= 2)) {
          this.phase = 'result'; this.event('result', { winner: this.fighters.find(f => f.wins >= 2).slot });
        } else { this.round++; this.newRound(); }
      } return;
    }
    this.timer = Math.max(0, this.timer - dt);
    if (this.cpu) this.updateAI(dt);
    for (const f of this.fighters) this.updateFighter(f, dt);
    this.resolvePushboxes();
    for (const f of this.fighters) {
      if (f.state === 'walk') f.walkTime += Math.abs(f.x - f.prevX) / f.character.speed;
    }
    const contacts = [];
    for (const f of this.fighters) {
      if (!f.action || f.actionHit || f.action === 'special') continue;
      const m = MOVES[f.action];
      if (f.actionTime >= m.startup && f.actionTime < m.startup + m.active) {
        const target = this.fighters[1 - f.slot], strike = f.attackbox;
        const body = target.hurtboxes.find(box => overlaps(strike, box));
        if (body && target.hp > 0) {
          f.actionHit = true;
          contacts.push({ attacker: f, target, move: f.action, x: clamp(f.x + f.direction * f.character.strikes[f.action].reach, body.x, body.x + body.w),
            y: clamp(strike.y + strike.h / 2, body.y, body.y + body.h) });
        }
      }
    }
    for (const p of this.projectiles) {
      const previousX = p.x; p.x += p.direction * p.speed * dt; p.life -= dt;
      const target = this.fighters[1 - p.owner];
      // Sweep relative to the moving target, preventing tunneling in either direction.
      const relativeStart = previousX - target.prevX, relativeEnd = p.x - target.x;
      const body = target.hurtboxes.find(box => {
        const left = box.x - target.x, right = left + box.w;
        return Math.min(relativeStart, relativeEnd) - p.radius < right && Math.max(relativeStart, relativeEnd) + p.radius > left
          && p.y + p.radius > box.y && p.y - p.radius < box.y + box.h;
      });
      if (body && target.hp > 0) {
        contacts.push({ attacker: this.fighters[p.owner], target, move: 'special', x: clamp(p.x, body.x, body.x + body.w), y: p.y, direction: p.direction }); p.life = 0;
      }
    }
    // Snapshot guard before processing contacts so simultaneous attacks trade fairly.
    const guard = this.fighters.map(f => f.state === 'block' || (f.state === 'crouch' && f.input.block));
    const facing = this.fighters.map(f => f.direction);
    for (const c of contacts) this.hit(c, guard[c.target.slot], facing[c.target.slot]);
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > -90 && p.x < WORLD.width + 90);
    if (this.fighters.some(f => f.hp <= 0) || this.timer <= 0) this.endRound();
  }
  updateFighter(f, dt) {
    const opponent = this.fighters[1 - f.slot]; f.animTime += dt;
    for (const timer of ['flash', 'blockFlash', 'hitstun', 'blockstun', 'quoteTime', 'slow', 'comboTime']) f[timer] = Math.max(0, f[timer] - dt);
    if (f.comboTime <= 0) f.combo = 0;
    f.displayHP += (f.hp - f.displayHP) * (1 - Math.exp(-dt * 6));
    f.meter = Math.min(100, f.meter + dt * 1.8);
    if (!f.action && f.hitstun <= 0 && !f.airborne) f.direction = opponent.x >= f.x ? 1 : -1;
    if (f.action) {
      f.actionTime += dt;
      const m = MOVES[f.action];
      if (f.action === 'special' && f.actionTime >= m.startup && !f.projectileSent) {
        f.projectileSent = true;
        const { offset, height } = f.character.projectile, x = f.x + f.direction * offset;
        this.projectiles.push({ owner: f.slot, character: f.character.id, direction: f.direction, x, prevX: x, y: f.y - height, radius: 28, speed: 585, life: 2.5 });
      }
      if (f.actionTime >= m.startup + m.active + m.recovery) { f.action = null; f.actionTime = 0; }
    }
    const movement = Number(f.input.right) - Number(f.input.left);
    const block = f.input.block && !f.airborne, crouch = f.input.down && !f.airborne;
    if (f.jumpBuffer > 0 && f.canAct && !f.airborne && !block) {
      f.vy = -990; f.y -= .02; f.vx = movement * f.character.speed * (f.slow > 0 ? .65 : 1);
      f.jumpBuffer = 0; this.event('jump', { fighter: f.slot });
    } else f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
    if (f.buffer) {
      const cancel = f.action === 'punch' && f.actionHit && f.buffer.move !== 'punch' && f.actionTime >= MOVES.punch.startup + MOVES.punch.active;
      if (this.beginMove(f, f.buffer.move, cancel)) f.buffer = null;
      else { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
    }
    if (f.hp <= 0) f.state = 'ko';
    else if (f.hitstun > 0) { f.state = 'hit'; f.vx = approach(f.vx, 0, 4200 * dt); }
    else if (f.blockstun > 0) { f.state = crouch ? 'crouch' : 'block'; f.vx = approach(f.vx, 0, 4200 * dt); }
    else if (f.action) { f.state = f.action; if (!f.airborne) f.vx = approach(f.vx, 0, 3200 * dt); }
    else {
      const speed = f.character.speed * (f.slow > 0 ? .65 : 1), target = crouch || block ? 0 : movement * speed;
      const acceleration = f.airborne ? 780 : target === 0 ? 4200 : 3000;
      f.vx = approach(f.vx, target, acceleration * dt);
      f.state = f.airborne ? 'jump' : block ? 'block' : crouch ? 'crouch' : Math.abs(f.vx) > 8 ? 'walk' : 'idle';
    }
    this.integrate(f, dt);
    if (!f.airborne && f.state === 'jump') f.state = Math.abs(f.vx) > 8 ? 'walk' : 'idle';
  }
  integrate(f, dt) {
    const wasAirborne = f.airborne;
    f.x = clamp(f.x + (f.vx + f.knockback) * dt, LEFT_WALL, RIGHT_WALL);
    if (f.airborne || f.vy < 0) { f.y += f.vy * dt + .5 * WORLD.gravity * dt * dt; f.vy += WORLD.gravity * dt; }
    if (f.y >= WORLD.floor) {
      f.y = WORLD.floor; f.vy = 0;
      if (wasAirborne) this.event('land', { fighter: f.slot, x: f.x });
    }
    f.knockback *= Math.exp(-dt * 9);
    if (Math.abs(f.knockback) < .5) f.knockback = 0;
    if (this.phase === 'roundEnd') f.vx = approach(f.vx, 0, 3200 * dt);
  }
  resolvePushboxes() {
    const [a, b] = this.fighters;
    const verticalOverlap = (ay, by) => ay > by - b.pushHeight && by > ay - a.pushHeight;
    if (!verticalOverlap(a.y, b.y)) return;
    // Preserve ground order across fast movement; a jump can cross above the opponent.
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
  hit({ attacker, target, move, x, y, direction = attacker.direction }, guarding = false, facing = target.direction) {
    const m = MOVES[move], front = direction === -facing;
    const blocked = guarding && front && target.hitstun <= 0;
    if (blocked) {
      const chip = move === 'special' ? Math.round(m.damage * .1) : 0;
      target.hp = Math.max(1, target.hp - chip); target.knockback = direction * m.push * .45; target.blockFlash = .15; target.blockstun = move === 'special' ? .16 : .10;
      target.meter = Math.min(100, target.meter + 5); attacker.meter = Math.min(100, attacker.meter + 3);
      this.freeze = Math.max(this.freeze, .025); this.event('block', { x, y, fighter: target.slot }); return;
    }
    const damage = Math.round(m.damage * attacker.character.power * (target.airborne ? .93 : 1));
    target.hp = Math.max(0, target.hp - damage); target.knockback = direction * m.push; target.hitstun = m.stun; target.flash = .11;
    target.action = null; target.buffer = null; target.state = target.hp <= 0 ? 'ko' : 'hit';
    attacker.meter = Math.min(100, attacker.meter + m.meter); target.meter = Math.min(100, target.meter + 6);
    attacker.combo = attacker.comboTime > 0 ? attacker.combo + 1 : 1; attacker.comboTime = 1.25;
    if (move === 'special' && attacker.character.id === 'rafael') target.slow = 1.5;
    this.freeze = Math.max(this.freeze, move === 'special' ? .05 : .033);
    this.event('hit', { x, y, damage, move, fighter: attacker.slot, target: target.slot, combo: attacker.combo, color: attacker.character.color });
  }
  endRound() {
    const [a, b] = this.fighters;
    const winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
    this.phase = 'roundEnd'; this.phaseTime = 0; this.projectiles = []; this.freeze = .08;
    this.fighters.forEach(f => { f.action = null; f.buffer = null; f.jumpBuffer = 0; f.input = idleInput(); f.state = f.hp <= 0 ? 'ko' : winner === f ? 'victory' : 'idle'; });
    if (winner) { winner.wins++; winner.quoteTime = 2.75; }
    this.roundWinner = winner?.slot ?? null;
    this.event('roundEnd', { winner: this.roundWinner, timeout: this.timer <= 0, quote: winner?.character.quote });
  }
  togglePause() {
    if (!['intro', 'fight', 'roundEnd'].includes(this.phase)) return;
    this.paused = !this.paused; this.event('pause', { paused: this.paused });
  }
}
