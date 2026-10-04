import { STYLE_HURT, STYLE_STRIKES } from './styles-data.js?v=14';
import { techniqueStrike } from './technique.js?v=14';

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
