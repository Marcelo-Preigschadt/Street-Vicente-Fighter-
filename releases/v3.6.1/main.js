import {RoomDirectory,roomLabel} from './rooms.js';
import { SELECTION_QUOTES } from './selection-data.js';
import { FightEngine, FIXED_STEP, CHARACTERS } from './engine.js';
import { Renderer } from './render.js';
import { ArcadeAudio } from './audio.js';
import { Inputs } from './input.js';
import { OnlineMatch,normalizeCode } from './online.js';

const $ = id => document.getElementById(id);
const renderer = new Renderer($('game')), audio = new ArcadeAudio();
let selected = 'marcelo', opponent = 'rafael', ready = true, starting = false;
const engine = new FightEngine({ onEvent: event });
const inputs = new Inputs(engine);
const directory=new RoomDirectory({onChange:renderRooms,onError:message=>{$('rooms-message').textContent=message;}});
const online=new OnlineMatch({engine,directory,prepare:prepareOnline,onStart:showOnlineMatch,onStatus:onlineStatus,onEnd:endedOnline,onLobby:showOnlineLobby,onCorrection:()=>{
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
  document.querySelectorAll('[data-fighter]').forEach(el=>el.disabled=!!(online.preparing||online.lobby&&online.confirmed[online.slot]));
  document.querySelectorAll('input[name="mode"]').forEach(el=>el.disabled=busy);
  for(const id of ['create-room','join-room','room-code'])$(id).disabled=busy;
  $('start').disabled=busy&&(!online.lobby||online.preparing);
  $('cancel-online').hidden=!busy;renderRooms(directory.rooms);
}
function showOnlineLobby({pair,slot}){
  selected=online.character;opponent=pair[1-slot];
  $('selection').hidden=false;updateSelection();onlineBusy(true);
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
  online.begin(kind,selected,$('room-code').value);updateSelection();onlineBusy(true);
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

const portraitPath=id=>`assets/runtime/${id}-head-menu-v${['joao','gelton'].includes(id)?4:3}.webp${id==='ruan'?'':id==='joao'?'':''}`;
let previewed = selected;
function previewFighter(id) {
  previewed=id;
  const card=document.querySelector(`[data-fighter="${id}"]`);
  $('left-name').textContent=CHARACTERS[id].name;
  $('left-style').textContent=card.querySelector('.fighter-style').textContent;
  $('left-portrait').src=portraitPath(id);
  $('left-stance').src=`assets/runtime/${id}-preview-v1.webp${id==='ruan'?'':id==='joao'?'':''}`;
  $('left-stance').alt=`${CHARACTERS[id].name} em pose de luta`;
  $('selection-quote').textContent=id===selected?SELECTION_QUOTES[id]:'Confirme para escolher';
  $('preview-left').style.setProperty('--fighter-color',CHARACTERS[id].color);
  document.querySelectorAll('[data-fighter]').forEach(button=>button.classList.toggle('cursor',button.dataset.fighter===id));
}
function updateSelection() {
  if (getMode()!=='online'&&opponent === selected) opponent = Object.keys(CHARACTERS).find(id => id !== selected);
  document.querySelector('.fighters').setAttribute('aria-label','Seleção de todos os personagens');
  document.querySelectorAll('[data-fighter]').forEach(card=>card.hidden=false);
  const local = getMode() === 'local',network=getMode()==='online',lobby=network&&online.lobby;
  if(lobby)opponent=online.pair[1-online.slot];
  $('room-directory').hidden=!network;$('online-panel').hidden=!network;$('opponent').closest('label').hidden=network;
  document.querySelector('.control-player:has(.p2)').hidden=network;
  document.querySelector('.control-label.p1').textContent=network?'VOCÊ':'P1';
  if(!starting)$('start').textContent=network?(online.preparing?'Carregando lutadores…':lobby?(online.confirmed[online.slot]?'Alterar personagem':'Confirmar personagem'):online.active?'Aguardando adversário…':'Encontrar jogador'):'Começar a luta';
  $('opponent-label').textContent = local ? 'Jogador 2' : 'Adversário';
  for (const option of $('opponent').options) option.disabled = option.value === selected;
  $('opponent').value = opponent;
  previewFighter(selected);
  $('preview-right').classList.toggle('waiting',network&&!lobby);
  $('right-name').textContent=network&&!lobby?'DESAFIANTE':CHARACTERS[opponent].name;
  $('right-style').textContent=network&&!lobby?'MULTIPLAYER ONLINE':document.querySelector(`[data-fighter="${opponent}"] .fighter-style`).textContent;
  $('right-portrait').src=portraitPath(opponent);
  $('right-stance').src=`assets/runtime/${opponent}-preview-v1.webp${opponent==='ruan'?'':opponent==='joao'?'':''}`;
  $('right-stance').alt=network&&!lobby?'':`${CHARACTERS[opponent].name} em pose de luta`;
  $('rival-slot').textContent=network?(lobby?`ADVERSÁRIO · P${2-online.slot}`:'PLAYER 2'):local?'JOGADOR 2':'COMPUTADOR';
  $('own-slot').textContent=network&&lobby?`VOCÊ · P${online.slot+1}`:network?'VOCÊ':'P1';
  $('left-ready').hidden=$('right-ready').hidden=!lobby;
  $('left-ready').textContent=lobby?(online.confirmed[online.slot]?'CONFIRMADO':'ESCOLHENDO…'):'';
  $('right-ready').textContent=lobby?(online.confirmed[1-online.slot]?'CONFIRMADO':'ESCOLHENDO…'):'';
  $('left-ready').classList.toggle('ready',!!(lobby&&online.confirmed[online.slot]));
  $('right-ready').classList.toggle('ready',!!(lobby&&online.confirmed[1-online.slot]));
  $('rival-note').textContent=network&&!lobby?'Encontre um jogador ou convide alguém para sua sala.':SELECTION_QUOTES[opponent];
  $('preview-right').style.setProperty('--fighter-color',CHARACTERS[opponent].color);
  const second = { marcelo:'chute', rafael:'gancho', gustavo:'chute',gelton:'chute',marcelino:'chute',marcos:'varrida',joao:'chute',ruan:'chute' };
  $('p1-second-label').textContent = second[selected]; $('p2-second-label').textContent = second[opponent];
  $('p1-drone-command').hidden = selected !== 'marcelo'; $('p2-drone-command').hidden = opponent !== 'marcelo';
  document.querySelector('[data-action="drone"]').hidden = selected !== 'marcelo';
  const touchSecond = document.querySelector('.touch-attacks [data-action="kick"]');
  touchSecond.textContent = { marcelo:'CHUTE', rafael:'GANCHO', gustavo:'CHUTE',gelton:'CHUTE',marcelino:'CHUTE',marcos:'VARRIDA',joao:'CHUTE',ruan:'CHUTE' }[selected];
  touchSecond.setAttribute('aria-label',second[selected]);
  document.querySelectorAll('[data-fighter]').forEach(card => {
    const chosen = card.dataset.fighter === selected;
    card.classList.toggle('selected', chosen); card.classList.toggle('opponent', (!network||lobby)&&card.dataset.fighter === opponent);
    card.setAttribute('aria-pressed', String(chosen));
    card.querySelector('.player-chip').textContent = chosen ? network?'VOCÊ':'JOGADOR 1' : (!network||lobby)&&card.dataset.fighter === opponent ? local ? 'JOGADOR 2' : 'ADVERSÁRIO' : 'ESCOLHER';
  });
  onlineBusy(online.active);
}
document.querySelectorAll('[data-fighter]').forEach(button => button.addEventListener('click', () => {
  if(online.active&&!online.selectCharacter(button.dataset.fighter))return;
  selected = button.dataset.fighter; audio.unlock(); audio.tone({marcelo:392,rafael:493.88,gustavo:587.33,gelton:659.25,marcelino:698.46,marcos:349.23,joao:440,ruan:523.25}[selected], .09, 'triangle', .15);
  updateSelection();
  audio.confirmSelection(selected).catch(()=>{$('load-status').textContent='Fala indisponível. Você pode continuar a jogar.';});
}));
document.querySelectorAll('[data-fighter]').forEach(button=>{
  button.addEventListener('pointerenter',()=>{if(!button.disabled)previewFighter(button.dataset.fighter);});
  button.addEventListener('focus',()=>previewFighter(button.dataset.fighter));
  button.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();e.stopPropagation();
    const cards=[...document.querySelectorAll('[data-fighter]')].filter(b=>!b.hidden&&!b.disabled);
    const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[e.key];
    cards[(cards.indexOf(button)+step+cards.length)%cards.length]?.focus();
  });
});
$('opponent').addEventListener('change', () => { opponent = $('opponent').value; updateSelection(); });
document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', updateSelection));
updateSelection();

async function start() {
  if(getMode()==='online'){
    if(engine.phase==='result'&&online.running){online.rematch();$('rematch').disabled=true;$('rematch').textContent='Aguardando adversário…';return;}
    if(online.lobby&&!online.running){online.confirm();return;}
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
  $('game').setAttribute('aria-label', `Jogo de luta: ${CHARACTERS[selected].name} contra ${CHARACTERS[opponent].name}. Os comandos estão no botão de informações dos personagens.`);
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
$('cancel-online').addEventListener('click',()=>{online.close();selection();updateSelection();$('load-status').textContent='Busca cancelada. Escolha um lutador e encontre outro jogador.';});
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
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.target.closest('[data-fighter]'))return;
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
$('load-status').textContent='Escolha seu lutador e encontre um jogador online, ou crie uma sala para convidar alguém.';
const invitation=normalizeCode(new URLSearchParams(location.search).get('sala')??'');
if(invitation){$('room-code').value=invitation;$('load-status').textContent='Convite recebido. Escolha seu lutador e clique em Entrar na sala.';}
renderer.loadBackground().catch(error=>console.warn('Cenário indisponível.',error));

// Exposed only on explicit debug requests for reproducible local gameplay checks.
if (new URLSearchParams(location.search).has('debug')) window.streetVicente = { engine, renderer, inputs, audio, start, selection };

function renderRooms(rooms){
  const list=$('rooms-list');list.replaceChildren();
  $('rooms-message').textContent=rooms.length?`${rooms.length} sala${rooms.length===1?'':'s'} online`:'Nenhuma sala aberta. Crie uma sala para jogar.';
  for(const room of rooms){
    const row=document.createElement('li'),code=document.createElement('strong'),name=document.createElement('span'),state=document.createElement('span'),button=document.createElement('button');
    code.textContent=room.code;name.textContent=CHARACTERS[room.character]?.name??'Jogador';state.textContent=roomLabel(room.status);state.className=`room-state ${room.status}`;
    button.type='button';button.className='secondary-button';button.textContent=room.code===online.code?'Sua sala':'Entrar';button.disabled=online.active||starting||room.status!=='waiting';
    button.addEventListener('click',()=>{if(online.active||starting)return;$('room-code').value=room.code;startOnline('join');});
    row.append(code,name,state,button);list.append(row);
  }
}
$('refresh-rooms').addEventListener('click',()=>directory.refresh());
document.addEventListener('visibilitychange',()=>{if(!document.hidden){directory.refresh();if(directory.owner)directory.update(directory.owner.status,directory.owner.character).catch(()=>{});}});
window.addEventListener('pagehide',()=>{directory.stop().catch(()=>{});online.close();});
window.addEventListener('pageshow',event=>{if(event.persisted)directory.start();});
directory.start();
