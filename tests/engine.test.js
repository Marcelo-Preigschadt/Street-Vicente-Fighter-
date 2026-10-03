import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, CHARACTERS, FIXED_STEP, WORLD } from '../src/engine.js';

function arena() {
  const events = [], game = new FightEngine({ random: () => .6, onEvent: e => events.push(e) });
  game.start('marcelo', 'local'); game.phase = 'fight'; game.phaseTime = 0;
  game.fighters[0].x = 450; game.fighters[1].x = 565;
  return { game, events };
}
const advance = (game, seconds) => { for (let i = 0; i < Math.ceil(seconds / FIXED_STEP); i++) game.update(FIXED_STEP); };

test('nomes e frases permanecem iguais aos dados fornecidos', () => {
  assert.equal(CHARACTERS.marcelo.name, 'Prof. Marcelo'); assert.equal(CHARACTERS.marcelo.quote, 'Bora NIT');
  assert.equal(CHARACTERS.rafael.name, 'Prof Rafael'); assert.equal(CHARACTERS.rafael.quote, 'No meu tempo não era assim');
});
test('um soco causa dano apenas uma vez e não antes da preparação', () => {
  const { game, events } = arena(); game.queue(0, 'punch'); advance(game, .08); assert.equal(game.fighters[1].hp, 1000);
  advance(game, .65); assert.ok(game.fighters[1].hp < 1000); assert.equal(events.filter(e => e.type === 'hit').length, 1);
});
test('defesa impede dano de soco e permite voltar a atacar após soltar', () => {
  const { game, events } = arena(); game.setInput(1, { block: true }); game.queue(0, 'punch'); advance(game, .7);
  assert.equal(game.fighters[1].hp, 1000); assert.equal(events.filter(e => e.type === 'block').length, 1);
  game.setInput(1, {}); game.queue(1, 'kick'); advance(game, .45); assert.ok(game.fighters[0].hp < 1000);
});
test('agachamento evita chute alto e o salto retorna ao chão', () => {
  const { game } = arena(); game.setInput(1, { down: true }); game.queue(0, 'kick'); advance(game, .7); assert.equal(game.fighters[1].hp, 1000);
  game.setInput(1, { jump: true }); advance(game, .16); assert.ok(game.fighters[1].airborne);
  game.setInput(1, {}); advance(game, 1); assert.equal(game.fighters[1].y, 625); assert.equal(game.fighters[1].vy, 0);
});
test('especial consome energia, tem projétil e acerta à distância', () => {
  const { game, events } = arena(); game.fighters[0].x = 300; game.fighters[1].x = 670;
  game.queue(0, 'special'); advance(game, .02); assert.ok(game.fighters[0].meter < 11);
  advance(game, 1.3); assert.ok(game.fighters[1].hp < 900); assert.ok(events.some(e => e.type === 'special' && e.quote === 'Bora NIT'));
  assert.equal(events.filter(e => e.type === 'hit').length, 1);
  const count = events.filter(e => e.type === 'special').length; game.queue(0, 'special'); advance(game, .4);
  assert.equal(events.filter(e => e.type === 'special').length, count);
});
test('projétil do Rafael aplica redução temporária de velocidade', () => {
  const { game } = arena(); game.fighters[0].x = 300; game.fighters[1].x = 660;
  game.queue(1, 'special'); advance(game, 1.0); assert.ok(game.fighters[0].slow > 0); advance(game, 2); assert.equal(game.fighters[0].slow, 0);
});
test('um salto antecipado passa sobre o projétil sem dano', () => {
  const { game } = arena(); game.fighters[0].x = 300; game.fighters[1].x = 670;
  game.queue(1, 'special'); advance(game, .10); game.setInput(0, { jump: true }); advance(game, .95);
  assert.equal(game.fighters[0].hp, 1000);
});
test('ataques simultâneos trocam dano', () => {
  const { game } = arena(); game.queue(0, 'punch'); game.queue(1, 'punch'); advance(game, .3);
  assert.ok(game.fighters[0].hp < 1000); assert.ok(game.fighters[1].hp < 1000);
});
test('pausa congela a simulação e bloqueia novos ataques', () => {
  const { game } = arena(); game.togglePause(); const time = game.timer, x = game.fighters[0].x;
  game.setInput(0, { right: true }); game.queue(0, 'special'); advance(game, 2);
  assert.equal(game.timer, time); assert.equal(game.fighters[0].x, x); assert.equal(game.fighters[0].meter, 50);
});
test('melhor de três mantém placar entre rounds e encerra ao obter duas vitórias', () => {
  const { game, events } = arena(); game.fighters[1].hp = 10; game.queue(0, 'punch'); advance(game, .35);
  assert.equal(game.phase, 'roundEnd'); assert.equal(game.fighters[0].wins, 1);
  advance(game, 6); assert.equal(game.round, 2); assert.equal(game.fighters[0].wins, 1); assert.equal(game.fighters[1].hp, 1000);
  game.fighters[0].x = 450; game.fighters[1].x = 565; game.fighters[1].hp = 10; game.queue(0, 'kick'); advance(game, 4);
  assert.equal(game.phase, 'result'); assert.equal(game.fighters[0].wins, 2); assert.ok(events.some(e => e.type === 'result' && e.winner === 0));
});
test('tempo esgotado desempata por vida; empate repete o round sem pontuar', () => {
  const { game } = arena(); game.timer = .01; game.fighters[0].hp = 700; game.fighters[1].hp = 900; advance(game, .1);
  assert.equal(game.roundWinner, 1); assert.equal(game.fighters[1].wins, 1);
  const { game: tied } = arena(); tied.timer = .01; advance(tied, .1); assert.equal(tied.roundWinner, null); assert.equal(tied.fighters[0].wins, 0); assert.equal(tied.fighters[1].wins, 0);
});

test('movimento acelera, freia e inverte a direção sem saltos de velocidade', () => {
  const { game } = arena(); const f = game.fighters[0]; game.fighters[1].x = 1000;
  game.setInput(0, { right: true }); game.update(FIXED_STEP);
  assert.ok(f.vx > 0 && f.vx < f.character.speed); const initial = f.vx;
  advance(game, .08); assert.ok(f.vx > initial); assert.equal(f.vx, f.character.speed);
  game.setInput(0, { left: true }); game.update(FIXED_STEP); assert.ok(f.vx > 0);
  advance(game, .2); assert.equal(f.vx, -f.character.speed);
  game.setInput(0, {}); game.update(FIXED_STEP); assert.ok(f.vx < 0);
  advance(game, .08); assert.equal(f.vx, 0);
});
test('os corpos não se sobrepõem quando um lutador é empurrado contra a parede', () => {
  for (const side of ['left', 'right']) {
    const { game } = arena(); const [a, b] = game.fighters;
    a.x = side === 'left' ? 110 : 1058; b.x = a.x + 112;
    game.setInput(side === 'left' ? 1 : 0, side === 'left' ? { left: true } : { right: true });
    advance(game, 2);
    assert.ok(b.x - a.x >= 112 - 1e-8); assert.ok(a.x >= 110); assert.ok(b.x <= 1170);
  }
});
test('movimento rápido e impactos não trocam a ordem dos lutadores no chão', () => {
  const { game } = arena(); const [a, b] = game.fighters;
  a.x = 450; b.x = 562; a.knockback = 24000; b.knockback = -24000;
  game.update(1 / 30); assert.ok(a.x < b.x); assert.ok(b.x - a.x >= 112 - 1e-8);
});
test('um salto pode cruzar por cima do adversário e a guarda vira ao aterrissar', () => {
  const { game } = arena(); const [a, b] = game.fighters; a.x = 450; b.x = 562;
  game.setInput(0, { jump: true, right: true }); advance(game, 1.3);
  assert.ok(a.x > b.x); assert.equal(a.y, WORLD.floor); assert.equal(a.direction, -1); assert.equal(b.direction, 1);
  assert.ok(a.x - b.x >= 112 - 1e-8);
});
test('a defesa mantém o empurrão do impacto durante vários passos', () => {
  const { game } = arena(); const b = game.fighters[1]; game.setInput(1, { block: true }); game.queue(0, 'punch');
  advance(game, .15); const impactX = b.x; advance(game, .15);
  assert.ok(b.x > impactX + 3); assert.equal(b.hp, 1000);
});
test('um ataque fora de alcance não causa dano, mesmo durante sua janela ativa', () => {
  const { game, events } = arena(); game.fighters[1].x = 780;
  game.queue(0, 'kick'); advance(game, .8);
  assert.equal(game.fighters[1].hp, 1000); assert.equal(events.filter(e => e.type === 'hit').length, 0);
});
test('a altura de cada soco corresponde à pose: Rafael passa sobre a cabeça agachada', () => {
  const { game } = arena(); game.setInput(0, { down: true }); game.queue(1, 'punch'); advance(game, .5);
  assert.equal(game.fighters[0].hp, 1000);
  const { game: lower } = arena(); lower.setInput(1, { down: true }); lower.queue(0, 'punch'); advance(lower, .5);
  assert.ok(lower.fighters[1].hp < 1000);
});
test('um golpe não acerta atrás do lutador durante o cruzamento aéreo', () => {
  const { game, events } = arena(); const a = game.fighters[0];
  a.x = 620; a.y = 550; a.direction = 1; game.fighters[1].x = 500;
  game.queue(0, 'punch'); advance(game, .15);
  assert.equal(game.fighters[1].hp, 1000); assert.equal(events.filter(e => e.type === 'hit').length, 0);
});
test('comando durante a pausa de impacto pode encadear soco e chute', () => {
  const { game, events } = arena(); game.queue(0, 'punch');
  while (!events.some(e => e.type === 'hit')) game.update(FIXED_STEP);
  assert.ok(game.freeze > 0); game.queue(0, 'kick'); advance(game, .65);
  assert.equal(events.filter(e => e.type === 'hit').length, 2);
});
test('comando no fim da recuperação inicia o próximo golpe sem ser perdido', () => {
  const { game, events } = arena(); game.fighters[1].x = 900;
  game.queue(0, 'kick'); advance(game, .45); game.queue(0, 'punch'); advance(game, .25);
  assert.deepEqual(events.filter(e => e.type === 'swing').map(e => e.move), ['kick', 'punch']);
});
test('comando de salto pouco antes de aterrissar inicia outro salto', () => {
  const { game, events } = arena(); game.fighters[1].x = 1000;
  game.setInput(0, { jump: true }); advance(game, .5); game.setInput(0, {}); advance(game, .53);
  game.setInput(0, { jump: true }); advance(game, .2);
  assert.equal(events.filter(e => e.type === 'jump').length, 2); assert.ok(game.fighters[0].airborne);
});
test('projétil rápido não atravessa o alvo sem registrar o impacto', () => {
  const { game, events } = arena(); const a = game.fighters[0];
  game.projectiles.push({ owner: 0, character: 'marcelo', direction: 1, x: a.x + 20, y: WORLD.floor - 200, radius: 28, speed: 30000, life: 2 });
  game.update(1 / 30);
  assert.ok(game.fighters[1].hp < 1000); assert.equal(events.filter(e => e.type === 'hit').length, 1); assert.equal(game.projectiles.length, 0);
});
test('a mesma sequência tem movimento, salto e dano equivalentes em 30/60/120 Hz', () => {
  const run = hz => {
    const { game } = arena(); game.fighters[0].x = 300; game.fighters[1].x = 900;
    game.setInput(0, { right: true, jump: true });
    for (let i = 0; i < hz; i++) game.update(1 / hz);
    game.setInput(0, {}); game.queue(1, 'special');
    for (let i = 0; i < hz * 2; i++) game.update(1 / hz);
    return game.fighters.map(f => [f.x, f.y, f.vx, f.hp]);
  };
  const expected = run(120);
  for (const hz of [30, 60]) run(hz).forEach((fighter, i) => fighter.forEach((value, j) => assert.ok(Math.abs(value - expected[i][j]) < 1e-7)));
});
