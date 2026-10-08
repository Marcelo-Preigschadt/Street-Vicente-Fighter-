import test from 'node:test';
import assert from 'node:assert/strict';
import {StoryEngine} from '../src/story.js';
import {CHARACTERS,FIXED_STEP} from '../src/engine.js';
import {STORY_PROP_DIMENSIONS,storyPropBounds} from '../src/story-props.js';
import {machineRigPose} from '../src/machine-rig.js';
const advance=(e,s)=>{for(let i=0;i<s/FIXED_STEP;i++)e.update(FIXED_STEP);};
for(const id of Object.keys(CHARACTERS))test(`${id}: chute contextual quebra mesa e cadeira`,()=>{
  for(const kind of ['table','chair']){
    const e=new StoryEngine();e.start(id,'story-solo',id==='rafael'?'gustavo':'rafael');e.queue(0,'storyNext');
    const p=e.props.find(p=>p.kind===kind);e.props=[p];e.story.wave=3;e.camera=Math.max(0,p.x-200);const f=e.fighters[0];f.x=p.x-125;f.prevX=f.x;f.lane=p.lane;f.prevLane=f.lane;f.direction=1;
    for(let n=0;n<4&&!p.used;n++){e.queue(0,'kick');advance(e,.75);}
    assert.ok(p.hp<=0&&p.used&&p.brokenTime>0,`${kind} deve produzir destroços`);
  }
});
test('serras giram independentemente e braços avançam no contato',()=>{
 const e={state:'walk',brawlerWalkDistance:100,attackLife:0};
 const a=machineRigPose(e,1),b=machineRigPose(e,1.05);assert.notEqual(a.saw,b.saw);assert.equal(a.wheel,b.wheel);
 const windup=machineRigPose({...e,telegraph:.3},1),contact=machineRigPose({...e,attackLife:.2,brawlerFrame:14},1);
 assert.ok(contact.upper>windup.upper);assert.ok(contact.forearm>windup.forearm);
 assert.equal(machineRigPose(e,2,true).saw,0);
});
test('móveis têm dimensões de colisão iguais às dimensões desenhadas',()=>{
 for(const kind of ['table','chair','soda']){const p={kind,x:500},b=storyPropBounds(p),s=STORY_PROP_DIMENSIONS[kind];assert.equal(b.w,s.width);assert.equal(b.h,s.height);assert.equal(b.x+b.w/2,p.x);}
 assert.ok(STORY_PROP_DIMENSIONS.table.height>80&&STORY_PROP_DIMENSIONS.table.height<93);assert.ok(STORY_PROP_DIMENSIONS.chair.height>STORY_PROP_DIMENSIONS.table.height);
});
test('móveis do pátio ficam na área da cantina do panorama',()=>{
 const e=new StoryEngine();e.start('marcelo','story-solo');
 const tables=e.props.filter(p=>p.kind==='table'),chairs=e.props.filter(p=>p.kind==='chair'),machines=e.props.filter(p=>p.kind==='soda');
 assert.ok(e.props.every(p=>p.x>=1750&&p.x<=3570));assert.equal(tables.length,3);assert.equal(machines.length,2);
 assert.ok(machines.every(m=>tables.every(t=>Math.abs(m.x-t.x)>=300)&&chairs.every(c=>Math.abs(m.x-c.x)>=140)));
});
