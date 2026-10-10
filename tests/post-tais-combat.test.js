import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FightEngine,FIXED_STEP,WORLD,fighterPose} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {FIGHTING_STYLES} from '../src/styles.js';
import {RIG_BIND,GAITS,referenceJoints} from '../src/locomotion-data.js';
import {resetFeet,evaluateRig,usesRig} from '../src/locomotion.js';
import {paintedGeometry,evaluatePaintedPose} from '../src/painted-motion.js';

const ids=['luciana','khauany','dienes'];
const advance=(game,seconds)=>{for(let i=0;i<Math.ceil(seconds/FIXED_STEP);i++)game.update(FIXED_STEP);};

test('o ciclo visual usa oito pinturas completas e escala constante em todo o clipe',async()=>{
  for(const id of ids){
    const frames=JSON.parse(await readFile(new URL(`../assets/story/${id}-walk-v5.json`,import.meta.url))).atlases.walk.frames;
    assert.equal(frames.length,8,id);
    assert.equal(new Set(frames.map(f=>f.scale)).size,1,id);
    for(const frame of frames){assert.ok(frame.h>470&&frame.w>190,id);assert.equal(frame.landmarks.length,17);assert.equal(frame.footContacts.length,2);}
    const game=new FightEngine();game.start(id,'local','rafael');game.phase='fight';
    const f=game.fighters[0];f.state='walk';f.walkBlend=1;
    const stride=GAITS[id].stride;
    const seen=new Set();
    for(let i=0;i<8;i++){f.walkDistance=i*stride/8;const pose=fighterPose(f);assert.equal(pose.atlas,'motion');seen.add(pose.index);}
    assert.equal(seen.size,8,id);
  }
});

test('a malha da ginga usa as dimensões e o eixo dos sprites que são desenhados',async()=>{
  for(const id of ids){
    const manifest=JSON.parse(await readFile(new URL(`../assets/runtime/${id}-v${id==='dienes'?2:1}.json`,import.meta.url)));
    const frame=manifest.atlases.base.frames[0],bind=RIG_BIND[id];
    assert.deepEqual([bind.w,bind.h,bind.axis],[frame.w,frame.h,frame.anchor],id);
    assert.ok(Math.abs(frame.h*manifest.atlases.base.scale-GAITS[id].height)<1,id);
  }
});

test('as personagens novas têm apoios alternados e não esticam as pernas nos dois sentidos',()=>{
  for(const id of ids)for(const slot of [0,1])for(const backwards of [false,true]){
    const game=new FightEngine();game.start(slot?'rafael':id,'local',slot?id:'rafael');game.phase='fight';
    const f=game.fighters[slot],other=game.fighters[1-slot];f.x=slot?1050:200;other.x=slot?100:1200;
    f.prevX=f.x;resetFeet(f);
    const direction=f.direction*(backwards?-1:1),reference=referenceJoints(id,new Float64Array(34));
    game.setInput(slot,{left:direction<0,right:direction>0});let planted=0,swing=0;
    for(let tick=0;tick<95;tick++){
      const feet=f.motion.feet.map(foot=>({...foot}));game.update(FIXED_STEP);
      assert.ok(usesRig(f),`${id} P${slot+1} tick ${tick}`);
      const joints=evaluateRig(f);assert.ok(joints);
      for(const [index,h,k,a] of [[0,3,4,5],[1,7,8,9]]){
        const foot=f.motion.feet[index];if(feet[index].support&&foot.support){
          assert.equal(foot.x,feet[index].x);planted++;
        }
        if(foot.lift>1)swing++;
        assert.ok(Math.abs(f.x+joints[a*2]*f.direction-foot.x)<1e-6);
        const length=(p,i,j)=>Math.hypot(p[2*i]-p[2*j],p[2*i+1]-p[2*j+1]);
        const ratio=(length(joints,h,k)+length(joints,k,a))/(length(reference,h,k)+length(reference,k,a));
        assert.ok(ratio<1.08,`${id} ${ratio}`);
      }
    }
    assert.ok(planted>45&&swing>10,id);
  }
});

test('golpes e poderes acertam, geram efeitos e recuperam a posição nos dois lados',()=>{
  for(const id of ids)for(const slot of [0,1])for(const move of ['punch','kick','crouchPunch','sweep','airPunch','airKick','special','uppercut','super']){
    const events=[],game=new FightEngine({random:()=>.47,onEvent:event=>events.push(event)});
    game.start(slot?'rafael':id,'local',slot?id:'rafael');game.phase='fight';
    const f=game.fighters[slot],opponent=game.fighters[1-slot];
    game.fighters[0].x=460;game.fighters[1].x=630;f.meter=100;
    if(move.startsWith('air')){f.y=WORLD.floor-90;f.vy=0;}
    if(move==='crouchPunch'||move==='sweep')game.setInput(slot,{down:true});
    assert.ok(game.beginMove(f,move,1),`${id} ${move} P${slot+1} início`);
    // Cada acerto interrompe a simulação por hitstop; o super tem várias ondas.
    advance(game,3.1);
    assert.ok(opponent.hp<1000,`${id} ${move} P${slot+1} contato`);
    assert.equal(f.y,WORLD.floor,`${id} ${move} P${slot+1} aterrissagem`);
    assert.equal(f.action,null,`${id} ${move} P${slot+1} recuperação`);
    if(['special','uppercut','super'].includes(move)){
      assert.equal(events.filter(event=>event.type==='special'&&event.move===move&&event.fighter===slot).length,1);
      const expected=move==='super'?{luciana:3,khauany:5,dienes:4}[id]:move==='special'?1:0;
      assert.equal(events.filter(event=>event.type==='projectile'&&event.fighter===slot).length,expected);
    }
  }
});

test('Dienes se levanta, pousa e prepara o salto de pé; a pose caída fica só no nocaute',()=>{
  const game=new FightEngine();game.start('dienes','local','rafael');const f=game.fighters[0];
  for(const state of ['wake','landing','preJump','throw']){
    f.state=state;assert.notEqual(fighterPose(f).index,15,state);
  }
  f.state='ko';assert.deepEqual(fighterPose(f),{atlas:'base',index:15});
});

test('Khauãny mantém duas pernas apoiadas na rasteira e usa o chute horizontal no ar',()=>{
  const game=new FightEngine();game.start('khauany','local','rafael');game.phase='fight';
  const f=game.fighters[0];game.setInput(0,{down:true});
  assert.ok(game.beginMove(f,'sweep'));
  advance(game,f.moveData.startup+FIXED_STEP);
  assert.deepEqual(fighterPose(f),{atlas:'combat',index:14});
  assert.equal(f.y,WORLD.floor);
  assert.equal(f.attackbox.w,148);
  const air=new FightEngine();air.start('khauany','local','rafael');air.phase='fight';
  const airborne=air.fighters[0];airborne.y=WORLD.floor-90;
  assert.ok(air.beginMove(airborne,'airKick'));
  advance(air,airborne.moveData.startup+FIXED_STEP);
  assert.deepEqual(fighterPose(airborne),{atlas:'combat',index:3});
});

test('Luciana usa a pose de levantar, não a de cair para trás',()=>{
  const game=new FightEngine();game.start('luciana','local','rafael');
  const f=game.fighters[0];f.state='wake';
  assert.deepEqual(fighterPose(f),{atlas:'combat',index:14});
});

test('os chutes de Luciana e Khauãny preservam a guarda na preparação e recuperação',()=>{
  for(const [id,active] of [['luciana',9],['khauany',9]]){
    const game=new FightEngine();game.start(id,'local','rafael');game.phase='fight';
    const f=game.fighters[0];assert.ok(game.beginMove(f,'kick'));
    const chamber=id==='luciana'?{atlas:'combat',index:2}:{atlas:'base',index:0};
    assert.deepEqual(fighterPose(f),chamber,id+' preparação');
    advance(game,f.moveData.startup+FIXED_STEP);
    assert.deepEqual(fighterPose(f),{atlas:'base',index:active},id+' contato');
    advance(game,f.moveData.active+FIXED_STEP);
    assert.deepEqual(fighterPose(f),chamber,id+' recuperação');
  }
});

test('Dienes usa desenhos compatíveis com seus golpes e não mostra reação ao agarrar',()=>{
  const game=new FightEngine();game.start('dienes','local','rafael');game.phase='fight';
  const f=game.fighters[0];
  for(const move of ['crouchPunch','sweep']){
    assert.ok(game.beginMove(f,move));
    assert.deepEqual(fighterPose(f),{atlas:'combat',index:12},move+' preparação');
    f.actionTime=f.moveData.startup+FIXED_STEP;
    assert.deepEqual(fighterPose(f),{atlas:'combat',index:move==='sweep'?4:0},move+' contato');
    f.action=null;f.moveData=null;f.state='idle';
  }
  f.state='throw';assert.deepEqual(fighterPose(f),{atlas:'combat',index:11});
  f.state='landing';assert.deepEqual(fighterPose(f),{atlas:'base',index:0});
});

test('Khauãny recebe o final alto do combo do Gustavo nos dois lados',()=>{
  const route=FIGHTING_STYLES.gustavo.combos.find(combo=>combo.name==='Final Circular');
  for(const slot of [0,1]){
    const events=[],game=new FightEngine({random:()=>.6,onEvent:event=>events.push(event)});
    game.start(slot?'khauany':'gustavo','local',slot?'gustavo':'khauany');game.phase='fight';
    game.fighters[0].x=450;game.fighters[1].x=570;
    for(const [index,step] of route.steps.entries()){
      const [move,strength]=step.split(':');game.queue(slot,move,Number(strength));
      for(let i=0;i<180&&events.filter(event=>event.type==='hit'&&event.fighter===slot).length<index+1;i++)game.update(FIXED_STEP);
      assert.equal(events.filter(event=>event.type==='hit'&&event.fighter===slot).length,index+1,`P${slot+1} ${step}`);
    }
  }
});

test('na história, poderes das personagens novas atingem adversários e não perdem a ginga',()=>{
  for(const id of ids)for(const meter of [25,100]){
    const events=[],game=new StoryEngine({onEvent:event=>events.push(event)});
    game.start(id,'story-solo','rafael');game.queue(0,'storyNext');
    const f=game.fighters[0];f.x=350;f.meter=meter;
    const enemy=game.spawnEnemy('lab',650);enemy.aiTime=100;enemy.cooldown=100;
    game.queue(0,'storySpecial');advance(game,1.6);
    assert.ok(events.some(event=>event.type==='projectile'&&event.character===id),`${id} projétil na história`);
    assert.ok(enemy.hp<enemy.maxHp,`${id} dano na história`);
    assert.ok(Number.isFinite(evaluateRig(f)?.[0]),`${id} ginga após o poder`);
  }
});
