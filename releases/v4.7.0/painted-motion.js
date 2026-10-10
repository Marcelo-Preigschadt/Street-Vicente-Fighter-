import {PAINTED_MOTION} from './painted-motion-data.js';
import {PAINTED_HURT} from './painted-hurt-data.js';
import {GAITS} from './locomotion-data.js';
import {entityScale} from './story-world.js';
import {ENEMY_MOTION} from './enemy-motion-data.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cycle=v=>(v%1+1)%1;
// Landmarks describe the left/right silhouette in the painting; simulation
// feet retain their identity across a stride and can pass each other. Match
// by position before skinning, rather than crossing both painted legs.
const paintedFeet=f=>[...f.motion.feet].sort((a,b)=>(a.x-b.x)*f.direction);
export function paintedWarpPoint(reference,pose,x,y){
 if(pose.rigid)return [x+pose.shift,y+pose.down];
 const p=reference,span=p[10][0]-p[6][0],weight=clamp((p[10][0]-x)/(span||1),0,1),soleY=p[6][1]*weight+p[10][1]*(1-weight),amount=clamp((y-p[0][1])/(soleY-p[0][1]||1),0,1),q=pose.joints;
 const dx=(q[12]-p[6][0])*weight+(q[20]-p[10][0])*(1-weight),dy=(q[13]-p[6][1])*weight+(q[21]-p[10][1])*(1-weight);
 return [x+pose.shift*(1-amount)+dx*amount,y+pose.down*(1-amount)+dy*amount];
}
export function nativeMotionPose(f){
  if(f.storyEnemy||f.carry)return null;
  if(f.footwork&&['marcelo','rafael','gustavo'].includes(f.character.id))return null;
  if(f.action||f.airborne||f.knocked||f.crouching||!['idle','walk','stepIn','stepBack'].includes(f.state))return null;
  if(!f.footwork&&!(f.walkBlend>.001))return null;
  const id=f.character.id,frames=PAINTED_MOTION[`${id}:motion`];
  if(!frames)return null;
  const g=GAITS[id],back=(f.motion?.moveSign??Math.sign(f.walkDistance))*f.direction<0;
  const phase=cycle((f.motion?.ready?f.motion.phase:f.walkDistance/(back?g.backStride:g.stride))*(back?-1:1));
  return {atlas:'motion',index:f.motion?.paint?.index??Math.floor(phase*8)%8};
}
export function paintedGeometry(f,pose){const data=f.storyEnemy?ENEMY_MOTION:PAINTED_MOTION,id=f.storyEnemy?f.kind:f.character.id;return data[`${id}:${pose.atlas}`]?.[pose.index]??null;}
export function preparedHurt(id,pose){
  return PAINTED_HURT[`${id}:${pose.atlas}:${pose.index}`]??PAINTED_HURT[`${id}:${pose.atlas}`]?.[pose.index]??(pose.atlas==='motion'?PAINTED_HURT[id]?.[pose.index]:null);
}

export function evaluatePaintedPose(f,geometry,out=new Float64Array(34)){
  if(!geometry||!f.motion?.ready)return null;
  const r=geometry.points,s=entityScale(f),width=f.character.visualWidth??1,m=f.motion,feet=paintedFeet(f);
  if(m.paint&&PAINTED_MOTION[`${f.character.id}:motion`]?.[m.paint.index]===geometry){
    const shift=(m.paint.rootX-f.x)*f.direction/(s*width),down=(m.paint.rootLane-(f.lane??625))/s;
    for(let i=0;i<17;i++){out[i*2]=r[i][0]+shift;out[i*2+1]=r[i][1]+down;}
    return {joints:out,maxStretch:1,shift,down,rigid:true};
  }
  for(let i=0;i<17;i++){out[i*2]=r[i][0];out[i*2+1]=r[i][1];}
  const dx=feet.map((foot,i)=>(foot.x-f.x)*f.direction/(s*width)-r[i?10:6][0]);
  let shift=(dx[0]+dx[1])/2,down=clamp(f.visualOffsetY??0,-3,4);
  let lo=-Infinity,hi=Infinity;
  const legs=[[0,3,4,5,6],[1,7,8,9,10]];
  for(const [side,h,k,a,toe]of legs){
    const length=Math.hypot(r[k][0]-r[h][0],r[k][1]-r[h][1])+Math.hypot(r[a][0]-r[k][0],r[a][1]-r[k][1]);
    const foot=feet[side],x=(foot.x-f.x)*f.direction/(s*width)+r[a][0]-r[toe][0];
    lo=Math.max(lo,x-r[h][0]-length*.997);hi=Math.min(hi,x-r[h][0]+length*.997);
  }
  if(lo<=hi)shift=clamp(shift,lo,hi);
  for(const [side,h,k,a,toe]of legs){
    const foot=feet[side],x=(foot.x-f.x)*f.direction/(s*width)+r[a][0]-r[toe][0];
    const y=(foot.lane-(f.lane??625)-foot.lift)/s+r[a][1]-r[toe][1];
    const length=Math.hypot(r[k][0]-r[h][0],r[k][1]-r[h][1])+Math.hypot(r[a][0]-r[k][0],r[a][1]-r[k][1]);
    down=Math.max(down,y-r[h][1]-Math.sqrt(Math.max(0,(length*.997)**2-(x-r[h][0]-shift)**2)));
  }
  // Head/neck move together by translation. The face has no mesh stretch,
  // shear or rotation. Upper-body movement comes from the native drawings.
  for(let i=0;i<17;i++)if(![4,5,6,8,9,10].includes(i)){out[i*2]+=shift;out[i*2+1]+=down;}
  let maxStretch=1;
  for(const [side,h,k,a,toe]of legs){
    const foot=feet[side],x=(foot.x-f.x)*f.direction/(s*width),y=(foot.lane-(f.lane??625)-foot.lift)/s;
    const ax=x+r[a][0]-r[toe][0],ay=y+r[a][1]-r[toe][1];
    let upper=Math.hypot(r[k][0]-r[h][0],r[k][1]-r[h][1]),lower=Math.hypot(r[a][0]-r[k][0],r[a][1]-r[k][1]);
    const vx=ax-out[h*2],vy=ay-out[h*2+1],length=Math.hypot(vx,vy)||.001;
    const stretch=Math.max(1,length/(upper+lower-.01));maxStretch=Math.max(maxStretch,stretch);
    upper*=stretch;lower*=stretch;
    const along=clamp((upper*upper-lower*lower+length*length)/(2*length),0,upper),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
    const cross=(r[k][0]-r[h][0])*(r[a][1]-r[k][1])-(r[k][1]-r[h][1])*(r[a][0]-r[k][0]);
    const sign=cross>=0?-1:1;
    out[k*2]=out[h*2]+vx/length*along-vy/length*bend*sign;
    out[k*2+1]=out[h*2+1]+vy/length*along+vx/length*bend*sign;
    out[a*2]=ax;out[a*2+1]=ay;out[toe*2]=x;out[toe*2+1]=y;
  }
  return {joints:out,maxStretch,shift,down};
}
export function paintedHurtboxes(f,pose){
  const geometry=paintedGeometry(f,pose),evaluated=evaluatePaintedPose(f,geometry);
  if(!evaluated)return null;
  // Collision landmarks follow the same continuous mapping as the pixels,
  // rather than the auxiliary IK skeleton used only to constrain reach.
  const p=geometry.points.flatMap(point=>paintedWarpPoint(geometry.points,evaluated,...point));
  const s=entityScale(f),sx=s*(f.character.visualWidth??1),dir=f.direction;
  const box=(x,y,w,h)=>({x:f.x+(dir>0?x:-x-w)*sx,y:f.y+y*s,w:w*sx,h:h*s});
  const headX=p[4],headY=p[5],neckY=p[3],pelvisY=p[1];
  const boxes=[box(headX-22,headY-28,44,54),box(Math.min(p[0],p[2])-32,neckY+10,64+Math.abs(p[0]-p[2]),pelvisY-neckY)];
  for(const [h,k,a]of [[3,4,5],[7,8,9]]){
    const x=Math.min(p[h*2],p[k*2],p[a*2])-15,y=Math.min(p[h*2+1],p[k*2+1],p[a*2+1]);
    boxes.push(box(x,y,Math.max(p[h*2],p[k*2],p[a*2])-x+15,Math.max(p[h*2+1],p[k*2+1],p[a*2+1])-y+16));
  }
  for(const [shoulder,elbow,hand]of [[11,12,13],[14,15,16]]){
    const x=Math.min(p[shoulder*2],p[elbow*2],p[hand*2])-12,y=Math.min(p[shoulder*2+1],p[elbow*2+1],p[hand*2+1])-10;
    boxes.push(box(x,y,Math.max(p[shoulder*2],p[elbow*2],p[hand*2])-x+12,Math.max(p[shoulder*2+1],p[elbow*2+1],p[hand*2+1])-y+10));
  }
  return boxes;
}

// These contacts belong to the artwork actually drawn. Native full-body
// frames retain an authored sole while its contact is valid; no limb is warped
// to the independent carry rig's generic ankle targets.
export function renderedFeet(f){return f.motion?.paint?.contacts??f.motion?.feet??[];}
export function updatePaintedContacts(f){
 const m=f.motion,pose=nativeMotionPose({...f,motion:{...m,paint:null}});
 if(!pose){m.paint=null;return;}
 const geometry=PAINTED_MOTION[`${f.character.id}:motion`][pose.index],r=geometry.points,s=entityScale(f),width=f.character.visualWidth??1;
 const phase=cycle(m.phase*(m.moveSign*f.direction<0?-1:1));
 const soleY=[r[6][1],r[10][1]],side=Math.abs(soleY[0]-soleY[1])>5?(soleY[0]>soleY[1]?0:1):(phase<.5?0:1);
 const previous=m.paint,sx=s*width,worldSole=r[side?10:6][0]*f.direction*sx;
 let releasing=false,rootX=f.x,anchorX=f.x+worldSole,anchorLane=f.lane??625;
 if(previous){
  const dx=f.x-f.prevX,desired=previous.rootX+dx+clamp(f.prevX-previous.rootX,-6*sx,6*sx);
  const retained=previous.anchorX-worldSole;
  if(!previous.releasing&&previous.side===side&&Math.abs(retained-previous.rootX)<=8*sx&&Math.abs(retained-f.x)<=28*sx){
   rootX=retained;anchorX=previous.anchorX;anchorLane=previous.anchorLane;
  }else{
   rootX=desired;anchorX=rootX+worldSole;
   // A drawing that changes a planted leg more than its contact cage permits
   // releases that support before the new painting lands. No planted point is
   // dragged to accommodate a differently spaced or lifted source pose.
   releasing=!previous.releasing&&previous.side===side;
  }
 }
 const contactY=releasing?Math.max(...soleY):soleY[side];
 const rootLane=anchorLane-contactY*s;
 m.paint={index:pose.index,side,anchorX,anchorLane,rootX,rootLane,releasing,contacts:[0,1].map(i=>({x:rootX+r[i?10:6][0]*f.direction*sx,lane:anchorLane,lift:(contactY-r[i?10:6][1])*s,support:!releasing&&i===side}))};
}
