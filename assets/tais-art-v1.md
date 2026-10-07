# Prof. Tais — arte 4.5.0

Criada com a ferramenta integrada `image_gen` usando a foto fornecida como referência de identidade. Prompts completos: `assets/tais-prompts-v1.json`.

Arquivos de origem: `assets/tais-base-v1.webp`, `assets/tais-combat-v1.webp`, `assets/tais-identity-head-v1.webp`.

Sprites de jogo: `assets/runtime/tais-v1.webp` e metadados `assets/runtime/tais-v1.json`. O desenho da cabeça com cabelo liso é aplicado uma única vez aos 32 quadros por `src/savate-face.js`, usando `assets/runtime/tais-head-anchors-v1.json`. Não se recompõe a cabeça durante cada quadro da partida.

Seleção: `assets/runtime/tais-preview-v1.webp` usa a mesma composição do jogo; `assets/runtime/tais-head-menu-v3.webp` e o retrato na barra de vida usam um recorte da foto fornecida.

Passada: `assets/story/tais-walk-v3.webp`, metadados `assets/story/tais-walk-v3.json` e `assets/story/tais-walk-head-anchors-v1.json`. Disponível no 1×1 e no História. Cenários, inimigos e mecânica do História não foram modificados por esta inclusão.

Preparação: `scripts/build-tais.py`, `scripts/prepare-tais-walk.py`, `scripts/prepare-tais-preview.mjs`. Cabeça e metadados são separados para substituir o rosto sem gerar novamente os corpos e os golpes.
