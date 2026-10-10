// Chalk and open books are drawn as distinct game objects, at the same
// projectile coordinates and radii used for collisions by the fight engine.
export function drawDienesProjectile(c,p,time,reduced=false){
  const book=p.effect==='bookStorm',r=p.radius;
  c.save();c.translate(p.x,p.y);c.scale(p.direction,1);
  c.shadowColor='#ff82c6';c.shadowBlur=reduced?0:16;
  if(book){
    c.rotate(reduced?0:Math.sin(time*9+(p.wave??0))*.12);
    c.fillStyle='#9d3a83';c.strokeStyle='#ffdaed';c.lineWidth=2.5;
    c.beginPath();c.moveTo(-r*.87,-r*.72);c.quadraticCurveTo(-r*.34,-r*.93,0,-r*.44);
    c.quadraticCurveTo(r*.34,-r*.93,r*.87,-r*.72);c.lineTo(r*.87,r*.66);
    c.quadraticCurveTo(r*.36,r*.50,0,r*.89);c.quadraticCurveTo(-r*.36,r*.50,-r*.87,r*.66);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#fff5f9';c.beginPath();c.moveTo(0,-r*.44);c.lineTo(0,r*.86);
    for(let i=0;i<3;i++){const y=-r*.35+i*r*.27;c.moveTo(-r*.67,y);c.lineTo(-r*.16,y+r*.09);c.moveTo(r*.16,y+r*.09);c.lineTo(r*.67,y);}c.stroke();
  }else{
    c.strokeStyle='#f47bbd';c.lineWidth=5;c.beginPath();c.moveTo(-r*2.4,5);c.lineTo(-r*.36,0);c.stroke();
    c.rotate(reduced?-.1:Math.sin(time*19)*.12-.1);
    c.fillStyle='#fffdf5';c.strokeStyle='#ffd0e7';c.lineWidth=2;
    c.beginPath();c.roundRect(-r*.72,-r*.19,r*1.65,r*.38,r*.15);c.fill();c.stroke();
    c.fillStyle='#ffd1de';c.fillRect(-r*.72,-r*.18,r*.28,r*.36);
  }
  c.restore();
}

export function drawDienesPower(c,f,time,reduced=false){
  if(!['special','uppercut','super'].includes(f.state)||!f.moveData)return;
  const m=f.moveData,charge=Math.min(1,f.actionTime/m.startup);
  c.save();c.translate(f.x,f.y);c.scale(f.direction,1);
  c.globalAlpha=.20+.5*charge;c.strokeStyle='#ff9bd1';c.shadowColor='#f777b9';c.shadowBlur=reduced?0:18;c.lineWidth=3;
  if(f.state==='uppercut'){
    c.beginPath();c.moveTo(26,-98);c.quadraticCurveTo(136,-168,84,-321);c.stroke();
  }else{
    for(let i=0;i<(f.state==='super'?4:2);i++){
      const y=-190+i*17;c.beginPath();c.moveTo(44,y+10);c.quadraticCurveTo(99+charge*22,y-8,144+charge*24,y);c.stroke();
    }
  }
  c.restore();
}
