import {KHAUANY_HURT} from './khauany-data.js';

// Compact counter-fighting stance, with the launcher and sliding kick painted
// as complete poses instead of reusing Luciana's punch/knee frames.
export function khauanyPose(f){
  const m=f.moveData,extended=!!m&&f.actionTime>=m.startup&&f.actionTime<m.startup+m.active;
  const combat={crouchPunch:extended?1:6,sweep:extended?3:6,airPunch:extended?1:2,
    airKick:extended?7:2,uppercut:extended?10:9,lowBlock:6,wake:13,
    throw:11,landing:15,preJump:15};
  if(Object.hasOwn(combat,f.state))return {atlas:'combat',index:combat[f.state]};
  const base={jump:4,crouch:12,block:6,hit:11,dizzy:11,victory:14,
    ko:15,knockdown:15,punch:extended?8:7,kick:extended?9:10,
    guardCounter:extended?8:6,special:extended?13:6,super:extended?13:6};
  if(Object.hasOwn(base,f.state))return {atlas:'base',index:base[f.state]};
  if(f.footwork)return {atlas:'base',index:f.footwork.kind==='advance'?2:3};
  if(f.state==='walk'||f.walkBlend>.02)return {atlas:'base',index:2+Math.floor(Math.abs(f.walkDistance)/42)%2};
  return {atlas:'base',index:Math.floor(f.animTime*4)%2};
}
export function khauanyHurt(f){const {atlas,index}=khauanyPose(f);return KHAUANY_HURT[atlas][index];}
export const KHAUANY_STRIKES={
  punch:{near:33,reach:173,height:204,h:45},kick:{near:40,reach:204,height:115,h:63},
  crouchPunch:{near:25,reach:156,height:112,h:45},sweep:{near:18,reach:224,height:47,h:49},
  airPunch:{near:24,reach:169,height:166,h:48},airKick:{near:30,reach:219,height:147,h:65},
  uppercut:{near:-18,reach:153,height:225,h:120},special:{near:32,reach:179,height:205,h:55},
  super:{near:30,reach:207,height:206,h:72},guardCounter:{near:24,reach:170,height:201,h:51}
};
