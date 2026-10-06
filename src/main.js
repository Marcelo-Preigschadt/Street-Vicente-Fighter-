import { FightEngine, FIXED_STEP, CHARACTERS } from './engine.js?v=24';
import { Renderer } from './render.js?v=24';
import { ArcadeAudio } from './audio.js?v=24';
import { Inputs } from './input.js?v=24';
import { OnlineMatch,normalizeCode } from './online.js?v=25';

const $ = id => document.getElementById(id);
const renderer = new Renderer($('game')), audio = new ArcadeAudio();
let selected = 'marcelo', opponent = 'rafael', ready = true, starting = false;
const engine = new FightEngine({ onEvent: event });
const inputs = new Inputs(engine);
const online=new OnlineMatch({engine,prepare:prepareOnline,onStart:showOnlineMatch,onStatus:onlineStatus,onEnd:endedOnline,onCorrection:()=>{
  if(engine.phase!=='result'){
    $('result-screen').hidden=true;$('pause').disabled=false;
    $('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches;
  }
  audio.playing=!engine.paused&&engine.phase!=='result';
}});
const getMode=()=>document.querySelector('input[name="mode"]:checked').value;
function onlineStatus(message){
  $('online-status').textContent=message;
  if(!$('selection').hidden)$('load-status').textContent=message;
  if(online.code&&online.kind==='create'){$('room-share').hidden=false;$('room-code-display').textContent=online.code;}
}
function onlineBusy(busy){
  document.querySelectorAll('[data-fighter], input[name="mode"]').forEach(el=>el.disabled=busy);
  for(const id of ['start','create-room','join-room','room-code'])$(id).disabled=busy;
  $('cancel-online').hidden=!busy;
}
async function prepareOnline(pair,slot){
  inputs.release();audio.unlock();audio.loadFighters(pair).catch(error=>console.warn('Áudio de combate indisponível.',error));
  await renderer.load(pair);
}
function showOnlineMatch(pair,slot){
  selected=pair[slot];opponent=pair[1-slot];updateSelection();inputs.network(online,slot);
  $('selection').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;
  $('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches;$('pause').disabled=false;$('pause').textContent='Pausar';
  $('restart').hidden=true;$('rematch').disabled=false;$('rematch').textContent='Revanche';
  $('online-hud').hidden=false;audio.playing=true;accumulator=0;
  $('game').setAttribute('aria-label',`Partida online: ${CHARACTERS[pair[0]].name} contra ${CHARACTERS[pair[1]].name}. Você é P${slot+1}.`);
}
function endedOnline(message){
  inputs.network();onlineBusy(false);selection(false);$('room-share').hidden=true;
  $('load-status').textContent=message;updateSelection();
}
function startOnline(kind='quick'){
  if(online.active||starting)return;
  audio.unlock();inputs.release();onlineBusy(true);$('room-share').hidden=true;
  online.begin(kind,selected,$('room-code').value);
}

function event(e) {
  if(typeof online!=='undefined'&&online.event(e))return;
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
  const local = getMode() === 'local',network=getMode()==='online';
  $('online-panel').hidden=!network;$('opponent').closest('label').hidden=network;
  document.querySelector('.control-player:has(.p2)').hidden=network;
  document.querySelector('.control-label.p1').textContent=network?'VOCÊ':'P1';
  if(!starting)$('start').textContent=network?'Encontrar jogador':'Começar a luta';
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
    card.classList.toggle('selected', chosen); card.classList.toggle('opponent', !network&&card.dataset.fighter === opponent);
    card.setAttribute('aria-pressed', String(chosen));
    card.querySelector('.player-chip').textContent = chosen ? network?'VOCÊ':'JOGADOR 1' : !network&&card.dataset.fighter === opponent ? local ? 'JOGADOR 2' : 'ADVERSÁRIO' : 'ESCOLHER';
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
  if(getMode()==='online'){
    if(engine.phase==='result'&&online.running){online.rematch();$('rematch').disabled=true;$('rematch').textContent='Aguardando adversário…';return;}
    startOnline();return;
  }
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
  inputs.network();$('restart').hidden=false;$('online-hud').hidden=true;
  $('selection').hidden = true; $('pause-screen').hidden = true; $('result-screen').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pausar';
  $('touch-controls').hidden = !(matchMedia('(pointer: coarse)').matches && mode === 'cpu');
  engine.start(selected, mode, opponent);
  $('game').setAttribute('aria-label', `Jogo de luta: ${CHARACTERS[selected].name} contra ${CHARACTERS[opponent].name}. Os comandos estão abaixo da arena.`);
}
function selection(closeNetwork=true) {
  if(closeNetwork&&online.active)online.close();inputs.network();onlineBusy(false);$('online-hud').hidden=true;$('room-share').hidden=true;
  renderer.event({ type: 'selection' });
  engine.phase = 'selection'; engine.paused = false; inputs.release(); audio.playing = false; audio.stopSamples();
  $('selection').hidden = false; $('pause-screen').hidden = true; $('result-screen').hidden = true; $('touch-controls').hidden = true; $('pause').disabled = true; $('start').focus();
}
$('start').addEventListener('click', start); $('restart').addEventListener('click', start); $('rematch').addEventListener('click', start);
$('back').addEventListener('click', selection); $('result-back').addEventListener('click', selection);
function pause(){if(online.running)online.pause();else engine.togglePause();}
$('resume').addEventListener('click',pause);$('pause').addEventListener('click',pause);
$('create-room').addEventListener('click',()=>startOnline('create'));$('join-room').addEventListener('click',()=>startOnline('join'));
$('cancel-online').addEventListener('click',()=>{online.close();selection();updateSelection();$('load-status').textContent='Busca cancelada. Escolha um professor e encontre outro jogador.';});
$('leave-online').addEventListener('click',()=>{selection();updateSelection();});
$('copy-room').addEventListener('click',async()=>{
  const link=new URL(location.href);link.search='';link.searchParams.set('sala',online.code);
  try{await navigator.clipboard.writeText(link.href);$('copy-room').textContent='Convite copiado';}catch{$('load-status').textContent=`Envie o código ${online.code} para o outro jogador.`;}
});
$('sound').addEventListener('click', () => { audio.unlock(); const enabled = audio.toggle(); $('sound-state').textContent = enabled ? 'ON' : 'OFF'; $('sound').setAttribute('aria-pressed', String(enabled)); });
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen(); else if ($('arena').requestFullscreen) await $('arena').requestFullscreen();
  } catch { $('fullscreen').textContent = 'Tela cheia indisponível'; }
});
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia'; });
window.addEventListener('keydown', e => {
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); pause(); }
  if (e.code === 'Enter' && !e.repeat && (engine.phase === 'selection' || engine.phase === 'result')) { e.preventDefault(); start(); }
});
function autopause() { if (!engine.paused && ['intro', 'fight', 'roundEnd'].includes(engine.phase)) pause(); }
window.addEventListener('blur', autopause); document.addEventListener('visibilitychange', () => { if (document.hidden) autopause(); });

let last = performance.now(), accumulator = 0;
function frame(now) {
  const dt = Math.min(.066, (now - last) / 1000); last = now;
  if(online.running){if(!engine.paused)inputs.update();online.advance();accumulator=0;}
  else if (!engine.paused) { inputs.update(); accumulator += dt; while (accumulator >= FIXED_STEP) { engine.update(FIXED_STEP); accumulator -= FIXED_STEP; } }
  else accumulator = 0;
  online.tick();
  const alpha=online.running?1:accumulator/FIXED_STEP;
  renderer.draw(engine, engine.paused ? 0 : dt, engine.paused ? 1 : alpha); audio.tick(dt); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// HTML previews are visible immediately; full animation and audio are loaded per match.
$('start').disabled=false;updateSelection();
$('load-status').textContent='Escolha seu professor e encontre um jogador online, ou crie uma sala para convidar alguém.';
const invitation=normalizeCode(new URLSearchParams(location.search).get('sala')??'');
if(invitation){$('room-code').value=invitation;$('load-status').textContent='Convite recebido. Escolha seu professor e clique em Entrar na sala.';}
renderer.loadBackground().catch(error=>console.warn('Cenário indisponível.',error));

// Exposed only on explicit debug requests for reproducible local gameplay checks.
if (new URLSearchParams(location.search).has('debug')) window.streetVicente = { engine, renderer, inputs, audio, start, selection };
