# Street Vicente Fighter — auditoria 4.7.0

Atualização preparada a partir do commit `82f3bd7c59654bf7a4fa955616c902442f30cf0d`. As alterações recuperadas da tentativa anterior estavam no checkout, sem um novo commit. Os testes dessa tentativa continham falhas; não foram tratados como aprovação desta entrega.

## Correções por personagem

| Personagem | Problema verificado | Correção e revisão |
|---|---|---|
| Marcelo | Deslocamento dependia da postura articulada, sem seguir toda a sequência autoral. | Oito quadros completos de Kung Fu, avanço/recuo por distância e contato mundial; golpes, retrato e voz preservados. |
| Rafael | O limite da câmera reiniciava os apoios na corrida; seleção de pose podia ficar presa. | Limite resolvido antes da locomoção; oito pinturas de boxe e estados próprios de aproximação preservados. |
| Gustavo | Seleção podia repetir um desenho enquanto as pernas eram deformadas. | Oito pinturas completas de kickboxing; golpes e reações originais continuam disponíveis. |
| Gelton | Malha da postura não representava toda a caminhada autoral. | Oito desenhos completos de capoeira; anatomia, roupas, identidade e golpes aprovados preservados. |
| Marcelino | Deformação genérica não seguia os oito desenhos completos. | Caminhada autoral de Muay Thai e hurtboxes transformadas com a pintura; ataques originais preservados. |
| Marcos | Quadros de caminhada podiam ser escolhidos fora de sequência. | Oito poses completas de Judô em ordem, com recuo invertido; agarrões e poderes preservados. |
| João | Volume das pernas ficava sujeito à deformação da malha. | Sequência completa do estilo selvagem, mantendo suas posturas, ataques e efeitos. |
| Ruan | Seleção de desenhos podia alternar entre poucas poses. | Oito pinturas de Karatê em sequência; golpes, especiais e carregamento originais preservados. |
| Tais | As duas linhas da fonte tinham calibrações diferentes; contato causava salto do corpo. | Calibração aprovada aplicada antes de uma escala única; restrição do pé livre ocorre antes da restrição de alcance. Oito desenhos de Savate mantêm o tamanho anatômico aprovado. |
| Luciana | Crop incluía tênis vizinho; preparação do chute reutilizava soco. | Extração direta com propriedade única dos pixels e preparação em guarda. Estilo e ataques registrados no jogo preservados. |
| Khauãny | Luva cortada, bota vizinha no crop, pé ausente nos quadros prioritários; deformação achatava botas. | Extração completa da fonte, quatro fases de rasteira e quatro de voadora; `combat[14]` e `combat[3]` completos. Caminhada desenha cada pintura inteira, sem deformar pernas/rosto. |
| Dienes | Resíduos nos recortes e reações contaminadas; um desenho novo terminava no limite da fonte. | Caminhada extraída do original; quatro reações, duas vitórias e duas recuperações. `damage[3]` usa a guarda aprovada completa. Fontes e retrato preservados. |

## Pipeline e renderização

`prepare-roster-animation.py`, `painted_walk_extraction.py` e `sprite_geometry.py` preparam atlas sem alterar as imagens fonte. Os metadados registram recorte, origem, calibração, escala por clip, pivô, marcos e solas. Cada personagem tem oito quadros completos em `assets/story/*-walk-v5`. Khauãny usa runtime v2 e Dienes v3; os runtimes anteriores continuam preservados.

As fontes de Luciana, Khauãny e Dienes têm espaçamento irregular e contornos que se tocam nas solas. O crescimento geodésico a partir de oito corpos atribui cada pixel visível a uma figura. A reconstrução RGBA dos pixels com alpha > 80 passou para **502.601, 534.934 e 633.701 pixels**, respectivamente, sem duplicação ou perda. Veja `source-extraction-check.json`.

A caminhada usa a pintura inteira com transformação rígida. O contato é armazenado na simulação em `motion.paint`, em coordenadas do mundo, e atravessa snapshots/rollback. Quando uma nova pintura não cabe no contato anterior, o apoio é liberado antes da nova aterrissagem; a anatomia não é esticada para encaixar dois alvos genéricos. O ciclo para quando o deslocamento é bloqueado. A troca de desenho permanece discreta, conforme os oito quadros existentes.

Hurtboxes e desenho usam a mesma transformação. Idle e passos curtos específicos conservam a malha, com cabeça transladada sem deformação; a composição da parte inferior a 2× reduziu costuras de rasterização. Objetos carregados usam o rig e os sockets de mãos existentes. O limite de câmera é resolvido antes da medição da passada.

## Campanha e sistemas existentes

Os 16 tipos estão representados: lab, elite, kungfu, inspector, substitute, exo, fairRobot, aula, archaeologist, vial, book, scanner, projector, snack, turnstile e cleaner. Nove receberam fontes autorais com 16 poses; quatro mantêm seus atlas aprovados e três mantêm seus mecanismos articulados. Estados de aproximação, aviso, ataque, recuperação, dano e derrota têm seleção própria. Máquinas, objetos voadores e bípedes conservam mecanismos distintos.

Menus, comandos, poderes, vozes, diálogos, campanha, cooperação local, rollback e serviço de salas permanecem implementados. Não houve alteração de tabelas, políticas ou credenciais do Supabase. `svf-online-4-7-0` impede parear simulações incompatíveis. A entrega continua em Canvas/JavaScript; migração de engine não faz parte desta versão.

## Validação executada

- `npm test`: **448 testes, 448 aprovados, zero falhas**.
- `npm run build`: **77 arquivos** na release imutável `releases/v4.7.0`, com manifesto SHA-256.
- `check-painted-render.mjs`: **3.840 amostras** do renderizador distribuídas entre 12 personagens, dois modos, duas orientações, avanço/recuo, profundidade, corrida e parada. **PASS**, zero falhas. Retratos iguais nos 12; zero diferenças nos pixels dos rostos comparados; distância máxima medida entre contato e pixel de sola abaixo de 2 px; deriva dos apoios dentro do limite de 0,01 px.
- Regressões novas verificam os oito desenhos, integridade rígida de todos os 17 marcos, limite de deslocamento do corpo, apoio fixo, snapshot e limite da câmera.
- `audit-sprites.mjs`: atlas, identidade, juntas e 27 estados nas duas orientações, para os 12 personagens; pranchas dos 16 inimigos. `inventory.json` lista medidas e hashes.
- `check-story-render.mjs`: oito cenas/chefes, quadro de contato e 36 vistas com cadeira, nas duas orientações e durante movimento.
- Inspeção visual humana das 12 caminhadas, identidades, atlas de inimigos e estados prioritários confirmou membros completos, ausência dos fragmentos corrigidos e volume preservado na caminhada.
- `git diff --check`: aprovado.

As pranchas de antes mostram o baseline 4.6.20 e as de depois a implementação 4.7.0. A galeria usa WebP de alta qualidade para os quadros grandes; comparações de identidade usam WebP sem perda. Os atlas de jogo e fontes preservam seus pixels originais.

## Limites e itens restantes

Não há fotos originais completas no repositório: a referência de identidade é o retrato/sprite aprovado, não uma nova confirmação fotográfica. Marcos de braços, quadril e joelhos são estimados; medidas e testes de colisão não substituem revisão anatômica.

A caminhada mantém oito desenhos discretos. Não foram inventados quadros intermediários por deformação de pernas; a fluidez deve ser avaliada também em movimento. A composição 2× removeu o pontilhado forte da malha de idle; ampliando Dienes a 4× ainda se vê uma costura muito tênue em coxas/antebraço. A caminhada rígida está livre dessa malha.

O preview gerenciado local não iniciou por limitação da infraestrutura (`bwrap: Can't mount proc`). O ambiente privado recuperado exigiu login. Esses bloqueios não foram atribuídos a permissões do GitHub, cuja conexão aceitou a gravação. A auditoria de navegador em `tests/visual-review.html` está incluída para validação no endereço publicado; seu resultado só será considerado executado após confirmação real.

Uma partida online com duas pessoas e controles USB físicos não foram testados nesta auditoria. Nenhuma afirmação de validação desses cenários é feita.
