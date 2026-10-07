// Offline visual check of all campaign scenes using the same browser renderer.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {Renderer} from '../src/render.js';
import {StoryEngine} from '../src/story.js';
import {loadPreparedSprites} from '../src/sprite-loader.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,Image}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});globalThis.Image=Image;
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const canvas=createCanvas(1280,720),renderer=new Renderer(canvas);
for(const id of ['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan']){const {base,portrait}=await loadPreparedSprites(id,path=>loadImage(path.split('?')[0]));renderer.sheets[id]=base;renderer.portraits[id]=portrait;}
renderer.storyArt={backgrounds:await Promise.all(['patio','quimica','biblioteca','nit'].map(id=>loadImage(`assets/story/${id}-panorama-v2.webp`))),enemies:await Promise.all(Array.from({length:16},(_,i)=>loadImage(`assets/story/enemy-${i}.webp`)))};
renderer.storyArt.inspector=await Promise.all(Array.from({length:4},(_,i)=>loadImage(`assets/story/inspector-pose-${i}-v2.webp`)));renderer.storyArt.inspectorFrames=JSON.parse(await readFile('assets/story/inspector-poses-v2.json','utf8'));
renderer.storyArt.propFrames=JSON.parse(await readFile('assets/story/props-v3.json','utf8'));
renderer.storyArt.props=Object.fromEntries(await Promise.all(Object.entries(renderer.storyArt.propFrames).map(async([kind,frame])=>[kind,await loadImage(frame.file)])));
renderer.storyArt.walks=Object.fromEntries(await Promise.all(['gelton','marcelino','marcos','joao','ruan'].map(async id=>[id,{image:await loadImage(`assets/story/${id}-walk-v3.webp`),frames:JSON.parse(await readFile(`assets/story/${id}-walk-v3.json`,'utf8'))}])));
const engine=new StoryEngine({onEvent:e=>renderer.event(e)});
for(let act=0;act<4;act++){
 engine.start('marcelo','story-local','rafael',{act});engine.queue(0,'storyNext');engine.fighters[0].x=420;engine.fighters[1].x=540;
 for(const f of engine.fighters){f.prevX=f.x;f.y=625;f.prevY=625;}
 engine.spawnWave();renderer.draw(engine,.01,1);await writeFile(`/tmp/svf-story-act-${act+1}.png`,canvas.toBuffer('image/png'));
 engine.beginBoss();engine.queue(0,'storyNext');renderer.draw(engine,.01,1);await writeFile(`/tmp/svf-story-boss-${act+1}.png`,canvas.toBuffer('image/png'));
}
console.log('8 campaign scene renders completed');
