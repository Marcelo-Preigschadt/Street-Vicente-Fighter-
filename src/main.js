import { FightEngine, FIXED_STEP, CHARACTERS } from './engine.js?v=22';
import { Renderer } from './render.js?v=22';
import { ArcadeAudio } from './audio.js?v=22';
import { Inputs } from './input.js?v=22';

const $ = id => document.getElementById(id);
const renderer = new Renderer($('game')), audio = new ArcadeAudio();
let selected = 'marcelo', opponent = 'rafael', ready = true, starting = false;
const engine = new FightEngine({ onEvent: event });
const inputs = new Inputs(engine);

function event(e) {
  renderer.event(e); audio.event(e, engine);
  if (e.type === 'pause') { $('pause-screen').hidden = !e.paused; inputs.release(); audio.playing = !e.paused; $('pause').textContent = e.paused ? 'Continuar' : 'Pausar'; if (e.paused) $('resume').focus(); }
  if (e.type === 'round') $('announcer').textContent = `Round ${e.round}`;
  if (e.type === 'fight') $('announcer').textContent = 'Lutem!';
  if (e.type === 'special') $('announcer').textContent = `${e.name}. ${e.quote}`;
  if (e.type === 'droneFire') $('announcer').textContent = 'Enxame de Drones disparou';
  if (e.type === 'dizzy') $('announcer').textContent = `${engine.fighters[e.fighter].character.name} ficou tonto ${e.cause === 'chemicalSmoke' ? 'pela Névoa Atômica' : 'após o combo'}`;
  if (e.type === 'roundEnd') $('announcer').textContent = e.winner === null ? 'Round empatado' : `${engine.fighters[e.winner].character.name} venceu o round`;
  if (e.type === 'result') {
    const f = engine.fighters[e.winner]; $('winner-name').textContent = `${f.character.name} venceu!`; $('winner-quote').textContent = f.character.quote;
    $('result-screen').hidden = false; $('touch-controls').hidden = true; audio.playing = false; $('pause').disabled = true; $('announcer').textContent = `${f.character.name} venceu a luta`; $('rematch').focus();
  }
}

function updateSelection() {
  if (opponent === selected) opponent = Object.keys(CHARACTERS).find(id => id !== selected);
  const local = document.querySelector('input[name="mode"]:checked').value === 'local';
  $('opponent-label').textContent = local ? 'Jogador 2' : 'Adversário';
  for (const option of $('opponent').options) option.disabled = option.value === selected;
  $('opponent').value = opponent;
  const second = { marcelo:'chute', rafael:'gancho', gustavo:'chute',gelton:'chute',marcelino:'chute',marcos:'varrida' };
  $('p1-second-label').textContent = second[selected]; $('p2-second-label').textContent = second[opponent];
  $('p1-drone-command').hidden = selected !== 'marcelo'; $('p2-drone-command').hidden = opponent !== 'marcelo';
  document.querySelector('[data-action="drone"]').hidden = selected !== 'marcelo';
  const touchSecond = document.querySelector('.touch-attacks [data-action="kick"]');
  touchSecond.textContent = { marcelo:'CHUTE', rafael:'GANCHO', gustavo:'CHUTE',gelton:'CHUTE',marcelino:'CHUTE',marcos:'VARRIDA' }[selected];
  touchSecond.setAttribute('aria-label',second[selected]);
  document.querySelectorAll('[data-fighter]').forEach(card => {
    const chosen = card.dataset.fighter === selected;
    card.classList.toggle('selected', chosen); card.classList.toggle('opponent', card.dataset.fighter === opponent);
    card.setAttribute('aria-pressed', String(chosen));
    card.querySelector('.player-chip').textContent = chosen ? 'JOGADOR 1' : card.dataset.fighter === opponent ? local ? 'JOGADOR 2' : 'ADVERSÁRIO' : 'ESCOLHER';
  });
}
document.querySelectorAll('[data-fighter]').forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.fighter; audio.unlock(); audio.tone({marcelo:392,rafael:493.88,gustavo:587.33,gelton:659.25,marcelino:698.46,marcos:349.23}[selected], .09, 'triangle', .15);
  updateSelection();
}));
$('opponent').addEventListener('change', () => { opponent = $('opponent').value; updateSelection(); });
document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', updateSelection));
updateSelection();

async function start() {
  if (!ready || starting) return;
  const pair=[selected,opponent],mode=document.querySelector('input[name="mode"]:checked').value;
  starting=true;$('start').disabled=true;$('start').textContent='Preparando a luta…';
  $('load-status').textContent=`Carregando ${CHARACTERS[pair[0]].name} e ${CHARACTERS[pair[1]].name}…`;
  inputs.release();audio.unlock();
  audio.loadFighters(pair).catch(error=>console.warn('Áudio de combate indisponível.',error));
  try{await renderer.load(pair);}catch(error){
    $('load-status').textContent=`${error.message}. Pressione Começar para tentar novamente.`;
    starting=false;$('start').disabled=false;$('start').textContent='Começar a luta';return;
  }
  selected=pair[0];opponent=pair[1];updateSelection();
  starting=false;$('start').disabled=false;$('start').textContent='Começar a luta';
  $('load-status').textContent='Selecione o personagem e pressione Enter ou Começar a luta';
  audio.playing = true;
  $('selection').hidden = true; $('pause-screen').hidden = true; $('result-screen').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pausar';
  $('touch-controls').hidden = !(matchMedia('(pointer: coarse)').matches && mode === 'cpu');
  engine.start(selected, mode, opponent);
  $('game').setAttribute('aria-label', `Jogo de luta: ${CHARACTERS[selected].name} contra ${CHARACTERS[opponent].name}. Os comandos estão abaixo da arena.`);
}
function selection() {
  renderer.event({ type: 'selection' });
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
  if (!engine.paused) { inputs.update(); accumulator += dt; while (accumulator >= FIXED_STEP) { engine.update(FIXED_STEP); accumulator -= FIXED_STEP; } }
  else accumulator = 0;
  renderer.draw(engine, engine.paused ? 0 : dt, engine.paused ? 1 : accumulator / FIXED_STEP); audio.tick(dt); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// HTML previews are visible immediately; full animation and audio are loaded per match.
$('start').disabled=false;$('start').textContent='Começar a luta';
$('load-status').textContent='Selecione o personagem e pressione Enter ou Começar a luta';
renderer.loadBackground().catch(error=>console.warn('Cenário indisponível.',error));

// Exposed only on explicit debug requests for reproducible local gameplay checks.
if (new URLSearchParams(location.search).has('debug')) window.streetVicente = { engine, renderer, inputs, audio, start, selection };
