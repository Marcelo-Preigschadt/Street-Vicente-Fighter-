# Prof. Marcelino — Física / Muay Thai

Identidade visual baseada na fotografia enviada: cabelo curto grisalho repartido, óculos retangulares pretos, pele clara, sem barba. Traje: camiseta clara, calça comprida azul-marinho até os tornozelos com faixas laterais cobre, bandagens claras e pés descalços. Dois atlas transparentes 4×4, 32 poses próprias de corpo inteiro, produzidos com ImageGen integrado e convertidos para WebP de qualidade 92 com alfa preservado.

Prompt base: preservar os traços da fotografia; quatro guardas/passos, esquiva e bloqueios, salto, reações, queda, recuperação, vitória, impulso com palma, soco baixo e preparação de clinch. Prompt combate: quatro fases de circular, low kick, joelhada e cotovelada; roupa e rosto consistentes, nenhuma parte do corpo cortada, margens transparentes, sem efeitos ou textos incorporados. Arquivos: `assets/marcelino-base-v2.webp` e `assets/marcelino-combat-v2.webp`.

Escalas, apoios e três faixas de colisão por pose estão em `src/muay-thai-data.js`; seleção da mesma pose para desenho e colisão em `src/muay-thai.js`. Margem de extração de 96 px preserva cabeça, braços e pés além das linhas nominais do atlas. Efeitos vetoriais e ondas de choque são desenhados em Canvas por `src/physics-fx.js`.

Impulso Linear: onda vetorial horizontal com recuo forte. Joelhada Cinética: antiaéreo ascendente, derrubada e lançamento. Lei da Ação e Reação: 100% de barra, cinco ondas e sequência de poses de cotovelo, joelho e circular. Normais incluem cotoveladas, low kicks e joelhada aérea; clinch usa o comando de agarrar existente. Apenas low kick forte derruba. Combos: Torque e Impulso, Quebra de Inércia, Oito Armas.

Atualização 2.10.1: edição com ImageGen integrado dos dois atlas existentes. Prompt de edição: trocar apenas shorts e pernas expostas por calça comprida azul-marinho até os tornozelos com faixa lateral cobre; preservar as 32 poses, rosto, cabelo, óculos, camiseta, bandagens e pés descalços, ordem 4×4 e transparência. Recalibração de escala e silhueta a partir do alfa dos atlas atualizados.
