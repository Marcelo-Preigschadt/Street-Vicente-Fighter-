import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSavateFaces} from '../src/savate-face.js';
import {cacheSpriteEffects} from '../src/render-cache.js';
test('a cabeça da Tais também aparece nas poses com brilho dos poderes',async()=>{
 const previous=globalThis.document,draws=[];
 globalThis.document={createElement(){const canvas={width:1,height:1};canvas.getContext=()=>({drawImage(image){draws.push(image);},getImageData(){return {data:new Uint8ClampedArray(canvas.width*canvas.height*4)};},putImageData(){},save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){},fill(){}});return canvas;}};
 try{
  const original={},head={},sheet={scale:1,frames:[{image:original,cutout:original,w:10,h:10,rect:[0,0,10,10]}]};
  prepareSavateFaces(sheet,head,{base:[{x:5,y:5,w:4,h:5}]});
  const frame=sheet.frames[0];assert.notEqual(frame.image,original);assert.equal(frame.cutout,frame.image);
  draws.length=0;await cacheSpriteEffects(sheet,frame,'#56e1d7',['power']);assert.equal(draws[0],frame.image);assert.ok(frame.effects.power);
 }finally{globalThis.document=previous;}
});
