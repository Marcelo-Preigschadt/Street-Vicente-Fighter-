import {ADRIANO_HURT} from './adriano-data.js';
import {nativeWalkPose} from './native-walk.js';
import {entityScale} from './story-world.js';

const box=(near,reach,height,h)=>({near,reach,height,h});
export const ADRIANO_STRIKES=Object.freeze({
 punch:box(25,175,219,42),kick:box(28,218,201,62),
 crouchPunch:box(20,188,166,44),sweep:box(18,220,48,66),
 airPunch:box(20,190,173,44),airKick:box(24,223,142,64),
 uppercut:box(-15,175,273,112),guardCounter:box(25,195,217,48),
});
const standingStrikes={
 punch:[box(25,155,225,36),box(28,175,219,42),box(28,203,215,44)],
 kick:[box(25,200,210,55),box(28,227,229,64),box(25,226,243,68)],
};
export function adrianoStrike(f){return standingStrikes[f.action]?.[f.moveData?.strength??1]??ADRIANO_STRIKES[f.action];}

// Startup and recovery traverse the authored chamber; contact uses the complete
// extended pose. Each standing strength selects its own technique pair.
export function adrianoPose(f){
 const m=f.moveData,t=f.actionTime??0,active=m&&t>=m.startup&&t<m.startup+m.active;
 if(m&&['punch','kick','guardCounter'].includes(f.state)){
  const first=f.state==='kick'?6:f.state==='guardCounter'?4:0;
  const strength=f.state==='guardCounter'?0:m.strength;
  return {atlas:'strike',index:first+strength*2+Number(active)};
 }
 if(f.state==='super'&&m){
  const phase=t<m.startup?0:t<m.startup+m.active?1+Math.min(1,Math.floor((t-m.startup)/.18)):3;
  return {atlas:'strike',index:12+phase};
 }
 const combat={crouchPunch:active?1:0,sweep:active?3:2,airPunch:active?5:4,airKick:active?7:6,
  uppercut:m&&t>=m.startup?11:10,lowBlock:9,wake:f.wakeTime>.07?12:13,throw:14,landing:15,preJump:15};
 if(Object.hasOwn(combat,f.state))return {atlas:'combat',index:combat[f.state]};
 const base={jump:4,crouch:5,block:10,hit:11,dizzy:11,victory:14,ko:15,knockdown:15,special:m&&t>=m.startup?13:12};
 if(Object.hasOwn(base,f.state))return {atlas:'base',index:base[f.state]};
 if(f.footwork)return {atlas:'motion',index:Math.floor(f.footwork.time/f.footwork.duration*8)%8};
 const walk=nativeWalkPose(f);if(walk)return walk;
 return {atlas:'base',index:Math.floor(f.animTime*3.5)%2};
}
export function adrianoHurt(f){const p=adrianoPose(f);return ADRIANO_HURT[p.atlas][p.index];}

// Three authored siege fronts share the existing projectile wire fields. Their
// origin and collision heights differ; nothing random enters the simulation.
export function adrianoSiegeProjectile(engine,f,data,wave){
 const s=entityScale(f),target=engine.opponentFor(f),direction=wave===1?-f.direction:f.direction;
 const span=[350,395,480][wave]*s;
 const targetX=target.hp>0?target.x:f.x+f.direction*300*s;
 const left=engine.storyActive?engine.camera-250:35,right=engine.storyActive?engine.camera+1530:1245;
 const x=Math.max(left,Math.min(right,targetX-direction*span));
 return {x,prevX:x,y:f.y-[85,250,185][wave]*s,direction,speed:[620,670,850][wave]*s,
  radius:[26,27,32][wave]*s,lane:f.lane??625,originX:x,originY:f.y-[85,250,185][wave]*s,
  data:{...data,knockdown:wave===2}};
}
