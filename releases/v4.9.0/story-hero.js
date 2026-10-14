import {Fighter,fighterPose} from './engine.js';
import {entityScale,scaledBox} from './story-world.js';
import {STORY_HERO_GEOMETRY} from './story-hero-geometry.js';

// A complete left/right walking cycle, in the same authored drawing plane as
// the actor. Combat's short guard steps remain unchanged in the versus engine.
export const STORY_WALK_STRIDE=250;
export const STORY_WALK_SPEED=.84;
const castPoses={
 marcelo:['base:12','base:13'],rafael:['base:12','base:13'],gustavo:['base:12','base:13'],
 gelton:['combat:13','combat:14'],marcelino:['base:13','base:13'],ruan:['base:12','base:13'],
 tais:['base:12','base:13'],luciana:['base:12','base:13'],khauany:['base:6','base:13'],
 dienes:['combat:11','combat:12']
};
export function storyHeroPose(f){
 const m=f.moveData;
 if(m&&(m.projectile||m.summon)&&['special','super','drone'].includes(f.state)){
  const id=f.character.id,poses=id==='dienes'&&f.state==='super'?['combat:13','combat:13']:castPoses[id];
  const count=m.waves??(m.projectile&&f.state==='super'?3:1);
  // Keep the release hand extended through every volley and its short follow
  // through, rather than firing subsequent waves from a guard/kick frame.
  if(poses&&f.actionTime<m.startup+(count-1)*.11+.14){
   const [atlas,index]=poses[Number(f.actionTime>=m.startup)].split(':');
   return {atlas,index:Number(index)};
  }
 }
 if(!f.action&&!f.airborne&&['walk','idle'].includes(f.state)&&(f.state==='walk'||f.walkBlend>.02)){
  if(f.motion?.blocked)return fighterPose({...f,state:'idle',walkBlend:0});
  const phase=f.walkDistance/(STORY_WALK_STRIDE*entityScale(f));
  const q=f.state==='idle'?Math.round(phase*2)/2:phase;
  return {atlas:'motion',index:Math.floor(((q%1+1)%1)*8)%8};
 }
 return fighterPose(f);
}
export function storyHeroGeometry(f,pose=storyHeroPose(f)){
 return STORY_HERO_GEOMETRY[f.character.id]?.[`${pose.atlas}:${pose.index}`];
}
export function storyHandSocket(f){
 const g=storyHeroGeometry(f),s=entityScale(f),width=f.character.visualWidth??1;
 const [x,y]=g?.hand??[f.character.projectile.offset/width,-f.character.projectile.height];
 return {x:f.x+f.direction*x*s*width,y:f.y+y*s,lane:f.lane??625};
}
export class StoryHero extends Fighter {
 get hurtboxes(){
  if(this.hp<=0||this.invincible>0)return [];
  const g=storyHeroGeometry(this);
  if(!g)return super.hurtboxes;
  const width=this.character.visualWidth??1;
  return g.hurt.map(([x,height,w,h])=>scaledBox(this,x*width,height,w*width,h));
 }
}

export function drawStoryHero(r,f,{effects=true}={}){
 const pose=storyHeroPose(f),base=r.sheets[f.character.id],sheet=pose.atlas==='base'?base:base?.[pose.atlas];
 if(!sheet)return;
 const frame=sheet.frames[pose.index],g=storyHeroGeometry(f,pose),scale=frame.scale??sheet.scale,s=entityScale(f),c=r.c;
 c.save();c.translate(f.x,f.y);c.scale(f.direction*s*(f.character.visualWidth??1),s);
 const x=(frame.x-(g?.anchor??frame.anchor))*scale,y=(frame.y-frame.bottom)*scale;
 const variant=f.blockFlash>0?'guard':f.flash>0?'flash':f.moveData&&['special','super','uppercut','drone'].includes(f.state)?'power':null;
 const bitmap=frame.effects?.[variant];
 c.imageSmoothingEnabled=true;c.shadowBlur=0;c.filter='none';
 if(bitmap)c.drawImage(bitmap.image,x-bitmap.padding,y-bitmap.padding);
 else c.drawImage(frame.image??frame.cutout,...(frame.rect??[0,0,frame.w,frame.h]),x,y,frame.w*scale,frame.h*scale);
 c.restore();
 if(!effects)return;
 if(f.state==='dizzy')r.drawDizzy(f);
 if(f.customTime>0)r.drawCustomAura(f);
 const m=f.moveData;if(!m||!['special','super','uppercut','drone'].includes(f.state))return;
 if(g?.handHidden)return;
 const hand=storyHandSocket(f),charge=Math.min(1,f.actionTime/Math.max(.001,m.startup));
 if(f.actionTime<m.startup){
  if(m.projectile){
   c.save();c.globalAlpha=.35+charge*.55;
   r.drawProjectile({x:hand.x,y:hand.y,direction:f.direction,character:f.character.id,
    radius:(3+charge*9)*s,wave:0,move:f.action,effect:m.effect});c.restore();
  }else if(m.summon){
   c.save();c.translate(hand.x,hand.y);c.scale(s,s);c.translate(-hand.x,-hand.y);
   r.drawPowerGlyph(hand.x,hand.y,4+charge*12,f.character.id,false);c.restore();
  }else{
   c.save();c.globalAlpha=.3+charge*.5;c.fillStyle=f.character.color;c.shadowColor=f.character.accent;c.shadowBlur=12*s;
   c.beginPath();c.ellipse(hand.x,hand.y,(3+charge*9)*s,(4+charge*10)*s,0,0,Math.PI*2);c.fill();c.restore();
  }
 }
 const after=f.actionTime-m.startup;
 if(after>=0&&after<.13){
  c.save();c.globalAlpha=(1-after/.13)*.8;c.strokeStyle=f.character.accent;c.lineWidth=2*s;
  c.beginPath();c.ellipse(hand.x,hand.y,(5+after*75)*s,(8+after*65)*s,0,0,Math.PI*2);c.stroke();c.restore();
 }
}
