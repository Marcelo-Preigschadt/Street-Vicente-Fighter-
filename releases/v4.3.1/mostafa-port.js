// SPDX-License-Identifier: GPL-3.0-or-later
// Browser translation of enemy_do_ai / sprite_update in shahfarhadreza/mostafa-the-game.
// Original C and license: vendor/mostafa. Timing converted from centiseconds to seconds.
// Cooperative extension: one engagement per living player, seeded orbit choices, snapshots.
export const MOSTAFA_ANIMATIONS=Object.freeze({
  ferris:{idle:[0,2,10,true],run:[6,11,11.25],walk:[23,29,12.5],windup:[23,23,1],attack:[12,14,16.25,true],hit:[21,21,1],fall:[15,19,8.75]},
  butcher:{idle:[0,2,10,true],run:[3,8,11.25],walk:[3,8,12.5],windup:[0,0,1],attack:[9,11,11.25,true],hit:[12,12,1],fall:[12,14,3.75]}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function initMostafaEnemy(e){
  e.brawlerState='idle';e.brawlerTime=0;e.brawlerTarget=-1;e.brawlerOrbit=-1;e.brawlerTargetX=e.x;e.brawlerTargetLane=e.lane;
  e.brawlerWait=0;e.brawlerEngaging=false;e.brawlerAnimation='idle';e.brawlerFrame=0;e.brawlerFrameTime=0;e.brawlerReverse=false;e.brawlerWalkDistance=0;
}
export function mostafaAtlas(e){return e.profile.boss?'butcher':e.slot%2?'gneiss':'ferris';}
export function animateMostafa(e,name,dt){
  const a=MOSTAFA_ANIMATIONS[e.profile.boss?'butcher':'ferris'][name];
  if(e.brawlerAnimation!==name){e.brawlerAnimation=name;e.brawlerFrame=a[0];e.brawlerFrameTime=0;e.brawlerReverse=false;}
  e.brawlerFrameTime+=dt;
  while(e.brawlerFrameTime>=1/a[2]){
    e.brawlerFrameTime-=1/a[2];
    if(a[3]){if(e.brawlerFrame===a[1])e.brawlerReverse=true;if(e.brawlerFrame===a[0])e.brawlerReverse=false;e.brawlerFrame+=e.brawlerReverse?-1:1;}
    else e.brawlerFrame=e.brawlerFrame<a[1]?e.brawlerFrame+1:name==='fall'?a[1]:a[0];
  }
}
function transition(e,state){if(e.brawlerState!==state){e.brawlerState=state;e.brawlerTime=0;}}
function moveTo(engine,e,x,lane,speed,dt){
  const dx=x-e.x,dz=lane-e.lane,normal=Math.hypot(dx,dz*1.35),step=Math.min(normal,speed*dt);
  e.vx=normal>2?dx/normal*speed:0;
  if(normal>2){e.x+=dx/normal*step;e.lane=clamp(e.lane+dz/normal*step,520,660);e.brawlerWalkDistance+=step;}
  e.x=clamp(e.x,engine.camera+40,engine.story.boss?1190:Math.min(3560,engine.camera+1240));
  return normal;
}
// RUNNING -> PUNCH_PRE -> FIGHT, or WALKING to four positions surrounding player.
// The C original gates engagement globally; cooperative adaptation gates it per target.
export function mostafaEnemyIntent(engine,e,target,dt){
  e.brawlerTime+=dt;e.brawlerTarget=target.slot;
  const dx=Math.abs(target.x-e.x),dz=Math.abs(target.lane-e.lane),p=e.profile;
  const busy=engine.enemies.some(other=>other!==e&&other.hp>0&&other.brawlerEngaging&&other.brawlerTarget===target.slot);
  const range=p.boss?Math.max(220,p.range-10):p.ranged||['fairRobot','aula'].includes(e.kind)?p.range:Math.max(110,p.range-10);
  if(e.brawlerState==='idle'){
    e.vx=0;animateMostafa(e,'idle',dt);
    if(dx<650&&dz<150)transition(e,'run');
    else return false;
  }
  e.direction=target.x>=e.x?1:-1;
  if(e.brawlerState==='orbit'){
    if(!busy&&e.cooldown<=0){transition(e,'run');return false;}
    if(e.brawlerOrbit<0||e.brawlerWait>=1){
      const i=Math.floor(engine.randomStory()*4),offsets=[[-280,-55],[280,55],[100,120],[100,-120]];
      e.brawlerOrbit=i;e.brawlerTargetX=target.x+offsets[i][0];e.brawlerTargetLane=clamp(target.lane+offsets[i][1],520,660);e.brawlerWait=0;
    }
    const distance=moveTo(engine,e,e.brawlerTargetX,e.brawlerTargetLane,p.speed*.8,dt);
    if(distance<12)e.brawlerWait+=dt;
    e.state=distance>12?'walk':'idle';animateMostafa(e,distance>12?'walk':'idle',dt);return false;
  }
  if(dx<=range&&dz<18){
    e.vx=0;
    if(busy||e.cooldown>0){transition(e,'orbit');e.brawlerOrbit=-1;return false;}
    transition(e,'windup');e.brawlerEngaging=true;return true;
  }
  transition(e,'run');e.state='walk';
  // Source run speed 2.5 per centisecond = 250 px/s; archetype tuning remains bounded.
  moveTo(engine,e,target.x-e.direction*(range-4),target.lane,Math.max(190,Math.min(270,p.speed*1.5)),dt);
  animateMostafa(e,'run',dt);return false;
}
// Source camera dead zone (150..400 at 1024 wide), adapted to 1280 and two players.
export function mostafaCamera(camera,heroes,maxCamera){
  const min=Math.min(...heroes.map(f=>f.x)),max=Math.max(...heroes.map(f=>f.x));
  const lead=(min+max)/2;
  return Math.max(camera,clamp(Math.min(lead-500,min-187.5),0,maxCamera));
}
