// Offline atlas extraction. Ownership belongs to the nominal cell, even when
// a neighbouring pose extends into its padding. Never paint or fill alpha holes.
export function spriteComponents(pixels, width, height, region, options = {}) {
  const [rx, ry, rw, rh] = region;
  const threshold = options.alphaThreshold ?? 95;
  const cell = options.cell ?? [rx, ry, rx + rw, ry + rh];
  const attachmentGap = options.attachmentGap ?? 3;
  const minPartPixels = options.minPartPixels ?? 8;
  const labels = new Int32Array(rw * rh), stack = new Int32Array(rw * rh);
  const components = [];
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || pixels[((ry + Math.floor(start / rw)) * width + rx + start % rw) * 4 + 3] < threshold) continue;
    const component = { id: components.length + 1, count: 0, owned: 0, bx1: rw, by1: rh, bx2: -1, by2: -1, members: [] };
    let top = 0; stack[top++] = start; labels[start] = component.id;
    while (top) {
      const index = stack[--top], x = index % rw, y = Math.floor(index / rw);
      component.count++; component.members.push(index);
      component.bx1 = Math.min(component.bx1, x); component.by1 = Math.min(component.by1, y);
      component.bx2 = Math.max(component.bx2, x); component.by2 = Math.max(component.by2, y);
      if (rx + x >= cell[0] && rx + x < cell[2] && ry + y >= cell[1] && ry + y < cell[3]) component.owned++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((!dx && !dy) || nx < 0 || nx >= rw || ny < 0 || ny >= rh) continue;
        const next = ny * rw + nx;
        if (!labels[next] && pixels[((ry + ny) * width + rx + nx) * 4 + 3] >= threshold) {
          labels[next] = component.id; stack[top++] = next;
        }
      }
    }
    components.push(component);
  }
  // Size in the padding is not evidence that a fragment belongs to this pose.
  const primary = components.reduce((best, part) => !best || part.owned > best.owned || part.owned === best.owned && part.count > best.count ? part : best, null);
  if (!primary || primary.owned < (options.minPixels ?? 100)) throw new Error('Sprite vazio. Verifique o atlas de personagens.');
  const selected = new Set([primary.id]);
  if (attachmentGap > 0) {
    let changed;
    do {
      changed = false;
      for (const part of components) {
        // A separately drawn shoe/finger can be separated by thresholding the
        // antialiasing. Only near, predominantly cell-owned parts may join.
        if (selected.has(part.id) || part.count < minPartPixels || part.owned < part.count * .8) continue;
        const nearBox = [...selected].some(id => {
          const body = components[id - 1];
          return Math.max(0, body.bx1 - part.bx2, part.bx1 - body.bx2, body.by1 - part.by2, part.by1 - body.by2) <= attachmentGap + 1;
        });
        if (!nearBox) continue;
        const touching = part.members.some(index => {
          const x = index % rw, y = Math.floor(index / rw);
          for (let dy = -attachmentGap - 1; dy <= attachmentGap + 1; dy++) for (let dx = -attachmentGap - 1; dx <= attachmentGap + 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < rw && ny >= 0 && ny < rh && selected.has(labels[ny * rw + nx])) return true;
          }
          return false;
        });
        if (touching) { selected.add(part.id); changed = true; }
      }
    } while (changed);
  }
  const result = { count: 0, bx1: rw, by1: rh, bx2: -1, by2: -1, members: [] };
  for (const id of selected) {
    const part = components[id - 1]; result.count += part.count;
    result.bx1 = Math.min(result.bx1, part.bx1); result.by1 = Math.min(result.by1, part.by1);
    result.bx2 = Math.max(result.bx2, part.bx2); result.by2 = Math.max(result.by2, part.by2);
    for (const index of part.members) result.members.push(index);
  }
  return result;
}
