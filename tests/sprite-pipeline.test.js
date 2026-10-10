import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownedSilhouette} from '../src/sprite-ownership.js';
import {CHARACTERS,Fighter,fighterPose} from '../src/engine.js';
import {ENEMY_TYPES} from '../src/story-data.js';
import {StoryEnemy} from '../src/story.js';
import {schoolEnemyFrame} from '../src/story-presentation.js';
import {machineRigPose} from '../src/machine-rig.js';
import {resetFeet} from '../src/locomotion.js';
import {paintedGeometry,evaluatePaintedPose} from '../src/painted-motion.js';
import {artMetadata} from './art-fixtures.js';
const read=path=>JSON.parse(readFileSync(path));
function fixture(){const width=120,height=100,pixels=new Uint8ClampedArray(width*height*4);return {pixels,width,height,rect(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels[(yy*width+xx)*4+3]=255;}};}
test('ownership retains a separated valid shoe and rejects a larger neighboring silhouette',()=>{
 const f=fixture();f.rect(15,15,24,50);f.rect(19,75,10,8);f.rect(76,0,40,98);
 const result=ownedSilhouette(f.pixels,f.width,{x:0,y:0,w:120,h:100},{x:0,y:0,w:60,h:100});
 assert.equal(result.mask[78*120+22],1);assert.equal(result.mask[50*120+90],0);assert.equal(result.components.length,2);
});
test('explicit ownership preserves detached hair beyond its cell without leaking adjacent art',()=>{
 const f=fixture();f.rect(18,30,24,50);f.rect(20,3,12,9);f.rect(90,0,20,80);
 const result=ownedSilhouette(f.pixels,f.width,{x:0,y:0,w:120,h:100},{x:0,y:20,w:60,h:80},{seeds:[[25,7]]});
 assert.equal(result.mask[7*120+25],1);assert.equal(result.mask[35*120+98],0);assert.equal(result.by1,3);
});
test('every fighter has eight complete walk poses with one clip scale and measured sole references',()=>{
 for(const id of Object.keys(CHARACTERS)){const walk=read(`assets/story/${id}-walk-v5.json`);assert.equal(walk.schemaVersion,2);const frames=walk.atlases.walk.frames;assert.equal(frames.length,8,id);assert.equal(new Set(frames.map(f=>f.scale)).size,1,id);for(const f of frames){assert.equal(f.landmarks.length,17);assert.equal(f.footContacts.length,2);assert.ok(f.w>50&&f.h>100);assert.ok(f.bottom>=f.h);}}
});
test('Khauãny sweep and aerial kick retain their active aliases and distinct preparation/recovery art',()=>{
 const art=artMetadata('khauany');for(const name of ['sweep','airkick'])assert.equal(art.atlases[name].frames.length,4);
 assert.deepEqual(art.atlases.combat.frames[14].sourceBounds,art.atlases.sweep.frames[2].sourceBounds);
 assert.deepEqual(art.atlases.combat.frames[3].sourceBounds,art.atlases.airkick.frames[2].sourceBounds);
 const contact=art.atlases.airkick.frames[2].contact;assert.equal(contact.move,'airKick');assert.ok(contact.game[0]>200&&contact.game[1]>130);
 assert.equal(new Set(art.atlases.sweep.frames.map(f=>f.rect.join(','))).size,4);
});
test('Dienes has separate damage, victory and rise clips; Luciana chambers her kick with guarded hands',()=>{
 const art=artMetadata('dienes');assert.equal(art.atlases.damage.frames.length,4);assert.equal(art.atlases.win.frames.length,2);assert.equal(art.atlases.getup.frames.length,2);
 assert.deepEqual(art.atlases.base.frames[11].sourceBounds,art.atlases.damage.frames[1].sourceBounds);
 const f=new Fighter('luciana',0);f.state='kick';f.action='kick';f.moveData={startup:.12,active:.1,recovery:.16};f.actionTime=.02;assert.deepEqual(fighterPose(f),{atlas:'combat',index:2});f.actionTime=.16;assert.deepEqual(fighterPose(f),{atlas:'base',index:9});
});
test('all sixteen enemies have native drawings or a mechanism appropriate to the original model',()=>{
 const clips=read('assets/story/enemy-animation-v7.json'),rigs=read('assets/story/machine-rigs-v6.json');
 for(const kind of Object.keys(ENEMY_TYPES)){assert.ok(clips[kind]||rigs[kind],kind);if(clips[kind]){assert.equal(clips[kind].frames.length,16,kind);assert.ok(clips[kind].scale>0);assert.equal(new Set(clips[kind].frames.map(f=>f.rect.join(','))).size,16,kind);}else assert.ok(rigs[kind].parts.length>=2);}
});
test('enemy rendering follows anticipation, contact, recovery, damage and defeat, even when flying',()=>{
 for(const kind of Object.keys(ENEMY_TYPES)){
  const e=new StoryEnemy(kind,10,640);e.telegraph=.2;assert.equal(schoolEnemyFrame(e),9,kind);e.telegraph=0;e.attackLife=.1;e.brawlerFrame=e.profile.boss?11:14;assert.equal(schoolEnemyFrame(e),10,kind);e.attackLife=0;e.recovery=.2;assert.equal(schoolEnemyFrame(e),11,kind);e.hitstun=.1;assert.equal(schoolEnemyFrame(e),12,kind);e.hitstun=0;e.recovery=0;e.hp=0;e.deadTime=.9;assert.equal(schoolEnemyFrame(e),15,kind);
 }
});
test('hovering creatures animate and wheel rotation reverses with world displacement',()=>{
 const e=new StoryEnemy('book',10,640);e.animTime=.05;const first=schoolEnemyFrame(e);e.animTime=.30;assert.notEqual(schoolEnemyFrame(e),first);
 const wheel=new StoryEnemy('cleaner',10,640);wheel.direction=1;const a=machineRigPose(wheel,1).wheel;wheel.x+=20;const b=machineRigPose(wheel,1).wheel;wheel.x-=40;const c=machineRigPose(wheel,1).wheel;assert.ok(b>a&&c<a);assert.equal(machineRigPose(wheel,100).wheel,c);
});
test('painted contact correction translates the face rigidly and does not stretch leg bones',()=>{
 for(const id of Object.keys(CHARACTERS))for(const direction of [1,-1]){
  const f=new Fighter(id,0);f.direction=direction;f.x=640;f.prevX=640;resetFeet(f);const pose=fighterPose(f),geometry=paintedGeometry(f,pose);assert.ok(geometry,id);
  const p=evaluatePaintedPose(f,geometry);assert.ok(p.maxStretch<=1.001,id);
  const head=geometry.points[2],neck=geometry.points[1];assert.ok(Math.abs((p.joints[4]-p.joints[2])-(head[0]-neck[0]))<1e-9,id);assert.ok(Math.abs((p.joints[5]-p.joints[3])-(head[1]-neck[1]))<1e-9,id);
 }
});
