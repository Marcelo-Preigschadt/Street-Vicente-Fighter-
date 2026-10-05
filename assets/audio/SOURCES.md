# Áudio de combate

## Falas dos poderes

Gravações geradas para este projeto em português brasileiro. Os clipes aprovados de Marcelo e Rafael usam o preset **Clint**, modelo expressivo `eleven_v3`, interpretação `[shouting]` e velocidade `1.1`, exatamente os parâmetros utilizados no primeiro áudio “Bora NIT”. Os arquivos são locais; não dependem de geração de voz ou serviços externos durante a partida.

O áudio inicial aprovado de “Bora NIT” está preservado em `bora-nit-original.wav`. O super de Marcelo reutiliza suas amostras PCM, adiciona 60 ms de silêncio e a nova fala “Pane no sistema!”. Nenhuma alteração de tom, velocidade ou timbre foi aplicada ao trecho original.

| Arquivo | Texto falado |
| --- | --- |
| `bora-nit-original.wav` | Bora NIT |
| `marcelo-special.wav` | Código na tela! |
| `marcelo-uppercut.wav` | Barreira digital ativada! |
| `marcelo-super.wav` | Bora NIT! Pane no sistema! |
| `rafael-special.wav` | Abram as crônicas! |
| `rafael-uppercut.wav` | Viagem pela história! |
| `rafael-super.wav` | No meu tempo não era assim! Marcha dos séculos! |
| `gustavo-fumaca-v1.wav` | Névoa atômica! |
| `gustavo-uppercut.wav` | Vai esquentar! |
| `gustavo-super.wav` | Reagiu, perdeu! Reação em cadeia! |

Gustavo usa o preset **Mark**, modelo expressivo `eleven_v3`, interpretação `[shouting]`, idioma `pt-br` e velocidade `1.15`. As três falas foram geradas em 04/10/2026 e usam um timbre diferente do preset Clint. Os seis WAV anteriores permanecem byte a byte.

Conversão para WAV PCM mono, 16 bits, 22.050 Hz, com normalização de volume. O idioma solicitado ao serviço foi `pt-br`. São gravações geradas com uma voz de catálogo, não uma conversão ou clonagem da voz de lutadores da Capcom. Os testes verificam integridade, amostras audíveis, preservação do trecho original e associação entre clipe e poder; não avaliam perceptualmente sotaque ou timbre.

Falas e legendas disparam no momento em que o poder é lançado. O canal de fala é separado dos esforços e impactos. A fala não é reiniciada enquanto o mesmo poder estiver falando; outro poder substitui a fala para acompanhar a nova ação. Pausa e áudio desligado encerram a reprodução.

## Esforços e impactos

Clipes clássicos de Street Fighter, originalmente da Capcom, obtidos em 03/10/2026 do experimento [street-fighter-css de Jean-Baptiste Nébot](https://github.com/jkneb/street-fighter-css/tree/master/audio). O projeto de origem identifica esses assets como © Capcom. Esta atribuição não concede licença sobre os clipes.

| Arquivo local | Arquivo na origem | Uso |
| --- | --- | --- |
| `grunt-1.wav` | `audio/huhs/huh1.wav` | Esforço |
| `grunt-2.wav` | `audio/huhs/huh2.wav` | Esforço |
| `grunt-3.wav` | `audio/huhs/huh3.wav` | Esforço e reação |
| `hit-light.wav` | `audio/hits/1.wav` | Socos e defesa |
| `hit-heavy.wav` | `audio/hits/3.wav` | Chutes e agarrões |
| `hit-special.wav` | `audio/hits/5.wav` | Poderes e anulação de projéteis |
| `ko.wav` | `audio/defeat.wav` | Nocaute |

Esses WAV foram copiados sem alteração. A fala “Hadouken” foi removida dos arquivos e do código. A música e os sinais de interface são a composição sintetizada original do projeto.

## Névoa Atômica — 2.7.0

Novo arquivo `gustavo-fumaca-v1.wav`, fala “Névoa atômica!”, gerado em português brasileiro com a mesma voz de catálogo **Mark**, `eleven_v3`, `[shouting]`, `pt-br`, velocidade 1.15, usada nos poderes anteriores de Gustavo. Duração 2,56 s; PCM mono de 16 bits, 22.050 Hz, volume normalizado. Todos os WAV anteriores foram preservados byte a byte, inclusive `gustavo-special.wav` (fala antiga “Carga liberada!”). O mapeamento do especial agora usa o clipe novo; antiaéreo e super permanecem com as falas aprovadas.
