import {BONES,RIG_BIND,GAITS,referenceJoints,rigId} from './locomotion-data.js';
import {evaluateRig,usesRig} from './locomotion.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segmentDistance(x,y,a,b,p){
 const dx=p[b*2]-p[a*2],dy=p[b*2+1]-p[a*2+1],t=clamp(((x-p[a*2])*dx+(y-p[a*2+1])*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(x-p[a*2]-dx*t,y-p[a*2+1]-dy*t);
}
// A continuous skin of the existing artwork: no detached limbs, replacement face,
// opacity cross-fades or frame-dependent crop/pivot changes.
export function prepareLocomotionRig(id,sheet,selectedFrame=null){
 const bind=RIG_BIND[id];if(!bind)return null;
 const frame=selectedFrame??(bind.atlas==='base'?sheet:sheet[bind.atlas]).frames[bind.index];
 const w=frame.w??frame.rect[2],h=frame.h??frame.rect[3],image=document.createElement('canvas');image.width=w;image.height=h;
 const c=image.getContext('2d');c.drawImage(frame.image??frame.cutout,...(frame.rect??[0,0,w,h]),0,0,w,h);
 const pixels=c.getImageData(0,0,w,h).data,reference=referenceJoints(id,new Float64Array(34)),scale=GAITS[id].height/h;
 const cols=16,headLimit=bind.points[1][1]-.012;
 const ys=[...new Set([...Array.from({length:29},(_,i)=>i/28),headLimit,.59,.925])].sort((a,b)=>a-b),rows=ys.length-1,vertices=[],triangles=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
  const sx=x*w/cols,sy=ys[y]*h,px=(sx-bind.axis)*scale,py=(sy-h)*scale;
  let candidates;
  // The whole head, including Joao's lower face, is one rigid region. Its
  // boundary follows the actor's neck instead of a universal atlas fraction.
  if(sy<=h*headLimit)candidates=[1];
  else if(sy>h*.925)candidates=px<(reference[10]+reference[18])*.5?[5]:[9];
  else if(sy>h*.59){
   // Each painted leg belongs to its own chain. Blending the opposite thigh
   // into the shin pulled trouser seams across the gap between the legs.
   const split=(reference[6]+reference[14])*.5;
   candidates=px<split?[2,3,4,5]:[6,7,8,9];
  }
  else candidates=[0,10,11,12,13];
  let first=candidates[0],second=first,d1=Infinity,d2=Infinity;
  for(const bone of candidates){const d=segmentDistance(px,py,...BONES[bone],reference);
   if(d<d1){d2=d1;second=first;d1=d;first=bone;}else if(d<d2){d2=d;second=bone;}
  }
  const weight=first===second?1:clamp(.5+((d2+2)/(d1+d2+4)-.5)*1.35,.5,1);
  // Smooth spatial weights do not cut a raised forearm out of the chest.
  // Nearest-two assignments jump where a third bone becomes the second.
  const sigma=GAITS[id].height*.043,weights=candidates.map(bone=>({bone,weight:Math.exp(-(segmentDistance(px,py,...BONES[bone],reference)**2)/(2*sigma*sigma))}));
  const total=weights.reduce((sum,b)=>sum+b.weight,0);
  if(total>1e-12)for(const b of weights)b.weight/=total;
  else{weights.length=0;weights.push({bone:first,weight:1});}
  vertices.push({sx,sy,x:px,y:py,first,second,weight:candidates.length===1?1:weight,weights});
 }
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  let visible=false;
  for(let py=Math.floor(ys[y]*h);py<Math.ceil(ys[y+1]*h)&&!visible;py+=3)
   for(let px=Math.floor(x*w/cols);px<Math.ceil((x+1)*w/cols);px+=3)if(pixels[(py*w+px)*4+3]>16){visible=true;break;}
  if(!visible)continue;
  const i=y*(cols+1)+x;triangles.push([i,i+1,i+cols+2],[i,i+cols+2,i+cols+1]);
 }
 // Keep the loaded immutable atlas as the texture. Repeated drawImage calls on
 // a mutable canvas otherwise force costly texture snapshots in Canvas engines.
 const rig={image:frame.image??frame.cutout,source:frame.rect??[0,0,w,h],width:w,height:h,reference,vertices,triangles,transforms:new Float64Array(BONES.length*9),positions:new Float64Array(vertices.length*2),joints:new Float64Array(34)};
 image.width=1;image.height=1;
 return rig;
}
export function deformRigPose(rig,pose){
 if(!pose)return false;const p=rig.reference,t=rig.transforms;
 for(let i=0;i<BONES.length;i++){
  const [a,b]=BONES[i],sx=p[b*2]-p[a*2],sy=p[b*2+1]-p[a*2+1],dx=pose[b*2]-pose[a*2],dy=pose[b*2+1]-pose[a*2+1];
  const length=Math.hypot(sx,sy)||1,dl=Math.hypot(dx,dy)||1,theta=Math.atan2(dy,dx)-Math.atan2(sy,sx),cw=Math.cos(theta/2),cz=Math.sin(theta/2),co=Math.cos(theta),si=Math.sin(theta);
  const tx=pose[a*2]-co*p[a*2]+si*p[a*2+1],ty=pose[a*2+1]-si*p[a*2]-co*p[a*2+1],n=i*9;
  t[n]=cw;t[n+1]=cz;t[n+2]=(tx*cw+ty*cz)/2;t[n+3]=(ty*cw-tx*cz)/2;
  t[n+4]=sx/length;t[n+5]=sy/length;t[n+6]=dx/dl;t[n+7]=dy/dl;t[n+8]=i===1?0:dl/length-1;
 }
 for(let i=0;i<rig.vertices.length;i++){
  const v=rig.vertices[i],a=v.first*9;let qw=0,qz=0,qx=0,qy=0;
  for(const {bone,weight}of v.weights){const b=bone*9,sign=t[a]*t[b]+t[a+1]*t[b+1]<0?-1:1;qw+=t[b]*weight*sign;qz+=t[b+1]*weight*sign;qx+=t[b+2]*weight*sign;qy+=t[b+3]*weight*sign;}
  const norm=Math.hypot(qw,qz)||1;qw/=norm;qz/=norm;qx/=norm;qy/=norm;
  const co=qw*qw-qz*qz,si=2*qw*qz;
  let x=co*v.x-si*v.y+2*(qx*qw-qy*qz),y=si*v.x+co*v.y+2*(qx*qz+qy*qw);
  // Blend rotations instead of two rotated positions. Linear position blends
  // collapse elbows and knees when carrying or turning a leg sharply.
  for(const {bone,weight}of v.weights){
   const n=bone*9,j=BONES[bone][0]*2,along=((v.x-p[j])*t[n+4]+(v.y-p[j+1])*t[n+5])*t[n+8]*weight;
   x+=along*t[n+6];y+=along*t[n+7];
  }
  rig.positions[i*2]=x;rig.positions[i*2+1]=y;
 }
 return true;
}
export function drawLocomotionRig(c,f,rig){
 if(!rig||!usesRig(f))return false;
 return drawRigPose(c,f,rig,evaluateRig(f,rig.joints));
}
export function drawRigPose(c,f,rig,joints){
 if(!rig||!deformRigPose(rig,joints))return false;
 const p=rig.positions,verts=rig.vertices;
 for(const triangle of rig.triangles){
  const [i,j,k]=triangle,a=verts[i],b=verts[j],d=verts[k],x1=p[i*2],y1=p[i*2+1],x2=p[j*2],y2=p[j*2+1],x3=p[k*2],y3=p[k*2+1];
  const u1=b.sx-a.sx,v1=b.sy-a.sy,u2=d.sx-a.sx,v2=d.sy-a.sy,den=u1*v2-u2*v1;
  const aa=((x2-x1)*v2-(x3-x1)*v1)/den,bb=((y2-y1)*v2-(y3-y1)*v1)/den,cc=((x3-x1)*u1-(x2-x1)*u2)/den,dd=((y3-y1)*u1-(y2-y1)*u2)/den;
  const cx=(x1+x2+x3)/3,cy=(y1+y2+y3)/3;
  // Half-pixel overlap closes antialias seams without changing the silhouette.
  const n1=.40/(Math.hypot(x1-cx,y1-cy)||1),n2=.40/(Math.hypot(x2-cx,y2-cy)||1),n3=.40/(Math.hypot(x3-cx,y3-cy)||1);
  c.save();c.beginPath();c.moveTo(x1+(x1-cx)*n1,y1+(y1-cy)*n1);c.lineTo(x2+(x2-cx)*n2,y2+(y2-cy)*n2);c.lineTo(x3+(x3-cx)*n3,y3+(y3-cy)*n3);c.closePath();c.clip();
  c.transform(aa,bb,cc,dd,x1-aa*a.sx-cc*a.sy,y1-bb*a.sx-dd*a.sy);c.drawImage(rig.image,...rig.source,0,0,rig.width,rig.height);c.restore();
 }
 return true;
}
export function interpolateFighter(f,alpha,out){
 const view=out??{motion:{feet:[{},{}]}};const motion=view.motion;Object.assign(view,f);view.motion=motion;
 Object.assign(motion,f.motion);motion.feet=view._feet??(view._feet=[{},{}]);
 view.x=f.prevX+(f.x-f.prevX)*alpha;view.y=f.prevY+(f.y-f.prevY)*alpha;view.lane=Number.isFinite(f.lane)?(f.prevLane??f.lane)+(f.lane-(f.prevLane??f.lane))*alpha:undefined;
 motion.phase=f.motion.prevPhase+(f.motion.phase-f.motion.prevPhase)*alpha;motion.blend=f.motion.prevBlend+(f.motion.blend-f.motion.prevBlend)*alpha;
 motion.bodyShift=f.motion.prevBodyShift+(f.motion.bodyShift-f.motion.prevBodyShift)*alpha;
 for(let i=0;i<2;i++){const foot=f.motion.feet[i],v=motion.feet[i];Object.assign(v,foot);v.x=foot.prevX+(foot.x-foot.prevX)*alpha;v.lane=foot.prevLane+(foot.lane-foot.prevLane)*alpha;v.lift=foot.prevLift+(foot.lift-foot.prevLift)*alpha;v.angle=foot.prevAngle+(foot.angle-foot.prevAngle)*alpha;}
 return view;
}
