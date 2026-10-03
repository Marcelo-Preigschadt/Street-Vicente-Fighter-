# Street-Vicente-Fighter-

Jogo de luta 2D para navegador com os personagens **Prof. Marcelo** e **Prof Rafael**, criados a partir das fotos fornecidas. HTML, CSS, JavaScript e Canvas; sem instalação de dependências, banco de dados ou CDN.

## Personagens

| Lutador | Frase | Especial |
| --- | --- | --- |
| Prof. Marcelo | Bora NIT | Projétil de energia verde; maior dano e menor velocidade de movimento. |
| Prof Rafael | No meu tempo não era assim | Projétil em forma de relógio; reduz a velocidade do adversário durante 1,5 segundo quando acerta. |

Os dois personagens têm 16 poses: guarda, respiração, caminhada, salto, agachamento, soco, chute, defesa, reação, especial, vitória e queda. Cada atlas contém uma grade 4 × 4 com transparência.

## Jogar

1. Escolha quem será o jogador 1.
2. Escolha **Contra o computador** ou **2 jogadores** no mesmo computador.
3. Clique em **Começar a luta** ou pressione **Enter**.
4. Vença dois rounds. Cada round tem 90 segundos; no empate, ocorre outro round sem atribuir uma vitória.

| Ação | Jogador 1 | Jogador 2 |
| --- | --- | --- |
| Mover | A / D | ← / → |
| Pular | W | ↑ |
| Agachar | S | ↓ |
| Soco | F | J |
| Chute | G | K |
| Especial | H | L |
| Defender | R | O |
| Pausar | Esc ou P | Esc ou P |

O especial consome 40 de energia. Cada personagem começa com 50; acertar golpes e receber golpes repõe energia, que também se recupera lentamente. A defesa impede dano de socos e chutes; especiais causam pequeno dano residual, sem encerrar o round por esse dano. Pule para passar por projéteis, ou agache para escapar de ataques altos. Os golpes têm preparação e recuperação; apertar o botão durante a recuperação final permite enfileirar o próximo golpe por até 160 ms.

Em celular/tablet, o modo contra o computador mostra botões de toque. Para controles padrão de videogame: direcional ou analógico esquerdo para mover, cima para pular, baixo para agachar; botão inferior (A/×) soco, direito (B/○) chute, superior (Y/△) especial e esquerdo (X/□) ou LB/L1 defesa. Dois controles são suportados no modo local.

**Áudio:** efeitos e trilha original sintetizados no navegador. As frases também aparecem na tela e podem ser pronunciadas pela síntese de voz do navegador em português. A disponibilidade e o timbre da voz dependem das vozes instaladas no dispositivo; não são gravações dos professores.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha **Deploy from a branch**, branch **main**, pasta **/(root)**, e salve. O arquivo `index.html` está na raiz, e todos os caminhos são relativos para funcionar no endereço do repositório.

## Executar localmente

Na pasta do projeto, execute:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`. O jogo usa módulos JavaScript; abrir o HTML diretamente com `file://` não substitui o servidor local.

## Estrutura

```text
index.html             seleção, arena, pausa e controles
style.css              interface e adaptação de tela
src/engine.js          simulação a 60 Hz, colisões, IA, golpes e rounds
src/render.js          sprites, cenário, HUD e efeitos visuais
src/input.js           teclado, toque e controles de videogame
src/audio.js           efeitos, música e frases sintetizadas
src/main.js            carregamento e integração da aplicação
assets/                sprites e cenário em WebP
tests/engine.test.js   verificações da simulação
```

As fotografias originais não integram o repositório; os arquivos do jogo são os personagens ilustrados e o cenário gerados para este projeto.

## Verificação da simulação

Com Node.js instalado:

```bash
npm test
```

Nenhum pacote precisa ser instalado. Os testes verificam dano, defesa, energia, projéteis, troca simultânea de golpes e conclusão dos rounds.
