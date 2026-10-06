import { JUDO_HURT } from './judo-data.js?v=24';

export function judoPose(f) {
  const m=f.moveData,stage=!m?0:f.actionTime<m.startup?Number(f.actionTime>=m.startup*.5):f.actionTime<m.startup+m.active?2:3;
  const rows={punch:0,airPunch:0,guardCounter:0,kick:1,sweep:1,airKick:1,throw:2,uppercut:3,super:2};
  if(Object.hasOwn(rows,f.state))return {atlas:'combat',index:rows[f.state]*4+stage};
  const poses={crouch:4,lowBlock:5,block:6,jump:7,hit:f.hitCrouched?9:8,ko:10,knockdown:10,wake:11,victory:12,special:13,crouchPunch:14,landing:4,preJump:4,dizzy:8};
  if(Object.hasOwn(poses,f.state))return {atlas:'base',index:poses[f.state]};
  if(f.footwork)return {atlas:'base',index:f.footwork.kind==='advance'?2:3};
  return {atlas:'base',index:((Math.floor(f.state==='walk'?f.walkDistance/38:f.animTime*4)%4)+4)%4};
}
export function judoHurt(f) { const {atlas,index}=judoPose(f);return JUDO_HURT[atlas][index]; }
export const JUDO_STRIKES={
  punch:{near:25,reach:175,height:207,h:56},crouchPunch:{near:20,reach:165,height:143,h:48},
  kick:{near:30,reach:176,height:67,h:70},sweep:{near:30,reach:176,height:67,h:70},
  airPunch:{near:20,reach:170,height:205,h:65},airKick:{near:20,reach:176,height:88,h:80},
  uppercut:{near:-25,reach:130,height:260,h:170},guardCounter:{near:20,reach:145,height:207,h:64},
};
