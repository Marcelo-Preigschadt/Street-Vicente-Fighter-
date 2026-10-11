# Correções dos outros heróis — candidata 4.6.22

**HOLD. Sem push, merge ou deploy nesta etapa.** A revisão anterior concentrou a alteração de arte dos heróis em Khauany e não resolveu a caminhada, a ginga e a carga dos outros onze. Esta etapa contém correções de seleção, cadência e colisões para o restante do elenco. Não representa aprovação visual completa do prompt.

Base desta etapa: `ddd06f015c2ed1af7726b765bbdb1ccb22c83f41`, candidata local 4.6.21. A base restaurada do projeto continua sendo `4a19c276161722c2f99e56aa44fb4089ec33bd54`. Branch: `fix/animation-continuity-20261010`. A revisão anterior e suas limitações permanecem em [revisao-animacao-20261011.md](revisao-animacao-20261011.md).

## Defeitos encontrados e corrigidos

1. **Cinco atlas de caminhada estavam desconectados.** Gelton, Marcelino, Marcos, João e Ruan já tinham oito desenhos completos em `assets/story/*-walk-v3`, mas o loader não os carregava e os seletores reaproveitavam a ginga de quatro poses; Ruan usava duas poses. Os cinco atlas existentes agora são usados no deslocamento. A postura parada e os golpes próprios continuam nos seletores autorais.
2. **A passada ignorava a escala da campanha nos 12 heróis.** O corpo e a velocidade do modo história usam `actorScale = 116 × 1,78 / 294`, aproximadamente 0,7023. O ciclo mantinha a distância do versus. A distância exigida por passada agora usa essa mesma escala; nenhum quadro é esticado para compensar o erro.
3. **O recuo tinha fase incorreta nas quatro professoras.** Luciana, Khauany e Dienes calculavam a fase por valor absoluto; após cruzar distância zero, a ordem voltava a avançar. Tais limitava a distância a zero e podia permanecer no primeiro desenho. O módulo comum usa resto positivo, conserva a distância assinada no versus e percorre os oito desenhos na ordem inversa durante o recuo.
4. **As colisões dos cinco atlas desconectados não existiam no caminho efetivo.** Foram medidas três bandas de alpha para cada desenho e integradas aos seletores de Gelton, Marcelino, Marcos, João e Ruan. Desenho e combate escolhem o mesmo quadro, com a mesma escala e o mesmo espelhamento.
5. **Luciana se levantava mostrando um soco.** O seletor `wake` apontava para `combat[14]`, cuja arte mostra um direto. Agora usa `combat[13]`, a pose em que se apoia no chão para levantar. Os desenhos de soco, chute e poderes continuam disponíveis. O defeito de soco junto com chute já era evitado pela preparação em guarda da revisão anterior; não foi repintado nem declarado como uma nova correção nesta etapa.

Os ciclos continuam seguindo o deslocamento depois das colisões. O estado de caminhada não seleciona o atlas de movimento quando a parede impede a progressão e o blend termina. Movimento em profundidade usa a distância real resolvida na campanha.

## Mudança por personagem

| Personagem | Correção nova desta etapa | Ainda pendente |
| --- | --- | --- |
| Marcelo | Cadência da campanha proporcional à escala; mesmos oito desenhos de Kung Fu | Fluidez, ginga, apoio da sola desenhada e carga |
| Rafael | Cadência da campanha proporcional à escala; mesmos oito desenhos de Boxe | Fluidez, ginga, apoio da sola desenhada e carga |
| Gustavo | Cadência da campanha proporcional à escala; mesmos oito desenhos de Kickboxing | Fluidez, ginga, apoio da sola desenhada e carga |
| Gelton | Oito desenhos de caminhada conectados, cadência e colisões medidas; ginga parada de Capoeira preservada | Naturalidade temporal da caminhada, ginga e carga |
| Marcelino | Oito desenhos de caminhada conectados, recuo, cadência e colisões medidas | Naturalidade temporal, ginga e carga |
| Marcos | Oito desenhos de caminhada conectados, recuo, cadência e colisões medidas; golpes de Judô preservados | Naturalidade temporal, ginga e carga |
| João | Oito desenhos de caminhada conectados, recuo, cadência e colisões medidas com sua largura visual | Naturalidade temporal, ginga e carga |
| Ruan | Duas poses de deslocamento substituídas pela sequência existente de oito; cadência e colisões medidas | Naturalidade temporal, ginga e carga |
| Tais | Fase de recuo após distância zero e cadência da campanha | Fluidez, ginga, apoio da sola desenhada e carga |
| Luciana | Fase de recuo, cadência da campanha e pose correta de levantamento | Fluidez, ginga, apoio da sola desenhada e carga |
| Khauany | Fase de recuo e cadência da campanha; correções de arte anteriores mantidas | Fluidez, ginga, carga e identidade do novo contato de rasteira |
| Dienes | Fase de recuo e cadência da campanha; alpha dos desenhos existentes reavaliado | Fluidez, ginga, apoio da sola desenhada e carga |

Esta tabela descreve alterações efetivas de código. Não transforma uma revisão de transparência em alegação de repintura: não foi criada uma nova arte de Dienes nesta etapa. As áreas transparentes entre seus membros continuam registradas nas pranchas, sem preencher espaços legítimos automaticamente.

## Evidências e validação

- **484 testes passaram**, zero falhas, cancelamentos ou testes ignorados. Incluem escala dos 12 ciclos, recuo após zero, colisões dos cinco novos caminhos, bloqueio na parede, profundidade, golpes, snapshots e rollback.
- **Build local 4.6.22 passou**, com 78 arquivos no manifesto. A release 4.6.21 foi preservada. O build não fez deploy.
- **672 quadros conferidos**: 600 poses dos packs preparados e 72 poses externas de caminhada. O scanner verifica recortes e alpha; não aprova anatomia ou fluidez automaticamente.
- **42 arquivos de arte e metadados preservados byte a byte** em relação a `ddd06f0`: os 12 packs preparados e os nove packs externos, imagem mais JSON. Não houve nova geração de imagens nesta etapa. Essa preservação dos arquivos não substitui a comparação facial com as fotos indisponíveis.
- **Dois clientes online reais concordaram**, com correções de rollback `[4, 5]`. A sala temporária do teste foi removida. Protocolo candidato `svf-online-4-6-22`, separado dos clientes anteriores.
- **Antes/depois dos 12 heróis nos dois modos**, cenas controladas de 360 frames a 60 FPS por vídeo, usando o Renderer e os motores reais. Mostram idle, avanço, parada, recuo no versus, mudança de direção e profundidade na história. São capturas offline, não partidas jogadas no navegador.
- **96 vistas de carga reavaliadas** com o compositor da campanha. O encaixe dos móveis continua reprovado; nenhum resultado numérico de punhos virtuais é apresentado como aprovação da mão pintada.

A frequência de troca de desenhos aumentou na campanha porque agora corresponde à escala do corpo. Isso demonstra a correção de cadência, **não prova movimento suave**. A nova sequência de João, por exemplo, ainda depende de desenhos discretos; não foi apresentada como animação contínua aprovada.

| Evidência | Antes | Depois |
| --- | --- | --- |
| Movimento dos 12 no versus | [Vídeo](audit-20261011-heroes/before/versus-walk.mp4) | [Vídeo](audit-20261011-heroes/after/versus-walk.mp4) |
| Movimento dos 12 na história | [Vídeo](audit-20261011-heroes/before/story-walk.mp4) | [Vídeo](audit-20261011-heroes/after/story-walk.mp4) |
| Levantamento de Luciana | [Soco indevido](audit-20261011-heroes/before/luciana-recovery.webp) | [Apoio no chão](audit-20261011-heroes/after/luciana-recovery.webp) |

[Prancha do versus](audit-20261011-heroes/after/versus-samples.webp) · [Prancha da história](audit-20261011-heroes/after/story-samples.webp) · [Carga dos 12, ainda reprovada](audit-20261011-heroes/story/carry-all-12.png) · [Preservação da arte](audit-20261011-heroes/asset-preservation.json) · [Recortes e alpha](audit-20261011-heroes/integrity/integrity.json).

## Bloqueios que permanecem

O prompt completo continua pendente: falta aprovar a fluidez e a ginga dos 12, o contato das solas nos pixels e as poses próprias para recolher, carregar e arremessar móveis. Os oito desenhos existentes foram conectados porque estavam disponíveis e desconectados; essa quantidade não é um critério de aprovação da animação. A malha que distorce roupa e corpo permanece desativada no jogo padrão.

O navegador/preview compatível não está disponível neste ambiente. A identidade do contato de rasteira criado anteriormente também precisa revisão final. `npm run review:animation` continua retornando código 1 por esses bloqueios. Não há merge nem deploy.

Reprodução desta etapa:

```sh
python3 scripts/build-native-walk-bounds.py
npm run build
npm test
python3 scripts/check-sprite-integrity.py --output docs/audit-20261011-heroes/integrity
node scripts/check-native-walk.mjs --output docs/audit-20261011-heroes/after --video
node scripts/check-story-motion.mjs docs/audit-20261011-heroes/story
node scripts/check-story-live.mjs
npm run review:animation  # HOLD esperado
```

Os vídeos requerem `@napi-rs/canvas` e ffmpeg. O script permite `--source` para reproduzir uma revisão anterior em checkout separado; os dois modos usam a mesma sequência de inputs antes/depois.
