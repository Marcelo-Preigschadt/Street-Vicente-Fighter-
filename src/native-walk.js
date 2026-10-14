import {ADRIANO_BODY_SCALE} from './adriano-data.js';
import {entityScale} from './story-world.js';

// Distances are authored in the versus drawing plane. Story scales both the
// actor and its world travel, so the cycle must use that same scale.
export const NATIVE_WALK_STRIDES=Object.freeze({
 adriano:126*ADRIANO_BODY_SCALE,marcelo:160,rafael:128,gustavo:196,gelton:150,marcelino:134,
 marcos:108,joao:138,ruan:128,tais:170,luciana:138,khauany:150,dienes:125
});
export function nativeWalkingFrame(f){
 const stride=NATIVE_WALK_STRIDES[f.character.id]*entityScale(f);
 const phase=((f.walkDistance/stride)%1+1)%1;
 return Math.floor(phase*8)%8;
}
export function nativeWalkPose(f,{footwork=true}={}){
 if(footwork&&f.footwork)return {atlas:'motion',index:f.footwork.kind==='advance'?2:6};
 if(!['walk','idle'].includes(f.state))return null;
 if(f.motion?.blocked&&f.walkBlend<=.02)return null;
 if(f.state==='walk'||f.walkBlend>.02)return {atlas:'motion',index:nativeWalkingFrame(f)};
 return null;
}
