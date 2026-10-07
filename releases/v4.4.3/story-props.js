// One world-space specification for render bounds and destructible collisions.
// Adult fighters stand approximately 300 px: 75 cm tables and 90 cm chair backs.
export const STORY_PROP_DIMENSIONS=Object.freeze({
  table:{width:270,height:150},chair:{width:110,height:170},
  soda:{width:157,height:285},shelf:{width:203,height:340},
  tank:{width:143,height:210},cabinet:{width:182,height:285},
  medkit:{width:56,height:42},can:{width:19,height:34}
});
export function storyPropBounds(p,floor=625){
  const size=STORY_PROP_DIMENSIONS[p.kind];
  return {x:p.x-size.width/2,y:floor-size.height,w:size.width,h:size.height};
}
