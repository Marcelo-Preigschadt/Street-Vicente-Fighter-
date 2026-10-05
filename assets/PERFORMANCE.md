# Renderização — revisão 2.8.0

O Canvas 2D desenhava brilhos e filtros dos lutadores durante cada quadro. A revisão prepara somente as poses filtradas antes da luta, na escala calibrada de cada personagem. O cenário e as poses normais seguem o desenho original; nenhum arquivo de arte ou voz existente foi modificado. O retrato é preparado uma vez, o atlas de caminhada obsoleto deixou de ser carregado, e o gamepad é consultado uma vez por quadro. A simulação permanece em passos fixos de 1/120 s, com interpolação visual.

## Medição local

Em 05/10/2026, com Skia via `@napi-rs/canvas`, renderização por software em 1280 × 720. Cada amostra inclui uma leitura completa de pixels para executar os comandos de desenho antes de encerrar a medição. Foram descartados oito quadros de aquecimento e medidos quarenta por cena. Foram usados o cenário, os sprites e o renderizador reais. As cenas pesadas mostram seis projéteis e dois lutadores soltando poderes; a cena de super acrescenta dois efeitos de ativação simultâneos.

| Cena | Antes: média / mediana / p95 (ms) | Depois: média / mediana / p95 (ms) |
| --- | --- | --- |
| Luta comum | 14,85 / 13,55 / 31,64 | 14,16 / 13,66 / 20,02 |
| Poderes | 30,10 / 29,44 / 41,28 | 23,33 / 23,46 / 28,16 |
| Dois supers | 43,82 / 42,34 / 54,08 | 40,86 / 40,45 / 52,35 |

A redução média na cena de poderes foi de aproximadamente 22%. A simulação de 120 passos custou aproximadamente 1–3 ms nessa medição. Os tempos de desenho por software com leitura de pixels não são equivalentes aos do Chrome com composição na GPU, nem medem os FPS do computador do jogador. Os efeitos pesados continuam acima de 16,7 ms neste teste: o ajuste reduz trabalho, mas não garante 60 FPS em todos os aparelhos.

Uma tentativa de armazenar todas as poses e o cenário como bitmaps foi descartada porque piorou a medição. Foi mantido apenas o cache das poses filtradas e dos retratos. Para uma evolução maior no navegador, a camada gráfica pode migrar para WebGL usando um motor como Phaser; trocar apenas a linguagem não substitui o trabalho de otimização e medição.
