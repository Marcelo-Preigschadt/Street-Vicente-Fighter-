import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, FIXED_STEP, COMBAT, MOVES, CHARACTERS, fighterPose } from '../src/engine.js';
import { WALK_STRIDE, WALK_FRAMES, walkingFrame } from '../src/walk.js';
import { FOOTWORK } from '../src/motion.js';
import { MOTION_HURT } from '../src/motion-data.js';
import { SuperEffects } from '../src/super-fx.js';

function scene() {
  const events = [], g = new FightEngine({ onEvent: e => events.push(e) });
  g.start('marcelo', 'local'); g.phase = 'fight';
  g.fighters[0].x = 260; g.fighters[1].x = 1020;
  return { g, events };
}
const step = g => g.update(FIXED_STEP);
const advance = (g, n) => { for (let i = 0; i < n; i++) step(g); };

test('a passada avança pela distância real, inverte ao recuar e para ao soltar', () => {
  for (const slot of [0, 1]) {
    const { g } = scene(), f = g.fighters[slot], toward = f.direction;
    const input = sign => ({ right: sign > 0, left: sign < 0 });
    g.setInput(slot, input(toward)); const start = f.x; advance(g, 20);
    assert.ok(Math.abs(f.walkDistance - (f.x - start) * toward) < 1e-8);
    const phase = f.walkDistance; g.setInput(slot, input(-toward)); const turn = f.x; advance(g, 10);
    assert.ok(f.walkDistance < phase); assert.ok(Math.abs(f.walkDistance - phase - (f.x - turn) * toward) < 1e-8);
    g.setInput(slot, {}); const distance = f.walkDistance; advance(g, 15);
    assert.equal(f.walkDistance, distance); assert.equal(f.walkBlend, 0);
  }
});

test('o ciclo não corre contra paredes nem contra um adversário encostado no canto', () => {
  for (const sign of [-1, 1]) {
    const { g } = scene(), f = g.fighters[0]; f.x = sign < 0 ? COMBAT.leftWall : COMBAT.rightWall;
    g.fighters[1].x = sign < 0 ? 800 : 400;
    g.setInput(0, { left: sign < 0, right: sign > 0 }); advance(g, 60);
    assert.equal(f.walkDistance, 0); assert.equal(f.walkBlend, 0);
  }
  const { g } = scene(); g.fighters[0].x = COMBAT.rightWall - 112; g.fighters[1].x = COMBAT.rightWall;
  g.setInput(0, { right: true }); advance(g, 60);
  assert.equal(g.fighters[0].walkDistance, 0); assert.equal(g.fighters[0].walkBlend, 0);
});

test('poses completas avançam e invertem pela distância, sem variar quando o corpo para', () => {
  for (let i = 0; i < WALK_FRAMES; i++) {
    assert.equal(walkingFrame(i * WALK_STRIDE / WALK_FRAMES + 1), i);
    assert.equal(walkingFrame((i - WALK_FRAMES) * WALK_STRIDE / WALK_FRAMES + 1), i);
  }
  assert.equal(walkingFrame(WALK_STRIDE), 0);
  assert.equal(walkingFrame(-1), WALK_FRAMES - 1);
});

test('cada pose completa usa as mesmas áreas vulneráveis no desenho e no combate', () => {
  for (const id of Object.keys(CHARACTERS)) {
    const { g } = scene(); g.start(id, 'local'); const f = g.fighters[0];
    f.state = 'walk'; f.walkBlend = 1;
    for (let index = 0; index < WALK_FRAMES; index++) {
      f.walkDistance = index * FOOTWORK[id].stride / WALK_FRAMES + 1;
      assert.deepEqual(fighterPose(f), { atlas: 'motion', index });
      for (const direction of [-1, 1]) {
        f.direction = direction;
        const expected = MOTION_HURT[id][index].map(([x, h, w, height]) => ({
          x: f.x + (direction > 0 ? x : -x - w), y: f.y - h, w, h: height,
        }));
        assert.deepEqual(f.hurtboxes, expected);
      }
    }
    f.state = 'idle'; f.walkBlend = 0;
    assert.equal(fighterPose(f).atlas, 'reaction');
  }
});

test('carga cheia avisa uma vez por carga, em acertos e bloqueios dos dois slots', () => {
  for (const blocked of [false, true]) {
    const { g, events } = scene(), [a, b] = g.fighters;
    a.meter = blocked ? 96 : 92; b.meter = blocked ? 95 : 93;
    const guard = { active: blocked, low: false, direction: -1 };
    const hit = () => g.hit({ attacker: a, target: b, move: 'punch', data: MOVES.punch, x: b.x, y: b.y - 200 }, guard);
    hit(); assert.deepEqual(events.filter(e => e.type === 'superReady').map(e => e.fighter).sort(), [0, 1]);
    hit(); assert.equal(events.filter(e => e.type === 'superReady').length, 2);
    a.meter = 0; g.addMeter(a, 100); assert.equal(events.filter(e => e.type === 'superReady' && e.fighter === 0).length, 2);
  }
});

test('super sem barra não gasta energia nem inicia efeito ou congelamento', () => {
  const { g, events } = scene(); g.fighters[0].meter = 99; g.queue(0, 'super'); advance(g, 20);
  assert.equal(g.fighters[0].meter, 99); assert.equal(g.freeze, 0);
  assert.equal(events.some(e => e.type === 'superStart'), false);
});

test('o super congela ambos os lutadores, projéteis e cronômetro antes do lançamento', () => {
  for (const slot of [0, 1]) {
    const { g, events } = scene(), f = g.fighters[slot], other = g.fighters[1 - slot];
    f.meter = 100; g.setInput(1 - slot, { left: true });
    g.projectiles.push({ owner: 1 - slot, character: other.character.id, move: 'special', data: MOVES.special,
      x: 640, prevX: 640, y: 425, direction: -1, radius: 27, speed: 500, life: 2 });
    const positions = g.fighters.map(f => [f.x, f.y]), timer = g.timer;
    g.queue(slot, 'super'); step(g);
    assert.equal(f.meter, 0); assert.equal(f.actionTime, 0); assert.equal(g.freeze, COMBAT.superFreeze);
    assert.deepEqual(g.fighters.map(f => [f.x, f.y]), positions); assert.equal(g.timer, timer); assert.equal(g.projectiles[0].x, 640);
    advance(g, 20);
    assert.equal(f.actionTime, 0); assert.deepEqual(g.fighters.map(f => [f.x, f.y]), positions);
    assert.equal(g.projectiles[0].x, 640); assert.equal(g.timer, timer);
    assert.equal(events.filter(e => e.type === 'superStart').length, 1);
    assert.equal(events.some(e => e.type === 'special'), false);
    advance(g, 55);
    assert.equal(events.filter(e => e.type === 'special' && e.move === 'super').length, 1);
    assert.equal(events.filter(e => e.type === 'projectile' && e.move === 'super').length, 3);
  }
});

test('dois supers no mesmo tick gastam as barras uma vez e compartilham a pausa', () => {
  const { g, events } = scene(); g.fighters.forEach(f => f.meter = 100);
  g.queue(0, 'super'); g.queue(1, 'super'); step(g);
  assert.equal(events.filter(e => e.type === 'superStart').length, 2); assert.equal(g.freeze, COMBAT.superFreeze);
  assert.deepEqual(g.fighters.map(f => f.meter), [0, 0]);
  advance(g, 8); assert.equal(events.filter(e => e.type === 'superStart').length, 2);
});

test('efeitos avançam durante a pausa do super, param no pause e limpam ao mudar de round', () => {
  const fx = new SuperEffects();
  fx.event({ type: 'superReady', fighter: 0 }); fx.event({ type: 'superReady', fighter: 1 });
  fx.event({ type: 'superStart', fighter: 0, freeze: COMBAT.superFreeze });
  assert.equal(fx.ready.length, 1); assert.equal(fx.bursts.length, 1);
  fx.update(.1); assert.equal(fx.bursts[0].age, .1); fx.update(0); assert.equal(fx.bursts[0].age, .1);
  fx.update(.5); assert.equal(fx.bursts.length, 0);
  fx.event({ type: 'round' }); assert.equal(fx.ready.length, 0);
  fx.event({ type: 'superStart', fighter: 1, freeze: COMBAT.superFreeze }); fx.event({ type: 'selection' });
  assert.equal(fx.bursts.length, 0);
});

test('só o impacto de super recebe o efeito especial de tela e ele se encerra', () => {
  const fx = new SuperEffects();fx.event({type:'hit',move:'punch'});fx.event({type:'block',move:'super'});
  assert.equal(fx.impacts.length,0);
  fx.event({type:'hit',move:'super',x:600,y:430,color:'#b8ed68'});assert.equal(fx.impacts.length,1);
  fx.update(.1);assert.equal(fx.impacts[0].age,.1);fx.update(.12);assert.equal(fx.impacts.length,0);
});
