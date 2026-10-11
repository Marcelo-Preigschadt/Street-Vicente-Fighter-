import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTERS,FIXED_STEP} from '../src/engine.js';
import {StoryEngine} from '../src/story.js';
import {referenceJoints} from '../src/locomotion-data.js';
import {handSockets,resetFeet} from '../src/locomotion.js';
import {carryBlend,carryHandTarget,CARRY_PICKUP_SECONDS} from '../src/carry-pose.js';
import {heldObjectTransform,STORY_PROP_DIMENSIONS,thrownObjectBounds} from '../src/story-props.js';
import {machineRigPose} from '../src/machine-rig.js';
import {snapshot,applySnapshot} from '../src/net-state.js';
const game=id=>{const e=new StoryEngine();e.start(id,'story-solo',id==='rafael'?'gustavo':'rafael');e.queue(0,'storyNext');return e;};
const advance=(e,seconds)=>{for(let t=0;t<seconds;t+=FIXED_STEP)e.update(FIXED_STEP);};

for(const id of Object.keys(CHARACTERS))test(`${id}: punhos virtuais do experimento mantêm continuidade e encaixe matemático nas duas orientações`,()=>{
  const e=game(id),f=e.fighters[0],reference=referenceJoints(id,new Float64Array(34));
  f.carry={kind:'chair',id:'continuity',elapsed:0};
  for(const side of [0,1]){
    f.carry.elapsed=0;
    const j=side?16:13,baseX=reference[j*2],baseY=reference[j*2+1];
    const initial=carryHandTarget(f,reference,side,{baseX,baseY});
    assert.equal(initial.x,baseX);assert.equal(initial.y,baseY);
    const samples=[];
    for(let t=0;t<=.18;t+=.003){f.carry.elapsed=t;samples.push(carryHandTarget(f,reference,side,{baseX,baseY}));}
    for(let i=1;i<samples.length;i++)assert.ok(Math.hypot(samples[i].x-samples[i-1].x,samples[i].y-samples[i-1].y)<2,'transição de punho deve ser contínua');
  }
  f.carry.elapsed=CARRY_PICKUP_SECONDS;
  for(const kind of ['chair','table'])for(const direction of [1,-1]){
    f.carry.kind=kind;f.direction=direction;resetFeet(f);
    const hands=handSockets(f),held=heldObjectTransform(f),size=STORY_PROP_DIMENSIONS[kind];
    for(const [sign,x,y]of [[-1,hands.leftX,hands.leftY],[1,hands.rightX,hands.rightY]]){
      const gx=sign*held.gripSpan/2*direction,gy=-size.height*.8;
      assert.ok(Math.abs(held.x+gx*Math.cos(held.angle)-gy*Math.sin(held.angle)-x)<1e-7);
      assert.ok(Math.abs(held.y+gx*Math.sin(held.angle)+gy*Math.cos(held.angle)-y)<1e-7);
    }
    const bounds=thrownObjectBounds({kind,x:held.centerX,y:held.centerY,angle:held.angle});
    assert.ok(Math.abs(bounds.x+bounds.w/2-held.centerX)<1e-7);assert.ok(Math.abs(bounds.y+bounds.h/2-held.centerY)<1e-7);
    assert.ok(bounds.w>0&&bounds.h>0);
  }
});

test('pickup elapsed é tempo de simulação, congela na pausa e participa do rollback',()=>{
  const e=game('ruan'),f=e.fighters[0],p=e.props.find(p=>p.kind==='chair');e.story.wave=3;e.camera=p.x-300;f.x=p.x;f.prevX=f.x;f.lane=p.lane;f.prevLane=f.lane;
  e.queue(0,'punch');assert.equal(f.carry.elapsed,0);advance(e,.08);assert.ok(carryBlend(f)>0&&carryBlend(f)<1);
  const peer=game('ruan');assert.ok(applySnapshot(peer,snapshot(e,1)));assert.equal(peer.fighters[0].carry.elapsed,f.carry.elapsed);
  e.paused=true;const age=f.carry.elapsed;e.update(.1);assert.equal(f.carry.elapsed,age);
});

test('pickup começa na posição visível do móvel, conserva profundidade e termina no suporte',()=>{
 for(const kind of ['chair','table'])for(const direction of [1,-1]){
  const e=game('marcelo'),f=e.fighters[0],p=e.props.find(p=>p.kind===kind);
  f.x=p.x;f.prevX=f.x;f.lane=p.lane-12;f.prevLane=f.lane;f.direction=direction;resetFeet(f);
  assert.ok(e.interact(f));const first=heldObjectTransform(f);
  assert.equal(first.x,p.x);assert.equal(first.y+f.lane,p.lane+625);assert.equal(first.angle,0);
  assert.equal(first.centerX,p.x);assert.equal(first.centerY+f.lane,p.lane+625-STORY_PROP_DIMENSIONS[kind].height/2);
  const samples=[];for(let tick=0;tick<=22;tick++){f.carry.elapsed=tick/120;samples.push({...heldObjectTransform(f)});}
  for(let tick=1;tick<samples.length;tick++)assert.ok(Math.hypot(samples[tick].centerX-samples[tick-1].centerX,samples[tick].centerY-samples[tick-1].centerY)<20);
  const completed=samples.at(-1);delete f.carry.originX;delete f.carry.originY;assert.deepEqual(heldObjectTransform(f),completed);
 }
});

test('ácido, gelo e eletricidade soltam a carga uma vez no centro desenhado',()=>{
  for(const id of ['marcelo','tais','khauany','dienes'])for(const direction of [1,-1]){
    const e=game(id),f=e.fighters[0];f.direction=direction;f.carry={kind:'table',id:'hazard',elapsed:.18};resetFeet(f);
    const held=heldObjectTransform(f);e.environmentHit(f,45,f.x,[]);
    assert.equal(f.carry,null);assert.equal(f.pendingThrow,null);assert.equal(e.thrown.length,1);
    assert.equal(e.thrown[0].x,held.centerX);assert.equal(e.thrown[0].y,held.centerY);assert.equal(e.thrown[0].facing,direction);
    f.invincible=.2;e.environmentHit(f,45,f.x,[]);assert.equal(e.thrown.length,1);
  }
});

test('rodas acompanham deslocamento real, recuam quando a IA orbita e não avançam pelo relógio',()=>{
  const e={x:400,direction:1,state:'walk',brawlerWalkDistance:100,attackLife:0,worldScale:.7};
  const a=machineRigPose(e,1),b=machineRigPose({...e,x:410},1.05),c=machineRigPose({...e,x:390},1.05);
  assert.ok(b.wheel>a.wheel);assert.ok(c.wheel<a.wheel);assert.equal(machineRigPose(e,20).wheel,a.wheel);
  assert.equal(machineRigPose(e,20,true).wheel,0);
});

test('braços mecânicos entram e saem da antecipação sem saltar de ângulo',()=>{
  const e={state:'idle',profile:{boss:false},attackLife:0};
  const idle=machineRigPose(e,1),start=machineRigPose({...e,telegraph:.16},1),end=machineRigPose({...e,recovery:.00001},1);
  assert.ok(Math.abs(start.upper-idle.upper)<1e-7);assert.ok(Math.abs(end.upper-idle.upper)<1e-6);
  const windup=machineRigPose({...e,telegraph:.00001},1),attack=machineRigPose({...e,attackLife:.25,brawlerFrame:12,brawlerFrameTime:0},1);
  assert.ok(Math.abs(attack.upper-windup.upper)<1e-6);
});
