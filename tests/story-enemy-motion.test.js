import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {StoryEngine,StoryEnemy} from '../src/story.js';
import {FIXED_STEP} from '../src/engine.js';
import {ENEMY_TYPES} from '../src/story-data.js';
import {resetFeet,updateLocomotion,saveMotion} from '../src/locomotion.js';
import {entityScale} from '../src/story-world.js';
import {ENEMY_MOTION,enemyAttackPose,enemyFlightPose,updateEnemyMechanicalFeet,mechanicalWalkerPose,mechanicalHurtboxes} from '../src/story-enemy-motion.js';
import {STORY_MECHANICAL_WALKERS} from '../src/story-mechanical-data.js';
import {snapshot,applySnapshot} from '../src/net-state.js';
const clone=x=>JSON.parse(JSON.stringify(x)),length=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const game=()=>{const e=new StoryEngine();e.start('marcelo','story-solo','rafael',{seed:84736});e.queue(0,'storyNext');e.story.wave=3;e.story.dropWave=3;e.props=[];e.hazards=[];e.enemies=[];return e;};

test('mapa dos 16 inimigos respeita o mecanismo e a anatomia original',()=>{
  assert.deepEqual(Object.keys(ENEMY_MOTION).sort(),Object.keys(ENEMY_TYPES).sort());
  assert.equal(ENEMY_MOTION.vial,'tripod');assert.equal(STORY_MECHANICAL_WALKERS.vial.legs.length,3);
  assert.equal(ENEMY_MOTION.scanner,'mechanical-biped');assert.equal(STORY_MECHANICAL_WALKERS.scanner.legs.length,2);
  for(const kind of ['book','archaeologist','aula','projector'])assert.ok(!STORY_MECHANICAL_WALKERS[kind]);
});

test('atlas desenhado e dados físicos têm exatamente os mesmos pivôs e peças',async()=>{
  assert.deepEqual(JSON.parse(await readFile(new URL('../assets/story/mechanical-walkers-v1.json',import.meta.url))),STORY_MECHANICAL_WALKERS);
});

for(const kind of ['vial','scanner'])for(const facing of [1,-1])test(`${kind}/${facing}: metal não alonga, apoios chegam ao alvo em avanço, recuo e profundidade`,()=>{
  const spec=STORY_MECHANICAL_WALKERS[kind],e=new StoryEnemy(kind,2,400);e.direction=facing;resetFeet(e);
  for(let tick=0;tick<720;tick++){
    saveMotion(e);e.prevX=e.x;e.prevLane=e.lane;e.state='walk';e.animTime+=FIXED_STEP;
    const direction=tick<240?1:-1;e.x+=direction*e.profile.speed*entityScale(e)*FIXED_STEP;
    e.lane=625+Math.sin(tick/100)*38;e.vx=direction*e.profile.speed*entityScale(e);
    updateLocomotion(e,FIXED_STEP);updateEnemyMechanicalFeet(e,FIXED_STEP);
    const before=clone(e.tripodFoot),pose=mechanicalWalkerPose(e,spec);
    assert.deepEqual(e.tripodFoot,before,'avaliar a pose não deve mudar a simulação');
    assert.ok(Number.isFinite(pose.shift)&&Number.isFinite(pose.down));
    for(let i=0;i<spec.legs.length;i++){
      const p=pose.legs[i],r=spec.legs[i];
      assert.ok(Math.abs(length(p.hip,p.knee)-length(r.hip,r.knee))<1e-7,'comprimento da coxa metálica');
      assert.ok(Math.abs(length(p.knee,p.toe)-length(r.knee,r.toe))<1e-7,'comprimento da haste inferior');
      assert.ok(p.reachable,`apoio ${i} inacessível no tick ${tick}`);
      assert.ok(length(p.toe,p.target)<1e-6);
    }
    if(kind==='vial'&&e.tripodFoot.support&&before.support){assert.equal(e.tripodFoot.lift,0);if(tick&&e.tripodFoot.prevLift===0)assert.equal(e.tripodFoot.x,e.tripodFoot.prevX,'pé central plantado permanece no mundo');}
    const boxes=mechanicalHurtboxes(e);assert.equal(boxes.length,1+spec.legs.length*2);assert.deepEqual(e.hurtboxes,boxes);
  }
});

test('apoio central participa da restauração de campanha e do replay determinístico',()=>{
  const e=game();e.spawnEnemy('vial',780,595);e.spawnEnemy('scanner',860,650);
  for(let i=0;i<75;i++)e.update(FIXED_STEP);
  const state=clone(snapshot(e,1)),peer=game();assert.ok(applySnapshot(peer,state));
  assert.deepEqual(peer.enemies[0].tripodFoot,e.enemies[0].tripodFoot);
  assert.deepEqual(peer.exportStoryState(),e.exportStoryState());
  for(let i=0;i<360;i++){const input={right:i<100,up:i>=100&&i<200,block:i>=280};e.setInput(0,input);peer.setInput(0,input);e.update(FIXED_STEP);peer.update(FIXED_STEP);assert.deepEqual(peer.exportStoryState(),e.exportStoryState(),`replay divergiu no tick ${i}`);}
  e.paused=true;const feet=clone(e.enemies.map(x=>x.tripodFoot));e.update(FIXED_STEP);assert.deepEqual(e.enemies.map(x=>x.tripodFoot),feet);
});

test('extensão respeita o contato real 14/11 e retrai continuamente na recuperação',()=>{
  for(const boss of [false,true]){
    const contact=boss?11:14,fps=boss?11.25:16.25,recovery=boss?.45:.25,e={profile:{boss},attackLife:.1,brawlerFrame:contact-1,brawlerFrameTime:0,brawlerReverse:false};
    const pre=enemyAttackPose({...e,brawlerFrameTime:(1-1e-8)/fps}),hit=enemyAttackPose({...e,brawlerFrame:contact});assert.ok(Math.abs(pre.thrust-hit.thrust)<1e-7);
    const back=enemyAttackPose({...e,brawlerFrame:contact-1,brawlerReverse:true});assert.equal(back.thrust,hit.thrust);
    const start=enemyAttackPose({...e,attackLife:0,brawlerFrame:contact,recovery});assert.equal(start.thrust,hit.thrust);
    const finish=enemyAttackPose({...e,attackLife:0,brawlerFrame:contact,recovery:1e-8});assert.ok(finish.thrust<1e-10&&finish.anticipation<1e-10);
  }
});

test('hélices, cabos e holograma usam tempo de simulação e respeitam movimento reduzido',()=>{
  for(const kind of ['book','archaeologist','aula','projector']){
    const e=new StoryEnemy(kind,2,400);e.animTime=3;e.vx=100;const a=enemyFlightPose(e);assert.deepEqual(enemyFlightPose(e),a);assert.ok(Math.abs(a.bank)<=.074);
    const reduced=enemyFlightPose(e,true);assert.equal(reduced.bank,0);assert.equal(reduced.hover,0);assert.equal(reduced.rotor,0);assert.equal(reduced.cable,0);
  }
});
