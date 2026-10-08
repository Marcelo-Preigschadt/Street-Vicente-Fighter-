import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,Fighter,FIXED_STEP,WORLD} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {STORY_WORLD,entityScale} from '../src/story-world.js';
import {GAITS,referenceJoints,MOTION_STATES} from '../src/locomotion-data.js';
import {resetFeet,evaluateRig,motionState,handSockets,updateLocomotion,usesRig} from '../src/locomotion.js';
import {interpolateFighter} from '../src/locomotion-render.js';
import {heldObjectTransform,STORY_PROP_DIMENSIONS,thrownObjectBounds,carryStrikeBox} from '../src/story-props.js';
import {ENEMY_TYPES} from '../src/story-data.js';
const ids=['marcelo','rafael','gustavo','tais'];
const advance=(e,t)=>{for(let i=0;i<Math.round(t/FIXED_STEP);i++)e.update(FIXED_STEP);};
function versus(id,slot=0){const e=new FightEngine();const other=id==='marcelo'?'rafael':'marcelo';e.start(slot===0?id:other,'local',slot===1?id:other);e.phase='fight';e.fighters[0].x=450;e.fighters[1].x=830;for(const f of e.fighters){f.prevX=f.x;resetFeet(f);}return e;}
function story(id='marcelo'){const e=new StoryEngine();e.start(id,'story-solo');e.queue(0,'storyNext');return e;}
const length=(p,a,b)=>Math.hypot(p[a*2]-p[b*2],p[a*2+1]-p[b*2+1]);

for(const id of ids)for(const slot of [0,1])test(`${id}, P${slot+1}: apoios fixos e pernas sem alongamento artificial ao avançar/recuar`,()=>{
 for(const backwards of [false,true]){
  const e=versus(id,slot),f=e.fighters[slot],dir=f.direction*(backwards?-1:1),r=referenceJoints(id,new Float64Array(34));
  e.setInput(slot,{right:dir>0,left:dir<0});let supports=0,lifts=0;
  for(let tick=0;tick<95;tick++){
   const before=f.motion.feet.map(p=>({...p}));e.update(FIXED_STEP);const p=evaluateRig(f);
   for(const [side,h,k,a] of [[0,3,4,5],[1,7,8,9]]){
    const foot=f.motion.feet[side];if(before[side].support&&foot.support){assert.equal(foot.x,before[side].x);assert.equal(foot.lane,before[side].lane);supports++;}
    if(foot.lift>0)lifts++;
    assert.ok(Math.abs(f.x+p[a*2]*f.direction-foot.x)<1e-7);
    assert.ok((length(p,h,k)+length(p,k,a))/(length(r,h,k)+length(r,k,a))<1.08);
   }
  }
  assert.ok(supports>50&&lifts>10);assert.equal(f.motion.state,backwards?'WALK_BACKWARD':'WALK_FORWARD');
 }
});

test('idle respira, transfere peso e move guarda sem alterar a posição global ou os apoios',()=>{
 for(const id of ids){const e=versus(id),f=e.fighters[0],x=f.x,y=f.y,feet=f.motion.feet.map(p=>p.x),p=Array.from(evaluateRig(f));advance(e,.7);const q=evaluateRig(f);assert.equal(f.x,x);assert.equal(f.y,y);assert.deepEqual(f.motion.feet.map(p=>p.x),feet);assert.ok(Math.abs(q[26]-p[26])>.1);assert.ok(Math.abs(q[5]-p[5])>.1);assert.equal(f.motion.state,'IDLE');}
});

test('passadas forward/backward têm fases crescentes, apoio e recuperação próprios',()=>{
 const e=versus('rafael'),f=e.fighters[0];e.setInput(0,{right:true});advance(e,.15);const forward=f.motion.phase;
 e.setInput(0,{});advance(e,.2);e.setInput(0,{left:true});advance(e,.08);const back=f.motion.phase;advance(e,.12);
 assert.ok(f.motion.phase>back);assert.equal(f.motion.state,'WALK_BACKWARD');assert.ok(GAITS.rafael.backStride<GAITS.rafael.stride);assert.ok(forward>0);
 assert.ok(GAITS.tais.lift>GAITS.rafael.lift*2);assert.ok(GAITS.tais.duty<GAITS.rafael.duty);
});

test('MOVE_START e MOVE_STOP fazem parte da transição responsiva de ambos os slots',()=>{
 for(const slot of [0,1]){const e=versus('marcelo',slot),f=e.fighters[slot],dir=f.direction;e.setInput(slot,{right:dir>0,left:dir<0});e.update(FIXED_STEP);assert.equal(f.motion.state,'MOVE_START');assert.ok(f.motion.blend>0&&f.motion.blend<1);advance(e,.1);e.setInput(slot,{});advance(e,.04);assert.equal(f.vx,0);assert.equal(f.motion.state,'MOVE_STOP');advance(e,.12);assert.equal(f.motion.state,'IDLE');assert.equal(f.motion.blend,0);}
});

test('interpolação mantém o apoio em coordenadas do mundo e não modifica a simulação',()=>{
 const e=versus('marcelo'),f=e.fighters[0];e.setInput(0,{right:true});advance(e,.15);const state=JSON.stringify(f),out={motion:{feet:[{},{}]}};
 for(const alpha of [0,.25,.5,.75,1]){const view=interpolateFighter(f,alpha,out),p=evaluateRig(view);for(const [side,a]of [[0,5],[1,9]])if(f.motion.feet[side].support&&f.motion.feet[side].prevLift===0)assert.ok(Math.abs(view.x+p[a*2]*view.direction-f.motion.feet[side].x)<1e-7);}
 assert.equal(JSON.stringify(f),state);
});

test('máquina de movimento dá prioridade a hit, block, stun, knockdown, get-up e fases aéreas',()=>{
 const f=new Fighter('marcelo',0);const cases=[['hitstun',.2,'HIT'],['blockstun',.2,'BLOCK'],['dizzyTime',.2,'STUN'],['knocked',true,'KNOCKDOWN'],['wakeTime',.2,'GET_UP'],['preJump',.2,'JUMP_START'],['landing',.2,'LAND']];
 for(const [key,value,state]of cases){const old=f[key];f[key]=value;assert.equal(motionState(f),state);assert.ok(MOTION_STATES.includes(state));f[key]=old;}
 f.y=WORLD.floor-50;f.vy=-50;assert.equal(motionState(f),'JUMP');f.vy=50;assert.equal(motionState(f),'FALL');
});

test('ataque após passada tem startup, active, recovery e conserva o pé de apoio durante o avanço',()=>{
 for(const id of ids){const e=versus(id),f=e.fighters[0];e.setInput(0,{right:true});advance(e,.12);e.queue(0,'punch',1);e.update(FIXED_STEP);assert.equal(f.movePhase,'startup');assert.equal(f.attackbox,null);assert.ok(f.attackPlant);const planted=f.attackPlant.x;let active=false,recovery=false;
  for(let i=0;i<65&&f.action;i++){e.update(FIXED_STEP);if(f.movePhase==='active'){active=true;assert.ok(f.attackbox);}if(f.movePhase==='recovery'){recovery=true;assert.equal(f.attackbox,null);}if(f.attackPlant)assert.equal(f.attackPlant.x,planted);}
  assert.ok(active&&recovery);advance(e,.2);assert.ok(f.motion.blend>.9);
 }
});

test('pushboxes param a passada no canto e entre dois lutadores simultaneamente',()=>{
 const e=versus('marcelo');e.fighters[0].x=500;e.fighters[1].x=612;e.setInput(0,{right:true});e.setInput(1,{left:true});advance(e,.3);
 const phases=e.fighters.map(f=>f.motion.phase);advance(e,.3);assert.deepEqual(e.fighters.map(f=>f.motion.phase),phases);assert.ok(e.fighters.every(f=>f.motion.blend===0));assert.ok(e.fighters[1].x-e.fighters[0].x>=112-1e-8);
});

test('dt extremo é limitado e não teletransporta nem acelera a animação após perda de foco',()=>{
 const a=versus('marcelo'),b=versus('marcelo');for(const e of [a,b])e.setInput(0,{right:true});a.update(10);b.update(.1);assert.equal(a.fighters[0].x,b.fighters[0].x);assert.equal(a.fighters[0].motion.phase,b.fighters[0].motion.phase);assert.ok(a.fighters[0].x-450<25);
});

test('escala de História rege adulto, mobiliário, alcance, pushboxes, projéteis e salto juntos',()=>{
 const v=versus('rafael'),e=story('rafael'),f=e.fighters[0],s=entityScale(f);assert.equal(s,STORY_WORLD.actorScale);assert.ok(GAITS.rafael.height*s<STORY_WORLD.doorHeight);assert.ok(STORY_PROP_DIMENSIONS.table.height/(GAITS.rafael.height*s)>.40);assert.ok(STORY_PROP_DIMENSIONS.chair.height/(GAITS.rafael.height*s)>.45);
 assert.ok(Math.abs(f.pushbox.w/v.fighters[0].pushbox.w-s)<1e-9);e.queue(0,'special');advance(e,.28);assert.ok(e.projectiles.length);assert.ok(e.projectiles[0].radius<25);assert.ok(e.projectiles[0].speed<600);
});

test('profundidade usa a posição dos pés, com apoios estáveis em deslocamento diagonal',()=>{
 const e=story(),f=e.fighters[0];e.setInput(0,{up:true,right:true});let supports=0;
 for(let i=0;i<70;i++){const before=f.motion.feet.map(p=>({...p}));e.update(FIXED_STEP);for(let side=0;side<2;side++)if(before[side].support&&f.motion.feet[side].support){assert.equal(f.motion.feet[side].x,before[side].x);assert.equal(f.motion.feet[side].lane,before[side].lane);supports++;}}
 assert.ok(supports>40);assert.ok(f.lane<625);assert.equal(f.feetY,f.lane);assert.equal(f.y,WORLD.floor);assert.ok(f.walkDistance>20);
});

test('cadeira fica nas duas mãos ao virar e é solta somente após o startup do arremesso',()=>{
 const e=story('tais'),f=e.fighters[0],p=e.props.find(p=>p.kind==='chair');e.story.wave=3;e.story.dropWave=3;e.camera=p.x-400;f.x=p.x-20;f.prevX=f.x;f.lane=p.lane;f.prevLane=f.lane;resetFeet(f);e.queue(0,'punch');assert.equal(f.carry.kind,'chair');advance(e,.2);
 for(const direction of [1,-1]){f.direction=direction;resetFeet(f);const hands=handSockets(f),held=heldObjectTransform(f),size=STORY_PROP_DIMENSIONS.chair;
  for(const [sign,x,y]of [[-1,hands.leftX,hands.leftY],[1,hands.rightX,hands.rightY]]){const gx=sign*held.gripSpan*.5*direction,gy=-size.height*.8;assert.ok(Math.abs(held.x+gx*Math.cos(held.angle)-gy*Math.sin(held.angle)-x)<1e-7);assert.ok(Math.abs(held.y+gx*Math.sin(held.angle)+gy*Math.cos(held.angle)-y)<1e-7);}
 }
 e.queue(0,'punch');assert.equal(e.thrown.length,0);assert.ok(f.carry);advance(e,.14);assert.equal(f.carry,null);assert.equal(e.thrown.length,1);assert.equal(e.thrown[0].facing,-1);assert.ok(thrownObjectBounds(e.thrown[0]).w>0);
});

test('parceiro revivido retém escala, profundidade e apoios da campanha',()=>{
 const e=new StoryEngine();e.start('marcelo','story-local','rafael');e.queue(0,'storyNext');e.fighters[0].lane=570;e.fighters[1].hp=0;e.update(FIXED_STEP);const f=e.fighters[1];assert.equal(f.hp,350);assert.equal(f.worldScale,STORY_WORLD.actorScale);assert.equal(f.lane,570);assert.ok(f.motion.ready);assert.ok(f.motion.feet.every(p=>p.lane===570));
});
test('reposicionar no mundo renova apoios sem arrastar a pose para o ponto antigo',()=>{
 const e=versus('marcos'),f=e.fighters[0];advance(e,.2);f.x+=90;e.update(FIXED_STEP);assert.ok(Math.abs(f.motion.bodyShift)<10);assert.ok(f.hurtboxes[0].x>f.x-40);assert.equal(f.motion.lastWorldX,f.x);
});
test('virar troca pé dianteiro/traseiro e mantém os contatos existentes no mundo',()=>{
 const f=versus('marcelo').fighters[0],feet=f.motion.feet.map(p=>p.x).sort((a,b)=>a-b);f.direction=-1;f.prevX=f.x;updateLocomotion(f,FIXED_STEP);assert.deepEqual(f.motion.feet.map(p=>p.x).sort((a,b)=>a-b),feet);assert.equal(f.motion.facing,-1);
});
test('todos os equipamentos têm aproximação, preparação, contato, recuperação e derrota finitos',()=>{
 for(const kind of Object.keys(ENEMY_TYPES)){const e=story(),n=e.spawnEnemy(kind,680,625);e.fighters[0].invincible=20;n.cooldown=0;n.aiTime=0;let walking=false,start=false,attack=false,recovery=false;
  for(let i=0;i<700;i++){e.update(FIXED_STEP);walking||=n.state==='walk';start||=n.telegraph>0;attack||=n.attackLife>0;recovery||=n.recovery>0;assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));if(n.hp<=0)break;}
  assert.ok(walking&&start&&attack&&recovery,kind);n.hp=0;e.update(FIXED_STEP);assert.equal(n.motion.state,'DEFEAT',kind);
 }
});
test('carga dos chefes bípedes usa passada articulada durante o avanço comprometido',()=>{
 const e=story(),n=e.spawnEnemy('inspector',670);n.attackMode='charge';n.attackLife=.3;n.state='attack';n.direction=-1;const x=n.x;e.update(FIXED_STEP);assert.ok(n.x<x);assert.ok(n.motion.phase>0);assert.ok(usesRig(n));
});
test('golpe com cadeira preserva as mãos ocupadas e só causa dano durante os frames ativos',()=>{
 const e=story('tais'),f=e.fighters[0];f.carry={kind:'chair',id:'fixture'};f.carryTime=0;e.queue(0,'kick');e.update(FIXED_STEP);assert.ok(usesRig(f));const held=heldObjectTransform(f),box=carryStrikeBox(f),n=e.spawnEnemy('lab',box.x+box.w*.5);n.lane=f.lane;n.hitstun=10;n.y=WORLD.floor-40;
 const before=n.hp;e.update(FIXED_STEP);assert.equal(n.hp,before);advance(e,.25);assert.ok(n.hp<before);assert.equal(f.carry.kind,'chair');const after=n.hp;advance(e,.5);assert.equal(n.hp,after);assert.ok(Number.isFinite(held.x));
});
test('boxe inicia avanço pelo pé dianteiro e recuo pelo traseiro, sem cruzar a base',()=>{
 for(const back of [false,true]){
  const e=versus('rafael'),f=e.fighters[0],start=f.motion.feet.map(p=>p.x);
  e.setInput(0,{right:!back,left:back});let first=-1;
  for(let i=0;i<65;i++){
   e.update(FIXED_STEP);
   if(first<0)first=f.motion.feet.findIndex(p=>!p.support);
   const [rear,front]=f.motion.feet;
   assert.ok(rear.x<front.x,`base cruzada no quadro ${i}`);
  }
  assert.equal(first,back?0:1);
  assert.ok(f.motion.feet.some((p,i)=>Math.abs(p.x-start[i])>10));
 }
});
test('silhueta em câmera lenta: quadril, ambas as coxas, tronco, ombros e braços variam com o worldX congelado',()=>{
 const angle=(p,a,b)=>Math.atan2(p[b*2]-p[a*2],p[b*2+1]-p[a*2+1]);
 const span=values=>Math.max(...values)-Math.min(...values);
 for(const id of ids){
  const e=versus(id),f=e.fighters[0],worldX=f.x,frames=[];
  e.setInput(0,{right:true});
  for(let tick=0;tick<125;tick++){
   const before=f.motion.feet.map(p=>({...p}));e.update(FIXED_STEP);
   if(tick%3)continue;
   // Render the same articulated pose in place: removing world movement must
   // leave a complete step rather than only a moving calf.
   const view=interpolateFighter(f,1,{motion:{feet:[{},{}]}});
   const delta=worldX-view.x;view.x=worldX;
   for(const foot of view.motion.feet)foot.x+=delta;
   assert.equal(view.x,worldX);
   const p=Array.from(evaluateRig(view));
   frames.push({p,root:f.x,feet:f.motion.feet.map(x=>({...x})),before,
    thigh:[angle(p,3,4),angle(p,7,8)],torso:angle(p,0,1)});
  }
  assert.ok(span(frames.map(x=>x.p[0]))>10,id+' pelve');
  assert.ok(span(frames.map(x=>x.thigh[0]))>.20,id+' coxa traseira');
  assert.ok(span(frames.map(x=>x.thigh[1]))>.20,id+' coxa dianteira');
  assert.ok(span(frames.map(x=>x.torso))>.025,id+' tronco');
  assert.ok(span(frames.map(x=>x.p[22]-x.p[28]))>2,id+' ombros');
  assert.ok(span(frames.map(x=>x.p[26]))>3,id+' braço');
  assert.ok(frames.some(x=>x.feet.some(foot=>foot.lift>3)),id+' balanço');
  assert.ok(frames.some(x=>x.feet.some((foot,i)=>foot.support&&foot.x===x.before[i].x)),id+' pé plantado');
 }
});
test('História compartilha a pose articulada com 1×1 para herói e exoesqueleto bípede',()=>{
 const e=story('tais'),hero=e.fighters[0],robot=e.spawnEnemy('exo',880,625);
 e.enemies=e.enemies.filter(enemy=>enemy!==robot);
 e.setInput(0,{right:true});const samples=[[],[]];
 for(let tick=0;tick<85;tick++){
  const old=robot.x;robot.prevX=old;robot.prevLane=robot.lane;robot.x+=1.25;robot.vx=150;robot.state='walk';
  updateLocomotion(robot,FIXED_STEP);
  e.update(FIXED_STEP);
  for(const [index,f] of [hero,robot].entries())if(tick%3===0){
   assert.ok(usesRig(f));
   const p=Array.from(evaluateRig(f));
   samples[index].push({pelvis:p[0],rear:Math.atan2(p[8]-p[6],p[9]-p[7]),
    front:Math.atan2(p[16]-p[14],p[17]-p[15]),lift:f.motion.feet.map(foot=>foot.lift)});
  }
 }
 for(const [index,poses]of samples.entries()){
  const spread=key=>Math.max(...poses.map(p=>p[key]))-Math.min(...poses.map(p=>p[key]));
  assert.ok(spread('pelvis')>3,index+' pelve');
  assert.ok(spread('rear')>.09,index+' coxa traseira');
  assert.ok(spread('front')>.09,index+' coxa dianteira');
  assert.ok(poses.some(p=>p.lift.some(v=>v>2)),index+' balanço');
 }
});
test('contato e soltura do pé não reiniciam o ciclo nem causam salto do centro de massa',()=>{
 for(const id of ids){
  const e=versus(id),f=e.fighters[0];e.fighters[1].x=1200;
  e.setInput(0,{right:true});let phase=-1,worldPelvis=null,contacts=0;
  for(let tick=0;tick<130;tick++){
   const old=f.motion.feet.map(foot=>foot.support);e.update(FIXED_STEP);
   const p=evaluateRig(f),current=f.x+p[0]*f.direction;
   if(worldPelvis!==null)assert.ok(Math.abs(current-worldPelvis)<10,id+' salto no quadro '+tick);
   if(phase>=0)assert.ok(f.motion.phase>phase,id+' reiniciou o ciclo');
   for(let side=0;side<2;side++)if(!old[side]&&f.motion.feet[side].support)contacts++;
   worldPelvis=current;phase=f.motion.phase;
  }
  assert.ok(contacts>=2,id+' contatos alternados');
 }
});
