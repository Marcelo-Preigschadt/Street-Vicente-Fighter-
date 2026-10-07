const TAU=Math.PI*2;
export function drawImpulse(c,p,clock,reduced=false) {
  c.save();c.translate(p.x,p.y);c.scale(p.direction,1);
  const superMove=p.move==='super',radius=superMove?31:24;
  c.strokeStyle='#9ef5ff';c.lineWidth=superMove?4:3;
  c.beginPath();c.ellipse(0,0,radius*.45,radius,0,0,TAU);c.stroke();
  c.strokeStyle='#f7ae63';c.lineWidth=3;
  for(let i=-2;i<=2;i++){
    const y=i*10;c.beginPath();c.moveTo(-62-Math.abs(i)*8,y);c.lineTo(20-Math.abs(i)*4,y);
    c.lineTo(9-Math.abs(i)*4,y-5);c.moveTo(20-Math.abs(i)*4,y);c.lineTo(9-Math.abs(i)*4,y+5);c.stroke();
  }
  c.fillStyle='#ecffff';c.beginPath();c.ellipse(3,0,9,17,0,0,TAU);c.fill();
  c.globalAlpha=.6;c.strokeStyle='#a9f2ff';c.lineWidth=1;
  for(let i=0;i<3;i++){c.beginPath();c.ellipse(-15-i*18,0,9+i*3,radius+7+i*4,0,-Math.PI*.65,Math.PI*.65);c.stroke();}
  c.restore();
}
export function drawKineticRise(c,f,clock,reduced=false) {
  c.save();c.translate(f.x,f.y);c.strokeStyle='#a5f5ff';c.lineWidth=3;
  for(let i=0;i<3;i++){
    const x=(i-1)*42,y=-90-i*18;c.beginPath();c.moveTo(x,y);c.lineTo(x,-310);
    c.lineTo(x-7,-297);c.moveTo(x,-310);c.lineTo(x+7,-297);c.stroke();
  }
  c.strokeStyle='#f7ae63';c.lineWidth=4;c.beginPath();c.ellipse(f.direction*35,-225,62,22,-.25,0,TAU);c.stroke();c.restore();
}
