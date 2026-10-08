import test from 'node:test';
import assert from 'node:assert/strict';
import {StoryEngine} from '../src/story.js';
import {animateMostafa,mostafaEnemyIntent,mostafaCamera} from '../src/mostafa-port.js';
import {snapshot,applySnapshot} from '../src/net-state.js';
import {readFile} from 'node:fs/promises';
const game=()=>{const e=new StoryEngine();e.start('ruan','story-online','joao');e.queue(0,'storyNext');return e;};
test('Mostafa aproxima em X/Z sem ganhar velocidade diagonal e percorre quadros de corrida',()=>{
 const e=game(),f=e.fighters[0],n=e.spawnEnemy('elite',650,520);n.cooldown=0;const x=n.x,z=n.lane;
 for(let i=0;i<30;i++)mostafaEnemyIntent(e,n,f,1/120);
 assert.ok(n.x<x&&n.lane>z);assert.equal(n.brawlerAnimation,'run');assert.ok(n.brawlerFrame>=6&&n.brawlerFrame<=11);
 assert.ok(Math.hypot(n.x-x,(n.lane-z)*1.35)<=270*.25+1e-8);
});
test('Mostafa alterna atacante e cerco, e coop permite um atacante por jogador',()=>{
 const e=game(),[a,b]=e.fighters;a.x=400;b.x=950;a.lane=b.lane=625;
 const one=e.spawnEnemy('cleaner',510),two=e.spawnEnemy('cleaner',520),three=e.spawnEnemy('cleaner',840);
 for(const n of e.enemies)n.cooldown=0;
 assert.equal(mostafaEnemyIntent(e,one,a,1/120),true);
 assert.equal(mostafaEnemyIntent(e,two,a,1/120),false);assert.equal(two.brawlerState,'orbit');
 assert.equal(mostafaEnemyIntent(e,three,b,1/120),true);
 one.brawlerEngaging=false;assert.equal(mostafaEnemyIntent(e,two,a,1/120),false);assert.equal(mostafaEnemyIntent(e,two,a,1/120),true);
});
test('soco inimigo só causa contato no quadro final e queda termina sem repetir',()=>{
 const e=game(),n=e.spawnEnemy('cleaner',600);n.attackLife=.25;n.attackMode='melee';
 animateMostafa(n,'attack',0);assert.equal(n.attackbox,null);
 animateMostafa(n,'attack',.125);assert.equal(n.brawlerFrame,14);assert.ok(n.attackbox);
 animateMostafa(n,'fall',2);assert.equal(n.brawlerFrame,19);animateMostafa(n,'fall',1);assert.equal(n.brawlerFrame,19);
});
test('restaurar o cerco via JSON preserva a próxima simulação e animação dos dois pares',()=>{
 const a=game(),b=game();a.spawnEnemy('elite',650,570);
 for(let i=0;i<80;i++)a.update(1/120);
 const state=JSON.parse(JSON.stringify(snapshot(a,1)));assert.ok(applySnapshot(b,state));
 for(let i=0;i<90;i++){a.update(1/120);b.update(1/120);}
 assert.deepEqual(a.exportStoryState(),b.exportStoryState());
});
test('zona morta da câmera respeita parceiro atrasado e só avança quando cruza limite',()=>{
 assert.equal(mostafaCamera(0,[{x:200},{x:450}],2320),0);
 assert.equal(mostafaCamera(0,[{x:900},{x:1000}],2320),450);
 assert.equal(mostafaCamera(300,[{x:400},{x:1200}],2320),300);
});
test('atlas respeita células originais, sem incluir poses da linha seguinte ou padding BMP',async()=>{
 const atlas=JSON.parse(await readFile('assets/story/mostafa/frames.json','utf8'));
 for(const [id,cw,ch,cols] of [['ferris',120,90,6],['gneiss',120,90,6],['butcher',200,130,3]]){
  for(const [i,f] of atlas[id].frames.entries()){
   assert.deepEqual(f.rect,[i%cols*cw,Math.floor(i/cols)*ch,cw,ch]);
   assert.ok(f.bottom<=ch&&f.height<=ch);
  }
  assert.ok(atlas[id].scale>0);
 }
 assert.ok(atlas.ferris.frames[19].height<atlas.ferris.frames[0].height);
});
