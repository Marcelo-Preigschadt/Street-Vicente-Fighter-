# Street Vicente Fighter

Jogo de luta 2D para navegador com **Prof. Marcelo** e **Prof Rafael**, criados a partir das fotos fornecidas. HTML, CSS, JavaScript e Canvas, sem dependências externas para jogar.

[Jogar no GitHub Pages](https://marcelo-preigschadt.github.io/Street-Vicente-Fighter-/)

## Combate — versão 2.1

A revisão 2.1 faz a caminhada começar, parar e inverter no próximo tick, encurta o salto para quarenta quadros de voo e encerra o recuo por duração definida. As áreas vulneráveis de cabeça, tronco e pernas foram medidas nos sprites aprovados e acompanham a mesma pose usada para desenhar o personagem. A área que separa os corpos permanece independente dos braços e pernas estendidos. No canto, o recuo que não cabe na vítima afasta o atacante.

A rasteira só acerta durante a extensão ativa da perna, alcança o calçado visível, deixa a perna vulnerável e pode ser punida se for bloqueada. O salto permite cruzar por cima e troca a orientação ao pousar. Um golpe recebido no ar causa queda; a reação agachada conserva a postura. Após levantar, a proteção curta se aplica a agarrões, permitindo ataques na retomada da luta.

- Seis botões: socos e chutes leves, médios e fortes, com preparação, duração ativa e recuperação diferentes.
- Agachar + chute executa uma **rasteira baixa com queda**, seguida de tempo no chão e animação de levantar.
- Pular + chute executa uma **voadeira com a perna estendida**, mantendo o deslocamento e a parábola do salto. Um ataque aéreo por salto.
- Defesa em pé contra voadeiras; baixo + trás contra rasteiras. Segurar para trás bloqueia, além dos atalhos de defesa.
- Socos confirmados em acerto ou bloqueio podem ser cancelados em poderes. Golpes no vazio precisam recuperar; encadeamentos de normais dependem do tempo de recuperação.
- Agarrões de perto ignoram defesa. Projéteis opostos se anulam. Supers lançam três ondas e exigem barra cheia.
- Simulação a 120 Hz, interpolação visual, reação ao impacto, recuo, áreas de colisão calibradas nos sprites, paredes e cruzamento por cima do oponente.

O cenário e os dois atlases originais foram preservados. Dois atlases adicionais trazem poses específicas de rasteira, soco agachado, voadeira, antiaéreo, defesa baixa, aterrissagem e levantar.

## Poderes e falas

| Professor | Poder | Efeito | Fala |
| --- | --- | --- | --- |
| Prof. Marcelo · Informática | Rajada de Código | Pacotes de código e trilha de zeros e uns | Código na tela! |
| Prof. Marcelo · Informática | Firewall | Golpe ascendente com uma janela de barreira digital; invulnerabilidade inicial | Barreira digital ativada! |
| Prof. Marcelo · Informática | Kernel Panic | Três rajadas de código, com barra cheia | Bora NIT! Pane no sistema! |
| Prof Rafael · História | Crônicas | Pergaminhos e páginas | Abram as crônicas! |
| Prof Rafael · História | Linha do Tempo | Golpe ascendente com marcos em algarismos romanos | Viagem pela história! |
| Prof Rafael · História | Marcha dos Séculos | Três escudos históricos, com barra cheia | No meu tempo não era assim! Marcha dos séculos! |

**Áudio:** as falas usam o mesmo preset, modelo, velocidade e interpretação do áudio original “Bora NIT”, com texto em português brasileiro. O próprio clipe original foi preservado e reutilizado no super de Marcelo. As falas disparam no lançamento do projétil ou na subida do antiaéreo; esforços e impactos não as interrompem. Um poder diferente substitui a fala do poder anterior. Não há fala Hadouken nem síntese de voz do navegador. Os clipes gerados não são conversões ou clones da voz de Ryu/Ken. [Origem dos áudios](assets/audio/SOURCES.md).

## Comandos

Escolha o lutador, selecione CPU ou dois jogadores locais e pressione Enter ou **Começar a luta**. Vence quem ganhar dois rounds de 90 segundos.

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Mover / pular / agachar | A, D / W / S | ←, → / ↑ / ↓ |
| Socos leve / médio / forte | T / F / Y | Num 7 / 8 / 9; J também faz médio |
| Chutes leve / médio / forte | V / G / B | Num 4 / 5 / 6; K também faz médio |
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
| Baixo + chute | Rasteira |
| Pular + chute | Voadeira |
| Para trás | Defesa alta |
| Baixo + para trás | Defesa baixa |

Os poderes normais não consomem barra. Só um projétil normal de cada professor pode estar ativo. Acertos, bloqueios e golpes recebidos carregam a barra de super. Botões aceitam comandos enfileirados por 100 ms e preservam esses comandos durante a pausa de impacto. O salto prepara por três quadros; a direção horizontal fica fixa no lançamento. Aterrissar sem ataque recupera em dois quadros, e com ataque em quatro. O antiaéreo conserva seu tempo restante de recuperação depois de tocar o chão.

No celular, os botões aceitam vários dedos simultaneamente, incluindo baixo + chute. Em controles padrão: X/Y/RB são socos; A/B/RT são chutes; direcional ou analógico executa movimento, guarda e comandos; LB defende, Select agarra. Dois controles são suportados no modo local.

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

Não é necessário instalar pacotes. Os 59 testes cobrem rasteira, contato no calçado, queda e levantar, voadeira, defesa por altura, comandos espelhados, seis botões, cancelamento, agarrão, colisão de projéteis, supers, rounds, entradas simultâneas e equivalência em 30/60/120 Hz. Incluem resposta do direcional, recuperação após aterrissar, punição de rasteira, perna vulnerável, recuo no canto e corpos que não atravessam. Também verificam arquivos WAV e o roteamento de cada fala para o poder correspondente.

O GitHub Pages publica a branch `main`, pasta raiz. As fotografias originais não integram o repositório.
