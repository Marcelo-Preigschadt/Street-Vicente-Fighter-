export const WORLD = Object.freeze({ width: 1280, height: 720, floor: 625, gravity: 1760 });
export const CHARACTERS = Object.freeze({
  marcelo: { id: 'marcelo', name: 'Prof. Marcelo', quote: 'Bora NIT', color: '#b8ed68', accent: '#69daaa', speed: 255, power: 1.1, sprite: 'assets/marcelo.webp' },
  rafael: { id: 'rafael', name: 'Prof Rafael', quote: 'No meu tempo não era assim', color: '#ffa14c', accent: '#ffd08a', speed: 288, power: 1, sprite: 'assets/rafael.webp' },
});
export const MOVES = Object.freeze({
  punch: { startup: .10, active: .105, recovery: .23, damage: 76, reach: 149, push: 225, stun: .24, meter: 9 },
  kick: { startup: .18, active: .115, recovery: .32, damage: 109, reach: 196, push: 330, stun: .31, meter: 12 },
  special: { startup: .32, active: .10, recovery: .40, damage: 176, reach: 0, push: 440, stun: .42, cost: 40, meter: 0 },
});
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const idleInput = () => ({ left: false, right: false, down: false, jump: false, block: false });

export class Fighter {
  constructor(id, slot) { this.character = CHARACTERS[id]; this.slot = slot; this.wins = 0; this.reset(); }
  reset() {
    Object.assign(this, { x: this.slot === 0 ? 360 : 920, y: WORLD.floor, vx: 0, vy: 0, direction: this.slot === 0 ? 1 : -1,
      hp: 1000, displayHP: 1000, meter: 50, action: null, actionTime: 0, actionHit: false, projectileSent: false,
      hitstun: 0, flash: 0, blockFlash: 0, combo: 0, comboTime: 0, slow: 0, state: 'idle', input: idleInput(),
      buffer: null, jumpHeld: false, animTime: 0, quoteTime: 0, walkTime: 0 });
  }
  get airborne() { return this.y < WORLD.floor - 1; }
  get canAct() { return this.hp > 0 && this.hitstun <= 0 && !this.action; }
  get hurtbox() {
    const crouch = this.state === 'crouch';
    return { x: this.x - 37, y: this.y - (crouch ? 133 : 255), w: 74, h: crouch ? 128 : 250 };
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
  setInput(slot, input) { this.fighters[slot].input = { ...idleInput(), ...input }; }
  queue(slot, move) {
    if (this.phase !== 'fight' || this.paused || !MOVES[move]) return;
    const f = this.fighters[slot]; f.buffer = { move, life: .16 };
  }
  beginMove(f, move) {
    if (!f.canAct || (f.input.block && !f.airborne) || (move === 'special' && (f.airborne || f.meter < MOVES.special.cost))) return false;
    f.action = move; f.actionTime = 0; f.actionHit = false; f.projectileSent = false; f.state = move; f.animTime = 0;
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
        if (f.meter >= 40 && dist > 200 && dist < 730 && this.random() < .48) { this.queue(1, 'special'); ai.actionTimer = 1.1; }
        else if (dist < 190) { this.queue(1, dist > 125 || this.random() > .5 ? 'kick' : 'punch'); ai.actionTimer = .42 + this.random() * .38; }
      }
    }
    this.setInput(1, ai.input);
  }
  update(dt) {
    if (this.paused || this.phase === 'selection' || this.phase === 'result') return;
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
    const contacts = [];
    for (const f of this.fighters) {
      if (!f.action || f.actionHit || f.action === 'special') continue;
      const m = MOVES[f.action];
      if (f.actionTime >= m.startup && f.actionTime <= m.startup + m.active) {
        const target = this.fighters[1 - f.slot];
        const horizontal = (target.x - f.x) * f.direction;
        const attackY = f.y - (f.action === 'kick' ? 140 : 185), box = target.hurtbox;
        if (horizontal > -12 && horizontal < m.reach && attackY >= box.y - 8 && attackY <= box.y + box.h + 8) {
          f.actionHit = true; contacts.push({ attacker: f, target, move: f.action, x: f.x + f.direction * Math.min(horizontal, m.reach), y: attackY });
        }
      }
    }
    for (const p of this.projectiles) {
      const previousX = p.x; p.x += p.direction * p.speed * dt; p.life -= dt;
      const target = this.fighters[1 - p.owner], box = target.hurtbox;
      const near = Math.min(previousX, p.x) - p.radius <= box.x + box.w && Math.max(previousX, p.x) + p.radius >= box.x;
      if (near && p.y + p.radius >= box.y && p.y - p.radius <= box.y + box.h && target.hp > 0) {
        contacts.push({ attacker: this.fighters[p.owner], target, move: 'special', x: p.x, y: p.y, direction: p.direction }); p.life = 0;
      }
    }
    // Snapshot defending and direction before processing hits so simultaneous hits trade fairly.
    const guard = this.fighters.map(f => f.state === 'block' || (f.state === 'crouch' && f.input.block));
    const facing = this.fighters.map(f => f.direction);
    for (const c of contacts) this.hit(c, guard[c.target.slot], facing[c.target.slot]);
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > -90 && p.x < WORLD.width + 90);
    if (this.fighters.some(f => f.hp <= 0) || this.timer <= 0) this.endRound();
  }
  updateFighter(f, dt) {
    const opponent = this.fighters[1 - f.slot]; f.animTime += dt;
    f.flash = Math.max(0, f.flash - dt); f.blockFlash = Math.max(0, f.blockFlash - dt);
    f.hitstun = Math.max(0, f.hitstun - dt); f.quoteTime = Math.max(0, f.quoteTime - dt); f.slow = Math.max(0, f.slow - dt);
    f.comboTime = Math.max(0, f.comboTime - dt); if (f.comboTime <= 0) f.combo = 0;
    f.displayHP += (f.hp - f.displayHP) * Math.min(1, dt * 6);
    f.meter = Math.min(100, f.meter + dt * 1.8);
    if (!f.action && f.hitstun <= 0) f.direction = opponent.x >= f.x ? 1 : -1;
    if (f.buffer) {
      if (this.beginMove(f, f.buffer.move)) f.buffer = null;
      else { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
    }
    if (f.action) {
      f.actionTime += dt;
      const m = MOVES[f.action];
      if (f.action === 'special' && f.actionTime >= m.startup && !f.projectileSent) {
        f.projectileSent = true;
        this.projectiles.push({ owner: f.slot, character: f.character.id, direction: f.direction, x: f.x + f.direction * 75, y: f.y - 172, radius: 28, speed: 585, life: 2.5 });
      }
      if (f.actionTime > m.startup + m.active + m.recovery) { f.action = null; f.actionTime = 0; }
    }
    if (f.hp <= 0) f.state = 'ko';
    else if (f.hitstun > 0) f.state = 'hit';
    else if (f.action) { f.state = f.action; if (!f.airborne) f.vx *= Math.max(0, 1 - dt * 14); }
    else {
      const crouch = f.input.down && !f.airborne, block = f.input.block && !f.airborne;
      const movement = Number(f.input.right) - Number(f.input.left);
      f.vx = crouch || block ? 0 : movement * f.character.speed * (f.slow > 0 ? .65 : 1);
      if (f.input.jump && !f.jumpHeld && !f.airborne && !block) { f.vy = -870; f.y -= 2; this.event('jump', { fighter: f.slot }); }
      f.state = f.airborne ? 'jump' : block ? 'block' : crouch ? 'crouch' : movement ? 'walk' : 'idle';
      if (f.state === 'walk') f.walkTime += dt;
    }
    f.jumpHeld = f.input.jump;
    this.integrate(f, dt);
  }
  integrate(f, dt) {
    f.x = clamp(f.x + f.vx * dt, 110, WORLD.width - 110);
    f.y += f.vy * dt; if (f.airborne || f.vy < 0) f.vy += WORLD.gravity * dt;
    if (f.y >= WORLD.floor) { f.y = WORLD.floor; f.vy = 0; }
    if (f.hitstun > 0 || this.phase === 'roundEnd') f.vx *= Math.max(0, 1 - dt * 9);
  }
  resolvePushboxes() {
    const [a, b] = this.fighters;
    if (Math.abs(a.y - b.y) > 125) return;
    const distance = Math.abs(a.x - b.x), minimum = 88;
    if (distance >= minimum) return;
    const d = a.x <= b.x ? 1 : -1, correction = (minimum - distance) / 2;
    a.x = clamp(a.x - d * correction, 110, WORLD.width - 110); b.x = clamp(b.x + d * correction, 110, WORLD.width - 110);
  }
  hit({ attacker, target, move, x, y, direction = attacker.direction }, guarding = false, facing = target.direction) {
    const m = MOVES[move], front = direction === -facing;
    const blocked = guarding && front && target.hitstun <= 0;
    if (blocked) {
      const chip = move === 'special' ? Math.round(m.damage * .1) : 0;
      target.hp = Math.max(1, target.hp - chip); target.vx = direction * m.push * .32; target.blockFlash = .15;
      target.meter = Math.min(100, target.meter + 5); attacker.meter = Math.min(100, attacker.meter + 3);
      this.freeze = .035; this.event('block', { x, y, fighter: target.slot }); return;
    }
    const damage = Math.round(m.damage * attacker.character.power * (target.airborne ? .93 : 1));
    target.hp = Math.max(0, target.hp - damage); target.vx = direction * m.push; target.hitstun = m.stun; target.flash = .11;
    target.action = null; target.buffer = null; target.state = target.hp <= 0 ? 'ko' : 'hit';
    attacker.meter = Math.min(100, attacker.meter + m.meter); target.meter = Math.min(100, target.meter + 6);
    attacker.combo = attacker.comboTime > 0 ? attacker.combo + 1 : 1; attacker.comboTime = 1.25;
    if (move === 'special' && attacker.character.id === 'rafael') target.slow = 1.5;
    this.freeze = move === 'special' ? .09 : .065;
    this.event('hit', { x, y, damage, move, fighter: attacker.slot, combo: attacker.combo, color: attacker.character.color });
  }
  endRound() {
    const [a, b] = this.fighters;
    const winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
    this.phase = 'roundEnd'; this.phaseTime = 0; this.projectiles = []; this.freeze = .12;
    this.fighters.forEach(f => { f.action = null; f.buffer = null; f.input = idleInput(); f.state = f.hp <= 0 ? 'ko' : winner === f ? 'victory' : 'idle'; });
    if (winner) { winner.wins++; winner.quoteTime = 2.75; }
    this.roundWinner = winner?.slot ?? null;
    this.event('roundEnd', { winner: this.roundWinner, timeout: this.timer <= 0, quote: winner?.character.quote });
  }
  togglePause() {
    if (!['intro', 'fight', 'roundEnd'].includes(this.phase)) return;
    this.paused = !this.paused; this.event('pause', { paused: this.paused });
  }
}
