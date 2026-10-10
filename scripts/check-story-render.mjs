// Offline visual check of all campaign scenes using the same browser renderer.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {Renderer} from '../src/render.js';
import {StoryEngine} from '../src/story.js';
import {loadPreparedSprites} from '../src/sprite-loader.js';
import {STORY_PROP_DIMENSIONS} from '../src/story-props.js';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,Image}=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`);
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});globalThis.Image=class extends Image{set src(path){super.src=typeof path==='string'?path.split('?')[0]:path;}get src(){return super.src;}};
globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
const canvas=createCanvas(1280,720),renderer=new Renderer(canvas);
await renderer.load(['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan','tais','luciana','khauany','dienes']);
renderer.storyArt={backgrounds:await Promise.all(['patio','quimica','biblioteca','nit'].map(id=>loadImage(`assets/story/${id}-panorama-v2.webp`))),enemies:await Promise.all(Array.from({length:16},(_,i)=>loadImage(`assets/story/enemy-${i}.webp`)))};
renderer.storyArt.inspector=await Promise.all(Array.from({length:4},(_,i)=>loadImage(`assets/story/inspector-pose-${i}-v2.webp`)));renderer.storyArt.inspectorFrames=JSON.parse(await readFile('assets/story/inspector-poses-v2.json','utf8'));
renderer.storyArt.propFrames=JSON.parse(await readFile('assets/story/props-v3.json','utf8'));
for(const [kind,size] of Object.entries(STORY_PROP_DIMENSIONS))Object.assign(renderer.storyArt.propFrames[kind],size);
renderer.storyArt.props=Object.fromEntries(await Promise.all(Object.entries(renderer.storyArt.propFrames).map(async([kind,frame])=>[kind,await loadImage(frame.file)])));
renderer.storyArt.walks=Object.fromEntries(await Promise.all(['gelton','marcelino','marcos','joao','ruan','tais'].map(async id=>[id,{image:await loadImage(`assets/story/${id}-walk-v${id==='tais'?4:3}.webp`),frames:JSON.parse(await readFile(`assets/story/${id}-walk-v${id==='tais'?4:3}.json`,'utf8'))}])));
const metadata=JSON.parse(await readFile('assets/story/enemy-animation-v7.json','utf8'));renderer.storyArt.animations=Object.fromEntries(await Promise.all(Object.entries(metadata).map(async([id,v])=>{const image=await loadImage(v.file);return [id,{...v,image,frames:v.frames.map(f=>({...f,image,x:0,y:0,anchor:f.anchorX,w:f.rect[2],h:f.rect[3],scale:f.scale??v.scale}))}];})));
const rigsMeta=JSON.parse(await readFile('assets/story/machine-rigs-v6.json','utf8'));renderer.storyArt.rigs=Object.fromEntries(await Promise.all(Object.entries(rigsMeta).map(async([id,v])=>[id,{...v,image:await loadImage(v.file)}])));
const engine=new StoryEngine({onEvent:e=>renderer.event(e)});
for(let act=0;act<4;act++){
 engine.start('marcelo','story-local','rafael',{act});engine.queue(0,'storyNext');engine.fighters[0].x=420;engine.fighters[1].x=540;
 for(const f of engine.fighters){f.prevX=f.x;f.y=625;f.prevY=625;}
 engine.spawnWave();renderer.draw(engine,.01,1);await writeFile(`/tmp/svf-story-act-${act+1}.png`,canvas.toBuffer('image/png'));
 engine.beginBoss();engine.queue(0,'storyNext');renderer.draw(engine,.01,1);await writeFile(`/tmp/svf-story-boss-${act+1}.png`,canvas.toBuffer('image/png'));
}
engine.start('ruan','story-solo');engine.queue(0,'storyNext');engine.fighters[0].x=600;engine.spawnWave();for(const n of engine.enemies){n.brawlerFrame=14;n.attackLife=.2;n.attackMode='melee';}renderer.draw(engine,.01,1);await writeFile('/tmp/svf-story-contact-431.png',canvas.toBuffer('image/png'));
console.log('8 scenes and contact frame rendered');
// Carrying contact sheets exercise the actual compositor, both facings and stride.
for(const id of ['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan','tais','luciana','khauany','dienes']){
 engine.start(id,'story-solo',id==='rafael'?'gustavo':'rafael');engine.queue(0,'storyNext');
 const f=engine.fighters[0];f.x=650;f.prevX=f.x;f.carry={kind:'chair',id:'review-chair'};
 for(const direction of [1,-1]){f.direction=direction;renderer.draw(engine,.01,1);await writeFile(`/tmp/svf-carry-${id}-${direction}.png`,canvas.toBuffer('image/png'));}
 f.direction=1;f.state='walk';f.walkBlend=1;f.walkDistance=90;
 renderer.draw(engine,.01,1);await writeFile(`/tmp/svf-carry-${id}-walk.png`,canvas.toBuffer('image/png'));
}
console.log('36 chair grip/stride/facing views rendered');

const proofEngine=new StoryEngine();proofEngine.start('tais','story-solo');proofEngine.queue(0,'storyNext');proofEngine.fighters[0].x=640;proofEngine.fighters[0].prevX=640;renderer.draw(proofEngine,.01,1);await writeFile('/tmp/svf-tais-story-v450.png',canvas.toBuffer('image/png'));
const poses=createCanvas(1280,720),pc=poses.getContext('2d');pc.fillStyle='#24363b';pc.fillRect(0,0,1280,720);
for(const [atlas,ai] of [['base',0],['combat',1]])for(let i=0;i<16;i++){const f=renderer.sheets.tais[atlas==='base'?'combat':'combat'];const sheet=atlas==='base'?renderer.sheets.tais:renderer.sheets.tais.combat;const frame=sheet.frames[i],scale=Math.min(135/frame.w,145/frame.h),x=i%8*160,y=(Math.floor(i/8)+ai*2)*180;pc.drawImage(frame.image,...frame.rect,x+(160-frame.w*scale)/2,y+155-frame.h*scale,frame.w*scale,frame.h*scale);pc.fillStyle='#fff';pc.font='12px Arial';pc.fillText(atlas+':'+i,x+5,y+170);}
await writeFile('/tmp/tais-32-poses-v450.png',poses.toBuffer('image/png'));
