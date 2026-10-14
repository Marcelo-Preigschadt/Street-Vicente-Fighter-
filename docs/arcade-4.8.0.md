# Circuito Vicente e apresentação VS — 4.8.0

Contra a máquina agora funciona como um circuito Arcade: o jogador enfrenta os 12 integrantes restantes do elenco, começando pelo adversário escolhido na seleção. Cada confronto exige dois rounds vencidos. Depois da vitória, a rota pelo Vicente Dutra mostra o próximo desafio e inicia a luta automaticamente, preservando a pontuação acumulada.

## Locutor solicitado

O locutor usa amostras gravadas do Street Fighter II (CPS-1): Round, One a Nine, Final, Fight, Perfect, You, Win e Lose. Os 16 arquivos WAV são cópias byte a byte da fonte documentada em `assets/audio/announcer-sf2-sources-v1.json`. As palavras são agendadas em sequência na Web Audio API, sem sintetizar, alterar pitch ou acelerar a gravação. A tentativa de locutor gerado rejeitada pelo usuário não foi integrada.

Round One e Final Round terminam antes de Fight, sem modificar a introdução de 2,35 segundos da engine. You Win / You Lose e Perfect terminam dentro dos três segundos entre rounds. Perfect exige os 1.000 pontos de vida integrais do vencedor; dano de chip impede o bônus. Pausa e áudio OFF cancelam também os clipes agendados. No online, vitória e derrota usam a perspectiva do jogador conectado.

## Pontuação

| Evento | Pontos |
| --- | --- |
| Acerto no adversário | Dano × 10 |
| Acerto adicional em combo | (Tamanho do combo − 1) × 50 |
| Combo de estilo concluído | +500 |
| Round vencido | +1.000 |
| Vida restante ao vencer | Vida × 5 |
| Tempo restante ao vencer | Segundos restantes, arredondados para cima, × 50 |
| Perfect | +5.000 |
| KO com super | +2.000 |
| Confronto vencido | +3.000 |
| Circuito completo | +20.000 |

Acertos da CPU não pontuam para P1. Empates não concedem vitória, Perfect ou avanço. Eventos duplicados de fim de round/confronto não repetem os bônus. O recorde fica salvo neste navegador; restrições e falhas de armazenamento não interrompem o jogo.

Na derrota, Continuar reinicia a luta contra o mesmo adversário, zera a pontuação e preserva o recorde e a posição no circuito. Os lutadores começam cada novo confronto com vida integral, placar de rounds zerado e barra de super zerada. A barra continua atravessando os rounds do mesmo confronto, conforme a regra existente.

## Rota e visual

Um crachá holográfico do NIT, com o rosto do jogador, percorre os setores da escola em uma animação de 5,6 segundos. Os rivais vencidos ficam marcados; o próximo ganha destaque. A tela apresenta o total, o recorde, a soma animada e os bônus da luta. Enter, Start ou Próxima luta adiantam a transição. O próximo confronto aguarda sprites e áudio; falhas permitem tentar novamente. Sair invalida carregamentos pendentes.

A seleção e o HUD foram redesenhados a partir das duas imagens enviadas como referência de Marvel vs. Street Fighter: retratos grandes, poses em primeiro plano, grid com 13 rostos, marcadores 1P/2P/CPU, cores azul/roxo, títulos em estilo de quadrinhos, barras de vida amarelas com molduras diagonais, cronômetro central e medidor LEVEL 0–3. A fonte Bangers é local; sua licença OFL acompanha o arquivo. A arte, os rostos e as proporções dos 13 personagens permanecem intactos.

## Validação

- 547 testes passaram, incluindo todo o circuito com 12 rivais, pontuação, Perfect, tempo, empate, derrota, continuação, cancelamento e falha de carregamento.
- Integridade e hashes dos 16 clipes originais; agendamento sem sobreposição e cancelamento de áudio.
- Build 4.8.0 com 87 arquivos, imports na mesma versão e caminho da fonte corrigido no CSS publicado.
- Capturas do renderizador real do HUD, Final Round, Perfect e rota animada em `docs/arcade-review/`. São estados controlados para revisão visual, não uma campanha jogada manualmente.

Física, golpes, sprites, vozes dos personagens, modos locais/online e campanha História foram preservados. O estado Arcade é exclusivo da CPU local e não entra nos snapshots de rede. A revisão geral de animações anterior continua em HOLD; este trabalho não converte esse registro em aprovação. Controle USB físico e uma sessão com dois clientes online não foram executados neste ambiente.

Commit e atualização do repositório público e do GitHub Pages seguem a autorização explícita do usuário nesta conversa.
