# Prof. Marcos — Judô / Informática

Arte baseada na foto enviada: rosto cheio, cabelo curto escuro, sem óculos; judogi azul, calça comprida, faixa preta, pés descalços. 32 poses próprias em dois atlas 4×4, ImageGen integrado, alfa preservado e WebP qualidade 92.

Prompt base: retrato como referência de identidade; homem adulto de porte robusto em judogi azul; guarda e quatro passos, agachamento, bloqueios, salto, duas reações, queda, recuperação, vitória com cabeça completa, mãos prontas para agarrão, pegada baixa e clinch. Prompt combate: quatro fases de pegada/desequilíbrio, de ashi barai, ippon seoi nage e projeção de quadril, sem adversário, sem efeitos embutidos, poses completas orientadas à direita, margem transparente e ordem 4×4.

Arquivos originais: assets/marcos-base-v1.webp e assets/marcos-combat-v1.webp. Poses e ataques em src/judo.js; escalas e faixas físicas em src/judo-data.js. Quadros limpos são preparados pelo mesmo analisador dos demais professores e empacotados por scripts/build-sprites.mjs. Runtime: assets/runtime/marcos-v1.webp e marcos-v1.json. Prévia leve: assets/runtime/marcos-preview-v1.webp.

Sequestro de Sessão é um agarrão com aproximação, sem projétil. Pilha Reversa é um antiaéreo com invulnerabilidade curta que mantém o judoca no chão. Kernel Panic usa a barra cheia em uma projeção de ombro, com dano único e recuperação longa. Todos têm alcance finito e contra-jogo. Efeitos de bloqueio de sessão, camadas de pilha e falha de kernel são vetoriais em src/judo-fx.js, independentes dos drones e rajadas do Marcelo.
