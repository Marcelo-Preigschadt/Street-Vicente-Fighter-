# Street Vicente Fighter

Jogo de luta 2D para navegador com **Prof. Marcelo**, **Prof Rafael** e **Prof. Gustavo**, criados a partir das fotos fornecidas. HTML, CSS, JavaScript e Canvas, sem dependências externas para jogar.

[Jogar no GitHub Pages](https://marcelo-preigschadt.github.io/Street-Vicente-Fighter-/)

## Dinâmica dos estilos e tontura — versão 2.5

Cada professor tem um novo ciclo de oito desenhos completos de movimentação em guarda, dois desenhos de entrada, dois de recuo e quatro de tontura. Marcelo transfere peso em passos baixos, com a palma à frente; Rafael faz passos curtos com os punhos junto ao rosto; Gustavo mantém a base mais alta e pronta para chutar. O ciclo acompanha a distância efetiva, inclusive ao recuar, e a silhueta visível determina as áreas vulneráveis. Os desenhos completos não sofrem deformação de pernas ou quadril.

Dois toques para frente, separados por neutro e dentro de 230 ms, executam uma entrada; dois para trás executam um recuo. Marcelo fecha distância rapidamente e pressiona com palmas, cotovelos e joelhos. Rafael tem recuo curto no tempo e deslocamento de boxe, buscando punir o golpe que passou no vazio. Gustavo conserva distância maior para os circulares e alterna alturas. Entradas permitem atacar depois da preparação; recuos precisam terminar. Os passos respeitam os corpos e as paredes, têm recuperação e continuam vulneráveis. A CPU usa alcance, escolha de golpes e estratégia próprios de cada modalidade.

Punir a preparação ou a recuperação de um golpe produz **CONTRA-ATAQUE**, com 12% a mais de dano e três quadros extras de reação. Após um recuo, a confirmação de contra-ataque concede cinco quadros extras de reação. Andar para frente durante a preparação de um ataque acrescenta uma entrada curta, ajustada ao golpe e ao professor.

| Professor | Sequência longa de P1 |
| --- | --- |
| Marcelo · Pressão Direta | T → F → Y → G: palma rápida, palma, cotovelada, joelhada |
| Rafael · Série de Boxe | T → F → G → B: jab, cruzado, gancho, uppercut |
| Gustavo · Troca de Altura | T → F → S + T, solte S → G: jab, cruzado, jab baixo, circular |

Uma sequência de pelo menos quatro acertos e carga suficiente de tontura deixa o adversário **tonto**, com guarda caída, quatro poses de desequilíbrio e estrelas orbitando a cabeça. A tontura começa depois da reação do último golpe; se houve queda, começa depois de levantar. Dura até 2,35 segundos. Alternar comandos acelera a recuperação; segurar um botão não acelera. O personagem fica vulnerável e não pode atacar, defender ou pular. Um acerto interrompe a tontura e inicia uma nova sequência. Há quatro segundos de proteção contra outra tontura, impedindo repetição imediata. Acertos isolados acumulam carga, que diminui após um intervalo sem acertos; bloqueios, agarrões e golpes no vazio não a acumulam.

Agora há doze rotas de combos. Cenário, poderes e áudios aprovados foram preservados. A barra de super continua entre rounds; tontura, sequências e deslocamentos são limpos ao trocar de round. [Especificação e referências](assets/FIGHTING-STYLES.md).

## Estilos e combos — versão 2.4

Cada professor tem guarda, golpes, alcance e ritmo próprios. Novas poses completas preservam o rosto, a roupa e a estética do jogo. Cenário, caminhadas, poderes e WAV aprovados foram mantidos. A barra de super permanece entre rounds; nova luta ou revanche começa com a barra vazia.

| Professor | Estilo | Combo principal de P1 |
| --- | --- | --- |
| Prof. Marcelo | Krav Maga: palmas, cotoveladas, joelhadas e chute de contenção | F → Y → G |
| Prof Rafael | Boxe: jab, cruzado, gancho, uppercut e golpes no corpo; usa punhos no segundo grupo de botões | T → F → G → B |
| Prof. Gustavo | Kickboxing: socos, chute circular, low kick e chute lateral voador | T → F → G |

Há dez sequências. Pressione o próximo botão logo no impacto: a rota precisa ser válida e o golpe anterior precisa acertar ou ser bloqueado. A janela de 180 ms usa o relógio de combate e conserva comandos durante o congelamento de impacto. O passo de aproximação respeita a física dos corpos e as paredes. Não há loops; golpes no vazio recuperam e só há um ataque aéreo por salto. O dano diminui em cada acerto consecutivo. Contador e nome da sequência aparecem quando ela acerta. CPU segue as mesmas regras.

Outras entradas: Marcelo T → F → G ou S + T, solte S, F → G; Rafael F → G → B ou S + T, solte S, G → B; Gustavo F → S + G ou T → F → B. P2 usa Num 7/8/9 e 4/5/6, nas mesmas forças. No toque, LEVE, SOCO, FORTE, o segundo ataque e FINAL permitem executar os combos.

Rafael usa gancho no corpo ao pressionar baixo + segundo ataque: não derruba e pode ser bloqueado em pé ou agachado. Seu uppercut normal forte derruba, sem gastar super ou executar Linha do Tempo. Marcelo e Gustavo conservam chutes baixos com queda. As técnicas são adaptadas para combate arcade; [referências e especificação](assets/FIGHTING-STYLES.md), [poses e prompts](assets/PRODUCTION.md).

## Motor de combate

A revisão 2.1 faz a caminhada começar, parar e inverter no próximo tick, encurta o salto para quarenta quadros de voo e encerra o recuo por duração definida. As áreas vulneráveis de cabeça, tronco e pernas foram medidas nos sprites aprovados e acompanham a mesma pose usada para desenhar o personagem. A área que separa os corpos permanece independente dos braços e pernas estendidos. No canto, o recuo que não cabe na vítima afasta o atacante.

A rasteira só acerta durante a extensão ativa da perna, alcança o calçado visível, deixa a perna vulnerável e pode ser punida se for bloqueada. O salto permite cruzar por cima e troca a orientação ao pousar. Um golpe recebido no ar causa queda; a reação agachada conserva a postura. Após levantar, a proteção curta se aplica a agarrões, permitindo ataques na retomada da luta.

- Seis botões: socos e chutes leves, médios e fortes, com preparação, duração ativa e recuperação diferentes.
- Agachar + chute executa uma **rasteira baixa com queda**, seguida de tempo no chão e animação de levantar.
- Pular + chute executa uma **voadeira com a perna estendida**, mantendo o deslocamento e a parábola do salto. Um ataque aéreo por salto.
- Defesa em pé contra voadeiras; baixo + trás contra rasteiras. Segurar para trás bloqueia, além dos atalhos de defesa.
- Socos confirmados em acerto ou bloqueio podem ser cancelados em poderes. Golpes no vazio precisam recuperar; encadeamentos de normais seguem as doze rotas dos estilos.
- Agarrões de perto ignoram defesa. Projéteis opostos se anulam. Supers lançam três ondas e exigem barra cheia.
- Simulação a 120 Hz, interpolação visual, reação ao impacto, recuo, áreas de colisão calibradas nos sprites, paredes e cruzamento por cima do oponente.

O cenário e os dois atlases originais foram preservados. Dois atlases adicionais trazem poses específicas de rasteira, soco agachado, voadeira, antiaéreo, defesa baixa, aterrissagem e levantar.

## Caminhada e elenco — versão 2.3

A caminhada usa oito desenhos completos por professor, com guarda, passos alternados, joelhos dobrados e elevação do pé. Cada quadro é uma imagem opaca inteira, sem recortar ou torcer o quadril, as pernas ou os calçados. O tamanho e o eixo do corpo são calibrados por quadro. A animação acompanha a distância efetivamente percorrida, inverte ao recuar e para contra paredes ou contra um adversário no canto. As áreas vulneráveis usam a mesma pose completa mostrada na tela.

Prof. Gustavo entra no elenco com sprites de guarda, caminhada e todos os golpes, criados a partir da foto fornecida. Sua identidade é ciano e violeta, com poderes de Química. A seleção permite escolher os dois professores do confronto, tanto contra CPU quanto em dois jogadores locais. As artes anteriores de luta, o cenário e os áudios aprovados de Marcelo e Rafael foram preservados byte a byte.

Ao completar a barra, aparecem uma onda de energia no professor, um aviso de **SUPER PRONTO** e brilho na barra. A ativação pausa a simulação por 14 quadros de jogo (233 ms), escurece a arena e destaca o professor com raios convergentes, anéis de energia, clarão e o nome do golpe. Kernel Panic usa verde; Marcha dos Séculos usa âmbar; Reação em Cadeia usa ciano e violeta. O impacto das ondas também cria um anel e uma explosão de luz. O HUD continua legível durante os efeitos.

O congelamento da ativação acontece antes de mover qualquer lutador ou projétil, preserva o cronômetro e os comandos enfileirados, e funciona para os dois slots, inclusive com supers simultâneos. A frase aprovada continua disparando uma única vez quando sai a primeira onda. `prefers-reduced-motion` reduz clarões, raios e movimentos decorativos; a pausa do jogador interrompe os relógios dos efeitos.

## Poderes e falas

| Professor | Poder | Efeito | Fala |
| --- | --- | --- | --- |
| Prof. Marcelo · Informática | Rajada de Código | Pacotes de código e trilha de zeros e uns | Código na tela! |
| Prof. Marcelo · Informática | Firewall | Golpe ascendente com uma janela de barreira digital; invulnerabilidade inicial | Barreira digital ativada! |
| Prof. Marcelo · Informática | Kernel Panic | Três rajadas de código, com barra cheia | Bora NIT! Pane no sistema! |
| Prof Rafael · História | Crônicas | Pergaminhos e páginas | Abram as crônicas! |
| Prof Rafael · História | Linha do Tempo | Golpe ascendente com marcos em algarismos romanos | Viagem pela história! |
| Prof Rafael · História | Marcha dos Séculos | Três escudos históricos, com barra cheia | No meu tempo não era assim! Marcha dos séculos! |
| Prof. Gustavo · Química | Pulso Iônico | Esfera carregada com elétrons em órbita | Carga liberada! |
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
| Antiaéreo | U | ; |
| Super com barra cheia | Q | . |
| Agarrar de perto | E | N |
| Defesa manual | R | O |
| Pausar | Esc ou P | Esc ou P |

Os comandos abaixo são relativos ao lado para o qual o personagem olha. Inverta esquerda/direita ao trocar de lado.

| Comando | Ação |
| --- | --- |
| ↓ ↘ → + qualquer soco | Poder lançado |
| → ↓ ↘ + qualquer soco | Antiaéreo |
| ↓ ↘ → ↓ ↘ → + qualquer soco | Super |
| Baixo + segundo ataque | Chute baixo ou gancho no corpo |
| Pular + segundo ataque | Joelhada, overhand ou chute lateral voador |
| Para trás | Defesa alta |
| Baixo + para trás | Defesa baixa |

A carga de super de ambos os professores é mantida entre rounds, incluindo carga parcial ou completa, após nocaute, tempo esgotado ou empate. O super guardado pode ser usado no round seguinte. Nova luta e revanche começam com barras vazias.

Os poderes normais não consomem barra. Só um projétil normal de cada professor pode estar ativo. Acertos, bloqueios e golpes recebidos carregam a barra de super. Botões aceitam comandos enfileirados por 100 ms e preservam esses comandos durante a pausa de impacto. O salto prepara por três quadros; a direção horizontal fica fixa no lançamento. Aterrissar sem ataque recupera em dois quadros, e com ataque em quatro. O antiaéreo conserva seu tempo restante de recuperação depois de tocar o chão.

No celular, os botões aceitam vários dedos simultaneamente, incluindo baixo + chute. Em controles padrão: X/Y/RB são socos; A/B/RT são o segundo grupo de ataques; direcional ou analógico executa movimento, guarda e comandos; LB defende, Select agarra. Dois controles são suportados no modo local.

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

Não é necessário instalar pacotes. Os 99 testes cobrem rasteira, contato no calçado, queda e levantar, voadeira, defesa por altura, comandos espelhados, seis botões, cancelamento, agarrão, colisão de projéteis, supers, rounds, entradas simultâneas e equivalência em 30/60/120 Hz. Incluem resposta do direcional, recuperação após aterrissar, punição de rasteira, perna vulnerável, recuo no canto e corpos que não atravessam. Também verificam arquivos WAV e o roteamento de cada fala para o poder correspondente, passada por distância, troca de apoio, aviso único por carga, congelamento do super e duração/limpeza dos efeitos.

O GitHub Pages publica a branch `main`, pasta raiz. As fotografias originais não integram o repositório.
