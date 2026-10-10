// Runs the review page's actual fixtures in Node Canvas. This is independent
// integration evidence, explicitly not a replacement for Chrome inspection.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),{createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/@napi-rs/canvas`:'@napi-rs/canvas');
const output=process.argv[2]??'/tmp/svf-combat-render';await mkdir(output,{recursive:true});
const canvas=createCanvas(1280,720),nodes=new Map();
function node(id){if(id==='review')return canvas;if(!nodes.has(id))nodes.set(id,{value:{mode:'versus'}[id]??'',checked:true,textContent:'',disabled:false,add(option){if(!this.value)this.value=option.value;},addEventListener(){}});return nodes.get(id);}
globalThis.document={createElement:()=>createCanvas(1,1),getElementById:node};globalThis.matchMedia=()=>({matches:false});globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
globalThis.location={search:''};globalThis.Image=class extends Image{set src(path){super.src=typeof path==='string'?path.split('?')[0]:path;}get src(){return super.src;}};globalThis.fetch=async path=>new Response(await readFile(path.split('?')[0]));
globalThis.requestAnimationFrame=callback=>{if(callback.name!=='loop')setImmediate(()=>callback(performance.now()));return 0;};
await import('../tests/visual-review.js');await node('suite').onclick();
const report=JSON.parse(node('results').textContent);report.environment='Node Canvas; browser verification remains separate';await writeFile(`${output}/combat-render.json`,JSON.stringify(report,null,2)+'\n');await writeFile(`${output}/combat-last.png`,canvas.toBuffer('image/png'));
console.log(JSON.stringify({status:report.status,characterCases:report.characters.reduce((n,c)=>n+c.cases,0),renderedSamples:report.characters.reduce((n,c)=>n+c.renderedSamples,0)+report.enemies.reduce((n,c)=>n+c.renderedSamples,0),failures:report.failures}));
if(report.status!=='PASS')throw new Error(`Combat render failed; see ${output}/combat-render.json`);
