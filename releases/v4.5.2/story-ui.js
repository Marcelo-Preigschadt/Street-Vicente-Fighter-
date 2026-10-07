import {STORY_ACTS,STORY_PREMISE,STORY_RULES,STORY_HEROES} from './story-data.js';
const $=id=>document.getElementById(id);
const titles={entry:'O sinal bateu. A luta começou.',boss:'Portão bloqueado',exo:'A IA assumiu o exoesqueleto',clear:'Bloco recuperado'};
export function readCheckpoint(mode){try{const s=JSON.parse(localStorage.getItem(`${STORY_RULES.checkpointKey}-${mode}`));return s&&s.version===1&&Number.isInteger(s.act)&&s.act>=0&&s.act<=3&&Array.isArray(s.pair)&&s.pair.length===2&&s.pair.every(id=>STORY_HEROES.includes(id))&&Number.isFinite(s.timer)&&s.timer>0&&s.timer<=900?s:null;}catch{return null;}}
export function saveCheckpoint(engine){if(!engine.storyActive||engine.mode==='story-online')return;try{localStorage.setItem(`${STORY_RULES.checkpointKey}-${engine.mode}`,JSON.stringify({version:1,act:engine.story.act,pair:engine.fighters.map(f=>f.character.id),timer:engine.story.checkpointTimer}));}catch{}}
export function clearCheckpoint(engine){if(engine.mode==='story-online')return;try{localStorage.removeItem(`${STORY_RULES.checkpointKey}-${engine.mode}`);}catch{}}
export function syncStoryUI(engine,online){
  const active=engine.storyActive&&engine.phase!=='selection';$('story-hud').hidden=!active;
  $('story-dialog').hidden=!active||engine.phase!=='storyDialog'||engine.paused;
  if(engine.storyActive)$('touch-controls').hidden=!matchMedia('(pointer: coarse)').matches||!active||engine.phase!=='fight'||engine.paused;
  if(!active)return;
  const s=engine.story,a=STORY_ACTS[s.act];
  $('story-current').textContent=`Operação Resgate do NIT · Ato ${s.act+1}/4 · ${a.place}`;
  $('story-swap').hidden=!s.boss||engine.cpu||engine.phase!=='fight';
  $('story-swap').textContent=`Trocar lutador · P${s.duelist===0?2:1}`;
  $('story-help').hidden=true;$('story-help').textContent=s.boss?'Duelo 1 × 1. O parceiro fica na reserva; a troca exige sair do ataque.':'Soco: atacar / pegar / arremessar · Chute · Pular · Especial: poder / super com barra cheia · dois toques: correr';
  if(engine.phase==='storyDialog'){
    const key=`${s.act}-${s.dialog}`;
    if($('story-dialog').dataset.scene!==key){
      $('story-dialog').dataset.scene=key;$('story-scene').src=`assets/story/${a.id}.webp`;
      $('story-act').textContent=`ATO ${s.act+1} / 4 · ${a.place}`;
      $('story-title').textContent=s.dialog==='entry'?a.title:titles[s.dialog];
      $('story-speaker').textContent={marcelo:'Prof. Marcelo',rafael:'Prof. Rafael',gustavo:'Prof. Gustavo'}[a.speaker];
      $('story-speaker-image').src=`assets/runtime/${a.speaker}-head-menu-v${a.speaker==='tais'?4:3}.webp`;
      $('story-quote').textContent=s.dialog==='exo'?'A.U.L.A. 3.0: “Meu sistema não pode ser desligado.”':s.dialog==='clear'?(s.act===3?'Marcelo: “Servidor recuperado. Bora NIT!”':`${a.place} recuperado. Os portões do próximo bloco foram liberados.`):a.quote;
      $('story-body').textContent=s.dialog==='entry'?(s.act===0?STORY_PREMISE:a.objective):s.dialog==='boss'?`${a.action} ${s.boss&& !engine.cpu?'Um lutador entra no duelo; o parceiro fica na reserva.':''}`:s.dialog==='exo'?'O holograma se conecta aos braços hidráulicos no topo da sala dos servidores. Salte sobre o impacto no chão e ataque durante a recuperação.':s.act===3?'A IA foi isolada. Os drones pousaram, o conselho disciplinar voltou ao normal e os portões da escola se abriram antes do fim do turno.':'A equipe recupera a vida e leva a carga de poder ao próximo ato. O avanço foi salvo neste dispositivo.';
      $('story-next').textContent=s.dialog==='entry'?'Iniciar o ato':s.dialog==='boss'?'Iniciar duelo':s.dialog==='exo'?'Enfrentar o exoesqueleto':s.act===3?'Concluir resgate':'Ir para o próximo ato';
      $('story-route').replaceChildren(...STORY_ACTS.map((act,i)=>{const el=document.createElement('span');el.textContent=`${i+1}. ${act.place}`;el.className=i<s.act?'done':i===s.act?'current':'';return el;}));
    }
  }
  if(engine.phase==='result'){
    $('result-screen').hidden=false;$('touch-controls').hidden=true;$('pause').disabled=true;
    $('winner-name').textContent=s.ending?'NIT recuperado!':'Resgate interrompido';
    $('winner-quote').textContent=s.ending?`A escola está livre. ${s.score} pontos · ${s.defeated} ameaças desativadas.`:engine.timer<=0?'O turno terminou. Tente recuperar este bloco novamente.':'A equipe caiu. Você pode tentar novamente a partir deste ato.';
    $('rematch').textContent=s.ending?'Jogar a campanha novamente':`Tentar o ato ${s.act+1} novamente`;
  }else $('result-screen').hidden=true;
}
