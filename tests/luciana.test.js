import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FightEngine,FIXED_STEP,CHARACTERS,WORLD,fighterPose} from '../src/engine.js';
import {Renderer} from '../src/render.js';
import {validCharacter} from '../src/net-state.js';
import {STORY_HEROES} from '../src/story-data.js';
import {MMA_HURT} from '../src/mma-data.js';
import {FIGHTING_STYLES} from '../src/styles.js';
import {SELECTION_QUOTES} from '../src/selection-data.js';
import {SOUNDS} from '../src/audio.js';

const advance=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds/FIXED_STEP);i++)g.update(FIXED_STEP);};
function scene(move,slot=0,block=false,distance=160){
  const events=[],g=new FightEngine({random:()=>.47,onEvent:e=>events.push(e)});
  g.start(slot?'rafael':'luciana','local',slot?'luciana':'rafael');g.phase='fight';
  g.fighters[0].x=450;g.fighters[1].x=450+distance;
  const f=g.fighters[slot],target=g.fighters[1-slot];f.meter=100;
  g.setInput(1-slot,{block});assert.ok(g.beginMove(f,move,1));advance(g,1);
  return {g,events,f,target};
}

test('Luciana integra a seleção, a história e as 32 poses calibradas',async()=>{
  assert.ok(validCharacter('luciana'));assert.ok(STORY_HEROES.includes('luciana'));
  assert.equal(CHARACTERS.luciana.category,'teachers');assert.equal(FIGHTING_STYLES.luciana.name,'MMA · Trocação');
  const metadata=JSON.parse(await readFile(new URL('../assets/runtime/luciana-v1.json',import.meta.url)));
  for(const atlas of ['base','combat']){
    assert.equal(metadata.atlases[atlas].frames.length,16);assert.equal(MMA_HURT[atlas].length,16);
    for(const bands of MMA_HURT[atlas])assert.ok(bands.length>=2&&bands.every(([x,y,w,h])=>[x,y,w,h].every(Number.isFinite)&&w>0&&h>0));
  }
  const game=new FightEngine();game.start('luciana','local','rafael');
  assert.equal(fighterPose(game.fighters[0]).atlas,'base');
  assert.match(SELECTION_QUOTES.luciana,/trocação.*ponto final/i);
});

test('pose de nocaute exclui o tênis solto e permanece inteira nas bordas',async()=>{
  const metadata=JSON.parse(await readFile(new URL('../assets/runtime/luciana-v1.json',import.meta.url)));
  const frame=metadata.atlases.base.frames[15],scale=metadata.atlases.base.scale;
  assert.ok(frame.h<120,'o quadro deve conter apenas a lutadora caída');
  for(const direction of [-1,1])for(const x of [110,1170]){
    const translations=[],c={save(){},restore(){},translate(a,b){translations.push([a,b]);},scale(){},drawImage(){}};
    const fighter={character:CHARACTERS.luciana,x,y:WORLD.floor,direction,state:'ko',invincible:0,
      blockFlash:0,flash:0,customTime:0};
    Renderer.prototype.drawFighter.call({c,clock:0,reduced:true},fighter,{sheet:{scale,frames:[frame]},index:0});
    const drawX=translations[0][0],left=(frame.x-frame.anchor)*scale,right=left+frame.w*scale;
    const min=direction>0?left:-right,max=direction>0?right:-left;
    assert.ok(drawX+min>=8-1e-8);assert.ok(drawX+max<=WORLD.width-8+1e-8);
  }
});

test('a seleção e os três poderes têm falas locais da mesma voz',async()=>{
  for(const move of ['select','special','uppercut','super']){
    const clip=SOUNDS[`luciana-${move}`];assert.ok(clip);
    const data=await readFile(new URL(`../${clip}`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');
    assert.equal(data.toString('ascii',8,12),'WAVE');
    assert.ok(data.length>40000,`${move} não deve ser mudo`);
  }
});

test('golpes de português e espanhol usam contato de MMA nos dois sentidos',()=>{
  for(const move of ['special','uppercut','super'])for(const slot of [0,1])for(const blocked of [false,true]){
    const {g,events,f,target}=scene(move,slot,blocked);
    assert.equal(events.filter(e=>e.type==='special'&&e.move===move&&e.fighter===slot).length,1);
    assert.equal(events.filter(e=>e.type===(blocked?'block':'hit')&&e.move===move).length,1);
    assert.ok(blocked?target.hp>=970:target.hp<900);
    assert.equal(g.projectiles.length,0);assert.equal(g.drones.length,0);
    if(move==='super')assert.ok(f.meter<100);
  }
});

test('golpes de contato erram fora do alcance',()=>{
  for(const move of ['special','uppercut','super']){
    const {g,events,target}=scene(move,0,false,600);
    assert.equal(target.hp,1000);assert.equal(events.filter(e=>e.type==='hit'&&e.move===move).length,0);
    assert.equal(g.projectiles.length,0);
  }
});
