import {evaluateRig} from './locomotion.js';
import {prepareLocomotionRig,drawRigPose} from './locomotion-render.js';
import {RIG_BIND} from './locomotion-data.js';
import {entityScale} from './story-world.js';
import {STORY_MECHANICAL_WALKERS} from './story-mechanical-data.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
export const ENEMY_MOTION=Object.freeze({
  snack:'rotor',turnstile:'wheels',cleaner:'wheels',lab:'biped',vial:'tripod',scanner:'mechanical-biped',
  book:'levitation',archaeologist:'rotor',elite:'biped',kungfu:'biped',inspector:'biped',
  fairRobot:'biped',substitute:'biped',aula:'hologram',exo:'biped',projector:'suspension'
});
const rigKinds=new Set(['lab','elite','kungfu','inspector','fairRobot','substitute','exo']);
const floatKinds=new Set(['book','archaeologist','aula','projector']);

export function enemyAttackPose(e){
  const boss=!!e.profile?.boss,contact=boss?11:14,fps=boss?11.25:16.25;
  const q=clamp((e.brawlerFrameTime??0)*fps,0,1);
  const phaseThrust=e.brawlerFrame===contact?1:e.brawlerFrame===contact-1?(e.brawlerReverse?1-ease(q):ease(q)):0;
  const recovery=ease((e.recovery??0)/(boss?.45:.25));
  const thrust=e.attackLife>0?phaseThrust:e.telegraph>0?0:phaseThrust*recovery;
  const anticipation=e.telegraph>0?ease(1-e.telegraph/(boss?.45:.16)):e.attackLife>0?1:recovery;
  return {anticipation,thrust};
}

export function prepareEnemyMotion(art){
  art.actorRigs={};art.mechanicalWalkers={};
  for(const id of art.experimentalActorRig?rigKinds:[]){
    const native=art.animations?.[id],image=native?.image??art.enemies[enemyCell[id]],meta=native?.frames?.[0];
    let source=image;
    // This sprite contains a baked flame. The actual attack owns its flame FX;
    // the chassis cannot keep breathing fire in idle or after being defeated.
    if(id==='fairRobot'&&!native){
      source=document.createElement('canvas');source.width=image.width;source.height=image.height;
      const c=source.getContext('2d');c.drawImage(image,0,0);c.clearRect(235,45,image.width-235,140);
    }
    const frame={image:source,rect:meta?.rect??[0,0,source.width,source.height],w:meta?.rect[2]??source.width,h:meta?.rect[3]??source.height};
    art.actorRigs[id]=prepareLocomotionRig(id,null,frame);
  }
  for(const [kind,spec]of Object.entries(art.mechanical??{}))art.mechanicalWalkers[kind]=prepareWalker(spec);
}
const enemyCell={lab:3,vial:4,scanner:5,book:6,archaeologist:7,elite:8,kungfu:9,inspector:10,fairRobot:11,substitute:12,aula:13,exo:14,projector:15};

function rotateChain(p,shoulder,elbow,wrist,upper,bend){
  const sx=p[shoulder*2],sy=p[shoulder*2+1];
  for(const i of [elbow,wrist]){const dx=p[i*2]-sx,dy=p[i*2+1]-sy;p[i*2]=sx+dx*Math.cos(upper)-dy*Math.sin(upper);p[i*2+1]=sy+dx*Math.sin(upper)+dy*Math.cos(upper);}
  const ex=p[elbow*2],ey=p[elbow*2+1],dx=p[wrist*2]-ex,dy=p[wrist*2+1]-ey;
  p[wrist*2]=ex+dx*Math.cos(bend)-dy*Math.sin(bend);p[wrist*2+1]=ey+dx*Math.sin(bend)+dy*Math.cos(bend);
}
export function enemyRigPose(e,out=new Float64Array(34)){
  if(!evaluateRig(e,out))return null;
  const {anticipation,thrust}=enemyAttackPose(e);
  // New gestures are bounded adjustments to the approved weapon/guard. Bone
  // rotations preserve lengths and the head remains under the rigid neck skin.
  const heavy=e.kind==='fairRobot'||e.kind==='exo';
  rotateChain(out,14,15,16,anticipation*(heavy?-.10:-.16)+thrust*(heavy?.20:.28),-thrust*(heavy?.15:.20));
  rotateChain(out,11,12,13,anticipation*.08-thrust*.09,thrust*.06);
  return out;
}
export function drawEnemyArticulation(c,e,art,time,reduced){
  if(art.mechanicalWalkers?.[e.kind]){drawWalker(c,e,art.mechanicalWalkers[e.kind]);return true;}
  const rig=art.actorRigs?.[e.kind];
  if(art.experimentalActorRig&&rig&&e.hp>0&&!e.knocked&&e.hitstun<=0&&(!art.animations?.[e.kind]||['idle','walk'].includes(e.state)||e.attackMode==='charge'&&e.attackLife>0)){
    const pose=enemyRigPose(e,rig.joints);if(!pose)return false;
    c.save();c.translate(e.x,e.y);c.scale(e.direction*entityScale(e),entityScale(e));
    if(e.flash>0)c.globalAlpha=.65;drawRigPose(c,e,rig,pose);c.restore();return true;
  }
  if(floatKinds.has(e.kind)&&!art.animations?.[e.kind]){drawFloating(c,e,art.enemies[enemyCell[e.kind]],reduced);return true;}
  return false;
}

export function enemyFlightPose(e,reduced=false){
  const time=e.animTime??0,{anticipation,thrust}=enemyAttackPose(e);
  return {bank:reduced?0:clamp((e.vx??0)*e.direction/3500,-.06,.06)+Math.sin(time*1.8)*.014,
    hover:reduced||e.profile?.fly?0:Math.sin(time*2.8)*3-anticipation*2,
    cable:reduced?0:Math.sin(time*3.4)*.075-anticipation*.025,
    rotor:reduced?0:time*37,thrust,anticipation};
}
function imageAt(c,image){c.drawImage(image,-image.width/2,-image.height);}
function drawFloating(c,e,image,reduced){
  if(!image)return;const pose=enemyFlightPose(e,reduced),unit=e.profile.h/image.height;
  c.save();c.translate(e.x,e.y+pose.hover*entityScale(e));c.scale(e.direction*entityScale(e)*unit,entityScale(e)*unit);
  if(e.hp<=0){c.globalAlpha=Math.max(0,1-e.deadTime);c.rotate(-Math.min(Math.PI/2,e.deadTime*4));}
  else c.rotate(pose.bank);
  if(e.flash>0)c.globalAlpha=.65;
  if(e.kind==='archaeologist'){
    const cx=132-image.width/2,cy=23-image.height;
    // Preserve the outer rotor cage; only the interior blades spin.
    c.save();c.beginPath();c.rect(-image.width/2,-image.height,image.width,image.height);c.ellipse(cx,cy,79,17,0,0,Math.PI*2,true);c.clip('evenodd');imageAt(c,image);c.restore();
    c.save();c.beginPath();c.ellipse(cx,cy,79,17,0,0,Math.PI*2);c.clip();c.translate(cx,cy);c.scale(1,.215);c.rotate(pose.rotor);c.scale(1,1/.215);c.drawImage(image,-132,-23);c.restore();
  }else if(e.kind==='projector'){
    // Hanging cables swing about their attachment, with an overlap hidden by
    // the chassis. The suspended projector is not animated as a two-leg actor.
    c.save();c.translate(0,145-image.height);c.rotate(pose.cable);c.drawImage(image,0,145,image.width,image.height-145,-image.width/2,0,image.width,image.height-145);c.restore();
    c.drawImage(image,0,0,image.width,162,-image.width/2,-image.height,image.width,162);
  }else{
    if(e.kind==='aula'&&e.hp>0)c.globalAlpha*=.91+Math.sin((e.animTime??0)*4)*.05;
    imageAt(c,image);
  }
  c.restore();
}

// Painted, independent metal pieces include the surfaces hidden behind joints.
// A body cut from a flattened sprite would leave holes as soon as a limb moves.
function prepareWalker(spec){
  const part=index=>({image:spec.image,rect:spec.parts[index]});
  return {...spec,legs:spec.legs.map(leg=>({...leg,upperPart:part(leg.upperIndex),lowerPart:part(leg.lowerIndex)}))};
}

export function updateEnemyMechanicalFeet(e,dt){
  if(e.kind!=='vial')return;
  const s=190/264*entityScale(e),lane=e.lane??625,home=e.x+(119-142.5)*s*e.direction;
  let foot=e.tripodFoot;
  if(!foot||Math.abs((e.prevX??e.x)-(foot.lastX??e.x))>1e-5){foot=e.tripodFoot={x:home,lane,lift:0,support:true,startX:home,startLane:lane,targetX:home,targetLane:lane,lastX:e.x};}
  foot.prevX=foot.x;foot.prevLane=foot.lane;foot.prevLift=foot.lift;
  const walking=e.state==='walk'&&e.motion?.speed>0;
  if(walking){
    const q=((e.motion.phase??0)+.33)%1,duty=.4;
    if(foot.moveSign!==e.motion.moveSign&&!foot.support)foot.support=true;
    foot.moveSign=e.motion.moveSign;
    if(q>=duty){
      if(foot.support){foot.support=false;foot.startX=foot.x;foot.startLane=foot.lane;foot.startQ=q;
        const dx=e.x-(e.prevX??e.x),dz=lane-(e.prevLane??lane),distance=Math.hypot(dx,dz)||1;
        const cycleTravel=e.motion.phaseVelocity>1e-4?e.motion.speed/e.motion.phaseVelocity:e.motion.strideLength??60;
        foot.targetX=home+dx/distance*cycleTravel*(1-duty);foot.targetLane=lane+dz/distance*cycleTravel*(1-duty);
      }
      const t=clamp((q-(foot.startQ??duty))/(1-(foot.startQ??duty)),0,1),v=ease(t);foot.x=foot.startX+(foot.targetX-foot.startX)*v;foot.lane=foot.startLane+(foot.targetLane-foot.startLane)*v;foot.lift=Math.sin(t*Math.PI)*8*entityScale(e);
    }else{foot.support=true;foot.lift=0;}
  }else{
    const distance=Math.hypot(home-foot.x,lane-foot.lane);
    if(distance>.1){foot.support=false;foot.x+=(home-foot.x)*Math.min(1,dt*25);foot.lane+=(lane-foot.lane)*Math.min(1,dt*25);foot.lift=Math.min(3*entityScale(e),distance*.2);}
    else{foot.x=home;foot.lane=lane;foot.lift=0;foot.support=true;}
  }
  foot.lastX=e.x;
}
function solveLeg(hip,knee,toe,target,restHip=hip){
  const upper=Math.hypot(knee[0]-restHip[0],knee[1]-restHip[1]),lower=Math.hypot(toe[0]-knee[0],toe[1]-knee[1]);
  const dx=target[0]-hip[0],dy=target[1]-hip[1],d=Math.hypot(dx,dy)||1e-9,reach=clamp(d,Math.abs(upper-lower)+.001,upper+lower-.001);
  const along=clamp((upper*upper-lower*lower+reach*reach)/(2*reach),-upper,upper),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
  const sign=(knee[0]-restHip[0])*(toe[1]-knee[1])-(knee[1]-restHip[1])*(toe[0]-knee[0])>=0?-1:1;
  return {knee:[hip[0]+dx/d*along-dy/d*bend*sign,hip[1]+dy/d*along+dx/d*bend*sign],toe:[hip[0]+dx/d*reach,hip[1]+dy/d*reach],reachable:d<=upper+lower&&d>=Math.abs(upper-lower)};
}
function drawBone(c,piece,sourceA,sourceB,targetA,targetB){
  const turn=Math.atan2(targetB[1]-targetA[1],targetB[0]-targetA[0])-Math.atan2(sourceB[1]-sourceA[1],sourceB[0]-sourceA[0]);
  const scale=Math.hypot(targetB[0]-targetA[0],targetB[1]-targetA[1])/Math.hypot(sourceB[0]-sourceA[0],sourceB[1]-sourceA[1]);
  c.save();c.translate(...targetA);c.rotate(turn);c.scale(scale,scale);c.drawImage(piece.image,...piece.rect,-sourceA[0],-sourceA[1],piece.rect[2],piece.rect[3]);c.restore();
}
export function mechanicalWalkerPose(e,walker){
  const unit=walker.actorHeight/walker.height,moving=e.motion?.blend??0,phase=(e.motion?.phase??0)*Math.PI*2;
  let shift=Math.sin(phase)*moving*2,down=moving*((walker.legs.length===3?8:4)+Math.sin(phase*2)*1.5);
  const s=unit*entityScale(e),bind=RIG_BIND[e.kind];
  const targets=walker.legs.map(leg=>{
    let target;
    if(leg.side===2){const foot=e.tripodFoot,alpha=e._presentationAlpha??1;
      target=foot?[walker.width/2+((foot.prevX??foot.x)+(foot.x-(foot.prevX??foot.x))*alpha-e.x)*e.direction/s,
        leg.toe[1]+((foot.prevLane??foot.lane)+(foot.lane-(foot.prevLane??foot.lane))*alpha-(e.lane??625)-((foot.prevLift??foot.lift)+(foot.lift-(foot.prevLift??foot.lift))*alpha))/s]:[leg.toe[0]+shift,leg.toe[1]];
    }else{
      const foot=e.motion?.feet?.[leg.side],a=leg.side?9:5;
      const sourceHome=(bind.points[a][0]*walker.width-bind.axis)*unit;
      target=foot?[leg.toe[0]+((foot.x-e.x)*e.direction/entityScale(e)-sourceHome)/unit,leg.toe[1]+(foot.lane-(e.lane??625)-foot.lift)/s]:leg.toe;
    }
    return target;
  });
  // Share vertical load through the chassis before solving rigid limbs. These
  // machines must not inherit the torso shifts of a human two-leg skeleton.
  let lo=-Infinity,hi=Infinity;
  for(let i=0;i<walker.legs.length;i++){const leg=walker.legs[i],reach=Math.hypot(leg.knee[0]-leg.hip[0],leg.knee[1]-leg.hip[1])+Math.hypot(leg.toe[0]-leg.knee[0],leg.toe[1]-leg.knee[1])-.05;lo=Math.max(lo,targets[i][0]-leg.hip[0]-reach);hi=Math.min(hi,targets[i][0]-leg.hip[0]+reach);}
  if(lo<=hi)shift=clamp(shift,lo,hi);
  for(let i=0;i<walker.legs.length;i++){const leg=walker.legs[i],reach=Math.hypot(leg.knee[0]-leg.hip[0],leg.knee[1]-leg.hip[1])+Math.hypot(leg.toe[0]-leg.knee[0],leg.toe[1]-leg.knee[1])-.05,dx=targets[i][0]-leg.hip[0]-shift;down=Math.max(down,targets[i][1]-leg.hip[1]-Math.sqrt(Math.max(0,reach*reach-dx*dx)));}
  return {shift,down,legs:walker.legs.map((leg,i)=>{const hip=[leg.hip[0]+shift,leg.hip[1]+down],target=targets[i];return {hip,...solveLeg(hip,leg.knee,leg.toe,target,leg.hip),target};})};
}
function boneCorners(walker,index,sourceA,sourceB,targetA,targetB){
  const rect=walker.parts[index],angle=Math.atan2(targetB[1]-targetA[1],targetB[0]-targetA[0])-Math.atan2(sourceB[1]-sourceA[1],sourceB[0]-sourceA[0]);
  const scale=Math.hypot(targetB[0]-targetA[0],targetB[1]-targetA[1])/Math.hypot(sourceB[0]-sourceA[0],sourceB[1]-sourceA[1]),co=Math.cos(angle)*scale,si=Math.sin(angle)*scale;
  return [[0,0],[rect[2],0],[rect[2],rect[3]],[0,rect[3]]].map(([x,y])=>{x-=sourceA[0];y-=sourceA[1];return [targetA[0]+x*co-y*si,targetA[1]+x*si+y*co];});
}
export function mechanicalHurtboxes(e){
  const walker=STORY_MECHANICAL_WALKERS[e.kind];if(!walker||e.hp<=0||e.invincible>0)return [];
  const pose=mechanicalWalkerPose(e,walker),[x,y,w,h]=walker.body,corners=[[[x+pose.shift,y+pose.down],[x+w+pose.shift,y+h+pose.down]]];
  for(let i=0;i<walker.legs.length;i++){const leg=walker.legs[i],p=pose.legs[i];corners.push(boneCorners(walker,leg.upperIndex,...leg.upperJoints,p.hip,p.knee),boneCorners(walker,leg.lowerIndex,...leg.lowerJoints,p.knee,p.toe));}
  const s=walker.actorHeight/walker.height*entityScale(e);
  return corners.map(points=>{const xs=points.map(p=>e.x+(p[0]-walker.width/2)*e.direction*s),ys=points.map(p=>e.y+(p[1]-walker.height)*s);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};});
}
function drawWalker(c,e,walker){
  const pose=mechanicalWalkerPose(e,walker),s=walker.actorHeight/walker.height*entityScale(e);
  c.save();c.translate(e.x,e.y);c.scale(e.direction*s,s);c.translate(-walker.width/2,-walker.height);
  if(e.hp<=0){c.globalAlpha=Math.max(0,1-e.deadTime);c.translate(walker.width/2,walker.height);c.rotate(-Math.min(Math.PI/2,e.deadTime*4));c.translate(-walker.width/2,-walker.height);}
  if(e.flash>0)c.globalAlpha=.65;
  for(let i=0;i<walker.legs.length;i++){const leg=walker.legs[i],p=pose.legs[i];drawBone(c,leg.upperPart,...leg.upperJoints,p.hip,p.knee);drawBone(c,leg.lowerPart,...leg.lowerJoints,p.knee,p.toe);}
  const [x,y,w,h]=walker.body;c.drawImage(walker.image,...walker.parts[0],x+pose.shift,y+pose.down,w,h);c.restore();
}
