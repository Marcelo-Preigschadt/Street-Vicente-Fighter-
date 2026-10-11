export const SENTINEL = Object.freeze({
  delay: 2, offset: 132, groundHeight: 45, airHeight: 155,
  beamHeight: 8, beamDuration: .16, retireTime: .32,
  bodyWidth: 52, bodyHeight: 34,
});

export function droneHitbox(drone) {
  return { x: drone.x - SENTINEL.bodyWidth / 2, y: drone.y - SENTINEL.bodyHeight / 2,
    w: SENTINEL.bodyWidth, h: SENTINEL.bodyHeight };
}

// A laser is a single instantaneous horizontal trace, not a homing projectile.
export function sentinelRay(drone, width) {
  const x = Math.max(0, Math.min(width, drone.x + drone.direction * 29));
  const endX = drone.direction > 0 ? width : 0;
  return { x, endX, y: drone.y, direction: drone.direction,
    box: { x: Math.min(x, endX), y: drone.y - SENTINEL.beamHeight / 2,
      w: Math.abs(endX - x), h: SENTINEL.beamHeight } };
}
