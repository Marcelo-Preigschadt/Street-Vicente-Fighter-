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
 const cols=10,rows=18,vertices=[],triangles=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
  const sx=x*w/cols,sy=y*h/rows,px=(sx-bind.axis)*scale,py=(sy-h)*scale;
  let candidates;
  if(sy<h*.205)candidates=[1];
  else if(sy>h*.925)candidates=px<(reference[10]+reference[18])*.5?[5]:[9];
  else if(sy>h*.59)candidates=px<reference[0]?[2,3,4,5]:[6,7,8,9];
  else {
   const middle=reference[0]+(reference[2]-reference[0])*Math.max(0,Math.min(1,(py-reference[1])/(reference[3]-reference[1])));
   const handDistance=Math.min(Math.hypot(px-reference[26],py-reference[27]),Math.hypot(px-reference[32],py-reference[33]));
   candidates=Math.abs(px-middle)<w*scale*.15&&handDistance>13?[0]:[0,10,11,12,13];
  }
  let first=candidates[0],second=first,d1=Infinity,d2=Infinity;
  for(const bone of candidates){const d=segmentDistance(px,py,...BONES[bone],reference);
   if(d<d1){d2=d1;second=first;d1=d;first=bone;}else if(d<d2){d2=d;second=bone;}
  }
  const weight=first===second?1:clamp((d2+2)/(d1+d2+4),.5,1);
  vertices.push({sx,sy,x:px,y:py,first,second,weight});
 }
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  let visible=false;
  for(let py=Math.floor(y*h/rows);py<Math.ceil((y+1)*h/rows)&&!visible;py+=3)
   for(let px=Math.floor(x*w/cols);px<Math.ceil((x+1)*w/cols);px+=3)if(pixels[(py*w+px)*4+3]>16){visible=true;break;}
  if(!visible)continue;
  const i=y*(cols+1)+x;triangles.push([i,i+1,i+cols+2],[i,i+cols+2,i+cols+1]);
 }
 // Keep the loaded immutable atlas as the texture. Repeated drawImage calls on
 // a mutable canvas otherwise force costly texture snapshots in Canvas engines.
 const rig={image:frame.image??frame.cutout,source:frame.rect??[0,0,w,h],width:w,height:h,reference,vertices,triangles,transforms:new Float64Array(BONES.length*6),positions:new Float64Array(vertices.length*2),joints:new Float64Array(34)};
 image.width=1;image.height=1;
 return rig;
}
function deform(rig,f){
 const pose=evaluateRig(f,rig.joints);if(!pose)return false;const p=rig.reference,t=rig.transforms;
 for(let i=0;i<BONES.length;i++){
  const [a,b]=BONES[i],sx=p[b*2]-p[a*2],sy=p[b*2+1]-p[a*2+1],dx=pose[b*2]-pose[a*2],dy=pose[b*2+1]-pose[a*2+1];
  const length=Math.hypot(sx,sy)||1,dl=Math.hypot(dx,dy)||1,ux=sx/length,uy=sy/length,vx=dx/dl,vy=dy/dl,stretch=i===1?1:dl/length;
  const n=i*6;t[n]=vx*stretch*ux+vy*uy;t[n+1]=vy*stretch*ux-vx*uy;t[n+2]=vx*stretch*uy-vy*ux;t[n+3]=vy*stretch*uy+vx*ux;
  t[n+4]=pose[a*2]-t[n]*p[a*2]-t[n+2]*p[a*2+1];t[n+5]=pose[a*2+1]-t[n+1]*p[a*2]-t[n+3]*p[a*2+1];
 }
 for(let i=0;i<rig.vertices.length;i++){
  const v=rig.vertices[i],a=v.first*6,b=v.second*6,w=v.weight;
  rig.positions[i*2]=(t[a]*v.x+t[a+2]*v.y+t[a+4])*w+(t[b]*v.x+t[b+2]*v.y+t[b+4])*(1-w);
  rig.positions[i*2+1]=(t[a+1]*v.x+t[a+3]*v.y+t[a+5])*w+(t[b+1]*v.x+t[b+3]*v.y+t[b+5])*(1-w);
 }
 return true;
}
export function drawLocomotionRig(c,f,rig){
 if(!rig||!usesRig(f)||!deform(rig,f))return false;
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
