import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CHARACTERS} from '../src/engine.js';
import {loadPreparedSprites} from '../src/sprite-loader.js';
import {ArcadeAudio} from '../src/audio.js';
import {RUNTIME_VERSIONS} from '../src/sprite-loader.js';
const bytes=path=>readFile(new URL(`../${path}`,import.meta.url));
test('atlas preparados preservam todos os quadros, escalas e retângulos sem sobreposição',async()=>{
  for(const id of Object.keys(CHARACTERS)){
    const metadata=JSON.parse(await bytes(`assets/runtime/${id}-v${RUNTIME_VERSIONS[id]??1}.json`)),rects=[];
    for(const [atlas,sheet]of Object.entries(metadata.atlases)){
      assert.equal(sheet.frames.length,({low:8,sweep:4,airkick:4,damage:4,win:2,getup:2})[atlas]??16);
      for(const f of sheet.frames){
        assert.ok(Number.isFinite(f.anchor)&&Number.isFinite(f.scale??sheet.scale));assert.ok((f.scale??sheet.scale)>0);
        assert.deepEqual(f.rect.slice(2),[f.w,f.h]);assert.ok(f.rect[0]>=0&&f.rect[1]>=0&&f.rect[0]+f.w<=2048);rects.push(f.rect);
      }
    }
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
      const [x,y,w,h]=rects[i],[u,v,a,b]=rects[j];assert.ok(x+w<=u||u+a<=x||y+h<=v||v+b<=y);
    }
  }
});
test('carregamento não lê pixels nem cria centenas de recortes para mostrar o personagem',async t=>{
  const old=globalThis.document;let surfaces=0,draws=0;
  globalThis.document={createElement(){surfaces++;return {getContext(){return {drawImage(){draws++;},getImageData(){throw Error('Extração de pixels no navegador');}};}};}};
  t.after(()=>{if(old===undefined)delete globalThis.document;else globalThis.document=old;});
  const requests=[];t.mock.method(globalThis,'fetch',async path=>{requests.push(path);return new Response(await bytes(path));});
  const images=[],{base,portrait}=await loadPreparedSprites('marcos',async path=>{images.push(path);return {width:2048,height:1547};});
  assert.deepEqual(images,['assets/runtime/marcos-v1.webp','assets/story/marcos-walk-v5.webp']);assert.deepEqual(requests,['assets/runtime/marcos-v1.json','assets/story/marcos-walk-v5.json']);
  assert.equal(base.frames.length,16);assert.equal(base.combat.frames.length,16);assert.equal(base.style,base);
  assert.equal(surfaces,1);assert.equal(draws,1);assert.ok(portrait);
  const cutout=base.frames[0].cutout;assert.equal(base.frames[0].cutout,cutout);assert.equal(surfaces,2);
});
test('áudio de uma luta não baixa falas dos quatro professores ausentes e reutiliza clipes',async t=>{
  const requests=[];t.mock.method(globalThis,'fetch',async path=>{requests.push(path);return new Response(await bytes(path));});
  const audio=new ArcadeAudio();await audio.loadFighters(['marcos','rafael']);const count=requests.length;
  assert.ok(requests.some(p=>p.includes('marcos-special')));assert.ok(requests.some(p=>p.includes('rafael-special')));
  assert.equal(requests.some(p=>['marcelo','gustavo','gelton','marcelino'].some(id=>p.includes(`/${id}-`))),false);
  await audio.loadFighters(['rafael','marcos']);assert.equal(requests.length,count);
});
