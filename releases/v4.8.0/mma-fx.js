// Portuguese and Spanish marks ride the punches; their positions follow the
// same deterministic clocks as the sprites, including online rollback.
const TAU=Math.PI*2;
const marks=['¡','Á','!'];

export function drawLanguageProjectile(c,p,time,reduced=false){
  const wave=p.wave??0,final=p.move==='super',r=p.radius,phase=reduced?0:time*9+wave;
  c.save();c.translate(p.x,p.y);c.scale(p.direction,1);
  c.globalCompositeOperation='lighter';c.shadowColor=final?'#72b8ff':'#ff727a';c.shadowBlur=reduced?0:18;
  c.fillStyle=final?'#72b8ff55':'#ff727a55';
  c.beginPath();c.ellipse(-r*.75,0,final?r*2.6:r*2,r*.55,0,0,TAU);c.fill();
  for(let i=0;i<3;i++){
    const y=(i-1)*r*.45+Math.sin(phase+i)*3;
    c.strokeStyle=i===1?'#fff6e7':'#a6e9ff';c.lineWidth=i===1?5:2;
    c.beginPath();c.moveTo(-r*(final?3.3:2.6),y+9);c.quadraticCurveTo(-r*.6,y-10,r*.65,y);c.stroke();
  }
  c.globalCompositeOperation='source-over';
  c.fillStyle='#1b2345';c.strokeStyle=final?'#a6e9ff':'#ffb8a8';c.lineWidth=3;
  c.beginPath();c.ellipse(0,0,r*.88,r*.80,0,0,TAU);c.fill();c.stroke();
  c.restore();
  c.save();c.fillStyle='#fff6e7';c.shadowColor=p.move==='super'?'#72b8ff':'#ff727a';c.shadowBlur=reduced?0:10;
  c.font=`900 ${final?37:35}px Georgia,serif`;c.textAlign='center';c.textBaseline='middle';
  c.fillText(final?marks[wave%marks.length]:'!',p.x,p.y-2);c.restore();
}

export function drawLanguagePower(c,f,time,reduced=false){
  const m=f.moveData;if(!m||!['special','uppercut','super'].includes(f.state))return;
  const active=f.actionTime>=m.startup,progress=Math.min(1,f.actionTime/m.startup);
  const burst=active?Math.max(0,1-(f.actionTime-m.startup)/(m.active+.13)):progress;
  c.save();c.translate(f.x,f.y);c.scale(f.direction,1);
  c.shadowColor='#ff727a';c.shadowBlur=reduced?0:15;
  const start=active?85:33+progress*37,handY=f.state==='uppercut'?-200:-215;
  c.strokeStyle='#ff727a';c.lineWidth=3+burst*2;c.globalAlpha=.45+burst*.45;
  for(let i=0;i<3;i++){
    const yy=handY+(i-1)*18;
    c.beginPath();c.moveTo(start-28,yy+14);c.quadraticCurveTo(start+24,yy-14,start+58+burst*25,yy);c.stroke();
  }
  if(f.state==='uppercut'){
    const rise=active?Math.min(1,(f.actionTime-m.startup)/m.active):progress*.3;
    c.strokeStyle='#a6e9ff';c.lineWidth=5;c.beginPath();
    c.moveTo(14,-92);c.bezierCurveTo(85,-150,8,-250,74,-365-rise*28);c.stroke();
    c.strokeStyle='#fff4e6';c.lineWidth=2;c.beginPath();
    c.moveTo(29,-102);c.bezierCurveTo(97,-155,22,-260,85,-360-rise*28);c.stroke();
  }else if(f.state==='super'){
    c.strokeStyle='#a6e9ff';c.lineWidth=2;
    for(let i=0;i<3;i++){
      const x=44+i*28+burst*12,y=-155-i*31;
      c.beginPath();c.moveTo(x-10,y-8);c.lineTo(x+10,y-8);c.lineTo(x+10,y+8);c.stroke();
    }
  }
  c.restore();
  if(f.state==='uppercut'&&active){
    c.save();c.fillStyle='#fff4e6';c.shadowColor='#72b8ff';c.shadowBlur=reduced?0:15;
    c.font='900 32px Georgia,serif';c.textAlign='center';c.fillText('Á',f.x+f.direction*86,f.y-350);c.restore();
  }
}
