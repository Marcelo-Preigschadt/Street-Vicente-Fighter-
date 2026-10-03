import { CHARACTERS, MOVES, WORLD } from './engine.js';

const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(`Não foi possível carregar ${src}`)); image.src = src;
});
const rectangle = (c, x, y, w, h, r = 5) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const text = (c, str, x, y, size = 20, color = '#f4ecdb', align = 'left', weight = 800) => {
  c.font = `${weight} ${size}px Arial, sans-serif`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(str, x, y);
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.c = canvas.getContext('2d', { alpha: false }); this.sheets = {}; this.particles = []; this.labels = [];
    this.clock = 0; this.shake = 0; this.flash = 0; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  async load() {
    const [background, ...sheets] = await Promise.all([loadImage('assets/arena.webp'), ...Object.values(CHARACTERS).map(f => loadImage(f.sprite))]);
    this.background = background;
    Object.values(CHARACTERS).forEach((f, i) => { this.sheets[f.id] = this.analyzeSheet(sheets[i]); });
  }
  analyzeSheet(image) {
    const frames = [];
    const offscreen = document.createElement('canvas'); offscreen.width = image.width; offscreen.height = image.height;
    const c = offscreen.getContext('2d', { willReadFrequently: true }); c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, image.width, image.height).data;
    for (let i = 0; i < 16; i++) {
      const column = i % 4, row = Math.floor(i / 4);
      const sx = Math.round(column * image.width / 4), sy = Math.round(row * image.height / 4);
      const ex = Math.round((column + 1) * image.width / 4), ey = Math.round((row + 1) * image.height / 4);
      // Generated atlases can have a few pixels crossing nominal cell borders.
      // Find the largest connected silhouette in a padded cell, excluding neighboring-pose fragments.
      const rx = Math.max(0, sx - 12), ry = Math.max(0, sy - 12);
      const rw = Math.min(image.width, ex + 12) - rx, rh = Math.min(image.height, ey + 12) - ry;
      const mask = new Uint8Array(rw * rh), stack = new Int32Array(rw * rh);
      for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) mask[y * rw + x] = pixels[((ry + y) * image.width + rx + x) * 4 + 3] >= 95 ? 1 : 0;
      let best = null;
      for (let start = 0; start < mask.length; start++) {
        if (mask[start] !== 1) continue;
        let top = 0, count = 0, bx1 = rw, by1 = rh, bx2 = 0, by2 = 0; stack[top++] = start; mask[start] = 2;
        while (top) {
          const index = stack[--top], x = index % rw, y = Math.floor(index / rw); count++;
          bx1 = Math.min(bx1, x); by1 = Math.min(by1, y); bx2 = Math.max(bx2, x); by2 = Math.max(by2, y);
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if ((!dx && !dy) || x + dx < 0 || x + dx >= rw || y + dy < 0 || y + dy >= rh) continue;
            const next = index + dy * rw + dx; if (mask[next] === 1) { mask[next] = 2; stack[top++] = next; }
          }
        }
        if (!best || count > best.count) best = { count, bx1, by1, bx2, by2 };
      }
      if (!best || best.count < 100) throw new Error('Sprite vazio. Verifique o atlas de personagens.');
      const x1 = rx + best.bx1 - sx, y1 = ry + best.by1 - sy, x2 = rx + best.bx2 - sx, y2 = ry + best.by2 - sy;
      // Ground-foot midpoint anchors attacks without moving the fighter's physical position.
      let footLeft = image.width, footRight = 0;
      for (let y = Math.max(y1, y2 - 15); y <= y2; y++) for (let x = x1; x <= x2; x++) {
        if (pixels[((sy + y) * image.width + sx + x) * 4 + 3] > 140) { footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x); }
      }
      frames.push({ sx, sy, x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1, anchor: i === 4 || i === 15 ? (x1 + x2) / 2 : (footLeft + footRight) / 2, bottom: y2 });
    }
    return { image, frames, scale: 294 / frames[0].h };
  }
  frameFor(f) {
    switch (f.state) {
      case 'walk': return 2 + Math.floor(f.walkTime * 8) % 2;
      case 'jump': return 4;
      case 'crouch': return 5;
      case 'block': return 10;
      case 'hit': return 11;
      case 'victory': return 14;
      case 'ko': return 15;
      case 'punch': return f.actionTime < MOVES.punch.startup ? 6 : f.actionTime < .27 ? 7 : 0;
      case 'kick': return f.actionTime < MOVES.kick.startup ? 8 : f.actionTime < .41 ? 9 : 0;
      case 'special': return f.actionTime < MOVES.special.startup ? 12 : f.actionTime < .65 ? 13 : 0;
      default: return Math.floor(f.animTime * 3) % 2;
    }
  }
  preview(canvas, id) {
    const c = canvas.getContext('2d'), sheet = this.sheets[id]; if (!sheet) return;
    const f = sheet.frames[0], scale = Math.min((canvas.height - 15) / f.h, (canvas.width - 35) / f.w);
    c.clearRect(0, 0, canvas.width, canvas.height); c.imageSmoothingEnabled = true;
    c.drawImage(sheet.image, f.sx + f.x, f.sy + f.y, f.w, f.h, (canvas.width - f.w * scale) / 2, canvas.height - f.h * scale - 3, f.w * scale, f.h * scale);
  }
  event(e) {
    if (e.type === 'hit' || e.type === 'block') {
      const count = e.type === 'block' ? 9 : e.move === 'special' ? 35 : 21;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2, speed = 110 + Math.random() * 390;
        this.particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .2 + Math.random() * .3, maxLife: .5, color: e.type === 'block' ? '#9ce3ff' : i % 3 === 0 ? '#ffffff' : e.color, size: 2 + Math.random() * 5 });
      }
      if (e.type === 'hit') {
        this.shake = this.reduced ? 0 : e.move === 'special' ? 12 : 6; this.flash = e.move === 'special' ? .09 : .035;
        this.labels.push({ x: e.x, y: e.y - 35, life: .75, text: `−${e.damage}`, color: '#fff0bf' });
      }
    }
    if (e.type === 'round') { this.particles = []; this.labels = []; this.shake = 0; }
  }
  draw(engine, dt) {
    const c = this.c; this.clock += dt; this.shake *= Math.exp(-dt * 14); this.flash = Math.max(0, this.flash - dt);
    c.save();
    if (this.shake > .1) c.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    this.drawBackground(engine);
    if (engine.phase !== 'selection') {
      for (const f of engine.fighters) this.drawShadow(f);
      for (const f of [...engine.fighters].sort((a, b) => a.y - b.y)) this.drawFighter(f);
      for (const p of engine.projectiles) this.drawProjectile(p);
      this.drawParticles(dt);
      this.drawHUD(engine);
      for (const f of engine.fighters) { if (f.quoteTime > 0) this.drawQuote(f); if (f.combo >= 2 && f.comboTime > 0) this.drawCombo(f); }
      this.drawAnnouncer(engine);
    }
    if (this.flash > 0) { c.fillStyle = `rgba(255,244,217,${this.flash * 2.2})`; c.fillRect(0, 0, WORLD.width, WORLD.height); }
    c.restore();
  }
  drawBackground(engine) {
    const c = this.c;
    if (this.background) {
      const camera = engine.phase === 'selection' ? 0 : ((engine.fighters[0].x + engine.fighters[1].x) / 2 - 640) * -.02;
      c.drawImage(this.background, -20 + camera, -8, WORLD.width + 40, WORLD.height + 16);
      c.fillStyle = '#06191b22'; c.fillRect(0, 0, WORLD.width, WORLD.height);
      const vignette = c.createRadialGradient(640, 350, 270, 640, 360, 780); vignette.addColorStop(0, '#08141000'); vignette.addColorStop(1, '#071112b0');
      c.fillStyle = vignette; c.fillRect(0, 0, WORLD.width, WORLD.height);
    } else { c.fillStyle = '#142324'; c.fillRect(0, 0, WORLD.width, WORLD.height); }
  }
  drawShadow(f) {
    const c = this.c, air = Math.max(0, WORLD.floor - f.y); c.fillStyle = `rgba(8,16,16,${.35 - Math.min(.19, air / 1300)})`;
    c.beginPath(); c.ellipse(f.x, WORLD.floor + 3, f.state === 'ko' ? 120 : 77 - air * .09, 12, 0, 0, Math.PI * 2); c.fill();
  }
  drawFighter(f) {
    const c = this.c, sheet = this.sheets[f.character.id]; if (!sheet) return;
    const frame = sheet.frames[this.frameFor(f)], scale = sheet.scale;
    const breathing = f.state === 'idle' && !this.reduced ? Math.sin(f.animTime * 5) * .7 : 0;
    c.save(); c.translate(f.x, f.y + breathing); c.scale(f.direction, 1);
    if (f.state === 'special' && f.actionTime < .32) {
      c.shadowColor = f.character.color; c.shadowBlur = 14 + Math.sin(f.actionTime * 30) * 6;
    }
    if (f.flash > 0) c.filter = 'brightness(1.8)';
    if (f.blockFlash > 0) c.filter = 'brightness(1.3) sepia(.1)';
    if (f.slow > 0 && Math.floor(this.clock * 7) % 2) c.filter = 'sepia(.5)';
    c.drawImage(sheet.image, frame.sx + frame.x, frame.sy + frame.y, frame.w, frame.h,
      (frame.x - frame.anchor) * scale, (frame.y - frame.bottom) * scale, frame.w * scale, frame.h * scale);
    c.restore();
    if (f.state === 'special' && f.actionTime < .32) {
      const strength = f.actionTime / .32; this.energyOrb(f.x + f.direction * 50, f.y - 175, 12 + strength * 19, f.character.id, strength);
    }
  }
  energyOrb(x, y, radius, id, phase) {
    const c = this.c, color = CHARACTERS[id].color;
    c.save(); c.translate(x, y); c.shadowColor = color; c.shadowBlur = 25;
    const halo = c.createRadialGradient(0, 0, 0, 0, 0, radius * 2); halo.addColorStop(0, color); halo.addColorStop(.35, color + 'bb'); halo.addColorStop(1, color + '00');
    c.fillStyle = halo; c.beginPath(); c.arc(0, 0, radius * 2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff8df'; c.lineWidth = 3; c.rotate(this.clock * (id === 'marcelo' ? 5 : -2));
    if (id === 'rafael') {
      c.beginPath(); c.arc(0, 0, radius, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * radius * .77, Math.sin(a) * radius * .77); c.lineTo(Math.cos(a) * radius * .9, Math.sin(a) * radius * .9); c.stroke(); }
      c.beginPath(); c.moveTo(0, -radius * .55); c.lineTo(0, 0); c.lineTo(radius * .45, radius * .16); c.stroke();
    } else {
      for (let i = 0; i < 3; i++) { c.rotate(Math.PI * 2 / 3); c.beginPath(); c.moveTo(-radius, 0); c.lineTo(-radius * .35, -radius * .6); c.lineTo(radius * .3, radius * .45); c.lineTo(radius, 0); c.stroke(); }
    }
    c.restore();
  }
  drawProjectile(p) {
    const c = this.c, color = CHARACTERS[p.character].color;
    c.save(); c.translate(p.x, p.y); c.scale(p.direction, 1);
    const tail = c.createLinearGradient(-145, 0, 8, 0); tail.addColorStop(0, color + '00'); tail.addColorStop(1, color + 'aa');
    c.fillStyle = tail; c.beginPath(); c.moveTo(-148, 0); c.lineTo(0, -19); c.lineTo(22, 0); c.lineTo(0, 19); c.closePath(); c.fill();
    c.restore(); this.energyOrb(p.x, p.y, p.radius, p.character, 1);
  }
  drawParticles(dt) {
    const c = this.c;
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt;
      c.globalAlpha = Math.max(0, p.life / p.maxLife); c.strokeStyle = p.color; c.lineWidth = p.size;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .035, p.y - p.vy * .035); c.stroke();
    }
    c.globalAlpha = 1; this.labels = this.labels.filter(l => l.life > 0);
    for (const l of this.labels) { l.life -= dt; l.y -= dt * 42; c.globalAlpha = Math.min(1, l.life * 3); text(c, l.text, l.x, l.y, 26, l.color, 'center'); }
    c.globalAlpha = 1;
  }
  drawPortrait(f, x, y, flip = false) {
    const c = this.c, sheet = this.sheets[f.character.id], frame = sheet.frames[0];
    c.save(); rectangle(c, x, y, 70, 76, 4); c.fillStyle = '#2b3c32'; c.fill(); c.clip();
    if (flip) { c.translate(x * 2 + 70, 0); c.scale(-1, 1); }
    const headX = frame.x + frame.w * .37, headY = frame.y, headW = frame.w * .45, headH = frame.h * .30;
    c.drawImage(sheet.image, frame.sx + headX, frame.sy + headY, headW, headH, x - 4, y - 1, 80, 81); c.restore();
    c.strokeStyle = f.character.color; c.lineWidth = 2; rectangle(c, x, y, 70, 76, 4); c.stroke();
  }
  drawHUD(engine) {
    const c = this.c;
    const top = c.createLinearGradient(0, 0, 0, 160); top.addColorStop(0, '#081316ee'); top.addColorStop(.7, '#081316aa'); top.addColorStop(1, '#08131600'); c.fillStyle = top; c.fillRect(0, 0, 1280, 160);
    engine.fighters.forEach((f, i) => {
      const right = i === 1, x = right ? 728 : 132, w = 420;
      this.drawPortrait(f, right ? 1162 : 48, 31, right);
      text(c, f.character.name, right ? 1147 : 133, 47, 27, '#fff4dd', right ? 'right' : 'left');
      text(c, right ? engine.cpu ? 'CPU' : 'P2' : 'P1', right ? 744 : 549, 47, 16, f.character.color, right ? 'left' : 'right');
      c.fillStyle = '#152423'; rectangle(c, x, 68, w, 29, 2); c.fill();
      const trailing = Math.max(f.hp, f.displayHP) / 1000 * w, current = f.hp / 1000 * w;
      c.fillStyle = '#c47b4a'; c.fillRect(right ? x + w - trailing : x, 70, trailing, 25);
      const gradient = c.createLinearGradient(x, 68, x, 98); gradient.addColorStop(0, f.hp < 250 ? '#f8a15e' : '#dcf58b'); gradient.addColorStop(1, f.hp < 250 ? '#c83236' : '#80c557');
      c.fillStyle = gradient; c.fillRect(right ? x + w - current : x, 70, current, 25);
      c.strokeStyle = '#f1e6cc'; c.lineWidth = 2; c.strokeRect(x, 68, w, 29);
      for (let j = 0; j < 2; j++) { c.fillStyle = j < f.wins ? '#ffe3a2' : '#1c3028'; c.strokeStyle = '#869378'; rectangle(c, right ? x + w - 16 - j * 23 : x + j * 23, 110, 14, 10, 2); c.fill(); c.stroke(); }
      if (f.hp < 250) text(c, 'PERIGO', right ? x + w - 62 : x + 60, 115, 13, '#ffbc88', right ? 'right' : 'left');
      const energyX = right ? 853 : 54, energyWidth = 373;
      c.fillStyle = '#081617cc'; rectangle(c, energyX - 8, 656, energyWidth + 16, 48, 4); c.fill();
      c.fillStyle = '#30423b'; c.fillRect(energyX, 674, energyWidth, 13);
      c.fillStyle = f.character.color; c.fillRect(right ? energyX + energyWidth * (1 - f.meter / 100) : energyX, 674, energyWidth * f.meter / 100, 13);
      c.strokeStyle = '#dde6cc88'; c.lineWidth = 1; c.strokeRect(energyX, 674, energyWidth, 13);
      for (let j = 1; j <= 2; j++) { c.fillStyle = '#142224'; c.fillRect(energyX + energyWidth * .4 * j - 1, 674, 2, 13); }
      text(c, f.meter >= 40 ? 'ESPECIAL PRONTO' : 'ENERGIA', right ? energyX + energyWidth : energyX, 666, 13, f.meter >= 40 ? f.character.color : '#a7b8ae', right ? 'right' : 'left');
      text(c, Math.floor(f.meter).toString(), right ? energyX : energyX + energyWidth, 666, 13, '#f5ecd9', right ? 'left' : 'right');
    });
    c.fillStyle = '#142323'; c.strokeStyle = '#dacda4'; c.lineWidth = 2; rectangle(c, 592, 28, 96, 89, 9); c.fill(); c.stroke();
    text(c, Math.ceil(engine.timer).toString().padStart(2, '0'), 640, 67, 45, engine.timer <= 10 ? '#ffad73' : '#ffe6b2', 'center', 900);
    text(c, `ROUND ${engine.round}`, 640, 103, 13, '#b8c4b1', 'center');
    text(c, 'STREET VICENTE FIGHTER', 640, 686, 12, '#f2e5cbbb', 'center');
  }
  drawQuote(f) {
    const c = this.c, x = f.slot === 0 ? 320 : 960, alpha = Math.min(1, f.quoteTime * 3);
    c.save(); c.globalAlpha = alpha; c.font = '800 21px Arial'; const w = c.measureText(f.character.quote).width + 36;
    c.fillStyle = '#101c20e6'; c.strokeStyle = f.character.color; c.lineWidth = 2; rectangle(c, x - w / 2, 163, w, 43, 5); c.fill(); c.stroke();
    text(c, f.character.quote, x, 185, 21, f.character.color, 'center'); c.restore();
  }
  drawCombo(f) {
    const c = this.c, x = f.slot === 0 ? 67 : 1213; c.save(); c.globalAlpha = Math.min(1, f.comboTime * 3);
    text(c, `${f.combo} HITS`, x, 246, 32, f.character.color, f.slot === 0 ? 'left' : 'right', 900); c.restore();
  }
  drawAnnouncer(engine) {
    const c = this.c; let title = '', subtitle = '', size = 100;
    if (engine.phase === 'intro') { title = engine.phaseTime < 1.35 ? `ROUND ${engine.round}` : 'LUTEM!'; size = engine.phaseTime < 1.35 ? 77 : 105; }
    if (engine.phase === 'roundEnd') {
      title = engine.roundWinner === null ? 'EMPATE' : engine.timer <= 0 ? 'TEMPO!' : 'K.O.';
      subtitle = engine.roundWinner === null ? 'Vamos de novo.' : `${engine.fighters[engine.roundWinner].character.name} venceu o round`;
    }
    if (!title) return;
    c.save(); const scale = !this.reduced && engine.phaseTime < .2 ? 1 + (.2 - engine.phaseTime) * 1.7 : 1;
    c.translate(640, 326); c.scale(scale, scale); c.font = `900 italic ${size}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = '#111e1fe6'; c.strokeText(title, 0, 0);
    c.fillStyle = title === 'LUTEM!' ? '#b8ed68' : '#ffe4a6'; c.fillText(title, 0, 0); c.restore();
    if (subtitle) { c.fillStyle = '#102024db'; rectangle(c, 390, 388, 500, 42, 4); c.fill(); text(c, subtitle, 640, 410, 24, '#f4ecdb', 'center'); }
  }
}
