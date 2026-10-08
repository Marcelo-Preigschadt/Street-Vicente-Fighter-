import {savatePose,savateHurt,SAVATE_STRIKES} from './savate.js';
import {initLocomotion,saveMotion,updateLocomotion,locomotionVelocity,usesRig,rigHurtboxes,rootCurve} from './locomotion.js';
import {entityScale,scaledBox} from './story-world.js';
import {karatePose,karateHurt,KARATE_STRIKES} from './karate.js';
import {wildPose,wildHurt,WILD_STRIKES} from './wild.js';
import { judoPose, judoHurt, JUDO_STRIKES } from './judo.js';
import { HURT_PROFILES } from './hitboxes.js';
import { techniquePose, techniqueHurt } from './technique.js';
import { FOOTWORK, DIZZY, motionPose, motionHurt, stepDistance } from './motion.js';
import { FIGHTING_STYLES, stylePose, styleStrike, styleHurt, styleTechnique, canStyleChain, completedStyleCombo } from './styles.js';
import { capoeiraPose, capoeiraHurt } from './capoeira.js';
import { muayThaiPose, muayThaiHurt } from './muay-thai.js';
import { SENTINEL, droneHitbox, sentinelRay } from './sentinel.js';
export { FIGHTING_STYLES } from './styles.js';
export { SENTINEL } from './sentinel.js';

export const WORLD = Object.freeze({ width: 1280, height: 720, floor: 625, gravity: 4320 });
export const FIXED_STEP = 1 / 120;
export const COMBAT = Object.freeze({ jumpVelocity: -1440, preJump: 3 / 60, inputBuffer: 6 / 60,
  landing: 4 / 60, emptyLanding: 2 / 60, superFreeze: 14 / 60, leftWall: 110, rightWall: 1170 });
export const CHEMISTRY = Object.freeze({ smokeDuration:1.9, smokeRadius:30 });
export const CHARACTERS = Object.freeze({
  marcelo: { id: 'marcelo', category:'teachers', name: 'Prof. Marcelo', quote: 'Bora NIT', color: '#b8ed68', accent: '#69daaa',
    speed: 324, backSpeed: 240, jumpSpeed: 600, power: 1.08, sprite: 'assets/marcelo.webp', combatSprite: 'assets/marcelo-combat.webp', walkSprite: 'assets/marcelo-walk.webp',
    powers: { special: 'Rajada de Código', uppercut: 'Firewall', super: 'Enxame de Drones', drone: 'Sentinela Automática' },
    powerQuotes: { special: 'Código na tela!', uppercut: 'Barreira digital ativada!', super: 'Bora NIT! Enxame de drones! Alvo marcado!', drone: 'Sentinela ativada!' },
    voiceDuration: { special: 1.84, uppercut: 2.40, super: 4.45, drone: 3.20 },
    strikes: { punch: { near: 42, reach: 155, height: 200, h: 32 }, kick: { near: 60, reach: 201, height: 251, h: 48 },
      crouchPunch: { near: 35, reach: 161, height: 140, h: 34 }, sweep: { near: 35, reach: 208, height: 49, h: 54 },
      airPunch: { near: 30, reach: 170, height: 188, h: 34 }, airKick: { near: 30, reach: 187, height: 128, h: 62 },
      uppercut: { near: -25, reach: 82, height: 297, h: 100 } }, projectile: { offset: 154, height: 199 } },
  rafael: { id: 'rafael', category:'teachers', name: 'Prof Rafael', quote: 'No meu tempo não era assim', color: '#ffa14c', accent: '#ffd08a',
    speed: 390, backSpeed: 348, jumpSpeed: 630, power: 1, sprite: 'assets/rafael.webp', combatSprite: 'assets/rafael-combat.webp', walkSprite: 'assets/rafael-walk.webp',
    powers: { special: 'Crônicas', uppercut: 'Linha do Tempo', super: 'Marcha dos Séculos' },
    powerQuotes: { special: 'Abram as crônicas!', uppercut: 'Viagem pela história!', super: 'No meu tempo não era assim! Marcha dos séculos!' },
    voiceDuration: { special: 2.40, uppercut: 3.12, super: 4.80 },
    strikes: { punch: { near: 42, reach: 153, height: 229, h: 28 }, kick: { near: 60, reach: 193, height: 238, h: 42 },
      crouchPunch: { near: 35, reach: 148, height: 119, h: 30 }, sweep: { near: 35, reach: 205, height: 52, h: 38 },
      airPunch: { near: 30, reach: 157, height: 145, h: 32 }, airKick: { near: 30, reach: 175, height: 110, h: 36 },
      uppercut: { near: -25, reach: 87, height: 303, h: 80 } }, projectile: { offset: 150, height: 214 } },
  gustavo: { id: 'gustavo', category:'teachers', name: 'Prof. Gustavo', quote: 'Reagiu, perdeu!', color: '#77dcf5', accent: '#b39bff',
    speed: 342, backSpeed: 312, jumpSpeed: 615, power: 1.04, sprite: 'assets/gustavo.webp', combatSprite: 'assets/gustavo-combat.webp', walkSprite: 'assets/gustavo-walk.webp',
    powers: { special: 'Névoa Atômica', uppercut: 'Reação Exotérmica', super: 'Reação em Cadeia' },
    powerQuotes: { special: 'Névoa atômica!', uppercut: 'Vai esquentar!', super: 'Reagiu, perdeu! Reação em cadeia!' },
    voiceDuration: {"special": 2.56, "uppercut": 1.73, "super": 3.19},
    strikes: {"punch": {"near": 42, "reach": 147, "height": 195, "h": 42}, "kick": {"near": 60, "reach": 192, "height": 241, "h": 77}, "crouchPunch": {"near": 35, "reach": 158, "height": 130, "h": 42}, "sweep": {"near": 35, "reach": 192, "height": 45, "h": 74}, "airPunch": {"near": 30, "reach": 147, "height": 168, "h": 41}, "airKick": {"near": 30, "reach": 176, "height": 115, "h": 75}, "uppercut": {"near": -25, "reach": 75, "height": 316, "h": 86}}, projectile: {"offset": 177, "height": 185} },
  gelton: {id:'gelton',category:'teachers',name:'Prof. Gelton',quote:'A arte está no movimento!',color:'#f5b75a',accent:'#ee7caf',
    speed:372,backSpeed:334,jumpSpeed:645,power:1.01,sprite:'assets/gelton-base-v1.webp',combatSprite:'assets/gelton-combat-v1.webp',superSprite:'assets/gelton-handstand-v2.webp',
    powers:{special:'Pincelada Cromática',uppercut:'Aú das Cores',super:'Roda das Artes'},
    powerQuotes:{special:'Olha a pincelada!',uppercut:'É o aú das cores!',super:'Bora pra roda! A arte tá no movimento!'},
    voiceDuration:{special:1.145,uppercut:1.177,super:2.738},
    strikes:{punch:{near:35,reach:158,height:218,h:42},kick:{near:48,reach:233,height:237,h:68},
      crouchPunch:{near:20,reach:146,height:118,h:46},sweep:{near:15,reach:237,height:54,h:66},
      airPunch:{near:25,reach:168,height:210,h:46},airKick:{near:35,reach:235,height:164,h:76},
      uppercut:{near:-35,reach:160,height:246,h:130}},projectile:{offset:158,height:205}},
  marcelino:{id:'marcelino',category:'teachers',name:'Prof. Marcelino',quote:'Toda ação tem reação!',color:'#9ef5ff',accent:'#f7ae63',
    speed:318,backSpeed:278,jumpSpeed:590,power:1.07,sprite:'assets/marcelino-base-v2.webp',combatSprite:'assets/marcelino-combat-v2.webp',
    powers:{special:'Impulso Linear',uppercut:'Joelhada Cinética',super:'Lei da Ação e Reação'},
    powerQuotes:{special:'Receba esse impulso!',uppercut:'Energia cinética!',super:'Toda ação tem reação! Agora aguenta!'},
    voiceDuration:{special:1.218,uppercut:1.437,super:2.923},
    strikes:{punch:{near:28,reach:118,height:225,h:58},kick:{near:45,reach:225,height:215,h:70},
      crouchPunch:{near:25,reach:145,height:118,h:44},sweep:{near:35,reach:193,height:110,h:58},
      airPunch:{near:20,reach:157,height:218,h:60},airKick:{near:22,reach:122,height:180,h:84},
      uppercut:{near:-24,reach:122,height:235,h:112}},projectile:{offset:142,height:205}},
  marcos:{id:'marcos',category:'teachers',name:'Prof. Marcos',quote:'Seu sistema vai pro chão!',color:'#8eb5ff',accent:'#c9dbff',
    speed:284,backSpeed:247,jumpSpeed:555,power:1.10,sprite:'assets/marcos-base-v1.webp',combatSprite:'assets/marcos-combat-v1.webp',
    powers:{special:'Sequestro de Sessão',uppercut:'Pilha Reversa',super:'Kernel Panic'},
    powerQuotes:{special:'Sua sessão acabou!',uppercut:'Acesso negado!',super:'Travou o sistema! Agora é chão!'},
    voiceDuration:{"special":2.816,"uppercut":1.699,"super":3.508},strikes:JUDO_STRIKES,projectile:{offset:130,height:200}},

  joao:{id:'joao',category:'students',classroom:'301',name:'João Machado',quote:'A 301 chegou!',color:'#c2ff60',accent:'#f7efad',
    speed:354,backSpeed:285,jumpSpeed:630,power:1.05,sprite:'assets/joao-base-v1.webp',combatSprite:'assets/joao-combat-v1.webp',
    powers:{special:'Super Soco',uppercut:'Rolamento Selvagem',super:'Curto-Circuito 301'},
    powerQuotes:{special:'Segura esse super soco!',uppercut:'Sai da frente!',super:'A trezentos e um chegou! Agora segura essa descarga!'},
    voiceDuration:{"special": 2.783, "uppercut": 2.16, "super": 4.719},strikes:WILD_STRIKES,projectile:{offset:210,height:190}},
  tais:{id:'tais',category:'teachers',name:'Prof. Tais',quote:'Hoje a aula é de movimento!',color:'#56e1d7',accent:'#ffd975',speed:378,backSpeed:315,jumpSpeed:650,power:1,sprite:'assets/tais-base-v1.webp',combatSprite:'assets/tais-combat-v1.webp',powers:{special:'Pulso Atlético',uppercut:'Salto Olímpico',super:'Circuito Campeão'},powerQuotes:{special:'Pulso atlético!',uppercut:'Salto olímpico!',super:'Até o último segundo! Circuito campeão!'},voiceDuration:{special:1.681,uppercut:1.723,super:3.355},strikes:SAVATE_STRIKES,projectile:{offset:215,height:185}},
  ruan:{id:'ruan',category:'students',name:'Aluno Ruan',quote:'Meu Karatê vai te dar um choque!',color:'#72e6ff',accent:'#b5a2ff',
    speed:360,backSpeed:300,jumpSpeed:625,power:1.03,sprite:'assets/ruan-base-v1.webp',combatSprite:'assets/ruan-combat-v1.webp',
    powers:{special:'Pulso de Choque',uppercut:'Punho de Trovão',super:'Kata da Tempestade'},
    powerQuotes:{special:'Pulso de choque!',uppercut:'Punho de trovão!',super:'Agora é a tempestade do Karatê!'},
    voiceDuration:{special:1.76,uppercut:2,super:2.32},strikes:KARATE_STRIKES,projectile:{offset:160,height:190}},

});

const frames = n => n / 60;
// Startup, active and recovery are gameplay frames at 60 Hz; physics runs at 120 Hz.
const NORMALS = {
  punch: [[4, 3, 9, 44, 17, 120], [6, 4, 12, 68, 19, 185], [10, 4, 20, 96, 24, 270]],
  kick: [[5, 4, 12, 50, 17, 155], [8, 5, 18, 80, 22, 245], [12, 5, 23, 112, 27, 330]],
  crouchPunch: [[4, 3, 8, 40, 17, 110], [6, 4, 12, 64, 19, 175], [9, 5, 19, 88, 23, 260]],
  sweep: [[5, 4, 16, 58, 21, 230], [7, 5, 20, 86, 26, 315], [9, 5, 24, 110, 29, 370]],
  airPunch: [[4, 12, 8, 48, 19, 155], [5, 14, 10, 72, 23, 225], [7, 16, 12, 98, 27, 290]],
  airKick: [[4, 14, 8, 54, 21, 185], [5, 18, 10, 86, 25, 265], [7, 19, 12, 114, 29, 340]],
};
function moveData(name, strength = 1, characterId = null) {
  strength = Math.max(0, Math.min(2, strength));
  if (NORMALS[name]) {
    const [startup, active, recovery, damage, stun, push] = FIGHTING_STYLES[characterId]?.normals[name]?.[strength] ?? NORMALS[name][strength];
    return { name, strength, startup: frames(startup), active: frames(active), recovery: frames(recovery), damage, stun: frames(stun),
      blockstun: frames(name === 'sweep' ? 10 + strength * 2 : Math.max(9, stun - 5)), push, meter: 5 + strength * 3, level: name === 'sweep' ? 'low' : name.startsWith('air') ? 'overhead' : 'mid',
      knockdown: name === 'sweep' && characterId !== 'rafael' && (characterId !== 'marcelino' || strength === 2) || characterId === 'rafael' && name === 'kick' && strength === 2,
      ...(characterId === 'rafael' && name === 'sweep' ? { level:'mid' } : {}),
      ...(characterId === 'rafael' && name === 'kick' && strength === 2 ? { launch:450 } : {}),
      technique: characterId ? styleTechnique(characterId,name,strength) : '',
      cancellable: name === 'punch' || name === 'crouchPunch' || (name === 'kick' && strength < 2) };
  }
  if(characterId==='tais'&&name==='special')return {name,strength,startup:frames(14),active:frames(1),recovery:frames(25),damage:90+strength*10,stun:frames(25),blockstun:frames(17),push:280,meter:8,level:'mid',projectile:true,chip:.08,speed:680+strength*100,effect:'athleticPulse',radius:24};
  if(characterId==='tais'&&name==='uppercut')return {name,strength,startup:frames(7),active:frames(14),recovery:frames(29),damage:112+strength*13,stun:frames(29),blockstun:frames(18),push:300,meter:9,level:'mid',knockdown:true,launch:760,invincibility:frames(7),jumpVelocity:-1020,travelSpeed:190,effect:'olympicJump'};
  if(characterId==='tais'&&name==='super')return {name,strength,startup:frames(11),active:frames(36),recovery:frames(30),damage:74,stun:frames(26),blockstun:frames(17),push:140,meter:0,level:'mid',projectile:true,waves:4,finalKnockdown:true,launch:470,chip:.08,speed:970,cost:100,invincibility:frames(9),effect:'athleticPulse',radius:27};
  if(characterId==='ruan'&&name==='special')return {name,strength,startup:frames(13),active:frames(1),recovery:frames(24),damage:88+strength*10,
    stun:frames(26),blockstun:frames(17),push:230,meter:7,level:'mid',projectile:true,chip:.08,speed:720+strength*80,effect:'karateLightning',radius:20};
  if(characterId==='ruan'&&name==='uppercut')return {name,strength,startup:frames(6),active:frames(15),recovery:frames(28),damage:115+strength*12,
    stun:frames(29),blockstun:frames(18),push:260,meter:9,level:'mid',knockdown:true,launch:660,invincibility:frames(7),jumpVelocity:-1000,travelSpeed:150,effect:'karateLightning'};
  if(characterId==='ruan'&&name==='super')return {name,strength,startup:frames(9),active:frames(28),recovery:frames(29),damage:99,
    stun:frames(27),blockstun:frames(18),push:140,meter:0,level:'mid',projectile:true,waves:3,finalKnockdown:true,launch:400,chip:.08,speed:1050,cost:100,invincibility:frames(9),effect:'karateLightning',radius:23};
  if(characterId==='joao'&&name==='special')return {name,strength,startup:frames(15),active:frames(7),recovery:frames(28),damage:132+strength*12,
    stun:frames(29),blockstun:frames(18),push:440,meter:9,level:'mid',advance:65,chip:.06,effect:'superPunch'};
  if(characterId==='joao'&&name==='uppercut')return {name,strength,startup:frames(8),active:frames(24),recovery:frames(30),damage:118+strength*12,
    stun:frames(30),blockstun:frames(20),push:300,meter:9,level:'mid',knockdown:true,launch:670,invincibility:frames(8),travelSpeed:540,jumpVelocity:-850,effect:'wildRoll'};
  if(characterId==='joao'&&name==='super')return {name,strength,startup:frames(13),active:frames(25),recovery:frames(38),damage:350,
    stun:frames(38),blockstun:frames(25),push:440,meter:0,level:'mid',knockdown:true,launch:420,cost:100,chip:.05,invincibility:frames(12),effect:'electric301'};
  if(characterId==='marcos'&&name==='special')return {name,strength,startup:frames(18),active:frames(5),recovery:frames(32),damage:150+strength*10,
    stun:frames(34),blockstun:0,push:360,meter:10,level:'throw',knockdown:true,launch:470,range:143,advance:86,effect:'sessionLock'};
  if(characterId==='marcos'&&name==='uppercut')return {name,strength,startup:frames(7),active:frames(10),recovery:frames(31),damage:118+strength*14,
    stun:frames(30),blockstun:frames(19),push:280,meter:9,level:'mid',knockdown:true,launch:720,invincibility:frames(8),grounded:true,effect:'reverseStack'};
  if(characterId==='marcos'&&name==='super')return {name,strength,startup:frames(10),active:frames(5),recovery:frames(44),damage:360,
    stun:frames(42),blockstun:0,push:410,meter:0,level:'throw',knockdown:true,launch:690,range:152,advance:105,cost:100,invincibility:frames(10),effect:'kernelPanic'};
  if(characterId==='marcos'&&name==='throw')return {name,strength,startup:frames(5),active:frames(3),recovery:frames(26),damage:150,
    stun:frames(34),blockstun:0,push:350,meter:10,level:'throw',knockdown:true,launch:570,range:143,technique:'Ippon seoi nage'};
  if (name === 'super' && characterId === 'marcelo') return {name,strength,startup:frames(12),active:frames(1),recovery:frames(48),
    damage:47,stun:frames(19),blockstun:frames(14),push:75,meter:0,level:'mid',chip:.08,cost:100,invincibility:frames(10),summon:true,swarm:true,effect:'sentinelLaser'};
  if (characterId==='gelton'&&name==='special')return {name,strength,startup:frames(14),active:frames(1),recovery:frames(23),damage:88+strength*10,
    stun:frames(25),blockstun:frames(17),push:240,meter:7,level:'mid',projectile:true,chip:.1,speed:510+strength*130,effect:'artPaint',radius:29};
  if (characterId==='gelton'&&name==='super')return {name,strength,startup:frames(10),active:frames(38),recovery:frames(24),damage:66,
    stun:frames(24),blockstun:frames(16),push:120,meter:0,level:'mid',projectile:true,chip:.08,speed:980,cost:100,invincibility:frames(10),effect:'artPaint',waves:5};
  if(characterId==='marcelino'&&name==='special')return {name,strength,startup:frames(15),active:frames(1),recovery:frames(25),damage:94+strength*10,
    stun:frames(26),blockstun:frames(18),push:390,meter:8,level:'mid',projectile:true,chip:.08,speed:640+strength*100,effect:'physicsImpulse',radius:27};
  if(characterId==='marcelino'&&name==='uppercut')return {name,strength,startup:frames(6),active:frames(14),recovery:frames(29),damage:114+strength*15,
    stun:frames(30),blockstun:frames(20),push:350,meter:10,level:'mid',knockdown:true,launch:870,invincibility:frames(7),effect:'kineticKnee'};
  if(characterId==='marcelino'&&name==='super')return {name,strength,startup:frames(11),active:frames(40),recovery:frames(27),damage:67,
    stun:frames(25),blockstun:frames(17),push:145,meter:0,level:'mid',projectile:true,chip:.08,speed:1080,cost:100,invincibility:frames(10),effect:'physicsImpulse',waves:5};
  if (name === 'special' && characterId === 'gustavo') return { name,strength,startup:frames(16),active:frames(1),recovery:frames(27),damage:48+strength*6,
    stun:frames(12),blockstun:frames(14),push:110,meter:6,level:'mid',projectile:true,chip:.08,speed:460+strength*100,
    radius:CHEMISTRY.smokeRadius,effect:'chemicalSmoke',dizzyDuration:CHEMISTRY.smokeDuration };
  if (name === 'special') return { name, strength, startup: frames(12), active: frames(1), recovery: frames(24), damage: 98 + strength * 12,
    stun: frames(26), blockstun: frames(18), push: 330, meter: 8, level: 'mid', projectile: true, chip: .1, speed: 460 + strength * 150 };
  if (name === 'uppercut') return { name, strength, startup: frames(5), active: frames(13), recovery: frames(28), damage: 105 + strength * 17,
    stun: frames(30), blockstun: frames(22), push: 420, meter: 10, level: 'mid', knockdown: true, launch: 890, invincibility: frames(8) };
  if (name === 'super') return { name, strength, startup: frames(8), active: frames(17), recovery: frames(30), damage: 85,
    stun: frames(26), blockstun: frames(18), push: 250, meter: 0, level: 'mid', projectile: true, chip: .1, speed: 860, cost: 100, invincibility: frames(10) };
  if (name === 'drone') return characterId && characterId !== 'marcelo' ? null : {
    name, strength:0, startup:frames(14), active:frames(1), recovery:frames(20),
    damage:30, stun:frames(14), blockstun:frames(10), push:100, meter:3,
    level:'mid', chip:0, summon:true, effect:'sentinelLaser' };
  if (name === 'throw') return { name, strength, startup: frames(5), active: frames(2), recovery: frames(23), damage: 130,
    stun: frames(30), blockstun: 0, push: 650, meter: 9, level: 'throw', knockdown: true, launch: 490 };
  if (name === 'guardCounter') return { name, strength:1, startup:frames(5), active:frames(5), recovery:frames(24), damage:65,
    stun:frames(25), blockstun:frames(12), push:450, meter:0, level:'mid', knockdown:true, launch:330, invincibility:frames(10) };
  return null;
}
export const MOVES = Object.freeze(Object.fromEntries([...Object.keys(NORMALS), 'special', 'uppercut', 'super', 'drone', 'throw', 'guardCounter'].map(name => [name, moveData(name)])));
export const ALPHA = Object.freeze({ customCost:50, customDuration:2.5, customLimit:8, guardCost:25 });
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const approach = (value, target, step) => value + clamp(target - value, -step, step);
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const idleInput = () => ({ left: false, right: false, down: false, jump: false, block: false });
const LEFT_WALL = COMBAT.leftWall, RIGHT_WALL = COMBAT.rightWall, BODY_WIDTH = 112;
const POWERS = new Set(['special', 'uppercut', 'super', 'drone']);

// The physical hurtboxes and the renderer select exactly the same animation pose.
export function fighterPose(f) {
  if(f.character.id==='tais')return savatePose(f);
  if(f.character.id==='ruan')return karatePose(f);
  if(f.character.id==='joao')return wildPose(f);
  if(f.character.id==='marcos')return judoPose(f);
  if(f.character.id==='gelton')return capoeiraPose(f);
  if(f.character.id==='marcelino')return muayThaiPose(f);
  const motion = motionPose(f);
  if (motion) return motion;
  const technique = techniquePose(f);
  if (technique) return technique;
  const m = f.moveData, extended = m && f.actionTime >= m.startup && f.actionTime < m.startup + m.active + .03;
  const styled = stylePose(f, extended);
  if (styled) return styled;
  const combat = { crouchPunch: extended ? 1 : 0, sweep: extended ? 3 : 2, airPunch: extended ? 5 : 4,
    airKick: extended ? 7 : 6, uppercut: f.actionTime >= (m?.startup ?? 0) ? 11 : 10,
    lowBlock: 9, wake: 13, throw: 14, landing: 15, preJump: 15 };
  if (f.state === 'hit' && f.hitCrouched && f.y >= WORLD.floor) return { atlas: 'combat', index: 9 };
  if (Object.hasOwn(combat, f.state)) return { atlas: 'combat', index: combat[f.state] };
  let index;
  switch (f.state) {
    case 'walk': index = 0; break;
    case 'jump': index = 4; break;
    case 'crouch': index = 5; break;
    case 'block': index = 10; break;
    case 'hit': index = 11; break;
    case 'victory': index = 14; break;
    case 'ko': case 'knockdown': index = 15; break;
    case 'punch': index = extended ? 7 : 6; break;
    case 'kick': index = extended ? 9 : 8; break;
    case 'drone': index = f.airborne ? 4 : m && f.actionTime >= m.startup ? 13 : 12; break;
    case 'special': case 'super': index = m && f.actionTime >= m.startup ? 13 : 12; break;
    default: index = Math.floor(f.animTime * 3) % 2;
  }
  return { atlas: 'base', index };
}

export class Fighter {
  constructor(id, slot) { this.character = CHARACTERS[id]; this.slot = slot; this.wins = 0; this.reset(); }
  reset(meter = 0) {
    const x = this.slot === 0 ? 360 : 920;
    Object.assign(this, { x, y: WORLD.floor, prevX: x, prevY: WORLD.floor, vx: 0, vy: 0, knockback: 0, direction: this.slot === 0 ? 1 : -1,
      hp: 1000, displayHP: 1000, meter, action: null, moveData: null, actionTime: 0, prevActionTime: 0, actionHit: false, contactTime: -10, shotsSent: 0,
      hitstun: 0, blockstun: 0, flash: 0, blockFlash: 0, combo: 0, comboTime: 0, lastAttacker: null, state: 'idle', input: idleInput(),
      buffer: null, jumpBuffer: 0, airAttackUsed: false, landing: 0, knocked: false, knockdownTime: 0, wakeTime: 0, invincible: 0,
      preJump: 0, jumpVelocityX: 0, recoilTime: 0, recoilDeceleration: 0, recoilSource: null, hitCrouched: false, throwInvincible: 0,
      animTime: 0, quoteTime: 0, walkTime: 0, walkDistance: 0, prevWalkDistance: 0, walkBlend: 0, prevWalkBlend: 0,
      directions: [], lastDirection: 5, powerName: '', powerQuote: '', blockLow: false, chain:[], comboName:'', comboNameTime:0 });
    Object.assign(this, { footwork:null, footworkCooldown:0, tapDirection:0, tapTime:-10, tapReleased:false, counterWindow:0,
      stunGauge:0, stunQuiet:0, dizzyPending:false, dizzyTime:0, dizzyProtection:0, escapeTime:-10 });
    Object.assign(this, { customTime:0, customMoves:0, hitDuration:0, hitRegion:'body', hitStrength:0, quickRise:false, quickRiseBuffer:0, quickRiseAllowed:true, knockdownLandedAt:-10 });
    Object.assign(this, { pendingDizzyDuration:0, pendingDizzyCause:null, dizzyCause:null });
    initLocomotion(this);
    this.attackPlant=null;
  }
  get airborne() { return this.y < WORLD.floor - .01; }
  get worldX(){return this.x;}set worldX(value){this.x=value;}
  get worldY(){return this.lane??this.y;}set worldY(value){if(this.lane!==undefined)this.lane=value;else this.y=value;}
  get feetX(){return this.x;}get feetY(){return this.lane??WORLD.floor;}
  get canAct() { return this.hp > 0 && this.state !== 'dizzy' && this.hitstun <= 0 && this.blockstun <= 0 && !this.action && !this.footwork && !this.dizzyPending && this.dizzyTime <= 0 && !this.knocked && this.wakeTime <= 0 && this.landing <= 0 && this.preJump <= 0; }
  get crouching() { return !this.airborne && (['crouch', 'crouchPunch', 'lowBlock', 'preJump', 'landing'].includes(this.state)
    || this.state === 'sweep' && ['rafael','gelton'].includes(this.character.id) || (this.state === 'hit' && this.hitCrouched)); }
  get movePhase() {
    if (!this.moveData) return null;
    return this.actionTime < this.moveData.startup ? 'startup' : this.actionTime < this.moveData.startup + this.moveData.active ? 'active' : 'recovery';
  }
  get pushbox() {
    if (this.hp <= 0 || (this.knocked && !this.airborne)) return null;
    const width = this.airborne ? 96 : BODY_WIDTH;
    const bottom = this.y - (this.airborne ? 70 : 0);
    const height = this.airborne ? 178 : this.state === 'sweep' && this.character.id === 'rafael' ? 146 : this.crouching ? 180 : 250;
    const s=entityScale(this);
    return { x: this.x - width*s / 2, y: this.y-(this.y-bottom+height)*s, w: width*s, h: height*s };
  }
  get guard() {
    const back = this.direction > 0 ? this.input.left && !this.input.right : this.input.right && !this.input.left;
    return { active: (back || this.input.block) && this.customTime <= 0 && !this.airborne && !this.action && !this.footwork && !this.dizzyPending && this.dizzyTime <= 0 && !this.knocked && this.wakeTime <= 0 && this.hitstun <= 0 && this.preJump <= 0,
      low: !!this.input.down, direction: this.direction };
  }
  get hurtboxes() {
    if (this.knocked || this.wakeTime > 0 || this.invincible > 0 || this.hp <= 0) return [];
    if(usesRig(this))return rigHurtboxes(this);
    const pose = fighterPose(this);
    const profile = this.character.id==='tais'?savateHurt(this):this.character.id==='ruan'?karateHurt(this):this.character.id==='joao'?wildHurt(this):this.character.id==='marcos'?judoHurt(this):this.character.id==='gelton'?capoeiraHurt(this):this.character.id==='marcelino'?muayThaiHurt(this):['strike','low','reaction'].includes(pose.atlas) ? techniqueHurt(this.character.id,pose.atlas)[pose.index] : pose.atlas === 'motion' ? motionHurt(this.character.id)[pose.index]
      : pose.atlas === 'style' ? styleHurt(this.character.id)[pose.index] : HURT_PROFILES[this.character.id][pose.atlas][pose.index];
    const body = profile.map(([offset, height, w, h]) => scaledBox(this,offset,height,w,h));
    // Extended arms and legs can be struck, including the first recovery frames.
    const strike = styleStrike(this);
    if (strike && this.actionTime >= this.moveData.startup && this.actionTime < this.moveData.startup + this.moveData.active + frames(2)) {
      const near = Math.max(40, strike.near), reach = strike.reach;
      if (reach > near) body.push(scaledBox(this,near,strike.height+strike.h/2,reach-near,strike.h));
    }
    return body;
  }
  get attackbox() {
    const strike = styleStrike(this);
    if (!strike || this.movePhase !== 'active') return null;
    return scaledBox(this,strike.near,strike.height+strike.h/2,strike.reach-strike.near,strike.h);
  }
}

export class FightEngine {
  constructor({ random = Math.random, onEvent = () => {} } = {}) {
    this.random = random; this.onEvent = onEvent; this.phase = 'selection'; this.paused = false; this.time = 0;
    this.fighters = [new Fighter('marcelo', 0), new Fighter('rafael', 1)]; this.projectiles = []; this.freeze = 0;
    this.drones = []; this.lasers = []; this.nextDroneId = 1;
    this.wallTransfers = [];
    this.ai = { timer: 0, input: idleInput(), actionTimer: 0 }; this.cpu = true;
  }
  event(type, data = {}) { this.onEvent({ type, ...data }); }
  start(id = 'marcelo', mode = 'cpu', opponentId = id === 'marcelo' ? 'rafael' : 'marcelo') {
    if (!Object.hasOwn(CHARACTERS, id) || !Object.hasOwn(CHARACTERS, opponentId) || (id === opponentId && mode !== 'online')) throw new RangeError('Escolha dois lutadores diferentes do elenco.');
    this.cpu = mode === 'cpu'; this.playerId = id; this.mode = mode;
    this.fighters = [new Fighter(id, 0), new Fighter(opponentId, 1)];
    this.round = 1; this.paused = false; this.ai = { timer: 0, input: idleInput(), actionTimer: 0 }; this.newRound();
  }
  newRound() {
    // Keep accumulated super charge for the match; start() creates fresh fighters.
    this.fighters.forEach(f => f.reset(f.meter)); this.projectiles = []; this.drones = []; this.lasers = []; this.nextDroneId = 1; this.freeze = 0; this.timer = 90;
    this.phase = 'intro'; this.phaseTime = 0; this.time = 0; this.roundWinner = null;
    this.event('round', { round: this.round });
  }
  setInput(slot, input) {
    const f = this.fighters[slot], next = { ...idleInput(), ...input };
    const previous = f.input;
    if (next.down && !previous.down && f.knocked) f.quickRiseBuffer = frames(8);
    if (next.jump && !f.input.jump && this.phase === 'fight' && !this.paused) f.jumpBuffer = .14;
    f.input = next;
    if (this.phase !== 'fight' || this.paused) return;
    const horizontal = (Number(next.right) - Number(next.left)) * f.direction;
    // Two presses separated by neutral. Diagonal power commands never trigger a step.
    if (next.down || next.jump || next.block) { f.tapDirection = 0; f.tapReleased = false; }
    else if (!next.left && !next.right) f.tapReleased = true;
    else if ((next.left !== previous.left || next.right !== previous.right) && horizontal) {
      if (f.tapReleased && f.tapDirection === horizontal && this.time - f.tapTime <= .23) {
        this.beginFootwork(f,horizontal > 0 ? 'advance' : 'retreat'); f.tapDirection = 0;
      } else { f.tapDirection = horizontal; f.tapTime = this.time; }
      f.tapReleased = false;
    }
    if (Object.keys(next).some(key => next[key] && !previous[key])) this.escapeDizzy(f);
    const vertical = next.down ? -1 : next.jump ? 1 : 0;
    const direction = vertical === -1 ? (horizontal < 0 ? 1 : horizontal > 0 ? 3 : 2)
      : vertical === 1 ? (horizontal < 0 ? 7 : horizontal > 0 ? 9 : 8) : horizontal < 0 ? 4 : horizontal > 0 ? 6 : 5;
    if (direction !== f.lastDirection) { f.directions.push({ direction, time: this.time }); f.lastDirection = direction; }
    f.directions = f.directions.filter(d => this.time - d.time <= .8);
  }
  motion(f, pattern, window = .42) {
    const history = f.directions.filter(d => d.direction !== 5 && this.time - d.time <= window);
    if (!history.length || this.time - history.at(-1).time > .16) return false;
    const tail = history.slice(-pattern.length);
    return tail.length === pattern.length && tail.every((d, i) => d.direction === pattern[i]);
  }
  queue(slot, move, strength = 1) {
    if (this.phase !== 'fight' || this.paused) return;
    const f = this.fighters[slot];
    if (f.dizzyTime > 0) { this.escapeDizzy(f); return; }
    if (move === 'custom') { this.startCustom(f); return; }
    if (move === 'guardCounter') { this.guardCounter(f); return; }
    if (!MOVES[move]) return;
    if (move === 'drone') { if(f.character.id!=='marcelo')return; move='super'; }
    if (move === 'punch' && f.character.id === 'marcelo' && this.motion(f, [2, 1, 4])) {
      move = 'super'; f.directions = []; f.lastDirection = 5;
    }
    if (move === 'punch') {
      if (f.meter >= 100 && this.motion(f, [2, 3, 6, 2, 3, 6], .75)) move = 'super';
      else if (this.motion(f, [6, 2, 3])) move = 'uppercut';
      else if (this.motion(f, [2, 3, 6]) || this.motion(f, [2, 6], .23)) move = 'special';
      if (POWERS.has(move)) { f.directions = []; f.lastDirection = 5; }
    }
    // Preserve a low attack even if down is released before the next simulation tick.
    if (['punch', 'kick'].includes(move) && f.input.down && !f.airborne && f.preJump <= 0 && f.jumpBuffer <= 0) move = move === 'punch' ? 'crouchPunch' : 'sweep';
    f.buffer = { move, strength, life: COMBAT.inputBuffer };
  }
  contextualMove(f, move) {
    if (move === 'punch') return f.airborne ? 'airPunch' : f.input.down ? 'crouchPunch' : 'punch';
    if (move === 'kick') return f.airborne ? 'airKick' : f.input.down ? 'sweep' : 'kick';
    return move;
  }
  beginMove(f, baseMove, strength = 1, cancel = false) {
    if(baseMove==='drone'){if(f.character.id!=='marcelo')return false;baseMove='super';}
    const move = this.contextualMove(f, baseMove), m = moveData(move, strength, f.character.id);
    if (!m || f.hp <= 0 || f.hitstun > 0 || f.blockstun > 0 || f.knocked || f.wakeTime > 0 || f.landing > 0 || f.preJump > 0 || f.dizzyPending || f.dizzyTime > 0 || f.state === 'dizzy' || (f.action && !cancel)) return false;
    if (f.footwork && (f.footwork.kind !== 'advance' || f.footwork.time < f.footwork.cancelAt - 1e-9)) return false;
    if (f.airborne && !move.startsWith('air') && !POWERS.has(move)) return false;
    if (!f.airborne && move.startsWith('air')) return false;
    if (!f.airborne && f.input.block && f.customTime <= 0 && move !== 'guardCounter') return false;
    if (move === 'guardCounter' && !f.guardCounterAuthorized) return false;
    if (f.customTime > 0 && (f.customMoves >= ALPHA.customLimit || ['throw','super'].includes(move))) return false;
    if (m.cost && f.meter < m.cost) return false;
    if (move === 'special' && this.projectiles.some(p => p.owner === f.slot && p.move === 'special' && p.life > 0)) return false;
    if (m.swarm && this.drones.some(d => d.owner === f.slot && !d.dead)) return false;
    if (move === 'drone') m.airborneDeployment = f.airborne;
    const normalChain = cancel && !!NORMALS[move];
    if (f.customTime > 0) { f.customMoves++; m.recovery = Math.max(frames(6), m.recovery * .55); m.meter = 0; }
    f.chain = NORMALS[move] ? normalChain ? [...f.chain, `${move}:${m.strength}`] : [`${move}:${m.strength}`] : [];
    if (normalChain) m.advance = FIGHTING_STYLES[f.character.id].step;
    else if (!f.airborne && (Number(f.input.right)-Number(f.input.left))*f.direction > 0)
      m.advance = FOOTWORK[f.character.id].attackAdvance[move]?.[m.strength] ?? m.advance ?? 0;
    f.footwork = null;
    if(!f.airborne&&(m.advance>0||f.motion.blend>0)){
      const foot=f.motion.feet.find(foot=>foot.support)??f.motion.feet[0];
      f.attackPlant={x:foot.x,lane:foot.lane};
    }else f.attackPlant=null;
    f.action = move; f.moveData = m; f.actionTime = 0; f.prevActionTime = 0; f.actionHit = false; f.contactTime = -10; f.shotsSent = 0; f.state = move; f.animTime = 0;
    if (f.airborne) f.airAttackUsed = true;
    else f.vx = 0;
    if (m.cost) f.meter -= m.cost;
    if (m.invincibility) f.invincible = m.invincibility;
    if (POWERS.has(move)) {
      f.powerName = f.character.powers[move];
      if (move === 'super') {
        this.freeze = Math.max(this.freeze, COMBAT.superFreeze);
        this.event('superStart', { fighter: f.slot, character: f.character.id, name: f.powerName,
          color: f.character.color, freeze: COMBAT.superFreeze });
      }
    } else this.event('swing', { move, strength, fighter: f.slot, technique:m.technique, style:FIGHTING_STYLES[f.character.id].name, chained:normalChain });
    return true;
  }
  startCustom(f) {
    if (!f.canAct || f.airborne || f.input.down || f.input.block || f.customTime > 0 || f.meter < ALPHA.customCost) return false;
    f.meter -= ALPHA.customCost; f.customTime = ALPHA.customDuration; f.customMoves = 0;
    f.chain = []; f.buffer = null; f.jumpBuffer = 0;
    this.event('customStart', { fighter:f.slot, character:f.character.id, color:f.character.color, x:f.x, y:f.y-160 });
    return true;
  }
  customCancel(f, move) {
    return f.customTime > 0 && f.customMoves < ALPHA.customLimit && f.action && !f.airborne && !['throw','super','guardCounter'].includes(move)
      && f.actionTime >= f.moveData.startup + frames(2) && !f.moveData.knockdown;
  }
  guardCounter(f) {
    if (f.blockstun <= 0 || f.hitstun > 0 || f.airborne || f.knocked || f.hp <= 0 || f.meter < ALPHA.guardCost) return false;
    f.blockstun = 0; f.buffer = null; f.jumpBuffer = 0;
    f.guardCounterAuthorized = true;
    const started = this.beginMove(f,'guardCounter',1);
    f.guardCounterAuthorized = false;
    if (started) { f.meter -= ALPHA.guardCost; this.event('guardCounter', { fighter:f.slot, x:f.x, y:f.y-190, character:f.character.id, color:f.character.color }); }
    return started;
  }
  beginFootwork(f, kind) {
    if (!f.canAct || f.customTime > 0 || f.airborne || f.input.down || f.input.block || f.footworkCooldown > 0) return false;
    const profile = FOOTWORK[f.character.id][kind];
    f.footwork = { ...profile, distance:profile.distance*entityScale(f),kind, time:0, sign:f.direction * (kind === 'advance' ? 1 : -1) };
    f.footworkCooldown = profile.duration + .10; f.buffer = null; f.jumpBuffer = 0; f.vx = 0;
    f.state = kind === 'advance' ? 'stepIn' : 'stepBack'; f.walkBlend = 0;
    this.event('footwork',{fighter:f.slot,character:f.character.id,kind}); return true;
  }
  escapeDizzy(f) {
    if (f.dizzyTime <= 0 || this.time - f.escapeTime < DIZZY.escapeInterval) return;
    f.escapeTime = this.time; f.dizzyTime = Math.max(0,f.dizzyTime-DIZZY.escapeAmount);
  }
  startDizzy(f) {
    f.dizzyPending = false; f.dizzyTime = f.pendingDizzyDuration || DIZZY.duration; f.stunGauge = 0;
    f.dizzyCause = f.pendingDizzyCause || 'combo'; f.pendingDizzyDuration = 0; f.pendingDizzyCause = null;
    f.state = 'dizzy'; f.animTime = 0; f.vx = 0; f.buffer = null; f.jumpBuffer = 0; f.footwork = null;
    f.tapDirection = 0; f.counterWindow = 0;
    this.event('dizzy',{fighter:f.slot,x:f.x,y:f.y-300,color:f.character.color,cause:f.dizzyCause});
  }
  finishDizzy(f) {
    f.dizzyTime = 0; f.dizzyPending = false; f.stunGauge = 0; f.dizzyProtection = DIZZY.protection;
    f.pendingDizzyDuration = 0; f.pendingDizzyCause = null; f.dizzyCause = null;
    f.buffer = null; f.jumpBuffer = 0; f.state = 'idle';
  }
  updateAI(dt) {
    const ai = this.ai, f = this.fighters[1], foe = this.fighters[0]; ai.timer -= dt; ai.actionTimer -= dt;
    if (f.dizzyTime > 0) { this.escapeDizzy(f); this.setInput(1,idleInput()); return; }
    // CPU follows the same bounded, contact-confirmed routes as a human player.
    if (f.actionHit && !f.airborne && this.time - f.contactTime <= .18) {
      const routes = FIGHTING_STYLES[f.character.id].combos.filter(c => c.steps.length > f.chain.length && f.chain.every((s,i) => s === c.steps[i]));
      if (ai.comboContact !== f.contactTime) {
        ai.comboContact = f.contactTime;
        if (f.chain.length === 1) ai.comboPlan = (this.random() < .65 ? routes.toSorted((a,b)=>b.steps.length-a.steps.length) : routes)[0]?.name;
      }
      const route = routes.find(c=>c.name === ai.comboPlan) ?? routes[0];
      if (route && this.random() < .8) {
        const [move,strength] = route.steps[f.chain.length].split(':');
        ai.input = { ...idleInput(), down:move === 'sweep' || move === 'crouchPunch' };
        this.setInput(1,ai.input); this.queue(1,move,Number(strength)); ai.actionTimer = .35; return;
      }
    }
    if (ai.timer > 0) { this.setInput(1, ai.input); return; }
    ai.timer = .11 + this.random() * .13;
    const dist = Math.abs(f.x - foe.x), toward = Math.sign(foe.x - f.x), id = f.character.id;
    const [near,far] = FOOTWORK[id].range;
    const threat = foe.action && dist < 260, incoming = this.projectiles.some(p => p.owner !== f.slot && Math.abs(p.x - f.x) < 310)
      || this.drones.some(d => d.owner !== f.slot && !d.dead && !d.fired && d.age >= SENTINEL.delay - .45
        && (f.x - d.x) * d.direction > 0 && Math.abs(d.y - (f.y - 145)) < 150);
    const hasDrone = this.drones.some(d => d.owner === f.slot && !d.dead);
    ai.input = idleInput();
    // Boxing retreats into counters; kung fu closes; kickboxing protects kicking distance.
    if (f.blockstun > 0 && f.meter >= ALPHA.guardCost && dist < 180 && this.random() < .18) { this.guardCounter(f); return; }
    if (threat && f.canAct && !foe.airborne && !incoming && this.random() < (id === 'rafael' ? .6 : id === 'gustavo' ? .3 : .12)) {
      this.setInput(1,ai.input); if (this.beginFootwork(f,'retreat')) { ai.timer = .12; return; }
    }
    if ((threat || incoming) && this.random() < .65) { ai.input.block = true; ai.input.down = foe.action === 'sweep' && foe.character.id !== 'rafael'; }
    else if (dist > far || foe.dizzyTime > 0 && dist > 130) { ai.input.left = toward < 0; ai.input.right = toward > 0; }
    else if (dist < near && id !== 'marcelo') { ai.input.left = toward > 0; ai.input.right = toward < 0; }
    else if (id === 'rafael' && this.random() < .22) { ai.input.left = toward > 0; ai.input.right = toward < 0; }
    if (incoming && !ai.input.block && this.random() < .6) ai.input.jump = true;
    if (dist > 240 && dist < 480 && !incoming && this.random() < (id === 'gustavo' ? .2 : id === 'rafael' ? .02 : .07)) ai.input.jump = true;
    if (!ai.input.block && dist < far && this.random() < (id === 'gustavo' ? .2 : .12)) ai.input.down = true;
    this.setInput(1, ai.input);
    if (id === 'marcelo' && f.canAct && !f.airborne && !hasDrone && !ai.input.block && !ai.input.jump
      && f.meter>=100 && (foe.knocked || foe.wakeTime > 0) && dist > 180 && dist < 700) {
      this.queue(1, 'drone'); ai.actionTimer = .6; return;
    }
    if (f.canAct && dist > far + 60 && dist < 450 && !ai.input.block && !ai.input.jump && this.random() < (id === 'marcelo' ? .35 : .12)) {
      if (this.beginFootwork(f,'advance')) return;
    }
    if (ai.input.block || ai.actionTimer > 0 || (!f.canAct && !f.airborne)) return;
    if (f.airborne && !f.airAttackUsed && f.vy > 0 && dist < 245) { this.queue(1, 'kick', 1); ai.actionTimer = .35; }
    else if (f.canAct && !f.airborne) {
      if (foe.airborne && dist < 210 && this.random() < .55) this.queue(1, 'uppercut');
      else if (f.meter >= 100 && (['marcos','joao'].includes(id)?dist<230:dist>210) && this.random() < .6) this.queue(1, 'super');
      else if(f.meter >= ALPHA.customCost && f.customTime <= 0 && dist < 190 && (foe.dizzyTime > 0 || foe.movePhase === 'recovery') && this.random() < .35) this.startCustom(f);
      else if ((id==='joao'?dist>150&&dist<350:id==='marcos'?dist>143&&dist<260:dist>320&&dist<850) && this.random() < .32) this.queue(1, 'special');
      else if (dist < 140 && this.random() < (id === 'marcos' ? .45 : id === 'marcelo' ? .28 : .08)) this.queue(1, 'throw');
      else if (dist < (['gustavo','gelton'].includes(id) ? 255 : 200)) {
        if (['gustavo','gelton'].includes(id) && dist > 175) this.queue(1,'kick',this.random() < .3 ? 2 : 1);
        else if (id === 'marcelo' && dist < 135 && this.random() < .3) this.queue(1,'kick',1);
        else this.queue(1,'punch',this.random() < .72 ? 0 : 1);
      }
      ai.actionTimer = (id === 'rafael' ? .17 : id === 'marcelo' ? .24 : .3) + this.random() * .22;
    }
  }
  update(dt) {
    let remaining = Math.min(Math.max(0, dt), .1);
    while (remaining > 1e-9) { const step = Math.min(FIXED_STEP, remaining); this.step(step); remaining -= step; }
  }
  step(dt) {
    if (this.paused || this.phase === 'selection' || this.phase === 'result') return;
    for (const f of this.fighters) {
      f.prevPushbox = f.pushbox; f.prevX = f.x; f.prevY = f.y; f.prevActionTime = f.actionTime;
      f.prevWalkDistance = f.walkDistance; f.prevWalkBlend = f.walkBlend;
      saveMotion(f);
    }
    for (const p of this.projectiles) p.prevX = p.x;
    if (this.freeze > 0) { this.freeze = Math.max(0, this.freeze - dt); return; }
    this.phaseTime += dt; this.time += dt; this.wallTransfers = [];
    if (this.phase === 'intro') {
      this.fighters.forEach(f => { f.animTime += dt; });
      if (this.phaseTime >= 2.35) { this.phase = 'fight'; this.phaseTime = 0; this.event('fight'); } return;
    }
    if (this.phase === 'roundEnd') {
      this.fighters.forEach(f => { f.animTime += dt; this.integrate(f, dt); });
      this.applyWallTransfers();
      if (this.phaseTime >= 3) {
        if (this.fighters.some(f => f.wins >= 2)) { this.phase = 'result'; this.event('result', { winner: this.fighters.find(f => f.wins >= 2).slot }); }
        else { this.round++; this.newRound(); }
      } return;
    }
    if (this.cpu) this.updateAI(dt);
    this.updateFacing();
    // Start either slot's super before integrating either fighter or any projectile.
    let superStarted = false;
    for (const f of this.fighters) if (f.buffer?.move === 'super' && (f.airborne || !(f.jumpBuffer > 0 || f.input.jump))) {
      const cancel = f.action && f.moveData.cancellable && f.actionHit
        && f.actionTime <= f.moveData.startup + f.moveData.active + .10;
      if (this.beginMove(f, 'super', f.buffer.strength, cancel)) { f.buffer = null; superStarted = true; }
    }
    if (superStarted) return;
    this.timer = Math.max(0, this.timer - dt);
    for (const f of this.fighters) this.updateFighter(f, dt);
    this.applyWallTransfers();
    this.resolvePushboxes();
    this.updateFacing();
    for (const f of this.fighters) {
      updateLocomotion(f,dt);
    }
    const contacts = [];
    for (const f of this.fighters) {
      const m = f.moveData;
      if (!f.action || f.actionHit || m.projectile || m.summon || f.actionTime < m.startup || f.actionTime >= m.startup + m.active) continue;
      const target = this.fighters[1 - f.slot];
      if (m.level === 'throw') {
        if ((!target.airborne || f.airborne && POWERS.has(f.action)) && Math.abs(f.y-target.y)<=100 && !target.knocked && target.wakeTime <= 0 && target.invincible <= 0 && target.throwInvincible <= 0 && target.hitstun <= 0 && target.blockstun <= 0
          && target.hp > 0 && Math.abs(f.x - target.x) <= (m.range??143)*entityScale(f)) {
          f.actionHit = true; contacts.push({ attacker: f, target, move: f.action, data: m, x: target.x, y: target.y - 145 });
        }
        continue;
      }
      const strike = f.attackbox, body = strike && target.hurtboxes.find(box => overlaps(strike, box));
      const drone = strike && this.drones.find(d => d.owner !== f.slot && !d.dead && !d.fired && overlaps(strike, droneHitbox(d)));
      if (drone && (!body || (drone.x - f.direction * SENTINEL.bodyWidth / 2 - (f.direction > 0 ? body.x : body.x + body.w)) * f.direction < 0)) {
        f.actionHit = true; f.contactTime = this.time; this.destroyDrone(drone); continue;
      }
      if (body) {
        f.actionHit = true;
        contacts.push({ attacker: f, target, move: f.action, data: m, x: clamp(f.x + f.direction * styleStrike(f).reach, body.x, body.x + body.w),
          y: clamp(strike.y + strike.h / 2, body.y, body.y + body.h) });
      }
    }
    this.updateProjectiles(dt, contacts);
    this.updateDrones(dt, contacts);
    // Snapshot posture so simultaneous contacts trade and use the same facing/guard state.
    const guards = this.fighters.map(f => f.guard);
    for (const contact of contacts) this.hit(contact, guards[contact.target.slot]);
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > -100 && p.x < WORLD.width + 100);
    if (this.fighters.some(f => f.hp <= 0) || this.timer <= 0) this.endRound();
  }
  updateFighter(f, dt) {
    f.animTime += dt;
    for (const timer of ['flash', 'blockFlash', 'hitstun', 'blockstun', 'quoteTime', 'comboTime', 'comboNameTime', 'landing', 'invincible', 'throwInvincible', 'footworkCooldown', 'counterWindow', 'dizzyProtection', 'stunQuiet', 'customTime', 'quickRiseBuffer']) f[timer] = Math.max(0, f[timer] - dt);
    if (f.stunQuiet <= 0 && f.hitstun <= 0 && !f.dizzyPending && f.dizzyTime <= 0) f.stunGauge = Math.max(0,f.stunGauge-DIZZY.decay*dt);
    if (f.comboTime <= 0) f.combo = 0;
    if (f.hitstun <= 0 && !f.knocked) f.lastAttacker = null;
    f.displayHP += (f.hp - f.displayHP) * (1 - Math.exp(-dt * 6));
    if (f.knocked) {
      f.vx = 0; f.state = 'knockdown';
      f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
      if (!f.airborne) {
        if (f.quickRiseBuffer > 0 && f.quickRiseAllowed && this.time-f.knockdownLandedAt <= frames(8) && !f.dizzyPending && !f.quickRise) { f.quickRise = true; f.knockdownTime = Math.min(f.knockdownTime,frames(7)); this.event('quickRise',{fighter:f.slot}); }
        f.knockdownTime = Math.max(0, f.knockdownTime - dt);
        if (f.knockdownTime <= 0) { f.knocked = false; f.wakeTime = f.quickRise ? frames(8) : .24; f.state = 'wake'; }
      }
      if (f.buffer) { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
      this.integrate(f, dt); return;
    }
    if (f.wakeTime > 0) {
      f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
      if (f.buffer) { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
      f.wakeTime = Math.max(0, f.wakeTime - dt); f.state = 'wake'; f.vx = 0;
      if (f.wakeTime <= 0) { f.throwInvincible = frames(5); f.state = 'idle'; f.hitstun = 0; }
      this.integrate(f, dt); return;
    }
    // Finish the combo's hit reaction/knockdown before entering the vulnerable dizzy state.
    if (f.dizzyPending && f.hitstun <= 0 && !f.airborne && f.hp > 0) this.startDizzy(f);
    if (f.dizzyTime > 0 || f.state === 'dizzy') {
      f.dizzyTime = Math.max(0,f.dizzyTime-dt); f.vx = 0;
      if (f.dizzyTime <= 0) this.finishDizzy(f);
      this.integrate(f,dt); return;
    }
    if (f.footwork) {
      const step = f.footwork, old = step.time; step.time = Math.min(step.duration,old+dt);
      f.vx = step.sign * step.distance * (stepDistance(step.time/step.duration)-stepDistance(old/step.duration))/dt;
      f.state = step.kind === 'advance' ? 'stepIn' : 'stepBack';
      this.integrate(f,dt);
      if (f.buffer) {
        if (this.beginMove(f,f.buffer.move,f.buffer.strength)) f.buffer = null;
        else { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
      }
      if (f.footwork && step.time >= step.duration-1e-9) {
        f.footwork = null; f.vx = 0; f.state = 'idle';
        if (step.kind === 'retreat') f.counterWindow = FOOTWORK[f.character.id].counter;
      }
      return;
    }
    if (f.action) {
      f.actionTime += dt; const m = f.moveData;
      if (f.action === 'uppercut' && f.actionTime >= m.startup && f.shotsSent === 0) {
        f.shotsSent = 1; if(!m.grounded){f.vy = (m.jumpVelocity??-1080)*entityScale(f); f.y -= .02; f.vx = f.direction * (m.travelSpeed??135)*entityScale(f);}
        this.announcePower(f);
      }
      if(['marcos','joao'].includes(f.character.id)&&['special','super'].includes(f.action)&&f.shotsSent===0&&f.actionTime>=m.startup){f.shotsSent=1;this.announcePower(f);}
      if (m.projectile) {
        const count = m.waves ?? (f.action === 'super' ? 3 : 1);
        while (f.shotsSent < count && f.actionTime >= m.startup + f.shotsSent * .11) { this.spawnProjectile(f, m, f.shotsSent++); }
      }
      if (m.summon && f.shotsSent === 0 && f.actionTime >= m.startup) {
        f.shotsSent = 1; m.swarm ? this.deploySwarm(f,m) : this.deployDrone(f, m);
      }
      const total = m.startup + m.active + m.recovery;
      if (f.actionTime >= total && (f.action !== 'uppercut' || !f.airborne)) this.clearAction(f);
    }
    const movement = Number(f.input.right) - Number(f.input.left);
    if ((f.jumpBuffer > 0 || f.input.jump) && f.customTime <= 0 && !f.input.down && f.canAct && !f.airborne && !f.input.block) {
      f.preJump = COMBAT.preJump; f.jumpVelocityX = movement * f.character.jumpSpeed*entityScale(f);
      f.jumpBuffer = 0; f.vx = 0; f.state = 'preJump';
    }
    if (f.preJump > 0) {
      f.preJump = Math.max(0, f.preJump - dt);
      if (f.preJump > 1e-9) { this.integrate(f, dt); return; }
      f.preJump = 0; f.vy = COMBAT.jumpVelocity*entityScale(f); f.y -= .02; f.vx = f.jumpVelocityX;
      f.airAttackUsed = false; this.event('jump', { fighter: f.slot });
    }
    f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
    if (f.buffer) {
      const nextMove = this.contextualMove(f, f.buffer.move);
      const cancel = (f.action && f.moveData.cancellable && f.actionHit && POWERS.has(nextMove)
        && f.actionTime <= f.moveData.startup + f.moveData.active + .10)
        || canStyleChain(f, nextMove, clamp(f.buffer.strength,0,2), this.time) || this.customCancel(f,nextMove);
      if (this.beginMove(f, f.buffer.move, f.buffer.strength, cancel)) f.buffer = null;
      else { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
    }
    if (f.hp <= 0) f.state = 'ko';
    else if (f.hitstun > 0) { f.state = 'hit'; f.vx = 0; }
    else if (f.blockstun > 0) { f.state = f.blockLow ? 'lowBlock' : 'block'; f.vx = 0; }
    else if (f.action) {
      f.state = f.action;
      if (!f.airborne) {
        const duration=f.moveData.startup,advance=f.moveData.advance??0;
        const delta=rootCurve(f.actionTime/duration)-rootCurve(Math.max(0,f.actionTime-dt)/duration);
        f.vx=f.customTime>0&&!f.moveData.projectile?f.direction*135*entityScale(f):f.direction*advance*entityScale(f)*delta/dt;
      }
    }
    else if (f.landing > 0) { f.state = 'landing'; f.vx = 0; }
    else if (f.airborne) f.state = 'jump'; // Horizontal jump velocity is locked at takeoff.
    else {
      const backwards = movement * f.direction < 0, speed = (backwards ? f.character.backSpeed : f.character.speed)*.72*entityScale(f);
      const opponent = this.opponentFor(f), enemyStrike = styleStrike(opponent);
      const nearbyStrike = enemyStrike && opponent.movePhase !== 'recovery' && opponent.direction === -f.direction && Math.abs(opponent.x - f.x) <= enemyStrike.reach + 60;
      const nearbyProjectile = this.projectiles.some(p => p.owner !== f.slot && p.direction === -f.direction && (p.x - f.x) * f.direction >= 0 && Math.abs(p.x - f.x) < 150);
      const guardReady = f.guard.active && (nearbyStrike || nearbyProjectile);
      const target = f.customTime > 0 ? f.direction * (f.customMoves < ALPHA.customLimit ? 135 : 0) : f.input.down || f.input.block || guardReady ? 0 : movement * speed*this.walkingMultiplier(f);
      // 25–45 ms ramps: movement starts on this tick, without inertial skating.
      f.vx = f.customTime<=0&&(f.input.down||f.input.block||guardReady)?0:locomotionVelocity(f,target,dt);
      f.state = f.customTime > 0 ? Math.abs(f.vx) > 8 ? 'walk' : 'idle' : f.input.down ? (f.input.block || guardReady ? 'lowBlock' : 'crouch') : f.input.block || guardReady ? 'block' : Math.abs(f.vx) > 8 ? 'walk' : 'idle';
    }
    this.integrate(f, dt);
  }
  clearAction(f) { f.action = null; f.moveData = null; f.actionTime = 0; f.prevActionTime = 0;f.attackPlant=null; }
  walkingMultiplier(){return 1;}
  deploySwarm(f,data) {
    this.announcePower(f);
    const s=entityScale(f);
    for(let i=0;i<6;i++) {
      const drone={id:this.nextDroneId++,owner:f.slot,character:f.character.id,direction:f.direction,swarm:true,index:i,
        x:clamp(f.x+f.direction*(80+(i%3)*68)*s,40,WORLD.width-40),y:f.y-(310+Math.floor(i/3)*80)*s,worldScale:s,
        data:{...data},createdAt:this.time,age:0,fireDelay:.50+i*.17,fired:false,dead:false,aim:null};
      this.drones.push(drone);this.event('droneDeploy',{...drone,color:f.character.color});
    }
  }
  deployDrone(f, data) {
    this.announcePower(f);
    const s=entityScale(f);
    const drone = { id:this.nextDroneId++, owner:f.slot, character:f.character.id, direction:f.direction,
      x:clamp(f.x + f.direction * SENTINEL.offset*s, 32, WORLD.width - 32),worldScale:s,
      y:f.airborne ? clamp(f.y - SENTINEL.airHeight*s, 100, WORLD.floor - SENTINEL.groundHeight*s) : WORLD.floor - SENTINEL.groundHeight*s,
      airborne:f.airborne, data:{...data}, createdAt:this.time, age:0, fired:false, dead:false };
    this.drones.push(drone);
    this.event('droneDeploy', { ...drone, color:f.character.color });
  }
  destroyDrone(drone) {
    drone.dead = true;
    this.event('droneDestroyed', { id:drone.id, fighter:drone.owner, character:drone.character,
      x:drone.x, y:drone.y, color:CHARACTERS[drone.character].color, effect:'sentinelLaser' });
  }
  updateDrones(dt, contacts) {
    for (const laser of this.lasers) { laser.age = this.time - laser.createdAt; laser.life = Math.max(0, SENTINEL.beamDuration - laser.age); }
    this.lasers = this.lasers.filter(laser => laser.life > 0);
    for (const drone of this.drones) {
      drone.age = this.time - drone.createdAt;
      if (drone.dead || drone.fired) continue;
      const target = this.fighters[1 - drone.owner];
      if(drone.swarm) {
        const caster=this.fighters[drone.owner];
        const desiredX=clamp(caster.x+drone.direction*(80+(drone.index%3)*68),40,WORLD.width-40);
        drone.x=approach(drone.x,desiredX,dt*210);
        const hover=WORLD.floor-310-Math.floor(drone.index/3)*80;
        drone.y=approach(drone.y,hover,dt*180);
        const boxes=target.hurtboxes;
        const box=boxes.toSorted((a,b)=>b.w*b.h-a.w*a.h)[0];
        if(drone.age>=drone.fireDelay-.10&&!drone.aim&&box)drone.aim={x:box.x+box.w/2,y:box.y+box.h/2};
        if(drone.age<drone.fireDelay||!drone.aim) {
          if(drone.age>drone.fireDelay+1)drone.dead=true;
          continue;
        }
        drone.fired=true;drone.firedAt=this.time;
        const aim=drone.aim,body=boxes.find(b=>aim.x>=b.x&&aim.x<=b.x+b.w&&aim.y>=b.y&&aim.y<=b.y+b.h);
        const direction=target.x>=caster.x?1:-1;
        this.lasers.push({id:drone.id,owner:drone.owner,x:drone.x,y:drone.y,endX:aim.x,endY:aim.y,
          direction,createdAt:this.time,age:0,life:SENTINEL.beamDuration});
        if(body)contacts.push({attacker:caster,target,move:'super',data:drone.data,x:aim.x,y:aim.y,direction});
        this.event('droneFire',{id:drone.id,fighter:drone.owner,character:drone.character,x:drone.x,y:drone.y,
          endX:aim.x,endY:aim.y,direction,color:caster.character.color});
        continue;
      }
      if (drone.age < SENTINEL.delay - 1e-9) continue;
      drone.fired = true; drone.firedAt = this.time;
      const ray = sentinelRay(drone, WORLD.width);
      const body = target.hurtboxes.filter(box => overlaps(ray.box, box)).sort((a, b) => (a.x - b.x) * drone.direction)[0];
      const endX = body ? clamp(drone.direction > 0 ? body.x : body.x + body.w, 0, WORLD.width) : ray.endX;
      this.lasers.push({ id:drone.id, owner:drone.owner, x:ray.x, endX, y:ray.y, direction:drone.direction,
        createdAt:this.time, age:0, life:SENTINEL.beamDuration });
      if (body) contacts.push({ attacker:this.fighters[drone.owner], target, move:'drone', data:drone.data,
        x:endX, y:ray.y, direction:drone.direction });
      this.event('droneFire', { id:drone.id, fighter:drone.owner, character:drone.character, x:ray.x, y:ray.y,
        endX, direction:drone.direction, color:CHARACTERS[drone.character].color });
    }
    this.drones = this.drones.filter(drone => !drone.dead && (!drone.fired || this.time - drone.firedAt < SENTINEL.retireTime));
  }
  spawnProjectile(f, data, wave) {
    if (wave === 0) this.announcePower(f);
    const { offset, height } = f.character.projectile,s=entityScale(f), x = f.x + f.direction * offset*s;
    this.projectiles.push({ owner: f.slot, character: f.character.id, direction: f.direction, move: f.action, data: { ...data, ...(data.finalKnockdown?{knockdown:wave===(data.waves??3)-1}:{}) }, wave,
      x, prevX: x, y: f.y - height*s, radius: (data.radius ?? (f.action === 'super' ? 32 : 27))*s, speed: data.speed*s, life: 3.1, effect:data.effect ?? 'energy' });
    this.event('projectile', { fighter:f.slot, move:f.action, character:f.character.id, color:f.character.color, x, y:f.y-height, direction:f.direction, wave,effect:data.effect });
  }
  announcePower(f) {
    f.quoteTime = f.character.voiceDuration[f.action] + .1; f.powerQuote = f.character.powerQuotes[f.action];
    this.event('special', { fighter:f.slot, move:f.action, name:f.powerName, quote:f.powerQuote, character:f.character.id, color:f.character.color, x:f.x, y:f.y-190, direction:f.direction });
  }
  updateProjectiles(dt, contacts) {
    for (const p of this.projectiles) { p.prevX = p.x; p.x += p.direction * p.speed * dt; p.life -= dt; }
    for (let i = 0; i < this.projectiles.length; i++) for (let j = i + 1; j < this.projectiles.length; j++) {
      const a = this.projectiles[i], b = this.projectiles[j];
      if (a.life <= 0 || b.life <= 0 || a.owner === b.owner || Math.abs(a.y - b.y) > a.radius + b.radius) continue;
      const before = a.prevX - b.prevX, after = a.x - b.x;
      if (Math.min(before, after) <= a.radius + b.radius && Math.max(before, after) >= -a.radius - b.radius) {
        a.life = 0; b.life = 0; this.event('clash', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, color: '#fff4ce' });
      }
    }
    for (const p of this.projectiles) {
      if (p.life <= 0) continue;
      const target = this.fighters[1 - p.owner];
      if (target.action === 'uppercut' && target.invincible > 0 && Math.abs(p.x - target.x) < 105) {
        p.life = 0; this.event('clash', { x: p.x, y: p.y, color: target.character.color }); continue;
      }
      const relativeStart = p.prevX - target.prevX, relativeEnd = p.x - target.x;
      const body = target.hurtboxes.find(box => {
        const left = box.x - target.x, right = left + box.w;
        return Math.min(relativeStart, relativeEnd) - p.radius < right && Math.max(relativeStart, relativeEnd) + p.radius > left
          && p.y + p.radius > box.y && p.y - p.radius < box.y + box.h;
      });
      const drone = this.drones.filter(d => d.owner !== p.owner && !d.dead && !d.fired).find(d => {
        const box = droneHitbox(d);
        return Math.min(p.prevX, p.x) - p.radius < box.x + box.w && Math.max(p.prevX, p.x) + p.radius > box.x
          && p.y + p.radius > box.y && p.y - p.radius < box.y + box.h;
      });
      if (drone && (!body || (drone.x - p.direction * SENTINEL.bodyWidth / 2 - (p.direction > 0 ? body.x : body.x + body.w)) * p.direction < 0)) {
        p.life = 0; this.destroyDrone(drone); continue;
      }
      if (body) {
        contacts.push({ attacker: this.fighters[p.owner], target, move: p.move, data: p.data,
          x: clamp(p.x, body.x, body.x + body.w), y: p.y, direction: p.direction }); p.life = 0;
      }
    }
  }
  integrate(f, dt) {
    const wasAirborne = f.airborne;
    const movementX = clamp(f.x + f.vx * dt, LEFT_WALL, RIGHT_WALL);
    const recoilStep = Math.min(dt, f.recoilTime), recoilSign = Math.sign(f.knockback);
    const recoilX = f.knockback * recoilStep - recoilSign * f.recoilDeceleration * recoilStep * recoilStep / 2;
    const desiredX = movementX + recoilX;
    f.x = clamp(desiredX, LEFT_WALL, RIGHT_WALL);
    const cornerRecoil = desiredX - f.x;
    if (f.recoilSource !== null && Math.abs(cornerRecoil) > 1e-9) this.wallTransfers.push({ slot: f.recoilSource, dx: -cornerRecoil });
    f.recoilTime = Math.max(0, f.recoilTime - recoilStep);
    f.knockback -= recoilSign * f.recoilDeceleration * recoilStep;
    if (f.recoilTime <= 1e-9) { f.recoilTime = 0; f.knockback = 0; f.recoilSource = null; }
    if (f.airborne || f.vy < 0) { const gravity=WORLD.gravity*entityScale(f);f.y += f.vy * dt + .5 * gravity * dt * dt; f.vy += gravity * dt; }
    if (f.y >= WORLD.floor) {
      f.y = WORLD.floor; f.vy = 0;
      if (wasAirborne) {
        if(f.knocked)f.knockdownLandedAt=this.time;
        const attacked = f.airAttackUsed || f.action === 'uppercut';
        f.vx = 0; f.airAttackUsed = false;
        if (!f.knocked && f.hp > 0) {
          const remaining = f.action === 'uppercut' ? Math.max(0, f.moveData.startup + f.moveData.active + f.moveData.recovery - f.actionTime) : 0;
          if (f.action?.startsWith('air') || f.action === 'uppercut' || f.action === 'drone' && f.moveData.airborneDeployment) this.clearAction(f);
          f.landing = Math.max(attacked ? COMBAT.landing : COMBAT.emptyLanding, remaining); f.state = 'landing';
        }
        this.event('land', { fighter: f.slot, x: f.x });
      }
    }
    if (this.phase === 'roundEnd') f.vx = approach(f.vx, 0, 9000 * dt);
  }
  opponentFor(f) { return this.fighters[1 - f.slot]; }
  updateFacing() {
    for (const f of this.fighters) {
      if (f.action || f.footwork || f.dizzyPending || f.dizzyTime > 0 || f.airborne || f.knocked || f.preJump > 0 || f.hitstun > 0 || f.blockstun > 0 || f.wakeTime > 0) continue;
      const direction = this.fighters[1 - f.slot].x >= f.x ? 1 : -1;
      if (direction !== f.direction) { f.direction = direction; f.directions = []; f.lastDirection = 5; }
    }
  }
  recoil(f, direction, distance, duration, source) {
    distance*=entityScale(f);
    f.knockback = direction * 2 * distance / duration; f.recoilDeceleration = 2 * distance / (duration * duration);
    f.recoilTime = duration; f.recoilSource = source;
  }
  applyWallTransfers() {
    for (const {slot, dx} of this.wallTransfers) {
      const f = this.fighters[slot]; f.x = clamp(f.x + dx, LEFT_WALL, RIGHT_WALL);
    }
    this.wallTransfers = [];
  }
  addMeter(f, amount) {
    const before = f.meter;
    f.meter = clamp(f.meter + amount, 0, 100);
    if (before < 100 && f.meter >= 100 && f.hp > 0) this.event('superReady', {
      fighter: f.slot, character: f.character.id, color: f.character.color, name: f.character.powers.super,
    });
  }
  resolvePushboxes() {
    const [a, b] = this.fighters;
    const ab = a.pushbox, bb = b.pushbox;
    const verticalOverlap = (one, two) => one && two && one.y < two.y + two.h && one.y + one.h > two.y;
    if (!verticalOverlap(ab, bb)) return;
    const oldOrder = verticalOverlap(a.prevPushbox, b.prevPushbox) && Math.abs(a.prevX - b.prevX) > .01;
    const aOnLeft = oldOrder ? a.prevX < b.prevX : a.x <= b.x;
    const left = aOnLeft ? a : b, right = aOnLeft ? b : a, overlap = left.x + (ab.w + bb.w) / 2 - right.x;
    if (overlap <= 0) return;
    let shiftLeft = Math.min(overlap / 2, left.x - LEFT_WALL), shiftRight = Math.min(overlap / 2, RIGHT_WALL - right.x);
    let remaining = overlap - shiftLeft - shiftRight;
    const extraLeft = Math.min(remaining, left.x - LEFT_WALL - shiftLeft); shiftLeft += extraLeft; remaining -= extraLeft;
    shiftRight += Math.min(remaining, RIGHT_WALL - right.x - shiftRight);
    left.x -= shiftLeft; right.x += shiftRight;
    if(left.vx>0&&Math.abs(left.x-left.prevX)<1e-6)left.vx=0;
    if(right.vx<0&&Math.abs(right.x-right.prevX)<1e-6)right.vx=0;
  }
  hit({ attacker, target, move, data = MOVES[move], x, y, direction = attacker.direction }, guard = target.guard) {
    if (target.hp <= 0) return;
    const front = direction === -guard.direction;
    const correctHeight = data.level === 'low' ? guard.low : data.level === 'overhead' ? !guard.low : data.level !== 'throw';
    const blocked = guard.active && front && correctHeight;
    attacker.contactTime = this.time;
    if (blocked) {
      const chip = data.chip ? Math.round(data.damage * data.chip) : 0;
      target.hp = Math.max(1, target.hp - chip); target.blockFlash = .15; target.blockstun = data.blockstun;
      this.recoil(target, direction, data.push * .10, Math.min(data.blockstun, frames(14)), attacker.slot);
      target.blockLow = guard.low; target.state = guard.low ? 'lowBlock' : 'block'; target.vx = 0;
      this.addMeter(target, 5); if(attacker.customTime <= 0 && move!=='super')this.addMeter(attacker, 4);
      this.freeze = Math.max(this.freeze, frames(4)); this.event('block', { x, y, move, fighter:target.slot, character:attacker.character.id, strength:data.strength, direction, color:target.character.color,effect:data.effect }); return;
    }
    const counter = target.action && ['startup','recovery'].includes(target.movePhase);
    const counterBonus = counter ? 1.12 : 1;
    const continued = target.hitstun > 0 && target.lastAttacker === attacker.slot;
    const combo = continued ? attacker.combo + 1 : 1, scaling = Math.max(attacker.customTime > 0 ? .35 : .55, 1 - (combo - 1) * (attacker.customTime > 0 ? .12 : .08));
    const damage = Math.round(data.damage * attacker.character.power * scaling * counterBonus * (target.airborne ? .93 : 1));
    if (target.dizzyTime > 0 || target.state === 'dizzy') this.finishDizzy(target);
    target.hp = Math.max(0, target.hp - damage); target.hitCrouched = target.crouching;
    target.hitstun = data.stun + (counter ? frames(attacker.counterWindow > 0 ? 5 : 3) : 0); target.flash = frames(3);
    target.hitDuration = target.hitstun; target.hitRegion = target.y-y >= 210 ? 'head' : 'body'; target.hitStrength = data.strength;
    target.customTime = 0; target.customMoves = 0;
    if (counter) attacker.counterWindow = 0;
    if (target.hp > 0 && target.dizzyProtection <= 0 && data.level !== 'throw') {
      target.stunGauge = clamp(target.stunGauge + 18 + data.strength * 9,0,100); target.stunQuiet = 1;
      if (combo >= DIZZY.minHits && target.stunGauge >= DIZZY.threshold) target.dizzyPending = true;
      if (data.effect === 'chemicalSmoke') {
        target.dizzyPending = true; target.pendingDizzyDuration = data.dizzyDuration; target.pendingDizzyCause = 'chemicalSmoke';
      }
    }
    this.recoil(target, direction, data.push * .16, frames(data.knockdown || target.airborne ? 18 : 10 + data.strength * 4), attacker.slot);
    this.clearAction(target); target.footwork = null; target.counterWindow = 0;
    target.buffer = null; target.jumpBuffer = 0; target.preJump = 0; target.vx = 0; target.lastAttacker = attacker.slot;
    target.state = target.hp <= 0 ? 'ko' : 'hit';
    if (data.knockdown || target.airborne) {
      target.knocked = true; target.knockdownTime = .48; target.wakeTime = 0; target.state = 'knockdown'; target.quickRise = false; target.quickRiseBuffer = 0;
      target.quickRiseAllowed = data.level !== 'throw'; target.knockdownLandedAt = 1e9; // Finite future sentinel survives JSON rollback snapshots.
      if (data.launch) { target.vy = -data.launch*entityScale(target); target.y -= .02; }
      else { target.vy = (target.airborne ? -460 : -300)*entityScale(target); target.y -= .02; }
    }
    this.addMeter(attacker, data.meter); this.addMeter(target, 7);
    attacker.combo = combo; attacker.comboTime = 1.2;
    if (combo === 1) { attacker.comboName = ''; attacker.comboNameTime = 0; }
    const route = completedStyleCombo(attacker);
    if (route && combo >= route.steps.length) { attacker.comboName = route.name; attacker.comboNameTime = 1.2; }
    if (attacker.customTime > 0) { attacker.comboName = 'Combo Livre'; attacker.comboNameTime = 1.2; }
    this.freeze = Math.max(this.freeze, frames(counter || move === 'super' || move === 'uppercut' ? 9 : data.strength === 2 ? 8 : data.strength === 1 ? 6 : 4));
    this.event('hit', { x, y, damage, move, fighter: attacker.slot, target: target.slot, combo, color: attacker.character.color,
      character:attacker.character.id, strength:data.strength, direction, region:target.hitRegion,
      technique:data.technique, counter:!!counter, comboName:route && combo >= route.steps.length ? route.name : '',effect:data.effect });
  }
  endRound() {
    const [a, b] = this.fighters, winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
    this.phase = 'roundEnd'; this.phaseTime = 0; this.projectiles = []; this.drones = []; this.lasers = []; this.freeze = .08;
    this.fighters.forEach(f => {
      this.clearAction(f); f.buffer = null; f.jumpBuffer = 0; f.input = idleInput(); f.knocked = false; f.wakeTime = 0;
      f.footwork = null; f.dizzyPending = false; f.dizzyTime = 0; f.stunGauge = 0; f.counterWindow = 0;
      f.customTime = 0; f.customMoves = 0; f.quickRise = false; f.quickRiseBuffer = 0;
      f.pendingDizzyDuration = 0; f.pendingDizzyCause = null; f.dizzyCause = null;
      f.state = f.hp <= 0 ? 'ko' : winner === f ? 'victory' : 'idle';
    });
    if (winner) { winner.wins++; winner.quoteTime = 2.75; winner.powerName = 'ROUND VENCIDO'; winner.powerQuote = winner.character.quote; }
    this.roundWinner = winner?.slot ?? null;
    this.event('roundEnd', { winner: this.roundWinner, timeout: this.timer <= 0, quote: winner?.character.quote });
  }
  togglePause() {
    if (!['intro', 'fight', 'roundEnd'].includes(this.phase)) return;
    this.paused = !this.paused; this.event('pause', { paused: this.paused });
  }
}
