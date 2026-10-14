const TAU=Math.PI*2;
function seal(c,r,angle){
 c.save();c.rotate(angle);c.fillStyle='#3e2441';c.strokeStyle='#ffdf9c';c.lineWidth=2;
 c.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8-Math.PI/8;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();
 c.strokeStyle='#d8a95b';c.beginPath();c.arc(0,0,r*.65,0,TAU);c.stroke();
 c.fillStyle='#ffe9b8';c.fillRect(-r*.12,-r*.43,r*.24,r*.86);c.fillRect(-r*.4,-r*.1,r*.8,r*.2);c.restore();
}
function banner(c,r,wave){
 c.strokeStyle='#ffe0a0';c.lineWidth=2;c.beginPath();c.moveTo(-r*.5,r);c.lineTo(-r*.5,-r);c.stroke();
 c.fillStyle=wave===1?'#9c70ce':'#c98b48';c.beginPath();c.moveTo(-r*.5,-r);c.lineTo(r*.85,-r*.78);c.lineTo(r*.5,0);c.lineTo(-r*.5,-r*.2);c.closePath();c.fill();
 c.strokeStyle='#ffe5ab';c.stroke();
 c.fillStyle='#f8e3b9';c.fillRect(-r*.16,-r*.73,r*.17,r*.5);c.fillRect(-r*.32,-r*.57,r*.48,r*.1);
 c.strokeStyle='#d8a95b';c.beginPath();c.moveTo(-r*.6,r*.1);c.lineTo(r*.85,r*.1);c.lineTo(r*.45,-r*.15);c.moveTo(r*.85,r*.1);c.lineTo(r*.45,r*.35);c.stroke();
}
export function drawAdrianoProjectile(c,p,clock,reduced=false){
 c.save();c.translate(p.x,p.y);c.scale(p.direction,1);c.shadowBlur=reduced?0:12;c.shadowColor='#d7af66';
 if(p.effect==='dynastySiege'&&p.wave<2)banner(c,p.radius,p.wave);
 else seal(c,p.radius,reduced?0:clock*(p.move==='super'?4:2));
 c.restore();
}
export function drawAdrianoPower(c,f,clock,reduced=false){
 const m=f.moveData;if(!m)return;
 if(f.state==='special'&&f.actionTime<m.startup){
  const q=f.actionTime/m.startup;c.save();c.translate(f.x+f.direction*120,f.y-205);c.globalAlpha=.35+.5*q;seal(c,7+q*15,reduced?0:clock*2);c.restore();
 }
 if(f.state==='uppercut'&&f.actionTime>=m.startup&&f.actionTime<m.startup+m.active){
  c.save();c.translate(f.x+f.direction*55,f.y-75);c.scale(f.direction,1);c.globalAlpha=.65;c.strokeStyle='#f9d99a';c.fillStyle='#76516e';c.lineWidth=2;
  for(let i=0;i<4;i++){const y=-i*46;c.fillRect(-20,y-40,48,36);c.strokeRect(-20,y-40,48,36);c.fillRect(-20,y-49,13,12);c.fillRect(15,y-49,13,12);}
  c.restore();
 }
 if(f.state==='super'){
  const q=Math.max(0,Math.min(1,f.actionTime/(m.startup+m.active)));c.save();c.translate(f.x,f.y-7);c.scale(f.direction,1);c.strokeStyle='#d7b36faa';c.lineWidth=2;
  c.beginPath();c.ellipse(0,0,60+q*100,13+q*17,0,0,TAU);c.stroke();
  if(!reduced)for(let i=0;i<3;i++){c.save();c.translate(-80+i*70,-35-Math.sin(q*Math.PI)*30);c.globalAlpha=.35;banner(c,22,i%2);c.restore();}
  c.restore();
 }
}
