import {FIGHTING_STYLES} from './styles.js';
import {drawArcadeScore} from './arcade-render.js';
const clamp=n=>Math.max(0,Math.min(1,n));
function word(c,value,x,y,size,color='#fff',align='left'){
 c.font=`${size}px VicenteArcade, Impact, Arial`;c.textAlign=align;c.textBaseline='middle';c.lineJoin='round';c.lineWidth=Math.max(3,size*.13);c.strokeStyle='#091226';c.strokeText(value,x,y);c.fillStyle=color;c.fillText(value,x,y);
}
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
export function drawVersusHUD(r,engine){
 const c=r.c;c.save();
 const wash=c.createLinearGradient(0,0,0,148);wash.addColorStop(0,'#071229c9');wash.addColorStop(1,'#07122900');c.fillStyle=wash;c.fillRect(0,0,1280,148);
 for(const [slot,f] of engine.fighters.entries()){
  const right=slot===1,x=right?720:110,w=450,portraitX=right?1178:26,color=right?'#ff766d':'#73deff';
  if(!engine.arcadeRun)word(c,right?engine.cpu?'CPU CHALLENGER':'2P CHALLENGER':'1P CHALLENGER',right?1164:114,17,15,'#fff6a2',right?'right':'left');
  polygon(c,[[portraitX-7,26],[portraitX+61,26],[portraitX+73,38],[portraitX+73,106],[portraitX-7,106]]);c.fillStyle=right?'#a62459':'#2058a2';c.fill();c.strokeStyle='#ffffff';c.lineWidth=2;c.stroke();
  const portrait=r.portraits[f.character.id];if(portrait)c.drawImage(portrait,portraitX-3,30,70,72);
  polygon(c,[[x,37],[x+w-14,37],[x+w,51],[x+w-14,67],[x,67],[x-12,52]]);c.fillStyle='#101528';c.fill();
  c.save();c.clip();
  const display=engine.phase==='roundEnd'?f.hp+(f.displayHP-f.hp)*Math.exp(-engine.phaseTime*6):f.displayHP;
  const current=clamp(f.hp/1000)*w,trailing=clamp(Math.max(f.hp,display)/1000)*w;
  c.fillStyle='#ed504d';c.fillRect(right?x+w-trailing:x,40,trailing,24);
  const life=c.createLinearGradient(0,40,0,65);life.addColorStop(0,f.hp<250?'#ffba49':'#ffffa6');life.addColorStop(.45,f.hp<250?'#ff7542':'#ffe72e');life.addColorStop(1,f.hp<250?'#d93130':'#e2a908');
  c.fillStyle=life;c.fillRect(right?x+w-current:x,40,current,24);c.restore();
  c.strokeStyle='#fff8d8';c.lineWidth=2.5;c.stroke();
  for(let i=0;i<3;i++){const tx=right?x+w+6+i*5:x-8-i*5;polygon(c,[[tx,42],[tx+5,42],[tx+16,61],[tx+11,61]]);c.fillStyle='#9ffc71';c.fill();}
  word(c,f.character.name.toLocaleUpperCase('pt-BR'),right?x+w:x,83,24,'#fff',right?'right':'left');
  word(c,FIGHTING_STYLES[f.character.id].name.toLocaleUpperCase('pt-BR'),right?x+w:x,110,12,color,right?'right':'left');
  for(let i=0;i<2;i++){
   const sx=right?x+20+i*23:x+w-20-i*23;
   polygon(c,[[sx,91],[sx+7,98],[sx,105],[sx-7,98]]);c.fillStyle=i<f.wins?'#ffe752':'#243652';c.strokeStyle=i<f.wins?'#fffad1':'#7191b6';c.lineWidth=1.5;c.fill();c.stroke();
  }
  const energyX=right?822:34,energyW=424,energy=clamp(f.meter/100),level=Math.min(3,Math.floor(f.meter/100*3));
  polygon(c,[[energyX,663],[energyX+energyW,663],[energyX+energyW-15,689],[energyX+15,689]]);c.fillStyle='#101a36d9';c.fill();c.strokeStyle='#ebf6ff';c.lineWidth=2;c.stroke();
  c.save();c.clip();const power=c.createLinearGradient(energyX,0,energyX+energyW,0);power.addColorStop(0,'#1676d9');power.addColorStop(.7,'#40d7ed');power.addColorStop(1,'#fff493');c.fillStyle=power;
  c.fillRect(right?energyX+energyW*(1-energy):energyX,667,energyW*energy,18);c.restore();
  for(let i=1;i<3;i++){c.fillStyle='#09162d';c.fillRect(energyX+energyW*i/3-2,665,4,22);}
  word(c,`LEVEL ${level}`,right?energyX+energyW:energyX,649,22,level===3?'#ffe552':'#fff',right?'right':'left');
  word(c,level===3?'SUPER READY':'SUPER',right?energyX:energyX+energyW,704,12,level===3?'#fff5a9':'#a7ccf4',right?'left':'right');
  if(f.customTime>0)word(c,`COMBO LIVRE ${f.customTime.toFixed(1)}s`,right?energyX+energyW:energyX,622,16,color,right?'right':'left');
  if(f.hp<250)word(c,'DANGER',right?x:x+w,125,13,'#ffbf82',right?'left':'right');
 }
 polygon(c,[[595,28],[608,20],[672,20],[685,28],[685,100],[672,108],[608,108],[595,100]]);c.fillStyle='#13374b';c.strokeStyle='#faffc6';c.lineWidth=3;c.fill();c.stroke();
 for(const side of [-1,1])for(let i=0;i<3;i++){const x=side<0?590-i*8:690+i*8;polygon(c,[[x,37],[x+side*6,41],[x+side*6,62],[x,58]]);c.fillStyle='#99ef6e';c.fill();}
 word(c,Math.ceil(engine.timer).toString().padStart(2,'0'),640,59,51,engine.timer<=10?'#ff895d':'#ecffc0','center');
 word(c,`ROUND ${engine.round}`,640,92,11,'#ffffff','center');
 word(c,'STREET VICENTE',640,684,15,'#fff0aa','center');word(c,'FIGHTER',640,703,15,'#88dafb','center');
 drawArcadeScore(c,engine.arcadeRun);c.restore();
}
export function drawVersusAnnouncer(r,engine){
 const c=r.c;let title='',subtitle='',color='#ffec57',size=100;
 if(engine.phase==='intro'){title=engine.fighters.every(f=>f.wins===1)?'FINAL ROUND':`ROUND ${engine.round}`;size=83;}
 if(engine.phase==='fight'&&engine.phaseTime<.62){title='FIGHT!';color='#ff5a51';size=118;}
 if(engine.phase==='roundEnd'){
  const winner=engine.roundWinner===null?null:engine.fighters[engine.roundWinner],perfect=winner?.hp===1000;
  title=winner?engine.phaseTime<.4?engine.timer<=0?'TIME OVER':'K.O.':perfect&&engine.phaseTime>=2.1?'PERFECT!':engine.cpu?engine.roundWinner===0?'YOU WIN!':'YOU LOSE!':`${engine.roundWinner===0?'1P':'2P'} WINS!`:'DRAW GAME';
  color=title==='PERFECT!'?'#8ffff0':'#ffec57';subtitle=winner?`${winner.character.name} · ROUND VENCIDO`:'NENHUM ROUND CONCEDIDO';size=title.length>10?74:96;
 }
 if(!title)return;
 c.save();const entering=engine.phase==='fight'?engine.phaseTime:engine.phaseTime%2.1,zoom=!r.reduced&&entering<.18?1+(.18-entering)*1.5:1;
 c.translate(640,330);c.scale(zoom,zoom);c.transform(1,0,-.1,1,0,0);
 c.fillStyle='#071329c9';polygon(c,[[-410,-56],[390,-56],[410,56],[-390,56]]);c.fill();
 c.font=`${size}px VicenteArcade, Impact, Arial`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 c.lineWidth=14;c.strokeStyle='#081734';c.strokeText(title,0,4);c.lineWidth=5;c.strokeStyle='#fff9d8';c.strokeText(title,0,0);
 c.fillStyle=color;c.fillText(title,0,0);c.restore();
 if(subtitle)word(c,subtitle,640,418,19,'#fff4dd','center');
}
