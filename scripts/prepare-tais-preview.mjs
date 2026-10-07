// Export the same composed identity head used during play for the selection preview.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {prepareSavateFaces} from '../src/savate-face.js';
import {loadPreparedSprites} from '../src/sprite-loader.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const {base}=await loadPreparedSprites('tais',path=>loadImage(path.split('?')[0]));
prepareSavateFaces(base,await loadImage('assets/tais-identity-head-v1.webp'),JSON.parse(await readFile('assets/runtime/tais-head-anchors-v1.json','utf8')));
const f=base.frames[0],canvas=createCanvas(240,300),c=canvas.getContext('2d'),scale=Math.min(220/f.w,282/f.h);
c.drawImage(f.image,...f.rect,(240-f.w*scale)/2,294-f.h*scale,f.w*scale,f.h*scale);
await writeFile('/tmp/tais-preview.png',canvas.toBuffer('image/png'));
