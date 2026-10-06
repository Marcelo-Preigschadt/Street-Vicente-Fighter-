const COLORS=['#f75676','#ffc857','#52dfb1','#5da8ff','#c487ff'];
export function drawPaintStroke(c,p,clock,reduced=false){
 c.save();c.translate(p.x,p.y);c.scale(p.direction,1);c.lineCap='round';
 for(let i=0;i<5;i++){const y=(i-2)*8+Math.sin(clock*9+i)*3;c.strokeStyle=COLORS[(i+(p.wave??0))%5];c.lineWidth=9;
 c.beginPath();c.moveTo(-75-i*5,y+12);c.bezierCurveTo(-35,y-25,8,y+22,30,y);c.stroke();
 for(let j=0;j<2;j++){c.fillStyle=c.strokeStyle;c.beginPath();c.ellipse(-90-j*21-i*4,y+j*8,3,2,0,0,Math.PI*2);c.fill();}}
 c.restore();
}
export function drawArtRise(c,f,clock,reduced=false){
 c.save();c.translate(f.x,f.y-165);c.scale(f.direction,1);c.lineCap='round';
 for(let i=0;i<5;i++){c.strokeStyle=COLORS[i];c.lineWidth=6;c.beginPath();c.arc(0,0,85+i*10,Math.PI*.85-clock*7,Math.PI*1.9-clock*7);c.stroke();}c.restore();
}
