# Estilos de luta e sequências — 2.5.0

Movimentos pesquisados em fontes primárias. As poses, distâncias, forças e tempos são adaptações arcade para o jogo. As rotas de combos foram montadas para os seus comandos; não reproduzem um regulamento esportivo.

- **Boxe:** [England Boxing, Coaching Handbook, Part 1](https://www.englandboxing.org/wp-content/uploads/2022/03/EB_Boxing-Coaching-Handbook-Part-1_v8-002.pdf), seções de golpes retos, golpes com braço dobrado e combinação de socos (páginas 70–88 do PDF). Referência para jab, cruzado, gancho, uppercut, guarda e sequências de punhos. [Biblioteca oficial de exercícios](https://www.englandboxing.org/members/stay-active/).
- **Krav Maga:** [Krav Maga Worldwide, Striking – Elbows](https://www.kravmaga.com/kmw-blog/xrimi6djitzcb05gmtajvdkhpcqpt2) e [Cyprus Krav Maga Federation, Technique Families](https://ckmf.cy/wp-content/uploads/2024/02/Categories-and-Families-P1-.-G3-1.pdf). Referências para palma, cotovelo, joelho, chute e combate próximo.
- **Kickboxing:** [WAKO, Rules Overview](https://www.wako.sport/rules-overview), referência oficial das modalidades, e [regras de 25.10.2022](https://wako.sport/wp-content/uploads/2022/10/WAKO-Rules-25.10.2022.-revision-3.pdf), consultadas via índice de pesquisa. Referência para a combinação de técnicas de mãos e pernas, chute circular, lateral, low kick e golpes saltando.

## Rotas implementadas

Os números após os ataques representam a força: 0 leve, 1 média, 2 forte.

| Professor | Sequência | Ataques |
| --- | --- | --- |
| Marcelo | Entrada Direta | palma 0 → palma 1 → joelhada 1 |
| Marcelo | Combate Próximo | palma 1 → cotovelada 2 → joelhada 1 |
| Marcelo | Resposta Baixa | palma baixa 0 → palma 1 → joelhada 1 |
| Marcelo | Pressão Direta | palma 0 → palma 1 → cotovelada 2 → joelhada 1 |
| Rafael | Um-dois | jab 0 → cruzado 1 |
| Rafael | Série de Boxe | jab 0 → cruzado 1 → gancho 1 → uppercut 2 |
| Rafael | Cruzado e Gancho | cruzado 1 → gancho 1 → uppercut 2 |
| Rafael | Corpo e Cabeça | jab no corpo 0 → gancho 1 → uppercut 2 |
| Gustavo | Um-dois e Circular | jab 0 → cruzado 1 → circular 1 |
| Gustavo | Quebra de Base | cruzado 1 → low kick 1 |
| Gustavo | Final Circular | jab 0 → cruzado 1 → circular 2 |
| Gustavo | Troca de Altura | jab 0 → cruzado 1 → jab baixo 0 → circular 1 |

Os combos confirmam contato, respeitam a recuperação no vazio, não permitem repetição infinita e se encerram ao mudar o round. Barra de super, defesa por altura, salto, física de projéteis e falas continuam integrados ao motor.

## Dinâmica e deslocamento

Novos atlases de 16 poses completas: oito de movimentação em guarda, duas de entrada, duas de recuo e quatro de tontura. Marcelo mantém base baixa e pressão a curta distância; Rafael desloca-se em passos curtos com guarda fechada e recua para contra-atacar; Gustavo mantém base de kickboxing e distância para chutar. England Boxing também fundamenta o passo sem cruzar os pés, a guarda durante deslocamentos e a recomposição da base entre os golpes. Distâncias e tempos abaixo são parâmetros próprios do jogo.

| Estilo | Entrada | Recuo | Distância buscada pela CPU |
| --- | --- | --- | --- |
| Krav Maga | 112 px / 14 quadros; ataque a partir do 5º | 72 px / 16 quadros | 112–155 px |
| Boxe | 82 px / 11 quadros; ataque a partir do 4º | 104 px / 13 quadros | 120–175 px |
| Kickboxing | 126 px / 18 quadros; ataque a partir do 8º | 116 px / 18 quadros | 185–245 px |

Quadros de combate em 60 Hz; simulação física em 120 Hz. Dois toques na mesma direção em até 230 ms, separados por neutro, acionam o passo. Comandos diagonais dos poderes não acionam passos. Deslocamento suavizado pela curva 3t²−2t³ e integrado pela diferença de posições, mantendo a mesma distância em 30/60/120 Hz. Vulnerabilidade calibrada na pose, sem invulnerabilidade concedida pelos passos.

Contra-ataque: punir preparação ou recuperação acrescenta 12% de dano e 3 quadros de hitstun, ou 5 na janela após o recuo. Não altera dano em guarda. Tontura exige pelo menos 4 acertos consecutivos e 90 pontos de carga; golpes leves/médios/fortes acumulam 18/27/36 pontos, limitados a 100. Carga começa a cair a 20 pontos/s após 1 s sem acertos. Bloqueios e agarrões não acumulam. Após reação/queda/levantar, estado vulnerável de até 2,35 s com quatro poses e estrelas. Comandos novos reduzem 55 ms por evento, limitados a um evento a cada 90 ms. Acerto encerra a tontura, zera a sequência anterior e inicia proteção de 4 s contra repetição imediata. Não há comandos guardados para sair atacando automaticamente.
