# Auditoria dos lutadores adicionados depois da Prof. Tais

Versão 4.6.18 · 9 de outubro de 2026

Escopo: Prof. Luciana, Khauãny e Dienes, no Versus e no Modo História. A Prof. Tais foi usada como referência de movimento e de funcionamento dos poderes.

| Personagem | Erro encontrado | Correção |
| --- | --- | --- |
| Prof. Luciana | A malha que anima a ginga usava dimensões antigas (220 × 305, eixo 110), enquanto o sprite publicado mede 200 × 328, eixo 100. Isso desalinhava pernas, apoios e caixas de contato durante a caminhada. | A malha agora usa as dimensões e o eixo do quadro realmente carregado. |
| Prof. Luciana | A animação de levantar escolhia o quadro 13, de reação com o corpo caindo para trás. | Usa o quadro 14, de recuperação sobre o joelho. |
| Khauãny | A rasteira no chão usava o quadro 3, de chute horizontal no ar. A perna traseira fica recolhida atrás do corpo nesse desenho e parece desaparecer; o alcance físico também se estendia além da nova postura. | A rasteira usa os quadros 15 → 14, ambos com pernas visíveis no chão. O quadro 3 passou para o chute aéreo. O alcance da rasteira foi ajustado de 224 para 166 unidades, acompanhando a perna avançada. |
| Khauãny | A reação de dano inclinada deixava o topo da área vulnerável 6 pixels abaixo do chute final alto no combo do Gustavo. Os dois primeiros golpes acertavam e o terceiro passava logo acima, nos dois lados. | Uma margem de 12 pixels na faixa superior apenas durante essa reação mantém o combo conectado sem alterar alcance dos ataques da Khauãny. |
| Dienes | Ao levantar, o jogo selecionava o quadro 15 de nocaute no chão. A preparação do salto e a aterrissagem também usavam quadros sem apoio coerente. O arremesso usava um quadro de salto. | Levantar, aterrissar e preparar salto usam a postura baixa de pé; o arremesso usa a pose de clinch. O quadro de nocaute fica reservado à derrota. |
| Luciana, Khauãny e Dienes | A física atualizava uma malha corporal articulada, mas o desenho da luta ignorava essa malha e alternava só dois quadros de caminhada. A perna pintada não acompanhava necessariamente o pé plantado nem a área de colisão, produzindo deslizamento e saltos visuais na ginga. | O renderizador agora prepara e desenha a mesma malha articular usada para pés e caixas vulneráveis durante postura, caminhada e passos, no Versus e na História. Os quadros completos continuam para golpes, reações e poderes. |

## Verificações

- Para as três personagens, conferimos o atlas de 32 poses e a correspondência entre o quadro inicial e a malha da ginga.
- A caminhada para frente e para trás foi simulada nos dois lados: pés plantados, alternância de passadas e extensão das pernas dentro de 8% do comprimento de referência.
- Socos, chutes, golpes baixos, ataques aéreos, especial, uppercut e super foram executados pelos jogadores 1 e 2. Todos causaram contato e retornaram ao chão e ao estado livre; os poderes emitiram as falas/eventos e as quantidades previstas de projéteis.
- A sequência completa do Gustavo contra a Khauãny foi repetida nos dois lados; a suíte de combinações entre todos os lutadores também passou.
- No Modo História, especiais e supers das três personagens lançaram projéteis, atingiram inimigos e retomaram a ginga.
- Os testes específicos estão em `tests/post-tais-combat.test.js`, `tests/luciana.test.js`, `tests/khauany.test.js` e `tests/dienes.test.js`.

A suíte completa também contém testes antigos que não passam neste checkout porque muitos áudios e atlas de outros lutadores não estão presentes localmente, embora constem na árvore da publicação. Há ainda expectativas antigas de combos e poses em alguns testes. Essas falhas foram mantidas fora do escopo desta correção; os testes específicos acima e o build passaram.
