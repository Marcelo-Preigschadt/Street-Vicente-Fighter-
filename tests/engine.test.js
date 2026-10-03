import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, CHARACTERS } from '../src/engine.js';

function arena() {
  const events = [], game = new FightEngine({ random: () => .6, onEvent: e => events.push(e) });
  game.start('marcelo', 'local'); game.phase = 'fight'; game.phaseTime = 0;
  game.fighters[0].x = 450; game.fighters[1].x = 565;
  return { game, events };
}
const advance = (game, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) game.update(1 / 60); };

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
test('agachamento evita soco alto e o salto retorna ao chão', () => {
  const { game } = arena(); game.setInput(1, { down: true }); game.queue(0, 'punch'); advance(game, .5); assert.equal(game.fighters[1].hp, 1000);
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
test('um salto no lançamento atravessa o projétil sem dano', () => {
  const { game } = arena(); game.fighters[0].x = 300; game.fighters[1].x = 670;
  game.queue(1, 'special'); advance(game, .33); game.setInput(0, { jump: true }); advance(game, .72);
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
