import {DIENES_HURT} from './dienes-data.js';
import {GAITS} from './locomotion-data.js';

// A tight Muay Thai guard and short lateral steps, with dedicated elbow,
// knee, low kick, chalk, and book release drawings.
export function dienesPose(f){
  const m=f.moveData,active=!!m&&f.actionTime>=m.startup&&f.actionTime<m.startup+m.active;
  const combat={crouchPunch:active?0:12,sweep:active?4:12,airPunch:active?9:6,
    airKick:active?7:6,uppercut:active?8:2,lowBlock:10,
    special:active?12:11,super:active?14:13};
  if(Object.hasOwn(combat,f.state))return {atlas:'combat',index:combat[f.state]};
  const base={jump:4,crouch:5,block:6,hit:11,dizzy:11,victory:14,
    wake:5,landing:0,preJump:5,
    ko:15,knockdown:15,punch:active?8:7,kick:active?10:9,
    guardCounter:active?8:6};
  if(Object.hasOwn(base,f.state))return {atlas:'base',index:base[f.state]};
  if(f.state==='throw')return {atlas:'combat',index:11};
  if(f.footwork)return {atlas:'motion',index:f.footwork.kind==='advance'?2:6};
  if(f.state==='walk'||f.walkBlend>.02)return {atlas:'motion',index:Math.floor(Math.abs(f.walkDistance)/GAITS.dienes.stride*8)%8};
  return {atlas:'base',index:Math.floor(f.animTime*4)%2};
}
export function dienesHurt(f){const {atlas,index}=dienesPose(f);return DIENES_HURT[atlas][index];}
export const DIENES_STRIKES={
  punch:{near:24,reach:160,height:202,h:52},kick:{near:37,reach:211,height:159,h:69},
  crouchPunch:{near:18,reach:149,height:108,h:47},sweep:{near:18,reach:215,height:50,h:52},
  airPunch:{near:20,reach:164,height:168,h:50},airKick:{near:27,reach:218,height:154,h:67},
  uppercut:{near:-23,reach:140,height:230,h:125},special:{near:30,reach:172,height:200,h:48},
  super:{near:30,reach:194,height:202,h:65},guardCounter:{near:20,reach:156,height:202,h:51}
};
