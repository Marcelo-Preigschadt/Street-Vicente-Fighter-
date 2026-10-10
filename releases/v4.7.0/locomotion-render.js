import {BONES,RIG_BIND,GAITS,referenceJoints,rigId} from './locomotion-data.js';
import {evaluateRig,usesRig} from './locomotion.js';
import {evaluatePaintedPose,paintedWarpPoint} from './painted-motion.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segmentDistance(x,y,a,b,p){
 const dx=p[b*2]-p[a*2],dy=p[b*2+1]-p[a*2+1],t=clamp(((x-p[a*2])*dx+(y-p[a*2+1])*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(x-p[a*2]-dx*t,y-p[a*2+1]-dy*t);
}
// A continuous skin of the existing artwork: no detached limbs, replacement face,
// opacity cross-fades or frame-dependent crop/pivot changes.
export function prepareLocomotionRig(id,sheet,selectedFrame=null,geometry=null){
 const bind=RIG_BIND[id];if(!bind)return null;
 const frame=selectedFrame??(bind.atlas==='base'?sheet:sheet[bind.atlas]).frames[bind.index];
 const w=frame.w??frame.rect[2],h=frame.h??frame.rect[3],image=document.createElement('canvas');image.width=w;image.height=h;
 const c=image.getContext('2d');c.drawImage(frame.image??frame.cutout,...(frame.rect??[0,0,w,h]),0,0,w,h);
 const pixels=c.getImageData(0,0,w,h).data,reference=geometry?new Float64Array(geometry.points.flat()):referenceJoints(id,new Float64Array(34)),scale=geometry?(frame.scale??sheet.scale):GAITS[id].height/h;
 const axis=geometry?frame.anchor-frame.x:bind.axis,bottom=geometry?frame.bottom-frame.y:h,headHeight=geometry?bottom+(geometry.headBottom/scale):0;
 const xs=Array.from({length:11},(_,i)=>i*w/10),ys=geometry?[0,...Array.from({length:18},(_,i)=>headHeight+i*(h-headHeight)/17)]:Array.from({length:19},(_,i)=>i*h/18);
 if(geometry)for(const toe of [6,10]){xs.push(clamp(reference[toe*2]/scale+axis,0,w));ys.push(clamp(reference[toe*2+1]/scale+bottom,headHeight,h));}
 const unique=v=>[...new Set(v.map(n=>Math.round(n*1000)/1000))].sort((a,b)=>a-b),xx=unique(xs),yy=unique(ys),cols=xx.length-1,rows=yy.length-1,vertices=[],triangles=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
  const sx=xx[x],sy=yy[y],px=(sx-axis)*scale,py=(sy-bottom)*scale;
  let candidates;
  const footDistances=[Math.hypot(px-reference[12],py-reference[13]),Math.hypot(px-reference[20],py-reference[21])];
  if(sy<=headHeight||sy<h*.205)candidates=[1];
  else if(geometry&&Math.min(...footDistances)<23)candidates=footDistances[0]<footDistances[1]?[5]:[9];
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
  const sampleX=clamp(Math.round(sx),0,w-1),sampleY=clamp(Math.round(sy),0,h-1);
  vertices.push({sx,sy,x:px,y:py,first,second,weight,transparent:pixels[(sampleY*w+sampleX)*4+3]<16,pinned:sy<=headHeight||geometry&&Math.min(...footDistances)<.1});
 }
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  if(geometry&&y===0)continue;
  const start=vertices[y*(cols+1)+x],end=vertices[(y+1)*(cols+1)+x+1];
  let visible=false;
  for(let py=Math.floor(start.sy);py<Math.ceil(end.sy)&&!visible;py+=2)
   for(let px=Math.floor(start.sx);px<Math.ceil(end.sx);px+=2)if(pixels[(py*w+px)*4+3]>16){visible=true;break;}
  if(!visible)continue;
  const i=y*(cols+1)+x;
  for(const triangle of [[i,i+1,i+cols+2],[i,i+cols+2,i+cols+1]]){
   const upper=triangle[1]===i+1;let ownsPixel=false;
   for(let py=Math.floor(start.sy);py<Math.ceil(end.sy)&&!ownsPixel;py++)for(let px=Math.floor(start.sx);px<Math.ceil(end.sx);px++){
    const tx=(px+.5-start.sx)/(end.sx-start.sx),ty=(py+.5-start.sy)/(end.sy-start.sy);
    if((upper?tx>=ty:tx<=ty)&&pixels[(py*w+px)*4+3]>16){ownsPixel=true;break;}
   }
   if(ownsPixel)triangles.push(triangle);
  }
 }
 // Keep the loaded immutable atlas as the texture. Repeated drawImage calls on
 // a mutable canvas otherwise force costly texture snapshots in Canvas engines.
 const rig={image:frame.image??frame.cutout,source:frame.rect??[0,0,w,h],width:w,height:h,reference,vertices,triangles,transforms:new Float64Array(BONES.length*6),positions:new Float64Array(vertices.length*2),joints:new Float64Array(34),geometry,headHeight,axis,bottom,scale};
 image.width=1;image.height=1;
 return rig;
}
export function deformLocomotionRig(rig,f){
 const painted=rig.geometry?evaluatePaintedPose(f,rig.geometry,rig.joints):null;
 const pose=painted?.joints??(rig.geometry?null:evaluateRig(f,rig.joints));if(!pose)return false;const p=rig.reference,t=rig.transforms;
 rig.rigid=painted?.rigid??false;rig.maxStretch=painted?.maxStretch??1;rig.headShiftX=painted?.shift??0;rig.headShiftY=painted?.down??0;
 for(let i=0;i<BONES.length;i++){
  const [a,b]=BONES[i],sx=p[b*2]-p[a*2],sy=p[b*2+1]-p[a*2+1],dx=pose[b*2]-pose[a*2],dy=pose[b*2+1]-pose[a*2+1];
  const length=Math.hypot(sx,sy)||1,dl=Math.hypot(dx,dy)||1,ux=sx/length,uy=sy/length,vx=dx/dl,vy=dy/dl,stretch=i===1?1:dl/length;
  const n=i*6;t[n]=vx*stretch*ux+vy*uy;t[n+1]=vy*stretch*ux-vx*uy;t[n+2]=vx*stretch*uy-vy*ux;t[n+3]=vy*stretch*uy+vx*ux;
  t[n+4]=pose[a*2]-t[n]*p[a*2]-t[n+2]*p[a*2+1];t[n+5]=pose[a*2+1]-t[n+1]*p[a*2]-t[n+3]*p[a*2+1];
 }
 for(let i=0;i<rig.vertices.length;i++){
  const v=rig.vertices[i],a=v.first*6,b=v.second*6,w=v.weight;
  if(rig.geometry){
   const target=paintedWarpPoint(rig.geometry.points,painted,v.x,v.y);
   rig.positions[i*2]=target[0];rig.positions[i*2+1]=target[1];
   continue;
  }
  rig.positions[i*2]=(t[a]*v.x+t[a+2]*v.y+t[a+4])*w+(t[b]*v.x+t[b+2]*v.y+t[b+4])*(1-w);
  rig.positions[i*2+1]=(t[a+1]*v.x+t[a+3]*v.y+t[a+5])*w+(t[b+1]*v.x+t[b+3]*v.y+t[b+5])*(1-w);
 }
 if(rig.geometry){
  // Regularize empty boundary vertices only. Painted body pixels, sole cages
  // and the face remain constrained; a failed mesh falls back to its complete
  // native frame instead of drawing an inverted piece of anatomy.
  const q=rig.positions,v=rig.vertices;
  for(let pass=0;pass<16;pass++){
   let changed=false;
   for(const tri of rig.triangles){
    const [a,b,c]=tri,source=(v[b].sx-v[a].sx)*(v[c].sy-v[a].sy)-(v[b].sy-v[a].sy)*(v[c].sx-v[a].sx),minimum=source*rig.scale**2*.01;
    const area=(q[b*2]-q[a*2])*(q[c*2+1]-q[a*2+1])-(q[b*2+1]-q[a*2+1])*(q[c*2]-q[a*2]);if(area>=minimum)continue;
    const at=tri.findIndex(i=>v[i].transparent&&!v[i].pinned);if(at<0)continue;
    const z=tri[at],u=tri[(at+1)%3],w=tri[(at+2)%3],dx=q[w*2]-q[u*2],dy=q[w*2+1]-q[u*2+1],factor=(minimum-area)/(dx*dx+dy*dy||1);
    q[z*2]-=dy*factor;q[z*2+1]+=dx*factor;changed=true;
   }
   if(!changed)break;
  }
  rig.safe=true;rig.minimumAreaRatio=Infinity;
  for(const [a,b,c]of rig.triangles){const source=(v[b].sx-v[a].sx)*(v[c].sy-v[a].sy)-(v[b].sy-v[a].sy)*(v[c].sx-v[a].sx),area=(q[b*2]-q[a*2])*(q[c*2+1]-q[a*2+1])-(q[b*2+1]-q[a*2+1])*(q[c*2]-q[a*2]),ratio=area/(source*rig.scale**2);rig.minimumAreaRatio=Math.min(rig.minimumAreaRatio,ratio);if(ratio<=0)rig.safe=false;}
 }
 return true;
}
export function drawLocomotionRig(c,f,rig){
 if(!rig||!usesRig(f)||!deformLocomotionRig(rig,f)||rig.safe===false)return false;
 if(rig.rigid){
  c.drawImage(rig.image,...rig.source,-rig.axis*rig.scale+rig.headShiftX,-rig.bottom*rig.scale+rig.headShiftY,rig.width*rig.scale,rig.height*rig.scale);
  return true;
 }
 if(rig.geometry){
  const [x,y,w]=rig.source;
  c.drawImage(rig.image,x,y,w,rig.headHeight,-rig.axis*rig.scale+rig.headShiftX,-rig.bottom*rig.scale+rig.headShiftY,w*rig.scale,rig.headHeight*rig.scale);
 }
 if(rig.geometry){
  // Composite the lower mesh at 2x before sampling it once. Adjacent clipped
  // triangles otherwise leave visible raster seams over opaque fabric.
  const q=rig.positions,xs=[],ys=[];for(let i=0;i<q.length;i+=2){xs.push(q[i]);ys.push(q[i+1]);}
  const left=Math.floor(Math.min(...xs))-2,top=Math.floor(Math.min(...ys))-2,w=Math.ceil(Math.max(...xs))-left+2,h=Math.ceil(Math.max(...ys))-top+2;
  rig.layer??=document.createElement('canvas');const layer=rig.layer;
  if(layer.width!==w*2||layer.height!==h*2){layer.width=w*2;layer.height=h*2;}
  const context=layer.getContext('2d');context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,layer.width,layer.height);context.setTransform(2,0,0,2,-left*2,-top*2);
  drawTriangles(context,rig,.18);c.drawImage(layer,left,top,w,h);return true;
 }
 drawTriangles(c,rig,.4);return true;
}
function drawTriangles(c,rig,overlap){
 const p=rig.positions,verts=rig.vertices;
 for(const triangle of rig.triangles){
  const [i,j,k]=triangle,a=verts[i],b=verts[j],d=verts[k],x1=p[i*2],y1=p[i*2+1],x2=p[j*2],y2=p[j*2+1],x3=p[k*2],y3=p[k*2+1];
  const u1=b.sx-a.sx,v1=b.sy-a.sy,u2=d.sx-a.sx,v2=d.sy-a.sy,den=u1*v2-u2*v1;
  const aa=((x2-x1)*v2-(x3-x1)*v1)/den,bb=((y2-y1)*v2-(y3-y1)*v1)/den,cc=((x3-x1)*u1-(x2-x1)*u2)/den,dd=((y3-y1)*u1-(y2-y1)*u2)/den;
  const cx=(x1+x2+x3)/3,cy=(y1+y2+y3)/3;
  // Half-pixel overlap closes antialias seams without changing the silhouette.
  const n1=overlap/(Math.hypot(x1-cx,y1-cy)||1),n2=overlap/(Math.hypot(x2-cx,y2-cy)||1),n3=overlap/(Math.hypot(x3-cx,y3-cy)||1);
  c.save();c.beginPath();c.moveTo(x1+(x1-cx)*n1,y1+(y1-cy)*n1);c.lineTo(x2+(x2-cx)*n2,y2+(y2-cy)*n2);c.lineTo(x3+(x3-cx)*n3,y3+(y3-cy)*n3);c.closePath();c.clip();
  c.transform(aa,bb,cc,dd,x1-aa*a.sx-cc*a.sy,y1-bb*a.sx-dd*a.sy);c.drawImage(rig.image,...rig.source,0,0,rig.width,rig.height);c.restore();
 }
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
