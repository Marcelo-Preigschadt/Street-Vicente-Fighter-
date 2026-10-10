// Draw actual metal forks; the violet trails distinguish Khauãny's projectiles
// from the language and electricity powers already in the roster.
export function drawForkProjectile(c,p,time,reduced=false){
  const r=p.radius,phase=reduced?0:Math.sin(time*19+(p.wave??0)*2)*.07;
  c.save();c.translate(p.x,p.y);c.scale(p.direction,1);c.rotate(phase);
  c.shadowColor='#a784ff';c.shadowBlur=reduced?0:18;
  c.strokeStyle='#795de1';c.lineWidth=7;
  c.beginPath();c.moveTo(-r*2.2,4);c.lineTo(r*.32,0);c.stroke();
  c.strokeStyle='#eef4ff';c.lineCap='round';c.lineJoin='round';c.lineWidth=4;
  c.beginPath();c.moveTo(-r*1.8,0);c.lineTo(r*.42,0);c.lineTo(r*.67,-r*.34);
  c.moveTo(r*.42,0);c.lineTo(r*.95,-r*.12);
  c.moveTo(r*.42,0);c.lineTo(r*.95,r*.12);
  c.moveTo(r*.42,0);c.lineTo(r*.67,r*.34);c.stroke();
  c.strokeStyle='#a9d7ff';c.lineWidth=1.5;
  c.beginPath();c.moveTo(-r*1.7,-2);c.lineTo(r*.36,-2);c.stroke();
  c.restore();
}

export function drawForkPower(c,f,time,reduced=false){
  if(!['special','uppercut','super'].includes(f.state)||!f.moveData)return;
  const m=f.moveData,active=f.actionTime>=m.startup;
  const pulse=active?Math.max(0,1-(f.actionTime-m.startup)/(m.active+.18)):f.actionTime/m.startup;
  c.save();c.translate(f.x,f.y);c.scale(f.direction,1);
  c.globalAlpha=.25+.6*pulse;c.strokeStyle='#a884ff';c.shadowColor='#8d67ff';c.shadowBlur=reduced?0:17;
  c.lineWidth=4;
  if(f.state==='uppercut'){
    c.beginPath();c.moveTo(5,-80);c.quadraticCurveTo(130,-155,78,-325);c.stroke();
    c.lineWidth=2;c.strokeStyle='#e9efff';c.beginPath();c.moveTo(26,-90);c.quadraticCurveTo(141,-160,88,-330);c.stroke();
  }else{
    for(let i=0;i<(f.state==='super'?3:2);i++){
      const y=-190+i*18;
      c.beginPath();c.moveTo(38,y+10);c.quadraticCurveTo(86+pulse*24,y-7,135+pulse*22,y);c.stroke();
    }
  }
  c.restore();
}
