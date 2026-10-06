import {WILD_HURT} from './wild-data.js?v=27';

// Entire painted poses are shared by animation and physical silhouettes.
export function wildPose(f) {
  const m=f.moveData,stage=!m?0:f.actionTime<m.startup?Number(f.actionTime>=m.startup*.5):f.actionTime<m.startup+m.active?2:3;
  const rows={punch:0,airPunch:0,guardCounter:0,special:0,kick:1,sweep:1,airKick:1,uppercut:2,throw:0,super:3};
  if(Object.hasOwn(rows,f.state))return {atlas:'combat',index:rows[f.state]*4+stage};
  const poses={crouch:4,lowBlock:5,block:6,jump:7,hit:f.hitCrouched?9:8,ko:10,knockdown:10,wake:11,victory:12,crouchPunch:14,landing:4,preJump:4,dizzy:8};
  if(Object.hasOwn(poses,f.state))return {atlas:'base',index:poses[f.state]};
  if(f.footwork)return {atlas:'base',index:f.footwork.kind==='advance'?2:3};
  return {atlas:'base',index:((Math.floor(f.state==='walk'?f.walkDistance/36:f.animTime*5)%4)+4)%4};
}
export function wildHurt(f) { const {atlas,index}=wildPose(f);return WILD_HURT[atlas][index]; }
export const WILD_STRIKES={
  punch:{near:25,reach:205,height:180,h:68},crouchPunch:{near:20,reach:175,height:130,h:55},
  kick:{near:30,reach:205,height:94,h:75},sweep:{near:25,reach:215,height:58,h:72},
  airPunch:{near:20,reach:205,height:150,h:65},airKick:{near:20,reach:210,height:85,h:95},
  special:{near:20,reach:260,height:190,h:100},uppercut:{near:-55,reach:130,height:140,h:190},
  super:{near:-155,reach:230,height:155,h:250},guardCounter:{near:20,reach:185,height:180,h:75},
};
