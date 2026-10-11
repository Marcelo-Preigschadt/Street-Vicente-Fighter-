import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothCamera,schoolEnemyFrame,interpolateEntity,storyDepthScale} from '../src/story-presentation.js';
import {StoryEnemy} from '../src/story.js';
import {readFile} from 'node:fs/promises';
test('camera smoothing is frame-rate independent and frozen while paused',()=>{
 const target=600,once=smoothCamera(100,target,1/30),twice=smoothCamera(smoothCamera(100,target,1/60),target,1/60);
 assert.ok(Math.abs(once-twice)<1e-9);assert.equal(smoothCamera(100,target,0),100);assert.equal(smoothCamera(1000,0,.016),0);
});
test('own enemy animation has anticipation, contact, recoil and final death without rescaling',()=>{
 const e=new StoryEnemy('elite',10,100);e.attackLife=.2;e.brawlerFrame=12;assert.equal(schoolEnemyFrame(e),9);e.brawlerFrame=14;assert.equal(schoolEnemyFrame(e),10);
 e.attackLife=0;e.hitstun=.1;assert.equal(schoolEnemyFrame(e),12);e.hp=0;e.deadTime=1;assert.equal(schoolEnemyFrame(e),15);
});
test('recovered native poses select the eight walk drawings by distance at every story scale',async()=>{
 const native=JSON.parse(await readFile('assets/story/enemy-animation-v5.json','utf8'));
 for(const id of ['aula','exo','substitute','fairRobot'])for(const scale of [.65,1]){
  const e=new StoryEnemy(id,10,100);e.state='walk';e.worldScale=scale;
  for(let index=0;index<8;index++){
   e.brawlerWalkDistance=(index+.25)/8*native[id].sequences.walkTempo*scale;
   assert.equal(schoolEnemyFrame(e,native[id]),index,`${id}: walk ${index}`);
  }
  e.state='idle';assert.equal(schoolEnemyFrame(e,native[id]),0);
 }
 const drone=new StoryEnemy('archaeologist',10,100);drone.state='walk';
 for(let index=0;index<8;index++){drone.animTime=(index+.25)/8;assert.equal(schoolEnemyFrame(drone,native.archaeologist),index);}
});
test('native boss poses keep the existing melee contact tick and show shots at their spawn',async()=>{
 const meta=JSON.parse(await readFile('assets/story/enemy-animation-v5.json','utf8'));
 for(const id of ['exo','substitute']){
  const e=new StoryEnemy(id,10,100),n=meta[id];e.telegraph=.2;assert.equal(schoolEnemyFrame(e,n),n.sequences.windup);
  e.telegraph=0;e.attackLife=.2;e.attackMode='staff';e.brawlerFrame=10;assert.equal(schoolEnemyFrame(e,n),n.sequences.windup);
  e.brawlerFrame=11;assert.equal(schoolEnemyFrame(e,n),n.sequences.contact);
  e.brawlerFrame=10;e.brawlerReverse=true;assert.equal(schoolEnemyFrame(e,n),n.sequences.recovery);
  e.attackLife=0;e.hitstun=.1;assert.equal(schoolEnemyFrame(e,n),n.sequences.hit);
  e.hitstun=0;e.hp=0;e.deadTime=0;assert.equal(schoolEnemyFrame(e,n),13);e.deadTime=1;assert.equal(schoolEnemyFrame(e,n),15);
 }
 const exo=new StoryEnemy('exo',10,100);exo.attackLife=.3;exo.brawlerFrame=11;exo.attackMode='charge';assert.equal(schoolEnemyFrame(exo,meta.exo),11);
 exo.attackMode='slam';assert.equal(schoolEnemyFrame(exo,meta.exo),9);
 const drone=new StoryEnemy('archaeologist',10,100);drone.attackLife=.3;drone.attackMode='shot';drone.brawlerFrame=12;assert.equal(schoolEnemyFrame(drone,meta.archaeologist),9);
});
test('recovered atlases retain the four approved animation records and have bounded whole poses',async()=>{
 const before=JSON.parse(await readFile('assets/story/enemy-animation-v4.json','utf8'));
 const after=JSON.parse(await readFile('assets/story/enemy-animation-v5.json','utf8'));
 for(const id of Object.keys(before))assert.deepEqual(after[id],before[id]);
 for(const id of ['archaeologist','aula','exo','substitute','fairRobot']){
  const sheet=after[id];assert.equal(sheet.frames.length,16);assert.ok(sheet.scale>0);
  assert.equal(new Set(sheet.sequences.walk).size,8);
  for(const f of sheet.frames){assert.ok(f.rect.every(Number.isInteger));assert.ok(f.rect[2]>0&&f.rect[3]>0);assert.equal(f.height,f.rect[3]);assert.ok(f.anchorX>=0&&f.anchorX<f.rect[2]);assert.equal(f.bottom,f.height);}
  assert.ok(sheet.frames[15].height<sheet.frames[0].height,'the defeated pose must retain its lower source height');
 }
});
test('render interpolation retains school profile and does not mutate simulation',()=>{
 const e=new StoryEnemy('cleaner',10,400);e.prevX=200;e.prevY=e.y;e.prevLane=520;e.lane=620;const view=interpolateEntity(e,.5);
 assert.equal(view.x,300);assert.equal(view.lane,570);assert.equal(view.profile,e.profile);assert.equal(e.x,400);assert.equal(e.lane,620);
});
test('depth orders feet without changing actor or collision size',()=>{
 assert.equal(storyDepthScale(520),1);assert.equal(storyDepthScale(660),1);
 assert.equal(storyDepthScale(590),storyDepthScale(550));assert.equal(storyDepthScale(undefined),1);
});
test('current renderer never loads reference-game characters',async()=>{
 const src=await readFile('src/story-render.js','utf8');assert.doesNotMatch(src,/mostafa\/|mostafaAtlas|art\.brawler/);
 const html=await readFile('index.html','utf8');assert.match(html,/id="game-shell"/);assert.match(html,/data-menu="story"/);
});
