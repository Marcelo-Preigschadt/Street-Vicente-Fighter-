// Presentation never writes simulation state: camera easing cannot alter rollback or collisions.
export function smoothCamera(current,target,dt){
  if(!Number.isFinite(current)||target<current-300)return target;
  return current+(target-current)*(1-Math.exp(-12*Math.max(0,dt)));
}
export function schoolEnemyFrame(e){
  if(e.hp<=0||e.knocked){const age=e.hp<=0?e.deadTime:e.brawlerFrameTime;return e.hp<=0?Math.min(15,13+Math.floor(age*6)):Math.min(15,13+Math.max(0,e.brawlerFrame-15));}
  if(e.hitstun>0)return 12;
  if(e.telegraph>0)return 9;
  if(e.attackLife>0){if(e.attackMode==='charge')return 10;const contact=e.profile.boss?11:14;return e.brawlerFrame===contact?10:e.brawlerReverse?11:9;}
  if(e.state==='walk')return 1+Math.floor((e.brawlerWalkDistance%180)/180*8);
  return 0;
}
export function interpolateEntity(e,alpha){return {...e,profile:e.profile,x:e.prevX+(e.x-e.prevX)*alpha,y:e.prevY+(e.y-e.prevY)*alpha,lane:(e.prevLane??e.lane)+(e.lane-(e.prevLane??e.lane))*alpha,attackbox:e.attackbox};}
// Depth comes from feetY ordering. Actor sizes do not change outside physics.
export function storyDepthScale(){return 1;}
