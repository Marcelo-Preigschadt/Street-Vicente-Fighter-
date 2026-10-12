# Correções do modo História — 4.6.23

Base: `e23f9f252d2847d9bb43049e9e0196d9a19d928c`, versão 4.6.22 aceita pelo usuário no 1 × 1. Data da revisão: 12/10/2026.

Pedido desta entrega:

> no 1 x 1 está bom assim nao mexa mais, no modo historia está bizarro o jeito do caminhar , outra coisa os inimigos ainda surgem do nada e deslizam sem movimento, a parte de soltar os poderes tb esta bem bizarra pois surge do nada e nao sai das maos dos personagens os poderes , conserte essas coisas e faça o deploy que depois mando mais ajustes

| Área | Causa encontrada | Correção exclusiva da campanha |
| --- | --- | --- |
| Caminhada dos 12 heróis | Passada curta de combate aplicada à travessia e pivôs dependentes da largura variável da pose. | Ciclo completo de 250 unidades na escala do personagem, velocidade horizontal ajustada, registro do corpo e parada nas poses de apoio. Deslocamento físico continua sendo a distância realmente percorrida. |
| Entrada das ondas | Criação dentro da área visível e clamp para os limites da câmera. | Criação além das bordas, aproximação visível com pequeno escalonamento e limites que não reposicionam o ator em um tick. Estado de entrada é preservado nos snapshots. |
| Locomoção dos inimigos | Distância de animação contabilizada antes do limite; voadores não alimentavam essa distância. | Fase alimentada pela posição final em X/profundidade; recuo inverte o ciclo. Voo não acumula gravidade. Rodas, hélices e pernas mecânicas mantêm os mecanismos existentes. |
| Poderes e rajadas | Offset fixo sem correspondência com a mão pintada; efeitos sem a mesma escala/profundidade; ondas posteriores saíam de outras poses. | 165 registros de poses e mãos, preparação e emissão na mesma mão, pose de soltura mantida durante as ondas, partículas na faixa correta e cauda crescendo a partir da origem. |
| Drones | Criação direta na formação e sentinela perto do chão. | Partida da mão com trajetória de 0,32 s e escalonamento do enxame; sentinela na altura do corpo do alvo. |
| Compatibilidade online | A campanha muda o estado determinístico. | História usa `svf-story-4-6-23`; versus conserva literalmente `svf-online-4-6-22`. |

## Verificação

- 508 testes passaram, sem falhas, cancelamentos ou testes ignorados.
- Build 4.6.23 com 80 arquivos e manifesto de integridade.
- 72 imagens de caminhada, preparação e soltura do 1 × 1 com pixels idênticos aos da 4.6.22.
- 348 arquivos protegidos de arte e código de combate idênticos à base. Nenhuma imagem ou voz do elenco foi recriada.
- Entradas dos quatro atos verificadas em simulação, sem saltos para dentro da câmera.
- Disparos verificados com ambos os sentidos, profundidade, salto e cada onda da rajada. Golpes ascendentes têm registro das mãos de preparação e contato.
- Teste no relay público: sala aguardando e jogando, Ruan e João, dois estados iguais após rollback, correções `[4, 5]`; sala temporária removida.

## Evidências reproduzíveis

- [Caminhada dos 12 heróis](audit-story-20261012/story-walk.mp4) e [quadros](audit-story-20261012/story-walk.webp).
- [Entrada dos inimigos nos quatro atos](audit-story-20261012/enemy-entrances.mp4) e [quadro](audit-story-20261012/enemy-entrances.webp).
- [Preparação, soltura e rajada nas mãos](audit-story-20261012/power-hands.webp).
- [Métricas e hashes do 1 × 1](audit-story-20261012/metrics.json) e [preservação dos arquivos](audit-story-20261012/preservation.json).

Renderização pelo compositor e motores reais em adaptador Canvas offline. O ambiente não forneceu o navegador compatível para playtest interativo; não há medição de FPS no navegador. A aprovação final da experiência da campanha corresponde ao teste solicitado pelo usuário após a publicação. Os sprites completos são mantidos, sem reativar a malha que deformava os personagens.

Reprodução local: `npm run build`, `node --test --test-concurrency=1 tests/*.test.js`, `node scripts/check-story-release.mjs --baseline <checkout-da-4.6.22>` e `node scripts/check-story-live.mjs`. A comparação offline utiliza `@napi-rs/canvas` do runtime e FFmpeg.
