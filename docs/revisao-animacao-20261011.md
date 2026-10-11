# Revisão de animação — 11/10/2026

**HOLD. Sem merge e sem deploy.** A revisão contém correções reais além do rollback, mas ainda não entrega a fluidez e o transporte de objetos exigidos pelo prompt. O build e os testes aprovados não substituem essa avaliação visual.

Base: `4a19c276161722c2f99e56aa44fb4089ec33bd54`, restauração integral da 4.6.20. Branch: `fix/animation-continuity-20261010`. Pacote candidato: 4.6.21. O prompt completo de 792 linhas foi lido; seu conteúdo particular e as fotografias não foram copiados para o repositório público.

## Correções presentes na branch

- Extração de silhueta por propriedade de cada célula: preserva partes válidas desconectadas e transparência entre membros, rejeitando fragmentos de vizinhos. Metadados de recorte, dimensões e retratos são validados antes do desenho.
- Versões de atlas centralizadas em `sprite-loader.js`; os packs restaurados de Tais e Dienes são preservados pelo pipeline. Os quatro atlas externos de caminhada também são carregados e validados ali.
- `combat[14]` de Khauany passa a representar uma rasteira com a perna estendida. Antes era um soco baixo. `combat[3]`, o chute aéreo já correto, foi preservado. Os outros 31 quadros e o retrato de Khauany permanecem pixel a pixel idênticos ao pack original.
- Na caminhada de Khauany, os quadros 5–7 deixam de copiar botas e luvas do desenho vizinho. As luvas e pontas de bota pertencentes a cada pose são mantidas. Os pixels opacos das três regiões faciais auditadas foram preservados exatamente.
- As colisões do jogo padrão usam a pose completa realmente desenhada. A 4.6.20 desenhava poses prontas, mas ainda selecionava hurtboxes da malha virtual em alguns estados. Luciana, Khauany e Dienes recebem bandas de colisão dos oito quadros externos de caminhada.
- Apoios virtuais, transição de recuperação, alcance das pernas e continuidade do pickup foram corrigidos. Esses resultados são **cinemáticos**, não aprovação da deformação dos sprites.
- O objeto coletado sobe da sua posição e profundidade no chão em 0,18 s; o tempo congela na pausa e participa do rollback. Ácido, gelo e eletricidade soltam a carga uma vez, a partir do centro do objeto. A cadeira/mesa conservam suas dimensões físicas.
- Rodas seguem deslocamento real, incluindo recuo, e os braços mecânicos respeitam antecipação, contato e recuperação.
- Proveta e scanner usam peças metálicas separadas, com superfícies de articulação reconstruídas: três apoios na proveta e duas pernas no scanner. Não são recortes de uma imagem achatada que deixam buracos no corpo.
- Cinco atlas completos produzidos anteriormente foram recuperados: drone arqueólogo, holograma, exoesqueleto, substituto e robô da feira. São 80 poses inteiras, extraídas fora da grade nominal quando necessário. Os quatro registros de animação existentes permanecem inalterados em `enemy-animation-v5.json`.
- Esses cinco inimigos passam a ter desenhos de movimento, ataque, reação e derrota. O robô da feira não mantém chama pintada no idle; a chama pertence ao ataque. O exoesqueleto distingue as poses de contato de carga e slam. Quadros de contato respeitam os tempos físicos existentes.
- O protocolo online é `svf-online-4-6-21`, para não misturar as novas colisões com motores publicados. Não houve migração, alteração de políticas ou edição de dados de campanha no serviço online.

## Limites que impedem a publicação

1. **Fluidez dos 12 heróis não aprovada.** O jogo padrão conserva poses completas. Os ciclos ainda trocam desenhos; não há comprovação de pés plantados nos pixels dessas poses. A malha experimental foi reprovada por dobrar e comprimir calças, coxas e tronco. Ela só é acessível com `new Renderer(canvas, {experimentalActorRig:true})`; a interface normal não a ativa.
2. **Transporte de objetos não aprovado.** O pickup e a soltura melhoraram na simulação. O suporte final ainda vem de punhos virtuais e não coincide com todas as mãos pintadas, principalmente durante caminhada de Ruan, bloqueio, salto e arremesso. A tentativa de ajustar apenas os pontos virtuais não resolveu o problema. Faltam poses próprias de carga ou componentes de braços com juntas e regiões ocultas reconstruídas para cada personagem. Não se pode chamar o encaixe matemático de aprovação visual.
3. **Revisão interativa no navegador não executada.** O adaptador Canvas usa os módulos reais do jogo, mas não reproduz navegador, input, GPU, dispositivos ou desempenho móvel. O ambiente gerenciado não disponibilizou o navegador/preview compatível. Capturas offline e o teste online não substituem esse requisito.
4. **Identidade do novo quadro de Khauany requer revisão final.** A comparação com o retrato, poses aprovadas e as duas referências disponíveis foi registrada. A nova pose contém arte gerada; não se deve dizer que seu rosto é pixel idêntico. Os outros 31 quadros e o retrato são idênticos. As fotografias originais dos outros onze heróis não estavam disponíveis; nesses casos foi usada a arte já aprovada, preservada.

O prompt diz: “Se o sistema de malha articulada causar distorções, não force sua utilização.” Essa regra orienta a rejeição do experimento e o HOLD; não é uma solicitação de permissão adicional.

## Auditoria dos 12 heróis

Cada herói tem 24 estados capturados nas duas orientações: idle, avanço, recuo, parada, agachar, pré-salto, salto, pouso, block, hit, stun, knockdown, levantar, soco, chute, soco baixo, rasteira, soco aéreo, chute aéreo, especial, uppercut, super, vitória e KO. Os diagramas de juntas aparecem apenas no experimento efetivamente desenhado pela malha.

| Herói | Arte e estilo preservados | Resultado e pendência |
| --- | --- | --- |
| Marcelo | Kung Fu, base baixa, golpes, poderes e retrato existentes | Desenhos originais preservados; colisões seguem as poses. Fluidez e carga pendentes. |
| Rafael | Boxe, guarda alta e sequências existentes | Desenhos preservados; apoio virtual estável não comprova a sola desenhada. Fluidez e carga pendentes. |
| Gustavo | Kickboxing, guarda e chutes existentes | Desenhos preservados. A malha deforma a roupa/pernas; permanece desativada. |
| Gelton | Capoeira e sequências próprias de ginga e acrobacia | Recuperação virtual deixa de reiniciar os apoios repetidamente. Ginga contínua desenhada e carga pendentes. |
| Marcelino | Muay Thai e golpes próprios | Desenhos preservados. Guarda e carga não têm poses dedicadas suficientes. |
| Marcos | Judô, agarrões e sequências existentes | Desenhos preservados; teste de reposicionamento acompanha a pose original. Fluidez e carga pendentes. |
| João | Arte, óculos, cabelo, roupa e luta selvagem existentes | Nenhum recorte novo de rosto. Cache mantém quatro personagens, conforme implementação atual. Fluidez e carga pendentes. |
| Ruan | Karatê, rosto, boné e desenhos existentes | Desenhos preservados. Braços baixos nas duas poses de caminhada tornam o suporte virtual da carga especialmente inadequado. |
| Tais | Savate, pack restaurado v2 e oito poses externas v4 | Loader central preserva os packs atuais. Não há nova pintura nem nova aprovação de fluidez/carga. |
| Luciana | MMA, socos, chutes e poderes existentes | Oito hurtboxes de caminhada seguem o atlas efetivo. Não foi inventado um golpe para encobrir uma suposta ausência; as poses existentes foram preservadas. |
| Khauany | Kickboxing, roupa preta/roxa, retrato e 31 poses originais | Rasteira de contato corrigida; vizinhos removidos dos quadros 5–7. Identidade da nova pose e fluidez/carga ainda precisam aprovação. |
| Dienes | Muay Thai, roupa rosa, poderes e pack restaurado v2 | Oito hurtboxes de caminhada corrigidas. Transparências entre membros foram registradas, sem preencher lacunas legítimas automaticamente. Fluidez e carga pendentes. |

## Auditoria dos 16 inimigos

| Inimigo | Mecanismo de movimento | Alteração da revisão |
| --- | --- | --- |
| Drone de lanches | Rotores e suspensão | Rig mecânico existente preservado; sem pernas humanoides. |
| Catraca de serras | Rodas, braços e serras | Giro pelo deslocamento real e transições de braço corrigidos. |
| Robô de limpeza | Rodas e escovas | Giro pelo deslocamento real, com recuo e recuperação corrigidos. |
| Androide de laboratório | Bípede | Atlas completo v4 preservado; malha experimental desativada. |
| Proveta explosiva | Tripé | Três pernas de peças reais, apoios e colisões próprios; estado do terceiro pé sobrevive ao snapshot. |
| Scanner laser | Bípede mecânico | Peças reais separadas, duas pernas com IK rígida e colisões próprias. |
| Livro virtual | Levitação | Desenho original com suspensão limitada; sem pernas artificiais. |
| Drone arqueólogo | Rotor e voo | Atlas completo v5 recuperado, com voo, garra, reação e derrota. |
| Guarda cibernético | Bípede | Atlas completo v4 preservado; malha experimental desativada. |
| Protótipo de Kung Fu | Bípede | Atlas completo v4 preservado; malha experimental desativada. |
| Inspetor-Geral | Bípede e bastão | Atlas completo v4 preservado; não é convertido em robô genérico. |
| Robô da feira | Bípede pesado e lança-chamas | Atlas v5 recuperado; chama só durante ataque, com pose de contato própria. |
| Substituto | Bípede, capa e espada | Atlas v5 recuperado, preservando lâminas que atravessam os limites da grade. |
| A.U.L.A. holograma | Suspensão holográfica | Atlas v5 recuperado; poses próprias, sem construir pernas humanoides. |
| A.U.L.A. exoesqueleto | Bípede pesado | Atlas v5 recuperado; carga e slam usam contatos distintos, mantendo escala única na queda. |
| Projetor | Cabos e suspensão | Construção original preservada; movimento limitado de corpo/cabos. |

Esses mecanismos foram conferidos no Canvas. Isso não equivale a aprovação temporal completa dos 16 inimigos no navegador.

## Validação executada

| Verificação | Resultado | Alcance da evidência |
| --- | --- | --- |
| `npm test` | 479 passaram, 0 falhas | Combate, estados, sprites, colisões, carry, campanha, snapshots e rollback. |
| `npm run build` | Pacote local 4.6.21 gerado | Módulos e manifesto da mesma versão. Não faz deploy. |
| Scanner de sprites | 12 heróis, 632 quadros | 600 poses preparadas e 32 poses externas; alpha e recortes válidos. Não aprova anatomia ou fluidez. |
| Preservação de Khauany | 31 poses + retrato idênticos | Exclui apenas o contato de rasteira substituído. |
| Caminhada Khauany v3 | 8 poses retêm pixels de fonte | Nas faces dos quadros 5–7: 13.474, 14.417 e 12.917 pixels opacos preservados. |
| Atlas recuperados | 80 corpos completos, 0 pixels duplicados entre poses | Pixels visíveis preservados exatamente; sem corte pela grade nominal. |
| Contato mecânico | 144 frames/30 FPS; erro máximo de IK ≈ 2,84×10⁻¹⁴ px | Proveta e scanner, com avanço, recuo e profundidade. Não mede todos os pixels dos sprites. |
| Teste online real | Dois clientes concordam; rollback [4, 5] | Fase, onda, profundidade, projéteis e inimigos. Sala temporária removida. Protocolo candidato separado. |
| Captura dos heróis | 576 vistas + vídeo de 4 s/60 FPS | 24 estados × 12 heróis × 2 orientações. Offline. |
| Captura da campanha | 96 vistas de carga + 16 inimigos + vídeos | Usa o compositor real; os vídeos de estados de inimigos são fixtures, não uma partida jogada. |
| Revisão no navegador | Não executada | Bloqueio de publicação. |

Os testes legados com expectativas já obsoletas foram ajustados: capacidade de cache, seletor atual da interface, combos registrados e permissividade para um experimento isolado. Não foram apagadas verificações para fingir aprovação visual.

No experimento, os apoios virtuais não deslizam e o comprimento das pernas fica próximo do bind, porém foram contadas **908 a 3.562 ocorrências de triângulos invertidos por herói em 130 ticks**. Esse contador é cumulativo, não número de triângulos distintos. Os quadros mostram calças dobradas e compressão corporal. No renderer padrão, `maxRenderedSoleDrift` é `null`: a sola da malha não foi desenhada; não significa erro visual zero.

## Evidências para revisão

- [Comparação da rasteira no mundo](audit-20261010-integrity/khauany-sweep-world-comparison.webp)
- [Comparação facial da nova pose](audit-20261010-integrity/khauany-face-comparison.webp)
- [Identidade e poses antes](audit-20261010-before/identity-render.webp)
- [Identidade e poses candidatas](audit-20261010-render/identity-render.webp)
- [Heróis: vídeo candidato](audit-20261010-render/roster-motion.mp4)
- [Experimento reprovado: vídeo](audit-20261010-experimental/roster-motion.mp4)
- [Carga: 96 vistas candidatas](audit-20261010-story/final/carry-all-12.png)
- [Inimigos antes](audit-20261010-story/enemies-baseline.png)
- [Inimigos candidatos](audit-20261010-story/final/enemies-continuous.png)
- [Inimigos: estados em vídeo](audit-20261010-story/final/enemy-states.mp4)
- [Proveta e scanner: sequência e juntas](audit-20261010-story/final/mechanical-sequence.png)
- [Proveta e scanner: vídeo](audit-20261010-story/final/mechanical-walk.mp4)
- [Pixels dos atlas recuperados](audit-20261010-story/recovered/preservation.json)

Reprodução das evidências:

```sh
npm test
npm run build
python3 scripts/check-sprite-integrity.py --boards
python3 scripts/prepare-recovered-enemies.py
python3 scripts/check-recovered-enemies.py
node scripts/audit-animation.mjs --output docs/audit-20261010-render --video
node scripts/check-story-motion.mjs docs/audit-20261010-story/final --clip --enemy-clip
node scripts/check-story-live.mjs
npm run review:animation  # código 1 esperado: HOLD visual
```

Canvas requer `@napi-rs/canvas`; o preparo/scan requer Pillow, NumPy e SciPy; os vídeos requerem ffmpeg. Os scripts não contam com pastas de imagens geradas fora do repositório. O teste online cria e remove apenas sua própria sala temporária.
