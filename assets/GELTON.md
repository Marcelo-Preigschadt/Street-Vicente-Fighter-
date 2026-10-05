# Prof. Gelton — Capoeira / Artes

A referência de identidade é a fotografia enviada pelo usuário. Direção visual: cabelo preto cacheado, bigode e barba curta, argolas, colar de contas, camiseta vinho, calça branca de capoeira, cordão vinho/dourado e pés descalços. Pintura arcade de corpo inteiro, vista lateral em três quartos para a direita, compatível com o elenco existente.

Os dois atlas foram criados com ImageGen integrado. Prompt de produção: atlas transparente 4×4, 16 poses completas separadas, escala anatômica consistente, sem texto, sem linhas de grade, sem efeitos incorporados, respeitando a identidade da foto. Base: quatro poses de ginga, esquiva, bloqueios, salto, reação, queda, recuperação, vitória, lançamento de poder, negativa e preparação do aú. Combate: quatro fases de meia-lua/armada, quatro fases de rasteira/compasso, quatro fases de aú invertido e quatro fases de palma/poder.

Arquivos: `assets/gelton-base-v1.webp`, `assets/gelton-combat-v1.webp`. WebP com qualidade 92 e canal alfa preservado. `src/gelton-layout.js` contém a escala e o apoio corporal de cada pose; `src/gelton-hurt.js` contém as três faixas de colisão extraídas de cada silhueta.

Poderes: Pincelada Cromática (projétil de tinta); Aú das Cores (golpe ascendente invertido); Roda das Artes (cinco ondas de cor com barra cheia).

Correção 2.9.1: margem de extração dos dois atlas ampliada para 96 px, recuperando os 14 px superiores da cabeça na vitória. A pose invertida de combate 9 usa `assets/gelton-handstand-v2.webp`, editada com ImageGen integrado. Prompt: corrigir apenas a coroa sem cabelo da pose invertida, preenchendo com cachos pretos densos; preservar postura, corpo inteiro, roupa, cordão, estilo arcade e transparência. As outras poses do atlas permanecem preservadas. Escala, apoio e colisões foram recalibrados sobre os recortes completos.
