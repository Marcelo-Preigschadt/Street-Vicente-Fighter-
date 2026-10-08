import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FightEngine,CHARACTERS,FIXED_STEP,fighterPose} from '../src/engine.js';
import {STORY_HEROES} from '../src/story-data.js';
import {SELECTION_QUOTES} from '../src/selection-data.js';
import {SOUNDS} from '../src/audio.js';

test('Khauãny integra os dois modos com atlas proporcionais e quatro falas PCM',async()=>{
  const id='khauany',metadata=JSON.parse(await readFile(new URL('../assets/runtime/khauany-v1.json',import.meta.url)));
  assert.ok(STORY_HEROES.includes(id));
  assert.equal(SELECTION_QUOTES[id],'Você veio lutar ou só fazer figuração?');
  assert.equal(CHARACTERS[id].strikes.kick.reach,204);
  for(const atlas of ['base','combat']){
    const {scale,frames}=metadata.atlases[atlas];
    assert.equal(frames.length,16);
    assert.ok(Math.abs(frames[0].h*scale-300)<1);
    for(const frame of frames)assert.ok(frame.w>80&&frame.h>85&&frame.rect.length===4);
  }
  for(const move of ['select','special','uppercut','super']){
    const bytes=await readFile(new URL(`../${SOUNDS[`${id}-${move}`]}`,import.meta.url));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
    assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
  }
});

test('poder lança garfo e super emite cinco garfos, mantendo pose própria',()=>{
  const events=[],engine=new FightEngine({onEvent:e=>events.push(e)});
  const advance=seconds=>{for(let i=0;i<seconds/FIXED_STEP;i++)engine.update(FIXED_STEP);};
  engine.start('khauany','cpu','rafael');engine.phase='fight';engine.fighters[0].meter=100;
  assert.deepEqual(fighterPose(engine.fighters[0]),{atlas:'base',index:0});
  engine.queue(0,'special',1);advance(.25);
  assert.ok(events.some(e=>e.type==='projectile'&&e.character==='khauany'&&e.effect==='forkVolley'));
  engine.start('khauany','cpu','rafael');engine.phase='fight';engine.fighters[0].meter=100;events.length=0;
  engine.queue(0,'super',1);advance(1.2);
  assert.equal(events.filter(e=>e.type==='projectile'&&e.effect==='forkStorm').length,5);
});
