import {MMA_HURT} from './mma-data.js';
import {GAITS} from './locomotion-data.js';

// Luciana's whole-body paintings are used for both versus and story movement.
export function mmaPose(f){
  const m=f.moveData,extended=!!m&&f.actionTime>=m.startup&&f.actionTime<m.startup+m.active;
  // Low guarded chamber and authored kick; the old base[8] has an extended
  // punching arm and is never part of the kick's preparation or recovery.
  if(f.state==='kick')return extended?{atlas:'base',index:9}:{atlas:'combat',index:2};
  const combat={crouchPunch:extended?1:0,sweep:extended?3:2,airPunch:extended?5:4,
    airKick:extended?7:6,uppercut:extended?11:10,lowBlock:9,wake:14,
    throw:14,landing:15,preJump:15};
  if(Object.hasOwn(combat,f.state))return {atlas:'combat',index:combat[f.state]};
  const base={jump:4,crouch:5,block:10,hit:11,dizzy:11,victory:14,
    ko:15,knockdown:15,punch:extended?7:6,kick:extended?9:0,
    guardCounter:extended?7:6,special:extended?13:12,super:extended?13:12};
  if(Object.hasOwn(base,f.state))return {atlas:'base',index:base[f.state]};
  if(f.footwork)return {atlas:'motion',index:f.footwork.kind==='advance'?2:6};
  if(f.state==='walk'||f.walkBlend>.02)return {atlas:'motion',index:Math.floor(Math.abs(f.walkDistance)/GAITS.luciana.stride*8)%8};
  return {atlas:'base',index:Math.floor(f.animTime*4)%2};
}
export function mmaHurt(f){const {atlas,index}=mmaPose(f);return MMA_HURT[atlas][index];}
export const MMA_STRIKES={
  punch:{near:28,reach:175,height:215,h:45},kick:{near:42,reach:185,height:116,h:61},
  crouchPunch:{near:25,reach:165,height:115,h:45},sweep:{near:28,reach:205,height:45,h:55},
  airPunch:{near:25,reach:174,height:155,h:48},airKick:{near:30,reach:210,height:142,h:65},
  uppercut:{near:-18,reach:142,height:210,h:110},special:{near:28,reach:192,height:211,h:60},
  super:{near:23,reach:216,height:202,h:80},guardCounter:{near:26,reach:174,height:210,h:48}
};
