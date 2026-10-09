# Correções verificadas — 4.6.20

| Personagem | Erro encontrado | Correção |
| --- | --- | --- |
| Luciana | O quadro 8 da base, usado na preparação e recuperação do chute, mostra o braço socando junto com a perna. | Chute usa guarda de pé na preparação e recuperação e o quadro 9, com a perna estendida, no contato. |
| Khauãny | O quadro 10 da base, usado na preparação e recuperação do chute, foi pintado com a bota de apoio cortada. | Retirado desse golpe; a guarda mantém os dois pés e o quadro 9 mostra o chute completo. |
| Dienes | A remoção de vermelho durante o recorte dos sprites também apagava pixels internos da pele, uniforme e membros, deixando o cenário atravessar o corpo. | Atlas v2 recomposto a partir das pinturas originais, com preenchimento dos pequenos buracos internos e novas caixas de dano medidas do atlas. |
| Dienes | A preparação da rasteira e do soco agachado mostrava a pose em pé; o agarrão mostrava uma reação de dano; o pouso entrava em agachamento. | Preparação baixa, agarrão com braços estendidos e pouso em guarda. |

Validação: os testes de Luciana, Khauãny, Dienes e dos golpes posteriores à Taís passaram. A inspeção de quatro quadros de amostra da Dienes encontrou entre 671 e 922 pixels de buracos internos por quadro no atlas anterior e zero no novo. A bateria geral tem falhas preexistentes por arquivos de áudio e cenário ausentes nesta cópia de trabalho.
