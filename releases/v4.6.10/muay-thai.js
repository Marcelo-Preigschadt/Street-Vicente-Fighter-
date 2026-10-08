import { MUAY_THAI_HURT } from './muay-thai-data.js';

// The full-body pose is shared by rendering and collision detection.
export function muayThaiPose(f) {
  const m=f.moveData;
  const stage=m ? f.actionTime<m.startup ? Number(f.actionTime>=m.startup*.5)
    : f.actionTime<m.startup+m.active ? 2 : 3 : 0;
  if(f.state==='super') {
    const time=Math.max(0,f.actionTime-(m?.startup??0));
    const cycle=Math.floor(time/.11),row=[3,2,0,3,2][cycle%5];
    return {atlas:'combat',index:row*4+(time% .11<.055?1:2)};
  }
  const rows={punch:3,airPunch:3,guardCounter:3,kick:0,sweep:1,airKick:2,uppercut:2};
  if(Object.hasOwn(rows,f.state))return {atlas:'combat',index:rows[f.state]*4+stage};
  if(f.state==='throw')return stage<2?{atlas:'base',index:15}:{atlas:'combat',index:10};
  const poses={crouch:4,lowBlock:5,block:6,jump:7,hit:f.hitCrouched?9:8,ko:10,knockdown:10,wake:11,victory:12,special:13,crouchPunch:14,landing:4,preJump:4,dizzy:8};
  if(Object.hasOwn(poses,f.state))return {atlas:'base',index:poses[f.state]};
  if(f.footwork)return {atlas:'base',index:f.footwork.kind==='advance'?2:3};
  return {atlas:'base',index:((Math.floor(f.state==='walk'?f.walkDistance/40:f.animTime*5)%4)+4)%4};
}
export function muayThaiHurt(f) {
  const {atlas,index}=muayThaiPose(f);return MUAY_THAI_HURT[atlas][index];
}
export const MUAY_THAI_STRIKES={
  punch:{near:28,reach:118,height:225,h:58},crouchPunch:{near:25,reach:145,height:118,h:44},
  kick:{near:45,reach:225,height:215,h:70},sweep:{near:35,reach:193,height:110,h:58},
  airPunch:{near:20,reach:157,height:218,h:60},airKick:{near:22,reach:122,height:180,h:84},
  uppercut:{near:-24,reach:122,height:235,h:112},guardCounter:{near:20,reach:122,height:218,h:64},
};
