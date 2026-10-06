import {WORLD} from './engine.js';
import {STORY_ACTS,STORY_RULES,ENEMY_TYPES} from './story-data.js';
import {drawSentinel,drawSentinelLaser} from './sentinel-fx.js';
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Não foi possível carregar ${src}`));i.src=src;});
const text=(c,s,x,y,size=20,color='#edf6e7',align='left')=>{c.font=`800 ${size}px Arial`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);};
const rect=(c,x,y,w,h,color,r=6)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
export async function loadStoryArt(renderer){
  if(renderer.storyArt)return;
  const backgrounds=await Promise.all(STORY_ACTS.map(a=>load(`assets/story/${a.id}-panorama-v2.webp`)));
  const enemies=await Promise.all(Array.from({length:16},(_,i)=>load(`assets/story/enemy-${i}.webp`)));
  const inspector=await Promise.all(Array.from({length:4},(_,i)=>load(`assets/story/inspector-pose-${i}-v2.webp`)));const inspectorFrames=await fetch('assets/story/inspector-poses-v2.json').then(r=>r.json());renderer.storyArt={backgrounds,enemies,inspector,inspectorFrames};
}
function enemy(c,e,art,time,reduced){
  const pose=e.attackLife>0?(e.attackMode==='charge'?3:2):e.state==='walk'?Math.floor(e.animTime*7)%2:0,frame=e.kind==='inspector'?art.inspectorFrames?.[pose]:null;
  const p=e.profile??ENEMY_TYPES[e.kind],im=frame?art.inspector[pose]:art.enemies[p.cell];if(!im||e.deadTime>1.1)return;
  const scale=frame?.scale??p.h/im.height,w=im.width*scale,h=im.height*scale;
  c.save();c.translate(e.x,e.y);c.scale(e.direction,1);
  if(e.hp<=0){c.globalAlpha=Math.max(0,1-e.deadTime);c.rotate(-Math.min(Math.PI/2,e.deadTime*4));}
  else if(!reduced){c.translate(0,Math.sin(time*(e.state==='walk'?10:3)+e.slot)*2);if(e.telegraph>0)c.rotate(-.055);else if(e.attackLife>0)c.rotate(.09);else if(e.flash>0)c.rotate(-.08);}
  if(e.flash>0)c.globalAlpha=.65;
  c.drawImage(im,frame?-frame.anchorX*scale:-w/2,frame?-frame.bottom*scale:-h,w,h);c.restore();
  if(e.hp>0&&!p.boss){rect(c,e.x-45,e.y-h-15,90,6,'#102024');rect(c,e.x-45,e.y-h-15,90*e.hp/e.maxHp,6,p.color);}
  if(e.dizzyTime>0)text(c,'✦  ✦',e.x,e.y-h-32,22,'#ffe49e','center');
  if(e.telegraph>0){const alpha=.4+.3*Math.sin(time*16);c.fillStyle=`rgba(255,111,95,${alpha})`;c.beginPath();c.ellipse(e.x+e.direction*85,WORLD.floor+3,120,10,0,0,Math.PI*2);c.fill();text(c,'!',e.x,e.y-h-32,38,'#ffd48d','center');}
  if(e.attackLife>0){
    const box=e.attackbox;
    if(e.attackMode==='flame'){const g=c.createLinearGradient(e.x,0,e.x+e.direction*470,0);g.addColorStop(0,'#fff7aecc');g.addColorStop(.45,'#ff9e2a99');g.addColorStop(1,'#ef3e2033');c.fillStyle=g;c.beginPath();c.moveTo(e.x,worldY(150));c.lineTo(e.x+e.direction*470,worldY(80));c.lineTo(e.x+e.direction*470,worldY(180));c.closePath();c.fill();}
    else if(e.attackMode==='slam'){c.strokeStyle='#9cffb9';c.lineWidth=7;c.beginPath();c.ellipse(e.x,WORLD.floor,300,20,0,0,Math.PI*2);c.stroke();}
    else{c.strokeStyle=p.color;c.lineWidth=p.boss?14:8;c.lineCap='round';c.beginPath();c.moveTo(e.x,worldY(160));c.lineTo(e.x+e.direction*(p.range-20),worldY(e.attackMode==='staff'?205:140));c.stroke();}
  }
}
const worldY=h=>WORLD.floor-h;
function prop(c,p,time){
  const floor=WORLD.floor;c.save();c.translate(p.x,floor);
  if(p.kind==='medkit'&&!p.used){rect(c,-22,-44,44,36,'#e9f5de');rect(c,-4,-38,8,24,'#467d56',1);rect(c,-12,-30,24,8,'#467d56',1);}
  else if(p.kind==='shelf'){
    if(p.fall>0){c.translate(-60,0);c.rotate(Math.min(Math.PI/2,Math.max(0,p.fall-.4)*2.7));if(p.fall<.85){c.fillStyle='#f5686844';c.fillRect(20,-8,300,16);}}
    rect(c,-75,-310,150,310,'#583824',2);rect(c,-65,-300,130,290,'#211f27',0);
    for(let row=0;row<4;row++){for(let j=0;j<9;j++)rect(c,-59+j*14,-290+row*70,10,55,['#88adb2','#b47863','#8e97b9','#bcac79'][(j+row)%4],1);rect(c,-68,-228+row*70,136,6,'#96724b',0);}
  }else if(!p.used&&p.kind==='soda'){
    rect(c,-60,-230,120,230,'#284d55');rect(c,-50,-218,100,65,'#ffcb6e');text(c,'REFRI',0,-186,22,'#222e35','center');rect(c,-45,-137,75,84,'#122a32');for(let j=0;j<3;j++){rect(c,-36+j*23,-129,16,65,['#ed8b5b','#85bf6e','#b9b4ea'][j]);}rect(c,-26,-40,50,18,'#071316');
  }else if(!p.used&&p.kind==='table'){rect(c,-80,-115,160,17,'#af8452');rect(c,-65,-100,13,100,'#374145');rect(c,52,-100,13,100,'#374145');}
  else if(!p.used&&p.kind==='chair'){rect(c,-34,-115,68,57,'#cf9853');rect(c,-38,-55,76,12,'#ac7741');rect(c,-31,-45,9,45,'#35464e');rect(c,22,-45,9,45,'#35464e');}
  c.restore();
}
function hazard(c,h,time){
  const cycle=h.clock%h.period,warning=cycle<h.warning,active=cycle>=h.warning&&cycle<h.warning+h.active;const color=h.kind==='acid'?'#bcfb75':h.kind==='frost'?'#a9e9ff':'#8bffbf';
  if(h.kind==='cable'){c.strokeStyle='#142a23';c.lineWidth=10;c.beginPath();c.moveTo(h.x,150);c.bezierCurveTo(h.x+80,245,h.x-90,300,h.x,worldY(100));c.stroke();}
  else {rect(c,h.x-22,245,44,120,'#acd4d344');rect(c,h.x-16,274,32,84,color+'88');rect(c,h.x-30,362,60,10,'#c1d2d4');}
  if(warning||active){c.fillStyle=warning?'#ffbf6244':color+'55';c.fillRect(h.x-h.w/2,worldY(active&&h.kind==='cable'?260:18),h.w,active&&h.kind==='cable'?260:18);text(c,warning?'⚠':h.kind==='acid'?'ÁCIDO':h.kind==='frost'?'GELO':'ALTA TENSÃO',h.x,worldY(40),16,warning?'#ffd08c':color,'center');}
  if(active){c.strokeStyle=color;c.lineWidth=3;for(let i=0;i<6;i++){const x=h.x-h.w/2+i*h.w/5;c.beginPath();c.moveTo(x,worldY(2));c.lineTo(x+Math.sin(time*10+i)*13,worldY(h.kind==='cable'?220:35+Math.sin(time*4+i)*12));c.stroke();}}
}
function hud(r,e){
  const c=r.c,s=e.story,act=STORY_ACTS[s.act];
  rect(c,0,0,1280,132,'#071b22ed',0);
  for(const [i,f] of e.party.entries()){
    const x=28+i*345;const reserve=s.boss&&f.slot!==s.duelist;
    r.drawPortrait(f,x,20,false);text(c,`P${f.slot+1} · ${f.character.name}${reserve?' · RESERVA':''}`,x+82,27,16,reserve?'#a8b7b4':f.character.color);
    rect(c,x+82,43,225,14,'#354149');rect(c,x+82,43,225*f.hp/1000,14,f.hp>300?f.character.color:'#ff8074');
    rect(c,x+82,64,225,5,'#39424a');rect(c,x+82,64,225*f.meter/100,5,f.character.accent);text(c,f.meter>=100?'SUPER PRONTO':`PODER ${Math.floor(f.meter)}%`,x+82,83,12,f.character.accent);
  }
  const sec=Math.ceil(e.timer),mins=Math.floor(sec/60),seconds=String(sec%60).padStart(2,'0');
  text(c,`ATO ${s.act+1} / 4`,1250,24,18,'#d5f99f','right');text(c,`FIM DO TURNO  ${mins}:${seconds}`,1250,50,19,e.timer<120?'#ff9b82':'#eef5e6','right');text(c,`RESGATE ${s.score} PTS`,1250,78,13,'#a4c5ba','right');
  text(c,act.place.toUpperCase(),28,113,18,'#fbdeb1');
  text(c,s.boss?`DUELO 1 × 1${s.act===3?` · FASE ${s.bossPhase} / 2`:''}`:`ONDA ${s.wave} / 3 · ${e.enemies.filter(n=>n.hp>0).length} AMEAÇAS`,1250,112,15,'#b8d3ca','right');
  const boss=e.enemies.find(n=>n.profile.boss&&n.hp>0);
  if(boss){rect(c,365,147,550,50,'#0b1727e8');text(c,boss.profile.name,640,162,16,boss.profile.color,'center');rect(c,380,178,520,10,'#3a333e');rect(c,380,178,520*boss.hp/boss.maxHp,10,boss.profile.color);}
  if(s.noticeTime>0){rect(c,280,644,720,38,'#091b25e6');text(c,s.notice,640,664,18,'#fff0c6','center');}
  else if(!s.boss){text(c,e.enemies.some(n=>n.hp>0)?'ALINHE-SE COM O INIMIGO · DESVIE PARA CIMA OU PARA BAIXO':'AVANCE PARA A DIREITA  →',640,675,20,'#f7edbd','center');}
  const progress=s.boss?1:e.camera/2320;rect(c,28,700,1224,4,'#263c40');rect(c,28,700,1224*progress,4,'#b8ed68');
}
export function drawStory(r,e,dt,alpha){
  const c=r.c,art=r.storyArt;if(!art){c.fillStyle='#0b1b20';c.fillRect(0,0,1280,720);return;}
  if(e.phase==='selection')return;
  c.save();const bg=art.backgrounds[e.story.act],drift=e.story.boss?0:e.camera*.85;
  c.drawImage(bg,-drift,0,STORY_RULES.worldWidth,720);
  // Ground landmarks move at camera speed; distant walls move more slowly.
  c.strokeStyle=['#815e3e55','#638c8d55','#72608255','#356b5855'][e.story.act];c.lineWidth=2;
  for(let row=0;row<5;row++){const y=520+row*42;c.beginPath();c.moveTo(0,y);c.lineTo(1280,y);c.stroke();}
  for(let x=Math.floor(e.camera/180)*180;x<e.camera+1500;x+=180){c.beginPath();c.moveTo(x-e.camera,520);c.lineTo(x-e.camera-120,720);c.stroke();}
c.fillStyle='#09212922';c.fillRect(0,0,1280,720);
  const ground=c.createLinearGradient(0,610,0,720);ground.addColorStop(0,'#13262b00');ground.addColorStop(1,'#061920c0');c.fillStyle=ground;c.fillRect(0,610,1280,110);
  c.save();c.translate(-e.camera,0);
  for(const h of e.hazards)hazard(c,h,r.clock);
  const heroes=e.heroes.map(f=>({...f,x:f.prevX+(f.x-f.prevX)*alpha,y:f.prevY+(f.y-f.prevY)*alpha,lane:(f.prevLane??f.lane)+((f.lane??625)-(f.prevLane??f.lane))*alpha,walkDistance:f.walkDistance,walkBlend:f.walkBlend}));
  const entities=[...heroes.map(f=>({kind:'hero',value:f,lane:f.lane})),...e.enemies.map(n=>({kind:'enemy',value:n,lane:n.lane})),...e.props.map(p=>({kind:'prop',value:p,lane:p.lane??625}))].sort((a,b)=>a.lane-b.lane);
  for(const item of entities){const v=item.value;c.save();c.translate(0,item.lane-WORLD.floor);
    if(item.kind==='prop')prop(c,v,r.clock);
    else{c.fillStyle='#07101566';c.beginPath();c.ellipse(v.x,WORLD.floor+4,item.kind==='hero'?45:v.profile.w*.3,9,0,0,Math.PI*2);c.fill();if(item.kind==='hero')r.drawFighter(v);else enemy(c,v,art,r.clock,r.reduced);}
    c.restore();
  }
  for(const d of e.drones){c.save();c.translate(0,(d.lane??625)-625);drawSentinel(c,d,r.reduced);c.restore();}
  for(const l of e.lasers){c.save();c.translate(0,(l.lane??625)-625);drawSentinelLaser(c,l,r.reduced);c.restore();}
  for(const p of e.projectiles){c.save();c.translate(0,(p.lane??625)-625);if(p.character!=='enemy')r.drawProjectile(p);else{c.save();c.translate(p.x,p.y);c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=16;c.beginPath();c.ellipse(0,0,p.radius*1.6,p.radius,0,0,Math.PI*2);c.fill();c.restore();}c.restore();}
  for(const p of e.thrown){c.save();c.translate(p.x,p.y+(p.lane??625)-625);c.rotate(p.angle);if(p.kind==='can'){rect(c,-10,-18,20,36,'#ffcc7e');rect(c,-10,-18,20,5,'#c5e1e5');}else{rect(c,-(p.kind==='table'?65:35),-12,p.kind==='table'?130:70,24,'#ba8b50');c.strokeStyle='#c8d2d1';c.lineWidth=6;c.strokeRect(-24,-32,48,64);}c.restore();}
  r.fightFX.draw(c,r.reduced);r.drawParticles(dt);r.drawSuperScene(heroes.map(f=>({...f,y:f.y+f.lane-625})));r.drawSuperImpacts();
  c.restore();hud(r,e);
  if(r.flash>0){c.fillStyle=`rgba(245,255,232,${r.flash})`;c.fillRect(0,0,1280,720);}c.restore();
}
