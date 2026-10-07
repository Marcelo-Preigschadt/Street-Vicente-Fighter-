import {FightEngine,Fighter,WORLD,COMBAT,SENTINEL} from './engine.js';
import {initMostafaEnemy,animateMostafa,mostafaEnemyIntent,mostafaCamera} from './mostafa-port.js';
import {STORY_HEROES,STORY_ACTS,STORY_RULES,ENEMY_TYPES} from './story-data.js';
import {storyPropBounds} from './story-props.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const idle=()=>({left:false,right:false,jump:false,down:false,block:false});
const copy=v=>JSON.parse(JSON.stringify(v));
const strikeData=(damage,level='mid')=>({damage,strength:1,stun:.24,blockstun:.16,push:220,meter:0,level,chip:.08,knockdown:false});
export class StoryEnemy extends Fighter {
  constructor(kind,slot,x){super('marcelo',slot);this.kind=kind;this.storyEnemy=true;this.x=x;this.prevX=x;this.y=WORLD.floor;this.maxHp=ENEMY_TYPES[kind].hp;this.hp=this.maxHp;this.aiTime=.65;this.attackSerial=0;this.attackMode='';this.hitIds=[];this.deadTime=0;this.intentX=x;this.cooldown=.5;this.telegraph=0;this.attackLife=0;this.lane=625;this.prevLane=625;this.intentLane=625;this.recovery=0;this.attackDirection=1;initMostafaEnemy(this);}
  get profile(){return ENEMY_TYPES[this.kind];}
  get hurtboxes(){if(this.hp<=0||this.invincible>0)return [];const p=this.profile;return [{x:this.x-p.w*.4,y:this.y-p.h,w:p.w*.8,h:p.h}];}
  get pushbox(){return this.hp>0?{x:this.x-45,y:this.y-120,w:90,h:120}:null;}
  get guard(){return {active:false,low:false,direction:this.direction};}
  get attackbox(){if(this.attackLife<=0)return null;if(!this.profile.fly&&['melee','grab','staff'].includes(this.attackMode)&&this.brawlerFrame!==(this.profile.boss?11:14))return null;const p=this.profile;let reach=p.range,height=160,h=140,near=20;
    if(this.attackMode==='slam'){reach=300;near=-300;height=22;h=44;}
    if(this.attackMode==='flame'){reach=470;height=125;h=90;}
    if(this.attackMode==='staff'){reach=320;height=205;h=90;}
    return {x:this.x+(this.direction>0?near:-reach),y:WORLD.floor-height-h/2,w:reach-near,h};}
}
export class StoryEngine extends FightEngine {
  constructor(options){super(options);this.storyActive=false;this.enemies=[];this.props=[];this.hazards=[];this.thrown=[];this.camera=0;this.nullEnemy=new Fighter('marcelo',99);this.nullEnemy.hp=0;}
  start(id,mode='cpu',other='rafael',options={}){
    if(!mode.startsWith('story-')){this.storyActive=false;return super.start(id,mode,other);}
    if(!STORY_HEROES.includes(id)||!STORY_HEROES.includes(other))throw new RangeError('Selecione um personagem disponível para o resgate.');
    this.storyActive=true;this.mode=mode;this.playerId=id;this.cpu=mode==='story-solo';this.paused=false;this.time=0;this.round=1;this.roundWinner=null;
    this.fighters=[new Fighter(id,0),new Fighter(other,1)];this.timer=clamp(options.timer??STORY_RULES.turnSeconds,1,STORY_RULES.turnSeconds);this.freeze=0;this.nextDroneId=1;
    this.story={act:clamp(options.act??0,0,3),wave:0,boss:false,bossPhase:1,duelist:0,seed:options.seed??0x51f4701,nextId:2,score:0,defeated:0,revives:0,checkpointTimer:STORY_RULES.turnSeconds,dialog:'entry',ending:false,notice:'',noticeTime:0,overclock:false};
    this.loadAct(this.story.act,true);
  }
  randomStory(){let n=this.story.seed>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;this.story.seed=n>>>0;return this.story.seed/4294967296;}
  entity(slot){return this.fighters[slot]??this.enemies.find(e=>e.slot===slot);}
  get party(){return this.mode==='story-solo'?[this.fighters[0]]:this.fighters;}
  get heroes(){return this.party.filter(f=>f.hp>0&&(!this.story.boss||f.slot===this.story.duelist));}
  targets(f){return f.storyEnemy?this.heroes:this.enemies.filter(e=>e.hp>0);}
  opponentFor(f){if(!this.storyActive)return super.opponentFor(f);return this.targets(f).slice().sort((a,b)=>(Math.abs(a.x-f.x)+Math.abs((a.lane??625)-(f.lane??625))*3)-(Math.abs(b.x-f.x)+Math.abs((b.lane??625)-(f.lane??625))*3)||a.slot-b.slot)[0]??this.nullEnemy;}
  setInput(slot,input){
    if(!this.storyActive)return super.setInput(slot,input);
    const f=this.fighters[slot];if(!f)return;
    if(!this.heroes.includes(f)||this.phase!=='fight'){f.input=idle();f.laneInput=0;return;}
    f.laneInput=Number(input.down===true)-Number(input.up===true);
    // The belt plane and jump height are independent. S/Down no longer crouches.
    super.setInput(slot,{...input,down:input.crouch===true});
  }
  beginFootwork(f,kind){if(!this.storyActive)return super.beginFootwork(f,kind);if(!f.canAct||f.airborne)return false;f.runUntil=this.time+.85;return true;}
  spawnProjectile(f,data,wave){super.spawnProjectile(f,data,wave);if(this.storyActive)this.projectiles.at(-1).lane=f.lane;}

  queue(slot,move,strength=1){
    if(!this.storyActive)return super.queue(slot,move,strength);
    if(this.paused)return;
    if(move==='storyNext'){if(this.phase==='storyDialog')this.nextDialog();return;}
    if(move==='storyRetry'){if(this.phase==='result'&&!this.story.ending)this.retryAct();return;}
    if(move==='storySwap'){if(this.phase==='fight'&&this.story.boss&&!this.cpu)this.swapDuelist(slot);return;}
    const f=this.fighters[slot];if(this.phase!=='fight'||!this.heroes.includes(f))return;
    if(move==='storySpecial')move=f.meter>=100?'super':'special';
    if(move==='punch'&&this.handleCarry(f))return;
    // Strike furniture legs with the existing low kick instead of kicking above it.
    if(move==='kick'&&!f.airborne&&this.props.some(p=>!p.used&&['chair','table'].includes(p.kind)&&this.sameLane(f,p)&&(p.x-f.x)*f.direction>=0&&Math.abs(p.x-f.x)<220))move='sweep';
    if(move==='throw'&&this.interact(f))return;
    super.queue(slot,move,strength);
  }
  beginMove(f,move,strength=1,cancel=false){
    if(!this.storyActive)return super.beginMove(f,move,strength,cancel);
    const normal=['punch','kick'].includes(move),chain=normal&&f.moveData&&f.actionHit&&!f.airborne&&f.actionTime>=f.moveData.startup+f.moveData.active*.5&&['punch','kick'].includes(f.action);
    const begun=super.beginMove(f,move,strength,cancel||chain);
    if(begun){f.storyHits=[];if(normal){f.brawlerChain=this.time-(f.brawlerContact??-10)<.8?Math.min(3,(f.brawlerChain??0)+1):1;f.brawlerContact=this.time;if(f.brawlerChain===3){f.moveData={...f.moveData,knockdown:true,launch:350,damage:f.moveData.damage*1.25};f.brawlerChain=0;}}}
    return begun;
  }
  loadAct(act,first=false){
    this.story.act=act;this.story.wave=0;this.story.nextId=2;this.story.boss=false;this.story.bossPhase=1;this.story.dialog='entry';this.story.overclock=false;this.story.dropWave=0;this.story.noticeTime=0;
    this.story.checkpointTimer=this.timer;this.clearField();this.camera=0;
    this.fighters.forEach((f,i)=>{f.reset(first?25:Math.max(25,f.meter));f.x=210+i*145;f.prevX=f.x;f.direction=1;f.lane=625-i*65;f.prevLane=f.lane;f.laneInput=0;f.runUntil=0;f.brawlerChain=0;f.brawlerContact=-10;f.carry=null;f.carryTime=0;f.storyVelocityX=0;f.storyVelocityY=0;if(this.mode==='story-solo'&&i===1){f.hp=0;f.input=idle();}});
    this.setupProps();for(const p of this.props)p.lane??=625;this.phase='storyDialog';this.phaseTime=0;this.event('storyAct',{act,checkpoint:true});
  }
  clearField(){this.enemies=[];this.props=[];this.hazards=[];this.thrown=[];this.projectiles=[];this.drones=[];this.lasers=[];this.wallTransfers=[];this.freeze=0;}
  setupProps(){
    const a=this.story.act;
    for(let i=0;i<3;i++){
      const x=(a===0?[2100,2650,3200]:[640,1650,2590])[i];
      if(a===0){this.props.push({id:`table${i}`,kind:'table',lane:595,x,hp:160,maxHp:160,used:false},{id:`chair${i}`,kind:'chair',lane:610,x:x+160,hp:80,maxHp:80,used:false},{id:`seat${i}`,kind:'chair',lane:565,x:x-150,hp:80,maxHp:80,used:false});if(i<2)this.props.push({id:`soda${i}`,kind:'soda',lane:540,x:[1800,3500][i],hp:200,maxHp:200,used:false,cooldown:0});}
      if(a===1)this.hazards.push({id:`tube${i}`,kind:i%2?'frost':'acid',lane:595,x:x+280,w:190,clock:i*1.2,period:7,warning:1.3,active:2.4,hits:{}});
      if(a===2)this.props.push({id:`shelf${i}`,kind:'shelf',lane:550,x:x+240,hp:110,used:false,fall:0,hits:{}});
      if(a===3)this.hazards.push({id:`cable${i}`,kind:'cable',lane:560,x:x+320,w:150,clock:i*1.7,period:6.5,warning:1.25,active:1.6,hits:{}});
    }
  }
  nextDialog(){
    const d=this.story.dialog;
    if(d==='entry'){this.phase='fight';this.story.dialog=null;this.event('fight');return;}
    if(d==='boss'){this.phase='fight';this.story.dialog=null;this.event('fight');return;}
    if(d==='exo'){for(const f of this.party){this.clearAction(f);f.buffer=null;f.input=idle();f.x=310;f.prevX=310;f.y=WORLD.floor;f.vy=0;f.knocked=false;f.hitstun=0;f.invincible=.5;}this.spawnEnemy('exo',950);this.phase='fight';this.story.dialog=null;this.event('fight');return;}
    if(d==='clear'){if(this.story.act===3){this.finish(true);return;}this.loadAct(this.story.act+1);}
  }
  notice(text){this.story.notice=text;this.story.noticeTime=3.2;this.event('storyNotice',{text});}
  spawnEnemy(kind,x,lane=625){const e=new StoryEnemy(kind,this.story.nextId++,x);e.lane=lane;e.prevLane=lane;e.intentLane=lane;e.direction=-1;const p=e.profile;if(p.fly){e.y=WORLD.floor-p.fly;e.prevY=e.y;}e.aiTime=.55+this.randomStory()*.8;this.enemies.push(e);return e;}
  spawnWave(){
    const wave=this.story.wave,gate=STORY_RULES.gates[wave],types=STORY_ACTS[this.story.act].waves[wave];
    this.enemies=this.enemies.filter(e=>e.hp>0);
    for(let i=0;i<types.length;i++){const behind=i%2&&!ENEMY_TYPES[types[i]].fly,x=behind?Math.max(this.camera+110,this.heroes[0].x-340):gate+120+Math.floor(i/2)*120;this.spawnEnemy(types[i],x,545+(i%3)*50);}
    this.story.wave++;this.notice(`ONDA ${this.story.wave} / 3 · Desative os equipamentos`);
  }
  beginBoss(){
    this.story.boss=true;this.story.bossPhase=1;this.story.dialog='boss';this.story.noticeTime=0;this.story.duelist=this.party.find(f=>f.hp>0)?.slot??0;
    const stats=this.fighters.map(f=>({hp:f.hp,meter:f.meter}));this.clearField();this.camera=0;
    this.fighters.forEach((f,i)=>{f.reset(stats[i].meter);f.hp=stats[i].hp;f.x=310;f.prevX=310;f.lane=625;f.prevLane=625;f.laneInput=0;f.direction=1;});
    this.spawnEnemy(STORY_ACTS[this.story.act].boss,950);
    if(this.story.act===3){this.story.overclock=true;for(const f of this.party)f.meter=100;}
    this.phase='storyDialog';this.phaseTime=0;this.event('storyBoss',{act:this.story.act});
  }
  swapDuelist(requester){
    const next=this.party.find(f=>f.slot!==this.story.duelist&&f.hp>0);if(!next||this.story.swapCooldown>0)return false;
    const current=this.fighters[this.story.duelist];if(current.action||current.hitstun>0||current.knocked||current.airborne)return false;
    next.x=current.x;next.prevX=next.x;next.y=WORLD.floor;next.lane=current.lane;next.prevLane=next.lane;next.direction=current.direction;next.invincible=.4;next.input=idle();current.input=idle();current.buffer=null;
    this.story.duelist=next.slot;this.story.swapCooldown=1;this.notice(`P${next.slot+1} assumiu o duelo`);return true;
  }
  retryAct(){this.timer=this.story.checkpointTimer;this.story.revives++;this.story.ending=false;this.loadAct(this.story.act,true);}
  finish(won){this.phase='result';this.story.ending=won;this.story.dialog=null;this.projectiles=[];this.drones=[];this.lasers=[];this.party.forEach(f=>{f.input=idle();f.state=won?'victory':'ko';this.clearAction(f);});this.event('storyResult',{won,score:this.story.score,act:this.story.act});}
  update(dt){if(!this.storyActive)return super.update(dt);if(this.paused||this.phase==='selection'||this.phase==='result')return;let remaining=Math.min(Math.max(dt,0),.1);while(remaining>1e-9){const step=Math.min(1/120,remaining);this.step(step);remaining-=step;}}
  step(dt){
    if(!this.storyActive)return super.step(dt);
    if(this.paused||['selection','storyDialog','result'].includes(this.phase))return;
    for(const f of [...this.party,...this.enemies]){f.prevX=f.x;f.prevY=f.y;f.prevLane=f.lane;f.prevWalkDistance=f.walkDistance;f.prevWalkBlend=f.walkBlend;f.prevActionTime=f.actionTime;}
    if(this.freeze>0){this.freeze=Math.max(0,this.freeze-dt);return;}
    this.time+=dt;this.phaseTime+=dt;this.timer=Math.max(0,this.timer-dt);this.story.noticeTime=Math.max(0,this.story.noticeTime-dt);this.story.swapCooldown=Math.max(0,(this.story.swapCooldown??0)-dt);
    if(this.timer<=0){this.finish(false);return;}
    this.updateFacing();const contacts=[];
    for(const f of this.heroes){
      const canWalk=!f.action&&!f.knocked&&f.hitstun<=0&&f.blockstun<=0&&!f.input.block&&!f.airborne;
      super.updateFighter(f,dt);
      if(canWalk&&!f.action&&!f.airborne){
        const horizontal=Number(f.input.right)-Number(f.input.left),vertical=f.laneInput??0,diagonal=horizontal&&vertical?Math.SQRT1_2:1;
        const target=vertical*175*diagonal*(f.carry?.kind==='table' ? .72 : 1);
        f.storyVelocityY+=clamp(target-f.storyVelocityY,-1500*dt,1500*dt);
        f.lane=clamp(f.lane+f.storyVelocityY*dt,STORY_RULES.laneTop,STORY_RULES.laneBottom);
        if(Math.abs(f.storyVelocityY)>8)f.state='walk';
      }else f.storyVelocityY=0;
      const distance=Math.hypot(f.x-f.prevX,(f.lane-f.prevLane)*1.25),walking=canWalk&&!f.action&&!f.airborne&&distance>1e-5;
      f.walkDistance+=walking?distance:0;
      f.walkBlend=clamp(f.walkBlend+(walking?1:-1)*dt*14,0,1);
      if(!['walk','idle'].includes(f.state))f.walkBlend=0;
      f.carryTime=Math.max(0,f.carryTime-dt);

    }
    for(const e of this.enemies)this.updateEnemy(e,dt,contacts);
    this.resolveStoryBodies();this.resolveMelee(contacts);this.updateProjectiles(dt,contacts);this.updateDrones(dt,contacts);this.updateProps(dt,contacts);this.updateHazards(dt,contacts);
    const guards=new Map([...this.party,...this.enemies].map(f=>[f.slot,{...f.guard}]));
    for(const contact of contacts)if(contact.target.hp>0&&contact.target.invincible<=0)this.hit(contact,guards.get(contact.target.slot));
    this.wallTransfers=[];this.projectiles=this.projectiles.filter(p=>p.life>0);this.thrown=this.thrown.filter(p=>p.life>0);
    for(const e of this.enemies)if(e.hp<=0&&!e.counted){e.counted=true;this.story.score+=e.profile.boss?1000:100;this.story.defeated++;this.event('storyEnemyDown',{x:e.x,y:e.y-100,color:e.profile.color});}
    this.checkProgress(dt);
  }
  updateFacing(){if(!this.storyActive)return super.updateFacing();for(const f of this.heroes){if(f.action||f.airborne||f.knocked||f.hitstun>0)continue;const move=Number(f.input.right)-Number(f.input.left);if(move&&move!==f.direction){f.direction=move;f.directions=[];f.lastDirection=5;}}}
  sameLane(a,b,reach=STORY_RULES.laneReach){return Math.abs((a.lane??625)-(b.lane??625))<=reach;}
  integrate(f,dt){
    if(!this.storyActive)return super.integrate(f,dt);
    if(f.storyEnemy){f.x=clamp(f.x+(f.vx+f.knockback)*dt,this.story.boss?90:this.camera+40,this.story.boss?1190:Math.min(3560,this.camera+1240));if(f.y<WORLD.floor||f.vy){f.vy+=WORLD.gravity*dt;f.y+=f.vy*dt;if(f.y>=WORLD.floor){f.y=WORLD.floor;f.vy=0;}}f.knockback*=Math.max(0,1-dt*8);return;}
    if(!f.action&&!f.knocked&&f.hitstun<=0&&f.blockstun<=0&&!f.airborne&&f.landing<=0&&!f.input.down&&!f.input.block){
      const diagonal=(f.input.left||f.input.right)&&f.laneInput?Math.SQRT1_2:1;
      const target=f.vx*diagonal*(f.runUntil>this.time?1.65:1)*(f.carry?.kind==='table' ? .72 : 1);
      f.storyVelocityX+=clamp(target-f.storyVelocityX,-(target?2300:3400)*dt,(target?2300:3400)*dt);
      f.vx=f.storyVelocityX;
    }else f.storyVelocityX=0;
    // Translate the existing landing/recoil physics into the scrolling camera's local arena.
    const left=this.story.boss?110:this.camera+70,right=this.story.boss?1170:Math.min(3530,this.camera+1210);
    const scale=(right-left)/1060,oldX=f.x,oldPrev=f.prevX;
    f.x=110+(f.x-left)/scale;f.vx/=scale;f.knockback/=scale;f.recoilDeceleration/=scale;
    const transfers=this.wallTransfers;this.wallTransfers=[];super.integrate(f,dt);this.wallTransfers=transfers;
    f.x=left+(f.x-110)*scale;f.vx*=scale;f.knockback*=scale;f.recoilDeceleration*=scale;f.prevX=oldPrev;
    if(!Number.isFinite(f.x))f.x=oldX;
  }
  resolveStoryBodies(){for(const f of this.heroes)for(const e of this.enemies){if(e.hp<=0||e.profile.fly||f.airborne||e.knocked||!this.sameLane(f,e,28))continue;const gap=f.x-e.x,dist=65+e.profile.w*.2;if(Math.abs(gap)<dist){const sign=gap>=0?1:-1;e.x=clamp(e.x-sign*dist*.08,this.camera+40,this.story.boss?1190:this.camera+1240);f.x=clamp(e.x+sign*dist,this.camera+70,this.story.boss?1170:this.camera+1210);}}}
  resolveMelee(contacts){
    for(const f of this.heroes){
      const a=f.attackbox,m=f.moveData;if(!m||f.movePhase!=='active')continue;f.storyHits??=[];
      for(const e of this.enemies){if(e.hp<=0||e.invincible>0||f.storyHits.includes(e.slot)||!this.sameLane(f,e))continue;
        const b=e.hurtboxes.find(b=>m.level==='throw'?Math.abs(e.x-f.x)<150&&!e.profile.fly&&!f.airborne:a&&overlap(a,b));
        if(!b)continue;f.storyHits.push(e.slot);f.actionHit=true;contacts.push({attacker:f,target:e,move:f.action,data:m,x:clamp(e.x,a?.x??e.x,(a?.x??e.x)+(a?.w??0)),y:a?a.y+a.h/2:e.y-130});
      }
      if(a)for(const prop of this.props)if(this.sameLane(f,prop)&&!prop.used&&prop.kind!=='medkit'&&overlap(a,this.propBox(prop))&&!f.storyHits.includes(prop.id)){f.storyHits.push(prop.id);this.damageProp(prop,m.damage,f);}
    }
  }
  updateEnemy(e,dt,contacts){
    e.animTime+=dt;e.flash=Math.max(0,e.flash-dt);e.invincible=Math.max(0,e.invincible-dt);e.hitstun=Math.max(0,e.hitstun-dt);e.dizzyTime=Math.max(0,e.dizzyTime-dt);e.aiTime-=dt;e.cooldown=Math.max(0,e.cooldown-dt);
    if(e.hp<=0){e.deadTime+=dt;e.state='ko';e.vx=0;e.brawlerEngaging=false;animateMostafa(e,'fall',dt);return;}
    const p=e.profile,target=this.opponentFor(e);if(target.hp<=0)return;
    if(e.telegraph<=0&&e.attackLife<=0)e.direction=target.x>=e.x?1:-1;
    if(e.hitstun>0||e.knocked){e.brawlerEngaging=false;e.brawlerState='run';animateMostafa(e,e.knocked?'fall':'hit',dt);e.state='hit';e.vx=0;if(!p.fly||e.knocked)this.integrate(e,dt);if(e.y>=WORLD.floor&&e.hitstun<=0){e.knocked=false;e.vy=0;e.state='idle';}return;}
    if(p.fly)e.y=WORLD.floor-p.fly+Math.sin(this.time*3+e.slot)*10;
    if(e.telegraph>0){animateMostafa(e,'windup',dt);e.telegraph=Math.max(0,e.telegraph-dt);e.state='windup';e.vx=0;if(e.telegraph<=0)this.fireEnemy(e,target);return;}
    if(e.attackLife>0){animateMostafa(e,'attack',dt);e.attackLife=Math.max(0,e.attackLife-dt);e.state='attack';
      if(e.attackMode==='charge'){e.vx=e.direction*460;this.integrate(e,dt);}
      for(const hero of this.heroes){if(e.hitIds.includes(hero.slot)||hero.invincible>0||!this.sameLane(e,hero,e.attackMode==='slam'?65:42))continue;const box=e.attackbox;if(box&&hero.hurtboxes.some(b=>overlap(box,b))){e.hitIds.push(hero.slot);contacts.push({attacker:e,target:hero,move:'kick',data:{...strikeData(p.damage*(p.boss?1:1.65),e.attackMode==='grab'?'throw':e.attackMode==='slam'?'low':'mid'),knockdown:['charge','slam','grab'].includes(e.attackMode),launch:300},x:hero.x,y:hero.y-125});}}
      return;
    }
    e.brawlerEngaging=false;e.state='idle';e.action=null;e.moveData=null;e.recovery=Math.max(0,e.recovery-dt);if(e.recovery>0){e.vx=0;return;}
    const dist=Math.abs(target.x-e.x);
    let engage;
    if(!p.fly)engage=mostafaEnemyIntent(this,e,target,dt);
    else{
      const dz=target.lane-e.lane;e.lane=clamp(e.lane+Math.sign(dz)*Math.min(Math.abs(dz),p.speed*.72*dt),STORY_RULES.laneTop,STORY_RULES.laneBottom);
      if(dist>p.range){e.vx=e.direction*p.speed;e.state='walk';this.integrate(e,dt);}else e.vx=0;
      engage=e.cooldown<=0&&e.aiTime<=0&&dist<=p.range+30&&this.sameLane(e,target,24);
    }
    if(engage){
      e.attackSerial++;e.hitIds=[];e.intentX=target.x;e.intentLane=target.lane;e.attackDirection=e.direction;e.attackMode=p.ranged?'shot':'melee';
      if(e.kind==='inspector')e.attackMode=e.attackSerial%3===0?'charge':e.attackSerial%3===2&&dist<180?'grab':'staff';
      else if(!p.ranged&&e.attackSerial%4===0&&dist<160)e.attackMode='grab';
      if(e.kind==='fairRobot')e.attackMode='flame';
      if(e.kind==='substitute')e.attackMode=e.attackSerial%3===0?'shot':'staff';
      if(e.kind==='aula')e.attackMode=e.attackSerial%2?'shot':'teleport';
      if(e.kind==='exo')e.attackMode=e.attackSerial%2?'slam':'charge';
      e.telegraph=p.boss?.45:.16;animateMostafa(e,'windup',0);e.cooldown=p.boss?1.3:.85+this.randomStory()*.55;e.aiTime=e.cooldown;
    }
  }
  fireEnemy(e,target){
    const p=e.profile;e.direction=e.attackDirection;e.recovery=p.boss?.45:.25;
    if(e.attackMode==='teleport'){e.x=clamp(e.intentX-e.direction*250,200,1080);e.prevX=e.x;e.invincible=.18;e.attackMode='melee';}
    if(e.attackMode==='shot'){
      const y=e.profile.fly?e.y-p.h/2:WORLD.floor-160;
      this.projectiles.push({owner:e.slot,lane:e.intentLane,character:'enemy',direction:e.direction,move:'special',data:strikeData(p.damage*(p.boss?1:1.65)),x:e.x+e.direction*70,prevX:e.x+e.direction*70,y,radius:e.kind==='book'||e.kind==='projector'?28:17,speed:e.kind==='scanner'?820:460,life:3,effect:e.kind,color:p.color});
      e.attackLife=.2;
    }else e.attackLife=e.attackMode==='flame'?.75:e.attackMode==='charge'?.55:.25;
    this.event('storyEnemyAttack',{x:e.x,y:e.y-140,color:p.color});
  }
  hit(contact,guard){
    if(!this.storyActive)return super.hit(contact,guard);
    if(contact.attacker.storyEnemy===contact.target.storyEnemy)return;
    const before=contact.target.hp,t=contact.target,committed=t.storyEnemy&&t.profile.boss&&(t.attackLife>0||t.telegraph>0&&t.telegraph<.25),attack=committed?{attackLife:t.attackLife,telegraph:t.telegraph,attackMode:t.attackMode,hitIds:[...t.hitIds]}:null;super.hit(contact,guard);if(t.carry&&t.hp<before){this.thrown.push({kind:t.carry.kind,lane:t.lane,x:t.x,y:t.y-100,vx:-t.direction*100,vy:-100,owner:t.slot,life:.8,angle:0,hits:[]});t.carry=null;}
    if(!contact.target.storyEnemy&&contact.target.hp<before)contact.target.invincible=Math.max(contact.target.invincible,.22);
    if(contact.target.storyEnemy){const t=contact.target;t.dizzyPending=false;t.stunGauge=0;if(t.profile.boss){t.hitstun=Math.min(t.hitstun,.2);t.invincible=Math.max(t.invincible,.1);t.knocked=false;t.vy=0;t.y=WORLD.floor;t.recovery=.2;}if(contact.data.effect==='chemicalSmoke'){contact.target.hitstun=Math.max(contact.target.hitstun,contact.data.dizzyDuration??1.9);contact.target.dizzyTime=contact.target.hitstun;if(contact.target.profile.fly){contact.target.knocked=false;contact.target.vy=0;}}contact.target.telegraph=0;contact.target.attackLife=0;contact.target.cooldown=Math.max(.4,contact.target.cooldown);if(contact.data.knockdown&&!contact.target.profile.boss){contact.target.knocked=true;contact.target.hitstun=Math.max(contact.target.hitstun,.65);}}
    if(committed&&t.hp>0){Object.assign(t,attack);t.hitstun=0;t.knocked=false;t.knockback=0;t.vy=0;t.y=WORLD.floor;}
    if(contact.attacker.storyEnemy)contact.attacker.combo=0;
  }
  addMeter(f,amount){if(this.storyActive&&f.storyEnemy)return;super.addMeter(f,amount);}
  updateProjectiles(dt,contacts){
    if(!this.storyActive)return super.updateProjectiles(dt,contacts);
    for(const p of this.projectiles){p.prevX=p.x;p.x+=p.direction*p.speed*dt;p.life-=dt;if(p.life<=0)continue;
      const attacker=this.entity(p.owner);if(!attacker){p.life=0;continue;}
      const sweep={x:Math.min(p.x,p.prevX)-p.radius,y:p.y-p.radius,w:Math.abs(p.x-p.prevX)+p.radius*2,h:p.radius*2};
      const targets=this.targets(attacker).slice().sort((a,b)=>(a.x-b.x)*p.direction);
      for(const t of targets){if(t.invincible>0||!this.sameLane({lane:p.lane??attacker.lane},t))continue;const box=t.hurtboxes.find(b=>overlap(sweep,b));if(box){contacts.push({attacker,target:t,move:p.move,data:p.data,x:clamp(p.x,box.x,box.x+box.w),y:p.y,direction:p.direction});p.life=0;break;}}
      if(!attacker.storyEnemy&&p.life>0)for(const prop of this.props)if(!prop.used&&prop.kind!=='medkit'&&this.sameLane({lane:p.lane??attacker.lane},prop)&&overlap(sweep,this.propBox(prop))){this.damageProp(prop,p.data.damage,attacker);p.life=0;break;}
      if(p.x<this.camera-300||p.x>(this.story.boss?1580:this.camera+1600))p.life=0;
    }
  }
  deploySwarm(f,data){if(!this.storyActive)return super.deploySwarm(f,data);const x=f.x;super.deploySwarm(f,data);const group=this.drones.filter(d=>d.owner===f.slot&&d.createdAt===this.time);for(const d of group)d.x=clamp(x+f.direction*(80+(d.index%3)*68),this.camera+35,this.camera+1245);}
  deployDrone(f,data){if(!this.storyActive)return super.deployDrone(f,data);super.deployDrone(f,data);this.drones.at(-1).x=clamp(f.x+f.direction*SENTINEL.offset,this.camera+35,this.camera+1245);}
  updateDrones(dt,contacts){
    if(!this.storyActive)return super.updateDrones(dt,contacts);
    for(const l of this.lasers){l.age=this.time-l.createdAt;l.life=Math.max(0,SENTINEL.beamDuration-l.age);}this.lasers=this.lasers.filter(l=>l.life>0);
    for(const d of this.drones){d.age=this.time-d.createdAt;if(d.dead||d.fired)continue;const caster=this.fighters[d.owner],target=this.opponentFor(caster);if(target.hp<=0)continue;d.lane=caster.lane;if(!d.swarm&&!this.sameLane(caster,target))continue;
      const delay=d.swarm?d.fireDelay:SENTINEL.delay;
      if(d.swarm){const want=caster.x+caster.direction*(80+d.index%3*68);d.x+=clamp(want-d.x,-dt*210,dt*210);d.direction=target.x>=d.x?1:-1;}
      if(d.age<delay)continue;
      const boxes=target.hurtboxes,box=boxes.slice().sort((a,b)=>b.w*b.h-a.w*a.h)[0];
      let x=d.x+d.direction*800,y=d.y;
      if(d.swarm&&box){x=box.x+box.w/2;y=box.y+box.h/2;}
      else if(box&&Math.abs(box.y+box.h/2-d.y)<box.h/2+8&&(target.x-d.x)*d.direction>0)x=target.x;else continue;
      d.fired=true;d.firedAt=this.time;this.lasers.push({id:d.id,owner:d.owner,lane:d.lane,x:d.x,y:d.y,endX:x,endY:y,direction:d.direction,createdAt:this.time,age:0,life:SENTINEL.beamDuration});
      if(box)contacts.push({attacker:caster,target,move:d.swarm?'super':'drone',data:d.data,x,y,direction:target.x>=caster.x?1:-1});
      this.event('droneFire',{id:d.id,fighter:d.owner,character:d.character,x:d.x,y:d.y,endX:x,endY:y,direction:d.direction,color:caster.character.color});
    }
    this.drones=this.drones.filter(d=>!d.dead&&d.age<4&&(!d.fired||this.time-d.firedAt<SENTINEL.retireTime));
  }
  propBox(p){return storyPropBounds(p,WORLD.floor);}
  handleCarry(f){
    if(!f.canAct||f.airborne||f.carryTime>0)return !!f.carry&&f.carryTime>0;
    if(f.carry){const kind=f.carry.kind;f.carry=null;f.carryTime=.22;
      this.thrown.push({kind,lane:f.lane,x:f.x+f.direction*85,y:f.y-170,vx:f.direction*700,vy:-290,owner:f.slot,life:2.2,angle:0,hits:[]});
      super.beginMove(f,'throw',1);this.notice(kind==='table'?'Mesa arremessada!':'Cadeira arremessada!');return true;
    }
    if(this.enemies.some(e=>e.hp>0&&this.sameLane(f,e)&&Math.abs(e.x-f.x)<190))return false;
    const p=this.props.find(p=>!p.used&&['chair','table'].includes(p.kind)&&Math.abs(p.x-f.x)<100&&this.sameLane(f,p));
    if(!p)return false;p.used=true;f.carry={kind:p.kind,id:p.id};f.carryTime=.18;this.notice('Objeto em mãos · Soco para arremessar');return true;
  }
  interact(f){if(!f.canAct||f.airborne)return false;const p=this.props.filter(p=>!p.used&&['chair','table','shelf'].includes(p.kind)&&Math.abs(p.x-f.x)<145&&this.sameLane(f,p)).sort((a,b)=>(Math.abs(a.x-f.x)+Math.abs((a.lane??625)-(f.lane??625))*3)-(Math.abs(b.x-f.x)+Math.abs((b.lane??625)-(f.lane??625))*3))[0];if(!p)return false;
    if(p.kind==='shelf'){this.damageProp(p,p.hp,f);return true;}p.used=true;this.thrown.push({kind:p.kind,lane:f.lane,x:f.x+f.direction*65,y:f.y-145,vx:f.direction*700,vy:-340,owner:f.slot,life:2.2,angle:0,hits:[]});this.notice(p.kind==='table'?'Mesa arremessada!':'Cadeira arremessada!');return true;}
  damageProp(p,damage,f){
    if(p.used)return;p.hp-=damage;p.flash=.14;
    if(p.kind==='soda'&&(p.cooldown??0)<=0){p.cooldown=.7;this.thrown.push({kind:'can',lane:p.lane??625,x:p.x,y:WORLD.floor-160,vx:f.direction*520,vy:-500,owner:f.slot,life:2.5,angle:0,hits:[]});this.notice('Lata explosiva liberada!');}
    if(p.hp<=0){p.used=true;if(p.kind==='shelf'){p.fall=.01;p.owner=f.slot;this.notice('Estante caindo! Saia da área marcada.');}else {p.brokenTime=.001;this.event('storyPropBreak',{kind:p.kind,x:p.x,y:WORLD.floor-100,color:'#ebc076'});if(['table','chair'].includes(p.kind))this.notice(p.kind==='table'?'Mesa destruída!':'Cadeira destruída!');}}
  }
  updateProps(dt,contacts){
    for(const p of this.props){p.flash=Math.max(0,(p.flash??0)-dt);if(p.brokenTime>0)p.brokenTime+=dt;if(p.kind==='medkit'&&!p.used){const hero=this.heroes.find(f=>!f.airborne&&this.sameLane(f,p)&&Math.abs(f.x-p.x)<85);if(hero){p.used=true;hero.hp=Math.min(1000,hero.hp+220);this.notice(`P${hero.slot+1} · Recuperação +220`);}}p.cooldown=Math.max(0,(p.cooldown??0)-dt);if(p.kind==='shelf'&&p.fall>0&&p.fall<1.5){p.fall+=dt;if(p.fall>.85){const region={x:p.x-100,y:WORLD.floor-110,w:350,h:110};for(const t of [...this.heroes,...this.enemies]){if(t.hp<=0||p.hits[t.slot]||!this.sameLane(p,t,65)||!t.hurtboxes.some(b=>overlap(region,b)))continue;p.hits[t.slot]=true;this.environmentHit(t,140,p.x,contacts);} }}}
    for(const p of this.thrown){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=2000*dt;p.angle+=dt*7;const box={x:p.x-40,y:p.y-40,w:80,h:80};
      for(const e of this.enemies){if(e.hp<=0||p.hits.includes(e.slot)||!this.sameLane(p,e)||!e.hurtboxes.some(b=>overlap(box,b)))continue;p.hits.push(e.slot);contacts.push({attacker:this.fighters[p.owner],target:e,move:'throw',data:{...strikeData(p.kind==='can'?145:p.kind==='table'?175:125),knockdown:true,launch:300},x:p.x,y:p.y,direction:Math.sign(p.vx)});if(p.kind==='can'){this.explodeCan(p,contacts);break;}}
      if(p.y>=WORLD.floor){if(p.kind==='can')this.explodeCan(p,contacts);else if(this.props.length<30)this.props.push({id:`debris-${this.time}-${p.owner}`,kind:p.kind,lane:p.lane,x:p.x,hp:0,used:true,brokenTime:.001});p.life=0;}
    }
  }
  explodeCan(p,contacts){if(p.life<=0)return;p.life=0;this.event('clash',{x:p.x,y:p.y,color:'#ffc777'});for(const e of this.enemies)if(e.hp>0&&!p.hits.includes(e.slot)&&Math.abs(e.x-p.x)<210&&this.sameLane(p,e,65)){p.hits.push(e.slot);contacts.push({attacker:this.fighters[p.owner],target:e,move:'throw',data:strikeData(110),x:e.x,y:e.y-100,direction:Math.sign(e.x-p.x)||1});}}
  environmentHit(target,damage,x,contacts){const source=this.nullEnemy;source.x=x;source.direction=target.x>=x?1:-1;
    // Hazards damage both teams directly, independent of friendly-fire checks.
    if(target.invincible>0)return;target.hp=Math.max(0,target.hp-damage);target.hitstun=.22;target.flash=.08;target.vx=0;this.clearAction(target);this.event('storyHazardHit',{x:target.x,y:target.y-70,color:'#ff7979'});}
  updateHazards(dt,contacts){for(const h of this.hazards){h.clock+=dt;const cycle=h.clock%h.period,active=cycle>=h.warning&&cycle<h.warning+h.active;if(!active)continue;
    const region={x:h.x-h.w/2,y:WORLD.floor-(h.kind==='cable'?260:28),w:h.w,h:h.kind==='cable'?260:28};
    for(const t of [...this.heroes,...this.enemies]){if(t.hp<=0||!this.sameLane(h,t,55)||this.time-(h.hits[t.slot]??-100)<1.1||!t.hurtboxes.some(b=>overlap(region,b)))continue;h.hits[t.slot]=this.time;this.environmentHit(t,h.kind==='acid'?45:h.kind==='frost'?22:48,h.x,contacts);if(h.kind==='frost')t.hitstun=.6;}
  }}
  checkProgress(dt){
    if(this.party.every(f=>f.hp<=0)){this.finish(false);return;}
    if(this.story.boss){
      const f=this.fighters[this.story.duelist];if(f.hp<=0){const partner=this.party.find(p=>p.hp>0);if(partner){partner.x=310;partner.prevX=310;partner.y=WORLD.floor;partner.invincible=1;this.story.duelist=partner.slot;this.notice(`P${partner.slot+1} assumiu o duelo`);}else{this.finish(false);return;}}
      const boss=this.enemies.find(e=>e.profile.boss);
      if(boss?.hp<=0){
        if(this.story.act===3&&this.story.bossPhase===1){this.story.bossPhase=2;this.story.dialog='exo';for(const hero of this.party)if(hero.hp>0)hero.hp=Math.min(1000,hero.hp+200);this.enemies=[];this.projectiles=[];this.thrown=[];this.drones=[];this.lasers=[];this.phase='storyDialog';this.event('storyBossPhase',{phase:2});}
        else {this.story.dialog='clear';this.phase='storyDialog';this.event('storyClear',{act:this.story.act});}
      }return;
    }
    const max=Math.max(...this.heroes.map(f=>f.x)),min=Math.min(...this.heroes.map(f=>f.x));
    if(!this.enemies.some(e=>e.hp>0)&&this.story.wave<3&&max>=STORY_RULES.gates[this.story.wave]-250)this.spawnWave();
    const locked=this.enemies.some(e=>e.hp>0);
    if(!locked&&this.story.wave===2&&this.story.dropWave!==this.story.wave){this.story.dropWave=this.story.wave;this.props.push({id:`kit${this.story.wave}`,kind:'medkit',lane:625,x:clamp(this.enemies.at(-1)?.x??max,this.camera+100,this.camera+1100),hp:1,used:false});}
    const limit=locked?STORY_RULES.gates[Math.max(0,this.story.wave-1)]+550:this.story.wave<3?STORY_RULES.gates[this.story.wave]+300:STORY_RULES.worldWidth;
    const desired=mostafaCamera(this.camera,this.heroes,Math.max(0,Math.min(STORY_RULES.worldWidth-1280,limit-1280)));
    this.camera=Math.max(this.camera,desired);
    for(const f of this.heroes)f.x=clamp(f.x,this.camera+70,Math.min(this.camera+1210,limit));
    if(!locked&&this.story.wave===3&&max>=STORY_RULES.bossGate-200)this.beginBoss();
    // A downed partner returns after an encounter; a party wipe still fails the act.
    if(!locked&&!this.cpu)for(const f of this.party)if(f.hp<=0){const alive=this.heroes[0];f.reset(25);f.hp=350;f.x=alive.x-110;f.prevX=f.x;f.invincible=1;this.notice(`P${f.slot+1} voltou com 35% de vida`);}
  }
  togglePause(){if(!this.storyActive)return super.togglePause();if(!['fight','storyDialog'].includes(this.phase))return;this.paused=!this.paused;this.event('pause',{paused:this.paused});}
  exportStoryState(){if(!this.storyActive)return null;return copy({story:this.story,camera:this.camera,enemies:this.enemies.map(e=>Object.fromEntries(Object.entries(e).filter(([k])=>k!=='character'))),props:this.props,hazards:this.hazards,thrown:this.thrown});}
  importStoryState(state){this.storyActive=true;this.story=copy(state.story);this.camera=state.camera;this.props=copy(state.props);this.hazards=copy(state.hazards);this.thrown=copy(state.thrown);this.enemies=state.enemies.map(data=>{const e=new StoryEnemy(data.kind,data.slot,data.x);for(const k of Object.keys(e))if(k!=='character'&&Object.hasOwn(data,k))e[k]=copy(data[k]);return e;});this.wallTransfers=[];}
}
export function validStoryState(s){
  if(!s||!s.story||!Number.isInteger(s.story.act)||s.story.act<0||s.story.act>3||!Number.isInteger(s.story.wave)||s.story.wave<0||s.story.wave>3||!Number.isFinite(s.camera)||s.camera<0||s.camera>2320)return false;
  if(!['enemies','props','hazards','thrown'].every(k=>Array.isArray(s[k])&&s[k].length<=32))return false;
  if(!s.enemies.every(e=>e&&Number.isFinite(e.lane)&&e.lane>=STORY_RULES.laneTop&&e.lane<=STORY_RULES.laneBottom&&Object.hasOwn(ENEMY_TYPES,e.kind)&&Number.isInteger(e.slot)&&e.slot>=2&&e.slot<256&&Number.isFinite(e.x)&&e.x>=0&&e.x<=3900&&Number.isFinite(e.y)&&Math.abs(e.y)<3000&&Number.isFinite(e.hp)&&e.hp>=0&&e.hp<=ENEMY_TYPES[e.kind].hp))return false;
  if(new Set(s.enemies.map(e=>e.slot)).size!==s.enemies.length)return false;
  return [1,2].includes(s.story.bossPhase)&&[0,1].includes(s.story.duelist)&&Number.isInteger(s.story.seed)&&s.story.seed>=0&&s.story.seed<=4294967295;
}
