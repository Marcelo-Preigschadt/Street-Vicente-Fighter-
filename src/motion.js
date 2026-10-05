import { MOTION_HURT } from './motion-data.js?v=16';

// Complete drawings, distance-driven footwork and committed burst steps.
// A step changes spacing; it never grants whole-body invulnerability.
export const FOOTWORK = Object.freeze({
  marcelo: { stride:160, advance:{distance:112,duration:14/60,cancelAt:5/60}, retreat:{distance:72,duration:16/60},
    counter: .20, range:[112,155], attackAdvance:{punch:[8,14,20],kick:[10,16,22],crouchPunch:[4,8,12],sweep:[4,6,8]} },
  rafael: { stride:128, advance:{distance:82,duration:11/60,cancelAt:4/60}, retreat:{distance:104,duration:13/60},
    counter: .34, range:[120,175], attackAdvance:{punch:[6,15,20],kick:[5,8,10],crouchPunch:[4,7,10],sweep:[3,5,7]} },
  gustavo: { stride:196, advance:{distance:126,duration:18/60,cancelAt:8/60}, retreat:{distance:116,duration:18/60},
    counter: .24, range:[185,245], attackAdvance:{punch:[6,10,16],kick:[8,12,18],crouchPunch:[3,6,9],sweep:[4,6,8]} },
});

export const DIZZY = Object.freeze({ threshold:65, minHits:3, duration:2.35, protection:4, decay:20, escapeInterval:.09, escapeAmount:.055 });

export function motionPose(f) {
  if (f.state === 'dizzy') return { atlas:'motion', index:12 + Math.floor(f.animTime * 7) % 4 };
  if (f.footwork) {
    const { kind,time,duration } = f.footwork;
    return { atlas:'motion', index:(kind === 'advance' ? 8 : 10) + Number(time >= duration * .42) };
  }
  if (['walk','idle'].includes(f.state) && f.walkBlend > 0) {
    const cycle = ((f.walkDistance / FOOTWORK[f.character.id].stride) % 1 + 1) % 1;
    return { atlas:'motion', index:Math.floor(cycle * 8) };
  }
  return null;
}

export function motionHurt(id) { return MOTION_HURT[id]; }

// Smooth velocity ramps, with an exact distance independent of display frame rate.
export function stepDistance(progress) {
  const t = Math.max(0,Math.min(1,progress));
  return t * t * (3 - 2 * t);
}
