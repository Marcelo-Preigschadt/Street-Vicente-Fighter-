# Mostafa browser port provenance

Upstream: https://github.com/shahfarhadreza/mostafa-the-game (main, retrieved 2026-10-07).
Author: shahfarhadreza. Original C code is GPL-3.0; the complete upstream license is included.
The source files in `src/` are preserved unchanged. The Windows executable is not distributed or executed.

`src/mostafa-port.js` in the game translates `enemy_do_ai`, `sprite_update` and the dead-zone camera in `player_update`: idle detection, running approach, four orbit destinations, engagement lock, punch preparation, contact frame, recovery and terminal fall frame. Centiseconds are converted to seconds; random choices use the shared campaign seed.

The browser adapter uses the existing eight Vicente player assets, their powers, school backgrounds, four-act progression and props. It retains the deterministic online transport. Cooperative extension allows one engaged enemy per active player, chooses the nearest living player and exports every AI/animation field in campaign snapshots. A directional vector prevents diagonal speed increases.

`assets/story/mostafa/` contains the upstream Ferris, Gneiss and Butcher sprite atlases converted from BMP to lossless WebP with the original blue color key removed. Original Cadillac artwork is credited to Capcom; no claim of original authorship is made. The source BMP files are available in upstream `bin/`. Cell dimensions follow the actual BMP layout (120×100 and 200×149), correcting the clipping caused by upstream's 120×90 and 200×130 cells. Scale is constant across all frames of an archetype; crouching/falling is never stretched to standing height.

GPL source for the browser translation is provided in this repository and its immutable release module. The original license remains in `vendor/mostafa/LICENSE`.
