# Street Vicente rendering and controls review

References inspected on 2026-10-07:

- https://github.com/shahfarhadreza/mostafa-the-game — C beat-em-up, approach/orbit/committed strike and dead-zone camera logic. Mechanics provenance remains in `src/mostafa-port.js`; its characters are not loaded by the current renderer.
- https://github.com/odradek12/beatemup — Phaser beat-em-up scene organization reference. No assets or source were imported from this repository.
- https://docs.phaser.io/phaser/concepts/cameras — world/viewport distinction, bounded cameras, follow smoothing and independent effects.

Implementation keeps the existing deterministic 120 Hz engine and rollback integration. Camera easing, entity interpolation and shake belong only to the renderer. It does not migrate to Phaser or claim that changing engines alone produces a finished professional game.

4.4 adds school enemy atlases for the laboratory android, cyber guard, Kung Fu prototype and Inspector; other school enemy art and all eight Vicente fighters retain their existing identities. Small machines and industrial bosses have different consistent world heights. Attack sprites use the same anticipation/contact/recovery states as the hitbox simulation. Fall poses retain the atlas scale instead of expanding to standing height.

The shell includes experience navigation, audio, pause and fullscreen. Enter on an interactive control performs only that control's action. Keyboard, local pads and online selection remain supported. Touch controls remain limited to coarse pointers.

Further authored animation work is still needed for the remaining mechanical enemies and bosses; this release is a concrete improvement, not a claim of finished commercial quality.
