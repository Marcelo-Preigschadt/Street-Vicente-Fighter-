import test from 'node:test';
import assert from 'node:assert/strict';
import {FightEngine,CHARACTERS,FIXED_STEP,fighterPose} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {resetFeet} from '../src/locomotion.js';
import {paintedGeometry,evaluatePaintedPose,renderedFeet} from '../src/painted-motion.js';
import {entityScale} from '../src/story-world.js';
import {snapshot,applySnapshot} from '../src/net-state.js';

function setup(id,mode,facing){
 const e=mode==='versus'?new FightEngine():new StoryEngine();
 e.start(id,mode==='versus'?'local':'story-local',id==='rafael'?'marcelo':'rafael');
 if(mode==='versus')e.phase='fight';else{e.queue(0,'storyNext');e.clearField();e.story.wave=1;}
 const f=e.fighters[0];f.x=640;f.prevX=f.x;f.direction=facing;e.fighters[1].x=facing>0?1210:70;resetFeet(f);
 e.setInput(0,{left:facing<0,right:facing>0});return {e,f};
}
for(const id of Object.keys(CHARACTERS))test(`${id}: oito pinturas completas, apoio estável e anatomia rígida nas duas orientações e modos`,()=>{
 const seen=new Set();
 for(const mode of ['versus','story'])for(const facing of [1,-1]){
  const {e,f}=setup(id,mode,facing);let lastRoot=null,lastPaint=null,oldFeet=null;
  for(let tick=0;tick<120;tick++){
   e.update(FIXED_STEP);const pose=fighterPose(f),g=paintedGeometry(f,pose),p=evaluatePaintedPose(f,g);
   if(!p?.rigid){lastRoot=null;lastPaint=null;oldFeet=null;continue;}
   seen.add(pose.index);assert.ok(f.motion.paint);
   for(let joint=0;joint<17;joint++){
    assert.ok(Math.abs(p.joints[joint*2]-g.points[joint][0]-p.shift)<1e-9);
    assert.ok(Math.abs(p.joints[joint*2+1]-g.points[joint][1]-p.down)<1e-9);
   }
   const root=f.motion.paint.rootX,feet=renderedFeet(f),s=entityScale(f);
   if(lastRoot!==null)assert.ok(Math.abs(root-lastRoot)<12*s,`${id} corpo saltou ${root-lastRoot}`);
   if(lastPaint&&oldFeet)for(let side=0;side<2;side++)if(oldFeet[side].support&&feet[side].support){assert.ok(Math.abs(feet[side].x-oldFeet[side].x)<1e-9);assert.equal(feet[side].lane,oldFeet[side].lane);}
   lastRoot=root;lastPaint=f.motion.paint;oldFeet=feet.map(foot=>({...foot}));
  }
 }
 assert.equal(seen.size,8);
});

test('snapshot restaura o apoio da pintura e a próxima passada sem divergência',()=>{
 const {e:a,f}=setup('khauany','versus',1);for(let i=0;i<35;i++)a.update(FIXED_STEP);
 const {e:b}=setup('khauany','versus',1);assert.ok(applySnapshot(b,structuredClone(snapshot(a,1))));
 for(let i=0;i<40;i++){a.update(FIXED_STEP);b.update(FIXED_STEP);assert.deepEqual(b.fighters[0].motion.paint,f.motion.paint);}
});

test('limite da câmera resolve a posição antes de escolher contatos de caminhada',()=>{
 const {e,f}=setup('rafael','story',-1);f.x=120;f.prevX=120;resetFeet(f);f.runUntil=10;
 for(let i=0;i<120;i++)e.update(FIXED_STEP);
 assert.equal(f.x,e.camera+70);assert.equal(f.motion.lastWorldX,f.x);
 const phase=f.motion.phase;e.update(FIXED_STEP);assert.equal(f.motion.phase,phase);
});
