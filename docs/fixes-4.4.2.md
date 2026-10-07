# 4.4.2 — versus isolation and articulated school machines

Versus uses a StoryEngine instance. Its projectile and sentinel overrides previously ran even when storyActive was false. Projectiles searched the empty campaign enemy collection and never collided with the other fighter; stale campaign camera state could also discard them. Delegation to FightEngine now covers projectile collisions, single drones and swarms, and their spawn positions. Thirty-two regression cases compare special/super simulation tick by tick for all eight heroes, with both fresh entry and story-to-versus transitions.

Furniture render and collision dimensions share story-props.js. Patio clusters now contain a 150 px tall table and two 170 px tall chairs, with a 285 px vending machine nearer the wall. Low furniture causes a contextual low strike from the story kick button; punch still picks up and throws furniture. Damage flashes, cracks, wood impact audio, six animated fragments and a three-second debris fade provide explicit destruction feedback. Projectile-to-prop collision is lane constrained.

Turnstile and cleaner use separate chassis, shoulder/elbow links, wheels, saw/baton and hub/brush textures. Rig angles use the existing anticipation/contact/recovery states. Saw discs, cleaning brushes and wheels rotate independently; the standing illustration is no longer translated as a single image. Four previously authored humanoid enemy atlases remain unchanged. Other enemy rigs are separate future animation work.

Delivery drones also use a separate body and rotor texture: the outer guard cage stays fixed while the blades spin inside, and the chassis banks during lateral movement.

Final generated parts (4.4.3): assets/story/turnstile-rig-v6.webp, cleaner-rig-v6.webp and snack-rig-v6.webp. Built-in image_gen.imagegen, reference-preserving prompts in assets/story/machine-rigs-v5-prompt.txt and snack-rig-v5-prompt.txt; reproducible atlas extraction in scripts/prepare-machine-rigs.py. Connected-component crops exclude alpha noise and adjacent atlas parts so arm pivots remain accurate. Original artwork and earlier released atlases are retained.
