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

## Sentinela Automática — 2.8.0

Novo arquivo `marcelo-sentinela-v1.wav`, fala “Sentinela ativada!”, gerado em 05/10/2026 com o mesmo preset **Clint**, modelo `eleven_v3`, interpretação `[shouting]`, velocidade 1.1 e idioma solicitado `pt-br` dos clipes aprovados de Marcelo. Task de origem: `1dce40e2-2504-477e-8bb7-ff64662431bf`. Conversão para PCM mono de 16 bits, 22.050 Hz, normalização de volume e corte apenas do silêncio final, totalizando 3,20 s. Todos os WAV existentes foram preservados byte a byte. A fala toca na implantação, uma vez; o disparo automático usa somente um efeito sonoro curto.

## Revisão 2.9.0

- `marcelo-enxame-v2.wav`: “Bora NIT! Enxame de drones! Alvo marcado!”. Mantém as amostras PCM originais de Bora NIT e acrescenta a nova fala com o preset Clint. O arquivo anterior de Kernel Panic permanece preservado.
- `gelton-special-v2.wav`: “Pincelada cromática!”.
- `gelton-uppercut-v2.wav`: “Aú das cores!”.
- `gelton-super-v2.wav`: “A arte está no movimento! Roda das artes!”.

Gelton usa o preset Mark em português brasileiro; são falas sintéticas do personagem, sem clonagem de voz da pessoa da fotografia. WAV PCM local, 24 kHz, mono.

## Correção 2.9.1 — voz brasileira de Gelton

Os clipes Mark de Gelton da 2.9.0 foram rejeitados por sotaque estrangeiro. Foram substituídos por **pt-BR-AntonioNeural**, voz de português brasileiro, via Edge TTS. Textos preservados: “Pincelada cromática!”, “Aú das cores!” e “A arte está no movimento! Roda das artes!”. Arquivos `gelton-special-br-v3.wav`, `gelton-uppercut-br-v3.wav`, `gelton-super-br-v3.wav`. Ritmo +12%, normalização -16 LUFS / pico -1,5 dBTP, PCM mono 16 bits a 24 kHz. Durações 1,139 s, 0,846 s e 3,129 s. Os clipes anteriores permanecem preservados. A partida usa somente os WAV locais.

## Atualização 2.10.0 — Marcelino e nova dublagem de Gelton

Gelton: substitui novamente as três falas rejeitadas pelo usuário. Voz de catálogo Clint, modelo `eleven_multilingual_v2`, idioma solicitado `pt-br`, velocidade 1.0. Sem alteração de pitch ou aceleração posterior. Novas frases coloquiais: “Olha a pincelada!”, “É o aú das cores!”, “Bora pra roda! A arte tá no movimento!”. Arquivos `gelton-special-br-v4.wav`, `gelton-uppercut-br-v4.wav`, `gelton-super-br-v4.wav`. Durações: 1,145 s; 1,177 s; 2,738 s. As versões antigas permanecem preservadas, mas não são carregadas pelo jogo.

Marcelino: voz de catálogo Martin, timbre masculino maduro/áspero para o personagem, mesmo modelo multilíngue, idioma solicitado `pt-br`, velocidade 1.0. Casting artístico; a voz real da pessoa não foi inferida nem clonada da fotografia. Falas: “Receba esse impulso!”, “Energia cinética!”, “Toda ação tem reação! Agora aguenta!”. Arquivos `marcelino-special-br-v1.wav`, `marcelino-uppercut-br-v1.wav`, `marcelino-super-br-v1.wav`. Durações: 1,218 s; 1,437 s; 2,923 s.

Todos os seis clipes foram convertidos para WAV PCM local mono, 16 bits, 24 kHz; normalização -16 LUFS / pico -1,5 dBTP e remoção apenas do silêncio inicial/final. Os testes validam áudio, mapeamentos e integridade; não avaliam perceptualmente sotaque. A partida não depende de TTS externo. Novos nomes de arquivos e versão de módulos v19 evitam reutilizar as falas antigas do cache.

## Prof. Marcos — PT-BR nativo (2.11.0)

As falas finais usam pt-BR-AntonioNeural, sintetizadas para este personagem com rate +4%, pitch +0 Hz: “Sua sessão acabou!”, “Acesso negado!” e “Travou o sistema! Agora é chão!”. A primeira versão de timbre Bernard foi substituída após o pedido de uma voz mais natural. Arquivos locais WAV PCM mono, 24 kHz, 16 bits; remoção de silêncio inicial e normalização de volume. Sem vocoder, robotização, alteração posterior de pitch ou estiramento temporal. A fotografia orienta a arte, não reproduz a voz real do professor.

## Revisão 2.11.1 — voz expressiva do Marcos

Somente Marcos troca suas três falas: Clint, eleven_v3, idioma pt-br, interpretação [shouting], velocidade 1.1, os mesmos parâmetros expressivos das falas aprovadas de Marcelo e Rafael. Arquivos marcos-*-fluid-br-v1.wav, PCM mono 16 bits a 24 kHz, normalização -16 LUFS / pico -1,5 dBTP e corte do silêncio inicial. Sem vocoder, modulação de pitch ou estiramento temporal posterior. Durações medidas: especial 2,816 s; antiaéreo 1,699 s; super 3,508 s. Todos os clipes e mapeamentos dos outros professores permanecem preservados.

## Seleção arcade 3.2.0

Sete falas novas e originais em PT-BR para confirmação da escolha. Timbres e parâmetros dos clipes atuais: Marcelo/Rafael/Marcos Clint v3 1.1; Gustavo Mark v3 1.15; Gelton Clint multilíngue v2 1.0; Marcelino Martin multilíngue v2 1.0; João Chad v3 1.05. Interpretação excited nas falas v3. WAV mono PCM 16 bits 24 kHz, normalização e corte do silêncio inicial, sem alteração posterior de pitch. Os áudios de combate foram preservados. Textos em src/selection-data.js.
