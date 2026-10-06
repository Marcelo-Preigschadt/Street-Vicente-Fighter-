import {KARATE_HURT} from './karate-data.js';
// Whole sprites: karate guard, hikite, straight punches and chambered kicks.
export function karatePose(f){
 const m=f.moveData,extended=m&&f.actionTime>=m.startup&&f.actionTime<m.startup+m.active;
 const combat={crouchPunch:extended?1:0,sweep:extended?3:2,airPunch:extended?5:4,airKick:extended?7:6,uppercut:m&&f.actionTime>=m.startup?11:10,lowBlock:9,wake:13,throw:14,landing:15,preJump:15};
 if(Object.hasOwn(combat,f.state))return {atlas:'combat',index:combat[f.state]};
 if(f.state==='super'&&extended){const index=[7,9,13][Math.min(2,Math.floor((f.actionTime-m.startup)/.11))];return {atlas:'base',index};}
 const base={jump:4,crouch:5,block:10,hit:11,dizzy:11,victory:14,ko:15,knockdown:15,punch:extended?7:6,kick:extended?9:8,guardCounter:extended?7:6,special:m&&f.actionTime>=m.startup?13:12,super:m&&f.actionTime>=m.startup?13:12};
 if(Object.hasOwn(base,f.state))return {atlas:'base',index:base[f.state]};
 if(f.footwork)return {atlas:'base',index:f.footwork.kind==='advance'?2:3};
 return {atlas:'base',index:f.state==='walk'?2+Math.abs(Math.floor(f.walkDistance/46)%2):Math.floor(f.animTime*4)%2};
}
export function karateHurt(f){const {atlas,index}=karatePose(f);return KARATE_HURT[atlas][index];}
export const KARATE_STRIKES={
 punch:{near:30,reach:175,height:215,h:42},kick:{near:35,reach:220,height:180,h:60},
 crouchPunch:{near:25,reach:168,height:135,h:42},sweep:{near:20,reach:225,height:50,h:65},
 airPunch:{near:25,reach:177,height:190,h:45},airKick:{near:25,reach:230,height:150,h:65},
 uppercut:{near:-25,reach:100,height:260,h:145},guardCounter:{near:30,reach:180,height:215,h:55},
};
