import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {Fighter,CHARACTERS,fighterPose} from '../src/engine.js';

test('todos os personagens têm quadros e colisões válidos em cada fase dos golpes, nos dois lados',()=>{
 for(const id of Object.keys(CHARACTERS)){
  const metadata=JSON.parse(readFileSync(`assets/runtime/${id}-v1.json`));
  for(const slot of [0,1])for(const state of ['idle','walk','jump','crouch','block','lowBlock','hit','ko','knockdown','wake','victory','landing','preJump','dizzy','punch','kick','crouchPunch','sweep','airPunch','airKick','special','uppercut','super','throw','guardCounter']){
   for(const time of [0,.075,.15,.29,.35]){
    const f=new Fighter(id,slot);f.state=state;f.actionTime=time;f.animTime=time;f.walkDistance=-80;
    f.moveData={startup:.1,active:.2,strength:1};
    const pose=fighterPose(f),frame=metadata.atlases[pose.atlas]?.frames[pose.index];
    assert.ok(frame,`${id} ${state} ${time}: ${JSON.stringify(pose)}`);
    assert.ok(f.hurtboxes.length,`${id} ${state}: colisão ausente`);
    for(const box of f.hurtboxes)assert.ok(Object.values(box).every(Number.isFinite)&&box.w>0&&box.h>0);
   }
  }
 }
});

test('recortes reais do João excluem poses vizinhas e conservam o punho da vitória',()=>{
 const output=execFileSync('python3',['-c',`
import sys,json
sys.path.insert(0,'scripts')
from ruan_crop import extract_frames
from PIL import Image
import numpy as np
from scipy import ndimage
frames=extract_frames(Image.open('assets/joao-base-v1.webp'),joao_base=True)
result=[]
for i in [4,8,12]:
 f,b=frames[i];alpha=np.asarray(f)[:,:,3]>=140
 labels,n=ndimage.label(alpha,np.ones((3,3)))
 counts=np.bincount(labels.ravel())[1:]
 result.append([i,f.height,int(counts.max()),int(counts.sum())])
f,b=frames[12]
result.append(['fist',f.getpixel((95-b[0],846-b[1]))[3]])
print(json.dumps(result))
`],{encoding:'utf8'});
 const result=JSON.parse(output);
 for(const [index,height,largest,total] of result.slice(0,3)){
  assert.ok(height<340,`João ${index} contém outra pose: ${height}px`);
  assert.ok(largest/total>.99,`João ${index} tem pedaços soltos de outro quadro`);
 }
 assert.ok(result[3][1]>140,'punho da vitória foi cortado');
});

test('Ruan mantém a anatomia ao agachar e atacar no ar; a rasteira não amplia o corpo',()=>{
 const {atlases}=JSON.parse(readFileSync('assets/runtime/ruan-v1.json'));
 const idle=atlases.base.frames[0];
 for(const f of [...atlases.base.frames,...atlases.combat.frames]){
  assert.ok(Math.abs(f.headPixels*f.scale-idle.headPixels*idle.scale)<.001);
 }
 for(const i of [0,1,2,4,5,6,7])assert.equal(atlases.combat.frames[i].scale,idle.scale);
 const sweep=atlases.combat.frames[3];
 assert.ok(sweep.scale<.9,'rasteira de alta resolução foi ampliada');
 assert.ok(sweep.h*sweep.scale<idle.h*.7);
});

test('publicação conserva a versão dos sprites e remove somente versões de imports',()=>{
 const version=JSON.parse(readFileSync('package.json')).version;
 const loader=readFileSync(`releases/v${version}/sprite-loader.js`,'utf8');
 assert.match(loader,/\?v=362/);
 assert.match(readFileSync(`releases/v${version}/main.js`,'utf8'),/\?v=362/);
 assert.doesNotMatch(readFileSync(`releases/v${version}/engine.js`,'utf8'),/\.js\?v=\d/);
});
