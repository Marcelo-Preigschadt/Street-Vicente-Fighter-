// Session locks, stack layers and a kernel crash; no drones or code projectiles.
export function drawJudoSystem(c,f,time,reduced) {
  if(!['special','uppercut','super'].includes(f.state))return;
  const m=f.moveData,progress=Math.min(1,f.actionTime/(m.startup+m.active+m.recovery)),x=f.x+f.direction*70,y=f.y-165;
  c.save();c.strokeStyle=f.character.color;c.fillStyle='#c9dbff';c.lineWidth=3;c.globalAlpha=.82;
  if(f.state==='special') {
    const size=46+progress*25;
    for(const sign of [-1,1]){c.beginPath();c.moveTo(x+sign*size,y-40);c.lineTo(x+sign*(size+12),y-40);c.lineTo(x+sign*(size+12),y+40);c.lineTo(x+sign*size,y+40);c.stroke();}
    c.font='bold 14px monospace';c.textAlign='center';c.fillText('SESSÃO BLOQUEADA',x,y+66);
  } else if(f.state==='uppercut') {
    for(let i=0;i<4;i++){const rise=reduced?0:(time*80+i*20)%80;c.strokeRect(x-48,f.y-80-i*34-rise,96,17);}
    c.font='bold 13px monospace';c.textAlign='center';c.fillText('ACESSO NEGADO',x,f.y-285);
  } else {
    c.strokeStyle='#99baff';c.lineWidth=4;const radius=65+progress*65;
    c.beginPath();c.ellipse(f.x,f.y-5,radius,radius*.24,0,0,Math.PI*2);c.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+(reduced?0:time*2);c.strokeRect(x+Math.cos(a)*radius-10,y+Math.sin(a)*radius*.6-10,20,20);}
    c.font='bold 17px monospace';c.textAlign='center';c.fillText('KERNEL PANIC',x,y-100);
  }
  c.restore();
}
