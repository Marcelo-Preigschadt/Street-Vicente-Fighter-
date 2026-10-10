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
 const html=await readFile('index.html','utf8');assert.match(html,/id="game-shell"/);assert.match(html,/data-menu="story"/);assert.match(html,/data-menu="versus"/);
});
