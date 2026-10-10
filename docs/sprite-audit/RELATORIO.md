# Street Vicente Fighter — auditoria de sprites e animações 4.7.0

Data: 10 de outubro de 2026. Branch: `fix/roster-animation-audit-20261009`.

Base preservada: `82f3bd7c59654bf7a4fa955616c902442f30cf0d` (4.6.20).

## Estado da entrega

As correções estão nos arquivos reais dos 12 lutadores e dos 16 modelos de inimigo. A suíte passou com **434 testes**, o build gerou **77 arquivos da versão 4.7.0**, e os validadores executaram o Renderer e as engines usados pelo jogo. A versão corrigida **ainda não foi publicada no GitHub Pages**: a inspeção no Chrome exigida pelo prompt está bloqueada pelo login da cópia privada de revisão. O serviço não é considerado integralmente concluído enquanto essa etapa estiver pendente.

A [galeria](index.html) contém os atlas, comparações, contatos, referências faciais e juntas. A [tela de revisão](../../tests/visual-review.html) executa as engines reais e permite selecionar lutador, modo, movimento, lado e inimigo. Os resultados de integração em Node Canvas não são apresentados como resultados obtidos em Chrome.

## Diagnóstico por lutador

O defeito comum confirmado foi a diferença entre a simulação dos pés e a imagem desenhada. A engine já possuía uma máquina de locomoção, mas o renderer desenhava bitmaps sem aplicar os contatos dessa máquina. Isso permitia que testes das juntas passassem enquanto a imagem ainda deslizava. Não foram inventados defeitos de membros ausentes em personagens nos quais esse problema não foi observado.

| Lutador e modalidade preservada | Defeito confirmado e correção | Recursos utilizados e modificados | Quadros atuais |
|---|---|---|---:|
| Marcelo — Kung Fu | Contato físico não aplicado à imagem. Oito passadas completas, transferência de peso e correção de solas integradas. | Caminhada original em `runtime/marcelo-v1`; novo `story/marcelo-walk-v5`. Os outros seis atlas e os poderes permanecem. | 104 |
| Rafael — Boxe | Mesmo descompasso; a integração revelou puxões do corpo durante o balanço rápido do pé. Centro corporal com velocidade limitada e plantio antecipado pelo intervalo de apoio. | `rafael-walk-v5`; guarda, esquivas, socos e sequências autorais existentes. | 104 |
| Gustavo — Kickboxing | Contatos não representados visualmente. Passadas completas e pivôs de apoio compartilhados pelos dois modos. | `gustavo-walk-v5`; demais atlas originais conservados. | 104 |
| Gelton — Capoeira | Sequência de oito passadas disponível na campanha, mas sem integração equivalente no 1 × 1. Ginga e acrobacias mantidas. | Fonte de `gelton-walk-v3`, preparada em `gelton-walk-v5`; base e combate preservados. | 40 |
| Marcelino — Muay Thai | Caminhada nativa também disponível, mas não integrada de maneira uniforme aos dois modos e contatos. | `marcelino-walk-v3` → `marcelino-walk-v5`; joelhadas, cotoveladas e poderes preservados. | 40 |
| Marcos — Judô | Caminhada nativa e apoios inconsistentes entre os modos. | `marcos-walk-v3` → `marcos-walk-v5`; pegadas, projeções e golpes existentes. | 40 |
| João — Luta Selvagem | Passadas nativas sem uso uniforme; o vínculo antigo de guarda não representava as solas da arte. | `joao-walk-v3` → `joao-walk-v5`; acrobacias e Rolamento Selvagem mantidos. | 40 |
| Ruan — Karatê | Passadas nativas sem uso equivalente nos modos. | `ruan-walk-v3` → `ruan-walk-v5`; kata, chutes e poderes mantidos. | 40 |
| Tais — Savate | O recuo era limitado por distância negativa em um seletor antigo. Escala e contato não correspondiam ao quadro nativo efetivamente desenhado. | `tais-walk-v4` → `tais-walk-v5`; seleção com fase assinada, cabelo e retrato aprovados preservados. | 40 |
| Luciana — MMA / Trocação | `base[8]` continha braço de soco estendido durante a preparação do chute. A ponta do tênis de um quadro vizinho encostava no calcanhar em `motion[4]`. | Preparação e recuperação passam a `combat[2]`, com mãos em guarda; contato mantém o chute autoral `base[9]`. Propriedade espacial explícita antes dos componentes remove o tênis vizinho; `luciana-walk-v5`. | 40 |
| Khauãny — MMA / Contra-ataque | `combat[14]` não mostrava uma varredura completa e coerente; `combat[3]` representava um chute baixo apoiado, inadequado ao ataque aéreo. | Oito pinturas novas: quatro fases de rasteira e quatro de chute aéreo. Alias ativos `combat[14]` e `combat[3]` preservados e reconstruídos. `khauany-v2` e `khauany-walk-v5`. | 48 |
| Dienes — Muay Thai / Guarda Curta | Resíduos de quadros vizinhos na caminhada; joelhada ofensiva em `base[11]` como reação ao dano; livros na pose usada como vitória. | Recorte de propriedade espacial; quatro reações a dano, duas vitórias e duas fases de levantar. Alias `base[11]` e `base[14]` reconstruídos. `dienes-v3` e `dienes-walk-v5`. | 48 |

O inventário anterior tinha 632 quadros carregados; o atual tem 688. O aumento corresponde à integração de cinco sequências de oito passadas antes ausentes do carregamento comum e aos 16 novos desenhos de Khauãny/Dienes. Os 96 quadros de caminhada foram preparados com escala uniforme por clipe. Os números incluem aliases utilizados no jogo e não significam 688 pinturas novas.

## Arte-fonte, anatomia e identidade

As imagens, atlas e referências anteriores foram mantidos. Novas fontes:

- `assets/source/khauany-repairs-v1.png`: rasteira com preparação baixa, apoio da mão, perna que varre e perna dobrada, seguida de recuperação; chute aéreo com recolhimento e extensão, mantendo a outra perna visível.
- `assets/source/dienes-repairs-v1.png`: reações defensivas de dano, comemoração com braços levantados e levantamento ajoelhado/erguido.
- Nove arquivos `assets/source/*-animation-v7.png`: animações dos modelos da campanha que possuíam somente uma imagem estática no carregamento anterior.

As novas pinturas foram produzidas a partir da própria arte aprovada do repositório, preservando roupas, cabelos, paleta e direção artística. Não foram utilizadas referências de personagens ou golpes de jogos comerciais. Os prompts dos nove inimigos estão em `assets/source/enemy-animation-v7-prompts.json`.

As pranchas dos atlas foram inspecionadas visualmente, incluindo as duas pernas dos oito novos quadros de Khauãny, os braços em guarda da preparação do chute de Luciana e as novas reações de Dienes. Foram revistas as passadas completas dos 12 lutadores, as sequências dos 16 inimigos e os contatos marcados nas imagens produzidas pelo renderer. Membros parcialmente ocultos pela perspectiva foram distinguidos de perda por recorte.

**Referência facial:** o retrato aprovado de cada personagem e suas posturas/atlas anteriores. As fotografias originais não estão disponíveis no repositório. Os 12 retratos foram mantidos; a comparação de pixels do retrato e as pranchas `*-identity` estão incluídas. Na caminhada, cabeça e pescoço são desenhados juntos por translação: o teste encontrou zero diferenças de pixels no trecho facial comparado, sem alongamento, rotação ou cisalhamento.

**Limite dessa confirmação:** os rostos dos novos desenhos de Khauãny e Dienes foram orientados pelas referências existentes e inspecionados visualmente; eles não são cópias pixel a pixel das cabeças antigas. A comparação com fotografias ausentes não foi realizada. A revisão de semelhança facial em tamanho real e em movimento no Chrome permanece pendente. Não se afirma fidelidade fotográfica integral com base apenas na igualdade dos retratos. A comparação dos retratos em resolução nativa verifica RGBA visível e dimensões; normaliza RGB sob alfa zero, que pode mudar na codificação WebP sem alterar a imagem. O detalhe está em `metrics/portrait-identity.json`.

## Pipeline e renderização

1. `prepare-roster-animation.py` recompila os 12 clipes de caminhada, preserva o pivô, aplica escala uniforme por clipe, mantém três pixels transparentes de margem e grava atlas/metadados de forma atômica. Os novos runtimes de Khauãny e Dienes preservam retratos e quadros não substituídos.
2. `sprite-ownership.js` substitui a escolha exclusiva do maior componente por propriedade espacial, com suporte a componentes separados válidos. Regressões verificam sapato/cabelo separado e rejeição de uma pose vizinha. O preparo das fontes geradas também exclui os outros personagens da prancha. Na Luciana, `walk[4]` exige um limite de propriedade antes da análise: o tênis vizinho está conectado ao calcanhar e não pode ser rejeitado apenas por conectividade. O limite fica registrado no quadro.
3. `painted-motion-data.js` registra 17 pontos por pose; os centros de sola são medidos na transparência. Os outros pontos são estimativas e não um certificado anatômico. `painted-hurt-data.js` registra bandas medidas nos novos desenhos.
4. `painted-motion.js` seleciona um desenho completo compatível com a fase real e os apoios, resolve as pernas usando os comprimentos desse desenho e aplica uma correção contínua de contato. Tronco, quadril, braços e ombros mudam com a pintura nativa completa.
5. `locomotion-render.js` mantém o trecho facial em uma única textura, adapta a malha aos centros de sola e verifica inversões. A regularização atua em vértices transparentes. Se a malha for insegura, o renderer usa o quadro nativo inteiro; essa alternativa também é coberta pelos testes de contato, para não ocultar uma falha atrás do fallback.
6. `locomotion.js` calibra os apoios pela arte, mantém contatos no mundo, usa a distância efetivamente percorrida, permite a passada para trás, evita a convergência das duas botas no movimento em profundidade e limita a velocidade do centro corporal. Reutiliza `motion.bodyShift`, já serializado/interpolado, sem criar estado paralelo fora do rollback.
7. A escolha de pose e as colisões usam a mesma geometria. As hurtboxes de coxa e canela são separadas: uma caixa única em torno de uma perna dobrada incluía uma região vazia e fazia o primeiro laser do enxame de Marcelo errar a ginga de Gelton. A regressão existente de seis disparos voltou a passar, sem alterar os parâmetros do poder.

Os atlas novos apresentam clipes identificados, escala, pivô, margem, quadros e referências de contato. Isso mantém os dados reutilizáveis em uma futura integração com TypeScript/Phaser. A engine não foi migrada.

## Os 16 tipos de inimigo

O diagnóstico não classificou os 16 como estáticos: quatro já tinham 16 desenhos nativos e três já possuíam mecanismos articulados. Foram criadas sequências de 16 desenhos para os nove restantes. O carregamento atual contém **208 quadros nativos em 13 modelos**, mais os três mecanismos existentes.

| Modelo | Situação anterior | Implementação atual |
|---|---|---|
| Drone de lanches (`snack`) | Mecanismo modular existente | Rotores preservados; estados reais de voo, ataque, dano e derrota revistos. |
| Catraca de serras (`turnstile`) | Rodas e serra existentes | Ângulo das rodas segue a distância e o sentido do deslocamento; serra mantém rotação própria. |
| Robô de limpeza (`cleaner`) | Rodas e escovas existentes | Rodas sincronizadas ao deslocamento; escovas preservadas. |
| Androide de laboratório (`lab`) | 16 quadros v4 | Quadros preservados, apoios e seleção integrados à IA. |
| Proveta explosiva (`vial`) | Imagem estática | 16 quadros próprios de deslocamento, preparação, ataque, reação e derrota. |
| Scanner laser (`scanner`) | Imagem estática | 16 quadros do mecanismo quadrúpede, sem rig humano. |
| Livro virtual (`book`) | Imagem estática | Voo e movimento de páginas, preparação/ataque, dano e derrota; ciclo continua quando paira. |
| Drone arqueólogo (`archaeologist`) | Imagem estática | 16 quadros próprios de voo e mecanismo, sem pernas humanas artificiais. |
| Guarda cibernético (`elite`) | 16 quadros v4 | Arte preservada e seleção ligada aos estados reais. |
| Protótipo de Kung Fu (`kungfu`) | 16 quadros v4 | Arte e linguagem corporal preservadas, com contatos e estados sincronizados. |
| Inspetor-Geral (`inspector`) | 16 quadros v4 | Arte preservada; preparação, ataque, recuperação, dano e derrota ligados à IA. |
| Robô da Feira de Ciências (`fairRobot`) | Imagem estática | 16 quadros do chefe bípede, com passadas e fases de ataque. |
| Professor Substituto (`substitute`) | Imagem estática | 16 quadros completos de aproximação, combate, reação e queda. |
| A.U.L.A. Holograma (`aula`) | Imagem estática | 16 quadros de projeção holográfica; não recebe apoio físico humano artificial. |
| A.U.L.A. Exoesqueleto (`exo`) | Imagem estática | 16 quadros completos do chefe mecânico bípede. |
| Projetor corrompido (`projector`) | Imagem estática | 16 quadros próprios dos apoios, lente e ataque. |

`prepare-enemy-animation.py` preserva fontes, compila os nove atlas novos com margem transparente e reúne os quatro anteriores em `enemy-animation-v7.json`. A seleção visual usa `telegraph`, `attackLife`, `recovery`, dano, derrota e a fase da passada. As cargas dos chefes também utilizam o ciclo durante o deslocamento. A lógica de decisão, dano, alcance e cronologia da IA em `story-data.js` permanece preservada.

## Evidências e testes

| Verificação executada | Resultado | Evidência |
|---|---|---|
| Suíte original na base | 425 testes: 420 passaram e cinco falharam antes das alterações | `metrics/baseline-tests.log` |
| `npm test` na correção | 434/434 passaram | `metrics/final-tests.log` |
| `npm run build` | 4.7.0, 77 arquivos publicados juntos no diretório de release | `releases/v4.7.0` e manifesto do build |
| Integridade de imagens | Atlas preparados abrem corretamente; nenhum quadro vazio ou escala inválida no inventário dos 688 quadros | `after/inventory.json` |
| Pixels, pés e rosto | 3.840 amostras nos 12 lutadores, dois modos, dois lados e avanço/recuo/profundidade/corrida/parada | `metrics/painted-render.json` |
| Contato renderizado | Distância máxima até pixel opaco da sola: **1,969 px**, limite 6 px | Mesmo JSON |
| Recorte conectado da Luciana | Zero pixels do tênis vizinho na faixa excluída; 1.571 pixels do calcanhar mantidos; contatos retestados em 320 amostras | `metrics/luciana-recheck.json` |
| Pé plantado | Deslocamento durante apoio contínuo: **0** nas amostras | Mesmo JSON |
| Comprimento das pernas | Razão máxima em relação à própria pose-fonte: **1,0000** | Mesmo JSON |
| Cabeças durante locomoção | Zero diferenças de pixels na área facial comparada; retratos dos 12 preservados | Mesmo JSON e `*-identity` |
| Topologia da malha | Área assinada mínima positiva: **0,036** da área original nas amostras | Mesmo JSON |
| Combate real em Node Canvas | **1.056 casos e 5.792 desenhos renderizados**, zero falhas da matriz | `metrics/combat-render.json` |
| Aproximação dos 16 inimigos | Todos se deslocaram e selecionaram pelo menos duas poses durante a aproximação real; os cenários começam dentro dos 650 px de ativação da IA | `metrics/enemy-approach.json` |
| Cenas da campanha e objetos | Oito cenas de atos/chefes, um contato e 36 vistas de cadeira/pega/lado renderizados | `metrics/story-render.log`, pranchas da campanha |
| Chrome da versão corrigida | **Pendente**: login da prévia privada não concluído | Não há resultado de browser fabricado |

A matriz usa 22 ações para cada lutador, nos dois lados e nos dois modos: idle, avanço, recuo, profundidade, corrida, agachamento, salto, soco, chute, soco baixo, rasteira, soco/chute aéreo, defesa, dano, atordoamento, queda/levantamento, especial, uppercut, super, vitória e derrota. Registra estados, poses, fases ativas, recuperação e acertos por caso. O ataque aéreo que termina na aterrissagem registra a recuperação existente na engine. Os 16 inimigos são executados em quatro fases reais da IA.

Profundidade e corrida são recursos da campanha; os casos com esses rótulos no 1 × 1 não criam esses recursos no modo versus. As pranchas `*-states` amostram 27 estados sintéticos e ambos os lados; elas auxiliam a leitura dos quadros, mas não certificam transições. As pranchas de locomoção, as sequências de inimigos e a matriz executam a simulação real.

Os cenários gráficos também foram corrigidos para testar situações válidas: a aproximação começa dentro do raio de ativação da IA; depois de reposicionar manualmente atores, os contatos são recalibrados antes do desenho, como ocorre no spawn real. Sem essa recalibração, uma prancha de campanha inicialmente mostrava corpos distorcidos pelo desacordo entre raiz e pés antigos. Essas imagens foram descartadas e substituídas; não se atribuiu essa distorção artificial à execução normal do jogo.

As cinco falhas da base eram expectativas desatualizadas de atlas/catálogo/menu e a suposição de que todos os personagens tinham combo de quatro passos. Foram atualizadas às estruturas efetivamente existentes. Os testes de comprimento de pernas que comparavam uma guarda fixa antiga passaram a verificar a geometria da pintura realmente selecionada; o teste independente de pixels/contatos foi acrescentado para evitar confiança apenas nas juntas. Os testes de poderes, combos, rollback, controles e cooperativo continuam sendo executados na suíte completa.

## Preservação dos sistemas existentes

Não houve alterações nos módulos de controles, rede, integração Supabase, definições de modalidade, catálogo de poderes ou decisões de IA. A alteração de `engine.js` seleciona a pose e sincroniza hurtboxes com a arte. A versão anterior e seus releases permanecem no repositório. A versão 4.7.0 está separada e o HTML só aponta para ela na branch de revisão.

Não foram realizados testes com joystick USB físico nem uma partida online entre duas pessoas. Os testes automatizados de entrada, cooperação, relay e rollback passaram; isso não substitui esses testes de hardware/rede.

## Pendências e publicação

1. Inspecionar a versão corrigida no Chrome, incluindo o seletor de personagens e o jogo principal, além da tela de revisão de todos os movimentos e lados.
2. Confirmar a semelhança facial das novas poses de Khauãny/Dienes em movimento, usando as fotografias quando forem disponibilizadas ou as referências aprovadas já presentes.
3. Verificar hardware USB e uma sessão online real se esses equipamentos/participantes estiverem disponíveis.
4. Após a validação visual exigida, integrar a branch e verificar a versão 4.7.0 efetivamente publicada no GitHub Pages.

A prévia local gerenciada falhou por restrição de isolamento (`bwrap`); a tentativa de iniciar um servidor fora do isolamento foi rejeitada automaticamente pela política `sandbox_approval: false`. Foi preparada uma cópia privada de revisão, preservando seu acesso restrito. O acesso no Chrome continua na página “Entre para acessar”. A solicitação segura de autenticação expirou sem confirmar login. Não foi contornado o controle de acesso.

Links da entrega: [commit de implementação](https://github.com/Marcelo-Preigschadt/Street-Vicente-Fighter-/commit/c8fec1500c70b2ce4f75790fa0d62e848c44e84e) e [proposta em rascunho #2](https://github.com/Marcelo-Preigschadt/Street-Vicente-Fighter-/pull/2). Os 479 arquivos da alteração foram enviados pela conexão GitHub; cada blob e a árvore final foram comparados aos hashes do checkout testado. A cópia privada para a inspeção está em https://vicente-animation-review-20261010.breezyskink5.chatgpt.site. O [GitHub Pages atual](https://marcelo-preigschadt.github.io/Street-Vicente-Fighter-/) continua na versão anterior; esse link não é apresentado como uma publicação verificada da correção.

## Reprodução

```bash
python3 scripts/prepare-roster-animation.py
python3 scripts/prepare-enemy-animation.py
npm test
npm run build
node scripts/check-painted-render.mjs /tmp/svf-painted
node scripts/check-combat-render.mjs /tmp/svf-combat
node --expose-gc scripts/audit-sprites.mjs /tmp/svf-audit
node scripts/check-story-render.mjs
```

Os scripts Python usam Pillow, NumPy e SciPy; os validadores gráficos usam `@napi-rs/canvas`, disponível no runtime desta execução. `CODEX_PRIMARY_RUNTIME_NODE_MODULES` permite localizar esse módulo no ambiente de trabalho. Em outro ambiente, ele deve estar instalado. A página `tests/visual-review.html` pode ser aberta por um servidor HTTP comum do projeto para concluir a inspeção no navegador.

