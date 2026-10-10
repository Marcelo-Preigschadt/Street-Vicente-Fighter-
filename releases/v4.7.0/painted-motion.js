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
 const p=reference,span=Math.max(8,p[10][0]-p[6][0]),weight=clamp((p[10][0]-x)/span,0,1),soleY=p[6][1]*weight+p[10][1]*(1-weight),amount=clamp((y-p[0][1])/(soleY-p[0][1]||1),0,1),q=pose.joints;
 const dx=(q[12]-p[6][0])*weight+(q[20]-p[10][0])*(1-weight),dy=(q[13]-p[6][1])*weight+(q[21]-p[10][1])*(1-weight);
 return [x+pose.shift*(1-amount)+dx*amount,y+pose.down*(1-amount)+dy*amount];
}
function contactWarpSafe(reference,pose){
 const p=reference,epsilon=.02;
 for(const weight of [.05,.25,.5,.75,.95])for(const height of [.2,.7,.99,1.01]){
  const x=p[6][0]*weight+p[10][0]*(1-weight),soleY=p[6][1]*weight+p[10][1]*(1-weight),y=p[0][1]+(soleY-p[0][1])*height;
  const a=paintedWarpPoint(p,pose,x,y),b=paintedWarpPoint(p,pose,x+epsilon,y),c=paintedWarpPoint(p,pose,x,y+epsilon);
  if(((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/epsilon**2<.025)return false;
 }
 const xs=[p[6][0]-25,p[6][0]-10,p[6][0],p[6][0]+10,(p[6][0]+p[10][0])/2,p[10][0]-10,p[10][0],p[10][0]+10,p[10][0]+25].sort((a,b)=>a-b),ys=[p[0][1],p[0][1]/2,p[6][1]-12,p[6][1],p[10][1]-12,p[10][1],Math.max(p[6][1],p[10][1])+5].sort((a,b)=>a-b);
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
  if(xs[i+1]-xs[i]<.01||ys[j+1]-ys[j]<.01)continue;
  const a=paintedWarpPoint(p,pose,xs[i],ys[j]),b=paintedWarpPoint(p,pose,xs[i+1],ys[j]),c=paintedWarpPoint(p,pose,xs[i+1],ys[j+1]),d=paintedWarpPoint(p,pose,xs[i],ys[j+1]);
  if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])<=0||(c[0]-a[0])*(d[1]-a[1])-(c[1]-a[1])*(d[0]-a[0])<=0)return false;
 }
 return true;
}
export function nativeMotionPose(f){
  if(f.storyEnemy)return null;
  if(f.footwork&&['marcelo','rafael','gustavo'].includes(f.character.id))return null;
  if(f.action||f.airborne||f.knocked||f.crouching||!['idle','walk','stepIn','stepBack'].includes(f.state))return null;
  if(!f.footwork&&!(f.walkBlend>.001))return null;
  const id=f.character.id,frames=PAINTED_MOTION[`${id}:motion`];
  if(!frames)return null;
  const g=GAITS[id],back=(f.motion?.moveSign??Math.sign(f.walkDistance))*f.direction<0;
  const phase=cycle((f.motion?.ready?f.motion.phase:f.walkDistance/(back?g.backStride:g.stride))*(back?-1:1));
  return {atlas:'motion',index:chooseNativeFrame(f,frames,phase)};
}
export function nativeEnemyMotionIndex(f,phase){
 const frames=ENEMY_MOTION[`${f.kind}:enemy`]?.slice(1,9);
 return 1+(frames?.length===8?chooseNativeFrame(f,frames,cycle(phase)):Math.floor(cycle(phase)*8));
}
function chooseNativeFrame(f,frames,phase){
  const wanted=Math.floor(phase*8)%8;
  if(!f.motion?.ready)return wanted;
  // Choose the nearest complete painted stance before applying a small contact
  // correction. This avoids stretching a single fixed guard through the cycle.
  const s=entityScale(f),width=f.character.visualWidth??1;
  let best=wanted,bestCost=Infinity;
  for(let index=0;index<frames.length;index++){
    const p=frames[index].points,feet=paintedFeet(f),footX=feet.map(foot=>(foot.x-f.x)*f.direction/(s*width));
    const delta=Math.min(cycle(index/8-phase),cycle(phase-index/8));
    const candidate=evaluatePaintedPose(f,frames[index]);
    const shift=candidate.shift;
    let cost=(delta*70)**2+(candidate.down*2.5)**2;
    if(!contactWarpSafe(p,candidate))cost+=100000;
    for(let side=0;side<2;side++){
      const foot=feet[side],sole=p[side?10:6];
      const y=(foot.lane-(f.lane??625)-foot.lift)/s;
      cost+=(footX[side]-sole[0]-shift)**2+(y-sole[1])**2;
    }
    if(cost<bestCost){bestCost=cost;best=index;}
  }
  return best;
}
export function paintedGeometry(f,pose){const data=f.storyEnemy?ENEMY_MOTION:PAINTED_MOTION,id=f.storyEnemy?f.kind:f.character.id;return data[`${id}:${pose.atlas}`]?.[pose.index]??null;}
export function preparedHurt(id,pose){
  return PAINTED_HURT[`${id}:${pose.atlas}:${pose.index}`]??PAINTED_HURT[`${id}:${pose.atlas}`]?.[pose.index]??(pose.atlas==='motion'?PAINTED_HURT[id]?.[pose.index]:null);
}

export function evaluatePaintedPose(f,geometry,out=new Float64Array(34)){
  if(!geometry||!f.motion?.ready)return null;
  const r=geometry.points,s=entityScale(f),width=f.character.visualWidth??1,m=f.motion,feet=paintedFeet(f);
  for(let i=0;i<17;i++){out[i*2]=r[i][0];out[i*2+1]=r[i][1];}
  const id=f.storyEnemy?f.kind:f.character.id,reference=f.storyEnemy?ENEMY_MOTION[`${id}:enemy`]?.[0]:PAINTED_MOTION[`${id}:style`]?.[0]??PAINTED_MOTION[`${id}:base`]?.[0];
  const center=reference?(reference.points[6][0]+reference.points[10][0])/2:(r[6][0]+r[10][0])/2;
  // A stable body axis across native frames avoids a horizontal pop when two
  // drawings have different cropped sole midpoints. The feet remain in world
  // coordinates and the complete art provides the body's authored movement.
  // The simulation already limits the center of mass's world velocity while
  // the free boot swings. Rendering uses that same interpolated shift.
  let shift=m.bodyShift??feet.reduce((sum,foot)=>sum+(foot.x-f.x)*f.direction/(s*width),0)/2-center,down=clamp(f.visualOffsetY??0,-3,4);
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
  const geometry=paintedGeometry(f,pose),p=evaluatePaintedPose(f,geometry)?.joints;
  if(!p)return null;
  const s=entityScale(f),sx=s*(f.character.visualWidth??1),dir=f.direction;
  const box=(x,y,w,h)=>({x:f.x+(dir>0?x:-x-w)*sx,y:f.y+y*s,w:w*sx,h:h*s});
  const headX=p[4],headY=p[5],neckY=p[3],pelvisY=p[1];
  const boxes=[box(headX-22,headY-28,44,54),box(Math.min(p[0],p[2])-32,neckY+10,64+Math.abs(p[0]-p[2]),pelvisY-neckY)];
  // Separate thigh and shin bounds. One rectangle around a bent leg contains
  // a large empty triangle and can make a locked projectile aim at empty air.
  for(const [a,b]of [[3,4],[4,5],[7,8],[8,9]]){
    const x=Math.min(p[a*2],p[b*2])-14,y=Math.min(p[a*2+1],p[b*2+1])-5;
    boxes.push(box(x,y,Math.abs(p[a*2]-p[b*2])+28,Math.abs(p[a*2+1]-p[b*2+1])+10));
  }
  for(const [shoulder,elbow,hand]of [[11,12,13],[14,15,16]]){
    const x=Math.min(p[shoulder*2],p[elbow*2],p[hand*2])-12,y=Math.min(p[shoulder*2+1],p[elbow*2+1],p[hand*2+1])-10;
    boxes.push(box(x,y,Math.max(p[shoulder*2],p[elbow*2],p[hand*2])-x+12,Math.max(p[shoulder*2+1],p[elbow*2+1],p[hand*2+1])-y+10));
  }
  return boxes;
}
