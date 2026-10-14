// Carrying is a pose of each actor's approved skeleton, not a universal pair
// of hand coordinates. The source wrists stay close to their painted guard.
// elapsed lives inside carry so pickup easing participates in story rollback.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const ease=value=>{const t=clamp(value,0,1);return t*t*t*(t*(6*t-15)+10);};
export const CARRY_PICKUP_SECONDS=.18;
export function carryBlend(f){
  return f.carry?ease((f.carry.elapsed??CARRY_PICKUP_SECONDS)/CARRY_PICKUP_SECONDS):0;
}
export function carryHandTarget(f,reference,side,parameters,out={}){
  const {shift=0,down=0,baseX,baseY,strike=0,throwProgress=0}=parameters;
  const meanX=(reference[26]+reference[32])/2;
  const meanY=(reference[27]+reference[33])/2;
  // Close the guard around the prop, with enough separation to read both
  // grips. Keep the actor's existing wrist pitch instead of leveling by force.
  const span=clamp(Math.abs(reference[32]-reference[26]),32,52);
  const pitch=clamp((reference[33]-reference[27])*.35,-8,8);
  const sign=side===0?-1:1;
  const x=meanX+sign*span/2+shift+throwProgress*16+strike*25;
  const y=meanY+18+sign*pitch/2+down-throwProgress*8+strike*(side===0?12:5);
  const blend=carryBlend(f);
  out.x=baseX+(x-baseX)*blend;out.y=baseY+(y-baseY)*blend;
  return out;
}
