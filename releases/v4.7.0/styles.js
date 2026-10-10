import {SAVATE_STRIKES} from './savate.js';
import {MMA_STRIKES} from './mma.js';
import {KHAUANY_STRIKES} from './khauany.js';
import {DIENES_STRIKES} from './dienes.js';
import {KARATE_STRIKES} from './karate.js';
import {WILD_STRIKES} from './wild.js';
import { JUDO_STRIKES } from './judo.js';
import { STYLE_HURT, STYLE_STRIKES } from './styles-data.js';
import { MUAY_THAI_STRIKES } from './muay-thai.js';
import { CAPOEIRA_STRIKES } from './capoeira.js';
import { techniqueStrike } from './technique.js';

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

  joao:{name:'Luta Selvagem',summary:'Postura baixa, socos extensos, rasteiras, ataques em bola e eletricidade.',step:28,
    names:{punch:['Soco rápido','Soco selvagem','Soco pesado'],kick:['Chute curto','Chute selvagem','Chute pesado'],
      crouchPunch:['Jab baixo','Soco agachado','Soco baixo pesado'],sweep:['Rasteira curta','Rasteira selvagem','Rasteira pesada'],
      airPunch:['Soco aéreo curto','Soco aéreo','Soco aéreo pesado'],airKick:['Chute aéreo curto','Chute aéreo','Chute aéreo pesado']},
    normals:{punch:[[4,3,9,43,20,90],[6,4,13,69,24,130],[10,5,20,97,27,195]],
      kick:[[6,4,13,51,22,140],[8,5,18,81,26,200],[12,6,25,113,29,280]]},
    combos:[route('Recreio Selvagem','punch:0','punch:1','kick:1'),route('Pressão da 301','punch:0','punch:1','punch:2','kick:1')]},
  tais:{name:'Savate',summary:'Boxe francês: jab, direto, fouetté, chassé e coup de pied bas com contato do calçado.',step:28,
    names:{punch:['Jab','Direto','Direto forte'],kick:['Chassé curto','Chassé frontal','Chassé forte'],crouchPunch:['Jab no corpo','Direto no corpo','Direto baixo forte'],sweep:['Coup de pied bas curto','Coup de pied bas','Coup de pied bas forte'],airPunch:['Jab aéreo','Direto aéreo','Direto aéreo forte'],airKick:['Chassé aéreo curto','Chassé aéreo','Chassé aéreo forte']},
    normals:{punch:[[4,3,9,41,19,95],[6,4,12,66,23,145],[10,5,19,94,27,210]],kick:[[6,4,13,52,21,160],[9,5,18,84,25,230],[12,6,25,116,29,300]]},
    combos:[route('Ritmo de Aula','punch:0','punch:1','kick:1'),route('Circuito de Savate','punch:0','punch:1','punch:2','kick:1')]},
  luciana:{name:'MMA · Trocação',summary:'Jab, direto, cruzado, uppercut, joelhada e low kick; pressão de curta distância.',step:27,
    names:{punch:['Jab','Direto','Cruzado'],kick:['Low kick','Joelhada curta','Joelhada forte'],
      crouchPunch:['Jab no corpo','Direto no corpo','Cruzado no corpo'],sweep:['Low kick rápido','Low kick','Low kick forte'],
      airPunch:['Jab aéreo','Cruzado aéreo','Cruzado aéreo forte'],airKick:['Joelhada aérea','Joelhada voadora','Joelhada voadora forte']},
    normals:{punch:[[3,3,8,41,19,95],[5,4,11,68,23,145],[8,4,18,98,27,215]],
      kick:[[6,4,13,51,21,140],[8,5,18,82,26,195],[11,5,23,111,29,270]]},
    combos:[route('Frase de Impacto','punch:0','punch:1','punch:2','kick:1'),
      route('Concordância de Punhos','punch:0','punch:1','punch:2'),
      route('Frase Completa','punch:0','punch:1','kick:1'),
      route('¡Sin Pausa!','crouchPunch:0','punch:1','kick:1')]},
  khauany:{name:'MMA · Contra-ataque',summary:'Passos angulados, cotovelo de encontro, joelhada, chute baixo deslizante e garfos arremessados.',step:30,
    names:{punch:['Jab de interceptação','Cotovelo de encontro','Cruzado angulado'],kick:['Chute baixo rápido','Joelhada curta','Chute lateral alto'],
      crouchPunch:['Toque baixo','Direto baixo','Cruzado baixo'],sweep:['Varrida curta','Deslizamento baixo','Deslizamento forte'],
      airPunch:['Jab aéreo','Cotovelo aéreo','Cruzado aéreo'],airKick:['Joelhada aérea','Chute voador','Chute voador forte']},
    normals:{punch:[[4,3,9,42,20,95],[6,4,13,70,24,150],[9,4,20,98,28,220]],
      kick:[[6,4,14,51,22,150],[8,5,19,83,27,220],[11,5,24,112,30,275]],
      sweep:[[6,5,15,54,23,195],[9,5,20,84,27,270],[12,6,25,111,30,330]]},
    combos:[route('Corte de Ângulo','punch:0','punch:1','kick:1'),route('Resposta Rápida','crouchPunch:0','punch:1','kick:2'),
      route('Passo e Varrida','punch:0','kick:1','sweep:1')]},
  dienes:{name:'Muay Thai · Guarda Curta',summary:'Guarda compacta, checagem de perna, cotovelo curto e joelhada de clinch. Atira giz e livros.',step:25,
    names:{punch:['Jab curto','Cotovelo fechado','Cotovelo cruzado'],kick:['Chute baixo','Joelho de clinch','Chute circular'],
      crouchPunch:['Jab no corpo','Cotovelo baixo','Cotovelo forte'],sweep:['Corte na base','Chute baixo de encontro','Varrida curta'],
      airPunch:['Toque aéreo','Cotovelo aéreo','Cotovelo forte'],airKick:['Joelho aéreo','Joelho voador','Chute aéreo']},
    normals:{punch:[[4,3,9,42,20,98],[5,4,12,70,24,155],[8,4,18,101,28,215]],
      kick:[[5,4,13,54,22,150],[8,5,18,87,26,225],[11,5,24,113,29,295]],
      sweep:[[5,5,14,53,23,190],[8,5,20,83,26,265],[12,6,25,109,29,315]]},
    combos:[route('Guarda e Cotovelo','punch:0','punch:1','kick:1'),route('Chamada ao Quadro','crouchPunch:0','punch:1','kick:2'),
      route('Clinch da Aula','punch:0','kick:1','sweep:1')]},
  ruan:{name:'Karatê',summary:'Guarda firme, hikite, gyaku-zuki, mae-geri, yoko-geri e varreduras.',step:25,
    names:{punch:['Kizami-zuki','Gyaku-zuki','Oi-zuki'],kick:['Mae-geri curto','Mae-geri','Mae-geri forte'],
      crouchPunch:['Zuki baixo rápido','Gyaku-zuki baixo','Zuki baixo forte'],sweep:['Ashi-barai curto','Ashi-barai','Ashi-barai forte'],
      airPunch:['Zuki aéreo rápido','Zuki aéreo','Zuki aéreo forte'],airKick:['Yoko-geri aéreo curto','Yoko-geri aéreo','Yoko-geri aéreo forte']},
    normals:{punch:[[4,3,9,43,19,100],[6,4,12,68,23,150],[9,5,19,96,27,220]],
      kick:[[5,4,12,51,21,135],[8,5,17,82,25,200],[11,6,23,113,29,285]]},
    combos:[route('Kihon Elétrico','punch:0','punch:1','kick:1'),route('Kata do Trovão','punch:0','punch:1','punch:2','kick:1')]},

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
  if(f.character.id==='dienes')return DIENES_STRIKES[f.action];
  if(f.character.id==='khauany')return KHAUANY_STRIKES[f.action];
  if(f.character.id==='luciana')return MMA_STRIKES[f.action];
  if(f.character.id==='tais')return SAVATE_STRIKES[f.action];
  if(f.character.id==='ruan')return KARATE_STRIKES[f.action];
  if(f.character.id==='joao')return WILD_STRIKES[f.action];
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
