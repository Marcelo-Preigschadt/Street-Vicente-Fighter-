import { TECHNIQUE_HURT, TECHNIQUE_STRIKES } from './technique-data.js?v=19';

// Full drawings share their body axis with collision measurements. No limb warping.
export function techniqueRow(f) {
  const name = f.state, strength = f.moveData?.strength ?? 1;
  if (name === 'punch') return f.character.id === 'marcelo' && strength === 2 ? 3 : 0;
  if (name === 'kick') return strength === 2 && f.character.id !== 'marcelo' ? 3 : 1;
  if (name === 'crouchPunch') return 2;
  if (name === 'sweep') return 4;
  if (name === 'airKick') return 5;
  return null;
}
export function techniquePose(f) {
  if (f.state === 'hit') {
    const row = f.hitCrouched ? 3 : f.hitRegion === 'head' ? 1 : 2;
    const progress = Math.max(0,Math.min(1, (f.hitDuration - f.hitstun) / Math.max(.01, f.hitDuration)));
    return { atlas:'reaction', index:row * 4 + Math.min(3, Math.floor(progress * 4)) };
  }
  if (f.state === 'guardCounter') return { atlas:'reaction', index:f.movePhase === 'startup' ? 2 : f.movePhase === 'active' ? 3 : 0 };
  if(f.state==='crouch'||f.state==='lowBlock')return {atlas:'reaction',index:f.state==='crouch'?12:14};
  if (f.state === 'idle' && f.walkBlend <= 0 || f.state === 'block') return { atlas:'reaction', index:f.state === 'idle' ? Math.floor(f.animTime * 3) % 2 : 0 };
  const row = techniqueRow(f), m = f.moveData;
  if (row === null || !m) return null;
  const stage = f.actionTime < m.startup ? Number(f.actionTime >= m.startup * .45)
    : f.actionTime < m.startup + m.active ? 2 : 3;
  return { atlas:row >= 4 ? 'low' : 'strike', index:(row >= 4 ? row-4 : row) * 4 + stage };
}
export function techniqueHurt(id, atlas) { return TECHNIQUE_HURT[id]?.[atlas]; }
export function techniqueStrike(f) {
  if(!f.action)return null;
  if (f.action === 'guardCounter') return TECHNIQUE_STRIKES[f.character.id]?.guardCounter;
  const row = techniqueRow(f);
  return row === null ? null : TECHNIQUE_STRIKES[f.character.id]?.[row];
}
