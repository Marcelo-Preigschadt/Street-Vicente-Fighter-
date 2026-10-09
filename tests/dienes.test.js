import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FightEngine,CHARACTERS,FIXED_STEP,fighterPose} from '../src/engine.js';
import {STORY_HEROES} from '../src/story-data.js';
import {SELECTION_QUOTES} from '../src/selection-data.js';
import {SOUNDS} from '../src/audio.js';
import {DIENES_HURT} from '../src/dienes-data.js';

test('Dienes tem poses isoladas na altura do elenco e quatro falas PCM',async()=>{
  const id='dienes',metadata=JSON.parse(await readFile(new URL('../assets/runtime/dienes-v2.json',import.meta.url)));
  assert.ok(STORY_HEROES.includes(id));
  assert.equal(SELECTION_QUOTES[id],'Boa sorte, vai precisar');
  assert.equal(CHARACTERS[id].category,'students');
  for(const atlas of ['base','combat']){
    const {scale,frames}=metadata.atlases[atlas];assert.equal(frames.length,16);
    assert.ok(Math.abs(frames[0].h*scale-300)<1);
    assert.equal(DIENES_HURT[atlas].length,16);
    for(const frame of frames)assert.ok(frame.w>90&&frame.h>80&&frame.rect.length===4);
  }
  for(const move of ['select','special','uppercut','super']){
    const bytes=await readFile(new URL(`../${SOUNDS[`${id}-${move}`]}`,import.meta.url));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');
    assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
  }
});

test('giz e livros saem como projéteis distintos em luta',()=>{
  const events=[],engine=new FightEngine({onEvent:e=>events.push(e)});
  const advance=seconds=>{for(let i=0;i<seconds/FIXED_STEP;i++)engine.update(FIXED_STEP);};
  engine.start('dienes','cpu','rafael');engine.phase='fight';engine.fighters[0].meter=100;
  assert.deepEqual(fighterPose(engine.fighters[0]),{atlas:'base',index:0});
  engine.queue(0,'special',1);advance(.3);
  assert.ok(events.some(e=>e.type==='projectile'&&e.character==='dienes'&&e.effect==='chalkShot'));
  engine.start('dienes','cpu','rafael');engine.phase='fight';engine.fighters[0].meter=100;events.length=0;
  engine.queue(0,'super',1);advance(1.1);
  assert.equal(events.filter(e=>e.type==='projectile'&&e.effect==='bookStorm').length,4);
});
