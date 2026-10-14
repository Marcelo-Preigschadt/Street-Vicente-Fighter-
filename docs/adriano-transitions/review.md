# Piloto de sprites de ataque — 4.9.0

O Adriano alternava preparação e contato nos socos/chutes. O soco médio e o chute médio agora percorrem sete poses distintas cada: guarda, transferência de peso, câmara, extensão parcial, contato, recolhimento e retorno. As poses de guarda, câmara e contato vêm da arte anterior. Quatro desenhos adicionais por ataque completam as transições. Os demais movimentos e personagens aguardam a mesma revisão.

[Comparação animada, 60 FPS](comparison.mp4) · [amostras da sequência](sequence-samples.webp) · [oito desenhos usados](new-poses.webp).

As duas colunas do vídeo usam o mesmo lutador simulado pelo motor real e o renderer do jogo. A coluna anterior seleciona as duas poses antigas; a outra usa o novo seletor. O vídeo é uma execução programada, sem efeitos extras, câmera ou diferença de velocidade para favorecer uma coluna.

Os tempos de preparação, contato e recuperação continuam em 7/4/13 quadros de jogo no soco e 10/5/19 no chute, a 60 Hz. O simulador continua a 120 Hz. O retorno à guarda ainda ocupa os últimos instantes da recuperação e não antecipa a liberação de outra ação. Os seis contatos das três forças continuam usando as poses e os alcances anteriores. A escala de 0,88 e todos os bitmaps anteriores permanecem intactos.

As áreas vulneráveis dos novos desenhos foram medidas na própria silhueta. História e Versus escolhem a mesma pose e geometria. Por isso os protocolos passam a `svf-online-4-9-0` e `svf-story-4-9-0`, impedindo uma sala com clientes que simulem silhuetas diferentes.

## Arte e reprodução

- Ferramenta: `image_gen` integrado, com os atlases aprovados `assets/source/adriano/strike.png` e `base.png` como referências de identidade, traje, técnica e proporção.
- Fonte selecionada: [`assets/source/adriano/transitions-v1.png`](../../assets/source/adriano/transitions-v1.png). Foram gerados 16 quadros; somente as oito transições escolhidas entram no jogo. A primeira tentativa, que cortou a última fileira, foi descartada.
- Prompts integrais da geração e da correção: [`transitions-prompts-v1.json`](../../assets/source/adriano/transitions-prompts-v1.json).
- Asset consumido pelo jogo: [`adriano-transitions-v1.webp`](../../assets/runtime/adriano-transitions-v1.webp), com [`metadados`](../../assets/runtime/adriano-transitions-v1.json).
- `python3 scripts/pack-adriano-transitions.py` faz a extração e o empacotamento, sem redesenhar os sprites existentes; usa escala comum e preserva transparência. `node scripts/review-adriano-transitions.mjs` reproduz vídeo e conferência de geometria. [Registro do empacotamento](packing.json), [resultado do renderer](validation.json), [inspeção estrutural](integrity/integrity-adriano.json).

## Validação e alcance

549 testes passaram, incluindo janelas de contato, poses e colisões nos dois lados, escala de História e convergência de dois clientes com rollback durante os novos ataques. Build: 88 arquivos na versão 4.9.0. A inspeção estrutural do Adriano cobre os 64 quadros ativos, incluindo os oito novos.

O teste visual usa execução programada do renderer em Canvas. Não houve playtest manual de navegador ou controle físico nesta entrega. As imagens foram conferidas quanto a enquadramento, membros completos, identidade e proporção; a avaliação do jogador ainda é necessária para julgar o resultado em combate. Os testes numéricos não aprovam automaticamente a qualidade artística ou a fluidez.

`review:animation` continua em HOLD para a revisão ampla registrada em `docs/animation-review.json` (4.6.22), que inclui locomoção, transporte de objetos, referências de identidade e playtest. Esse arquivo não foi alterado para declarar aprovação geral. A autorização anterior do usuário para publicar e testar o jogo permanece aplicável a este piloto. A malha experimental continua desativada.

Faltam ampliar os outros ataques e reações do Adriano, validar ciclos de movimento e repetir o trabalho nos demais personagens. A apresentação dos poderes também permanece como etapa seguinte.
