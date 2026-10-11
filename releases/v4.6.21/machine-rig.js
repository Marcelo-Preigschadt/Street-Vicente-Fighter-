// Articulated mechanical animation, tied to simulation attack states and distance.
import {entityScale} from './story-world.js';
export function machineRigPose(e,time,reduced=false){
  time=e.animTime??time;
  const walk=e.state==='walk'?Math.sin((e.brawlerWalkDistance??0)/24):0;
  const boss=!!e.profile?.boss,contact=boss?11:14;
  const t=Math.max(0,Math.min(1,(e.brawlerFrameTime??0)*(boss?11.25:16.25)));
  const extension=e.brawlerFrame===contact?1:e.brawlerFrame===contact-1?(e.brawlerReverse?1-t:t):0;
  const remaining=e.profile?.boss?.45:.25,recovery=Math.max(0,Math.min(1,(e.recovery??0)/remaining));
  const eased=(e.attackLife>0?1:e.telegraph>0?0:recovery*recovery*(3-2*recovery))*extension*extension*(3-2*extension);
  const duration=e.profile?.boss?.45:.16;
  const prepare=e.telegraph>0?Math.max(0,Math.min(1,1-e.telegraph/duration)):e.attackLife>0?1:Math.max(0,Math.min(1,(e.recovery??0)/remaining));
  const anticipation=prepare*prepare*(3-2*prepare),idle=1-anticipation;
  const upper=-.45-.7*anticipation+1.1*eased+walk*.16*idle;
  // Rolling angle comes from signed world displacement. An orbit can move
  // backwards while the enemy continues facing the player.
  const wheelDistance=Number.isFinite(e.x)?e.x*e.direction:(e.motion?.travel??e.brawlerWalkDistance??0);
  return {upper,forearm:-.5-.4*anticipation+.95*eased-walk*.12*idle,
    rear:2.7-walk*.12*idle+anticipation*.35,rearForearm:.5-.85*eased,
    saw:reduced?0:time*32,wheel:reduced?0:wheelDistance/(21*entityScale(e)),
    brush:reduced?0:time*12,bob:reduced?0:walk*1.5,lean:Math.max(-.045,Math.min(.045,(e.vx??0)/4000))};
}
function part(c,rig,index,x,y,w,h,angle=0,ax=.5,ay=.5){
  const rect=rig.parts[index];c.save();c.translate(x,y);c.rotate(angle);
  c.drawImage(rig.image,...rect,-w*ax,-h*ay,w,h);c.restore();
}
function link(c,rig,index,x,y,length,angle){
  const rect=rig.parts[index],h=length*rect[3]/rect[2];
  part(c,rig,index,x,y,length,h,angle,.15,.5);
  return [x+Math.cos(angle)*length*.75,y+Math.sin(angle)*length*.75];
}
function arm(c,rig,pose,shoulder,rear,cleaner){
  const angle=rear?pose.rear:pose.upper,bend=rear?pose.rearForearm:pose.forearm;
  const elbow=link(c,rig,rear?6:1,...shoulder,56,angle);
  const wrist=link(c,rig,rear?7:2,...elbow,58,angle+bend);
  if(cleaner)part(c,rig,3,...wrist,25,82,angle+bend+.3,.5,.85);
  else part(c,rig,3,...wrist,70,70,pose.saw);
}
export function drawMachineRig(c,e,rig,time,reduced){
  time=e.animTime??time;
  if(e.kind==='snack')return drawDeliveryDrone(c,e,rig,time,reduced);
  const cleaner=e.kind==='cleaner',pose=machineRigPose(e,time,reduced);
  c.save();c.translate(e.x,e.y);c.scale(e.direction*entityScale(e),entityScale(e));
  if(e.hp<=0){c.globalAlpha=Math.max(0,1-e.deadTime);c.rotate(-Math.min(Math.PI/2,e.deadTime*4));}
  if(e.flash>0)c.globalAlpha=.6;
  // Rear arm is behind the chassis; front arm and blades occlude the chassis.
  arm(c,rig,pose,[-34,-128+pose.bob],true,cleaner);
  for(const x of [-34,34])part(c,rig,4,x,-21,42,42,pose.wheel);
  const body=rig.parts[0],h=cleaner?155:170,w=h*body[2]/body[3];
  part(c,rig,0,0,-35+pose.bob,w,h,pose.lean,.5,1);
  if(cleaner){for(const x of [-25,30]){c.save();c.translate(x,-8);c.scale(1,.32);part(c,rig,5,0,0,65,65,pose.brush);c.restore();}}
  else part(c,rig,5,w*.21,-111+pose.bob,57,57,reduced?0:time*2);
  arm(c,rig,pose,[w*.23,-132+pose.bob],false,cleaner);
  c.restore();
}
function rotor(c,rig,x,y,angle){
  c.save();c.translate(x,y);c.scale(1,.32);
  // Fixed outer safety cage, independently rotating blades inside it.
  c.save();c.beginPath();c.arc(0,0,35,0,Math.PI*2);c.arc(0,0,29,0,Math.PI*2,true);c.clip('evenodd');part(c,rig,1,0,0,70,70);c.restore();
  c.save();c.beginPath();c.arc(0,0,30,0,Math.PI*2);c.clip();part(c,rig,1,0,0,70,70,angle);c.restore();c.restore();
}
function drawDeliveryDrone(c,e,rig,time,reduced){
  c.save();c.translate(e.x,e.y);c.scale(e.direction*entityScale(e),entityScale(e));
  if(e.hp<=0){c.globalAlpha=Math.max(0,1-e.deadTime);c.rotate(-Math.min(Math.PI/2,e.deadTime*4));}
  if(e.flash>0)c.globalAlpha=.6;
  const bank=reduced?0:Math.max(-.07,Math.min(.07,(e.vx??0)/2000));c.rotate(bank);
  part(c,rig,0,0,0,170,110,0,.5,1);
  const spin=reduced?0:time*45;
  rotor(c,rig,-22,-112,spin);rotor(c,rig,-73,-88,-spin);rotor(c,rig,72,-89,spin);
  c.restore();
}
