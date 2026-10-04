import test from 'node:test';
import assert from 'node:assert/strict';
import { FightEngine, CHARACTERS, FIXED_STEP, WORLD, MOVES } from '../src/engine.js';
function arena() {
  const events = [], game = new FightEngine({ random: () => .6, onEvent: e => events.push(e) });
  game.start('marcelo', 'local'); game.phase = 'fight'; game.phaseTime = 0;
  game.fighters[0].x = 450; game.fighters[1].x = 580;
  return { game, events };
}
const advance = (g, seconds) => { for (let i = 0; i < Math.ceil(seconds / FIXED_STEP); i++) g.update(FIXED_STEP); };
const until = (g, condition, seconds = 2) => { for (let i = 0; i < seconds / FIXED_STEP && !condition(); i++) g.update(FIXED_STEP); assert.ok(condition(), 'o estado esperado deve ser atingido'); };
const hits = events => events.filter(e => e.type === 'hit');
function direction(g, slot, n) {
  const facing = g.fighters[slot].direction;
  const horizontal = [1,4,7].includes(n) ? -1 : [3,6,9].includes(n) ? 1 : 0;
  g.setInput(slot, { left: horizontal * facing < 0, right: horizontal * facing > 0, down: [1,2,3].includes(n), jump: [7,8,9].includes(n) });
}
function motion(g, slot, sequence) { for (const n of sequence) { direction(g,slot,n); advance(g,.02); } }
function flying(guardLow = null) {
  const scene = arena(), { game } = scene;
  game.fighters[0].x = 300; game.fighters[1].x = 660;
  if (guardLow !== null) game.setInput(1, { block: true, down: guardLow });
  game.setInput(0, { right: true, jump: true }); advance(game,.42); game.setInput(0,{}); game.queue(0,'kick'); advance(game,.23);
  return scene;
}

test('nomes e bordões preservam exatamente os dados fornecidos', () => {
  assert.equal(CHARACTERS.marcelo.name,'Prof. Marcelo'); assert.equal(CHARACTERS.marcelo.quote,'Bora NIT');
  assert.equal(CHARACTERS.rafael.name,'Prof Rafael'); assert.equal(CHARACTERS.rafael.quote,'No meu tempo não era assim');
});
test('três forças de soco têm preparação, dano e recuperação diferentes', () => {
  const results=[];
  for(const strength of [0,1,2]) { const {game,events}=arena(); game.queue(0,'punch',strength); advance(game,.035); assert.equal(game.fighters[1].hp,1000);
    until(game,()=>hits(events).length>0); results.push({damage:hits(events)[0].damage,startup:game.fighters[0].moveData.startup,recovery:game.fighters[0].moveData.recovery}); advance(game,.8); assert.equal(hits(events).length,1); }
  assert.ok(results[0].damage<results[1].damage && results[1].damage<results[2].damage);
  assert.ok(results[0].startup<results[1].startup && results[1].recovery<results[2].recovery);
});
test('baixo + chute executa rasteira, acerta pernas, derruba e permite levantar', () => {
  const {game,events}=arena(); game.setInput(0,{down:true}); game.queue(0,'kick'); advance(game,.03);
  const a=game.fighters[0],b=game.fighters[1]; assert.equal(a.action,'sweep'); assert.equal(a.moveData.level,'low');
  assert.equal(a.attackbox,null); until(game,()=>b.knocked); assert.ok(a.attackbox.y>WORLD.floor-165); assert.ok(a.attackbox.y+a.attackbox.h>WORLD.floor-80); assert.ok(a.attackbox.y+a.attackbox.h<=WORLD.floor); assert.equal(hits(events)[0].move,'sweep');
  const hp=b.hp; game.queue(1,'punch'); advance(game,.45); assert.equal(b.action,null); assert.equal(b.hp,hp);
  until(game,()=>b.wakeTime>0); assert.equal(b.state,'wake'); until(game,()=>b.wakeTime===0); assert.ok(b.throwInvincible>0); assert.ok(b.hurtboxes.length>0); advance(game,.2); assert.equal(b.y,WORLD.floor); assert.equal(b.knocked,false);
});
test('rasteira atravessa a guarda alta mas é bloqueada pela guarda baixa', () => {
  for(const low of [false,true]) { const {game,events}=arena(); game.setInput(0,{down:true}); game.setInput(1,{block:true,down:low}); game.queue(0,'kick'); advance(game,.45);
    assert.equal(game.fighters[1].hp===1000,low); assert.equal(events.some(e=>e.type==='block'),low); assert.equal(game.fighters[1].knocked,!low); }
});
test('segurar para trás bloqueia sem botão de defesa e baixo + trás bloqueia rasteira', () => {
  const {game,events}=arena(); game.setInput(1,{right:true}); game.queue(0,'punch'); advance(game,.32); assert.equal(game.fighters[1].hp,1000); assert.ok(events.some(e=>e.type==='block'));
  const {game:low}=arena(); low.setInput(0,{down:true}); low.setInput(1,{right:true,down:true}); low.queue(0,'kick'); advance(low,.4); assert.equal(low.fighters[1].hp,1000);
});
test('voadeira mantém trajetória, mostra ação aérea e acerta na descida', () => {
  const {game,events}=flying(); const a=game.fighters[0]; assert.equal(a.action,'airKick'); assert.ok(a.airborne); assert.ok(a.x>500); assert.ok(a.vx>300);
  assert.equal(hits(events).length,1); assert.equal(hits(events)[0].move,'airKick'); assert.ok(game.fighters[1].hp<1000);
});
test('voadeira exige guarda alta; guarda baixa recebe dano', () => {
  const standing=flying(false), crouching=flying(true);
  assert.equal(standing.game.fighters[1].hp,1000); assert.ok(standing.events.some(e=>e.type==='block'));
  assert.ok(crouching.game.fighters[1].hp<1000); assert.equal(crouching.events.some(e=>e.type==='block'),false);
});
test('salto não pode mudar direção no ar e só aceita um ataque por salto', () => {
  const {game,events}=arena(); game.fighters[1].x=1000; game.setInput(0,{right:true,jump:true}); advance(game,.2); const vx=game.fighters[0].vx;
  game.setInput(0,{left:true}); advance(game,.2); assert.equal(game.fighters[0].vx,vx);
  game.queue(0,'kick'); advance(game,.15); assert.ok(game.fighters[0].airborne); game.queue(0,'punch'); advance(game,.03);
  assert.equal(events.filter(e=>e.type==='swing').length,1); until(game,()=>game.fighters[0].y===WORLD.floor); assert.equal(game.fighters[0].airAttackUsed,false);
});
test('baixo + soco usa o soco agachado; jab do boxe passa sobre agachamento', () => {
  const {game,events}=arena(); game.setInput(0,{down:true}); game.queue(0,'punch'); advance(game,.4); assert.equal(hits(events)[0].move,'crouchPunch');
  const {game:duck}=arena(); duck.start('rafael','local','marcelo'); duck.phase='fight'; duck.fighters[0].x=450; duck.fighters[1].x=580;
  duck.setInput(1,{down:true}); duck.queue(0,'punch'); advance(duck,.7); assert.equal(duck.fighters[1].hp,1000);
});
test('meia-lua para frente + soco lança poder espelhado para os dois lados', () => {
  for(const slot of [0,1]) { const {game,events}=arena(); game.fighters[0].x=250;game.fighters[1].x=950; motion(game,slot,[2,3,6]); game.queue(slot,'punch'); advance(game,.03); assert.equal(game.fighters[slot].action,'special'); advance(game,.3);
    assert.ok(events.some(e=>e.type==='special' && e.fighter===slot)); assert.equal(events.filter(e=>e.type==='swing').length,0); }
});
test('frente, baixo, diagonal + soco faz o golpe ascendente e concede invulnerabilidade inicial', () => {
  const {game}=arena(); game.fighters[1].x=950; motion(game,0,[6,2,3]);game.queue(0,'punch');advance(game,.03);
  assert.equal(game.fighters[0].action,'uppercut');assert.ok(game.fighters[0].invincible>0);advance(game,.10);assert.ok(game.fighters[0].airborne);assert.ok(game.fighters[0].vy<0);
});
test('comando direcional vencido não dispara um poder acidentalmente', () => {
  const {game}=arena();game.fighters[1].x=1000;motion(game,0,[2,3,6]);game.setInput(0,{});advance(game,.6);game.queue(0,'punch');advance(game,.02);assert.equal(game.fighters[0].action,'punch');
});
test('super exige barra cheia, aceita duas meias-luas e lança três ondas', () => {
  const {game,events}=arena();game.fighters[0].x=250;game.fighters[1].x=950;game.queue(0,'super');advance(game,.3);assert.equal(events.some(e=>e.move==='super'),false);
  game.fighters[0].meter=100;motion(game,0,[2,3,6,2,3,6]);game.queue(0,'punch');advance(game,.02);assert.equal(game.fighters[0].action,'super');assert.equal(game.fighters[0].meter,0);
  advance(game,.7);assert.equal(events.filter(e=>e.type==='projectile' && e.move==='super').length,3);assert.equal(events.filter(e=>e.type==='special' && e.move==='super').length,1);
});
test('poder normal não exige barra, limita um projétil e fala apenas no lançamento', () => {
  const {game,events}=arena();game.fighters[0].x=200;game.fighters[1].x=1050;game.queue(0,'special');advance(game,.15);
  assert.equal(game.fighters[0].meter,0);assert.equal(events.some(e=>e.type==='special'),false);advance(game,.13);assert.equal(game.projectiles.length,1);
  assert.equal(events.find(e=>e.type==='special').quote,'Código na tela!');game.queue(0,'special');advance(game,.4);assert.equal(events.filter(e=>e.type==='special').length,1);
});
test('cada poder emite sua fala em português e conserva o bordão no super', () => {
  for(const slot of [0,1])for(const move of ['special','uppercut','super']) {
    const {game,events}=arena();game.fighters[0].x=200;game.fighters[1].x=1050;game.fighters[slot].meter=100;game.queue(slot,move);
    until(game,()=>events.some(e=>e.type==='special'));
    const event=events.find(e=>e.type==='special');assert.equal(event.quote,game.fighters[slot].character.powerQuotes[move]);assert.equal(event.name,game.fighters[slot].character.powers[move]);
    if(move==='super')assert.ok(event.quote.includes(game.fighters[slot].character.quote));
  }
});
test('soco confirmado cancela em poder; soco no vazio precisa recuperar', () => {
  const {game,events}=arena();game.queue(0,'punch');until(game,()=>hits(events).length>0);game.queue(0,'special');until(game,()=>events.some(e=>e.type==='special'));
  assert.equal(events.filter(e=>e.type==='special').length,1);assert.equal(game.fighters[0].action,'special');
  const {game:whiff,events:miss}=arena();whiff.fighters[1].x=1000;whiff.queue(0,'punch',2);advance(whiff,.19);whiff.queue(0,'special');advance(whiff,.16);assert.equal(miss.some(e=>e.type==='special'),false);assert.equal(whiff.fighters[0].action,'punch');
});
test('não permite cancelar normal em outro normal durante impacto', () => {
  const {game,events}=arena();game.queue(0,'punch',2);until(game,()=>hits(events).length>0);game.queue(0,'kick');advance(game,.12);assert.equal(game.fighters[0].action,'punch');assert.equal(events.filter(e=>e.type==='swing').length,1);
});
test('agarrão de perto ignora defesa e derruba; agarrão distante falha', () => {
  const {game,events}=arena();game.setInput(1,{block:true});game.queue(0,'throw');advance(game,.3);assert.equal(hits(events)[0].move,'throw');assert.ok(game.fighters[1].knocked);assert.ok(game.fighters[1].hp<1000);
  const {game:far,events:miss}=arena();far.fighters[1].x=800;far.queue(0,'throw');advance(far,.6);assert.equal(hits(miss).length,0);
});
test('projéteis opostos colidem e se anulam', () => {
  const {game,events}=arena();game.fighters[0].x=300;game.fighters[1].x=900;game.queue(0,'special');game.queue(1,'special');advance(game,1);
  assert.equal(game.fighters[0].hp,1000);assert.equal(game.fighters[1].hp,1000);assert.equal(game.projectiles.length,0);assert.ok(events.some(e=>e.type==='clash'));
});
test('varredura registra projétil rápido sem atravessar o alvo', () => {
  const {game,events}=arena();game.projectiles.push({owner:0,character:'marcelo',move:'special',data:MOVES.special,direction:1,x:470,prevX:470,y:WORLD.floor-200,radius:27,speed:30000,life:2});game.update(1/30);
  assert.equal(hits(events).length,1);assert.ok(game.fighters[1].hp<1000);assert.equal(game.projectiles.length,0);
});
test('super acerta em combo e a contagem reinicia depois da recuperação', () => {
  const {game,events}=arena();game.fighters[0].x=250;game.fighters[1].x=800;game.fighters[0].meter=100;game.queue(0,'super');advance(game,1.7);
  assert.equal(hits(events).length,3);assert.deepEqual(hits(events).map(e=>e.combo),[1,2,3]);advance(game,1);game.fighters[0].x=450;game.fighters[1].x=580;game.queue(0,'punch');advance(game,.4);assert.equal(hits(events).at(-1).combo,1);
});
test('corpos respeitam paredes, saltos cruzam por cima e a direção vira ao pousar', () => {
  for(const side of ['left','right']) {const {game}=arena();const[a,b]=game.fighters;a.x=side==='left'?110:1058;b.x=a.x+112;game.setInput(side==='left'?1:0,side==='left'?{left:true}:{right:true});advance(game,1);assert.ok(b.x-a.x>=112-1e-8);assert.ok(a.x>=110 && b.x<=1170);}
  const {game}=arena();game.fighters[0].x=450;game.fighters[1].x=562;game.setInput(0,{jump:true,right:true});advance(game,.15);game.setInput(0,{});advance(game,1.05);assert.ok(game.fighters[0].x>game.fighters[1].x);assert.equal(game.fighters[0].direction,-1);assert.equal(game.fighters[0].y,WORLD.floor);
});
test('controle no fim da recuperação é aproveitado; não repete ao segurar ataque', () => {
  const {game,events}=arena();game.fighters[1].x=1000;game.queue(0,'kick');advance(game,.43);game.queue(0,'punch');advance(game,.3);assert.deepEqual(events.filter(e=>e.type==='swing').map(e=>e.move),['kick','punch']);
});
test('ataques simultâneos trocam dano; pausa congela a simulação', () => {
  const {game}=arena();game.start('marcelo','local','gustavo');game.phase='fight';game.fighters[0].x=450;game.fighters[1].x=580;
  game.queue(0,'punch');game.queue(1,'punch');advance(game,.3);assert.ok(game.fighters.every(f=>f.hp<1000));
  game.togglePause();const snapshot=game.fighters.map(f=>[f.hp,f.x,f.y]);const time=game.timer;game.queue(0,'super');advance(game,1);assert.equal(game.timer,time);assert.deepEqual(game.fighters.map(f=>[f.hp,f.x,f.y]),snapshot);
});
test('melhor de três mantém placar e encerra após duas vitórias', () => {
  const {game}=arena();game.fighters[1].hp=10;game.queue(0,'punch');advance(game,.4);assert.equal(game.fighters[0].wins,1);advance(game,6);assert.equal(game.round,2);assert.equal(game.fighters[0].wins,1);
  game.fighters[0].x=450;game.fighters[1].x=580;game.fighters[1].hp=10;game.queue(0,'punch');advance(game,4);assert.equal(game.phase,'result');assert.equal(game.fighters[0].wins,2);
});
test('tempo esgotado decide por vida e empate não soma vitória', () => {
  const {game}=arena();game.timer=.01;game.fighters[0].hp=800;advance(game,.1);assert.equal(game.roundWinner,1);
  const {game:tied}=arena();tied.timer=.01;advance(tied,.1);assert.equal(tied.roundWinner,null);assert.ok(tied.fighters.every(f=>f.wins===0));
});
test('carga parcial e completa atravessam os rounds 2 e 3, após KO, tempo e empate', () => {
  for (const id of Object.keys(CHARACTERS)) for (const slot of [0, 1]) for (const ending of ['ko', 'timeout', 'draw']) {
    const other = id === 'marcelo' ? 'rafael' : 'marcelo';
    const game = new FightEngine(); game.start(slot === 0 ? id : other, 'local', slot === 0 ? other : id);
    const meters = slot === 0 ? [37.5, 100] : [100, 37.5];
    game.fighters.forEach((f, i) => { f.meter = meters[i]; });
    for (const round of [1, 2]) {
      game.phase = 'fight'; game.phaseTime = 0;
      if (ending === 'ko') game.fighters[round === 1 ? 0 : 1].hp = 0;
      else { game.timer = 0; if (ending === 'timeout') game.fighters[round === 1 ? 0 : 1].hp = 500; }
      until(game, () => game.phase === 'roundEnd');
      assert.deepEqual(game.fighters.map(f => f.meter), meters);
      until(game, () => game.round === round + 1, 3.5);
      assert.deepEqual(game.fighters.map(f => f.meter), meters, `${id}, lado ${slot}, ${ending}, round ${round + 1}`);
      assert.ok(game.fighters.every(f => f.hp === 1000 && f.action === null && f.hitstun === 0));
      assert.equal(game.timer, 90); assert.equal(game.projectiles.length, 0);
    }
  }
});
test('o super guardado pode ser usado no próximo round e não recupera carga gasta', () => {
  for (const slot of [0, 1]) {
    const {game,events}=arena(); game.fighters[slot].meter=100;
    game.fighters[1-slot].hp=0; until(game,()=>game.phase==='roundEnd');
    until(game,()=>game.phase==='fight' && game.round===2,6);
    game.queue(slot,'super'); advance(game,.03);
    assert.equal(game.fighters[slot].meter,0); assert.equal(game.fighters[slot].action,'super');
    assert.equal(events.filter(e=>e.type==='superStart').length,1);
    advance(game,.8);
    assert.equal(events.filter(e=>e.type==='projectile' && e.move==='super').length,3);
    game.fighters[slot].hp=0; until(game,()=>game.phase==='roundEnd');
    const remaining=game.fighters.map(f=>f.meter); until(game,()=>game.round===3,3.5);
    assert.deepEqual(game.fighters.map(f=>f.meter),remaining); assert.equal(game.fighters[slot].meter,0);
  }
});
test('nova luta ou revanche começa com barras vazias em CPU e em dois jogadores', () => {
  for (const mode of ['cpu','local']) {
    const {game}=arena(); game.fighters.forEach(f=>{f.meter=100;f.wins=1;});
    game.start('marcelo',mode,'rafael'); assert.deepEqual(game.fighters.map(f=>f.meter),[0,0]);
    game.fighters[0].meter=63;game.fighters[1].meter=100;
    game.start('gustavo',mode,'marcelo'); assert.deepEqual(game.fighters.map(f=>f.meter),[0,0]);
    assert.equal(game.round,1);assert.ok(game.fighters.every(f=>f.wins===0));
  }
});
test('sequência de salto e poder produz o mesmo resultado em 30, 60 e 120 Hz', () => {
  const run=hz=>{const {game}=arena();game.fighters[0].x=300;game.fighters[1].x=900;game.setInput(0,{right:true,jump:true});for(let i=0;i<hz;i++)game.update(1/hz);game.setInput(0,{});game.queue(1,'special');for(let i=0;i<hz*2;i++)game.update(1/hz);return game.fighters.map(f=>[f.x,f.y,f.vx,f.hp]);};
  const expected=run(120);for(const hz of [30,60])run(hz).forEach((f,i)=>f.forEach((v,j)=>assert.ok(Math.abs(v-expected[i][j])<1e-7)));
});
