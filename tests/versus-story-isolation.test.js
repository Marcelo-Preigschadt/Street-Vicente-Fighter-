import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,CHARACTERS,FIXED_STEP} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';

function duel(Engine,id,move,priorStory){
  const e=new Engine({random:()=>.6});
  if(priorStory){e.start(id,'story-solo');e.queue(0,'storyNext');e.spawnWave();e.camera=1100;}
  e.start(id,'local',id==='rafael'?'gustavo':'rafael');e.phase='fight';e.phaseTime=0;
  e.fighters[0].x=350;e.fighters[1].x=['joao','marcos','luciana'].includes(id)?470:850;
  for(const f of e.fighters){f.prevX=f.x;f.direction=f.slot?-1:1;}
  e.fighters[0].meter=100;e.queue(0,move);
  return e;
}
const state=e=>({hp:e.fighters.map(f=>f.hp),meter:e.fighters.map(f=>f.meter),projectiles:e.projectiles.map(p=>[p.owner,p.x,p.life]),drones:e.drones.map(d=>[d.x,d.fired,d.dead]),lasers:e.lasers.map(l=>[l.x,l.endX])});
for(const id of Object.keys(CHARACTERS))for(const move of ['special','super'])for(const priorStory of [false,true]){
  test(`1×1: ${id} ${move}, ${priorStory?'após campanha':'entrada direta'}, usa combate de versus`,()=>{
    const expected=duel(FightEngine,id,move,false),actual=duel(StoryEngine,id,move,priorStory);
    for(let n=0;n<480;n++){
      expected.update(FIXED_STEP);actual.update(FIXED_STEP);
      assert.deepEqual(state(actual),state(expected),`divergência no tick ${n}`);
    }
    assert.ok(expected.fighters[1].hp<1000,'o poder deve atingir o adversário');
  });
}
