# Movimento 4.6.1

## Diagnóstico antes da edição

| Responsabilidade | Código investigado | Causa encontrada |
| --- | --- | --- |
| Posição, estados, startup/active/recovery, pushboxes | `src/engine.js` | Velocidade instantânea; poses de passada trocadas sem um apoio persistente no chão. |
| `requestAnimationFrame`, acumulador e delta | `src/main.js` | Simulação fixa já existente; mantida em 120 Hz, com delta limitado. |
| Frames, crop, pivô e desenho | `src/sprite-loader.js`, `src/render.js`, atlas runtime | Pivôs calibrados por pose, mas a simples troca de imagens deslocava os pés apoiados; respiração escalava a imagem inteira. |
| Caminhada, idle, recuo e estilos | `src/walk.js`, `src/motion.js`, módulos dos estilos | Distância escolhia um frame, sem colocar o pé de apoio em coordenadas do mundo; recuo reutilizava a sequência. |
| Hurtboxes e hitboxes | `src/engine.js`, `src/*-data.js` | Perfis por pose existentes; precisavam acompanhar a nova anatomia e a escala física. |
| Heróis, inimigos e câmera da campanha | `src/story.js`, `src/mostafa-port.js` | Segunda sequência de caminhada e escala por profundidade aplicada somente ao desenho; limites finais da câmera podiam invalidar os apoios. |
| Móveis e interação | `src/story-props.js`, `src/story-render.js` | Tamanhos sem unidade comum; objeto acompanhava a raiz, sem sockets de mãos nem startup de arremesso. |
| Robôs | `src/machine-rig.js` | Pivôs existentes aproveitados; rotação de rodas e recuperação precisavam acompanhar distância e fase de ataque. |

## Implementação

`locomotion-data.js` calibra 17 articulações sobre as posturas aprovadas e define um perfil por personagem. `locomotion.js` resolve IDLE/MOVE_START/WALK_FORWARD/WALK_BACKWARD/MOVE_STOP e os estados de combate por uma única precedência; lê o estado autoral de combate, sem criar um segundo controlador de ataques. `MOTION_STATES` enumera também crouch, salto/queda/pouso, especiais, super, block, hit, stun, knockdown/get-up, grab/throw, carry e estados inimigos.

Posição mundial (`worldX/worldY`, aliases compatíveis de `x/lane`) e offsets locais são separados. O idle move respiração, quadril, ombros, cabeça e guarda, sem mover a raiz. Uma passada avança `distance / strideLength` **depois** de paredes/pushboxes/objetos. O apoio conserva `foot.x/lane`; a outra perna passa por transferência descendente, passagem com elevação, extensão e contato oposto. Curvas quinticas dão impulso e pouso sem velocidades abruptas. `cycleDuration = strideLength / resolvedSpeed`; quando não há deslocamento resolvido, a passada deixa de correr. Avanço e recuo diferem em comprimento, primeiro apoio, duração de apoio, elevação e guarda.

O tronco transfere peso dentro do alcance anatômico das pernas. Isso é necessário: simplesmente fixar os pés e deixar a raiz avançar esticaria os membros. A base de deslocamento recolhe a perna e recupera a postura antes da passada seguinte. Aceleração e frenagem físicas terminam em dezenas de milissegundos; blending visual não atrasa o input. Virar preserva contatos e troca as funções das pernas. Reposicionamento explícito, pouso e recuperação renovam os apoios; interpolação inclui corpo **e** pés, evitando drift a 60 Hz.

`locomotion-render.js` usa uma malha contínua com dois pesos por vértice, transformações de ossos e IK de duas articulações. Cabeça/rosto e solas têm transformações rígidas. Mantém os mesmos pixels, roupas, expressões e identidade; não gera novas artes. Malhas, transparência, pesos e triângulos visíveis são preparados no carregamento. Texturas usam o atlas imutável; buffers de geometria, views e registros de profundidade são reutilizados. Não há filtros novos, blur, partículas ou shake para encobrir movimento.

Golpes conservam seus tempos e desenhos autorais. Avanço de ataque integra a curva de startup, com apoio plantado e compensação local dos membros inferiores; metadados `foot-contacts.js` alinham o mesmo apoio nos frames autorais. Hurtboxes de cabeça, tronco e pernas acompanham a pose compartilhada; alcance e projeção usam a mesma escala. Hitboxes ofensivas continuam limitadas aos frames ativos.

| Estilo | Postura e transferência | Avanço/recuo |
| --- | --- | --- |
| Marcelo / Kung Fu | Base baixa, mãos ativas, oscilação lateral controlada | Recupera a base, impulsiona, estende e recolhe; guarda mais defensiva no recuo. |
| Rafael / Boxe | Guarda alta, cotovelos fechados, ombros e cabeça ativos | Apoio longo, elevação pequena, passos curtos e recuperação de base; recuo recolhe o pé dianteiro. |
| Gustavo / Kickboxing | Guarda alta, quadril e joelho ativos | Elevação e compensação de quadril maiores que no boxe, sem perder a guarda. |
| Tais / Savate | Postura alta, guarda técnica e apoio alternado | Menor duração de apoio, maior elevação e trocas leves; diferença de pose, não apenas velocidade. |
| Outros | Bind e perfil próprios para Capoeira, Muay Thai, Judô, postura de João e Karatê | Base, sway, lift, apoio e retorno específicos; ataques e recuperações autorais preservados. |

## Escala da campanha

`story-world.js`: 116 unidades por metro visual; adulto de referência 1,78 m = 206,48 px. Escala aplicada tanto a desenho quanto a pushboxes, hurtboxes, alcance, velocidade, salto/gravidade, projéteis, drones e inimigos. Mesa: 88,16 px (0,76 m); cadeira: 99,76 px (0,86 m); referência de porta: 243,60 px (2,10 m). O panorama mantém sua perspectiva de fundo; objetos utilizáveis estão no plano dos pés. A câmera mantém sua zona de acompanhamento e smoothing exponencial moderado. A ordem usa feetY/lane; não há escala adicional exclusiva de renderização.

Sockets esquerdo/direito vêm do mesmo esqueleto desenhado. O móvel acompanha a linha entre as mãos, orientação, peso e preparação. Carry tem braços ocupados, passada menor e tronco compensado. O segundo ataque faz golpe com o móvel, com contato somente na fase ativa; Soco/E prepara o arremesso. O centro/rotação da soltura continuam os do objeto segurado. Colisão de projétil usa as dimensões rotacionadas e contato do objeto com o chão. Dano derruba o móvel.

Bípedes inimigos compartilham apoio/IK; a carga dos chefes mantém a passada. Robôs originalmente sobre rodas preservam a construção: giro ligado ao raio físico e distância, chassis com inclinação curta, braços articulados, serras independentes, windup/contact/recovery. Voadores conservam sua suspensão e rotores.

## Conferência reproduzível

```sh
npm run build
npm test
# Conferência adicional de pixels; requer @napi-rs/canvas:
node scripts/check-locomotion.mjs /tmp/svf-locomotion
```

Os testes de simulação não dependem de Canvas. Incluem os dois slots, quatro estilos, apoio, anatomia, interpolação sem mutação, transições, guarda, ataque ativo, pushboxes, delta extremo, profundidade, proporções, sockets, golpe com móvel, arremesso, revival e os 16 tipos inimigos. Os testes existentes continuam verificando combate, poderes, narrativa/progressão e determinismo por snapshot/rollback.

A conferência visual executa o compositor de produção com as artes reais: quatro estilos sobre fundo preto, avanço/recuo, 1×1, quatro atos, cadeira carregada, golpe e arremesso. Mede **também os vértices desenhados da sola**, além dos anchors. No ensaio de 120 frames por estilo, o desvio máximo durante apoio ficou abaixo de 0,01 px; extensão máxima de perna abaixo de 8% (tolerância à perspectiva pintada), em vez dos alongamentos de até 54% encontrados durante a primeira iteração.

Medição por software no ambiente de desenvolvimento, 180 frames, incluindo update + desenho: 1×1 p50 2,77 ms / p95 3,47 ms; campanha p50 3,40 ms / p95 5,80 ms. São valores deste ensaio, não garantia de 60 FPS em qualquer dispositivo. O script grava métricas, timings e imagens para repetir a conferência. Não altera salas, serviços ou banco de dados; somente o identificador do protocolo acompanha a versão da física para impedir pares incompatíveis.

## Recuperação após passos curtos

A observação da versão publicada mostrou que uma parada curta podia terminar com os pés próximos demais. A recuperação levanta e recoloca somente um pé em até 140 ms, com o outro apoio fixo e sem mudar a posição global. MOVE_STOP cobre essa colocação mesmo depois que a velocidade chega a zero. A vista interpolada também preserva explicitamente os getters airborne, crouching e movePhase do Fighter, para que golpes aéreos conservem o pivô e o estado corretos.

O [laboratório visual](../tests/locomotion-lab.html) utiliza o pacote publicado e o compositor Canvas real em fundo preto. Compare idle, avanço, recuo, parada, walk → attack e attack → walk dos quatro estilos; pause para inspecionar os pés. As métricas do navegador são observações do dispositivo em uso, não uma garantia universal de 60 FPS.

## Custo de renderização

A verificação no runner mostrou que o 1×1 precisava reduzir o custo por frame. A arena agora prepara uma imagem imutável na resolução de desenho e a vinheta uma única vez no carregamento; o pan e as cores originais permanecem. Regiões rígidas da malha que compartilham exatamente a mesma transformação, como rosto, tronco e solas, usam uma chamada de textura por grupo. Vértices, IK, pivôs e resolução da malha são mantidos. Não há simplificação do rosto, filtros ou mudança de colisão nessa otimização.
