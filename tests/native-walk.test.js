import test from 'node:test';
import assert from 'node:assert/strict';
import {Fighter,FightEngine,CHARACTERS,FIXED_STEP,COMBAT,fighterPose} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {STORY_WORLD,scaledBox} from '../src/story-world.js';
import {NATIVE_WALK_STRIDES} from '../src/native-walk.js';
import {NATIVE_WALK_HURT} from '../src/native-walk-data.js';

test('os 12 ciclos mantêm a mesma passada em unidades do corpo no versus e na campanha',()=>{
 for(const id of Object.keys(CHARACTERS))for(const slot of [0,1]){
  const f=new Fighter(id,slot);f.state='walk';f.walkBlend=1;
  for(const scale of [1,STORY_WORLD.actorScale])for(let frame=0;frame<8;frame++){
   f.worldScale=scale;f.walkDistance=NATIVE_WALK_STRIDES[id]*scale*(frame+.25)/8;
   assert.deepEqual(fighterPose(f),{atlas:'motion',index:frame},`${id} P${slot+1} escala ${scale}`);
  }
 }
});

test('recuar atravessa os oito desenhos em ordem inversa, inclusive após cruzar a origem',()=>{
 for(const id of Object.keys(CHARACTERS))for(const scale of [1,STORY_WORLD.actorScale]){
  const f=new Fighter(id,0);f.state='walk';f.walkBlend=1;f.worldScale=scale;
  const seen=[];
  for(let step=0;step<8;step++){
   f.walkDistance=-NATIVE_WALK_STRIDES[id]*scale*(step+.25)/8;
   seen.push(fighterPose(f).index);
  }
  assert.deepEqual(seen,[7,6,5,4,3,2,1,0],id);
 }
});

test('os cinco ciclos antes desconectados usam suas silhuetas no combate e na profundidade',()=>{
 for(const id of ['gelton','marcelino','marcos','joao','ruan'])for(const scale of [1,STORY_WORLD.actorScale])for(const direction of [-1,1]){
  const f=new Fighter(id,0);f.state='walk';f.walkBlend=1;f.worldScale=scale;f.direction=direction;
  for(let index=0;index<8;index++){
   f.walkDistance=NATIVE_WALK_STRIDES[id]*scale*(index+.25)/8;
   assert.deepEqual(f.hurtboxes,NATIVE_WALK_HURT[id][index].map(([x,y,w,h])=>scaledBox(f,x,y,w,h)),`${id} quadro ${index}`);
  }
 }
});

test('todos os heróis deixam de marchar contra a parede e conservam os golpes próprios',()=>{
 for(const id of Object.keys(CHARACTERS)){
  const e=new FightEngine();e.start(id,'local',id==='rafael'?'marcelo':'rafael');e.phase='fight';
  const f=e.fighters[0];f.x=COMBAT.leftWall;f.prevX=f.x;e.fighters[1].x=900;
  e.setInput(0,{left:true});for(let tick=0;tick<120;tick++)e.update(FIXED_STEP);
  assert.equal(f.walkDistance,0,id);assert.equal(f.walkBlend,0,id);
  assert.notEqual(fighterPose(f).atlas,'motion',id);
  e.setInput(0,{});assert.ok(e.beginMove(f,'kick'),id);f.actionTime=f.moveData.startup+FIXED_STEP;
  assert.notEqual(fighterPose(f).atlas,'motion',`${id} chute`);
 }
});

test('caminhar somente em profundidade usa a distância real da campanha',()=>{
 for(const id of Object.keys(CHARACTERS)){
  const e=new StoryEngine();e.start(id,'story-solo',id==='rafael'?'marcelo':'rafael');e.queue(0,'storyNext');
  e.enemies=[];e.props=[];e.hazards=[];e.story.wave=3;e.story.dropWave=3;
  const f=e.fighters[0],lane=f.lane,x=f.x;e.setInput(0,{up:true});
  for(let tick=0;tick<25;tick++)e.update(FIXED_STEP);
  assert.equal(f.x,x,id);assert.ok(f.lane<lane,id);
  assert.ok(Math.abs(f.walkDistance-(lane-f.lane))<1e-8,id);
  const expected=Math.floor(f.walkDistance/(NATIVE_WALK_STRIDES[id]*STORY_WORLD.actorScale)*8)%8;
  assert.deepEqual(fighterPose(f),{atlas:'motion',index:expected},id);
 }
});
