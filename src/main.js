import { FightEngine, FIXED_STEP } from './engine.js?v=7';
import { Renderer } from './render.js?v=7';
import { ArcadeAudio } from './audio.js?v=7';
import { Inputs } from './input.js?v=7';

const $ = id => document.getElementById(id);
const renderer = new Renderer($('game')), audio = new ArcadeAudio();
let selected = 'marcelo', ready = false;
const engine = new FightEngine({ onEvent: event });
const inputs = new Inputs(engine);

function event(e) {
  renderer.event(e); audio.event(e, engine);
  if (e.type === 'pause') { $('pause-screen').hidden = !e.paused; inputs.release(); audio.playing = !e.paused; $('pause').textContent = e.paused ? 'Continuar' : 'Pausar'; if (e.paused) $('resume').focus(); }
  if (e.type === 'round') $('announcer').textContent = `Round ${e.round}`;
  if (e.type === 'fight') $('announcer').textContent = 'Lutem!';
  if (e.type === 'special') $('announcer').textContent = `${e.name}. ${e.quote}`;
  if (e.type === 'roundEnd') $('announcer').textContent = e.winner === null ? 'Round empatado' : `${engine.fighters[e.winner].character.name} venceu o round`;
  if (e.type === 'result') {
    const f = engine.fighters[e.winner]; $('winner-name').textContent = `${f.character.name} venceu!`; $('winner-quote').textContent = f.character.quote;
    $('result-screen').hidden = false; $('touch-controls').hidden = true; audio.playing = false; $('pause').disabled = true; $('announcer').textContent = `${f.character.name} venceu a luta`; $('rematch').focus();
  }
}

document.querySelectorAll('[data-fighter]').forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.fighter; audio.unlock(); audio.tone(selected === 'marcelo' ? 392 : 493.88, .09, 'triangle', .15);
  document.querySelectorAll('[data-fighter]').forEach(card => { const chosen = card.dataset.fighter === selected; card.classList.toggle('selected', chosen); card.setAttribute('aria-pressed', String(chosen)); card.querySelector('.player-chip').textContent = chosen ? 'JOGADOR 1' : 'ADVERSÁRIO'; });
}));

function start() {
  if (!ready) return;
  inputs.release(); audio.unlock(); audio.playing = true;
  $('selection').hidden = true; $('pause-screen').hidden = true; $('result-screen').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pausar';
  const mode = document.querySelector('input[name="mode"]:checked').value;
  $('touch-controls').hidden = !(matchMedia('(pointer: coarse)').matches && mode === 'cpu');
  engine.start(selected, mode);
}
function selection() {
  engine.phase = 'selection'; engine.paused = false; inputs.release(); audio.playing = false; audio.stopSamples();
  $('selection').hidden = false; $('pause-screen').hidden = true; $('result-screen').hidden = true; $('touch-controls').hidden = true; $('pause').disabled = true; $('start').focus();
}
$('start').addEventListener('click', start); $('restart').addEventListener('click', start); $('rematch').addEventListener('click', start);
$('back').addEventListener('click', selection); $('result-back').addEventListener('click', selection);
$('resume').addEventListener('click', () => engine.togglePause()); $('pause').addEventListener('click', () => engine.togglePause());
$('sound').addEventListener('click', () => { audio.unlock(); const enabled = audio.toggle(); $('sound-state').textContent = enabled ? 'ON' : 'OFF'; $('sound').setAttribute('aria-pressed', String(enabled)); });
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen(); else if ($('arena').requestFullscreen) await $('arena').requestFullscreen();
  } catch { $('fullscreen').textContent = 'Tela cheia indisponível'; }
});
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia'; });
window.addEventListener('keydown', e => {
  if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); engine.togglePause(); }
  if (e.code === 'Enter' && !e.repeat && (engine.phase === 'selection' || engine.phase === 'result')) { e.preventDefault(); start(); }
});
function autopause() { if (!engine.paused && ['intro', 'fight', 'roundEnd'].includes(engine.phase)) engine.togglePause(); }
window.addEventListener('blur', autopause); document.addEventListener('visibilitychange', () => { if (document.hidden) autopause(); });

let last = performance.now(), accumulator = 0;
function frame(now) {
  const dt = Math.min(.066, (now - last) / 1000); last = now;
  if (!engine.paused) { accumulator += dt; while (accumulator >= FIXED_STEP) { inputs.update(); engine.update(FIXED_STEP); accumulator -= FIXED_STEP; } }
  else accumulator = 0;
  renderer.draw(engine, engine.paused ? 0 : dt, engine.paused ? 1 : accumulator / FIXED_STEP); audio.tick(dt); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

try {
  const [, audioReady] = await Promise.all([renderer.load(), audio.load()]);
  document.querySelectorAll('[data-preview]').forEach(canvas => renderer.preview(canvas, canvas.dataset.preview));
  ready = true; $('start').disabled = false; $('start').textContent = 'Começar a luta';
  $('load-status').textContent = audioReady ? 'Selecione o personagem e pressione Enter ou Começar a luta' : 'Áudio de combate indisponível. Recarregue a página para tentar novamente.';
} catch (error) {
  $('load-status').textContent = `${error.message}. Recarregue a página para tentar novamente.`; $('start').textContent = 'Recarregar'; $('start').disabled = false;
  $('start').addEventListener('click', () => { if (!ready) location.reload(); });
}

// Exposed only on explicit debug requests for reproducible local gameplay checks.
if (new URLSearchParams(location.search).has('debug')) window.streetVicente = { engine, renderer, inputs, audio, start, selection };
