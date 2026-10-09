# Auditoria dos lutadores adicionados depois da Prof. Tais

Versão 4.6.19 · 9 de outubro de 2026

Escopo: Prof. Luciana, Khauãny e Dienes, no Versus e no Modo História. A Prof. Tais foi usada como referência de movimento e de funcionamento dos poderes.

| Personagem | Erro encontrado | Correção |
| --- | --- | --- |
| Prof. Luciana | A malha que anima a ginga usava dimensões antigas (220 × 305, eixo 110), enquanto o sprite publicado mede 200 × 328, eixo 100. Isso desalinhava pernas, apoios e caixas de contato durante a caminhada. | A malha agora usa as dimensões e o eixo do quadro realmente carregado. |
| Prof. Luciana | A animação de levantar escolhia o quadro 13, de reação com o corpo caindo para trás. | Usa o quadro 14, de recuperação sobre o joelho. |
| Khauãny | A rasteira no chão usava o quadro 3, de chute horizontal no ar. A perna traseira fica recolhida atrás do corpo nesse desenho e parece desaparecer; o alcance físico também se estendia além da nova postura. | A rasteira usa os quadros 15 → 14, ambos com pernas visíveis no chão. O quadro 3 passou para o chute aéreo. O alcance da rasteira foi ajustado de 224 para 166 unidades, acompanhando a perna avançada. |
| Khauãny | A reação de dano inclinada deixava o topo da área vulnerável 6 pixels abaixo do chute final alto no combo do Gustavo. Os dois primeiros golpes acertavam e o terceiro passava logo acima, nos dois lados. | Uma margem de 12 pixels na faixa superior apenas durante essa reação mantém o combo conectado sem alterar alcance dos ataques da Khauãny. |
| Dienes | Ao levantar, o jogo selecionava o quadro 15 de nocaute no chão. A preparação do salto e a aterrissagem também usavam quadros sem apoio coerente. O arremesso usava um quadro de salto. | Levantar, aterrissar e preparar salto usam a postura baixa de pé; o arremesso usa a pose de clinch. O quadro de nocaute fica reservado à derrota. |
| Luciana, Khauãny e Dienes | A primeira tentativa de ligar a malha articulada ao desenho na versão 4.6.18 continuou deformando principalmente o trecho abaixo do joelho. O erro foi visto pelo usuário após a publicação. Os sprites base continham só dois quadros de caminhada, enquanto Prof. Tais e os lutadores antigos usam ciclos completos. | Retirado o desenho por deformação. Cada personagem agora possui oito poses completas de caminhada em atlas dedicado, com tronco, quadril, braços e pernas desenhados em conjunto. Os passos usam a distância percorrida e a escala uniforme de 300 unidades, coerente com as poses base. A física articulada permanece responsável pelas caixas de contato. |

## Verificações

- Para as três personagens, conferimos o atlas de 32 poses e criamos oito quadros completos adicionais de caminhada. Os originais estão em `assets/source/*-walk-v2.png`; os atlases usados no jogo, em `assets/story/*-walk-v2.webp`.
- A caminhada para frente e para trás foi simulada nos dois lados: pés plantados, alternância de passadas e extensão das pernas dentro de 8% do comprimento de referência. A verificação visual do novo atlas no navegador é necessária além desses testes numéricos.
- Socos, chutes, golpes baixos, ataques aéreos, especial, uppercut e super foram executados pelos jogadores 1 e 2. Todos causaram contato e retornaram ao chão e ao estado livre; os poderes emitiram as falas/eventos e as quantidades previstas de projéteis.
- A sequência completa do Gustavo contra a Khauãny foi repetida nos dois lados; a suíte de combinações entre todos os lutadores também passou.
- No Modo História, especiais e supers das três personagens lançaram projéteis, atingiram inimigos e retomaram a ginga.
- Os testes específicos estão em `tests/post-tais-combat.test.js`, `tests/luciana.test.js`, `tests/khauany.test.js` e `tests/dienes.test.js`.

A suíte completa também contém testes antigos que não passam neste checkout porque muitos áudios e atlas de outros lutadores não estão presentes localmente, embora constem na árvore da publicação. Há ainda expectativas antigas de combos e poses em alguns testes. Essas falhas foram mantidas fora do escopo desta correção; os testes específicos acima e o build passaram.
