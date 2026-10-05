import { SENTINEL } from './sentinel.js?v=16';
const TAU = Math.PI * 2;

export function drawSentinel(c, drone, reduced = false) {
  const progress = Math.min(1, drone.age / SENTINEL.delay), ready = progress >= .77;
  const fade = drone.fired ? Math.max(0, 1 - (drone.age - SENTINEL.delay) / SENTINEL.retireTime) : 1;
  const bob = reduced ? 0 : Math.sin(drone.age * 7) * 2;
  c.save(); c.translate(drone.x, drone.y + bob);
  c.globalAlpha = fade; const scale = Math.min(1, .4 + drone.age * 6); c.scale(scale, scale);
  // A compact metal housing, twin rotors and a directional lens.
  c.strokeStyle = '#122528'; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-16, -4); c.lineTo(-35, -12); c.moveTo(16, -4); c.lineTo(35, -12); c.stroke();
  for (const side of [-1, 1]) {
    c.fillStyle = '#354e51'; c.beginPath(); c.ellipse(side * 34, -13, 18, 6, 0, 0, TAU); c.fill();
    c.strokeStyle = '#c6dcde'; c.lineWidth = 1.5; c.stroke();
    const phase = reduced ? .6 : drone.age * 35;
    c.strokeStyle = '#eaffd2'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(side * 34 - Math.cos(phase) * 14, -13 - Math.sin(phase) * 3);
    c.lineTo(side * 34 + Math.cos(phase) * 14, -13 + Math.sin(phase) * 3); c.stroke();
    c.fillStyle = '#9de7c530'; c.beginPath(); c.ellipse(side * 34, 0, 9, 18, 0, 0, TAU); c.fill();
  }
  const metal = c.createLinearGradient(0, -16, 0, 16);
  metal.addColorStop(0, '#b9d3d4'); metal.addColorStop(.25, '#5c797d'); metal.addColorStop(.6, '#213d43'); metal.addColorStop(1, '#0e242b');
  c.fillStyle = metal; c.strokeStyle = '#d1e9df'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(-25, -15, 50, 30, 9); c.fill(); c.stroke();
  c.fillStyle = '#091b20'; c.beginPath(); c.roundRect(-15, -8, 25, 16, 3); c.fill();
  c.strokeStyle = '#b8ed68'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-10, -3); c.lineTo(-5, -3); c.lineTo(-5, 4); c.lineTo(3, 4); c.stroke();
  c.fillStyle = '#e8ffb5'; c.fillRect(-12, 5, 3, 2); c.fillRect(5, -6, 3, 3);
  c.save(); c.scale(drone.direction, 1);
  c.fillStyle = '#12272e'; c.fillRect(19, -6, 13, 12);
  c.fillStyle = ready ? '#ffedba' : '#a6f5d4'; c.shadowColor = ready ? '#ffb768' : '#b8ed68'; c.shadowBlur = ready ? 15 : 6;
  c.beginPath(); c.ellipse(30, 0, 3, 5, 0, 0, TAU); c.fill(); c.restore();
  if (!drone.fired) {
    c.strokeStyle = '#0a2329'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 23, -Math.PI / 2, Math.PI * 1.5); c.stroke();
    c.strokeStyle = ready ? '#ffe0a0' : '#b8ed68'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + TAU * progress); c.stroke();
    c.font = 'bold 12px monospace'; c.textAlign = 'center'; c.fillStyle = '#e9ffd0';
    c.fillText(`${Math.max(0, SENTINEL.delay - drone.age).toFixed(1)}s`, 0, -34);
    if (ready) {
      c.save(); c.scale(drone.direction, 1); c.strokeStyle = '#e4ffc957'; c.lineWidth = 1;
      c.setLineDash([4, 7]); c.beginPath(); c.moveTo(34, 0); c.lineTo(115, 0); c.stroke(); c.restore();
    }
  }
  c.restore();
}

export function drawSentinelLaser(c, laser, reduced = false) {
  const alpha = Math.max(0, laser.life / SENTINEL.beamDuration);
  c.save(); c.globalAlpha = alpha; c.lineCap = 'butt';
  c.strokeStyle = '#84e98955'; c.lineWidth = reduced ? 6 : 15;
  c.beginPath(); c.moveTo(laser.x, laser.y); c.lineTo(laser.endX, laser.y); c.stroke();
  c.strokeStyle = '#b8ed68'; c.lineWidth = 5; c.shadowColor = '#b8ed68'; c.shadowBlur = reduced ? 0 : 11;
  c.beginPath(); c.moveTo(laser.x, laser.y); c.lineTo(laser.endX, laser.y); c.stroke();
  c.strokeStyle = '#f6ffe5'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(laser.x, laser.y); c.lineTo(laser.endX, laser.y); c.stroke();
  c.fillStyle = '#eaffc7'; c.beginPath(); c.arc(laser.x, laser.y, 5 + 4 * alpha, 0, TAU); c.fill();
  c.restore();
}
