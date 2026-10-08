import test from 'node:test';
import assert from 'node:assert/strict';
import { Renderer, CAPOEIRA_CELL_MARGIN } from '../src/render.js';

function canvasStub() {
  let pixels;
  return { getContext: () => ({
    drawImage(image) { pixels = image.pixels; },
    getImageData() { return { data: pixels }; },
    createImageData(w,h) { return { data: new Uint8ClampedArray(w*h*4) }; },
    putImageData(data) { pixels = data.data; },
  }) };
}
function image(width,height) {
  const pixels=new Uint8ClampedArray(width*height*4);
  return {width,height,pixels,rect(x,y,w,h) {
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels[(yy*width+xx)*4+3]=255;
  }};
}
test('cabelo acima da célula de vitória é preservado sem incorporar a pose vizinha',t=>{
  const old=globalThis.document;globalThis.document={createElement:canvasStub};
  t.after(()=>{if(old===undefined)delete globalThis.document;else globalThis.document=old;});
  const atlas=image(800,800);
  for(let i=0;i<16;i++)atlas.rect(i%4*200+(i===8?145:75),Math.floor(i/4)*200+85,i===8?30:50,80);
  // Vitória: a cabeça passa 55 px acima da linha da célula; a pose anterior fica separada.
  atlas.rect(80,545,40,150);
  const frame=Renderer.prototype.analyzeSheet(atlas,false,4,CAPOEIRA_CELL_MARGIN).frames[12];
  assert.equal(frame.y,-55);assert.equal(frame.bottom,164);assert.equal(frame.h,220);
  const data=frame.cutout.getContext('2d').getImageData().data;
  assert.equal(data[(5*frame.w+10)*4+3],255);
  assert.equal(data[(5*frame.w)*4+3],0);
});
test('sprite isolado de aú conserva cabeça, mãos e pés no mesmo recorte',t=>{
  const old=globalThis.document;globalThis.document={createElement:canvasStub};
  t.after(()=>{if(old===undefined)delete globalThis.document;else globalThis.document=old;});
  const sprite=image(100,140);sprite.rect(20,10,60,120);
  const sheet=Renderer.prototype.analyzeSheet(sprite,false,1,0,1);
  assert.equal(sheet.frames.length,1);
  assert.deepEqual([sheet.frames[0].x,sheet.frames[0].y,sheet.frames[0].w,sheet.frames[0].h],[20,10,60,120]);
});
test('caminhada e golpe desenham um quadro inteiro sem recortar ou deformar a silhueta',()=>{
  const calls=[],c={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
  const frame={image:{},rect:[10,20,100,200],x:0,y:0,w:100,h:200,anchor:50,bottom:200,scale:1};
  const renderer={c,clock:0,reduced:true};
  const fighter={character:{id:'rafael'},x:400,y:625,direction:1,state:'walk',invincible:0,
    blockFlash:0,flash:0,customTime:0,dizzyTime:0,attackPlant:null,airborne:false};
  const pose={sheet:{frames:[frame]},index:0};
  Renderer.prototype.drawFighter.call(renderer,fighter,pose);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].slice(1),[10,20,100,200,-50,-200,100,200]);
  calls.length=0;
  fighter.state='punch';fighter.action='punch';fighter.attackPlant={x:330};
  Renderer.prototype.drawFighter.call(renderer,fighter,pose);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].slice(1),[10,20,100,200,-50,-200,100,200]);
});
