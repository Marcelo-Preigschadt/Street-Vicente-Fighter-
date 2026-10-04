import { CHARACTERS, WORLD, fighterPose } from './engine.js?v=10';

import { SuperEffects } from './super-fx.js?v=10';

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
    this.superFX = new SuperEffects();

  }
  async load() {
    const characters = Object.values(CHARACTERS);
    const [background, ...sheets] = await Promise.all([loadImage('assets/arena.webp'), ...characters.flatMap(f => [loadImage(f.sprite), loadImage(f.combatSprite), loadImage(f.walkSprite)])]);
    this.background = background;
    characters.forEach((f, i) => { this.sheets[f.id] = this.analyzeSheet(sheets[i * 3]); this.sheets[f.id].combat = this.analyzeSheet(sheets[i * 3 + 1], true); this.sheets[f.id].walk = this.analyzeSheet(sheets[i * 3 + 2], false, 2); });
  }
  analyzeSheet(image, combat = false, rows = 4) {
    const frames = [];
    const offscreen = document.createElement('canvas'); offscreen.width = image.width; offscreen.height = image.height;
    const c = offscreen.getContext('2d', { willReadFrequently: true }); c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, image.width, image.height).data;
    for (let i = 0; i < 4 * rows; i++) {
      const column = i % 4, row = Math.floor(i / 4);
      const sx = Math.round(column * image.width / 4), sy = Math.round(row * image.height / rows);
      const ex = Math.round((column + 1) * image.width / 4), ey = Math.round((row + 1) * image.height / rows);
      // Generated atlases can have a few pixels crossing nominal cell borders.
      // Find the largest connected silhouette in a padded cell, excluding neighboring-pose fragments.
      const padding = combat ? 64 : 12;
      const rx = Math.max(0, sx - padding), ry = Math.max(0, sy - padding);
      const rw = Math.min(image.width, ex + padding) - rx, rh = Math.min(image.height, ey + padding) - ry;
      const mask = new Uint8Array(rw * rh), stack = new Int32Array(rw * rh);
      for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) mask[y * rw + x] = pixels[((ry + y) * image.width + rx + x) * 4 + 3] >= 95 ? 1 : 0;
      let best = null;
      for (let start = 0; start < mask.length; start++) {
        if (mask[start] !== 1) continue;
        const members = [];
        let top = 0, count = 0, bx1 = rw, by1 = rh, bx2 = 0, by2 = 0; stack[top++] = start; mask[start] = 2;
        while (top) {
          const index = stack[--top], x = index % rw, y = Math.floor(index / rw); count++; members.push(index);
          bx1 = Math.min(bx1, x); by1 = Math.min(by1, y); bx2 = Math.max(bx2, x); by2 = Math.max(by2, y);
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if ((!dx && !dy) || x + dx < 0 || x + dx >= rw || y + dy < 0 || y + dy >= rh) continue;
            const next = index + dy * rw + dx; if (mask[next] === 1) { mask[next] = 2; stack[top++] = next; }
          }
        }
        if (!best || count > best.count) best = { count, bx1, by1, bx2, by2, members };
      }
      if (!best || best.count < 100) throw new Error('Sprite vazio. Verifique o atlas de personagens.');
      const x1 = rx + best.bx1 - sx, y1 = ry + best.by1 - sy, x2 = rx + best.bx2 - sx, y2 = ry + best.by2 - sy;
      // Ground-foot midpoint anchors attacks without moving the fighter's physical position.
      let footLeft = image.width, footRight = 0;
      for (let y = Math.max(y1, y2 - 15); y <= y2; y++) for (let x = x1; x <= x2; x++) {
        if (pixels[((sy + y) * image.width + sx + x) * 4 + 3] > 140) { footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x); }
      }
      let anchor = i === 4 || i === 15 ? (x1 + x2) / 2 : (footLeft + footRight) / 2;
      // Align idle/walking poses by the pelvis; moving feet must not shift the whole body.
      if (!combat && (rows === 2 || i < 4)) {
        let sum = 0, rows = 0;
        for (let y = Math.round(y1 + (y2 - y1) * .57); y <= Math.round(y1 + (y2 - y1) * .65); y++) {
          let left = x2, right = x1;
          for (let x = x1; x <= x2; x++) if (pixels[((sy + y) * image.width + sx + x) * 4 + 3] > 140) { left = Math.min(left, x); right = Math.max(right, x); }
          if (right >= left) { sum += (left + right) / 2; rows++; }
        }
        if (rows) anchor = sum / rows;
      }
      if (combat) {
        // The support foot anchors low attacks. Air attacks use the torso side rather than the extended heel.
        if ([1, 3, 5, 7, 14].includes(i)) anchor = x1 + (x2 - x1) * (i === 3 ? .30 : i === 7 ? .35 : .39);
        if ([4, 6, 11].includes(i)) anchor = x1 + (x2 - x1) * .49;
      }
      // Extract this silhouette so the crop cannot contain a neighboring-pose fragment.
      const w = x2 - x1 + 1, h = y2 - y1 + 1, cutout = document.createElement('canvas'); cutout.width = w; cutout.height = h;
      const clean = cutout.getContext('2d'), data = clean.createImageData(w, h);
      for (const index of best.members) {
        const mx = index % rw, my = Math.floor(index / rw);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = mx + dx - best.bx1, y = my + dy - best.by1;
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          const src = ((ry + my + dy) * image.width + rx + mx + dx) * 4, dst = (y * w + x) * 4;
          for (let channel = 0; channel < 4; channel++) data.data[dst + channel] = pixels[src + channel];
        }
      }
      clean.putImageData(data, 0, 0);
      frames.push({ sx, sy, x: x1, y: y1, w, h, anchor, bottom: y2, cutout });
    }
    // Whole walk poses have separate uniform calibration, so atlas row size
    // cannot make the professor shrink during a stride. No limb is stretched.
    if (rows === 2) for (const frame of frames) frame.scale = 294 / frame.h;
    return { image, frames, scale: 294 / frames[combat ? 8 : 0].h };
  }
  frameFor(f) {
    return fighterPose(f).index;
  }
  poseFor(f) {
    const original = this.sheets[f.character.id], { atlas, index } = fighterPose(f);
    return { sheet: atlas === 'combat' ? original.combat : atlas === 'walk' ? original.walk : original, index, id: `${atlas}:${index}` };
  }
  preview(canvas, id) {
    const c = canvas.getContext('2d'), sheet = this.sheets[id]; if (!sheet) return;
    const f = sheet.frames[0], scale = Math.min((canvas.height - 15) / f.h, (canvas.width - 35) / f.w);
    c.clearRect(0, 0, canvas.width, canvas.height); c.imageSmoothingEnabled = true;
    c.drawImage(f.cutout, 0, 0, f.w, f.h, (canvas.width - f.w * scale) / 2, canvas.height - f.h * scale - 3, f.w * scale, f.h * scale);
  }
  event(e) {
    this.superFX.event(e);
    if (e.type === 'hit' || e.type === 'block' || e.type === 'clash') {
      const count = e.type === 'block' ? 9 : ['special', 'uppercut', 'super'].includes(e.move) ? 35 : 21;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2, speed = 110 + Math.random() * 390;
        this.particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .2 + Math.random() * .3, maxLife: .5, color: e.type === 'block' ? '#9ce3ff' : i % 3 === 0 ? '#ffffff' : e.color, size: 2 + Math.random() * 5 });
      }
      if (e.type === 'hit') {
        this.shake = this.reduced ? 0 : ['special', 'uppercut', 'super'].includes(e.move) ? 7 : 3; this.flash = ['special', 'uppercut', 'super'].includes(e.move) ? .06 : .025;
        this.labels.push({ x: e.x, y: e.y - 35, life: .75, text: `−${e.damage}`, color: '#fff0bf' });
      }
    }
    if (e.type === 'round') { this.particles = []; this.labels = []; this.shake = 0; this.flash = 0; }
  }
  draw(engine, dt, alpha = 1) {
    const c = this.c; this.clock += dt; this.shake *= Math.exp(-dt * 14); this.flash = Math.max(0, this.flash - dt);
    this.superFX.update(dt);
    if (engine.phase === 'selection') this.superFX.clear();
    c.save();
    if (this.shake > .1) c.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    this.drawBackground(engine);
    if (engine.phase !== 'selection') {
      if (engine.freeze > 0) alpha = 1;
      const fighters = engine.fighters.map(f => ({ ...f, x: f.prevX + (f.x - f.prevX) * alpha, y: f.prevY + (f.y - f.prevY) * alpha,
        walkDistance: f.prevWalkDistance + (f.walkDistance - f.prevWalkDistance) * alpha,
        walkBlend: f.prevWalkBlend + (f.walkBlend - f.prevWalkBlend) * alpha, actionTime: f.actionTime }));
      for (const f of fighters) this.drawShadow(f);
      for (const f of fighters.sort((a, b) => a.y - b.y)) this.drawFighter(f);
      for (const p of engine.projectiles) this.drawProjectile({ ...p, x: p.prevX + (p.x - p.prevX) * alpha });
      this.drawParticles(dt);
      this.drawSuperScene(fighters);
      this.drawSuperImpacts();
      this.drawHUD(engine);
      this.drawReadyEffects(engine);
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
    c.beginPath(); c.ellipse(f.x, WORLD.floor + 3, ['ko', 'knockdown'].includes(f.state) ? 120 : 77 - air * .09, 12, 0, 0, Math.PI * 2); c.fill();
  }
  drawFighter(f) {
    const c = this.c, current = this.poseFor(f); if (!current.sheet) return;
    // Arcade poses stay opaque. Position interpolation supplies smooth movement.
    const breathing = f.state === 'idle' && !this.reduced ? Math.sin(f.animTime * 5) * .003 : 0;
    c.save(); c.translate(f.x, f.y); c.scale(f.direction, 1 + breathing);
    if (['special', 'super', 'uppercut'].includes(f.state)) { c.shadowColor = f.character.color; c.shadowBlur = 12; }
    if (f.flash > 0) c.filter = 'brightness(1.8)';
    if (f.blockFlash > 0) c.filter = 'brightness(1.3) sepia(.1)';
    if (f.invincible > 0 && f.state === 'idle' && Math.floor(this.clock * 24) % 2) c.globalAlpha = .75;
    const drawPose = (selected, opacity) => {
      const { sheet, index } = selected, frame = sheet.frames[index], scale = frame.scale ?? sheet.scale; c.globalAlpha = opacity;
      c.drawImage(frame.cutout, 0, 0, frame.w, frame.h,
        (frame.x - frame.anchor) * scale, (frame.y - frame.bottom) * scale, frame.w * scale, frame.h * scale);
    };
    drawPose(current, 1);
    c.globalAlpha = 1; c.restore();
    if (['special', 'super'].includes(f.state) && f.actionTime < f.moveData.startup) {
      const strength = f.actionTime / f.moveData.startup, release = f.character.projectile;
      this.drawPowerGlyph(f.x + f.direction * (55 + strength * (release.offset - 55)), f.y - release.height, 10 + strength * 18, f.character.id, false);
    }
    if (f.state === 'uppercut') this.drawRisingPower(f);
  }
  drawSuperScene(fighters) {
    const active = this.superFX.bursts;
    if (!active.length) return;
    const c = this.c, opacity = Math.max(...active.map(fx => Math.min(1, (fx.duration - fx.age) / .18)));
    c.save(); c.fillStyle = `rgba(3,7,31,${opacity * (this.reduced ? .48 : .88)})`; c.fillRect(0, 0, WORLD.width, WORLD.height);
    for (const fx of active) {
      const f = fighters.find(f => f.slot === fx.fighter), color = fx.color;
      if (!f) continue;
      const progress = Math.min(1, fx.age / fx.freeze), fade = Math.min(1, (fx.duration - fx.age) / .18);
      const x = f.x + f.direction * 92, y = f.y - 194;
      c.globalAlpha = fade;
      const aura = c.createRadialGradient(x, y, 5, x, y, 320);
      aura.addColorStop(0, '#e8faff99'); aura.addColorStop(.20, `${color}66`); aura.addColorStop(.65, '#2777d233'); aura.addColorStop(1, '#08183d00');
      c.fillStyle = aura; c.fillRect(0, 120, WORLD.width, 530);
      if (!this.reduced) {
        for (let ray = 0; ray < 22; ray++) {
          const angle = ray * Math.PI * 2 / 22 + .09 * progress;
          const inner = 13 + (1 - progress) * 48, outer = 180 + (1 - progress) * 380 + (ray % 3) * 58;
          c.fillStyle = ray % 3 ? `${color}bb` : '#d5f4ffdd';
          c.beginPath(); c.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
          c.lineTo(x + Math.cos(angle - .016) * outer, y + Math.sin(angle - .016) * outer);
          c.lineTo(x + Math.cos(angle + .016) * outer, y + Math.sin(angle + .016) * outer); c.closePath(); c.fill();
        }
        c.strokeStyle = '#c7edff'; c.lineWidth = 2.5;
        for (let i = 0; i < 2; i++) { const radius = Math.max(28, 210 - progress * 178 + i * 28); c.beginPath(); c.ellipse(x, y, radius, radius * .66, -.3, 0, Math.PI * 2); c.stroke(); }
      }
      // The caster remains fully opaque and lit against the darkened fight.
      c.globalAlpha = 1; c.shadowColor = color; c.shadowBlur = 24 * fade; this.drawFighter(f); c.shadowBlur = 0;
      if (!this.reduced) {
        c.globalAlpha = fade * .85; c.strokeStyle = '#f6ffff'; c.lineWidth = 4;
        const star = 16 + 20 * (1 - progress);
        c.beginPath(); c.moveTo(x - star * 1.7, y); c.lineTo(x + star * 1.7, y); c.moveTo(x, y - star); c.lineTo(x, y + star); c.stroke();
        c.fillStyle = `rgba(225,244,255,${Math.max(0, 1 - fx.age / .075) * .60})`; c.fillRect(0, 0, WORLD.width, WORLD.height);
      }
      c.globalAlpha = fade;
      const titleY = active.length > 1 ? 262 + fx.fighter * 61 : 278;
      const band = c.createLinearGradient(170, 0, 1110, 0); band.addColorStop(0, '#08182c00'); band.addColorStop(.18, '#08182ce8'); band.addColorStop(.82, '#08182ce8'); band.addColorStop(1, '#08182c00');
      c.fillStyle = band; c.fillRect(170, titleY - 31, 940, 63);
      c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); c.moveTo(285, titleY + 31); c.lineTo(995, titleY + 31); c.stroke();
      text(c, fx.name.toLocaleUpperCase('pt-BR'), 640, titleY, 43, '#f2faff', 'center', 900);
    }
    c.restore();
  }
  drawReadyEffects(engine) {
    const c = this.c;
    for (const fx of this.superFX.ready) {
      const f = engine.fighters[fx.fighter], fade = Math.max(0, 1 - fx.age / fx.duration), right = f.slot === 1;
      const x = right ? 853 : 54;
      c.save(); c.globalAlpha = fade; c.strokeStyle = fx.color; c.lineWidth = 2;
      const expand = this.reduced ? 4 : fx.age * 24;
      c.strokeRect(x - expand, 674 - expand / 2, 373 + expand * 2, 13 + expand);
      if (!this.reduced) {
        const radial = c.createRadialGradient(f.x, f.y - 160, 25, f.x, f.y - 160, 150);
        radial.addColorStop(0, `${fx.color}00`); radial.addColorStop(.7, `${fx.color}33`); radial.addColorStop(1, `${fx.color}00`);
        c.fillStyle = radial; c.fillRect(f.x - 155, f.y - 315, 310, 310);
        c.strokeStyle = `${fx.color}88`; c.lineWidth = 1.5;
        const radius = 42 + fx.age * 116;
        c.beginPath(); c.ellipse(f.x, f.y - 160, radius, radius * .75, 0, 0, Math.PI * 2); c.stroke();
      }
      text(c, 'SUPER PRONTO', right ? 1035 : 240, 627 - (this.reduced ? 0 : fx.age * 16), 22, '#efffd3', 'center'); c.restore();
    }
  }
  drawSuperImpacts() {
    const c = this.c;
    for (const fx of this.superFX.impacts) {
      const fade = 1 - fx.age / fx.duration, radius = this.reduced ? 40 : 32 + fx.age * 720;
      c.save();c.globalAlpha=fade;c.strokeStyle=fx.color;c.lineWidth=5;
      c.beginPath();c.ellipse(fx.x,fx.y,radius*1.35,radius*.70,0,0,Math.PI*2);c.stroke();
      if (!this.reduced) {
        const light=c.createRadialGradient(fx.x,fx.y,0,fx.x,fx.y,210);
        light.addColorStop(0,'#f4ffffbb');light.addColorStop(.25,`${fx.color}77`);light.addColorStop(1,`${fx.color}00`);
        c.fillStyle=light;c.fillRect(fx.x-210,fx.y-210,420,420);
        c.strokeStyle='#f5ffff';c.lineWidth=3;
        for(let i=0;i<8;i++){const angle=i*Math.PI/4;c.beginPath();c.moveTo(fx.x+Math.cos(angle)*radius*.55,fx.y+Math.sin(angle)*radius*.55);c.lineTo(fx.x+Math.cos(angle)*(radius+55),fx.y+Math.sin(angle)*(radius+55));c.stroke();}
      }
      c.restore();
    }
  }
  drawPowerGlyph(x, y, radius, id, superWave = false) {
    const c = this.c, color = CHARACTERS[id].color;
    c.save(); c.translate(x, y); c.shadowColor = color; c.shadowBlur = superWave ? 25 : 18;
    if (id === 'gustavo') {
      c.rotate(this.clock * (superWave ? 2.5 : 1.4));
      c.strokeStyle = '#b39bff'; c.lineWidth = superWave ? 4 : 2;
      if (superWave) {
        const atoms = [[0, 0], [-radius * .9, -radius * .55], [radius * .9, radius * .55], [-radius * .4, radius], [radius * .4, -radius]];
        for (const [ax, ay] of atoms.slice(1)) { c.beginPath(); c.moveTo(0, 0); c.lineTo(ax, ay); c.stroke(); }
        atoms.forEach(([ax, ay], i) => {
          c.fillStyle = i % 2 ? '#b39bff' : '#77dcf5'; c.beginPath(); c.arc(ax, ay, radius * (i ? .34 : .48), 0, Math.PI * 2); c.fill();
          c.fillStyle = '#effcff'; c.beginPath(); c.arc(ax - radius * .08, ay - radius * .10, radius * .10, 0, Math.PI * 2); c.fill();
        });
      } else {
        const glow = c.createRadialGradient(-radius * .2, -radius * .2, 1, 0, 0, radius * .75);
        glow.addColorStop(0, '#ffffff'); glow.addColorStop(.35, '#a9f6ff'); glow.addColorStop(1, '#237bcb');
        c.fillStyle = glow; c.beginPath(); c.arc(0, 0, radius * .68, 0, Math.PI * 2); c.fill();
        for (let i = 0; i < 3; i++) {
          c.save(); c.rotate(i * Math.PI / 3); c.beginPath(); c.ellipse(0, 0, radius * 1.3, radius * .48, 0, 0, Math.PI * 2); c.stroke();
          c.fillStyle = '#f2fcff'; c.beginPath(); c.arc(radius * 1.3, 0, radius * .13, 0, Math.PI * 2); c.fill(); c.restore();
        }
      }
    } else if (id === 'marcelo') {
      c.fillStyle = '#103523'; c.strokeStyle = color; c.lineWidth = 2.5;
      rectangle(c, -radius * 1.25, -radius * .88, radius * 2.5, radius * 1.76, 5); c.fill(); c.stroke();
      c.fillStyle = '#e6ffc4'; c.font = `900 ${Math.round(radius * .85)}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(superWave ? '0xFF' : '{ }', 0, 1);
      c.fillStyle = color;
      for (let i = 0; i < 3; i++) c.fillRect(-radius + i * radius * .25, -radius * .65, radius * .12, radius * .12);
    } else if (superWave) {
      // Bronze shields make the history super visibly different from a fireball.
      c.fillStyle = '#533018'; c.strokeStyle = '#ffdaa0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-radius, -radius); c.lineTo(radius, -radius); c.lineTo(radius * .8, radius * .55); c.quadraticCurveTo(0, radius * 1.5, -radius * .8, radius * .55); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffb555'; c.fillRect(-radius * .15, -radius * .65, radius * .3, radius * 1.55); c.fillRect(-radius * .65, -radius * .12, radius * 1.3, radius * .28);
      c.fillStyle = '#fff4d1'; c.beginPath(); c.arc(0, 0, radius * .24, 0, Math.PI * 2); c.fill();
    } else {
      // A rolled manuscript, with handwritten lines and visible scroll ends.
      c.rotate(Math.sin(this.clock * 10) * .10); c.fillStyle = '#f6dca6'; c.strokeStyle = '#976332'; c.lineWidth = 2;
      rectangle(c, -radius, -radius * .85, radius * 2, radius * 1.7, 3); c.fill(); c.stroke();
      c.fillStyle = '#c28d4a'; rectangle(c, -radius * 1.2, -radius, radius * .3, radius * 2, 4); c.fill(); rectangle(c, radius * .9, -radius, radius * .3, radius * 2, 4); c.fill();
      c.strokeStyle = '#735632'; c.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { const yy = -radius * .5 + i * radius * .32; c.beginPath(); c.moveTo(-radius * .6, yy); c.lineTo(radius * (i % 2 ? .5 : .65), yy); c.stroke(); }
    }
    c.restore();
  }
  drawRisingPower(f) {
    const c = this.c, m = f.moveData;
    if (!m || f.actionTime < m.startup || f.actionTime > m.startup + m.active + .18) return;
    const intensity = Math.max(0, 1 - (f.actionTime - m.startup) / (m.active + .18));
    c.save(); c.globalAlpha = intensity * .8; c.shadowColor = f.character.color; c.shadowBlur = 15;
    if (f.character.id === 'marcelo') {
      const x = f.x + f.direction * 50;
      c.fillStyle = '#104c3844'; c.strokeStyle = '#b8ed68'; c.lineWidth = 3; rectangle(c, x - 63, f.y - 365, 126, 320, 8); c.fill(); c.stroke();
      c.fillStyle = '#b8ed68'; c.fillRect(x - 61, f.y - 365, 122, 22); text(c, 'FIREWALL', x, f.y - 353, 12, '#082a1b', 'center');
      for (let i = 0; i < 7; i++) text(c, i % 2 ? '01 101 01' : '10 010 10', x, f.y - 315 + i * 35, 16, '#a3ffbe', 'center', 700);
    } else if (f.character.id === 'gustavo') {
      const x = f.x + f.direction * 46, bottom = f.y - 38;
      const heat = c.createLinearGradient(x, bottom, x, bottom - 310);
      heat.addColorStop(0, '#28b4e066'); heat.addColorStop(.3, '#ff941fbb'); heat.addColorStop(.7, '#fff18be6'); heat.addColorStop(1, '#ffffff00');
      c.fillStyle = heat; c.beginPath(); c.moveTo(x - 65, bottom);
      c.bezierCurveTo(x - 102, bottom - 125, x - 12, bottom - 172, x - 30, bottom - 300);
      c.bezierCurveTo(x + 22, bottom - 228, x + 18, bottom - 184, x + 50, bottom - 270);
      c.bezierCurveTo(x + 105, bottom - 145, x + 76, bottom - 65, x + 63, bottom); c.closePath(); c.fill();
      c.strokeStyle = '#aaf5ff'; c.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const rise = (this.clock * 150 + i * 43) % 290, px = x + Math.sin(i * 2.7 + this.clock * 9) * (55 - rise * .1);
        c.beginPath(); c.arc(px, bottom - rise, 5 + (i % 3) * 3, 0, Math.PI * 2); c.stroke();
      }
      text(c, 'ΔH < 0', x, bottom + 14, 16, '#f6e99d', 'center');
    } else {
      const x = f.x + f.direction * 48, y = f.y - 240;
      c.strokeStyle = '#ffcd83'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 99, -Math.PI * .8, Math.PI * .8); c.stroke();
      for (let i = 0; i < 5; i++) {
        const angle = -2.1 + i * .88, px = x + Math.cos(angle) * 98, py = y + Math.sin(angle) * 98;
        c.fillStyle = '#714823'; c.beginPath(); c.arc(px, py, 21, 0, Math.PI * 2); c.fill(); c.stroke();
        text(c, ['I', 'V', 'X', 'XV', 'XX'][i], px, py, 17, '#ffe5b3', 'center');
      }
      text(c, 'LINHA DO TEMPO', x, y + 117, 14, '#ffe1a0', 'center');
    }
    c.restore();
  }
  drawProjectile(p) {
    const c = this.c, color = CHARACTERS[p.character].color;
    c.save(); c.translate(p.x, p.y); c.scale(p.direction, 1);
    if (p.character === 'marcelo') {
      c.font = '700 17px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < 5; i++) {
        c.globalAlpha = .75 - i * .13; c.fillStyle = color;
        c.fillText((i + Math.floor(this.clock * 12)) % 2 ? '01' : '10', -45 - i * 27, Math.sin(this.clock * 15 + i) * 15);
      }
    } else if (p.character === 'gustavo') {
      c.strokeStyle = '#b39bff'; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        c.globalAlpha = .7 - i * .12; const x = -40 - i * 23, y = Math.sin(this.clock * 12 + i * 1.7) * 16;
        c.fillStyle = i % 2 ? '#b39bff' : '#77dcf5'; c.beginPath(); c.arc(x, y, 6 - i * .5, 0, Math.PI * 2); c.fill();
        if (p.move === 'super' && i < 4) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 23, Math.sin(this.clock * 12 + (i + 1) * 1.7) * 16); c.stroke(); }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        c.globalAlpha = .55 - i * .13; c.fillStyle = '#f5d7a0'; c.save(); c.translate(-43 - i * 31, Math.sin(this.clock * 9 + i) * 12); c.rotate(-.35 + Math.sin(this.clock * 9 + i) * .2); c.fillRect(-10, -13, 20, 26); c.restore();
      }
    }
    c.restore(); this.drawPowerGlyph(p.x, p.y, p.radius, p.character, p.move === 'super');
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
    c.drawImage(frame.cutout, headX - frame.x, headY - frame.y, headW, headH, x - 4, y - 1, 80, 81); c.restore();
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
      if (f.meter >= 100) {
        c.save(); c.shadowColor = f.character.color; c.shadowBlur = this.reduced ? 8 : 12 + Math.sin(this.clock * 7) * 4;
        c.strokeStyle = '#f0ffca'; c.lineWidth = 2; c.strokeRect(energyX - 1, 673, energyWidth + 2, 15);
        if (!this.reduced) {
          c.beginPath(); c.rect(energyX, 674, energyWidth, 13); c.clip();
          const sweep = (this.clock * 135) % (energyWidth + 100) - 50;
          const shine = c.createLinearGradient(energyX + sweep - 25, 0, energyX + sweep + 25, 0);
          shine.addColorStop(0, '#ffffff00'); shine.addColorStop(.5, '#ffffffa0'); shine.addColorStop(1, '#ffffff00');
          c.fillStyle = shine; c.fillRect(energyX, 674, energyWidth, 13);
        }
        c.restore();
      }
      c.strokeStyle = '#dde6cc88'; c.lineWidth = 1; c.strokeRect(energyX, 674, energyWidth, 13);
      for (let j = 1; j <= 3; j++) { c.fillStyle = '#142224'; c.fillRect(energyX + energyWidth * .25 * j - 1, 674, 2, 13); }
      text(c, f.meter >= 100 ? 'SUPER PRONTO' : 'SUPER', right ? energyX + energyWidth : energyX, 666, 13, f.meter >= 100 ? f.character.color : '#a7b8ae', right ? 'right' : 'left');
      text(c, Math.floor(f.meter).toString(), right ? energyX : energyX + energyWidth, 666, 13, '#f5ecd9', right ? 'left' : 'right');
    });
    c.fillStyle = '#142323'; c.strokeStyle = '#dacda4'; c.lineWidth = 2; rectangle(c, 592, 28, 96, 89, 9); c.fill(); c.stroke();
    text(c, Math.ceil(engine.timer).toString().padStart(2, '0'), 640, 67, 45, engine.timer <= 10 ? '#ffad73' : '#ffe6b2', 'center', 900);
    text(c, `ROUND ${engine.round}`, 640, 103, 13, '#b8c4b1', 'center');
    text(c, 'STREET VICENTE FIGHTER', 640, 686, 12, '#f2e5cbbb', 'center');
  }
  drawQuote(f) {
    const c = this.c, x = f.slot === 0 ? 320 : 960, alpha = Math.min(1, f.quoteTime * 3);
    c.save(); c.globalAlpha = alpha; c.font = '800 21px Arial'; const w = Math.max(c.measureText(f.powerQuote || f.character.quote).width, c.measureText(f.powerName || '').width) + 36;
    c.fillStyle = '#101c20e6'; c.strokeStyle = f.character.color; c.lineWidth = 2; rectangle(c, x - w / 2, 151, w, 66, 5); c.fill(); c.stroke();
    text(c, f.powerName || '', x, 166, 13, '#f4ecdb', 'center'); text(c, f.powerQuote || f.character.quote, x, 194, 21, f.character.color, 'center'); c.restore();
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
