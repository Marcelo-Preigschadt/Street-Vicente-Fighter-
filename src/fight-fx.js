const TAU = Math.PI * 2;
export function drawChemicalSmoke(c,p,clock,reduced=false,opacity=1){
  const r=p.radius,t=reduced?0:clock;
  c.save();c.translate(p.x,p.y);c.scale(p.direction??1,1);
  // Soft overlapping vapor lobes; trailing wisps are decorative, the leading cloud is the hit sphere.
  for(let i=11;i>=0;i--){
    const u=i/11,x=-u*r*2.8+Math.sin(t*3+i*1.7)*r*.1,y=Math.sin(t*2.7+i*2.1)*r*(.13+u*.6);
    const rr=r*(.94+Math.sin(t*2+i)*.12)*(1-u*.3),g=c.createRadialGradient(x-rr*.2,y-rr*.24,0,x,y,rr);
    g.addColorStop(0,i%3===0?'#cabbdde8':'#c3e3d5e8');g.addColorStop(.58,i%3===0?'#b3a3cba0':'#97bdaeaf');g.addColorStop(1,'#88ada000');
    c.globalAlpha=opacity*(1-u*.55);c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,TAU);c.fill();
  }
  c.globalAlpha=opacity*.43;c.strokeStyle='#def9e9';c.lineWidth=1.4;
  for(let i=0;i<3;i++){
    const x=-r*(.15+i*.65),y=Math.sin(t*2.5+i*2)*r*.24;
    c.beginPath();c.moveTo(x-r*.38,y+r*.12);c.bezierCurveTo(x+r*.45,y-r*.6,x+r*.6,y+r*.3,x-r*.1,y+r*.45);c.stroke();
  }
  c.restore();
}
const glow = (c,x,y,r,color,alpha=.7) => {
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,`#ffffff${Math.round(alpha*255).toString(16).padStart(2,'0')}`);
  g.addColorStop(.22,`${color}bb`);g.addColorStop(.55,`${color}44`);g.addColorStop(1,`${color}00`);
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
};

export class FightEffects {
  constructor(){this.clear();}
  clear(){this.impacts=[];this.casts=[];this.dust=[];this.vapors=[];}
  event(e){
    if(['round','roundEnd','selection'].includes(e.type)){this.clear();return;}
    if(['hit','block','clash'].includes(e.type))this.impacts.push({...e,age:0,duration:e.type==='block'?.19:e.strength===2?.29:.23});
    if(['hit','block'].includes(e.type)&&e.effect==='chemicalSmoke')this.vapors.push({...e,age:0,duration:e.type==='block'?.42:.8});
    if(e.type==='projectile'||e.type==='special'&&e.move==='uppercut'||['customStart','guardCounter'].includes(e.type))
      this.casts.push({...e,age:0,duration:e.move==='super'?.4:.28});
    if(e.type==='land'&&Number.isFinite(e.x))this.dust.push({...e,age:0,duration:.32});
    this.impacts=this.impacts.slice(-24);this.casts=this.casts.slice(-16);this.dust=this.dust.slice(-8);this.vapors=this.vapors.slice(-8);
  }
  update(dt){
    for(const key of ['impacts','casts','dust','vapors']){
      for(const fx of this[key])fx.age+=Math.max(0,dt);
      this[key]=this[key].filter(fx=>fx.age<fx.duration);
    }
  }
  draw(c,reduced=false){
    for(const fx of this.dust){
      const p=fx.age/fx.duration;c.save();c.globalAlpha=(1-p)*.26;c.fillStyle='#e4d4b1';
      for(const sign of [-1,1]){c.beginPath();c.ellipse(fx.x+sign*(12+p*48),628-p*9,12+p*23,4+p*5,0,0,TAU);c.fill();}c.restore();
    }
    for(const fx of this.casts){
      if(!Number.isFinite(fx.x)||!Number.isFinite(fx.y))continue;
      const p=fx.age/fx.duration,r=18+p*(reduced?35:100);
      if(fx.effect==='chemicalSmoke'){drawChemicalSmoke(c,{x:fx.x,y:fx.y,radius:24+p*17,direction:fx.direction},fx.age,reduced,(1-p)*.6);continue;}
      c.save();c.globalAlpha=(1-p)*.65;c.strokeStyle=fx.color;c.lineWidth=(1-p)*5+1;
      c.beginPath();c.ellipse(fx.x,fx.y,r*.52,r,0,0,TAU);c.stroke();
      if(!reduced)glow(c,fx.x,fx.y,65*(1-p)+25,fx.color,.25);
      c.restore();
    }
    for(const fx of this.vapors){const p=fx.age/fx.duration;drawChemicalSmoke(c,{x:fx.x,y:fx.y-p*42,radius:36+p*28,direction:fx.direction},fx.age,reduced,(1-p)*.7);}
    for(const fx of this.impacts)this.drawImpact(c,fx,reduced);
  }
  drawImpact(c,fx,reduced){
    if(fx.effect==='chemicalSmoke'&&fx.type==='hit')return;
    const p=fx.age/fx.duration,heavy=fx.strength===2||['super','uppercut'].includes(fx.move),power=['special','uppercut','super'].includes(fx.move);
    const radius=(heavy?48:32)*(1+Math.min(.45,p)),fade=Math.pow(1-p,1.5),dir=fx.direction??1;
    c.save();c.translate(fx.x,fx.y);c.scale(dir,1);c.globalAlpha=fade;
    if(fx.type==='block'){
      c.strokeStyle='#d9f8ff';c.shadowColor='#69ceff';c.shadowBlur=10;c.lineWidth=3;
      c.beginPath();c.ellipse(0,0,12+p*21,25+p*18,0,-Math.PI*.65,Math.PI*.65);c.stroke();
      c.beginPath();c.moveTo(-11,-19);c.lineTo(5,0);c.lineTo(-11,19);c.stroke();
    }else{
      if(power)glow(c,0,0,radius*2,fx.color,.55);
      // Short, directional contact flashes rather than floating damage/confetti.
      for(const [scale,color]of [[1,heavy?'#ffb75c':'#ffc66a'],[.65,'#fff5c9']]){
        c.fillStyle=power&&scale===1?fx.color:color;c.beginPath();
        for(let n=0;n<16;n++){
          const angle=n*Math.PI/8,rr=radius*scale*(n%2?.23:1+(n%3)*.15);
          const x=Math.cos(angle)*rr*(n%4===0?1.3:1),y=Math.sin(angle)*rr*.8;
          c.lineTo(x,y);
        }c.closePath();c.fill();
      }
      c.fillStyle='#fff';c.beginPath();c.ellipse(0,0,7*(1-p),11*(1-p),0,0,TAU);c.fill();
      if(!reduced){
        c.lineWidth=heavy?3:2;c.strokeStyle=power?fx.color:'#ffe2a7';
        for(let n=0;n<(heavy?7:4);n++){
          const angle=-1.1+n*2.2/(heavy?6:3),start=radius*(.5+p),end=start+14+24*p;
          c.beginPath();c.moveTo(Math.cos(angle)*start,Math.sin(angle)*start);
          c.lineTo(Math.cos(angle)*end,Math.sin(angle)*end);c.stroke();
        }
      }
    }c.restore();
  }
}

export function drawEnergyProjectile(c,p,character,clock,reduced=false){
  if(p.effect==='chemicalSmoke')return drawChemicalSmoke(c,p,clock,reduced);
  const r=p.radius,superWave=p.move==='super',color=character.color,accent=character.accent,t=reduced?0:clock;
  c.save();c.translate(p.x,p.y);c.scale(p.direction,1);
  c.globalCompositeOperation='lighter';
  const length=superWave?205:140;
  const g=c.createLinearGradient(-length,0,r,0);g.addColorStop(0,`${color}00`);g.addColorStop(.72,`${color}55`);g.addColorStop(1,'#ffffffbb');
  c.fillStyle=g;
  for(let i=0;i<3;i++){
    const wobble=Math.sin(t*15+i*2)*r*.3;
    c.beginPath();c.moveTo(r*.4,0);c.bezierCurveTo(-r*1.5,-r*(.5+i*.2),-length*.65,wobble-r*.4,-length,wobble);
    c.bezierCurveTo(-length*.5,wobble+r*.35,-r*1.2,r*(.5+i*.1),r*.4,0);c.fill();
  }
  glow(c,0,0,r*2.35,color,.78);
  c.globalCompositeOperation='source-over';
  const core=c.createRadialGradient(r*.22,-r*.15,1,0,0,r);core.addColorStop(0,'#ffffff');core.addColorStop(.25,'#fffce7');core.addColorStop(.68,color);core.addColorStop(1,`${accent}66`);
  c.fillStyle=core;c.beginPath();c.ellipse(0,0,r,r*.82,0,0,TAU);c.fill();
  c.shadowColor=color;c.shadowBlur=8;c.strokeStyle='#ffffed';c.lineWidth=2;
  if(p.character==='marcelo'){
    // Orbiting circuit tracks and binary packets, with an energetic front.
    for(let i=0;i<3;i++){
      const x=-25-i*35-(t*50%30),y=Math.sin(t*9+i*1.8)*18;c.globalAlpha=.8-i*.18;
      c.strokeStyle=color;c.beginPath();c.moveTo(x-19,y+8);c.lineTo(x-7,y+8);c.lineTo(x-7,y-7);c.lineTo(x+10,y-7);c.stroke();
      c.fillStyle='#d8ffba';c.font='bold 13px monospace';c.fillText(i%2?'01':'10',x-14,y-13);
    }
    c.globalAlpha=1;c.strokeStyle='#f4ffe9';c.lineWidth=2.5;
    c.beginPath();c.moveTo(-r*.22,-r*.42);c.lineTo(-r*.52,-r*.42);c.lineTo(-r*.65,0);c.lineTo(-r*.52,r*.42);c.lineTo(-r*.22,r*.42);
    c.moveTo(r*.22,-r*.42);c.lineTo(r*.52,-r*.42);c.lineTo(r*.65,0);c.lineTo(r*.52,r*.42);c.lineTo(r*.22,r*.42);c.stroke();
    c.strokeStyle=color;c.beginPath();c.ellipse(0,0,r*1.25,r,Math.sin(t*8)*.18,-1.2,1.2);c.stroke();
  }else if(p.character==='rafael'){
    c.fillStyle=superWave?'#8b582b':'#ffefc5';c.strokeStyle='#fff3c7';c.lineWidth=2;
    if(superWave){
      c.beginPath();c.moveTo(-r*.54,-r*.56);c.lineTo(r*.54,-r*.56);c.lineTo(r*.44,r*.23);c.quadraticCurveTo(0,r*.81,-r*.44,r*.23);c.closePath();c.fill();c.stroke();
      c.fillStyle='#ffda8e';c.fillRect(-r*.07,-r*.45,r*.14,r*.97);c.fillRect(-r*.37,-r*.04,r*.74,r*.14);
    }else{
      c.save();c.rotate(Math.sin(t*8)*.1);c.fillRect(-r*.52,-r*.5,r*1.04,r);c.strokeRect(-r*.52,-r*.5,r*1.04,r);
      c.strokeStyle='#956527';c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-r*.3,-r*.25+i*r*.23);c.lineTo(r*.3,-r*.25+i*r*.23);c.stroke();}c.restore();
    }
    for(let i=0;i<5;i++){
      c.save();c.translate(-35-i*24,Math.sin(t*10+i)*19);c.rotate(t*1.8+i*.9);c.globalAlpha=.7-i*.12;c.fillStyle='#ffe8b2';c.fillRect(-6,-9,12,18);c.restore();
    }
    c.strokeStyle='#ffe7b4';c.beginPath();c.ellipse(0,0,r*1.22,r*1.1,t*.3,0,TAU);c.stroke();
  }else{
    c.strokeStyle=accent;c.lineWidth=2;
    for(let i=0;i<3;i++){
      const a=i*Math.PI/3+t*.55;c.beginPath();c.ellipse(0,0,r*1.35,r*.43,a,0,TAU);c.stroke();
      const e=t*8+i*2,x=Math.cos(e)*r*1.35,y=Math.sin(e)*r*.43;
      c.save();c.rotate(a);c.fillStyle='#f0ffff';c.beginPath();c.arc(x,y,3.5,0,TAU);c.fill();c.restore();
    }
    if(superWave){
      for(let i=0;i<5;i++){
        const x=-r-i*27,y=Math.sin(t*10-i*1.1)*18;c.globalAlpha=.8-i*.13;
        c.beginPath();c.moveTo(x,y);c.lineTo(x-27,Math.sin(t*10-(i+1)*1.1)*18);c.stroke();
        c.fillStyle=i%2?accent:color;c.beginPath();c.arc(x,y,5,0,TAU);c.fill();
      }
    }
  }c.restore();
}

export function drawEnergyRise(c,f,clock,reduced=false){
  const m=f.moveData;if(!m||f.actionTime<m.startup||f.actionTime>m.startup+m.active+.18)return;
  const p=(f.actionTime-m.startup)/(m.active+.18),fade=1-p,x=f.x+f.direction*46,bottom=f.y-30,color=f.character.color;
  c.save();c.globalAlpha=fade*.8;c.shadowColor=color;c.shadowBlur=18;
  const gradient=c.createLinearGradient(x,bottom,x,bottom-355);gradient.addColorStop(0,`${color}00`);gradient.addColorStop(.4,`${color}66`);gradient.addColorStop(.8,'#ffffffbb');gradient.addColorStop(1,'#ffffff00');
  c.fillStyle=gradient;
  for(let i=0;i<3;i++){
    const w=30+i*18,offset=reduced?0:Math.sin(clock*14+i)*13;
    c.beginPath();c.moveTo(x-w,bottom);c.bezierCurveTo(x-w*1.9,bottom-100,x+w+offset,bottom-210,x+offset,bottom-350);
    c.bezierCurveTo(x+w*.5,bottom-180,x+w*1.7,bottom-90,x+w,bottom);c.closePath();c.fill();
  }
  glow(c,x,bottom-225,94,color,.5);
  if(f.character.id==='marcelo'){
    c.strokeStyle='#e3ffc7';c.lineWidth=2;
    for(let i=0;i<5;i++){
      const yy=bottom-70-i*50;c.beginPath();c.moveTo(x-43,yy+14);c.lineTo(x-43,yy-7);c.lineTo(x-17,yy-7);c.lineTo(x-17,yy-22);c.lineTo(x+29,yy-22);c.stroke();
      c.fillStyle='#d5ffc8';c.font='bold 15px monospace';c.fillText(i%2?'010':'101',x-20,yy+8);
    }
  }else if(f.character.id==='rafael'){
    c.strokeStyle='#ffe1aa';c.lineWidth=3;
    for(let i=0;i<4;i++){
      const r=37+i*22,y=bottom-88-i*53;c.beginPath();c.ellipse(x,y,r,r*.28,-.25,-2.8,2.8);c.stroke();
      c.fillStyle='#fff1c9';c.font='bold 17px serif';c.fillText(['I','V','X','XX'][i],x-9,y-5);
    }
  }else{
    c.fillStyle='#fff19b';c.strokeStyle='#bafaff';c.lineWidth=2;
    for(let i=0;i<9;i++){
      const y=bottom-30-((clock*270+i*37)%300),px=x+Math.sin(clock*12+i*2)*38;
      c.beginPath();c.arc(px,y,3+i%3,0,TAU);c.fill();
      if(i<3){c.beginPath();c.ellipse(x,y,35,12,clock*.7+i,0,TAU);c.stroke();}
    }
  }c.restore();
}
