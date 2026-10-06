import { CHARACTERS } from './engine.js';

export const PROTOCOL='svf-online-3-3-0';
export const MOVES=new Set(['punch','kick','special','uppercut','super','throw','custom','guardCounter','drone']);
const FLAGS=['left','right','jump','down','block'];
const ENGINE_FIELDS=['phase','phaseTime','paused','time','timer','round','roundWinner','freeze','nextDroneId'];
export function sanitizeInput(input={}) { return Object.fromEntries(FLAGS.map(k=>[k,input[k]===true])); }
export function validCharacter(id) { return typeof id==='string'&&Object.hasOwn(CHARACTERS,id); }
export function snapshot(engine,seq,events=[]) {
  return {seq,...Object.fromEntries(ENGINE_FIELDS.map(k=>[k,engine[k]])),
    fighters:engine.fighters.map(f=>Object.fromEntries(Object.entries(f).filter(([k])=>k!=='character'))),
    projectiles:engine.projectiles,drones:engine.drones,lasers:engine.lasers,events};
}
// Validate the initial shared state before enabling deterministic simulation.
export function applySnapshot(engine,s,lastSeq=0) {
  if(!s||!Number.isSafeInteger(s.seq)||s.seq<=lastSeq||!Array.isArray(s.fighters)||s.fighters.length!==2) return false;
  if(!['intro','fight','roundEnd','result'].includes(s.phase)||!Number.isFinite(s.timer)||s.timer<0||s.timer>90) return false;
  for(const f of s.fighters)if(!f||!['x','y','hp','meter','actionTime'].every(k=>Number.isFinite(f[k]))||Math.abs(f.x)>3000||Math.abs(f.y)>3000||f.hp<0||f.hp>1000||f.meter<0||f.meter>100) return false;
  if(!['projectiles','drones','lasers','events'].every(k=>Array.isArray(s[k])&&s[k].length<=256))return false;
  for(const k of ENGINE_FIELDS)engine[k]=s[k];
  s.fighters.forEach((data,i)=>{
    const f=engine.fighters[i],previous={x:f.x,y:f.y,walkDistance:f.walkDistance,walkBlend:f.walkBlend};
    // Only properties already belonging to a Fighter can cross the wire.
    for(const k of Object.keys(f))if(k!=='character'&&k!=='slot'&&Object.hasOwn(data,k))f[k]=data[k];
    f.prevX=previous.x;f.prevY=previous.y;f.prevWalkDistance=previous.walkDistance;f.prevWalkBlend=previous.walkBlend;
  });
  engine.projectiles=s.projectiles;engine.drones=s.drones;engine.lasers=s.lasers;
  return true;
}
