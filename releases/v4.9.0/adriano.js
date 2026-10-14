import {ADRIANO_BODY_SCALE,ADRIANO_HURT} from './adriano-data.js';
export {ADRIANO_BODY_SCALE} from './adriano-data.js';
import {nativeWalkPose} from './native-walk.js';
import {entityScale} from './story-world.js';
import {ADRIANO_TRANSITION_GEOMETRY} from './adriano-transition-data.js';

const box=(near,reach,height,h)=>({near:near*ADRIANO_BODY_SCALE,reach:reach*ADRIANO_BODY_SCALE,height:height*ADRIANO_BODY_SCALE,h:h*ADRIANO_BODY_SCALE});
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

// The medium-attack pilot adds whole-body anticipation and return drawings.
// Contact retains the approved pose and exact gameplay window; no blending,
// time stretching or limb deformation is used to manufacture extra frames.
function mediumTransitionPose(f){
 const m=f.moveData,t=f.actionTime??0;
 if(!m||m.strength!==1||!['punch','kick'].includes(f.state))return null;
 const offset=f.state==='kick'?4:0,chamber=f.state==='kick'?8:2;
 if(t<m.startup){
  const q=t/m.startup;
  if(q<.16)return {atlas:'base',index:0};
  if(q<.40)return {atlas:'transition',index:offset};
  if(q<.66)return {atlas:'strike',index:chamber};
  return {atlas:'transition',index:offset+1};
 }
 if(t<m.startup+m.active)return {atlas:'strike',index:chamber+1};
 const q=(t-m.startup-m.active)/m.recovery;
 if(q<.12)return {atlas:'strike',index:chamber+1};
 if(q<.43)return {atlas:'transition',index:offset+2};
 if(q<.76)return {atlas:'transition',index:offset+3};
 return {atlas:'base',index:0};
}

// Each other standing strength retains its own approved technique pair.
export function adrianoPose(f){
 const transition=mediumTransitionPose(f);if(transition)return transition;
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
export function adrianoHurt(f){const p=adrianoPose(f);return p.atlas==='transition'?ADRIANO_TRANSITION_GEOMETRY[`transition:${p.index}`].hurt:ADRIANO_HURT[p.atlas][p.index];}

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
