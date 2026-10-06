# Retratos de seleção — 3.2.2

Os cards agora usam recortes exatos do quadro base 0 do atlas de combate preparado de cada personagem: assets/runtime/{id}-v1.webp, com coordenadas de assets/runtime/{id}-v1.json. É o mesmo quadro utilizado pela pose lateral do menu. Nenhuma feição foi redesenhada ou gerada novamente. Cabelo, barba, boné e óculos mantêm os pixels dos personagens da luta. O atlas de retratos gerados v2 deixou de ser referenciado pela interface.

scripts/build-menu.py contém os sete recortes calibrados individualmente. Aplica apenas enquadramento quadrado, fundo uniforme e redimensionamento proporcional Lanczos para 320×320; saída assets/runtime/{id}-head-menu-v3.webp. Todos os sete personagens permanecem juntos na grade, e as falas foram preservadas.

## Ajuste 3.3.0

João e Gelton usam recortes v4 com viewport mais próximo do rosto: ampliação proporcional de aproximadamente 33% e 30%, respectivamente. Os pixels faciais continuam extraídos dos sprites existentes. Os demais retratos v3 permanecem preservados. Para reconstruir somente estes dois arquivos: python3 scripts/build-menu.py gelton joao.
