# João Machado — Aluno da turma 301

Referências: segunda fotografia enviada para identidade (rosto redondo, cabelo ondulado preto, óculos retangulares grandes, bigode/cavanhaque leves); primeira fotografia somente para roupa (camisa branca com punhos dobrados, camiseta escura, jeans largo, tênis cinza, boné preto para trás). Aparência humana, postura baixa e luta selvagem inspirada no Blanka.

Revisão 3.6.0: rosto refeito a partir da foto original IMG-20261005-WA0022.jpg, preservando bochechas, nariz, cabelo ondulado, armação metálica e barba leve; camisa exterior branca em todas as poses.

Arte criada com ImageGen integrado, transparência preservada. Arquivos finais: assets/joao-base-v1.webp, assets/joao-combat-v1.webp. 16 quadros por atlas, poses completas orientadas à direita. src/wild-data.js contém escalas, eixos e silhuetas físicas calculadas dos mesmos recortes usados no desenho. scripts/calibrate-joao.mjs calibra os originais; scripts/build-sprites.mjs joao prepara atlas, metadados e prévia leve em assets/runtime.

Prompt base: sprite sheet 4×4 transparente, mesma identidade do aluno da fotografia, roupa da primeira referência, estilo arcade pintado dos professores existentes; quatro poses de guarda baixa e passos; agachamento, guarda baixa, guarda alta, salto encolhido; duas reações, queda deitada, recuperação; vitória com cabeça completa, preparação de Super Soco, soco baixo, postura de energia. Nenhuma pose pode cortar cabeça, cabelo, boné ou pés; sem letras, armas, fundo ou adversário.

Prompt combate: preservar personagem e roupa do atlas base; sprite sheet 4×4 transparente; quatro fases de Super Soco (preparação, antecipação, soco direito totalmente estendido, recuperação); quatro fases de rasteira baixa; quatro fases de rolamento (carga, bola encolhida, giro em bola, aterrissagem); quatro fases de descarga (concentração, abertura dos braços, mãos abertas para os lados, recuperação). Corpo completo por célula, óculos e boné presentes, separação transparente; efeitos elétricos desenhados pelo código, não embutidos na imagem.

Voz original de personagem, sem clonagem da voz real: timbre masculino jovem, interpretação animada, português brasileiro, marcações de energia de combate, velocidade 1.05. Frases: “Segura esse super soco!”, “Sai da frente!”, “A trezentos e um chegou! Agora segura essa descarga!”. Preset Chad / eleven_v3. WAV mono 24 kHz PCM 16-bit, silêncio inicial removido, volume normalizado, sem alteração de pitch ou esticamento artificial. Falas dos professores preservadas.

Super Soco é um ataque corpo a corpo com avanço curto, Rolamento Selvagem é uma investida aérea em bola, Curto-Circuito 301 é uma descarga local de barra cheia. Sem projéteis ou drones. Podem errar com distância; soco e descarga permitem defesa. Rolamento mantém recuperação após aterrissar. H/U/Q e comandos equivalentes do controle/toque.
