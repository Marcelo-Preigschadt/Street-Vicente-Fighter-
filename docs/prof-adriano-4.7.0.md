# Prof. Adriano — inclusão 4.7.0

Prof. Adriano foi incluído na categoria Professores, disciplina História, com Karatê de contra-ataque. O retrato e os desenhos foram gerados a partir da fotografia enviada. A camiseta branca segue a referência; calça cinza-escura e tênis pretos completam a parte do figurino que a foto não mostra.

Frase de seleção: **Hoje você vai fazer história!**

## Assets e integração

- 16 poses base, 16 de combate, 16 técnicas adicionais e 8 poses de caminhada: 56 desenhos completos.
- Atlas WebP com alpha, metadados JSON, retrato 80 × 81 no atlas, retrato de menu 320 × 320 e prévia 240 × 300.
- Guarda lateral e seis pares de ataques para Uraken, Gyaku-zuki, Shuto-uchi, Mawashi-geri, Yoko-geri e Ushiro-geri. Repertório e combos diferentes do Ruan.
- Selo do Império: selo de controle de espaço, direcional e bloqueável.
- Ascensão da Muralha: chute ascendente com efeito de muralha, lançamento e recuperação.
- Cerco das Dinastias: três frentes com alturas, velocidades e direções distintas; só a última derruba; custo de 100 de super.
- Quatro arquivos WAV PCM exclusivos em português brasileiro para seleção, especial, ascendente e super. Voz sintética original de timbre masculino; nenhuma voz anterior reutilizada.
- Registros de seleção, rival, CPU, campanha, teclado, dois controles locais e elenco online. Protocolo de rede existente preservado.

As fontes autorais e a especificação estão em `assets/source/adriano/`. `scripts/build-adriano.py` reconstrói o pacote; `scripts/review-adriano.mjs` reproduz as capturas do renderizador real. A geração das cinco imagens utilizou imagegen com a foto como referência de identidade, referências do elenco para acabamento e descrição explícita de cada pose. Não houve troca de cabeças entre personagens.

## Arquivos

Assets novos: `assets/audio/adriano-*-br-v1.wav`, `assets/runtime/adriano-*`, `assets/story/adriano-walk-v1.*`, `assets/source/adriano/*`.

Módulos novos: `src/adriano.js`, `src/adriano-data.js`, `src/adriano-fx.js`. Testes novos: `tests/adriano.test.js`.

Registros modificados: engine, estilos, locomotion-data, motion, native-walk, sprite-loader, áudio, seleção, catálogo da História, geometria da campanha, spawn de projéteis e render. Seleção HTML e seletor de adversário receberam Adriano. A versão 4.7.0 e seus 83 arquivos de release foram preparados pelo fluxo existente.

Nenhum asset anterior foi modificado. As definições dos 12 personagens anteriores permanecem idênticas, verificadas contra o commit c5889f0278e42e720674f3a54576ed4cc6db2231.

## Validação executada

- `npm test`: 530 testes aprovados, zero falhas, cancelamentos ou testes ignorados.
- `npm run build`: 83 módulos e stylesheet reunidos no namespace 4.7.0.
- `python scripts/check-sprite-integrity.py`: 13 personagens, 728 quadros; preservação dos assets anteriores confirmada.
- Validação específica dos três poderes nos dois lados e na campanha; rollback do super com jitter e pacotes fora de ordem.
- Capturas reais da engine e do renderizador: 240 quadros a 30 fps por modo, oito segundos de Versus e oito de História. Todos os oito quadros de caminhada foram usados; nenhum estado numérico inválido.

Pranchas, vídeos, métricas, hashes e preservação: `docs/adriano-review/`.

## Pendências efetivas de aceitação

`npm run review:animation` mantém **PUBLICAÇÃO SUSPENSA**. O registro geral `docs/animation-review.json` já estava em HOLD na 4.6.22: movimento/ginga e carregamento de objetos reprovados, identidades parcialmente verificadas e teste de navegador não executado. Esse registro não foi convertido em aprovação.

O Chromium não está instalado; a tentativa de download não forneceu um arquivo válido. As capturas offline não são apresentadas como playtest interativo. Controle USB físico e partida usando o serviço online público não foram testados neste ambiente; os testes automatizados de entrada e rollback passaram.

O usuário autorizou expressamente em 14/10/2026 realizar o commit, publicar os arquivos no repositório público e atualizar o site. O destino da publicação é a main e o GitHub Pages com a versão 4.7.0. O registro de HOLD geral e as verificações pendentes permanecem documentados; a autorização de publicação não foi convertida em aprovação técnica dessas verificações.

As tentativas anteriores de envio foram rejeitadas pela revisão automática de aprovação por interpretação insuficiente da autorização. A autorização explícita posterior do usuário abrange o envio de código, sprites derivados da foto, áudios e atualização do site.
