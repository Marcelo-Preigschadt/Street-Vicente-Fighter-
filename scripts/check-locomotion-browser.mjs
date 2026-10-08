// Runs the real published Canvas in a fresh browser; no online room is joined.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const directory=process.argv[2]??'/tmp/svf-browser';await mkdir(directory,{recursive:true});
const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
const origin='http://127.0.0.1:8000';
let browser;
try{
 for(let i=0;i<60;i++){try{const response=await fetch(origin);if(response.ok)break;}catch{}if(i===59)throw Error('Servidor de teste indisponível');await new Promise(resolve=>setTimeout(resolve,100));}
 browser=await chromium.launch({headless:true});
 const errors=[],context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/tests/locomotion-lab.html');
 await page.waitForFunction(()=>window.locomotionLab?.snapshot().loaded,{},{timeout:60000});
 await page.waitForFunction(()=>window.locomotionLab.snapshot().stage==='WALK_FORWARD');
 await page.waitForTimeout(250);await page.locator('#play').click();
 await page.locator('#lab').screenshot({path:directory+'/styles-forward.png'});
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.locomotionLab.snapshot().stage==='MOVE_STOP');
 await page.waitForTimeout(220);await page.locator('#play').click();
 await page.locator('#lab').screenshot({path:directory+'/styles-stop.png'});
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.locomotionLab.snapshot().loops>=1,{},{timeout:60000});
 const metrics=await page.evaluate(()=>window.locomotionLab.snapshot());assert.ok(metrics.frames>30);assert.ok(metrics.maxSupportDrift<.01,JSON.stringify(metrics));assert.ok(metrics.maxSoleDrift<.01,JSON.stringify(metrics));
 await writeFile(directory+'/browser-metrics.json',JSON.stringify(metrics,null,2)+'\n');console.log('BROWSER_METRICS '+JSON.stringify(metrics));
 await page.close();
 const scenarios=[];
 for(const id of ['marcelo','rafael','gustavo','tais']){
  const p=await context.newPage();p.on('pageerror',error=>errors.push(error.message));
  await p.goto(origin+'/?v=4.6.1');
  assert.equal(await p.locator('[data-game-version]').getAttribute('data-game-version'),'4.6.1');
  await p.locator('input[name="mode"][value="local"]').check();
  await p.locator('[data-fighter="'+id+'"]').click();
  await p.locator('#opponent').selectOption(id==='rafael'?'marcelo':'rafael');
  await p.locator('#start').click({timeout:60000});
  await p.locator('#selection').waitFor({state:'hidden',timeout:60000});
  await p.waitForFunction(()=>document.getElementById('announcer').textContent.includes('Lutem'),{},{timeout:10000});
  await p.locator('#game').focus();
  await p.keyboard.down('d');await p.waitForTimeout(650);await p.locator('#game').screenshot({path:directory+'/'+id+'-forward.png'});await p.keyboard.up('d');
  await p.waitForTimeout(220);await p.locator('#game').screenshot({path:directory+'/'+id+'-stop.png'});
  await p.keyboard.down('a');await p.waitForTimeout(650);await p.locator('#game').screenshot({path:directory+'/'+id+'-backward.png'});await p.keyboard.up('a');
  await p.waitForTimeout(300);await p.keyboard.down('d');await p.waitForTimeout(250);await p.keyboard.press('f');await p.waitForTimeout(90);await p.locator('#game').screenshot({path:directory+'/'+id+'-walk-attack.png'});
  await p.waitForTimeout(400);await p.locator('#game').screenshot({path:directory+'/'+id+'-attack-walk.png'});await p.keyboard.press('h');await p.waitForTimeout(150);await p.keyboard.up('d');
  await p.waitForTimeout(350);await p.keyboard.down('d');await p.keyboard.down('ArrowLeft');await p.waitForTimeout(1400);await p.locator('#game').screenshot({path:directory+'/'+id+'-pushboxes.png'});await p.keyboard.up('d');await p.keyboard.up('ArrowLeft');
  await p.waitForTimeout(300);await p.keyboard.down('a');await p.keyboard.down('ArrowRight');await p.waitForTimeout(450);await p.keyboard.up('a');await p.keyboard.up('ArrowRight');
  await p.waitForTimeout(300);await p.keyboard.down('d');await p.keyboard.press('w');await p.waitForTimeout(1000);await p.keyboard.up('d');await p.locator('#game').screenshot({path:directory+'/'+id+'-jump-side.png'});
  assert.equal(await p.locator('#pause-screen').isVisible(),false);assert.equal(await p.locator('#result-screen').isVisible(),false);scenarios.push({id,mode:'local',completed:true});
  await p.close();
 }
 const p=await context.newPage();p.on('pageerror',error=>errors.push(error.message));await p.goto(origin+'/?v=4.6.1');
 await p.locator('[data-experience="story"]').click();await p.locator('input[name="mode"][value="cpu"]').check();await p.locator('[data-fighter="tais"]').click();await p.locator('#start').click({timeout:60000});
 await p.locator('#selection').waitFor({state:'hidden',timeout:60000});await p.locator('#story-next').click();await p.locator('#story-dialog').waitFor({state:'hidden'});await p.locator('#game').focus();
 await p.keyboard.down('d');await p.waitForTimeout(850);await p.keyboard.up('d');await p.waitForTimeout(220);await p.locator('#game').screenshot({path:directory+'/story-stop.png'});
 await p.keyboard.down('a');await p.waitForTimeout(300);await p.keyboard.up('a');await p.keyboard.press('f');await p.waitForTimeout(120);await p.keyboard.down('d');await p.waitForTimeout(700);await p.keyboard.up('d');await p.keyboard.press('g');await p.waitForTimeout(100);await p.locator('#game').screenshot({path:directory+'/story-enemies.png'});
 scenarios.push({id:'tais',mode:'story-solo',completed:true});await p.close();
 assert.deepEqual(errors,[]);await writeFile(directory+'/scenarios.json',JSON.stringify({scenarios,errors},null,2)+'\n');console.log('BROWSER_SCENARIOS '+JSON.stringify({scenarios,errors}));
 if(process.env.SVF_EMIT_VISUAL==='1')for(const file of ['styles-forward.png','styles-stop.png'])console.log('SVF_VISUAL '+file+' '+await readFile(directory+'/'+file,'base64'));
}finally{if(browser)await browser.close();server.kill();}
