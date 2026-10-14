// Ruan's electricity is a directed blue/violet pulse; João keeps his green body discharge.
function arc(c,x,y,length,phase,color,width){
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);
 for(let i=1;i<=8;i++)c.lineTo(x+length*i/8,y+(i===8?0:Math.sin(phase+i*2.3)*9));c.stroke();
}
export function drawKaratePulse(c,p,time,reduced=false){
 c.save();c.translate(p.x,p.y);c.scale(p.direction,1);
 c.shadowColor='#72e6ff';c.shadowBlur=reduced?0:18;
 const phase=reduced?0:time*30+(p.wave??0),length=p.move==='super'?125:85;
 arc(c,-length*.7,0,length,phase,'#6edfff',7);arc(c,-length*.7,0,length,phase,'#efffff',2);
 arc(c,-length*.5,-12,length*.75,phase+2,'#b5a2ff',2);arc(c,-length*.5,12,length*.75,phase-2,'#b5a2ff',2);
 c.restore();
}
export function drawKarateCharge(c,f,time,reduced=false){
 if(!f.moveData||!['special','uppercut','super'].includes(f.action))return;
 c.save();c.translate(f.x,f.y);c.scale(f.direction,1);c.shadowColor='#72e6ff';c.shadowBlur=reduced?0:12;
 if(f.action==='uppercut'){arc(c,15,-175,60,time*30,'#72e6ff',3);arc(c,35,-250,35,time*24,'#b5a2ff',2);}
 else if(f.actionTime<f.moveData.startup){arc(c,20,-190,45,time*24,'#72e6ff',3);arc(c,35,-205,32,time*30,'#b5a2ff',2);}
 c.restore();
}
