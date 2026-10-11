// Procedural lightning has no simulation randomness; rollback only changes pose/time.
export function drawWildPower(c,f,time,reduced) {
  if(!f.moveData||!['special','uppercut','super'].includes(f.state))return;
  const active=f.actionTime>=f.moveData.startup&&f.actionTime<f.moveData.startup+f.moveData.active;
  c.save();c.translate(f.x,f.y);c.scale(f.direction,1);
  c.strokeStyle='#d7ff92';c.fillStyle='#b7ff5233';c.lineWidth=active?4:2;
  if(f.state==='special'){
    const x=active?215:65,y=-190;
    c.beginPath();c.ellipse(x,y,active?48:22,active?38:20,0,0,Math.PI*2);c.fill();c.stroke();
    if(active){c.strokeStyle='#eaffbd';for(let i=0;i<4;i++){c.beginPath();c.moveTo(25,-175+i*12);c.lineTo(168,-195+i*12);c.stroke();}}
  }else if(f.state==='uppercut'&&active){
    c.beginPath();c.arc(10,-118,100,-Math.PI*.85,Math.PI*.55);c.stroke();
    c.beginPath();c.arc(0,-118,115,-Math.PI*.85,Math.PI*.55);c.stroke();
  }else if(f.state==='super'){
    const radius=active?185:70+f.actionTime/f.moveData.startup*70;
    c.beginPath();c.ellipse(0,-145,radius,140,0,0,Math.PI*2);c.fill();
    const phase=reduced?0:Math.floor(time*18);
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5,dx=Math.cos(a),dy=Math.sin(a);
      c.beginPath();c.moveTo(dx*45,-145+dy*45);
      for(let j=1;j<=4;j++){const r=45+(radius-45)*j/4,w=Math.sin(i*7+j*3+phase)*14;c.lineTo(dx*r-dy*w,-145+dy*r+dx*w);}c.stroke();
    }
  }
  c.restore();
}
