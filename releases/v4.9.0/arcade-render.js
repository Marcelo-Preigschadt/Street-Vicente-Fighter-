import {ARCADE_STOPS,formatScore} from './arcade.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const drawable=image=>image&&image.width>0&&image.height>0&&image.complete!==false&&image.naturalWidth!==0;
function label(c,value,x,y,size,color='#fff',align='center'){
 c.font=`900 ${size}px Arial`;c.textAlign=align;c.textBaseline='middle';c.lineWidth=4;c.strokeStyle='#06122b';c.strokeText(value,x,y);c.fillStyle=color;c.fillText(value,x,y);
}
function path(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
export function drawArcadeMap(c,run,{progress=0,clock=0,portraits={},names={},reduced=false}={}){
 c.save();c.fillStyle='#091939';c.fillRect(0,0,1200,610);
 const gradient=c.createLinearGradient(0,0,1200,610);gradient.addColorStop(0,'#173b69');gradient.addColorStop(1,'#17183f');c.fillStyle=gradient;c.fillRect(0,0,1200,610);
 c.strokeStyle='#71cfeb13';c.lineWidth=1;for(let x=0;x<1200;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x,610);c.stroke();}for(let y=0;y<610;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(1200,y);c.stroke();}
 for(const [i,stop] of ARCADE_STOPS.entries()){
  const x=stop.x-105,y=stop.y-87,done=i<=run.index,next=i===run.index+1;
  path(c,[[x,y+12],[x+12,y],[x+200,y],[x+210,y+12],[x+210,y+160],[x,y+160]]);c.fillStyle=done?'#23606166':'#27446e66';c.strokeStyle=next?'#f8ce4b99':'#80a5d84a';c.lineWidth=2;c.fill();c.stroke();
  c.fillStyle='#7dafcd22';for(let j=0;j<5;j++)c.fillRect(x+13+j*38,y+17,25,9);
  label(c,stop.name,stop.x,y+147,15,done?'#b7e78a':'#abc9dc');
 }
 c.strokeStyle='#3a5375';c.lineWidth=12;c.lineJoin='round';c.beginPath();ARCADE_STOPS.forEach((s,i)=>i?c.lineTo(s.x,s.y):c.moveTo(s.x,s.y));c.stroke();
 c.strokeStyle='#81aac733';c.lineWidth=2;c.setLineDash([8,8]);c.stroke();c.setLineDash([]);
 c.strokeStyle='#87f8c4';c.lineWidth=6;c.shadowColor='#41ffc3';c.shadowBlur=reduced?0:10;c.beginPath();ARCADE_STOPS.slice(0,run.index+1).forEach((s,i)=>i?c.lineTo(s.x,s.y):c.moveTo(s.x,s.y));c.stroke();c.shadowBlur=0;
 const from=run.stop,to=run.nextStop,q=clamp((progress-.14)/.7),t=q*q*(3-2*q),x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t;
 c.strokeStyle='#ffde58';c.lineWidth=6;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(x,y);c.stroke();
 for(const [i,id] of run.opponents.entries()){
  const s=ARCADE_STOPS[i%ARCADE_STOPS.length],done=i<=run.index,next=i===run.index+1,portrait=portraits[id];
  c.save();c.beginPath();c.arc(s.x,s.y,30,0,Math.PI*2);c.fillStyle=done?'#426d63':'#0c1a36';c.fill();c.clip();if(drawable(portrait))c.drawImage(portrait,s.x-30,s.y-30,60,60);c.restore();
  c.beginPath();c.arc(s.x,s.y,32,0,Math.PI*2);c.strokeStyle=done?'#8fffbb':next?'#ffdc57':'#6f92bf';c.lineWidth=next?4:2;c.stroke();
  label(c,done?'✓':String(i+1).padStart(2,'0'),s.x-37,s.y-36,18,done?'#9dffd4':'#d4e4f7');
  label(c,(names[id]??id).replace('Prof. ','').replace('Prof ','').replace('Aluno ',''),s.x,s.y+46,17,next?'#ffe76c':'#eef4ff');
  if(next&&!reduced){c.beginPath();c.arc(s.x,s.y,39+Math.sin(clock*4)*3,0,Math.PI*2);c.strokeStyle='#ffe76c88';c.lineWidth=2;c.stroke();}
 }
 // A moving NIT access badge carries the player's face through the school.
 c.save();c.translate(x,y);c.shadowColor='#80ffff';c.shadowBlur=reduced?0:18;
 path(c,[[-24,-47],[18,-47],[26,-39],[26,15],[-26,15],[-26,-39]]);c.fillStyle='#19d0e7';c.strokeStyle='#f3ffff';c.lineWidth=3;c.fill();c.stroke();c.shadowBlur=0;
 const hero=portraits[run.playerId];if(drawable(hero))c.drawImage(hero,-20,-38,40,40);
 label(c,'P1',0,10,14,'#072b3b');c.restore();
 label(c,'CIRCUITO VICENTE DUTRA',600,580,18,'#d2ecff');c.restore();
}
export function drawArcadeScore(c,run){
 if(!run)return;c.save();
 label(c,`1P  ${formatScore(run.score)}`,134,19,15,'#fff6cb','left');
 label(c,`HI  ${formatScore(run.record)}`,1146,19,15,'#fff6cb','right');
 label(c,`ARCADE · ${run.index+1}/${run.total}`,640,135,12,'#8cf5e9');c.restore();
}
