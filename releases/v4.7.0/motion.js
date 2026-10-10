import { MOTION_HURT } from './motion-data.js';

// Complete drawings, distance-driven footwork and committed burst steps.
// A step changes spacing; it never grants whole-body invulnerability.
export const FOOTWORK = Object.freeze({
  marcelo: { stride:160, advance:{distance:112,duration:14/60,cancelAt:5/60}, retreat:{distance:72,duration:16/60},
    counter: .20, range:[112,155], attackAdvance:{punch:[8,14,20],kick:[10,16,22],crouchPunch:[4,8,12],sweep:[4,6,8]} },
  rafael: { stride:128, advance:{distance:82,duration:11/60,cancelAt:4/60}, retreat:{distance:104,duration:13/60},
    counter: .34, range:[120,175], attackAdvance:{punch:[6,15,20],kick:[5,8,10],crouchPunch:[4,7,10],sweep:[3,5,7]} },
  gustavo: { stride:196, advance:{distance:126,duration:18/60,cancelAt:8/60}, retreat:{distance:116,duration:18/60},
    counter: .24, range:[185,245], attackAdvance:{punch:[6,10,16],kick:[8,12,18],crouchPunch:[3,6,9],sweep:[4,6,8]} },
  gelton:{stride:168,advance:{distance:120,duration:15/60,cancelAt:6/60},retreat:{distance:112,duration:16/60},
    counter:.28,range:[150,230],attackAdvance:{punch:[6,10,16],kick:[12,18,24],crouchPunch:[3,5,8],sweep:[6,10,14]}},
  marcelino:{stride:148,advance:{distance:104,duration:16/60,cancelAt:7/60},retreat:{distance:89,duration:17/60},
    counter:.23,range:[125,190],attackAdvance:{punch:[6,10,16],kick:[9,15,20],crouchPunch:[3,5,7],sweep:[4,7,11]}},
  marcos:{stride:154,advance:{distance:97,duration:17/60,cancelAt:7/60},retreat:{distance:91,duration:18/60},counter:.27,range:[105,155],attackAdvance:{punch:[7,11,15],kick:[6,10,13],crouchPunch:[3,6,9],sweep:[5,8,11]}},
  joao:{stride:144,advance:{distance:122,duration:15/60,cancelAt:6/60},retreat:{distance:102,duration:17/60},counter:.25,range:[135,205],attackAdvance:{punch:[6,10,15],kick:[8,12,18],crouchPunch:[3,5,8],sweep:[4,7,11]}},
  tais:{stride:170,advance:{distance:122,duration:15/60,cancelAt:6/60},retreat:{distance:108,duration:16/60},counter:.26,range:[155,230],attackAdvance:{punch:[6,11,17],kick:[10,17,24],crouchPunch:[3,5,8],sweep:[5,8,12]}},
  luciana:{stride:145,advance:{distance:104,duration:14/60,cancelAt:5/60},retreat:{distance:98,duration:15/60},counter:.28,range:[120,185],attackAdvance:{punch:[8,14,19],kick:[6,10,15],crouchPunch:[4,7,10],sweep:[4,7,10]}},
  khauany:{stride:160,advance:{distance:116,duration:15/60,cancelAt:6/60},retreat:{distance:112,duration:16/60},counter:.31,range:[135,205],attackAdvance:{punch:[8,13,19],kick:[7,12,18],crouchPunch:[4,7,10],sweep:[6,9,13]}},
  dienes:{stride:132,advance:{distance:99,duration:13/60,cancelAt:5/60},retreat:{distance:104,duration:14/60},counter:.36,range:[110,170],attackAdvance:{punch:[5,9,13],kick:[5,8,14],crouchPunch:[3,5,8],sweep:[4,7,10]}},
  ruan:{stride:156,advance:{distance:110,duration:14/60,cancelAt:5/60},retreat:{distance:96,duration:15/60},counter:.26,range:[125,205],attackAdvance:{punch:[7,12,18],kick:[10,16,22],crouchPunch:[3,5,8],sweep:[5,8,12]}},
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
