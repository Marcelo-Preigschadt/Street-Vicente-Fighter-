import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('recorte conserva braço fora da célula e exclui mão da pose vizinha',()=>{
 const result=execFileSync('python3',['-c',`
import sys,json
sys.path.insert(0,'scripts')
from ruan_crop import extract_frames
from PIL import Image,ImageDraw
im=Image.new('RGBA',(160,160));d=ImageDraw.Draw(im)
for i in range(16):
 x=i%4*40;y=i//4*40
 d.rectangle((x+10,y+5,x+25,y+33),fill='white')
d.rectangle((25,19,48,22),fill='white')
d.rectangle((35,9,55,12),fill='white')
frames=extract_frames(im)
def alpha(i,x,y):
 f,b=frames[i];return f.getpixel((x-b[0],y-b[1]))[3]
print(json.dumps([alpha(0,46,20),alpha(0,36,10),alpha(1,36,10),len(frames)]))
`],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),[255,0,255,16]);
});
