import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {spriteComponents} from '../src/sprite-extraction.js';
import {PREPARED_SPRITE_VERSIONS,MOTION_SPRITE_STEMS,preparedSpriteStem,validateSpriteMetadata} from '../src/sprite-loader.js';

function fixture(w=110,h=100){
  const pixels=new Uint8ClampedArray(w*h*4);
  const fill=(x,y,width,height)=>{for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)pixels[(yy*w+xx)*4+3]=255;};
  return {pixels,w,h,fill};
}

test('extração preserva uma bota separada por antialiasing sem importar o vizinho maior',()=>{
  const {pixels,w,h,fill}=fixture();fill(6,18,18,52);fill(25,71,13,5);fill(65,4,38,92);
  const part=spriteComponents(pixels,w,h,[0,0,w,h],{cell:[0,0,45,h]});
  assert.equal(part.count,18*52+13*5);assert.equal(part.bx2,37);assert.equal(part.by2,75);
  assert.ok(part.members.includes(73*w+34));assert.ok(!part.members.includes(40*w+80));
});

test('extração não fecha transparência legítima entre braço e tronco',()=>{
  const {pixels,w,h,fill}=fixture();fill(6,18,25,60);
  for(let y=25;y<42;y++)for(let x=13;x<19;x++)pixels[(y*w+x)*4+3]=0;
  const part=spriteComponents(pixels,w,h,[0,0,w,h],{cell:[0,0,45,h]});
  assert.ok(!part.members.includes(30*w+15));assert.equal(part.count,25*60-17*6);
});

test('extração não agrega uma partícula distante nem seleciona uma célula vazia pela figura do lado',()=>{
  const {pixels,w,h,fill}=fixture();fill(6,18,18,52);fill(38,82,5,5);fill(65,4,38,92);
  const part=spriteComponents(pixels,w,h,[0,0,w,h],{cell:[0,0,45,h]});assert.equal(part.count,18*52);
  assert.throws(()=>spriteComponents(pixels,w,h,[0,0,w,h],{cell:[45,0,60,h]}),/Sprite vazio/);
});

test('loader rejeita retângulos fora do atlas, dimensões incompatíveis e escala inválida',async()=>{
  const original=JSON.parse(await readFile(new URL('../assets/runtime/luciana-v1.json',import.meta.url)));
  const image={width:2048,height:4096};validateSpriteMetadata(original,image,'luciana');
  const badRect=structuredClone(original);badRect.atlases.combat.frames[3].rect[0]=2040;
  assert.throws(()=>validateSpriteMetadata(badRect,image,'luciana'),/combat\[3\].*fora/);
  const badSize=structuredClone(original);badSize.atlases.base.frames[0].h++;
  assert.throws(()=>validateSpriteMetadata(badSize,image,'luciana'),/dimensões divergentes/);
  const badScale=structuredClone(original);badScale.atlases.combat.frames[3].scale=NaN;
  assert.throws(()=>validateSpriteMetadata(badScale,image,'luciana'),/escala/);
});

test('todos os 12 atlas usados pelo loader existem, mantendo v2 de Tais e Dienes e a rasteira dedicada de Khauãny',async()=>{
  assert.equal(Object.keys(PREPARED_SPRITE_VERSIONS).length,12);
  for(const id of Object.keys(PREPARED_SPRITE_VERSIONS)){
    const stem=preparedSpriteStem(id);const data=JSON.parse(await readFile(new URL(`../${stem}.json`,import.meta.url)));
    const bitmap=await readFile(new URL(`../${stem}.webp`,import.meta.url));assert.ok(bitmap.length>1000,id);
    validateSpriteMetadata(data,{width:2048,height:8192},id);
  }
  assert.equal(preparedSpriteStem('khauany'),'assets/runtime/khauany-v2');
  assert.equal(preparedSpriteStem('tais'),'assets/runtime/tais-v2');
  assert.throws(()=>preparedSpriteStem('inventado'),/sem atlas preparado/);
});

test('a correção artística de Khauãny preserva pixel a pixel o retrato e as 31 poses aprovadas',()=>{
  const output=execFileSync('python3',['scripts/check-sprite-integrity.py','--verify-preserved'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert.deepEqual(JSON.parse(output),{unchangedPosesPixelExact:31,portraitPixelExact:true});
});

test('caminhada de Khauãny separa luvas e botas vizinhas, recupera as próprias e preserva os rostos da fonte',()=>{
  assert.equal(MOTION_SPRITE_STEMS.khauany,'assets/story/khauany-walk-v3');
  const output=execFileSync('python3',['scripts/check-sprite-integrity.py','--verify-walk'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  const proof=JSON.parse(output);
  assert.equal(proof.framesWithSourceExactRetainedPixels,8);
  assert.equal(proof.foreignWitnessesRemoved,5);assert.equal(proof.ownedWitnessesPreserved,4);
  assert.equal(Object.keys(proof.sourceExactOpaqueFacePixels).length,3);
  assert.ok(Object.values(proof.sourceExactOpaqueFacePixels).every(count=>count>12000));
});
