import { GELTON_HURT } from './gelton-hurt.js?v=17';
// Dedicated whole-body capoeira poses. The same pose selects rendering and collisions.
export function capoeiraPose(f) {
  const m=f.moveData, stage=m ? f.actionTime<m.startup ? Number(f.actionTime>=m.startup*.5) : f.actionTime<m.startup+m.active ? 2 : 3 : 0;
  if (['kick','sweep','uppercut','airKick','super'].includes(f.state)) {
    const row=f.state==='kick'?0:f.state==='sweep'?1:2;
    const step=f.state==='super'?Math.floor(Math.max(0,f.actionTime-(m?.startup??0))*12)%4:stage;
    return {atlas:'combat',index:row*4+step};
  }
  if (['punch','airPunch','guardCounter','special','throw'].includes(f.state)) return {atlas:'combat',index:12+stage};
  if(f.state==='crouchPunch')return {atlas:'base',index:14};
  const pose={crouch:4,lowBlock:5,block:6,jump:7,hit:f.hitCrouched?9:8,ko:10,knockdown:10,wake:11,victory:12,landing:4,preJump:4,dizzy:8};
  if(Object.hasOwn(pose,f.state))return {atlas:'base',index:pose[f.state]};
  return {atlas:'base',index:Math.floor(f.animTime*8)%4};
}
export function capoeiraHurt(f) {
  const pose=capoeiraPose(f);return GELTON_HURT[pose.atlas][pose.index];
}
export const CAPOEIRA_STRIKES={
  punch:{near:35,reach:158,height:218,h:42},crouchPunch:{near:20,reach:146,height:118,h:46},
  kick:{near:48,reach:233,height:237,h:68},sweep:{near:15,reach:237,height:54,h:66},
  airPunch:{near:25,reach:168,height:210,h:46},airKick:{near:35,reach:235,height:164,h:76},
  uppercut:{near:-35,reach:160,height:246,h:130},guardCounter:{near:20,reach:204,height:148,h:90},
};
