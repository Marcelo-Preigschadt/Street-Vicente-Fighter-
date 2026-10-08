import {StoryEngine} from './story.js';
import {STORY_HEROES} from './story-data.js';
import {syncStoryUI,readCheckpoint,saveCheckpoint,clearCheckpoint} from './story-ui.js';
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
const engine = new StoryEngine({ onEvent: event });
const inputs = new Inputs(engine);
const directory=new RoomDirectory({onChange:renderRooms,onError:message=>{$('rooms-message').textContent=message;}});
const online=new OnlineMatch({engine,directory,prepare:prepareOnline,onStart:showOnlineMatch,onStatus:onlineStatus,onEnd:endedOnline,onLobby:showOnlineLobby,onCorrection:()=>{
  if(engine.phase!=='result'){
    $('result-screen').hidden=true;$('pause').disabled=false;
    $('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches;
  }
  audio.playing=!engine.paused&&engine.phase!=='result';
  if(engine.storyActive&&engine.phase==='fight')$('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches||getMode()==='local';
}});
let selectionFamily='versus';const selectionModes={versus:'cpu',story:'cpu'};
const getMode=()=>document.querySelector('input[name="mode"]:checked').value;
const isStory=()=>selectionFamily==='story';
const battleMode=()=>isStory()?`story-${getMode()==='cpu'?'solo':getMode()}`:getMode();
const screens=['menu-screen','mode-screen','room-screen','selection'];
function showScreen(id){
  for(const screen of screens)$(screen).hidden=screen!==id;
  $('menu-home').hidden=id==='menu-screen'||id===null;
}
function showMainMenu(){
  if(starting)return;
  if(online.active)online.close();
  inputs.network();renderer.event({type:'selection'});
  engine.phase='selection';engine.paused=false;inputs.release();audio.playing=false;audio.stopSamples();
  $('story-dialog').hidden=true;$('story-hud').hidden=true;$('pause-screen').hidden=true;$('result-screen').hidden=true;
  $('touch-controls').hidden=true;$('online-hud').hidden=true;$('pause').disabled=true;$('room-share').hidden=true;
  onlineBusy(false);showScreen('menu-screen');document.querySelector('[data-menu="versus"]').focus();
}
function showModeScreen(family){
  selectionFamily=family;
  $('mode-title').textContent=family==='story'?'MODO HISTÓRIA':'VERSUS BATTLE';
  $('mode-description').textContent=family==='story'?'Escolha como vai jogar a Operação Resgate do NIT.':'Escolha quem vai controlar o adversário antes de selecionar os lutadores.';
  $('mode-cpu-title').textContent=family==='story'?'HISTÓRIA SOLO':'CONTRA A MÁQUINA';
  $('mode-cpu-description').textContent=family==='story'?'Enfrente os quatro atos com um lutador.':'Enfrente um lutador controlado pelo computador.';
  $('mode-local-title').textContent=family==='story'?'HISTÓRIA EM DUPLA NO PC':'1 V.S. 1 NO MESMO PC';
  $('mode-local-description').textContent=family==='story'?'Dois jogadores cooperam no mesmo computador.':'Dois jogadores usam o mesmo computador.';
  showScreen('mode-screen');document.querySelector('[data-mode-choice="cpu"]').focus();
}
function showRooms(family=selectionFamily){
  selectionFamily=family;selectionModes[family]='online';
  document.querySelector('input[name="mode"][value="online"]').checked=true;
  $('room-title').textContent=family==='story'?'ONLINE HISTÓRIA':'ONLINE 1 V.S. 1';
  $('room-description').textContent=family==='story'?'Crie ou encontre uma sala para jogar a campanha em dupla. Depois que os dois entrarem, escolham os personagens.':'Crie ou encontre uma sala. Depois que os dois jogadores entrarem, escolham os lutadores.';
  updateSelection();showScreen('room-screen');directory.refresh();
  $('create-room').focus();
}
function chooseLocalMode(mode){
  selectionModes[selectionFamily]=mode;
  document.querySelector(`input[name="mode"][value="${mode}"]`).checked=true;
  updateSelection();showScreen('selection');$('start').focus();
}
function onlineStatus(message){
  $('online-status').textContent=message;
  if(!$('room-screen').hidden)$('room-status').textContent=message;
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
  if(engine.phase==='result'){
    renderer.event({type:'selection'});engine.phase='selection';engine.paused=false;
    inputs.release();inputs.network();audio.playing=false;audio.stopSamples();
  }
  showScreen('selection');$('result-screen').hidden=true;$('pause-screen').hidden=true;
  $('touch-controls').hidden=true;$('pause').disabled=true;$('online-hud').hidden=true;
  updateSelection();onlineBusy(true);
}
async function prepareOnline(pair,slot){
  inputs.release();audio.unlock();audio.loadFighters(pair).catch(error=>console.warn('Áudio de combate indisponível.',error));
  await Promise.all([renderer.load(pair),...(online.gameMode==='story'?[renderer.loadStory()]:[])]);
}
function showOnlineMatch(pair,slot){
  selected=pair[slot];opponent=pair[1-slot];updateSelection();inputs.network(online,slot);
  showScreen(null);$('pause-screen').hidden=true;$('result-screen').hidden=true;
  $('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches;$('pause').disabled=false;$('pause').textContent='Pausar';
  $('restart').hidden=true;$('rematch').disabled=false;$('rematch').textContent='Revanche';
  $('online-hud').hidden=false;audio.playing=true;accumulator=0;
  if(engine.storyActive)$('game').setAttribute('aria-label','Operação Resgate do NIT em cooperativo online.');else $('game').setAttribute('aria-label',`Partida online: ${CHARACTERS[pair[0]].name} contra ${CHARACTERS[pair[1]].name}. Você é P${slot+1}.`);
}
function endedOnline(message){
  inputs.network();onlineBusy(false);selection(false);$('room-share').hidden=true;
  showRooms(selectionFamily);$('room-status').textContent=message;
}
function startOnline(kind='quick'){
  if(online.active||starting)return;
  audio.unlock();inputs.release();onlineBusy(true);$('room-share').hidden=true;
  online.begin(kind,selected,$('room-code').value,0,isStory()?'story':'versus');updateSelection();onlineBusy(true);
}

function event(e) {
  if(typeof online!=='undefined'&&online.event(e))return;
  renderer.event(e); audio.event(e, engine);
  if (e.type === 'pause') { $('pause-screen').hidden = !e.paused; inputs.release(); audio.playing = !e.paused; $('pause').textContent = e.paused ? 'Continuar' : 'Pausar'; if (e.paused) $('resume').focus(); else $('game').focus(); }
  if (e.type === 'round') $('announcer').textContent = `Round ${e.round}`;
  if (e.type === 'fight') { $('announcer').textContent = 'Lutem!'; $('game').focus(); }
  if (e.type === 'special') $('announcer').textContent = `${e.name}. ${e.quote}`;
  if (e.type === 'droneFire') $('announcer').textContent = 'Enxame de Drones disparou';
  if(e.type==='storyAct'){$('pause-screen').hidden=true;$('pause').textContent='Pausar';saveCheckpoint(engine);$('pause').disabled=false;audio.playing=true;$('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches||getMode()==='local';}
  if(e.type==='storyBoss'||e.type==='storyBossPhase'){
    // Boss transitions stay inside the current campaign, never the character select.
    showScreen(null);$('pause-screen').hidden=true;$('result-screen').hidden=true;
    $('story-dialog').dataset.scene='';$('pause').disabled=false;
  }
  if(e.type==='storyResult'){audio.playing=false;if(e.won)clearCheckpoint(engine);}
  if (e.type === 'dizzy' && e.fighter<2) $('announcer').textContent = `${engine.fighters[e.fighter].character.name} ficou tonto ${e.cause === 'chemicalSmoke' ? 'pela Névoa Atômica' : 'após o combo'}`;
  if (e.type === 'roundEnd') $('announcer').textContent = e.winner === null ? 'Round empatado' : `${engine.fighters[e.winner].character.name} venceu o round`;
  if (e.type === 'result') {
    const f = engine.fighters[e.winner]; $('winner-name').textContent = `${f.character.name} venceu!`; $('winner-quote').textContent = f.character.quote;
    $('result-screen').hidden = false; $('touch-controls').hidden = true; audio.playing = false; $('pause').disabled = true; $('announcer').textContent = `${f.character.name} venceu a luta`;
    $('rematch').hidden=online.running;$('result-back').textContent=online.running?'Voltando à seleção…':'Trocar personagem';$('result-back').disabled=online.running;
    if(!online.running)$('rematch').focus();
  }
}

const portraitPath=id=>`assets/runtime/${id}-head-menu-v${['joao','gelton','tais'].includes(id)?4:3}.webp${id==='ruan'?'?v=362':id==='joao'?'?v=362':''}`;
let previewed = selected;
function previewFighter(id) {
  previewed=id;
  const card=document.querySelector(`[data-fighter="${id}"]`);
  $('left-name').textContent=CHARACTERS[id].name;
  $('left-style').textContent=card.querySelector('.fighter-style').textContent;
  $('left-portrait').src=portraitPath(id);
  $('left-stance').src=`assets/runtime/${id}-preview-v${id==='tais'?2:1}.webp${id==='ruan'?'?v=362':id==='joao'?'?v=362':id==='luciana'?'?v=467':''}`;
  $('left-stance').alt=`${CHARACTERS[id].name} em pose de luta`;
  $('selection-quote').textContent=SELECTION_QUOTES[id];
  $('preview-left').style.setProperty('--fighter-color',CHARACTERS[id].color);
  document.querySelectorAll('[data-fighter]').forEach(button=>button.classList.toggle('cursor',button.dataset.fighter===id));
}
function updateSelection() {
  const story=isStory();
  if(story&&!STORY_HEROES.includes(selected))selected='marcelo';
  if(story&&!STORY_HEROES.includes(opponent))opponent=STORY_HEROES.find(id=>id!==selected);
  if (getMode()!=='online'&&opponent === selected) opponent = (story?STORY_HEROES:Object.keys(CHARACTERS)).find(id => id !== selected);
  $('selection-title').textContent=story?'OPERAÇÃO RESGATE DO NIT':'PLAYER SELECT';
  $('story-summary').hidden=!story;
  $('preview-right').hidden=story&&getMode()==='cpu';
  document.querySelector('[data-story-action="up"]').setAttribute('aria-label',story?'Mover para cima':'Pular');
  document.querySelector('[data-action="down"]').setAttribute('aria-label',story?'Mover para baixo':'Agachar');
  $('touch-controls').classList.toggle('story-controls',story);
  for(const button of document.querySelectorAll('.touch-attacks [data-action]'))button.hidden=story?!['punch','kick','special','jump'].includes(button.dataset.action)||button.dataset.strength!==undefined:button.id==='story-jump';
  const powerButton=document.querySelector('.touch-attacks [data-action="special"]');powerButton.dataset.storyAction='storySpecial';powerButton.textContent=story?'ESPECIAL':'ESP';
  $('story-keys').hidden=!story;
  $('restart').textContent=story?'Recomeçar este ato':'Recomeçar a luta';
  document.querySelector('#pause-screen h2').textContent=story?'Resgate pausado':'Luta pausada';
  document.querySelector('.arena').classList.toggle('story-selection',story);
  $('mode-online-label').textContent=story?'Cooperativo online':'Multiplayer online';
  $('mode-local-label').textContent=story?'Cooperativo no mesmo PC':'2 jogadores no mesmo PC';
  $('mode-solo-label').textContent=story?'História solo':'Contra o computador';
  $('continue-story').hidden=!story||getMode()==='online'||!readCheckpoint(battleMode());
  directory.setMode(story?'story':'versus');
  document.querySelector('.fighters').setAttribute('aria-label','Seleção de todos os personagens');
  document.querySelectorAll('[data-fighter]').forEach(card=>card.hidden=story&&!STORY_HEROES.includes(card.dataset.fighter));
  const local = getMode() === 'local',network=getMode()==='online',lobby=network&&online.lobby;
  if(lobby)opponent=online.pair[1-online.slot];
  $('room-directory').hidden=!network;$('online-panel').hidden=!network;$('opponent').closest('label').hidden=network||(story&&getMode()==='cpu');
  document.querySelector('.match-rules').hidden=story;
  document.querySelector('.control-player:has(.p2)').hidden=network||(story&&getMode()==='cpu');
  document.querySelector('.control-label.p1').textContent=network?'VOCÊ':'P1';
  if(!starting)$('start').textContent=network?(online.preparing?'Carregando lutadores…':lobby?(online.confirmed[online.slot]?'Alterar personagem':'Confirmar personagem'):online.active?'Aguardando adversário…':(story?'Encontrar parceiro':'Encontrar jogador')):(story?'Iniciar campanha':'Começar a luta');
  $('opponent-label').textContent = story?'Parceiro · P2':local ? 'Jogador 2' : 'Adversário';
  for (const option of $('opponent').options) option.disabled = option.value === selected;
  for(const option of $('opponent').options)option.hidden=story&&!STORY_HEROES.includes(option.value);
  $('opponent').value = opponent;
  previewFighter(selected);
  $('preview-right').classList.toggle('waiting',network&&!lobby);
  $('right-name').textContent=network&&!lobby?'DESAFIANTE':CHARACTERS[opponent].name;
  $('right-style').textContent=network&&!lobby?'MULTIPLAYER ONLINE':document.querySelector(`[data-fighter="${opponent}"] .fighter-style`).textContent;
  $('right-portrait').src=portraitPath(opponent);
  $('right-stance').src=`assets/runtime/${opponent}-preview-v${opponent==='tais'?2:1}.webp${opponent==='ruan'?'?v=362':opponent==='joao'?'?v=362':opponent==='luciana'?'?v=467':''}`;
  $('right-stance').alt=network&&!lobby?'':`${CHARACTERS[opponent].name} em pose de luta`;
  $('rival-slot').textContent=network?(lobby?`${story?'PARCEIRO':'ADVERSÁRIO'} · P${2-online.slot}`:'PLAYER 2'):local?(story?'PARCEIRO · P2':'JOGADOR 2'):story?'EQUIPE DO RESGATE':'COMPUTADOR';
  if(story){document.querySelector('.roster-caption').innerHTML='EQUIPE DO RESGATE <span>DEZ LUTADORES · UMA MISSÃO</span>'; $('rival-note').textContent=getMode()==='cpu'?'Campanha solo · apenas você em campo. WASD: andar · Espaço: pular.':'Juntos contra a IA. Sem dano entre parceiros.';}else document.querySelector('.roster-caption').innerHTML='TODOS OS LUTADORES <span>PROFESSORES E ALUNOS</span>';
  $('own-slot').textContent=network&&lobby?`VOCÊ · P${online.slot+1}`:network?'VOCÊ':'P1';
  $('left-ready').hidden=$('right-ready').hidden=!lobby;
  $('left-ready').textContent=lobby?(online.confirmed[online.slot]?'CONFIRMADO':'ESCOLHENDO…'):'';
  $('right-ready').textContent=lobby?(online.confirmed[1-online.slot]?'CONFIRMADO':'ESCOLHENDO…'):'';
  $('left-ready').classList.toggle('ready',!!(lobby&&online.confirmed[online.slot]));
  $('right-ready').classList.toggle('ready',!!(lobby&&online.confirmed[1-online.slot]));
  $('rival-note').textContent=story?(getMode()==='cpu'?'Campanha solo · apenas você em campo. WASD: andar · Espaço: pular.':'Juntos contra a IA. Sem dano entre parceiros.'):network&&!lobby?'Encontre um jogador ou convide alguém para sua sala.':SELECTION_QUOTES[opponent];
  $('preview-right').style.setProperty('--fighter-color',CHARACTERS[opponent].color);
  const second = { marcelo:'chute', rafael:'gancho', gustavo:'chute',gelton:'chute',marcelino:'chute',marcos:'varrida',joao:'chute',ruan:'chute',tais:'chute',luciana:'joelhada' };
  $('p1-second-label').textContent = second[selected]; $('p2-second-label').textContent = second[opponent];
  $('p1-drone-command').hidden = selected !== 'marcelo'; $('p2-drone-command').hidden = opponent !== 'marcelo';
  document.querySelector('[data-action="drone"]').hidden = selected !== 'marcelo';
  const touchSecond = document.querySelector('.touch-attacks [data-action="kick"]');
  touchSecond.textContent = { marcelo:'CHUTE', rafael:'GANCHO', gustavo:'CHUTE',gelton:'CHUTE',marcelino:'CHUTE',marcos:'VARRIDA',joao:'CHUTE',ruan:'CHUTE',tais:'CHUTE',luciana:'JOELHADA' }[selected];
  touchSecond.setAttribute('aria-label',second[selected]);
  document.querySelectorAll('[data-fighter]').forEach(card => {
    const chosen = card.dataset.fighter === selected;
    card.classList.toggle('selected', chosen); card.classList.toggle('opponent', (!network||lobby)&&card.dataset.fighter === opponent);
    card.setAttribute('aria-pressed', String(chosen));
    card.querySelector('.player-chip').textContent = chosen ? network?'VOCÊ':'JOGADOR 1' : (!network||lobby)&&card.dataset.fighter === opponent ? story?'PARCEIRO':local ? 'JOGADOR 2' : 'ADVERSÁRIO' : 'ESCOLHER';
  });
  onlineBusy(online.active);
}
document.querySelectorAll('[data-fighter]').forEach(button => button.addEventListener('click', () => {
  if(online.active&&!online.selectCharacter(button.dataset.fighter))return;
  selected = button.dataset.fighter; audio.unlock(); audio.tone({marcelo:392,rafael:493.88,gustavo:587.33,gelton:659.25,marcelino:698.46,marcos:349.23,joao:440,ruan:523.25,tais:554.37,luciana:622.25}[selected], .09, 'triangle', .15);
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
    const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3}[e.key];
    cards[(cards.indexOf(button)+step+cards.length)%cards.length]?.focus();
  });
});
$('opponent').addEventListener('change', () => { opponent = $('opponent').value; updateSelection(); });
document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change',()=>{selectionModes[selectionFamily]=getMode();inputs.release();updateSelection();}));
updateSelection();

async function start(checkpoint=null) {
  if(checkpoint instanceof Event)checkpoint=null;
  if(getMode()==='online'){
    if(engine.phase==='result'&&online.running){online.finish();return;}
    if(online.lobby&&!online.running){online.confirm();return;}
    showRooms(selectionFamily);return;
  }
  if(engine.storyActive&&engine.phase==='result'&&!engine.story.ending){inputs.queue(0,'storyRetry',1);audio.playing=true;return;}
  if (!ready || starting) return;
  if(checkpoint){[selected,opponent]=checkpoint.pair;updateSelection();}
  const pair=[selected,opponent],mode=battleMode();
  starting=true;$('start').disabled=true;$('start').textContent='Preparando a luta…';
  $('load-status').textContent=`Carregando ${CHARACTERS[pair[0]].name} e ${CHARACTERS[pair[1]].name}…`;
  inputs.release();audio.unlock();
  audio.loadFighters(pair).catch(error=>console.warn('Áudio de combate indisponível.',error));
  try{await Promise.all([renderer.load(pair),...(isStory()?[renderer.loadStory()]:[])]);}catch(error){
    $('load-status').textContent=`${error.message}. Pressione Começar para tentar novamente.`;
    starting=false;$('start').disabled=false;$('start').textContent='Começar a luta';return;
  }
  selected=pair[0];opponent=pair[1];updateSelection();
  starting=false;$('start').disabled=false;$('start').textContent='Começar a luta';
  $('load-status').textContent='Selecione o personagem e pressione Enter ou Começar a luta';
  audio.playing = true;
  inputs.network();$('restart').hidden=false;$('online-hud').hidden=true;
  $('selection').hidden = true; $('pause-screen').hidden = true; $('result-screen').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pausar';
  $('game').focus();
  $('touch-controls').hidden = !(matchMedia('(pointer: coarse)').matches && ['cpu','story-solo','story-online'].includes(mode));
  engine.start(selected, mode, opponent,checkpoint?{act:checkpoint.act,timer:checkpoint.timer}:{});
  if(isStory())$('game').setAttribute('aria-label','Operação Resgate do NIT: campanha em quatro atos. Avance, desative equipamentos e enfrente os chefes.');
  else $('game').setAttribute('aria-label', `Jogo de luta: ${CHARACTERS[selected].name} contra ${CHARACTERS[opponent].name}. Os comandos estão no botão de informações dos personagens.`);
}
function selection(closeNetwork=true) {
  if(closeNetwork&&online.active)online.close();inputs.network();onlineBusy(false);$('online-hud').hidden=true;$('room-share').hidden=true;
  renderer.event({ type: 'selection' });
  $('story-dialog').hidden=true;$('story-hud').hidden=true;$('story-dialog').dataset.scene='';
  engine.phase = 'selection'; engine.paused = false; inputs.release(); audio.playing = false; audio.stopSamples();
  showScreen('selection');$('pause-screen').hidden = true; $('result-screen').hidden = true; $('touch-controls').hidden = true; $('pause').disabled = true;
  if(getMode()==='online'&&closeNetwork)showRooms(selectionFamily);else $('start').focus();
}
document.querySelectorAll('[data-menu]').forEach(button=>button.addEventListener('click',()=>{
  const route=button.dataset.menu;
  if(route==='versus'||route==='story')showModeScreen(route);
  else showRooms(route==='online-story'?'story':'versus');
}));
document.querySelectorAll('[data-mode-choice]').forEach(button=>button.addEventListener('click',()=>chooseLocalMode(button.dataset.modeChoice)));
$('mode-back').addEventListener('click',showMainMenu);
$('room-back').addEventListener('click',showMainMenu);
$('selection-back').addEventListener('click',()=>{
  if(getMode()==='online'){selection();return;}
  showModeScreen(selectionFamily);
});
$('menu-home').addEventListener('click',showMainMenu);
$('home-link').addEventListener('click',e=>{e.preventDefault();showMainMenu();});
$('continue-story').addEventListener('click',()=>start(readCheckpoint(battleMode())));
$('story-next').addEventListener('click',()=>{inputs.queue(0,'storyNext',1);$('game').focus();});
$('story-swap').addEventListener('click',()=>{inputs.queue(0,'storySwap',1);$('game').focus();});
$('start').addEventListener('click', start); $('restart').addEventListener('click',()=>{if(engine.storyActive){inputs.release();engine.paused=false;engine.retryAct();}else start();}); $('rematch').addEventListener('click', start);
$('back').addEventListener('click', selection); $('result-back').addEventListener('click',()=>{if(online.running&&engine.phase==='result')online.finish();else selection();});
function pause(){if(online.running)online.pause();else engine.togglePause();}
$('resume').addEventListener('click',pause);$('pause').addEventListener('click',pause);
$('create-room').addEventListener('click',()=>startOnline('create'));$('join-room').addEventListener('click',()=>startOnline('join'));
$('find-room').addEventListener('click',()=>startOnline('quick'));
$('room-code').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();startOnline('join');}});
$('cancel-online').addEventListener('click',()=>{online.close();onlineBusy(false);$('room-share').hidden=true;$('room-status').textContent='Busca cancelada. Crie ou encontre uma sala.';directory.refresh();});
$('leave-online').addEventListener('click',()=>{selection();updateSelection();});
$('copy-room').addEventListener('click',async()=>{
  const link=new URL(location.href);link.search='';link.searchParams.set('sala',online.code);if(online.gameMode==='story')link.searchParams.set('modo','historia');
  try{await navigator.clipboard.writeText(link.href);$('copy-room').textContent='Convite copiado';}catch{$('room-status').textContent=`Envie o código ${online.code} para o outro jogador.`;}
});
$('sound').addEventListener('click', () => { audio.unlock(); const enabled = audio.toggle(); $('sound-state').textContent = enabled ? 'ON' : 'OFF'; $('sound').setAttribute('aria-pressed', String(enabled)); });
let wasFullscreen=false,fullscreenExitAt=-Infinity;
function syncFullscreen(){
  const full=Boolean(document.fullscreenElement)||$('game-shell').classList.contains('expanded');
  if(wasFullscreen&&!full)fullscreenExitAt=performance.now();
  wasFullscreen=full;
  $('fullscreen').textContent=full?'Sair da tela cheia':'Tela cheia';
  $('fullscreen').setAttribute('aria-pressed',String(full));
  document.body.classList.toggle('game-expanded',full);inputs.release();
  if(screens.every(id=>$(id).hidden)&&!engine.paused)$('game').focus();
}
$('fullscreen').addEventListener('click', async () => {
  const shell=$('game-shell');
  if(document.fullscreenElement){await document.exitFullscreen();}
  else if(shell.classList.contains('expanded'))shell.classList.remove('expanded');
  else {try {if(!shell.requestFullscreen)throw new Error('Fullscreen indisponível');await shell.requestFullscreen();}
    catch {shell.classList.add('expanded');}}
  syncFullscreen();
});
document.addEventListener('fullscreenchange',syncFullscreen);
window.addEventListener('keydown', e => {
  if(e.code==='Escape'&&(document.fullscreenElement||$('game-shell').classList.contains('expanded'))){
    e.preventDefault();
    if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
    else {$('game-shell').classList.remove('expanded');syncFullscreen();}
    return;
  }
  if(e.code==='Escape'&&performance.now()-fullscreenExitAt<250){e.preventDefault();return;}
  if(e.code==='Escape'&&!$('selection').hidden){e.preventDefault();$('selection-back').click();return;}
  if(e.code==='Escape'&&(!$('mode-screen').hidden||!$('room-screen').hidden)){e.preventDefault();showMainMenu();return;}
  if(e.code==='Escape'&&!$('menu-screen').hidden){e.preventDefault();return;}
  if(['INPUT','SELECT','TEXTAREA','BUTTON','A','SUMMARY'].includes(e.target.tagName)||e.target.closest('[data-fighter]'))return;
  if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); pause(); }
  if(e.code==='Enter'&&!e.repeat&&engine.storyActive&&engine.phase==='storyDialog'){e.preventDefault();inputs.queue(0,'storyNext',1);return;}
  if(e.code==='Enter'&&!e.repeat&&!$('menu-screen').hidden){e.preventDefault();document.querySelector('[data-menu="versus"]').click();return;}
  if (e.code === 'Enter' && !e.repeat && (engine.phase === 'selection' || engine.phase === 'result')) { e.preventDefault(); start(); }
});

// USB control detection is active in menus, during fights, and on pause screens.
function refreshGamepadPanel(){
  const pads=inputs.connectedGamepads(),pad=pads[0];
  $('gamepad-config').textContent=pads.length?`🎮 USB: ${pads.length}`:'🎮 Controle USB';
  $('gamepad-config').title=pads.length?pads.map(p=>p.id).join(' / '):'Conecte um controle e pressione qualquer botão';
  $('gamepad-info').textContent=pad?`${pads.length} controle(s) detectado(s): ${pad.id} · ${pad.mapping==='standard'?'XInput / padrão':'USB genérico'}`:
    (typeof navigator.getGamepads==='function'?'Nenhum controle detectado. Conecte-o e pressione qualquer botão para ativá-lo no navegador.':'Gamepad API indisponível. Abra o jogo por HTTPS em um navegador compatível.');
  const map=pad?inputs.gamepadMappings.for(pad):null;
  for(const b of document.querySelectorAll('[data-pad-bind]')){
    b.disabled=!pad;
    b.querySelector('[data-pad-number]').textContent=map?.[b.dataset.padBind]??'—';
  }
  $('gamepad-reset').disabled=!pad;
}
function closeGamepadPanel(){
  inputs.cancelCapture();inputs.gamepadUiLocked=false;$('gamepad-panel').hidden=true;
  $('gamepad-config').setAttribute('aria-expanded','false');$('gamepad-config').focus();
}
$('gamepad-config').addEventListener('click',()=>{
  if(!$('gamepad-panel').hidden){closeGamepadPanel();return;}
  $('gamepad-panel').hidden=false;inputs.gamepadUiLocked=true;inputs.release();
  $('gamepad-config').setAttribute('aria-expanded','true');refreshGamepadPanel();
});
$('gamepad-close').addEventListener('click',closeGamepadPanel);
$('gamepad-reset').addEventListener('click',()=>{
  inputs.resetGamepad();$('gamepad-feedback').textContent='Configuração padrão restaurada.';refreshGamepadPanel();
});
for(const b of document.querySelectorAll('[data-pad-bind]'))b.addEventListener('click',()=>{
  const action=b.dataset.padBind;
  if(inputs.startCapture(action))$('gamepad-feedback').textContent=`Aguardando botão físico para: ${b.textContent.trim().split(/\s+/)[0]}…`;
  else $('gamepad-feedback').textContent='Conecte um controle e pressione um botão para ativá-lo.';
});
inputs.onGamepadStatus=()=>refreshGamepadPanel();
inputs.onGamepadBinding=(action,index)=>{
  refreshGamepadPanel();$('gamepad-feedback').textContent=action?`Botão ${index} associado a ${action}. Configuração salva.`:'Configuração restaurada.';
};
inputs.onGamepadSignal=(pad,state,slot)=>{
  if($('gamepad-panel').hidden||slot!==0)return;
  const buttons=state.raw.flatMap((on,i)=>on?[i]:[]);
  const dir=['up','down','left','right'].filter(k=>state[k]);
  $('gamepad-live').textContent=`Botões: ${buttons.join(', ')||'nenhum'} · Direções: ${dir.join(', ')||'neutro'}`;
};
function gamepadAction(action,slot){
  if(slot>0&&getMode()!=='local')return;
  if(!$('gamepad-panel').hidden)return;
  if(engine.phase==='storyDialog'&&!engine.paused){
    if(action==='confirm'||action==='start')inputs.queue(slot,'storyNext',1);
    return;
  }
  if(action==='pause'){if(screens.every(id=>$(id).hidden)&&!engine.paused)pause();return;}
  let section=null;
  if(!$('pause-screen').hidden)section=$('pause-screen');
  else if(!$('result-screen').hidden)section=$('result-screen');
  else section=screens.map(id=>$(id)).find(el=>!el.hidden);
  if(!section)return;
  const candidates=[...section.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length);
  if(action==='back'){
    const back=section.id==='selection'?'selection-back':section.id==='room-screen'?'room-back':section.id==='mode-screen'?'mode-back':section.id==='pause-screen'?'resume':section.id==='result-screen'?'result-back':null;
    if(back)$(back).click();return;
  }
  if(action==='confirm'||action==='start'){
    let target=candidates.includes(document.activeElement)?document.activeElement:null;
    if(!target||!target.matches('button'))target=candidates.find(el=>el.matches('button'));
    target?.click();return;
  }
  if(!['up','down','left','right'].includes(action)||!candidates.length)return;
  const focused=candidates.indexOf(document.activeElement);
  const step=section.id==='selection'?(action==='up'?-3:action==='down'?3:action==='left'?-1:1):(action==='up'||action==='left'?-1:1);
  candidates[((focused<0?0:focused)+step+candidates.length*5)%candidates.length]?.focus();
}
inputs.onGamepadAction=gamepadAction;
refreshGamepadPanel();

function autopause() { if(online.running)return; if (!engine.paused && ['intro', 'fight', 'roundEnd','storyDialog'].includes(engine.phase)) pause(); }
window.addEventListener('blur', autopause); document.addEventListener('visibilitychange', () => { if (document.hidden) autopause(); });

let last = performance.now(), accumulator = 0;
function frame(now) {
  const dt = Math.min(.066, (now - last) / 1000); last = now;
  // Gamepad API requires continuous polling, also while paused and on menu screens.
  inputs.update();
  if(online.running){if(!engine.paused)online.advance();accumulator=0;}
  else if (!engine.paused) { accumulator += dt; while (accumulator >= FIXED_STEP) { engine.update(FIXED_STEP); accumulator -= FIXED_STEP; } }
  else accumulator = 0;
  online.tick();
  const alpha=online.running?1:accumulator/FIXED_STEP;
  syncStoryUI(engine,online);
  renderer.draw(engine, engine.paused ? 0 : dt, engine.paused ? 1 : alpha); audio.tick(dt); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// HTML previews are visible immediately; full animation and audio are loaded per match.
$('start').disabled=false;updateSelection();showMainMenu();
$('load-status').textContent='Escolha os lutadores e comece a partida.';
const invitation=normalizeCode(new URLSearchParams(location.search).get('sala')??'');
if(invitation){showRooms(new URLSearchParams(location.search).get('modo')==='historia'?'story':'versus');$('room-code').value=invitation;$('room-status').textContent='Convite recebido. Clique em Entrar na sala.';}
renderer.loadBackground().catch(error=>console.warn('Cenário indisponível.',error));

// Exposed only on explicit debug requests for reproducible local gameplay checks.
if (new URLSearchParams(location.search).has('debug')) window.streetVicente = { engine, renderer, inputs, audio, start, selection };

function renderRooms(rooms){
  const list=$('rooms-list');list.replaceChildren();
  $('rooms-message').textContent=rooms.length?`${rooms.length} sala${rooms.length===1?'':'s'} online`:'Nenhuma sala aberta. Crie uma sala para jogar.';
  for(const room of rooms){
    const row=document.createElement('li'),code=document.createElement('strong'),name=document.createElement('span'),state=document.createElement('span'),button=document.createElement('button');
    code.textContent=room.code;name.textContent=`${room.game_mode==='story'?'História · ':''}${CHARACTERS[room.character]?.name??'Jogador'}`;state.textContent=roomLabel(room.status);state.className=`room-state ${room.status}`;
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
