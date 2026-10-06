import { JUDO_STRIKES } from './judo.js?v=24';
import { STYLE_HURT, STYLE_STRIKES } from './styles-data.js?v=24';
import { MUAY_THAI_STRIKES } from './muay-thai.js?v=24';
import { CAPOEIRA_STRIKES } from './capoeira.js?v=24';
import { techniqueStrike } from './technique.js?v=24';

const route = (name, ...steps) => ({ name, steps });
// Timings are arcade tuning in 60 Hz frames; techniques inform poses and routes.
export const FIGHTING_STYLES = Object.freeze({
  marcelo: {
    name: 'Kung Fu', summary: 'Punhos na linha central, retorno giratório, chutes frontais e rasteira.', step: 26,
    names: { punch: ['Punho rápido', 'Soco direto', 'Punho de retorno'], kick: ['Chute frontal rápido', 'Chute frontal', 'Chute frontal forte'],
      crouchPunch: ['Punho baixo rápido', 'Soco baixo', 'Soco baixo forte'], sweep: ['Rasteira rápida', 'Rasteira circular', 'Rasteira forte'],
      airPunch: ['Palma aérea rápida', 'Palma aérea', 'Palma aérea forte'], airKick: ['Chute voador rápido', 'Chute lateral voador', 'Chute voador forte'] },
    normals: { punch: [[4,3,8,42,19,90],[6,4,12,68,23,135],[9,4,18,94,26,150]],
      kick: [[6,4,12,50,20,120],[8,5,18,80,25,180],[11,5,23,110,28,260]] },
    combos: [route('Linha Central','punch:0','punch:1','kick:1'), route('Punho e Retorno','punch:1','punch:2','kick:1'),
      route('Dragão Baixo','crouchPunch:0','punch:1','kick:1'),
      route('Sequência do Dragão','punch:0','punch:1','punch:2','kick:1')],
  },
  rafael: {
    name: 'Boxe', summary: 'Jab, cruzado, gancho e uppercut. Só punhos.', step: 34,
    names: { punch: ['Jab', 'Cruzado', 'Cruzado forte'], kick: ['Gancho curto', 'Gancho', 'Uppercut'],
      crouchPunch: ['Jab no corpo', 'Direto no corpo', 'Direto forte no corpo'], sweep: ['Gancho baixo rápido', 'Gancho no corpo', 'Gancho forte no corpo'],
      airPunch: ['Jab aéreo', 'Cruzado aéreo', 'Cruzado aéreo forte'], airKick: ['Gancho aéreo curto', 'Overhand aéreo', 'Overhand aéreo forte'] },
    normals: { punch: [[3,3,7,38,19,80],[5,3,10,65,23,105],[8,4,16,90,25,155]],
      kick: [[5,3,10,46,19,100],[7,4,15,76,25,140],[9,4,21,104,30,300]],
      sweep: [[5,4,12,44,21,80],[7,4,16,68,25,110],[9,4,20,92,27,145]] },
    combos: [route('Um-dois','punch:0','punch:1'), route('Série de Boxe','punch:0','punch:1','kick:1','kick:2'),
      route('Cruzado e Gancho','punch:1','kick:1','kick:2'), route('Corpo e Cabeça','crouchPunch:0','kick:1','kick:2')],
  },
  gustavo: {
    name: 'Kickboxing', summary: 'Socos rápidos, chute circular e voadeira.', step: 24,
    names: { punch: ['Jab', 'Cruzado', 'Cruzado forte'], kick: ['Circular rápido', 'Chute circular', 'Circular forte'],
      crouchPunch: ['Jab baixo', 'Direto baixo', 'Direto baixo forte'], sweep: ['Low kick rápido', 'Low kick', 'Low kick forte'],
      airPunch: ['Jab aéreo', 'Cruzado aéreo', 'Cruzado aéreo forte'], airKick: ['Voadeira rápida', 'Chute lateral voador', 'Voadeira forte'] },
    normals: { punch: [[4,3,9,42,19,100],[6,4,12,66,23,145],[10,4,20,92,25,205]],
      kick: [[6,4,13,54,21,165],[9,5,19,86,26,230],[13,5,25,118,29,310]] },
    combos: [route('Um-dois e Circular','punch:0','punch:1','kick:1'), route('Quebra de Base','punch:1','sweep:1'),
      route('Final Circular','punch:0','punch:1','kick:2'),
      route('Troca de Altura','punch:0','punch:1','crouchPunch:0','kick:1')],
  },
  gelton: {name:'Capoeira',summary:'Ginga, esquiva, meia-lua, armada, rasteira e aú.',step:32,
    names:{punch:['Palma rápida','Palma de frente','Palma forte'],kick:['Meia-lua rápida','Meia-lua de frente','Armada'],
      crouchPunch:['Palma em negativa','Palma baixa','Palma baixa forte'],sweep:['Rasteira curta','Meia-lua de compasso','Rasteira giratória'],
      airPunch:['Palma aérea rápida','Palma aérea','Palma aérea forte'],airKick:['Aú rápido','Aú batido','Aú batido forte']},
    normals:{punch:[[4,3,9,40,19,90],[6,4,12,64,23,125],[10,4,19,92,25,180]],
      kick:[[6,4,13,52,21,145],[9,6,19,85,26,215],[13,7,25,116,29,300]],
      sweep:[[6,5,15,56,22,200],[9,6,21,85,26,280],[12,7,25,108,29,330]]},
    combos:[route('Ginga e Meia-lua','punch:0','punch:1','kick:1'),route('Volta do Mundo','punch:1','kick:1','kick:2'),
      route('Arte da Roda','crouchPunch:0','punch:1','kick:1'),route('Ritmo da Capoeira','punch:0','punch:1','kick:1','kick:2')]},
  marcelino:{name:'Muay Thai',summary:'Cotoveladas, chutes circulares, low kicks, joelhadas e clinch.',step:23,
    names:{punch:['Cotovelo rápido','Cotovelada horizontal','Cotovelada de torque'],kick:['Circular rápido','Chute circular','Circular pesado'],
      crouchPunch:['Soco baixo rápido','Soco no corpo','Soco baixo forte'],sweep:['Low kick rápido','Low kick','Low kick de ruptura'],
      airPunch:['Cotovelo aéreo rápido','Cotovelada aérea','Cotovelada aérea forte'],airKick:['Joelhada rápida','Joelhada voadora','Joelhada voadora forte']},
    normals:{punch:[[4,3,9,45,20,105],[6,4,13,72,24,155],[10,5,21,103,28,225]],
      kick:[[6,4,14,56,22,165],[9,5,20,89,27,230],[13,6,27,123,31,330]],
      sweep:[[5,4,13,48,21,115],[8,5,18,75,25,170],[12,6,25,108,29,280]]},
    combos:[route('Torque e Impulso','punch:0','punch:1','kick:1'),route('Quebra de Inércia','punch:1','sweep:1','kick:2'),
      route('Oito Armas','punch:0','punch:1','punch:2','kick:1')]},
  marcos:{name:'Judô',summary:'Pegadas de manga e gola, desequilíbrio, varridas de pé e projeções de ombro e quadril.',step:21,
    names:{punch:['Pegada rápida','Desequilíbrio de gola','Kuzushi forte'],kick:['De ashi barai curto','De ashi barai','De ashi barai forte'],
      crouchPunch:['Pegada baixa rápida','Pegada baixa','Kuzushi baixo'],sweep:['Varrida curta','Ko uchi gari','Ko uchi gari forte'],
      airPunch:['Pegada aérea curta','Pegada aérea','Pegada aérea forte'],airKick:['Varrida aérea curta','Varrida aérea','Varrida aérea forte']},
    normals:{punch:[[5,3,9,44,21,75],[7,4,13,67,25,105],[10,5,19,93,28,150]],
      kick:[[6,4,14,49,22,100],[9,5,20,79,27,160],[12,5,25,106,29,210]],
      sweep:[[6,4,14,51,23,110],[9,5,20,82,27,175],[13,5,26,109,30,230]]},
    combos:[route('Kuzushi e Varredura','punch:0','punch:1','kick:1'),route('Controle de Gola','crouchPunch:0','punch:1','kick:1'),
      route('Sequência do Judoca','punch:0','punch:1','punch:2','kick:1')]},

});

export function styleTechnique(id, name, strength = 1) {
  return FIGHTING_STYLES[id].names[name]?.[strength] ?? '';
}
export function stylePose(f, extended) {
  const pairs = { punch:[2,3], kick:[4,5], crouchPunch:[6,7], sweep:[8,9], airPunch:[10,11], airKick:[12,13], throw:[14,15] };
  const pair = pairs[f.state];
  if (pair) {
    let index = pair[Number(extended)];
    if (extended && f.character.id === 'marcelo' && f.state === 'punch' && f.moveData.strength === 2) index = 15;
    if (extended && f.character.id === 'rafael' && f.state === 'kick' && f.moveData.strength === 2) index = 15;
    return { atlas:'style', index };
  }
  if (f.state === 'idle' || f.state === 'block') return { atlas:'style', index:f.state === 'idle' ? Math.floor(f.animTime * 3) % 2 : 0 };
  return null;
}
export function styleStrike(f) {
  if(f.character.id==='marcos')return JUDO_STRIKES[f.action];
  if(f.character.id==='gelton')return CAPOEIRA_STRIKES[f.action];
  if(f.character.id==='marcelino')return MUAY_THAI_STRIKES[f.action];
  const technique = techniqueStrike(f);
  if (technique) return technique;
  const calibrated = STYLE_STRIKES[f.character.id];
  return calibrated?.[`${f.action}:${f.moveData?.strength}`] ?? calibrated?.[f.action] ?? f.character.strikes[f.action];
}
export function styleHurt(id) { return STYLE_HURT[id]; }

export function canStyleChain(f, move, strength, time) {
  if (!f.action || !f.actionHit || f.airborne || time - f.contactTime > .18 || !FIGHTING_STYLES[f.character.id].names[move]) return false;
  const path = [...f.chain, `${move}:${strength}`];
  return FIGHTING_STYLES[f.character.id].combos.some(c => path.length <= c.steps.length && path.every((step,i) => step === c.steps[i]));
}
export function completedStyleCombo(f) {
  return FIGHTING_STYLES[f.character.id].combos.find(c => c.steps.length === f.chain.length && c.steps.every((step,i) => step === f.chain[i]));
}
