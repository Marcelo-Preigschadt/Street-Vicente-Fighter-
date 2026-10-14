// Scripted engine states and the same Canvas renderers used by the live game.
// This capture is visual QA; it is not a manual playthrough of the circuit.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const require=createRequire(import.meta.url);
const {createCanvas,Image,loadImage,GlobalFonts}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
GlobalFonts.registerFromPath('assets/fonts/Bangers-Regular.ttf','VicenteArcade');
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.matchMedia=()=>({matches:false});
globalThis.Image=class extends Image{set src(v){super.src=typeof v==='string'?v.split('?')[0]:v;}get src(){return super.src;}};
globalThis.fetch=async p=>new Response(await readFile(p.split('?')[0]));
const [{Renderer},{FightEngine,CHARACTERS},{ArcadeRun},{drawArcadeMap}]=await Promise.all([import('../src/render.js'),import('../src/engine.js'),import('../src/arcade.js'),import('../src/arcade-render.js')]);
const output='docs/arcade-review';await mkdir(output,{recursive:true});
const canvas=createCanvas(1280,720),renderer=new Renderer(canvas);await renderer.load(['adriano','rafael']);
const engine=new FightEngine({random:()=>.5});engine.start('adriano','cpu','rafael');engine.phase='fight';engine.phaseTime=5;
const run=new ArcadeRun({roster:Object.keys(CHARACTERS),playerId:'adriano',firstOpponent:'rafael'});engine.arcadeRun=run;
engine.fighters.forEach((f,i)=>{f.hp=f.displayHP=i?430:730;f.meter=i?68:100;f.wins=1;});run.score=18450;run.record=92000;
renderer.draw(engine,0,1);await writeFile(`${output}/combat-hud.webp`,canvas.toBuffer('image/webp'));
engine.phase='intro';engine.phaseTime=.3;renderer.draw(engine,0,1);await writeFile(`${output}/final-round.webp`,canvas.toBuffer('image/webp'));
engine.fighters[0].hp=1000;engine.fighters[1].hp=0;engine.endRound();engine.freeze=0;engine.phaseTime=2.3;renderer.draw(engine,0,1);await writeFile(`${output}/perfect.webp`,canvas.toBuffer('image/webp'));
const names=Object.fromEntries(Object.entries(CHARACTERS).map(([id,c])=>[id,c.name])),portraits={};
for(const id of Object.keys(CHARACTERS)){
 const v=['adriano','khauany','dienes'].includes(id)?1:['joao','gelton','tais'].includes(id)?4:3;
 portraits[id]=await loadImage(`assets/runtime/${id}-head-menu-v${v}.webp`);
}
run.state='route';run.wins=1;const map=createCanvas(1200,610),context=map.getContext('2d');
const encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','1200x610','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p',`${output}/school-route.mp4`],{stdio:['pipe','ignore','inherit']});const finished=once(encoder,'close');
for(let frame=0;frame<168;frame++){
 drawArcadeMap(context,run,{progress:frame/167,clock:frame/30,portraits,names});
 if(frame===95)await writeFile(`${output}/school-route.webp`,map.toBuffer('image/webp'));
 if(!encoder.stdin.write(Buffer.from(context.getImageData(0,0,1200,610).data)))await once(encoder.stdin,'drain');
}
encoder.stdin.end();const [code]=await finished;if(code)throw Error(`Route capture: ffmpeg ${code}`);
await writeFile(`${output}/capture.json`,JSON.stringify({renderer:'Actual Renderer and drawArcadeMap',scriptedStates:true,manualPlaythrough:false,routeFrames:168,fps:30,routeSeconds:5.6,existingCharacterArtChanged:false},null,2)+'\n');
console.log('Arcade presentation captured: combat HUD, Final Round, Perfect and 5.6-second school route.');
