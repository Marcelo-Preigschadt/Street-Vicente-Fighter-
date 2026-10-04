# Estilos de luta e sequências — 2.4.0

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
| Rafael | Um-dois | jab 0 → cruzado 1 |
| Rafael | Série de Boxe | jab 0 → cruzado 1 → gancho 1 → uppercut 2 |
| Rafael | Cruzado e Gancho | cruzado 1 → gancho 1 → uppercut 2 |
| Rafael | Corpo e Cabeça | jab no corpo 0 → gancho 1 → uppercut 2 |
| Gustavo | Um-dois e Circular | jab 0 → cruzado 1 → circular 1 |
| Gustavo | Quebra de Base | cruzado 1 → low kick 1 |
| Gustavo | Final Circular | jab 0 → cruzado 1 → circular 2 |

Os combos confirmam contato, respeitam a recuperação no vazio, não permitem repetição infinita e se encerram ao mudar o round. Barra de super, defesa por altura, salto, física de projéteis e falas continuam integrados ao motor.
