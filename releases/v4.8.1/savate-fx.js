// Track markings, a heart-rate trace and expanding teal pulses distinguish PE powers.
export function drawAthleticPulse(c,p,time,reduced){
 const radius=p.radius,spin=reduced?0:time*7;
 c.save();c.translate(p.x,p.y);c.scale(p.direction,1);c.shadowColor='#56e1d7';c.shadowBlur=12;
 c.strokeStyle='#75fff0';c.lineWidth=3;c.beginPath();c.ellipse(0,0,radius*1.1,radius,0,0,Math.PI*2);c.stroke();
 c.strokeStyle='#ffd975';c.lineWidth=2;
 for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,radius*(1.25+i*.18),spin+i*.8,spin+i*.8+1.9);c.stroke();}
 c.beginPath();c.moveTo(-radius*.7,0);c.lineTo(-radius*.35,0);c.lineTo(-radius*.13,-radius*.4);c.lineTo(radius*.08,radius*.5);c.lineTo(radius*.35,-radius*.2);c.lineTo(radius*.65,0);c.stroke();
 c.shadowBlur=0;c.strokeStyle='#56e1d755';c.lineWidth=2;
 for(let i=0;i<3;i++){c.beginPath();c.moveTo(-radius*2.5-i*10,-radius*.6+i*radius*.6);c.lineTo(-radius*1.4,-radius*.6+i*radius*.6);c.stroke();}c.restore();
}
export function drawOlympicJump(c,f,time,reduced){
 if(f.state!=='uppercut')return;
 c.save();c.translate(f.x,f.y);c.scale(f.direction,1);c.strokeStyle='#56e1d7aa';c.lineWidth=5;
 c.beginPath();c.arc(55,-175,105,-2.8,-.6);c.stroke();
 c.strokeStyle='#ffd975aa';c.lineWidth=2;c.beginPath();c.arc(55,-175,120,-2.8,-.6);c.stroke();c.restore();
}
