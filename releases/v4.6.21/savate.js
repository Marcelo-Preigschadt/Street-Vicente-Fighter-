import {SAVATE_WALK_HURT} from './savate-walk-data.js';
import {SAVATE_HURT} from './savate-data.js';
// Whole-body poses preserve the shoe contact and boxing guard of Savate.
export function savatePose(f){
 if(f.footwork)return {atlas:'motion',index:f.footwork.kind==='advance'?2:6};
 const m=f.moveData,extended=m&&f.actionTime>=m.startup&&f.actionTime<m.startup+m.active;
 const combat={crouchPunch:extended?1:0,sweep:extended?3:2,airPunch:extended?5:4,airKick:extended?7:6,uppercut:extended?11:10,lowBlock:9,wake:13,throw:14,landing:15,preJump:15};
 if(Object.hasOwn(combat,f.state))return {atlas:'combat',index:combat[f.state]};
 const base={jump:4,crouch:5,block:10,hit:11,dizzy:11,victory:14,ko:15,knockdown:15,punch:extended?7:6,kick:extended?9:8,guardCounter:extended?7:6,special:extended?13:12,super:extended?13:12};
 if(Object.hasOwn(base,f.state))return {atlas:'base',index:base[f.state]};
 if(['walk','idle'].includes(f.state)&&f.walkBlend>.02)return {atlas:'motion',index:Math.floor((Math.max(0,f.walkDistance)%170)/170*8)};
 return {atlas:'base',index:Math.floor(f.animTime*4)%2};
}
export function savateHurt(f){const {atlas,index}=savatePose(f);return (atlas==='motion'?SAVATE_WALK_HURT:SAVATE_HURT[atlas])[index];}
export const SAVATE_STRIKES={
 punch:{near:32,reach:180,height:224,h:42},kick:{near:38,reach:235,height:183,h:60},
 crouchPunch:{near:24,reach:172,height:130,h:43},sweep:{near:25,reach:220,height:53,h:62},
 airPunch:{near:28,reach:186,height:198,h:43},airKick:{near:30,reach:238,height:154,h:64},
 uppercut:{near:-20,reach:165,height:263,h:126},guardCounter:{near:30,reach:180,height:220,h:50}
};
