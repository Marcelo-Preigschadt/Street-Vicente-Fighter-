import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, CHARACTERS, FIXED_STEP, fighterPose } from '../src/engine.js';
import { HURT_PROFILES } from '../src/hitboxes.js';

const ids = Object.keys(CHARACTERS);
const advance = (g, seconds) => { for (let i = 0; i < seconds / FIXED_STEP; i++) g.update(FIXED_STEP); };
function scene(slot = 0, opponent = 'marcelo') {
  const events = [], g = new FightEngine({ random: () => .6, onEvent: e => events.push(e) });
  g.start(slot === 0 ? 'gustavo' : opponent, 'local', slot === 0 ? opponent : 'gustavo');
  g.phase = 'fight'; g.fighters[0].x = 450; g.fighters[1].x = 650;
  return { g, events, f: g.fighters[slot], target: g.fighters[1 - slot] };
}

test('os seis confrontos do elenco funcionam em CPU e em dois jogadores', () => {
  for (const mode of ['cpu', 'local']) for (const a of ids) for (const b of ids.filter(id => id !== a)) {
    const g = new FightEngine({ random: () => .6 }); g.start(a, mode, b);
    assert.deepEqual(g.fighters.map(f => f.character.id), [a, b]);
    assert.equal(g.cpu, mode === 'cpu'); g.phase = 'fight';
    g.setInput(0, { right: true }); advance(g, .5);
    assert.ok(g.fighters.every(f => Number.isFinite(f.x) && f.hurtboxes.every(r => r.w > 0 && r.h > 0)));
  }
  const g = new FightEngine(); assert.throws(() => g.start('gustavo', 'local', 'gustavo'), RangeError);
  assert.throws(() => g.start('inexistente'), RangeError);
});

test('Gustavo usa os nomes e as falas dos poderes de Química nos dois lados', () => {
  assert.equal(CHARACTERS.gustavo.name, 'Prof. Gustavo');
  for (const slot of [0, 1]) for (const move of ['special', 'uppercut', 'super']) {
    const { g, events, f } = scene(slot); g.fighters[0].x = 220; g.fighters[1].x = 1050;
    f.meter = 100; g.queue(slot, move); advance(g, 1);
    const lines = events.filter(e => e.type === 'special');
    assert.equal(lines.length, 1);
    assert.equal(lines[0].name, CHARACTERS.gustavo.powers[move]);
    assert.equal(lines[0].quote, CHARACTERS.gustavo.powerQuotes[move]);
    if (move === 'super') {
      assert.equal(events.filter(e => e.type === 'projectile').length, 3);
      assert.ok(lines[0].quote.includes('Reagiu, perdeu!')); assert.equal(f.meter, 0);
    }
  }
});

test('a rasteira de Gustavo derruba ou é defendida embaixo, espelhada e nas três forças', () => {
  for (const slot of [0, 1]) for (const other of ['marcelo', 'rafael']) for (const strength of [0, 1, 2]) for (const blocked of [false, true]) {
    const { g, events, target } = scene(slot, other);
    g.setInput(slot, { down: true }); g.setInput(1 - slot, { down: blocked, block: blocked });
    g.queue(slot, 'kick', strength); advance(g, .3);
    assert.equal(target.hp < 1000, !blocked);
    assert.equal(events.some(e => e.type === (blocked ? 'block' : 'hit') && e.move === 'sweep'), true);
    assert.equal(target.knocked, !blocked);
  }
});

test('as poses específicas e a caminhada de Gustavo têm áreas válidas, medidas na arte', () => {
  for (const [atlas, count] of [['base', 16], ['combat', 16], ['walk', 8]]) {
    assert.equal(HURT_PROFILES.gustavo[atlas].length, count);
    for (const pose of HURT_PROFILES.gustavo[atlas]) for (const area of pose) {
      assert.ok(area.every(Number.isFinite)); assert.ok(area[2] > 0 && area[3] > 0);
    }
  }
  const { g, f } = scene(); g.setInput(0, { jump: true }); advance(g, .08); g.setInput(0, {});
  g.queue(0, 'kick'); advance(g, .1);
  assert.equal(f.action, 'airKick'); assert.ok(f.airborne);
  assert.deepEqual(fighterPose(f), { atlas: 'style', index: 13 });
});
