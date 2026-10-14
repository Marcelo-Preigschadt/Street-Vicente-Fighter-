import {ARCADE_ROUTE_SECONDS,formatScore} from './arcade.js';
import {drawArcadeMap} from './arcade-render.js';
const $=id=>document.getElementById(id);
const categories=[['combat','ACERTOS'],['combo','COMBOS'],['life','VIDA'],['time','TEMPO'],['perfect','PERFECT'],['super','SUPER'],['round','ROUNDS'],['match','VITÓRIA']];
export class ArcadeView {
 constructor({characters,portraitPath}){
  this.characters=characters;this.portraitPath=portraitPath;this.c=$('arcade-map').getContext('2d');this.clock=0;
  this.portraits=Object.fromEntries([...document.querySelectorAll('[data-fighter]')].map(card=>[card.dataset.fighter,card.querySelector('img')]));
  this.names=Object.fromEntries(Object.entries(characters).map(([id,c])=>[id,c.name]));
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 }
 hide(){$('arcade-route').hidden=true;}
 show(run){
  this.run=run;this.clock=0;$('arcade-route').hidden=false;
  $('arcade-route-title').textContent='NEXT CHALLENGER';$('arcade-route-progress').textContent=`${run.wins}/${run.total} LUTAS VENCIDAS`;
  $('arcade-route-score').textContent=formatScore(run.score);$('arcade-route-record').textContent=formatScore(run.record);
  const next=this.characters[run.nextOpponentId];$('arcade-next-name').textContent=next.name;$('arcade-next-place').textContent=run.nextStop.name;
  $('arcade-next-face').src=this.portraitPath(run.nextOpponentId);$('arcade-next-face').alt=next.name;
  $('arcade-hero-face').src=this.portraitPath(run.playerId);$('arcade-hero-face').alt=this.characters[run.playerId].name;
  $('arcade-hero-name').textContent=this.characters[run.playerId].name;
  $('arcade-route-status').textContent='Preparando o próximo adversário…';$('arcade-next').textContent='Próxima luta';
  const box=$('arcade-bonuses');box.replaceChildren();
  for(const [key,name] of categories){const item=document.createElement('div'),label=document.createElement('span'),value=document.createElement('strong');label.textContent=name;value.textContent=`+${run.breakdown[key].toLocaleString('pt-BR')}`;item.append(label,value);box.append(item);}
  this.draw(0);$('arcade-next').focus();
 }
 error(error){$('arcade-route-status').textContent=`${error.message}. Tente carregar novamente.`;$('arcade-next').textContent='Tentar novamente';}
 draw(progress){drawArcadeMap(this.c,this.run,{progress,clock:this.clock,portraits:this.portraits,names:this.names,reduced:this.reduced});}
 tick(dt,flow){
  if($('arcade-route').hidden||!this.run)return;this.clock+=dt;this.draw(flow.routeTime/ARCADE_ROUTE_SECONDS);
  const count=Math.min(1,this.clock/1.6),earned=Math.round(this.run.fightScore*(1-Math.pow(1-count,3)));
  $('arcade-route-score').textContent=formatScore(this.run.score-this.run.fightScore+earned);
  if(!flow.error)$('arcade-route-status').textContent=flow.prepared?`Próxima luta em ${Math.max(0,Math.ceil(ARCADE_ROUTE_SECONDS-flow.routeTime))} s · Enter ou Start para avançar`:'Preparando o próximo adversário…';
 }
 result(run){
  this.hide();const complete=run.state==='complete';$('result-eyebrow').textContent=complete?'ARCADE CLEAR':'CONTINUE?';
  $('winner-name').textContent=complete?'CAMPEÃO DO VICENTE!':'A ROTA AINDA NÃO ACABOU';
  $('winner-quote').textContent=complete?`${this.characters[run.playerId].name} venceu todos os ${run.total} adversários.`:`${this.characters[run.opponentId].name} venceu. Continue neste confronto.`;
  $('result-score').hidden=false;$('result-score-value').textContent=formatScore(run.score);$('result-record-value').textContent=formatScore(run.record);
  $('result-progress').textContent=`${run.wins}/${run.total} lutas · ${run.perfects} Perfect · ${run.continues} continuações${complete?' · Bônus de conclusão: +20.000':' · Continuar reinicia a pontuação'}`;
  $('rematch').textContent=complete?'Novo circuito':'Continuar';$('rematch').hidden=false;$('rematch').disabled=false;
  $('result-back').textContent='Seleção de personagens';$('result-back').disabled=false;$('result-screen').hidden=false;$('rematch').focus();
 }
}
