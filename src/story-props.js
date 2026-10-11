import {STORY_WORLD} from './story-world.js';
import {handSockets} from './locomotion.js';
import {carryBlend} from './carry-pose.js';
// The same metric dimensions are used by drawing, lifting and collisions.
export const STORY_PROP_DIMENSIONS=Object.freeze({
  table:{width:116*1.65,height:STORY_WORLD.tableHeight},chair:{width:116*.52,height:STORY_WORLD.chairHeight},
  soda:{width:116*.90,height:116*1.8},shelf:{width:116*1.2,height:116*2.05},
  tank:{width:116*.85,height:116*1.28},cabinet:{width:116*1.1,height:116*1.78},
  medkit:{width:39,height:29},can:{width:13,height:24}
});
export function storyPropBounds(p,floor=625){
  const size=STORY_PROP_DIMENSIONS[p.kind];
  return {x:p.x-size.width/2,y:floor-size.height,w:size.width,h:size.height};
}
// Grip points share the evaluated hand pose, including a mirrored stance.
const sockets={};
export function heldObjectTransform(f,kind=f.carry?.kind,out={}){
  const size=STORY_PROP_DIMENSIONS[kind],hands=handSockets(f,sockets);if(!size||!hands)return null;
  const midX=(hands.leftX+hands.rightX)/2,midY=(hands.leftY+hands.rightY)/2;
  const blend=carryBlend(f),pickup=Number.isFinite(f.carry?.originX)&&Number.isFinite(f.carry?.originY);
  const angle=Math.atan2((hands.rightY-hands.leftY)*f.direction,(hands.rightX-hands.leftX)*f.direction);
  out.angle=pickup?(blend===0?0:angle*blend):angle;
  out.facing=f.direction;out.gripSpan=Math.hypot(hands.rightX-hands.leftX,hands.rightY-hands.leftY);
  out.x=midX-size.height*.80*Math.sin(out.angle);out.y=midY+size.height*.80*Math.cos(out.angle);
  // The prop starts at its visible position on the floor. Its depth offset is
  // expressed in the hero's drawing plane, then disappears as pickup completes.
  // This smooths the object only; it does not invent a new authored carry pose.
  if(pickup&&blend<1){const originY=f.carry.originY+(f.carry.originLane??f.lane??625)-(f.lane??625);
    out.x=f.carry.originX+(out.x-f.carry.originX)*blend;out.y=originY+(out.y-originY)*blend;}
  out.centerX=out.x+size.height*.5*Math.sin(out.angle);out.centerY=out.y-size.height*.5*Math.cos(out.angle);
  return out;
}
export function thrownObjectBounds(p){
  const size=STORY_PROP_DIMENSIONS[p.kind],cos=Math.abs(Math.cos(p.angle)),sin=Math.abs(Math.sin(p.angle));
  const w=size.width*cos+size.height*sin,h=size.height*cos+size.width*sin;
  return {x:p.x-w/2,y:p.y-h/2,w,h};
}
export function carryStrikeBox(f){const held=heldObjectTransform(f);return held?thrownObjectBounds({kind:f.carry.kind,x:held.centerX,y:held.centerY,angle:held.angle}):null;}
