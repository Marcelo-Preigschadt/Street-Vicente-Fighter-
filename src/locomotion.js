import {GAITS,RIG_BIND,rigId,referenceJoints,JOINT} from './locomotion-data.js';
import {entityScale} from './story-world.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const smoothStep=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const rootCurve=t=>{t=clamp(t,0,1);return t*t*t*(t*(6*t-15)+10);};
const scratch=new Float64Array(34),refs=new Map(),shoulderJoints=[11,14],legJoints=[[3,4,5],[7,8,9]];
const carryStrikes=new Set(['punch','kick','crouchPunch','sweep']);
export const isCarryStrike=f=>!!f.carry&&carryStrikes.has(f.action)&&!f.airborne;
function carryImpulse(f){if(!isCarryStrike(f))return 0;const m=f.moveData,t=f.actionTime;return t<m.startup?rootCurve(t/m.startup):t<m.startup+m.active?1:1-rootCurve((t-m.startup-m.active)/m.recovery);}
function reference(id){if(!refs.has(id))refs.set(id,referenceJoints(id,new Float64Array(34)));return refs.get(id);}
export function initLocomotion(f){
 f.worldScale=1;f.visualOffsetX=0;f.visualOffsetY=0;
 f.motion={state:'IDLE',stateTime:0,phase:0,travel:0,startupTravel:0,blend:0,bodyShift:0,prevBodyShift:0,lastWorldX:f.x,lastWorldLane:f.lane??625,moveSign:0,facing:f.direction,ready:false,speed:0,phaseVelocity:0,strideLength:0,cycleDuration:0,blocked:false,
  feet:[0,1].map(()=>({x:f.x,lane:625,lift:0,angle:0,support:true,q:0,startX:0,startLane:625,targetX:0,targetLane:625,prevX:f.x,prevLane:625,prevLift:0,prevAngle:0})),prevPhase:0,prevBlend:0};
}
export function resetFeet(f){
 const id=rigId(f),r=reference(id),m=f.motion,s=entityScale(f),lane=f.lane??625;
 if(!m)return;
 for(let i=0;i<2;i++){const a=(i===0?JOINT.rearAnkle:JOINT.frontAnkle)*2,foot=m.feet[i];
  foot.x=f.x+(r?r[a]:i?40:-40)*s*f.direction;foot.lane=lane;foot.lift=0;foot.angle=0;foot.support=true;foot.q=0;
  foot.prevX=foot.x;foot.prevLane=lane;foot.prevLift=0;foot.prevAngle=0;
 }
 m.ready=true;m.facing=f.direction;m.moveSign=0;m.blend=0;m.phase=0;m.startupTravel=0;m.speed=0;m.phaseVelocity=0;m.bodyShift=0;m.prevBodyShift=0;m.lastWorldX=f.x;m.lastWorldLane=lane;
}
export function saveMotion(f){const m=f.motion;if(!m)return;m.prevPhase=m.phase;m.prevBlend=m.blend;m.prevBodyShift=m.bodyShift;for(const foot of m.feet){foot.prevX=foot.x;foot.prevLane=foot.lane;foot.prevLift=foot.lift;foot.prevAngle=foot.angle;}}
function transition(m,state,dt){if(m.state!==state){m.state=state;m.stateTime=0;}else m.stateTime+=dt;}
export function motionState(f,walking=false){
 if(f.hp<=0)return f.storyEnemy?'DEFEAT':'KNOCKDOWN';
 if(f.knocked)return 'KNOCKDOWN';if(f.wakeTime>0)return 'GET_UP';
 if(f.dizzyTime>0||f.state==='dizzy')return 'STUN';if(f.hitstun>0)return 'HIT';
 if(f.blockstun>0||['block','lowBlock'].includes(f.state))return 'BLOCK';
 if(f.telegraph>0)return 'ATTACK_START';if(f.attackLife>0)return 'ATTACK';if(f.recovery>0)return 'ATTACK_RECOVERY';
 if(f.preJump>0)return 'JUMP_START';if(f.landing>0)return 'LAND';
 if(f.action){if(f.action==='throw')return f.movePhase==='startup'?'GRAB':'THROW';if(f.action==='super')return 'SUPER';if(['special','uppercut','drone'].includes(f.action))return 'SPECIAL';return 'ATTACK';}
 if(f.airborne)return f.vy<0?'JUMP':'FALL';if(f.crouching)return 'CROUCH';
 if(f.carry)return 'CARRY_OBJECT';
 if(walking)return f.motion.moveSign*f.direction<0?'WALK_BACKWARD':'WALK_FORWARD';
 return 'IDLE';
}
export function locomotionVelocity(f,target,dt){
 const g=GAITS[rigId(f)]??GAITS.marcelo,s=entityScale(f),rate=(target?g.acceleration:g.deceleration)*s;
 return f.vx+clamp(target-f.vx,-rate*dt,rate*dt);
}
// Called only after walls, body contacts and camera bounds have resolved world motion.
export function updateLocomotion(f,dt){
 const m=f.motion;if(!m)return;const id=rigId(f),g=GAITS[id]??GAITS.marcelo,r=reference(id),s=entityScale(f),lane=f.lane??625;
 if(m.ready&&m.facing!==f.direction){const rear=m.feet[0];m.feet[0]=m.feet[1];m.feet[1]=rear;m.facing=f.direction;m.moveSign=0;m.bodyShift=0;for(const foot of m.feet){if(!foot.support){foot.targetX=foot.x;foot.targetLane=foot.lane;}foot.angle=-foot.angle;foot.prevAngle=-foot.prevAngle;}}
 const relocated=Math.abs(f.prevX-m.lastWorldX)>1e-5||Math.abs((f.prevLane??lane)-m.lastWorldLane)>1e-5;
 const recovered=['HIT','BLOCK','STUN','KNOCKDOWN','GET_UP'].includes(m.state)&&!f.action&&!f.airborne&&f.hitstun<=0&&f.blockstun<=0&&!f.knocked&&f.wakeTime<=0;
 if(!m.ready||relocated||recovered||!f.airborne&&['JUMP','FALL'].includes(m.state)||Math.hypot(f.x-f.prevX,lane-(f.prevLane??lane))>120*s||m.feet.some(foot=>Math.abs(foot.x-f.x)>g.height*.72*s))resetFeet(f);
 const dx=f.x-f.prevX,dz=lane-(f.prevLane??lane),distance=Math.hypot(dx,dz),requested=Math.abs(f.vx)+Math.abs(f.storyVelocityY??0)>2;
 const eligible=!f.action&&!f.airborne&&!f.knocked&&f.hp>0&&f.hitstun<=0&&f.blockstun<=0&&f.landing<=0&&f.preJump<=0&&f.dizzyTime<=0;
 const charging=f.storyEnemy&&f.attackMode==='charge'&&f.attackLife>0;
 const walking=eligible&&distance>1e-6&&(f.state==='walk'||f.state==='idle'&&requested||!!f.footwork||charging);
 m.blocked=eligible&&requested&&distance<1e-6;
 const wanted=walking?Math.sign(dx)||m.moveSign||f.direction:m.moveSign;
 const backwards=wanted*f.direction<0,stride=(backwards?g.backStride:g.stride)*s*(f.carry?.72:1),duty=Math.min(.86,g.duty+(backwards?.035:0));
 m.strideLength=stride;
 if(walking){
  // Forward starts with the leading foot; backward starts with the trailing
  // foot. The other foot remains planted while the first step is taken.
  if(m.moveSign!==wanted||m.blend<=.001){m.phase=(duty+.475)%1;m.moveSign=wanted;m.startupTravel=0;for(let i=0;i<2;i++)m.feet[i].q=(m.phase+((backwards?i===0:i===1)?.5:0))%1;}
  // The painted idle stance starts wide. Take a shorter first step so the
  // trailing sole releases before it drags the pelvis behind the world root.
  const startRate=clamp(1.7-1.3*m.startupTravel/stride,1,1.7);
  m.phaseVelocity=distance/stride*startRate/dt;
  m.phase+=m.phaseVelocity*dt;m.travel+=distance;m.startupTravel+=distance;m.speed=distance/dt;m.blend=clamp(m.blend+dt/0.065,0,1);
  f.walkTime+=dt;f.walkDistance+=f.lane!==undefined?distance:dx*f.direction;
  const nx=distance>0?dx/distance:0,nz=distance>0?dz/distance:0;
  for(let i=0;i<2;i++){
   const foot=m.feet[i],q=(m.phase+((backwards?i===0:i===1)?.5:0))%1;
   if(q>=duty){
    if(foot.support){foot.support=false;foot.startX=foot.x;foot.startLane=foot.lane;
     // A painted fighting stance is wider than a moving stance. Replant around
     // the pelvis; retaining that full painted width would stretch the legs.
     const base=r?(r[10]+r[18])*.10+(i?1:-1)*Math.max(Math.abs(r[18]-r[10])*.5,stride/s*.54)/2:i?40:-40;
     // The body travels during swing. Project only that remaining distance;
     // a longer lead target exceeds both legs' combined reach at contact.
     foot.targetX=f.x+base*s*f.direction+nx*stride*(1-duty);
     foot.targetLane=lane+nz*stride*(1-duty);
    }
    const t=clamp((q-duty)/(1-duty),0,1),v=rootCurve(t);
    foot.x=foot.startX+(foot.targetX-foot.startX)*v;foot.lane=foot.startLane+(foot.targetLane-foot.startLane)*v;
    foot.lift=Math.sin(Math.PI*t)*g.lift*s*(f.carry?.7:backwards?.72:1);foot.angle=Math.sin(Math.PI*2*t)*(backwards?-.11:.17);
   }else{
    if(!foot.support){foot.targetX=foot.x;foot.targetLane=foot.lane;}
    foot.support=true;foot.lift=0;foot.angle=0;
   }
   foot.q=q;
  }
 }else{
  m.speed=0;m.phaseVelocity=0;m.blend=clamp(m.blend-dt/g.recover,0,1);
  if(m.blend<=.001)m.startupTravel=0;
  // Complete the airborne foot's last short placement. Supporting feet never slide.
  for(let i=0;i<2;i++){const foot=m.feet[i],a=(i===0?JOINT.rearAnkle:JOINT.frontAnkle)*2;
   if(!foot.support){const home=f.x+(r?r[a]:i?40:-40)*s*f.direction;
    foot.x+=(home-foot.x)*Math.min(1,dt*30);foot.lane+=(lane-foot.lane)*Math.min(1,dt*30);foot.lift=Math.max(0,foot.lift-dt*g.lift*s*14);
    if(foot.lift<=.01){foot.support=true;foot.lane=lane;foot.angle=0;}
   }
  }
 }
 const state=motionState(f,walking);
 m.cycleDuration=m.phaseVelocity>0?1/m.phaseVelocity:0;
 transition(m,state==='IDLE'&&m.blend>.001?'MOVE_STOP':walking&&m.blend<.98&&!f.carry?'MOVE_START':state,dt);
 if(r)constrainPelvis(f,r,g,dt);
 m.lastWorldX=f.x;m.lastWorldLane=lane;
 f.walkBlend=m.blend;
}
function bodyParameters(f,g){
 const m=f.motion,time=f.animTime??0,phase=m.phase*Math.PI*2,moving=m.blend,back=m.moveSign*f.direction<0;
 const breathe=Math.sin(time*g.tempo),weight=Math.sin(time*g.tempo*.53);
 // The support sole is in world coordinates. The animation root (pelvis) is
 // expressed relative to the physical root f.x; neither changes the other.
 let sum=0,supportX=0,supportSide=0;
 for(let i=0;i<2;i++){
  const foot=m.feet[i];if(!foot.support)continue;
  const duty=clamp((g.duty+(back?.035:0)),.01,.95);
  const q=clamp(foot.q/duty,0,1);
  const load=smoothStep(Math.min(q,1-q)*4);
  sum+=load;supportX+=load*(foot.x-f.x)*f.direction/(entityScale(f)||1);
  supportSide+=load*(i?1:-1);
 }
 supportX=sum?supportX/sum:0;supportSide=sum?supportSide/sum:0;
 const transfer=clamp(supportX*.32,-Math.max(15,g.sway*2.8),Math.max(15,g.sway*2.8));
 const shift=weight*g.sway*1.25*(1-moving)+(transfer+Math.sin(phase)*g.sway*.28)*moving;
 const down=(.5-.5*Math.cos(phase*2))*g.bob*moving+breathe*.65+(f.carry?4:0)+carryImpulse(f)*2;
 const turn=Math.sin(phase)*.034*moving+weight*.018*(1-moving);
 const lean=(back?-1:1)*g.lean/g.height*moving+weight*.022*(1-moving)-shift/g.height*.10;
 return {shift,down,turn,lean,breathe,weight,phase,supportSide};
}
function constrainPelvis(f,r,g,dt){
 const p=bodyParameters(f,g),s=entityScale(f),m=f.motion;let lo=-Infinity,hi=Infinity;
 for(let i=0;i<2;i++){
  const [h,k,a]=legJoints[i],foot=m.feet[i];if(!foot.support)continue;
  const side=i?-1:1,hipDrive=-side*Math.sin(p.phase)*3.5*m.blend;
  const hipY=r[h*2+1]+p.down- side*(Math.sin(p.phase)*2.2*m.blend+p.supportSide*1.2);
  const length=Math.hypot(r[k*2]-r[h*2],r[k*2+1]-r[h*2+1])+Math.hypot(r[a*2]-r[k*2],r[a*2+1]-r[k*2+1]);
  const dy=r[a*2+1]-foot.lift/s+(foot.lane-(f.lane??625))/s-hipY,reach=Math.sqrt(Math.max(0,length*length-dy*dy));
  const footX=(foot.x-f.x)*f.direction/s-r[h*2]-hipDrive;lo=Math.max(lo,footX-reach);hi=Math.min(hi,footX+reach);
 }
 const target=lo<=hi?clamp(p.shift,lo,hi):(lo+hi)/2;
 const next=p.shift+m.bodyShift+clamp(target-p.shift-m.bodyShift,-650*dt,650*dt);
 m.bodyShift=(lo<=hi?clamp(next,lo,hi):target)-p.shift;
 // A swing foot has no contact constraint. Shorten its arc when needed so the
 // support sole remains locked and neither thigh nor shin has to stretch.
 const pelvisX=p.shift+m.bodyShift;
 for(let i=0;i<2;i++){
  const foot=m.feet[i];if(foot.support)continue;
  const [h,k,a]=legJoints[i],side=i?1:-1;
  const hipX=r[h*2]+pelvisX+side*Math.sin(p.phase)*3.5*m.blend;
  const hipY=r[h*2+1]+p.down+side*(Math.sin(p.phase)*2.2*m.blend+p.supportSide*1.2);
  const length=Math.hypot(r[k*2]-r[h*2],r[k*2+1]-r[h*2+1])+Math.hypot(r[a*2]-r[k*2],r[a*2+1]-r[k*2+1]);
  const footY=r[a*2+1]-foot.lift/s+(foot.lane-(f.lane??625))/s;
  const reach=Math.sqrt(Math.max(0,length*length-(footY-hipY)**2));
  const x=clamp((foot.x-f.x)*f.direction/s,hipX-reach,hipX+reach);
  foot.x=f.x+x*f.direction*s;
 }
 f.visualOffsetX=p.shift+m.bodyShift;f.visualOffsetY=p.down;
}
function joint(out,r,i,x,y){out[i*2]=r[i*2]+x;out[i*2+1]=r[i*2+1]+y;}
function ik(out,r,hip,knee,ankle,x,y){
 const h=hip*2,k=knee*2,a=ankle*2,dx=x-out[h],dy=y-out[h+1],d=Math.hypot(dx,dy)||.001;
 let upper=Math.hypot(r[k]-r[h],r[k+1]-r[h+1]),lower=Math.hypot(r[a]-r[k],r[a+1]-r[k+1]);
 // Feet are hard constraints. A small extension accommodates painted perspective.
 const extend=Math.max(1,d/(upper+lower-.01));upper*=extend;lower*=extend;
 const along=clamp((upper*upper-lower*lower+d*d)/(2*d),0,upper),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 const cross=(r[k]-r[h])*(r[a+1]-r[k+1])-(r[k+1]-r[h+1])*(r[a]-r[k]);const sign=cross>=0?-1:1;
 out[k]=out[h]+dx/d*along-dy/d*bend*sign;out[k+1]=out[h+1]+dy/d*along+dx/d*bend*sign;out[a]=x;out[a+1]=y;
}
// One joint evaluator is shared by drawing, hurtboxes and hand sockets.
export function evaluateRig(f,out=scratch){
 const id=rigId(f),r=reference(id),g=GAITS[id],m=f.motion;if(!r||!g||!m?.ready)return null;
 out.set(r);const s=entityScale(f),blend=m.blend,time=f.animTime??0,phase=m.phase*Math.PI*2,back=m.moveSign*f.direction<0;
 const p=bodyParameters(f,g),breathe=p.breathe,weight=p.weight,moving=blend;
 const carry=!!f.carry,shift=p.shift+(m.bodyShift??0),down=p.down,turn=p.turn;
 joint(out,r,0,shift,down);
 for(const i of [3,7]){
  const side=i===3?-1:1,hipDrive=side*Math.sin(phase)*3.5*moving;
  joint(out,r,i,shift+hipDrive,down+side*(Math.sin(phase)*2.2*moving+p.supportSide*1.2));
 }
 const pelvis=r[1],neckHeight=r[3]-pelvis;
 const neckShift=shift+neckHeight*Math.sin(turn+p.lean);
 joint(out,r,1,neckShift,down+Math.abs(neckHeight)*(1-Math.cos(turn)));
 joint(out,r,2,neckShift*.68+breathe*g.head,down+Math.abs(neckHeight)*(1-Math.cos(turn))+Math.sin(time*g.tempo*.73)*.6);
 for(const i of shoulderJoints){
  const side=i===11?-1:1;
  joint(out,r,i,neckShift+side*Math.sin(phase+Math.PI*.35)*3.2*moving+side*weight*1.3*(1-moving),
   down+side*(breathe*.8+Math.cos(phase)*2.1*moving)-p.supportSide*1.1*moving);
 }
 for(let side=0;side<2;side++){
  const h=side===0?3:7,k=side===0?4:8,a=side===0?5:9,toe=side===0?6:10,foot=m.feet[side];
  const x=(foot.x-f.x)*f.direction/s,y=(foot.lane-(f.lane??625)-foot.lift)/s+r[a*2+1];
  ik(out,r,h,k,a,x,y);
  const angle=foot.angle,tx=r[toe*2]-r[a*2],ty=r[toe*2+1]-r[a*2+1];
  out[toe*2]=x+tx*Math.cos(angle)-ty*Math.sin(angle);out[toe*2+1]=y+tx*Math.sin(angle)+ty*Math.cos(angle);
  const sh=side===0?11:14,el=side===0?12:15,hand=side===0?13:16,guard=g.guard?-.8:0;
  let hx=r[hand*2]+out[sh*2]-r[sh*2]+Math.sin(phase+(side?0:Math.PI))*moving*(g.guard?4:7)+weight*(side?1:-1)*2.1;
  let hy=r[hand*2+1]+down+guard+Math.sin(time*g.tempo+(side?1.1:0))*1.2;
  if(back){hx-=moving*4;hy-=moving*(g.guard?3:1);}
  if(carry){const throwProgress=f.action==='throw'?rootCurve(f.actionTime/(f.moveData?.startup??.1)):0,strike=carryImpulse(f);hx=side===0?23:66;hy=side===0?-185:-198;hx+=shift+throwProgress*16+strike*25;hy+=down-throwProgress*8+strike*(side===0?12:5);}
  ik(out,r,sh,el,hand,hx,hy);
 }
 return out;
}
export function rigHurtboxes(f){
 const p=evaluateRig(f);if(!p)return null;const s=entityScale(f),sx=s*(f.character?.visualWidth??1),dir=f.direction;
 const box=(x,y,w,h)=>({x:f.x+(dir>0?x:-x-w)*sx,y:f.y+y*s,w:w*sx,h:h*s});
 const headX=p[4],headY=p[5],pelvisX=p[0],pelvisY=p[1],neckX=p[2],neckY=p[3];
 const boxes=[box(headX-24,headY-29,48,56),box(Math.min(pelvisX,neckX)-36,neckY+12,72+Math.abs(pelvisX-neckX),pelvisY-neckY+3)];
 for(const [h,k,a]of legJoints){const x=Math.min(p[h*2],p[k*2],p[a*2])-16,y=Math.min(p[h*2+1],p[k*2+1]);boxes.push(box(x,y,Math.max(p[h*2],p[k*2],p[a*2])-x+16,p[a*2+1]-y+18));}
 return boxes;
}
export function handSockets(f,out={}){
 const p=evaluateRig(f),s=entityScale(f);if(!p)return null;
 const sx=s*(f.character?.visualWidth??1);
 out.leftX=f.x+p[26]*f.direction*sx;out.leftY=f.y+p[27]*s;out.rightX=f.x+p[32]*f.direction*sx;out.rightY=f.y+p[33]*s;
 return out;
}
export function usesRig(f){const carryingAttack=isCarryStrike(f);return !!(RIG_BIND[rigId(f)]&&f.motion?.ready&&!f.airborne&&(!f.action||f.action==='throw'&&f.carry||carryingAttack)&&!f.knocked&&f.hp>0&&f.hitstun<=0&&f.blockstun<=0&&f.dizzyTime<=0&&f.wakeTime<=0&&f.landing<=0&&f.preJump<=0&&(!f.crouching||carryingAttack)&&(['idle','walk','stepIn','stepBack'].includes(f.state)||f.action==='throw'&&f.carry||carryingAttack||f.storyEnemy&&f.attackMode==='charge'&&f.attackLife>0));}
