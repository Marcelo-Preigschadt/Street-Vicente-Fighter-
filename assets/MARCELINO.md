# Prof. Marcelino — Física / Muay Thai

Identidade visual baseada na fotografia enviada: cabelo curto grisalho repartido, óculos retangulares pretos, pele clara, sem barba. Traje: camiseta clara, shorts de Muay Thai azul-marinho com detalhes cobre, bandagens claras e pés descalços. Dois atlas transparentes 4×4, 32 poses próprias de corpo inteiro, produzidos com ImageGen integrado e convertidos para WebP de qualidade 92 com alfa preservado.

Prompt base: preservar os traços da fotografia; quatro guardas/passos, esquiva e bloqueios, salto, reações, queda, recuperação, vitória, impulso com palma, soco baixo e preparação de clinch. Prompt combate: quatro fases de circular, low kick, joelhada e cotovelada; roupa e rosto consistentes, nenhuma parte do corpo cortada, margens transparentes, sem efeitos ou textos incorporados. Arquivos: `assets/marcelino-base-v1.webp` e `assets/marcelino-combat-v1.webp`.

Escalas, apoios e três faixas de colisão por pose estão em `src/muay-thai-data.js`; seleção da mesma pose para desenho e colisão em `src/muay-thai.js`. Margem de extração de 96 px preserva cabeça, braços e pés além das linhas nominais do atlas. Efeitos vetoriais e ondas de choque são desenhados em Canvas por `src/physics-fx.js`.

Impulso Linear: onda vetorial horizontal com recuo forte. Joelhada Cinética: antiaéreo ascendente, derrubada e lançamento. Lei da Ação e Reação: 100% de barra, cinco ondas e sequência de poses de cotovelo, joelho e circular. Normais incluem cotoveladas, low kicks e joelhada aérea; clinch usa o comando de agarrar existente. Apenas low kick forte derruba. Combos: Torque e Impulso, Quebra de Inércia, Oito Armas.
