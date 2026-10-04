import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, FIXED_STEP, WORLD } from '../src/engine.js';

function scene() {
  const events = [], game = new FightEngine({ onEvent: e => events.push(e) });
  game.start('marcelo', 'local'); game.phase = 'fight'; game.phaseTime = 0;
  game.fighters[0].x = 450; game.fighters[1].x = 580;
  return { game, events };
}
const step = game => game.update(FIXED_STEP);
const advance = (game, seconds) => { for (let i = 0; i < Math.round(seconds / FIXED_STEP); i++) step(game); };
function until(game, condition, seconds = 3) {
  for (let i = 0; i < seconds / FIXED_STEP && !condition(); i++) step(game);
  assert.ok(condition(), 'a situação de combate deve acontecer');
}
const hits = events => events.filter(e => e.type === 'hit');

test('andar, soltar e inverter o direcional respondem no próximo tick para ambos os professores', () => {
  for (const slot of [0, 1]) {
    const { game } = scene(); game.fighters[0].x = 200; game.fighters[1].x = 1080;
    const fighter = game.fighters[slot], sign = slot === 0 ? 1 : -1;
    const start = fighter.x;
    game.setInput(slot, { right: sign > 0, left: sign < 0 }); step(game);
    assert.ok((fighter.x - start) * sign >= 3);
    const moving = fighter.x;
    game.setInput(slot, {}); step(game); assert.equal(fighter.x, moving); assert.equal(fighter.vx, 0);
    game.setInput(slot, { right: sign > 0, left: sign < 0 }); step(game);
    const reversing = fighter.x;
    game.setInput(slot, { left: sign > 0, right: sign < 0 }); step(game);
    assert.ok((fighter.x - reversing) * sign < 0);
  }
});

test('segurar para trás perto de um golpe prepara a guarda antes do contato', () => {
  const { game, events } = scene(), target = game.fighters[1], start = target.x;
  game.setInput(1, { right: true }); game.queue(0, 'punch'); advance(game, .05);
  assert.equal(target.state, 'block'); assert.equal(target.x, start);
  until(game, () => events.some(e => e.type === 'block')); assert.equal(target.hp, 1000);
});

test('um golpe que passou por cima não impede recuar durante o recolhimento', () => {
  const { game, events } = scene(); game.fighters[1].x = 700;
  game.setInput(1, { right: true, down: true }); game.queue(0, 'kick');
  until(game, () => game.fighters[0].movePhase === 'recovery'); assert.equal(hits(events).length, 0);
  const position = game.fighters[1].x;
  game.setInput(1, { right: true }); step(game);
  assert.ok(game.fighters[1].x > position); assert.equal(game.fighters[1].state, 'walk');
});

test('pulo e chute pressionados juntos produzem um único ataque aéreo após a preparação', () => {
  const { game, events } = scene(); game.fighters[1].x = 1000;
  game.setInput(0, { jump: true, right: true }); game.queue(0, 'kick'); advance(game, .025);
  assert.equal(game.fighters[0].airborne, false); assert.equal(hits(events).length, 0);
  advance(game, .035);
  assert.equal(game.fighters[0].action, 'airKick'); assert.ok(game.fighters[0].airborne);
  assert.deepEqual(events.filter(e => e.type === 'swing').map(e => e.move), ['airKick']);
});

test('salto neutro completa o arco em quarenta quadros sem prolongar a descida', () => {
  const { game, events } = scene(); game.fighters[1].x = 1000;
  game.setInput(0, { jump: true }); let height = 0, takeoff;
  until(game, () => events.some(e => e.type === 'jump')); takeoff = game.time; game.setInput(0, {});
  while (!events.some(e => e.type === 'land')) { step(game); height = Math.max(height, WORLD.floor - game.fighters[0].y); }
  assert.ok(height > 225 && height < 250);
  assert.ok(game.time - takeoff >= 39 / 60 && game.time - takeoff <= 41 / 60);
});

test('segurar para cima repete o salto depois de pousar; cima e baixo juntos não pulam', () => {
  const { game, events } = scene(); game.fighters[1].x = 1000;
  game.setInput(0, { jump: true }); advance(game, 1.1);
  assert.equal(events.filter(e => e.type === 'jump').length, 2);
  const other = scene(); other.game.setInput(0, { jump: true, down: true }); advance(other.game, .5);
  assert.equal(other.events.some(e => e.type === 'jump'), false); assert.equal(other.game.fighters[0].y, WORLD.floor);
});

test('rasteira acerta no alcance do pé e falha fora dele, espelhada e nas três forças', () => {
  for (const slot of [0, 1]) for (const strength of [0, 1, 2]) for (const distance of [295, 330]) {
    const { game, events } = scene(); game.fighters[0].x = 450; game.fighters[1].x = 450 + distance;
    game.setInput(slot, { down: true }); game.queue(slot, 'kick', strength); advance(game, .35);
    assert.equal(hits(events).length, distance === 295 ? 1 : 0, `lado ${slot}, força ${strength}, distância ${distance}`);
    assert.equal(game.fighters[1 - slot].knocked, distance === 295);
  }
});

test('saltar antes da rasteira retira as pernas da faixa de contato', () => {
  const { game, events } = scene(); game.fighters[1].x = 650;
  game.setInput(1, { jump: true }); advance(game, .16); game.setInput(1, {});
  game.setInput(0, { down: true }); game.queue(0, 'kick'); advance(game, .4);
  assert.equal(hits(events).length, 0); assert.equal(game.fighters[1].hp, 1000);
});

test('a rasteira não causa dano durante preparação ou recolhimento da perna', () => {
  const { game, events } = scene(); game.fighters[1].x = 1000;
  game.setInput(0, { down: true }); game.queue(0, 'kick'); advance(game, .05);
  assert.equal(game.fighters[0].attackbox, null);
  advance(game, .2); assert.equal(game.fighters[0].movePhase, 'recovery');
  game.fighters[1].x = game.fighters[0].x + 180; advance(game, .3);
  assert.equal(hits(events).length, 0); assert.equal(game.fighters[1].hp, 1000);
});

test('a perna estendida é vulnerável: rasteiras simultâneas podem se encontrar fora dos corpos', () => {
  const alone = scene(); alone.game.fighters[1].x = 780;
  alone.game.setInput(0, { down: true }); alone.game.queue(0, 'kick'); advance(alone.game, .3);
  assert.equal(hits(alone.events).length, 0);
  const { game, events } = scene(); game.fighters[1].x = 780;
  for (const slot of [0, 1]) { game.setInput(slot, { down: true }); game.queue(slot, 'kick'); }
  advance(game, .3); assert.equal(hits(events).length, 2); assert.ok(game.fighters.every(f => f.hp < 1000));
});

test('rasteira bloqueada deixa tempo para o oponente punir a recuperação', () => {
  const { game, events } = scene(); game.setInput(0, { down: true }); game.setInput(1, { block: true, down: true });
  game.queue(0, 'kick'); until(game, () => events.some(e => e.type === 'block'));
  until(game, () => game.fighters[1].blockstun <= 0);
  assert.equal(game.fighters[0].action, 'sweep');
  game.setInput(1, { down: true }); game.queue(1, 'punch', 0);
  until(game, () => hits(events).some(e => e.fighter === 1));
  assert.ok(game.fighters[0].hp < 1000);
});

test('um golpe recebido agachado conserva a postura e a altura das áreas vulneráveis', () => {
  const { game, events } = scene(); game.setInput(0, { down: true }); game.setInput(1, { down: true });
  game.queue(0, 'punch'); until(game, () => hits(events).length > 0);
  const target = game.fighters[1]; assert.equal(target.state, 'hit'); assert.equal(target.crouching, true);
  assert.ok(target.hurtboxes.every(box => box.y >= WORLD.floor - 220));
});

test('soco comum que acerta alguém no ar interrompe o salto e provoca a queda', () => {
  const { game, events } = scene(); game.setInput(1, { jump: true }); advance(game, .44); game.setInput(1, {});
  game.queue(0, 'punch'); until(game, () => hits(events).length > 0);
  assert.equal(hits(events)[0].move, 'punch'); assert.equal(game.fighters[1].knocked, true);
});

test('depois da reação ao golpe o recuo termina e ninguém continua deslizando', () => {
  const { game, events } = scene(); game.queue(0, 'punch'); until(game, () => hits(events).length > 0);
  until(game, () => game.fighters[1].hitstun <= 0);
  const position = game.fighters[1].x; assert.equal(game.fighters[1].knockback, 0);
  advance(game, .3); assert.equal(game.fighters[1].x, position);
});

test('no canto o recuo que não cabe na vítima afasta quem bateu, nos dois lados', () => {
  for (const side of ['left', 'right']) {
    const { game, events } = scene(), victim = side === 'right' ? 1 : 0, attacker = 1 - victim;
    const wall = side === 'right' ? 1170 : 110;
    game.fighters[victim].x = wall; game.fighters[attacker].x = wall + (side === 'right' ? -180 : 180);
    const start = game.fighters[attacker].x; game.queue(attacker, 'punch'); until(game, () => hits(events).length > 0); advance(game, .6);
    assert.equal(game.fighters[victim].x, wall);
    assert.ok((game.fighters[attacker].x - start) * (side === 'right' ? -1 : 1) > 25);
  }
});

test('corpos não atravessam um ao outro nem as paredes quando os dois avançam', () => {
  const { game } = scene(); game.setInput(0, { right: true }); game.setInput(1, { left: true });
  for (let i = 0; i < 600; i++) {
    step(game); const [a, b] = game.fighters;
    assert.ok(b.x - a.x >= 112 - 1e-8); assert.ok(a.x >= 110 && b.x <= 1170);
  }
});

test('passar por cima e pousar troca o lado sem deslocar o corpo de uma vez', () => {
  const { game, events } = scene(); game.fighters[1].x = 562;
  game.setInput(0, { right: true, jump: true }); advance(game, .1); game.setInput(0, {});
  let previous = game.fighters.map(f => f.x);
  until(game, () => {
    game.fighters.forEach((f, i) => assert.ok(Math.abs(f.x - previous[i]) < 16));
    previous = game.fighters.map(f => f.x); return events.some(e => e.type === 'land');
  });
  assert.ok(game.fighters[0].x > game.fighters[1].x); assert.equal(game.fighters[0].direction, -1);
});

test('o antiaéreo conserva a recuperação depois de tocar o chão', () => {
  const { game, events } = scene(); game.fighters[1].x = 1000; game.queue(0, 'uppercut');
  until(game, () => events.some(e => e.type === 'land')); assert.ok(game.fighters[0].landing > .1);
  game.queue(0, 'punch'); advance(game, .1);
  assert.equal(game.fighters[0].action, null); assert.equal(events.filter(e => e.type === 'swing').length, 0);
});

test('ao terminar de levantar é possível receber um golpe, com proteção apenas contra agarrão', () => {
  const { game, events } = scene(); game.setInput(0, { down: true }); game.queue(0, 'kick');
  until(game, () => game.fighters[1].wakeTime > 0); game.setInput(0, {});
  until(game, () => game.fighters[1].wakeTime <= .06);
  game.queue(0, 'punch', 0); until(game, () => hits(events).some(e => e.move === 'punch'));
  assert.ok(game.fighters[1].throwInvincible > 0); assert.equal(game.fighters[1].invincible, 0);
});
