// Spatial ownership for source sheets. Connectedness alone is not anatomy:
// separated hair, a hand or a shoe can still belong to the same painted pose.
export function ownedSilhouette(pixels,imageWidth,{x,y,w,h},cell,{seeds=[],alpha=95,minPixels=100}={}){
  const labels=new Int32Array(w*h),stack=new Int32Array(w*h),components=[];
  for(let start=0;start<labels.length;start++){
    if(labels[start]||pixels[((y+Math.floor(start/w))*imageWidth+x+start%w)*4+3]<alpha)continue;
    const id=components.length+1,members=[];let top=0,bx1=w,by1=h,bx2=0,by2=0,core=0;
    stack[top++]=start;labels[start]=id;
    while(top){
      const index=stack[--top],px=index%w,py=Math.floor(index/w),gx=x+px,gy=y+py;
      members.push(index);bx1=Math.min(bx1,px);bx2=Math.max(bx2,px);by1=Math.min(by1,py);by2=Math.max(by2,py);
      if(gx>=cell.x&&gx<cell.x+cell.w&&gy>=cell.y&&gy<cell.y+cell.h)core++;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy||px+dx<0||px+dx>=w||py+dy<0||py+dy>=h)continue;
        const next=index+dy*w+dx;
        if(!labels[next]&&pixels[((gy+dy)*imageWidth+gx+dx)*4+3]>=alpha){labels[next]=id;stack[top++]=next;}
      }
    }
    components.push({id,count:members.length,core,bx1,bx2,by1,by2,members});
  }
  const seedIds=new Set(seeds.map(([sx,sy])=>labels[(Math.round(sy)-y)*w+Math.round(sx)-x]).filter(Boolean));
  const main=components.reduce((best,c)=>!best||c.core>best.core?c:best,null);
  if(!main||main.core<minPixels)throw new Error('Sprite vazio. Verifique o atlas de personagens.');
  const selected=components.filter(c=>{
    if(c===main||seedIds.has(c.id))return true;
    const gap=Math.hypot(Math.max(0,main.bx1-c.bx2,c.bx1-main.bx2),Math.max(0,main.by1-c.by2,c.by1-main.by2));
    if(c.count>=4&&gap<=7&&c.core/c.count>.5)return true;
    // A substantial isolated part inside this cell is retained. Pixels beyond
    // its border require an explicit seed, preventing neighboring-pose leaks.
    return c.count>=36&&c.count<=main.count*.4&&c.core/c.count>.94;
  });
  const members=selected.flatMap(c=>c.members),mask=new Uint8Array(w*h);
  for(const index of members)mask[index]=1;
  return {count:members.length,members,mask,
    bx1:Math.min(...selected.map(c=>c.bx1)),by1:Math.min(...selected.map(c=>c.by1)),
    bx2:Math.max(...selected.map(c=>c.bx2)),by2:Math.max(...selected.map(c=>c.by2)),
    components:selected.map(({id,count,core})=>({id,count,core})),rejected:components.length-selected.length};
}
