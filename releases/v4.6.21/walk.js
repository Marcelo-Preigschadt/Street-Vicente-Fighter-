// Complete painted poses preserve anatomy without cutting or deforming limbs.
// The cycle follows actual distance after wall/body contact and reverses on retreat.
export const WALK_STRIDE = 200;
export const WALK_FRAMES = 8;
export function walkingFrame(distance) {
  const cycle = ((distance % WALK_STRIDE) + WALK_STRIDE) % WALK_STRIDE;
  return Math.floor(cycle / WALK_STRIDE * WALK_FRAMES) % WALK_FRAMES;
}
