# Correção de proporções do Adriano — 4.7.1

A escala do Prof. Adriano foi reduzida uniformemente em 12% após a comparação com os demais lutadores no renderizador real. A pose inicial passa de 289 × 300 para 254 × 264 pixels no plano de combate. A cabeça, o tronco e os membros mantêm a mesma proporção interna.

As 56 poses usam a correção, incluindo a caminhada, os golpes, a defesa e a campanha. As hurtboxes, os ataques, as mãos da campanha, a cadência de caminhada em Versus e os efeitos presos ao corpo acompanham a nova escala. A prévia de seleção recebe a mesma redução.

Os novos atlas `adriano-v2.webp` e `adriano-walk-v2.webp` são cópias byte a byte dos anteriores: somente seus metadados mudam. Nenhum rosto, desenho original, retrato de menu ou áudio foi substituído. Nenhum asset dos demais lutadores mudou. Os nomes v2 evitam reutilizar metadados antigos em cache.

## Verificação

- 530 testes aprovados, incluindo ataques, combos contra todo o elenco, campanha e rollback.
- Build 4.7.1 com 83 arquivos no namespace da versão.
- Integridade de 13 personagens e 728 quadros aprovada.
- Comparação visual de tamanho com Rafael e Ruan, em Versus e História, e prancha com os 13 lutadores.
- Novas capturas da engine e do renderizador: oito segundos por modo, todos os oito quadros de caminhada e os três poderes.

Evidências em `docs/adriano-review/`: `proportion-comparison-v2.webp`, `roster-proportions-v2.webp`, `proportion-metrics-v2.json`, pranchas e vídeos de combate. O script `scripts/review-adriano-proportions.mjs` reproduz a comparação.

O registro geral de animação continua em HOLD desde a 4.6.22; `npm run review:animation` continua falhando por essa pendência anterior e evidências antigas. A correção não transforma esse registro em aprovação. Controle USB físico e o serviço público online continuam sem playtest neste ambiente.

Commit e atualização do repositório e do GitHub Pages seguem a autorização explícita do usuário nesta conversa.
