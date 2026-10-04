// The approved guard sprite is skinned over a two-leg rig. No pose crossfade:
// one opaque body, articulated knees/ankles and a grounded support foot.
export const WALK_STRIDE = 200;
const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;
const pointMix = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
const smooth = t => t * t * (3 - 2 * t);
const point = (x, y) => ({ x, y });
export const WALK_RIGS = {
  marcelo: {
    far: { hip: point(-24, -143), knee: point(-61, -76), ankle: point(-83, -16) },
    near: { hip: point(23, -143), knee: point(58, -79), ankle: point(66, -16) },
  },
  rafael: {
    far: { hip: point(-24, -145), knee: point(-62, -75), ankle: point(-88, -16) },
    near: { hip: point(23, -145), knee: point(59, -78), ankle: point(65, -16) },
  },
};

// During stance, local foot travel exactly cancels world travel. Swing uses a
// curved path and a bent knee; reversing travel reverses the same continuous gait.
export function footAt(cycle) {
  const phase = ((cycle % 1) + 1) % 1;
  if (phase < .5) {
    const roll = phase < .06 ? -.18 * (1 - phase / .06) : phase > .43 ? .32 * (phase - .43) / .07 : 0;
    return { x: WALK_STRIDE / 4 - WALK_STRIDE * phase, y: 0, angle: roll,
      pivot: phase < .06 ? -15 : 33, planted: true, phase };
  }
  const t = (phase - .5) * 2;
  return { x: -WALK_STRIDE / 4 + WALK_STRIDE / 2 * smooth(t), y: -29 * Math.sin(Math.PI * t),
    angle: .32 * (1 - t) - .18 * t, pivot: 0, planted: false, phase };
}

function rotate(p, angle) {
  return point(p.x * Math.cos(angle) - p.y * Math.sin(angle), p.x * Math.sin(angle) + p.y * Math.cos(angle));
}
function legAt(source, cycle, bob, blend) {
  const foot = footAt(cycle), hip = point(source.hip.x, source.hip.y + bob);
  const turnedAnkle = rotate(point(-foot.pivot, source.ankle.y), foot.angle);
  const ankle = point(foot.x + foot.pivot + turnedAnkle.x, foot.y + turnedAnkle.y);
  // Two-bone IK keeps the shoe on its prescribed path. A small length allowance
  // accommodates the existing sprite's stylized proportions without locking knees.
  const dx = ankle.x - hip.x, dy = ankle.y - hip.y, distance = Math.hypot(dx, dy);
  const thigh = Math.max(73, distance * .515), shin = Math.max(70, distance * .495);
  const along = (thigh * thigh - shin * shin + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, thigh * thigh - along * along));
  const knee = point(hip.x + dx / distance * along + dy / distance * bend,
    hip.y + dy / distance * along - dx / distance * bend);
  return { hip: pointMix(source.hip, hip, blend), knee: pointMix(source.knee, knee, blend),
    ankle: pointMix(source.ankle, ankle, blend), angle: foot.angle * blend, foot,
    source, blend };
}

export function walkingPose(f) {
  const cycle = f.walkDistance / WALK_STRIDE, blend = f.walkBlend ?? 1;
  const bob = -2.2 * (1 - Math.cos(cycle * TAU * 2)) / 2 * blend;
  const rig = WALK_RIGS[f.character.id];
  return { bob, far: legAt(rig.far, cycle + .5, bob, blend), near: legAt(rig.near, cycle, bob, blend) };
}

export function boneMap(p, a, b, targetA, targetB) {
  const sx = b.x - a.x, sy = b.y - a.y, length = Math.hypot(sx, sy);
  const tx = targetB.x - targetA.x, ty = targetB.y - targetA.y, targetLength = Math.hypot(tx, ty);
  const along = ((p.x - a.x) * sx + (p.y - a.y) * sy) / (length * length);
  const across = ((p.x - a.x) * -sy + (p.y - a.y) * sx) / length;
  return point(targetA.x + tx * along - ty / targetLength * across,
    targetA.y + ty * along + tx / targetLength * across);
}
export function shoePoint(p, leg) {
  const offset = rotate(point(p.x - leg.source.ankle.x, p.y - leg.source.ankle.y), leg.angle);
  return point(leg.ankle.x + offset.x, leg.ankle.y + offset.y);
}

// The lower-leg hurt area follows the same ankles and knee skinning as drawing.
export function walkingLegBounds(pose) {
  const points = [];
  for (const leg of [pose.far, pose.near]) {
    for (const x of [-26, 34]) for (const y of [-20, 0]) points.push(shoePoint(point(leg.source.ankle.x + x, y), leg));
    points.push(point(leg.knee.x - 20, leg.knee.y), point(leg.knee.x + 20, leg.knee.y));
  }
  const left = Math.min(...points.map(p => p.x)), right = Math.max(...points.map(p => p.x));
  const top = Math.min(...points.map(p => p.y)), bottom = Math.min(0, Math.max(...points.map(p => p.y)));
  return [left, -top, right - left, bottom - top];
}
