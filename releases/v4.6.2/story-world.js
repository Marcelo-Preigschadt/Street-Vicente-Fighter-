// A single metric governs actors, attack reach, physics, props and interactions.
// 294 reference pixels = 1.78 m; the campaign uses 116 px per visual metre.
export const STORY_WORLD=Object.freeze({pixelsPerMetre:116,adultMetres:1.78,actorScale:116*1.78/294,
 doorHeight:116*2.1,handleHeight:116*1.05,tableHeight:116*.76,chairHeight:116*.86,
 interactionReach:116*.85,pickupReach:116*.64,laneContact:28,viewWidth:1280,cameraLead:95});
export function entityScale(f){return f.worldScale??1;}
export function scaledBox(f,offset,height,w,h){const s=entityScale(f);return {x:f.x+(f.direction>0?offset:-offset-w)*s,y:f.y-height*s,w:w*s,h:h*s};}
export function boxForLane(box,entity){return {x:box.x,y:box.y+(entity.lane??625)-625,w:box.w,h:box.h};}
