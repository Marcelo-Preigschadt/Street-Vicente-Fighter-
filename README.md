## Atualização 4.7.0 — auditoria das pinturas e contatos

Os 12 personagens usam oito quadros completos de caminhada em ambos os modos e orientações. Os rostos aprovados foram preservados; Khauãny recebeu rasteira/voadora completas, Luciana ganhou preparação de chute sem soco simultâneo e Dienes recebeu reações limpas. A extração das caminhadas e a escala de Tais foram corrigidas. A campanha tem animações específicas para os 16 tipos de inimigos.

[Pranchas de antes/depois e relatório](docs/sprite-audit/index.html) · [Revisão animada dos 28 modelos](tests/visual-review.html)

Validação: 448 testes de código, build dos 77 módulos e 3.840 amostras do renderizador. O protocolo `svf-online-4-7-0` separa versões incompatíveis; o serviço de salas, rollback e Supabase conservam sua implementação. Os limites da revisão estão no [relatório](docs/sprite-audit/report.md).

## Atualização 4.6.0 — movimentação e proporções

História e 1×1 compartilham a locomoção articulada sobre as artes existentes. Apoios ficam fixos no mundo, pernas usam quadril/joelho/tornozelo, e a fase avança pela distância resolvida depois das colisões. Marcelo, Rafael, Gustavo e Tais têm base, apoio, elevação, transferência de peso e guarda diferentes; os demais personagens também têm parâmetros próprios. Há respiração no idle, aceleração/frenagem curtas, transições de movimento e recuo próprio. O ciclo para quando a pushbox impede avançar.

A campanha usa uma escala única para personagens, inimigos, colisões, golpes, salto, projéteis e móveis. Mesas e cadeiras têm dimensões proporcionais; carregar ocupa as duas mãos, reduz a passada e permite golpe com o objeto. O arremesso prepara, solta nos frames ativos e recupera; impactos derrubam o objeto. A profundidade depende dos pés, sem alterar apenas o desenho. Robôs bípedes usam passadas; catracas e robôs de limpeza preservam suas rodas e articulam braços, serras e recuperação.

Artes, rostos, vozes, poderes, capítulos, diálogos e dados do Supabase foram preservados. O identificador `svf-online-4-6-0` evita conectar motores de versões diferentes; salas e matchmaking mantêm a implementação existente.

Validação e arquitetura: [docs/locomotion.md](docs/locomotion.md). `npm test` inclui testes de apoio, anatomia, interpolação, estilos, carry, pushboxes e regressões de combate/rollback; `npm run build` verifica o pacote publicado. O teste visual usa o Canvas do jogo e também mede os vértices das solas.

## Atualização 4.3.1 — port da base Mostafa

A campanha utiliza o port em JavaScript da aproximação, cerco, preparação do soco, animação por quadros e câmera do [Mostafa](https://github.com/shahfarhadreza/mostafa-the-game). Os inimigos terrestres usam as sequências completas de Ferris/Gneiss; os chefes usam a sequência de Butcher. Os oito personagens Vicente, cenários, poderes e cooperativo online continuam no adaptador da campanha. A origem, as adaptações e a licença estão em [vendor/mostafa/README.md](vendor/mostafa/README.md).

No PC os botões de toque ficam ocultos; teclado e joysticks continuam ativos. Informações de comandos ficam no botão de informações. A seleção dos oito personagens agora usa duas linhas de quatro retratos. No online, animação, alvo, cerco e recuperação fazem parte do estado compartilhado. A versão 4.3.1 usa salas separadas de versões anteriores para evitar motores incompatíveis.

## Correção 3.1.1 — Publicação consistente

## Atualização 4.2.0 — campanha com movimentação em profundidade

Escolha **Modo História** e depois **História solo**, **Cooperativo no mesmo PC** ou **Cooperativo online**. O modo **1 × 1** continua com todo o elenco, os controles, os poderes e os sprites da versão 3.6.2.

A campanha permite selecionar os oito professores e alunos. Os três professores originais continuam como narradores dos atos. No solo, apenas o jogador selecionado entra em campo; o segundo retrato fica oculto. São quatro blocos com rolagem lateral, três ondas por ato, equipamentos corrompidos, objetos e armadilhas, seguidos de um duelo de chefe. A.U.L.A. 3.0 tem holograma e exoesqueleto como fases separadas. Os diálogos de entrada e a premissa seguem o roteiro de Operação Resgate do NIT.

- Pátio e cantina: drones de lanches, catracas de serras, robôs de limpeza, mesas/cadeiras arremessáveis e latas explosivas de máquinas atingidas. Chefe: Inspetor-Geral do Bloco A.
- Química: androides e provetas explosivas, ácido e névoa gelada com aviso antes da ativação. Chefe: Robô de Bordo da Feira de Ciências, com lança-chamas.
- Biblioteca: scanners laser, livros virtuais, projetores e drones arqueólogos; estantes derrubáveis que atingem ambos os lados. Chefe: Professor Substituto Corrompido.
- NIT: guardas cibernéticos, robôs de Kung Fu, cabos elétricos e servidores verdes. Chefe: A.U.L.A. 3.0, com teleporte no holograma e golpes hidráulicos no exoesqueleto. Overclock dá carga cheia à equipe no confronto final.

No cooperativo não há dano entre professores. Nas ondas os dois lutam juntos; no chefe, um entra no duelo e outro fica na reserva. **Tab**, **Start no joystick** ou o botão **Trocar professor** alternam a reserva quando o personagem pode agir. Se ele cair, o parceiro assume. Um parceiro caído nas ondas retorna após a limpeza do encontro; uma derrota da equipe permite tentar o ato novamente.

**Enter / Start** avançam diálogos. **E / N / Select no joystick** arremessam mesas/cadeiras próximas ou derrubam estantes. Os outros golpes e poderes usam os comandos existentes, inclusive no ar. A Névoa Atômica atordoa robôs. Kits de recuperação aparecem ao limpar uma onda. O turno tem 15 minutos de combate; diálogos e pausa não gastam tempo.

A mecânica da campanha agora usa um plano de chão com profundidade, separado da altura do salto. WASD / setas movem em quatro direções; Espaço / Shift direito pulam; dois toques horizontais correm. Socos e chutes podem encadear golpes, com derrubada no terceiro golpe. Os poderes e ataques aéreos continuam disponíveis para todo o elenco. No joystick, o direcional anda e A / × pula; X / □ soca, B / ○ chuta, Select arremessa objetos. O versus mantém seus comandos anteriores.

Cenários panorâmicos contínuos substituem a imagem com deslocamento mínimo; chão e objetos acompanham a câmera, e as paredes usam paralaxe. Personagens e objetos são ordenados pela profundidade, sem mudar a escala dos sprites do elenco. Inimigos chegam pela frente e por trás, alinham sua faixa de ataque e comprometem a direção durante o aviso. Defender tem desgaste; chefes também agarram. Há menos cura entre ondas. O Inspetor tem poses novas sem recortes, recuperação própria e ataques que não se cancelam indevidamente durante a execução.

Validação: `npm run build`, `npm test` (263 testes), `node scripts/check-story-render.mjs` (oito cenas) e `node scripts/check-story-live.mjs` (dois clientes reais, sala visível e estado igual após rollback; remove somente sua própria sala temporária).

Solo e local salvam um checkpoint no início de cada ato no dispositivo. **Continuar campanha** restaura equipe, ato e tempo de entrada. O cooperativo online começa uma campanha nova, sincroniza narrativa, ondas, inimigos, cenários, poderes, chefes, pausa e tentativas por rollback. O convite inclui o modo e as salas usam `game_mode` e `protocol` para impedir misturas de modos/versões. A migração preserva RLS, tokens de proprietário e heartbeat existentes em `svf_rooms`.

Validação: `npm test`; `npm run build`. Testes cobrem progressão completa, duas fases finais, dano entre equipes, golpes aéreos, objetos/armadilhas, reserva, snapshots, rollback com atraso e início/pausa/retry via relay. `scripts/check-story-render.mjs` renderiza oito cenas com o renderer do jogo para conferência visual; requer `@napi-rs/canvas` no runtime. Testes de rede simulados não garantem a mesma latência em toda conexão.

O teste ao vivo encontrou HTML 3.1.0 e catálogo de personagens antigo carregados juntos. Agora o HTML aponta para releases/v3.1.1/main.js e style.css. Todos os módulos da versão ficam na mesma pasta e importam apenas arquivos dela; o catálogo e as categorias não dependem do cache dos caminhos src antigos. npm run build gera a pasta da versão do package.json e um manifesto de integridade. Incrementar a versão antes de publicar alterações.

## Atualização 3.1.0 — João Machado e categorias

João Machado é o primeiro aluno do elenco, da turma 301. Rosto inspirado na segunda foto enviada; roupa da primeira: camisa verde com mangas dobradas, camiseta escura, jeans largo, tênis e boné preto. 32 poses próprias, óculos e cabeça completos, luta selvagem inspirada no Blanka, mantendo aparência humana.

- H: Super Soco — entrada curta e soco forte; alcance finito, defendível.
- U: Rolamento Selvagem — investida aérea em bola para frente e para cima, com recuperação punível.
- Q: Curto-Circuito 301 — consome 100% da barra; descarga de curta distância, defendível, sem projéteis.
- Voz masculina jovem com interpretação expressiva em português brasileiro; três WAVs locais. Nenhuma fala dos professores foi alterada.
- Abas Professores e Alunos, memória da escolha em cada categoria, adversários agrupados e confrontos livres entre categorias. Prévia leve e animações/áudios carregados por dupla.
- Cache de arte mantém até quatro personagens recentes, liberando atlas e canvases antigos ao alternar o elenco. Catálogo de 30–40 personagens é viável com assets otimizados; ainda não houve teste de desempenho com esse total.
- Duas pessoas por luta online. Total de partidas simultâneas não medido; conexão real entre duas sessões ainda pendente de validação. Não existe promessa de quantidade de jogadores, de latência zero ou de disponibilidade do relay gratuito. Sem banco criado.
- Protocolo/sala 3.1 isolam clientes antigos, evitando que uma versão sem João entre numa luta nova.

## Atualização 3.0.1 — Retransmissão de conexão

Conexões tentam STUN direto e também TURN UDP/TCP/TLS do endpoint público static-auth do Open Relay, com credenciais temporárias de uma hora geradas conforme a chave compartilhada publicada pelo provedor. O serviço de retransmissão pode ter limites e não garante latência ou disponibilidade. Nenhum banco ou conta foi criado.

## Atualização 3.0.0 — Multiplayer online e rollback

- Multiplayer online substitui o modo de duas pessoas no mesmo computador na interface. Encontrar jogador usa uma fila pública; Criar sala gera código de 8 caracteres e convite; Entrar na sala conecta o segundo aparelho. A CPU continua disponível.
- Teclado WASD/F/G/H/U/Q/E/C/X/Z, controle ou botões de toque operam o personagem de quem está naquele aparelho, seja P1 ou P2. Personagens iguais são permitidos online.
- WebRTC/PeerJS 1.5.5, biblioteca local sob MIT, sinalização gratuita do PeerServer Cloud. Sem banco, contas, ranking ou alterações nos projetos Supabase. Um lugar de espera público é liberado assim que a dupla se conecta.
- Rollback em 120 passos/s, previsão local sem aguardar a rede, comandos pequenos em lotes a aproximadamente 60 envios/s; histórico máximo de 180 frames. Direções e ataques são reaplicados na mesma ordem nos dois aparelhos. Relógios sincronizados antes da contagem; latência exibida durante a partida.
- Pacotes atrasados ou fora de ordem corrigem apenas o trecho afetado. Som e efeitos iguais não se repetem durante a correção. Sob congestionamento, aba suspensa ou atraso excessivo, a partida pausa em um frame comum, em vez de acumular comandos. Revanche depende dos dois jogadores; saída ou conexão perdida encerra a sessão.
- Limite de conexão: PeerServer faz sinalização, não retransmite a partida. Redes com NAT simétrico, Wi-Fi corporativo/escolar restrito ou WebRTC bloqueado podem exigir um servidor TURN. Se o caminho direto e o relay gratuito estiverem indisponíveis, o jogo informa a falha e permite tentar outra rede. Não há promessa de latência zero; o rollback reduz o atraso percebido dos comandos.
- Testes com atraso de 300 ms, jitter de 20–189 ms, reordenação, seis professores, supers simultâneos, enxame, pausa e revanche. Testes simulados não garantem a mesma experiência em toda rede.

## Atualização 2.11.1 — Voz expressiva do Marcos

As três falas de Marcos foram refeitas com interpretação de combate em PT-BR, usando os mesmos parâmetros expressivos das falas aprovadas. Novos arquivos evitam o cache da dublagem anterior.

## Atualização 2.11.0 — Prof. Marcos / Judô e carregamento

- Prof. Marcos baseado na fotografia, com judogi azul e faixa preta, 32 poses, pegadas, desequilíbrio, varridas e projeções próprias.
- Sequestro de Sessão: entrada curta e agarrão que vence a guarda, vulnerável a salto e recuo. Pilha Reversa: projeção antiaérea executada no chão. Kernel Panic: projeção de ombro com barra completa, sem projéteis ou drones.
- Falas locais em PT-BR nativo: “Sua sessão acabou!”, “Acesso negado!” e “Travou o sistema! Agora é chão!”.
- Prévias HTML em WebP independentes dos atlas e áudios. Cerca de 100 KB para mostrar os seis personagens.
- Atlas limpos e retângulos pré-calculados em assets/runtime, com animações baixadas somente para os dois lutadores da partida. O navegador não executa extração de silhuetas na inicialização. Áudios da dupla carregam em paralelo e não bloqueiam a seleção.
- scripts/build-sprites.mjs reproduz os atlas e metadados a partir dos originais, mantendo escalas, âncoras e poses. Requer Node, @napi-rs/canvas e Python com Pillow; executar na raiz do projeto. Os originais são preservados.

## Atualização 2.10.1 — Calça do Prof. Marcelino

Marcelino usa calça comprida azul-marinho com detalhes cobre nas 32 poses. Os dois atlas e suas escalas e faixas de colisão foram atualizados.

## Atualização 2.10.0 — Prof. Marcelino / Física / Muay Thai

Quinto professor selecionável nos dois slots e na CPU. 32 poses próprias baseadas na foto, cotoveladas, circulares, low kicks, joelhadas, clinch e três combos. Impulso Linear: H/L; Joelhada Cinética: U/; ; Lei da Ação e Reação: Q/. com barra cheia, cinco ondas vetoriais. Falas de Marcelino em pt-BR com timbre masculino maduro. Dublagem de Gelton refeita com novo timbre e frases coloquiais em pt-BR. Arquivos WAV locais e cache v19. Seleção com cinco cards e distribuição em três linhas no celular.

Validação: 143 testes aprovados, 32 silhuetas calibradas e renderização real dos golpes/poderes.

## Correção 2.9.1 — Gelton

Substitui as três falas de Gelton por voz nativa pt-BR. Corrige a cabeça cortada na comemoração e a falha de cabelo na pose invertida usada pelo super e pelo antiaéreo. Mantém os ataques e recalibra silhuetas.

## Atualização 2.9.0 — Prof. Gelton e Enxame de Drones

Gelton é selecionável como P1 e P2, inclusive como adversário da CPU. Possui 32 poses próprias, ginga, esquiva em negativa, meia-lua, armada, rasteira e aú; os perfis de colisão são medidos das silhuetas de cada pose. Pincelada Cromática: H/L; Aú das Cores: U/; ; Roda das Artes com barra inteira: Q/. . As teclas de golpes permanecem as mesmas do elenco.

Marcelo tem Enxame de Drones no super de barra cheia: Q/. ou Z/I; ENXAME no toque e L3 no gamepad. Seis drones flutuantes marcam a altura real do rival, travam a mira 0,10 s antes do pulso e disparam lasers diagonais em sequência. A guarda bloqueia os disparos; deslocamento após o travamento da mira pode escapar. Não há sentinela gratuita no chão. Pausa, hitstop, KO e troca de round respeitam o ciclo do enxame.

Validação: `npm test`, inspeção das 32 poses de Gelton e renderização real dos ataques e dos supers.

# Street Vicente Fighter — 2.8.0

Jogo de luta 2D para navegador com **Prof. Marcelo**, **Prof Rafael** e **Prof. Gustavo**, criados a partir das fotos fornecidas. HTML, CSS, JavaScript e Canvas, sem dependências externas para jogar.

[Jogar no GitHub Pages](https://marcelo-preigschadt.github.io/Street-Vicente-Fighter-/?v=4.7.0)

## Deploy Drone — Sentinela Automática

Novo poder de Marcelo: **Z no P1, I no P2, DRONE no toque, L3 no controle ou ↓ ↙ ← + soco**. Pode ser lançado no chão ou no ar e fica na posição e altura de implantação, mirando na direção do lançamento. A carga leva exatamente **2 segundos de combate**, com sinal de mira antes de disparar um único laser fraco. Não consome a barra de super, e há no máximo uma sentinela de Marcelo ativa. A fala é **“Sentinela ativada!”**, com o preset e os parâmetros da voz aprovada do professor.

Marcelo recupera a ação durante a carga e pode preparar ataques na recuperação do rival (*okizeme*). O drone continua funcionando se Marcelo receber um golpe. O rival pode destruí-lo com um golpe ou projétil antes do disparo, defender o laser em pé ou agachado, ou sair da sua altura. A sentinela não acompanha o alvo nem vira depois de instalada. Um lançamento aéreo substitui o ataque desse salto, sem alterar sua trajetória. Pausa e hitstop congelam a carga; round novo e revanche limpam robôs e lasers.

## Golpes e reações

Marcelo agora luta **kung fu**: soco direto na linha central, punho de retorno, chute frontal, rasteira circular e chute lateral voador. Rafael conserva **boxe**, com jab, cruzado, gancho, golpe no corpo e uppercut, inclusive nos botões do segundo grupo de ataques. Gustavo conserva **kickboxing**, com circular médio, circular alto forte, low kick e voadeira.

Novas animações de corpo inteiro têm quatro etapas: preparação, rotação/chamber, contato e recolhimento. As reações têm quatro desenhos próprios para golpes na cabeça, no corpo e agachado. A postura se recompõe durante a reação. A pausa de impacto é proporcional à força; contra-ataques recebem mais tempo de reação. Os efeitos de contato surgem no ponto de colisão: clarão direcional curto, centelha de bloqueio e dispersão de energia nos poderes. Não há números de dano flutuando sobre os rostos.

Colisão e renderização escolhem exatamente a mesma pose. Áreas vulneráveis de cabeça, tronco e pernas são medidas na silhueta opaca; punhos e pés estendidos recebem vulnerabilidade no ataque e nos primeiros quadros de recolhimento. A caixa que separa os corpos é independente. Golpes só causam dano na fase ativa. O recuo termina em tempo definido; no canto, o deslocamento que não cabe na vítima afasta o atacante.

## Tontura e combos

**Três acertos consecutivos e 65 pontos de tontura** deixam o adversário tonto após a reação final. Leves/médios/fortes somam 18/27/36; um combo leve → médio → médio já atinge 72. Bloqueios, agarrões e golpes no vazio não acumulam. A carga cai após um segundo sem acertos. Se a sequência derrubou, a tontura começa após levantar.

O rival fica vulnerável, com estrelas, guarda caída e quatro poses de desequilíbrio por até 2,35 s. Alternar comandos acelera a recuperação; manter um botão pressionado não acelera. Um golpe interrompe a tontura e começa uma nova sequência. Há quatro segundos de proteção contra outra tontura.

| Professor | Sequência longa de P1 |
| --- | --- |
| Marcelo · Sequência do Dragão | T → F → Y → G: punho rápido, direto, punho de retorno, chute frontal |
| Rafael · Série de Boxe | T → F → G → B: jab, cruzado, gancho, uppercut |
| Gustavo · Troca de Altura | T → F → S + T, solte S → G: jab, cruzado, jab no corpo, circular |

Há doze rotas confirmadas: pressione o próximo botão logo no contato. Acerto ou bloqueio permite encadear uma rota válida; fora dela, a recuperação deve terminar. Dano diminui a cada acerto. Um ataque aéreo por salto. CPU usa as mesmas rotas e regras. [Especificação e referências](assets/FIGHTING-STYLES.md).

## Mecânicas adaptadas de Alpha/Zero e Street Fighter IV

- **Combo Livre:** C / P2 M / LIVRE no toque. Consome 50 de barra, dura 2,5 s e permite encadear até oito ataques normais e poderes sem seguir uma rota fixa, inclusive no vazio. O professor avança sozinho, sem defender, saltar ou recuar. Receber um golpe encerra o modo. Finalizadores que derrubam precisam recuperar. O dano é reduzido progressivamente e o modo não recarrega sua própria barra por acertos.
- **Contra de defesa:** X / P2 vírgula / CONTRA no toque durante o impacto bloqueado. Consome 25 de barra, cancela a reação de defesa e lança um golpe próximo com invulnerabilidade inicial e queda. Fora do alcance, erra e recupera. Não funciona em guarda sem contato.
- **Levantar rápido:** toque baixo ao aterrissar depois de uma queda. Agarrões e quedas com tontura pendente exigem recuperação completa.
- **Contra-ataque de oportunidade:** punir a preparação ou recuperação causa 12% a mais de dano e três quadros extras de reação; após um recuo, cinco quadros extras.
- **Entrada e recuo:** dois toques separados pelo neutro em até 230 ms. Marcelo aproxima em base baixa, Rafael usa recuo curto para contra-atacar e Gustavo conserva distância de chute. Entradas permitem atacar após a preparação; recuos precisam terminar. Passos permanecem vulneráveis e respeitam corpos e paredes.

Referências primárias: [manual licenciado Evercade Alpha, Alpha/Alpha 2, pp. 14 e 21](https://manuals.plus/m/4601c16c8845daa3f10668731893ede97aa26b6d1f71374de212cf02f19a02da.pdf) e [guia publicado pela Capcom de Street Fighter IV](https://news.capcomusa.com/lets/browse/street-fighter-iv-faq). Custos, duração, comandos e limites são adaptações próprias para este elenco. O jogo não usa o motor da Capcom.

## Movimento, poderes e preservação

A simulação roda a 120 Hz e interpola posições. Na versão 4.6.0, idle e deslocamento usam uma malha contínua da postura aprovada, articulada pela passada e por apoios no mundo. A região do rosto mantém uma transformação rígida; ataques, reações e poderes conservam seus atlas autorais. O salto tem direção fixada ao sair do chão e permite passar por cima e trocar de lado ao pousar. Guarda baixa protege de rasteiras; guarda alta protege de voadeiras. No boxe, golpe no corpo é defendido em ambas as alturas.

Poderes têm núcleo de energia, trilhas curvas, anéis de lançamento e explosão de contato. Marcelo lança circuitos e pacotes binários; Rafael lança páginas, pergaminhos e escudos com arcos históricos; Gustavo lança cargas orbitais e moléculas ligadas. Antiaéreos têm colunas curvas de energia. O super conserva a pausa de 14 quadros, escurecimento, destaque do professor, raios, nome e três ondas. Efeitos respeitam pausa e preferência por movimento reduzido.

**Todas as artes anteriores, cenário e todos os WAV foram preservados byte a byte.** Novas poses ficam em arquivos adicionais. Nomes, frases, timbres e vozes aprovados não foram substituídos. A barra de super continua entre rounds; nova luta começa sem carga.

## Poderes e falas

| Professor | Poder | Efeito | Fala |
| --- | --- | --- | --- |
| Prof. Marcelo · Informática | Sentinela Automática | Drone estacionário que dispara um laser fraco após 2 s | Sentinela ativada! |
| Prof. Marcelo · Informática | Rajada de Código | Pacotes de código e trilha de zeros e uns | Código na tela! |
| Prof. Marcelo · Informática | Firewall | Golpe ascendente com circuitos e uma barreira de energia; invulnerabilidade inicial | Barreira digital ativada! |
| Prof. Marcelo · Informática | Kernel Panic | Três rajadas de código, com barra cheia | Bora NIT! Pane no sistema! |
| Prof Rafael · História | Crônicas | Pergaminhos e páginas | Abram as crônicas! |
| Prof Rafael · História | Linha do Tempo | Golpe ascendente com marcos em algarismos romanos | Viagem pela história! |
| Prof Rafael · História | Marcha dos Séculos | Três escudos históricos, com barra cheia | No meu tempo não era assim! Marcha dos séculos! |
| Prof. Gustavo · Química | Névoa Atômica | Fumaça química que atordoa em um acerto sem defesa | Névoa atômica! |
| Prof. Gustavo · Química | Reação Exotérmica | Golpe ascendente com calor e bolhas energéticas | Vai esquentar! |
| Prof. Gustavo · Química | Reação em Cadeia | Três ondas de moléculas ligadas, com barra cheia | Reagiu, perdeu! Reação em cadeia! |

**Áudio:** Marcelo e Rafael conservam os clipes aprovados. Gustavo tem uma voz própria, de timbre diferente e fala um pouco mais rápida, em português brasileiro, usando o preset Mark a 1,15×. O próprio clipe original foi preservado e reutilizado no super de Marcelo. As falas disparam no lançamento do projétil ou na subida do antiaéreo; esforços e impactos não as interrompem. Um poder diferente substitui a fala do poder anterior. Não há fala Hadouken nem síntese de voz do navegador. Os clipes gerados não são conversões ou clones da voz de Ryu/Ken. [Origem dos áudios](assets/audio/SOURCES.md).

## Comandos

Escolha seu lutador e o adversário, selecione CPU ou dois jogadores locais e pressione Enter ou **Começar a luta**. Vence quem ganhar dois rounds de 90 segundos.

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Mover / pular / agachar | A, D / W / S | ←, → / ↑ / ↓ |
| Socos leve / médio / forte | T / F / Y | Num 7 / 8 / 9; J também faz médio |
| Segundo ataque leve / médio / forte | V / G / B | Num 4 / 5 / 6; K também faz médio |
| Poder lançado | H | L |
| Drone do Marcelo (chão ou ar) | Z | I |
| Antiaéreo | U | ; |
| Super com barra cheia | Q | . |
| Agarrar de perto | E | N |
| Defesa manual | R | O |
| Combo Livre (50 de barra) | C | M |
| Contra de defesa (25 de barra) | X | , |
| Pausar | Esc ou P | Esc ou P |

Os comandos abaixo são relativos ao lado para o qual o personagem olha. Inverta esquerda/direita ao trocar de lado.

| Comando | Ação |
| --- | --- |
| ↓ ↘ → + qualquer soco | Poder lançado |
| ↓ ↙ ← + qualquer soco | Drone do Marcelo |
| → ↓ ↘ + qualquer soco | Antiaéreo |
| ↓ ↘ → ↓ ↘ → + qualquer soco | Super |
| Baixo + segundo ataque | Chute baixo ou gancho no corpo |
| Pular + segundo ataque | Chute lateral voador ou overhand de boxe |
| Para trás | Defesa alta |
| Baixo + para trás | Defesa baixa |

A carga de super de ambos os professores é mantida entre rounds, incluindo carga parcial ou completa, após nocaute, tempo esgotado ou empate. O super guardado pode ser usado no round seguinte. Nova luta e revanche começam com barras vazias.

Os poderes normais não consomem barra. Só um projétil normal de cada professor pode estar ativo. Acertos, bloqueios e golpes recebidos carregam a barra de super. Botões aceitam comandos enfileirados por 100 ms e preservam esses comandos durante a pausa de impacto. O salto prepara por três quadros; a direção horizontal fica fixa no lançamento. Aterrissar sem ataque recupera em dois quadros, e com ataque em quatro. O antiaéreo conserva seu tempo restante de recuperação depois de tocar o chão.

No celular, os botões aceitam vários dedos simultaneamente, incluindo baixo + chute. Em controles padrão: X/Y/RB são socos; A/B/RT são o segundo grupo de ataques; direcional ou analógico executa movimento, guarda e comandos; LB defende, Select agarra, Start ativa Combo Livre e R3 faz contra de defesa. Dois controles são suportados no modo local.

A organização dos controles, a defesa alta/baixa e os comandos direcionais seguem as convenções descritas no [guia publicado pela Capcom](https://news.capcomusa.com/lets/browse/street-fighter-iv-faq). O motor, a arte e os parâmetros de combate deste projeto são próprios; não contêm código do motor da Capcom.

Para a revisão de movimento e colisão, foi consultada a [análise técnica do Street Fighter II: World Warrior](https://github.com/ROMArchaeology/sf2-lineage/blob/main/engine/ENGINE.md): locomoção por deslocamento definido, física de salto e seleção de áreas de ataque e vulnerabilidade por pose. Velocidades, tamanhos e tempos deste jogo foram ajustados para os sprites dos professores; não são uma cópia exata dos parâmetros de Ryu ou Ken.

## Executar e verificar

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Para verificar as regras de combate, entrada e áudio com Node.js:

```bash
npm test
```

Não é necessário instalar pacotes. Os 134 testes cobrem rasteira, contato no calçado, queda e levantar, voadeira, defesa por altura, comandos espelhados, seis botões, cancelamento, agarrão, colisão de projéteis, supers, rounds, entradas simultâneas e equivalência em 30/60/120 Hz. Incluem resposta do direcional, recuperação após aterrissar, punição de rasteira, perna vulnerável, recuo no canto e corpos que não atravessam. Também verificam arquivos WAV e o roteamento de cada fala para o poder correspondente, passada por distância, troca de apoio, aviso único por carga, congelamento do super e duração/limpeza dos efeitos.

A sentinela também é verificada em solo e no ar, no P1 e no P2, com defesa, destruição por ataques, prioridade do contato, direção de lançamento, pausa, invulnerabilidade e equivalência em 30/60/120 Hz.

## Renderização — 2.8.0

As poses que recebem brilho, clarão de acerto ou filtro de defesa são preparadas antes da luta, mantendo as imagens e medidas aprovadas. Os retratos também ficam prontos, o atlas antigo de caminhada sem uso deixou de ser carregado e o controle é consultado uma vez por quadro. A simulação permanece em 120 Hz. A medição local dos poderes passou de 30,10 para 23,33 ms por quadro; os valores são de renderização por software, não uma promessa de FPS no navegador. [Método e limites da medição](assets/PERFORMANCE.md).

O GitHub Pages publica a branch `main`, pasta raiz. As fotografias originais não integram o repositório.

## Trajes e fumaça — 2.7.0

Marcelo veste sobretudo longo preto, inspirado no Neo Anderson de Matrix, calça e botas pretas, sem óculos. Gustavo usa jaleco branco de químico sobre camiseta bege, jeans e calçados marrons. Rostos e estilos de luta mantidos em todas as poses ativas, incluindo a tontura. Rafael e cenário mantidos.

Névoa Atômica substitui o Pulso Iônico no comando de poder de Gustavo: H para P1, L para P2, PODER no toque, ou quarto de círculo + soco. Uma nuvem real atravessa a arena; em um acerto sem defesa causa dano leve e 1,9 s de tontura, após a reação ao golpe. A defesa bloqueia a tontura; saltos e invulnerabilidade respeitam as colisões. Acertar o rival tonto encerra a tontura; ao recuperar-se, ele fica protegido de novo atordoamento por 4 s. A barra continua entre os rounds.

Fala: “Névoa atômica!”, em português brasileiro e com a mesma voz Mark dos demais poderes de Gustavo. Os áudios anteriores continuam intactos.

### Campanha 4.2.0

Quatro botões na tela: Soco, Chute, Pular e Especial. Perto de uma mesa ou cadeira, sem inimigo em alcance de ataque, Soco pega o objeto; outro Soco arremessa. Objetos carregados caem ao sofrer dano. Especial usa o poder normal, ou o super com a barra cheia. Teclado: F/G/Espaço/H (P1), J/K/Shift direito/L (P2). Gamepad: X/□, B/○, A/×, Y/△.

O deslocamento tem aceleração e frenagem em ambos os eixos, normalização diagonal e passadas sincronizadas à distância real. Gelton, Marcelino, Marcos, João e Ruan receberam oito quadros completos de caminhada; Marcelo, Rafael e Gustavo mantêm seus oito quadros de movimento preparados. O versus conserva sua movimentação e controles.

Sprites de objetos com perspectiva, textura, sombras de contato e fragmentos de quebra substituem os desenhos geométricos. Novos assets: `assets/story/*-prop-v3.webp`, `assets/story/*-walk-v3.webp`; prompts e referências de geração: `assets/story/art-prompts-v3.json` (ferramenta image_gen).
