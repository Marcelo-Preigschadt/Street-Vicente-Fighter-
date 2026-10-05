# Street Vicente Fighter — 2.7.0

Jogo de luta 2D para navegador com **Prof. Marcelo**, **Prof Rafael** e **Prof. Gustavo**, criados a partir das fotos fornecidas. HTML, CSS, JavaScript e Canvas, sem dependências externas para jogar.

[Jogar no GitHub Pages](https://marcelo-preigschadt.github.io/Street-Vicente-Fighter-/?v=2.7.0)

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

A simulação roda a 120 Hz e interpola posições. Caminhadas usam oito desenhos inteiros por professor, guiados pela distância realmente percorrida. Nenhum membro é recortado, torcido ou esticado. O salto tem direção fixada ao sair do chão e permite passar por cima e trocar de lado ao pousar. Guarda baixa protege de rasteiras; guarda alta protege de voadeiras. No boxe, golpe no corpo é defendido em ambas as alturas.

Poderes têm núcleo de energia, trilhas curvas, anéis de lançamento e explosão de contato. Marcelo lança circuitos e pacotes binários; Rafael lança páginas, pergaminhos e escudos com arcos históricos; Gustavo lança cargas orbitais e moléculas ligadas. Antiaéreos têm colunas curvas de energia. O super conserva a pausa de 14 quadros, escurecimento, destaque do professor, raios, nome e três ondas. Efeitos respeitam pausa e preferência por movimento reduzido.

**Todas as artes anteriores, cenário e todos os WAV foram preservados byte a byte.** Novas poses ficam em arquivos adicionais. Nomes, frases, timbres e vozes aprovados não foram substituídos. A barra de super continua entre rounds; nova luta começa sem carga.

## Poderes e falas

| Professor | Poder | Efeito | Fala |
| --- | --- | --- | --- |
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

Não é necessário instalar pacotes. Os 99 testes cobrem rasteira, contato no calçado, queda e levantar, voadeira, defesa por altura, comandos espelhados, seis botões, cancelamento, agarrão, colisão de projéteis, supers, rounds, entradas simultâneas e equivalência em 30/60/120 Hz. Incluem resposta do direcional, recuperação após aterrissar, punição de rasteira, perna vulnerável, recuo no canto e corpos que não atravessam. Também verificam arquivos WAV e o roteamento de cada fala para o poder correspondente, passada por distância, troca de apoio, aviso único por carga, congelamento do super e duração/limpeza dos efeitos.

O GitHub Pages publica a branch `main`, pasta raiz. As fotografias originais não integram o repositório.

## Trajes e fumaça — 2.7.0

Marcelo veste sobretudo longo preto, inspirado no Neo Anderson de Matrix, calça e botas pretas, sem óculos. Gustavo usa jaleco branco de químico sobre camiseta bege, jeans e calçados marrons. Rostos e estilos de luta mantidos em todas as poses ativas, incluindo a tontura. Rafael e cenário mantidos.

Névoa Atômica substitui o Pulso Iônico no comando de poder de Gustavo: H para P1, L para P2, PODER no toque, ou quarto de círculo + soco. Uma nuvem real atravessa a arena; em um acerto sem defesa causa dano leve e 1,9 s de tontura, após a reação ao golpe. A defesa bloqueia a tontura; saltos e invulnerabilidade respeitam as colisões. Acertar o rival tonto encerra a tontura; ao recuperar-se, ele fica protegido de novo atordoamento por 4 s. A barra continua entre os rounds.

Fala: “Névoa atômica!”, em português brasileiro e com a mesma voz Mark dos demais poderes de Gustavo. Os áudios anteriores continuam intactos.
