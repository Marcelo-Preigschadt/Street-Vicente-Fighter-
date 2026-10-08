// Native Gamepad API adapter for XInput and generic DirectInput USB controllers.
export const PAD_STORAGE_KEY='svf-gamepad-bindings-v1';
export const PAD_DEFAULT=Object.freeze({jump:0,kick:1,punch:2,special:3,block:4,pause:9});
export const PAD_ACTIONS=Object.freeze(['jump','kick','punch','special','block','pause']);
export const PAD_LABELS=Object.freeze({jump:'Pular',kick:'Chute',punch:'Soco',special:'Poder',block:'Defender',pause:'Start / Pausar'});
export function connectedPads(source=globalThis.navigator){
  try{return [...(source?.getGamepads?.()??[])].filter(p=>p&&p.connected!==false);}
  catch{return [];}
}
export const pressed=(pad,i)=>Number.isInteger(i)&&i>=0&&!!(pad?.buttons?.[i]?.pressed||pad?.buttons?.[i]?.value>.5);
const axis=(pad,i)=>Number.isFinite(pad?.axes?.[i])?pad.axes[i]:0;
export function deviceKey(pad){return `${pad?.id??'unknown'} | ${pad?.mapping??''} | ${pad?.buttons?.length??0}b | ${pad?.axes?.length??0}a`;}
export function directions(pad){
  const x=axis(pad,0),y=axis(pad,1);
  const dx=pad.mapping!=='standard'&&pad.axes?.length>=8?axis(pad,6):0;
  const dy=pad.mapping!=='standard'&&pad.axes?.length>=8?axis(pad,7):0;
  return {left:x<-.3||dx<-.6||pressed(pad,14),right:x>.3||dx>.6||pressed(pad,15),
    up:y<-.3||dy<-.6||pressed(pad,12),down:y>.3||dy>.6||pressed(pad,13)};
}
export class GamepadMappings {
  constructor(storage=globalThis.localStorage){this.storage=storage;this.data={};try{const v=JSON.parse(storage?.getItem(PAD_STORAGE_KEY)??'{}');if(v&&typeof v==='object'&&!Array.isArray(v))this.data=v;}catch{}}
  for(pad){const stored=this.data[deviceKey(pad)]??{};const valid=Object.fromEntries(PAD_ACTIONS.filter(name=>Number.isInteger(stored[name])&&stored[name]>=0&&stored[name]<pad.buttons.length).map(name=>[name,stored[name]]));return {...PAD_DEFAULT,...valid};}
  bind(pad,action,button){if(!pad||!PAD_ACTIONS.includes(action)||!Number.isInteger(button)||button<0||button>=pad.buttons.length)return false;
    const key=deviceKey(pad),map=this.for(pad),previous=map[action];
    for(const other of PAD_ACTIONS)if(other!==action&&map[other]===button)map[other]=previous;
    map[action]=button;this.data[key]=map;this.persist();return true;}
  reset(pad){if(!pad)return;delete this.data[deviceKey(pad)];this.persist();}
  persist(){try{this.storage?.setItem(PAD_STORAGE_KEY,JSON.stringify(this.data));}catch{}}
}
export function readController(pad,map=PAD_DEFAULT){
  const dir=directions(pad);
  return {...dir,buttons:{jump:pressed(pad,map.jump),kick:pressed(pad,map.kick),punch:pressed(pad,map.punch),special:pressed(pad,map.special),block:pressed(pad,map.block),pause:pressed(pad,map.pause)},
    confirm:pressed(pad,map.jump),back:pressed(pad,map.kick),
    raw:[...(pad?.buttons??[])].map((_,i)=>pressed(pad,i))};
}
