import {smoothCamera,schoolEnemyFrame,interpolateEntity} from './story-presentation.js';
import {WORLD} from './engine.js';
import {STORY_ACTS,STORY_RULES,ENEMY_TYPES} from './story-data.js';
import {drawSentinel,drawSentinelLaser} from './sentinel-fx.js';
import {STORY_PROP_DIMENSIONS} from './story-props.js';
import {drawMachineRig} from './machine-rig.js';
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Não foi possível carregar ${src}`));i.src=src;});
const text=(c,s,x,y,size=20,color='#edf6e7',align='left')=>{c.font=`800 ${size}px Arial`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);};
const rect=(c,x,y,w,h,color,r=6)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
export async function loadStoryArt(renderer){
  if(renderer.storyArt)return;
  const backgrounds=await Promise.all(STORY_ACTS.map(a=>load(`assets/story/${a.id}-panorama-v2.webp`)));
  const enemies=await Promise.all(Array.from({length:16},(_,i)=>load(`assets/story/enemy-${i}.webp`)));
  const inspector=await Promise.all(Array.from({length:4},(_,i)=>load(`assets/story/inspector-pose-${i}-v2.webp`)));const inspectorFrames=await fetch('assets/story/inspector-poses-v2.json').then(r=>r.json());const propFrames=await fetch('assets/story/props-v3.json').then(r=>r.json()),props=Object.fromEntries(await Promise.all(Object.entries(propFrames).map(async([kind,frame])=>[kind,await load(frame.file)])));
  const walks=Object.fromEntries(await Promise.all(['gelton','marcelino','marcos','joao','ruan'].map(async id=>[id,{image:await load(`assets/story/${id}-walk-v3.webp`),frames:await fetch(`assets/story/${id}-walk-v3.json`).then(r=>r.json())}])));
  const animationMeta=await fetch('assets/story/enemy-animation-v4.json').then(r=>r.json()),animations=Object.fromEntries(await Promise.all(Object.entries(animationMeta).map(async([id,v])=>[id,{...v,image:await load(v.file)}])));
  for(const [kind,size] of Object.entries(STORY_PROP_DIMENSIONS))Object.assign(propFrames[kind],size);
  const rigsMeta=await fetch('assets/story/machine-rigs-v6.json').then(r=>r.json()),rigs=Object.fromEntries(await Promise.all(Object.entries(rigsMeta).map(async([id,v])=>[id,{...v,image:await load(v.file)}])));
  renderer.storyArt={backgrounds,enemies,inspector,inspectorFrames,props,propFrames,walks,animations,rigs};
}
function enemy(c,e,art,time,reduced){
  const p=e.profile??ENEMY_TYPES[e.kind],native=art.animations?.[e.kind];
  const pose=e.attackLife>0?2:e.state==='walk'?Math.floor(e.animTime*7)%2:0,frame=e.kind==='inspector'?art.inspectorFrames?.[pose]:null;
  const im=native?native.image:frame?art.inspector[pose]:art.enemies[p.cell];if(!im||e.deadTime>1.1)return;
  const nf=native?.frames?.[schoolEnemyFrame(e)],scale=native?.scale??frame?.scale??p.h/im.height;
  const w=(nf?nf.rect[2]:im.width)*scale,h=(nf?nf.height:im.height)*scale;
  c.save();c.translate(e.x,e.y);c.scale(e.direction,1);
  if(e.hp<=0)c.globalAlpha=Math.max(0,1-e.deadTime);
  if(e.flash>0)c.globalAlpha=.65;
  if(art.rigs?.[e.kind]){c.restore();drawMachineRig(c,e,art.rigs[e.kind],time,reduced);c.save();}
  else if(native){c.imageSmoothingEnabled=true;c.drawImage(im,...nf.rect,-nf.anchorX*scale,-nf.bottom*scale,nf.rect[2]*scale,nf.rect[3]*scale);}
  else{if(e.hp<=0)c.rotate(-Math.min(Math.PI/2,e.deadTime*4));c.drawImage(im,frame?-frame.anchorX*scale:-w/2,frame?-frame.bottom*scale:-h,w,h);}
  c.restore();
  if(e.hp>0&&!p.boss){rect(c,e.x-45,e.y-h-15,90,6,'#102024');rect(c,e.x-45,e.y-h-15,90*e.hp/e.maxHp,6,p.color);}
  if(e.dizzyTime>0)text(c,'✦  ✦',e.x,e.y-h-32,22,'#ffe49e','center');
  if(e.telegraph>0){const alpha=.4+.3*Math.sin(time*16);c.fillStyle=`rgba(255,111,95,${alpha})`;c.beginPath();c.ellipse(e.x+e.direction*85,WORLD.floor+3,120,10,0,0,Math.PI*2);c.fill();text(c,'!',e.x,e.y-h-32,38,'#ffd48d','center');}
  if(e.attackLife>0){
    const box=e.attackbox;
    if(e.attackMode==='flame'){const g=c.createLinearGradient(e.x,0,e.x+e.direction*470,0);g.addColorStop(0,'#fff7aecc');g.addColorStop(.45,'#ff9e2a99');g.addColorStop(1,'#ef3e2033');c.fillStyle=g;c.beginPath();c.moveTo(e.x,worldY(150));c.lineTo(e.x+e.direction*470,worldY(80));c.lineTo(e.x+e.direction*470,worldY(180));c.closePath();c.fill();}
    else if(e.attackMode==='slam'){c.strokeStyle='#9cffb9';c.lineWidth=7;c.beginPath();c.ellipse(e.x,WORLD.floor,300,20,0,0,Math.PI*2);c.stroke();}
    else if(e.attackMode==='staff'&&e.brawlerFrame===(p.boss?11:14)){c.save();c.translate(e.x,e.y-160);c.scale(e.direction,1);c.strokeStyle='#f7d99b88';c.lineWidth=3;c.beginPath();c.arc(20,-20,130,-.9,.5);c.stroke();c.restore();}
  }
}
const worldY=h=>WORLD.floor-h;
export function drawStoryObject(c,kind,art,x,y,{angle=0,opacity=1,scale=1}={}){
  const im=art.props?.[kind],frame=art.propFrames?.[kind];if(!im||!frame)return;
  c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=opacity;
  c.drawImage(im,-frame.width*scale/2,-frame.height*scale,frame.width*scale,frame.height*scale);c.restore();
}
function objectShadow(c,x,y,width,alpha=.32){c.save();c.fillStyle=`rgba(14,19,17,${alpha})`;c.beginPath();c.ellipse(x,y+3,width*.45,8,0,0,Math.PI*2);c.fill();c.restore();}
function prop(c,p,time,art){
  if(p.brokenTime>0){const im=art.props?.[p.kind],frame=art.propFrames?.[p.kind];if(!im||!frame||p.brokenTime>3)return;const age=p.brokenTime,flight=Math.min(age,.65);c.save();c.globalAlpha=Math.min(1,3-age);for(let i=0;i<6;i++){c.save();const dx=(i-2.5)*75*flight,dy=Math.min(0,-(110+i%3*24)*flight+380*flight*flight);c.translate(p.x+dx,WORLD.floor+dy);c.rotate((i%2?1:-1)*flight*(2+i*.4));c.drawImage(im,i%3*im.width/3,Math.floor(i/3)*im.height/2,im.width/3,im.height/2,-frame.width/6,-frame.height/6,frame.width/3,frame.height/3);c.restore();}c.restore();return;}
  if(p.used&&!(p.kind==='shelf'&&p.fall>0))return;
  const frame=art.propFrames?.[p.kind];if(!frame)return;
  const fading=p.kind==='shelf'&&p.fall>1.3?Math.max(0,1-(p.fall-1.3)*3):1;
  objectShadow(c,p.x,WORLD.floor,frame.width,.32*fading);
  if(p.fall>0){c.save();c.translate(p.x-frame.width*.5,WORLD.floor);if(p.fall<.85){c.fillStyle='#f5686833';c.fillRect(0,-7,310,14);}c.rotate(Math.min(Math.PI/2,Math.max(0,p.fall-.4)*2.7));drawStoryObject(c,p.kind,art,frame.width*.5,0,{opacity:fading});c.restore();}
  else drawStoryObject(c,p.kind,art,p.x,WORLD.floor);
  if(p.flash>0){c.save();c.globalAlpha=p.flash*4;c.strokeStyle='#ffe7b0';c.lineWidth=3;c.strokeRect(p.x-frame.width/2,WORLD.floor-frame.height,frame.width,frame.height);c.restore();}
  if(p.maxHp&&p.hp<p.maxHp*.65&&['table','chair'].includes(p.kind)){c.save();c.strokeStyle='#2b170acc';c.lineWidth=3;c.beginPath();c.moveTo(p.x-16,WORLD.floor-frame.height+5);c.lineTo(p.x+2,WORLD.floor-frame.height+23);c.lineTo(p.x-9,WORLD.floor-frame.height+35);c.stroke();c.restore();}
}
function hazard(c,h,time,art){
  const cycle=h.clock%h.period,warning=cycle<h.warning,active=cycle>=h.warning&&cycle<h.warning+h.active;const color=h.kind==='acid'?'#bcfb75':h.kind==='frost'?'#a9e9ff':'#8bffbf';
  objectShadow(c,h.x,(h.lane??625),h.kind==='cable'?120:90);
  drawStoryObject(c,h.kind==='cable'?'cabinet':'tank',art,h.x,(h.lane??625));
  if(warning||active){c.fillStyle=warning?'#ffbf6244':color+'55';c.fillRect(h.x-h.w/2,(h.lane??625)-(active&&h.kind==='cable'?260:18),h.w,active&&h.kind==='cable'?260:18);text(c,warning?'⚠':h.kind==='acid'?'ÁCIDO':h.kind==='frost'?'GELO':'ALTA TENSÃO',h.x,worldY(40),16,warning?'#ffd08c':color,'center');}
  if(active){c.strokeStyle=color;c.lineWidth=3;for(let i=0;i<6;i++){const x=h.x-h.w/2+i*h.w/5;c.beginPath();c.moveTo(x,worldY(2));c.lineTo(x+Math.sin(time*10+i)*13,worldY(h.kind==='cable'?220:35+Math.sin(time*4+i)*12));c.stroke();}}
}
function hud(r,e){
  const c=r.c,s=e.story,act=STORY_ACTS[s.act];
  const g=c.createLinearGradient(0,0,0,100);g.addColorStop(0,'#07121af2');g.addColorStop(1,'#07121a00');c.fillStyle=g;c.fillRect(0,0,1280,100);
  for(const [i,f] of e.party.entries()){
    const x=24+i*360,reserve=s.boss&&f.slot!==s.duelist;
    c.save();c.translate(x,16);c.scale(.62,.62);r.drawPortrait(f,0,0);c.restore();
    text(c,`P${f.slot+1}  ${f.character.name}${reserve?' · RESERVA':''}`,x+58,24,14,reserve?'#95a9b3':'#f1f6ed');
    rect(c,x+58,37,248,12,'#263943',2);rect(c,x+58,37,248*Math.max(0,f.hp)/1000,12,f.hp>300?f.character.color:'#ed7664',2);
    rect(c,x+58,55,248,4,'#263943',1);rect(c,x+58,55,248*f.meter/100,4,f.character.accent,1);
    if(f.meter>=100)text(c,'ESPECIAL PRONTO',x+58,70,10,f.character.accent);
  }
  const sec=Math.ceil(e.timer),clock=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
  text(c,`ATO 0${s.act+1}  /  ${act.place.toUpperCase()}`,1254,24,13,'#b7cbc4','right');
  text(c,clock,1254,48,24,e.timer<120?'#ff9b82':'#f0f6ec','right');
  text(c,`${s.score.toLocaleString('pt-BR')} PTS  ·  ${s.boss?'DUELO':`ONDA ${s.wave}/3`}`,1170,50,12,'#a8c0be','right');
  const boss=e.enemies.find(n=>n.profile.boss&&n.hp>0);
  if(boss){text(c,boss.profile.name.toUpperCase(),640,92,13,'#f5d7a0','center');rect(c,410,106,460,7,'#263943',2);rect(c,410,106,460*boss.hp/boss.maxHp,7,boss.profile.color,2);}
  if(s.noticeTime>0){rect(c,320,651,640,32,'#07121ad9');text(c,s.notice,640,668,15,'#f5e8c7','center');}
  else if(!s.boss&&!e.enemies.some(n=>n.hp>0)){text(c,'AVANCE  →',1190,641,18,'#d3f1a3','right');}
}
export function storyPose(r,f,art){
  if(f.carry&&f.state==='idle')return {sheet:r.sheets[f.character.id],index:6};
  if(!['walk','idle'].includes(f.state)||f.airborne||f.walkBlend<=.02)return null;
  const stride=f.storyRunning?250:210,index=Math.floor((Math.max(0,f.walkDistance)%stride)/stride*8);
  const walk=art.walks?.[f.character.id];
  if(walk){const frame=walk.frames[index];return {sheet:{scale:1,frames:walk.frames.map(frame=>({...frame,image:walk.image}))},index};}
  const original=r.sheets[f.character.id]?.motion;return original?{sheet:original,index}:null;
}
export function drawStory(r,e,dt,alpha){
  const c=r.c,art=r.storyArt;if(!art){c.fillStyle='#0b1b20';c.fillRect(0,0,1280,720);return;}
  if(e.phase==='selection')return;
  const viewKey=`${e.story.act}:${e.story.boss}`;if(r.storyViewKey!==viewKey||e.phaseTime<.025){r.storyViewKey=viewKey;r.storyViewCamera=e.camera;}r.storyViewCamera=r.reduced?e.camera:smoothCamera(r.storyViewCamera,e.camera,dt);
  c.save();const bg=art.backgrounds[e.story.act],drift=e.story.boss?0:r.storyViewCamera;
  c.drawImage(bg,-drift,0,STORY_RULES.worldWidth,720);
c.fillStyle='#09212922';c.fillRect(0,0,1280,720);
  const ground=c.createLinearGradient(0,610,0,720);ground.addColorStop(0,'#13262b00');ground.addColorStop(1,'#061920c0');c.fillStyle=ground;c.fillRect(0,610,1280,110);
  c.save();c.translate(-r.storyViewCamera,0);
  if(r.shake>0&&!r.reduced)c.translate(Math.sin(r.clock*87)*r.shake,Math.cos(r.clock*71)*r.shake*.45);

  const heroes=e.heroes.map(f=>({...f,x:f.prevX+(f.x-f.prevX)*alpha,y:f.prevY+(f.y-f.prevY)*alpha,lane:(f.prevLane??f.lane)+((f.lane??625)-(f.prevLane??f.lane))*alpha,walkDistance:f.walkDistance,walkBlend:f.walkBlend}));
  const entities=[...heroes.map(f=>({kind:'hero',value:f,lane:f.lane})),...e.enemies.map(n=>{const value=interpolateEntity(n,alpha);return {kind:'enemy',value,lane:value.lane};}),...e.props.map(p=>({kind:'prop',value:p,lane:p.lane??625})),...e.hazards.map(h=>({kind:'hazard',value:h,lane:h.lane??625}))].sort((a,b)=>a.lane-b.lane);
  for(const item of entities){const v=item.value;c.save();c.translate(0,item.lane-WORLD.floor);
    if(item.kind==='prop')prop(c,v,r.clock,art);
    else if(item.kind==='hazard'){c.translate(0,625-item.lane);hazard(c,v,r.clock,art);}
    else{c.fillStyle='#07101566';c.beginPath();c.ellipse(v.x,WORLD.floor+4,item.kind==='hero'?45:v.profile.w*.3,9,0,0,Math.PI*2);c.fill();if(item.kind==='hero'){r.drawFighter({...v,storyLocomotion:true,storyRunning:v.runUntil>e.time},storyPose(r,{...v,storyRunning:v.runUntil>e.time},art));if(v.carry)drawStoryObject(c,v.carry.kind,art,v.x+v.direction*55,v.y-140,{scale:.85});}else enemy(c,v,art,r.clock,r.reduced);}
    c.restore();
  }
  for(const d of e.drones){c.save();c.translate(0,(d.lane??625)-625);drawSentinel(c,d,r.reduced);c.restore();}
  for(const l of e.lasers){c.save();c.translate(0,(l.lane??625)-625);drawSentinelLaser(c,l,r.reduced);c.restore();}
  for(const p of e.projectiles){c.save();c.translate(0,(p.lane??625)-625);if(p.character!=='enemy')r.drawProjectile(p);else{c.save();c.translate(p.x,p.y);c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=16;c.beginPath();c.ellipse(0,0,p.radius*1.6,p.radius,0,0,Math.PI*2);c.fill();c.restore();}c.restore();}
  for(const p of e.thrown){c.save();c.translate(p.x,p.y+(p.lane??625)-625);c.rotate(p.angle);const frame=art.propFrames?.[p.kind];if(frame)drawStoryObject(c,p.kind,art,0,frame.height*.5);c.restore();}

  r.fightFX.draw(c,r.reduced);r.drawParticles(dt);r.drawSuperScene(heroes.map(f=>({...f,y:f.y+f.lane-625})));r.drawSuperImpacts();
  c.restore();hud(r,e);
  if(r.flash>0){c.fillStyle=`rgba(245,255,232,${r.flash})`;c.fillRect(0,0,1280,720);}c.restore();
}
