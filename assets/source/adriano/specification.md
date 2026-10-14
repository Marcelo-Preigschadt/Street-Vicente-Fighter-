# STREET VICENTE FIGHTER — CRIAÇÃO E INTEGRAÇÃO DE NOVO PERSONAGEM COM PADRÃO PROFISSIONAL DE SPRITES, ANIMAÇÕES, COMBATE E VOZ

## 1. EQUIPE DE DESENVOLVIMENTO E OBJETIVO

Atue como uma equipe sênior de desenvolvimento de jogos de luta 2D/2.5D, com experiência na criação de personagens para jogos arcade de combate e Beat 'em Up, composta pelos seguintes profissionais:

- **Game Director:** responsável pela direção geral, consistência visual e identidade do Street Vicente Fighter.
- **Technical Director:** responsável pela arquitetura do projeto, integração dos personagens e preservação da engine existente.
- **Lead Character Artist:** responsável pela criação dos personagens, fidelidade facial, anatomia, roupas, proporções e padronização visual.
- **Senior Sprite Animator:** responsável pela produção das sequências de sprites e pela continuidade anatômica e temporal das animações.
- **Martial Arts Animation Director:** especialista em movimentos marciais, responsável pela autenticidade dos estilos, posturas, golpes, esquivas, deslocamentos e combinações.
- **Senior Gameplay Engineer:** responsável pela física, movimentação, controle, hitboxes, hurtboxes, colisões e equilíbrio do combate.
- **Combat Systems Designer:** responsável pela diferenciação dos personagens, criação de movimentos, combos, especiais e supergolpes.
- **VFX Artist:** responsável pelos efeitos visuais dos poderes, partículas, projéteis e impactos.
- **Audio Director:** responsável pela geração e direção das vozes individuais, interpretação vocal e sincronização com as ações.
- **QA Engineer:** responsável por validar sprites, animações, combate, integração e ausência de regressões.

### MISSÃO PRINCIPAL

**CRIAR E IMPLEMENTAR UM NOVO PERSONAGEM NO STREET VICENTE FIGHTER, MANTENDO RIGOROSAMENTE O MESMO PADRÃO VISUAL, ANATÔMICO, MECÂNICO E ESTRUTURAL DOS PERSONAGENS JÁ EXISTENTES.**

O novo personagem deve parecer produzido pela mesma equipe de criação, com o mesmo padrão de qualidade e utilizando a mesma engine.

As principais características individuais serão:

1. Identidade facial e aparência correspondentes à fotografia enviada.
2. Estilo de luta definido para o novo personagem.
3. Movimentos e combinações próprios desse estilo.
4. Poderes especiais e supergolpes exclusivos.
5. Voz original em português brasileiro.

**REGRA FUNDAMENTAL: caso o novo personagem utilize um estilo de luta já presente no jogo, ele deverá possuir variações próprias de golpes, combos, postura e movimentação, sem perder as características técnicas da modalidade.**

Não quero um personagem genérico, uma cópia de outro lutador ou uma implementação de qualidade inferior.

---

## 2. REPOSITÓRIO E ANÁLISE OBRIGATÓRIA

Repositório do projeto:

[https://github.com/Marcelo-Preigschadt/Street-Vicente-Fighter-](https://github.com/Marcelo-Preigschadt/Street-Vicente-Fighter-)

Antes de iniciar qualquer modificação:

1. Acesse a versão mais recente da branch principal.
2. Examine a arquitetura atual do jogo.
3. Analise todos os personagens já implementados.
4. Identifique o padrão efetivamente utilizado nos sprites, atlas, animações, escalas e metadados.
5. Compare as proporções dos personagens durante a seleção, combate e modo História.
6. Identifique como o jogo carrega as animações e seleciona as poses.
7. Examine a implementação de estilos marciais, golpes, combos e poderes.
8. Identifique como as vozes e os efeitos sonoros são vinculados às ações.
9. Preserve o código e as funcionalidades existentes que não estejam diretamente relacionados à inclusão do novo personagem.

### Arquivos de referência

Inspecione especialmente:

- `src/engine.js`
- `src/render.js`
- `src/sprite-loader.js`
- `src/sprite-extraction.js`
- `src/styles.js`
- `src/locomotion.js`
- `src/locomotion-data.js`
- `src/locomotion-render.js`
- `src/selection-data.js`
- `src/audio.js`
- `src/story-data.js`
- `assets/runtime/`
- `assets/story/`
- `assets/audio/`

Examine também os módulos específicos de combate, animação e efeitos utilizados pelos personagens existentes.

Não presuma que todos possuem exatamente a mesma implementação interna. Identifique os mecanismos comuns e as particularidades individuais.

### REGRA DE PRESERVAÇÃO

**NÃO MODIFIQUE OS ROSTOS, SPRITES, VOZES, ESTILOS DE LUTA, PODERES OU ANIMAÇÕES DOS PERSONAGENS EXISTENTES.**

Não reestruture a engine inteira.

Não migre o projeto para outra biblioteca ou linguagem.

Não remova funcionalidades atuais.

As alterações devem ser restritas à inclusão do novo personagem e às integrações indispensáveis ao seu funcionamento.

---

## 3. IDENTIFICAÇÃO DO NOVO PERSONAGEM

Utilize as informações a seguir e a fotografia de referência anexada:

- **Nome:** Prof. Adriano
- **Categoria:** Professor
- **Disciplina:** História
- **Estilo de luta:** Karate
- **Roupa:** Conforme Foto
- **Frase de seleção:** 
- **Características da voz:** Voz que combine com seu rosto, não robótica e diferente das que já possui no jogo
- **Poderes especiais:** VOCE FAÇA A CRIAÇÃO ORIGINAL
- **Supergolpe:** VOCE FAÇA A CRIAÇÃO ORIGINAL

As informações explicitamente fornecidas devem ser respeitadas.

Quando determinados poderes ou falas não forem definidos, crie alternativas originais coerentes com a personalidade, disciplina e estilo de luta.

Os poderes do Prof. Adriano devem ter identidade própria, mesmo que já exista outro professor de História.

Não copie os poderes, as frases ou os efeitos do Prof. Rafael.

---

## 4. PADRÃO VISUAL — FIDELIDADE ABSOLUTA AOS PERSONAGENS EXISTENTES

### 4.1. Identidade facial

A fotografia enviada será a referência principal da aparência do novo personagem.

O rosto precisa permanecer reconhecível em todas as poses e animações.

Preserve rigorosamente:

- Formato do rosto.
- Testa e linha do cabelo.
- Olhos e sobrancelhas.
- Nariz e boca.
- Maçãs do rosto e mandíbula.
- Queixo.
- Cabelo, cor, comprimento e textura.
- Tom de pele.
- Características físicas individuais.
- Proporções faciais naturais.

Não substitua a aparência original por uma interpretação genérica.

Não produza um rosto diferente para cada sprite.

Não altere o formato da cabeça quando o personagem executa movimentos.

O rosto deve conservar sua identidade durante:

- Seleção.
- Postura de luta.
- Caminhada.
- Corrida ou avanço.
- Socos e chutes.
- Esquivas.
- Saltos.
- Rasteiras.
- Golpes especiais.
- Supergolpes.
- Reações a impactos.
- Quedas.
- Vitória.

**É EXPRESSAMENTE PROIBIDO PEGAR O CORPO DE OUTRO PERSONAGEM E SIMPLESMENTE COLAR A CABEÇA DO NOVO LUTADOR.**

Cada pose deve ser produzida com anatomia, perspectiva, iluminação e continuidade visual adequadas.

### 4.2. Estilo artístico

Mantenha exatamente a linguagem visual utilizada atualmente no Street Vicente Fighter.

O personagem deve apresentar:

- Mesmo tratamento artístico.
- Mesmo padrão de detalhes.
- Mesma qualidade de contornos.
- Mesma iluminação e acabamento.
- Mesma resolução visual aparente.
- Mesmo padrão de sombras.
- Mesma consistência de cores e texturas.
- Mesmo tipo de enquadramento dos demais lutadores.

Não misture estilos incompatíveis, como personagem 3D renderizado, pixel art de baixa resolução ou ilustração estática dentro do conjunto atual.

Não altere a direção artística do jogo.

### 4.3. Proporções anatômicas

O personagem deve manter proporções coerentes com o elenco existente.

Respeite:

- Relação entre cabeça, tronco e membros.
- Comprimento dos braços.
- Comprimento das pernas.
- Largura dos ombros.
- Posição do quadril.
- Anatomia das articulações.
- Tamanho das mãos e dos pés.
- Altura visual do personagem.
- Posicionamento dos pés no solo.

As proporções devem permanecer consistentes durante toda a animação.

**Não aceite situações nas quais o personagem diminui de tamanho ao agachar, fica desproporcional ao cair ou apresenta pernas e braços de comprimentos diferentes entre quadros.**

Durante movimentos acrobáticos, a silhueta poderá mudar naturalmente, mas a escala anatômica permanecerá coerente.

### 4.4. Problemas visuais proibidos

Não entregue sprites com:

- Pernas desaparecendo durante os chutes.
- Pés cortados.
- Braços incompletos.
- Mãos deformadas.
- Roupas mudando entre poses.
- Sapatos surgindo em posições incorretas.
- Cabeças desproporcionais.
- Pedaços do cenário incorporados ao personagem.
- Partes de outros sprites.
- Transparências incorretas.
- Contornos artificiais.
- Articulações quebradas.
- Duplicação de membros.
- Mudanças indevidas de escala.
- Alteração da identidade facial.
- Movimento realizado apenas abaixo dos joelhos.

Cada quadro deve representar uma pose completa, anatomicamente correta e compatível com a pose anterior e a seguinte.

---

## 5. PADRÃO TÉCNICO DOS SPRITES E ATLAS

Utilize obrigatoriamente o formato e a estrutura que o jogo realmente espera.

A implementação atual utiliza atlas preparados em WebP, acompanhados de metadados JSON.

### 5.1. Atlas obrigatórios

O carregador atual exige:

- Atlas `base`: 16 poses.
- Atlas `combat`: 16 poses.

Também existem personagens com atlas adicionais e sequências externas de caminhada com 8 poses.

Para o novo personagem, produza:

1. Atlas base completo com 16 poses válidas.
2. Atlas de combate completo com 16 poses válidas.
3. Sequência autoral de caminhada com 8 poses, integrada ao carregador atual.
4. Retrato de seleção preparado no padrão de 80 × 81 pixels.
5. Arquivos JSON com metadados corretos.
6. Sprites complementares quando necessários aos movimentos individuais.

O número de poses deve respeitar o contrato do loader e do seletor de animação.

Não duplique quadros artificialmente para preencher espaços.

### 5.2. Metadados e posicionamento

Mantenha a estrutura utilizada pelo jogo, incluindo:

- `rect`
- `x`
- `y`
- `w`
- `h`
- `anchor`
- `bottom`
- `scale`

Os metadados precisam representar corretamente o desenho.

A escala não deve ser alterada aleatoriamente entre quadros.

A âncora precisa manter a referência anatômica adequada.

A posição dos pés deve acompanhar o deslocamento real, sem produzir flutuação ou deslizamento.

Verifique a compatibilidade com:

- `validateSpriteFrames()`
- `validateSpriteMetadata()`
- `loadPreparedSprites()`

Registre o personagem nas estruturas correspondentes em `src/sprite-loader.js`, incluindo `PREPARED_SPRITE_VERSIONS` e `MOTION_SPRITE_STEMS`, conforme a implementação.

### 5.3. Integridade dos arquivos

Todos os sprites devem ter transparência adequada.

Nenhum quadro pode conter partes do fundo original ou de outros personagens.

Não utilize recortes que removam componentes anatômicos importantes.

Não aumente uma pose pequena até que ela perca qualidade visual.

Não substitua os atlas existentes.

Crie arquivos exclusivos para o novo personagem.

---

## 6. ESTILO DE LUTA E MOVIMENTAÇÃO

**ESTA É UMA DAS PARTES MAIS IMPORTANTES DA IMPLEMENTAÇÃO.**

O novo personagem deverá utilizar o estilo de luta informado, mantendo a autenticidade da modalidade.

O Street Vicente Fighter já possui personagens com diferentes estilos marciais, entre eles:

- Kung Fu.
- Boxe.
- Kickboxing.
- Capoeira.
- Muay Thai.
- Judô.
- Karatê.
- Savate.
- MMA.

O novo personagem poderá utilizar qualquer uma dessas modalidades ou outra que seja informada.

### 6.1. Autenticidade técnica

Antes de desenvolver os golpes, analise as principais técnicas e características do estilo escolhido.

Considere:

- Posição da guarda.
- Base e distribuição de peso.
- Centro de gravidade.
- Movimentação do tronco.
- Trabalho de quadril.
- Posicionamento dos pés.
- Distância de combate.
- Tipos de golpes característicos.
- Esquivas e bloqueios.
- Deslocamento ofensivo e defensivo.
- Encadeamento de técnicas.

O personagem deve lutar de forma reconhecível dentro da modalidade escolhida.

Não utilize movimentações de outra arte marcial apenas para criar variedade visual.

### 6.2. Postura de combate

Crie uma postura de combate própria para o personagem.

A animação parada deve apresentar:

- Respiração discreta.
- Movimentação natural do tronco.
- Transferência de peso.
- Movimento característico da guarda.
- Preparação corporal.
- Movimentação sutil das pernas.
- Continuidade sem travamentos.

Não use somente uma imagem estática com oscilação vertical artificial.

A postura precisa demonstrar que o personagem está preparado para lutar.

### 6.3. Caminhada e deslocamento

Crie sequências completas de:

- Avanço.
- Recuo.
- Parada.
- Arranque.
- Frenagem.
- Mudança de direção.
- Transição para ataque.
- Retorno à guarda.

O movimento deve envolver o corpo inteiro.

Os pés precisam apresentar fases coerentes de apoio, transferência de peso e reposicionamento.

Quadril, ombros, braços e tronco devem acompanhar os deslocamentos.

**É PROIBIDO SIMULAR A CAMINHADA ALTERANDO APENAS O ÂNGULO DOS JOELHOS OU DESLOCANDO HORIZONTALMENTE UM SPRITE PARADO.**

O personagem não pode parecer estar patinando sobre o cenário.

O avanço e o recuo devem possuir cadência característica da modalidade.

As animações devem respeitar a distância efetivamente percorrida e as colisões do jogo.

### 6.4. Golpes e animações obrigatórias

Implemente todos os comandos necessários para que o personagem tenha o mesmo conjunto funcional de ações dos demais lutadores.

Inclua, conforme a modalidade:

- Ataque rápido.
- Ataque médio.
- Ataque forte.
- Golpes de curta distância.
- Golpes de média distância.
- Ataques agachados.
- Técnicas baixas.
- Rasteiras.
- Ataques aéreos.
- Contra-ataques.
- Defesas.
- Esquivas.
- Golpes especiais.
- Supergolpe.
- Atordoamento.
- Reação ao impacto.
- Queda.
- Levantamento.
- Vitória.

Cada golpe deve possuir animação coerente com a técnica executada.

Os movimentos devem apresentar:

1. Preparação.
2. Aceleração ou início do ataque.
3. Execução.
4. Contato.
5. Recuperação.
6. Retorno à posição de combate.

Não utilize um sprite de soco durante um chute.

Não utilize animações de chute aéreo para representar uma rasteira terrestre.

Não reutilize poses que apresentem comportamento incompatível com a ação.

---

## 7. DIFERENCIAÇÃO OBRIGATÓRIA QUANDO O ESTILO DE LUTA JÁ EXISTE

**REGRA ABSOLUTA: PERSONAGENS COM O MESMO ESTILO MARCIAL NÃO PODEM SER CÓPIAS UNS DOS OUTROS.**

O Street Vicente Fighter terá diversos professores e alunos.

Naturalmente, mais de um personagem poderá utilizar Boxe, MMA, Muay Thai, Kung Fu, Karatê ou qualquer outra modalidade.

Isso não significa que todos deverão possuir as mesmas animações e sequências de golpes.

### 7.1. Comparação prévia

Quando o estilo de luta informado já estiver presente:

1. Identifique quais personagens utilizam a modalidade.
2. Analise suas técnicas atuais.
3. Examine suas posturas e movimentações.
4. Identifique os golpes e combos existentes.
5. Verifique quais movimentos caracterizam a modalidade.
6. Desenvolva um repertório individual para o novo personagem.
7. Evite repetir integralmente sequências já implementadas.

**O objetivo é diversificar as técnicas dentro da mesma arte marcial, não inventar outro estilo.**

### 7.2. Exemplo de diferenciação no Boxe

Imagine dois personagens utilizando Boxe.

**Personagem A — Boxe tradicional e pressão ofensiva**

- Guarda alta.
- Jab rápido.
- Cruzado.
- Gancho horizontal.
- Uppercut.
- Sequência de socos em curta distância.
- Avanço constante.

**Personagem B — Boxe técnico e contra-ataque**

- Guarda com movimentação mais solta.
- Jab duplo.
- Direto após esquiva.
- Overhand.
- Gancho no corpo.
- Esquiva lateral com contragolpe.
- Passos curtos e deslocamentos laterais.

Os dois continuam sendo boxeadores, mas possuem movimentos diferentes.

### 7.3. Exemplo de diferenciação no MMA

**Personagem A — MMA com predominância de trocação**

- Jab e cruzado.
- Low kick.
- Joelhada curta.
- Pressão frontal.
- Combos rápidos de socos e joelhadas.

**Personagem B — MMA com predominância de chutes e contra-ataques**

- Chute frontal.
- Chute circular.
- Cotovelada curta.
- Esquiva seguida de contra-ataque.
- Alternância entre curta e média distância.

Os dois utilizam MMA, mas possuem técnicas e comportamentos distintos.

### 7.4. Exemplo de diferenciação no Muay Thai

**Personagem A**

- Cotovelada horizontal.
- Joelhada frontal.
- Chute circular.
- Sequências com clinch.
- Ataques de curta distância.

**Personagem B**

- Teep.
- Low kick.
- Cotovelada giratória.
- Joelhada diagonal.
- Bloqueio de perna seguido de contra-ataque.
- Sequências de média distância.

Ambos mantêm a identidade do Muay Thai.

### 7.5. Exemplo de diferenciação no Kung Fu

**Personagem A**

- Base mais estável.
- Socos em linha central.
- Chutes frontais.
- Golpes de palma.
- Combos curtos e diretos.

**Personagem B**

- Base mais móvel.
- Deslocamentos circulares.
- Chutes laterais.
- Ataques giratórios.
- Sequências com esquivas e contra-ataques.

Ambos permanecem praticantes de Kung Fu, mas demonstram repertórios e padrões de combate diferentes.

### 7.6. Aplicação a qualquer arte marcial

A mesma regra deve ser aplicada a Judô, Karatê, Capoeira, Kickboxing, Savate ou qualquer outra modalidade.

Não se limite a trocar o nome de um golpe.

A diferença deve ser perceptível na animação e na mecânica.

Varie:

- Técnicas selecionadas.
- Sequências.
- Postura e guarda.
- Ritmo de deslocamento.
- Preparação dos ataques.
- Velocidade de execução.
- Alcance.
- Recuperação.
- Contra-ataques.
- Combos.
- Estratégia ofensiva e defensiva.

É permitido compartilhar técnicas fundamentais da mesma modalidade, mas não copiar todo o repertório.

### 7.7. Sprites específicos para as variações

Cada técnica diferenciada deverá possuir representação visual correspondente.

Não utilize os mesmos quadros de combate de outro personagem apenas trocando o rosto, cabelo e roupa.

Se dois personagens executam um jab, a técnica poderá ser semelhante por definição. Entretanto, postura, guarda, execução e continuidade visual devem ser compatíveis com a personalidade de cada lutador.

Movimentos individuais mais elaborados deverão receber sprites próprios.

### 7.8. Integração das diferenças à engine

Implemente as variações sem alterar o funcionamento dos controles.

Preserve os comandos atuais, diferenciando a execução das técnicas.

Configure individualmente:

- Seleção de poses.
- Animações.
- Alcance dos golpes.
- Startup.
- Active frames.
- Recovery.
- Hitboxes.
- Hurtboxes.
- Dano.
- Knockback.
- Rotas de combos.
- Cancelamentos.
- Ritmo de caminhada.
- Recuo e contra-ataque.

Evite criar condicionais genéricas que forcem todos os lutadores da mesma modalidade a utilizar a mesma sequência.

A infraestrutura de combate será compartilhada; a identidade de movimentos será individual.

### 7.9. Critério de aprovação

Antes de concluir, compare o novo personagem com outro personagem que utilize a mesma modalidade.

Execute lado a lado:

1. Postura parada.
2. Avanço e recuo.
3. Sequência de ataques rápidos.
4. Sequência de ataques fortes.
5. Técnicas baixas.
6. Ataques aéreos.
7. Combos.
8. Golpes especiais.
9. Supergolpes.
10. Animação de vitória.

**Mesmo que os nomes dos personagens estejam ocultos, o jogador deve conseguir perceber diferenças entre os estilos individuais de movimentação e combate.**

Não aceite como diferenciação apenas roupas, cores, nomes de ataques ou efeitos visuais.

**O NOVO PERSONAGEM DEVE POSSUIR PERSONALIDADE MARCIAL PRÓPRIA, MESMO QUANDO COMPARTILHA A MODALIDADE COM OUTRO LUTADOR.**

---

## 8. SISTEMA DE COMBOS, COLISÕES E FÍSICA

Integre o novo personagem à engine existente.

A arquitetura atual utiliza passo fixo de física de 120 Hz, enquanto os parâmetros de temporização dos golpes são expressos em quadros de referência de 60 Hz.

Não altere essa estrutura.

### 8.1. Golpes e combos

Desenvolva combos coerentes com o estilo marcial escolhido.

Os combos precisam possuir:

- Sequência lógica de técnicas.
- Transições animadas adequadas.
- Temporização correta.
- Contato visual correspondente ao hitbox.
- Reação coerente do adversário.
- Recuperação após a sequência.
- Possibilidade de interrupção conforme as regras atuais.
- Comportamento determinístico no combate online.

Evite golpes que acertam visualmente antes do contato ou depois que o sprite já retornou à guarda.

### 8.2. Hitboxes e hurtboxes

Configure as colisões de acordo com o corpo e com as técnicas executadas.

As hitboxes devem acompanhar os movimentos efetivos.

As hurtboxes devem representar a geometria corporal de cada pose.

Não utilize hitboxes genéricas incompatíveis com a anatomia do novo personagem.

Teste:

- Socos.
- Chutes.
- Ataques baixos.
- Golpes aéreos.
- Especiais.
- Supergolpes.
- Defesas.
- Agachamento.
- Quedas.
- Recuperação.

O mesmo seletor de pose deverá ser coerente com a representação visual e a geometria de colisão.

### 8.3. Fluidez e continuidade

As transições entre estados precisam evitar travamentos, saltos de quadros indevidos ou mudanças repentinas de posição.

Os movimentos deverão apresentar continuidade entre:

- Parado e caminhando.
- Caminhando e atacando.
- Atacando e recuperando.
- Pulando e atacando.
- Defendendo e contra-atacando.
- Recebendo golpe e recuperando.
- Caindo e levantando.

Não utilize transições que causem deformações, deslocamento instantâneo de membros ou mudança de escala.

---

## 9. PODERES ESPECIAIS E SUPERGOLPE EXCLUSIVOS

Cada personagem precisa possuir poderes individuais.

**NÃO COPIE PODERES DE OUTRO LUTADOR, MESMO QUANDO AMBOS POSSUEM A MESMA DISCIPLINA OU O MESMO ESTILO DE LUTA.**

### 9.1. Identidade dos poderes

Os poderes deverão considerar:

- Disciplina ou área de atuação.
- Personalidade do personagem.
- Estilo marcial.
- Temática própria.
- Identidade visual.
- Mecânicas já disponíveis no jogo.

No caso do Prof. Adriano, professor de História, desenvolva poderes com temática histórica original, diferenciados dos poderes do Prof. Rafael.

Não reutilize os nomes, efeitos, animações ou a lógica exclusiva dos poderes do Rafael.

### 9.2. Golpe especial

Crie um golpe especial com:

- Nome original.
- Animação de preparação.
- Execução correspondente à habilidade.
- Efeito visual próprio.
- Colisão funcional.
- Feedback de impacto.
- Tempo de recuperação.
- Fala exclusiva.

O golpe deve funcionar em ambos os lados da tela.

Projéteis e efeitos precisam respeitar direção, escala, posição e colisões.

### 9.3. Técnica ascendente

Crie um ataque ascendente ou técnica equivalente coerente com o estilo do personagem.

Não utilize automaticamente o mesmo uppercut de outro lutador.

O movimento deve ter sua própria execução, preservando o comando que a engine utiliza.

### 9.4. Supergolpe

Crie um supergolpe individual com apresentação visual de maior impacto.

O supergolpe deverá possuir:

- Nome exclusivo.
- Preparação.
- Animação própria.
- Efeitos especiais.
- Sincronização de voz.
- Execução funcional.
- Reação do adversário.
- Consumo correto da barra de super.
- Recuperação.
- Integração com os efeitos de tela existentes.

Não implemente apenas um projétil comum com tamanho maior.

O supergolpe deve ser reconhecível como uma habilidade especial do personagem.

### 9.5. Preservação do equilíbrio

Os poderes devem respeitar as regras gerais do jogo.

Não introduza habilidades que causem dano ilimitado, colisões inconsistentes, travamento de estados ou comportamentos incompatíveis com o multiplayer.

---

## 10. VOZ ORIGINAL EM PORTUGUÊS BRASILEIRO

A voz será exclusiva do novo personagem.

Não reutilize os arquivos de voz dos personagens existentes.

A interpretação deverá corresponder à personalidade indicada.

### 10.1. Requisitos vocais

- Português brasileiro natural.
- Pronúncia correta.
- Entonação expressiva.
- Voz compatível com o personagem.
- Interpretação convincente de jogo de luta.
- Sem sotaque espanhol.
- Sem sotaque português europeu.
- Sem síntese excessivamente robótica.
- Sem distorção artificial.
- Sem cortes abruptos.
- Sem alterações inconsistentes de timbre entre arquivos.

### 10.2. Falas obrigatórias

Produza áudios próprios para:

1. Seleção do personagem.
2. Golpe especial.
3. Técnica ascendente.
4. Supergolpe.

Inclua outras vocalizações de combate quando forem necessárias para preservar o padrão de áudio dos demais lutadores.

As falas devem corresponder às habilidades reais.

Não crie falas para poderes que não existem.

### 10.3. Integração técnica

Registre os arquivos em `src/audio.js`, utilizando identificadores exclusivos.

Atualize as frases em `src/selection-data.js`.

Configure as durações a partir dos arquivos reais.

Sincronize o início da fala com o evento correspondente.

Não deixe os áudios se sobreporem indevidamente.

Não substitua a geração da voz por simples texto na tela.

Se os recursos de geração de áudio não estiverem disponíveis, declare a pendência em vez de afirmar que a voz está implementada.

---

## 11. TELA DE SELEÇÃO — MESMO PADRÃO DO ELENCO

O novo personagem deve aparecer na seleção exatamente dentro do padrão de apresentação atual.

### 11.1. Retrato

Utilize o rosto da fotografia enviada.

Mantenha:

- Enquadramento equivalente aos demais retratos.
- Mesmo tamanho visual de cabeça.
- Mesma proporção de rosto.
- Mesma resolução de apresentação.
- Mesmo estilo de iluminação.
- Mesmo posicionamento no card.
- Mesmo acabamento.

Não coloque o personagem inteiro em miniatura dentro do espaço reservado ao rosto.

Não altere a aparência facial.

### 11.2. Organização do elenco

Adicione o personagem à categoria correta.

No caso do Prof. Adriano, utilize Professores.

Não altere a organização geral da seleção.

Preserve:

- Grid.
- Cards.
- Tipografia.
- Identificação.
- Navegação.
- Efeitos de seleção.
- Controles.
- Pré-visualização do personagem.
- Frase de seleção.
- Áudio de confirmação.

O personagem deve ficar disponível sem afetar a seleção dos demais lutadores.

---

## 12. INTEGRAÇÃO AOS MODOS DE JOGO

O novo personagem precisa funcionar nos mesmos modos que os demais integrantes do elenco.

### 12.1. Versus Battle — 1 × 1

Integre:

- Seleção.
- Controle por teclado.
- Controle USB.
- Dois jogadores no mesmo computador.
- Combate contra CPU.
- Golpes e combos.
- Defesa.
- Especiais.
- Supergolpe.
- Sistema de rounds.
- Barra de vida.
- Barra de super.
- Vitória e derrota.

Não modifique as regras existentes.

### 12.2. Modo História

Adicione o personagem à campanha Operação Resgate do NIT.

Mantenha:

- Mesma escala visual dos outros heróis.
- Caminhada completa.
- Avanço e recuo.
- Interação com inimigos.
- Colisões.
- Combate.
- Objetos e obstáculos.
- Golpes especiais.
- Supergolpe.
- Animações de queda e recuperação.
- Comportamento adequado à profundidade do cenário.

As proporções devem ser consistentes com o tamanho dos outros personagens no modo História.

Não permita deslizamento artificial ou movimentação apenas abaixo dos joelhos.

### 12.3. Online 1 × 1

Integre o personagem ao sistema online existente.

Preserve:

- Criação de salas.
- Entrada em salas.
- Seleção independente de personagens.
- Sincronização da partida.
- Identificação correta do lutador.
- Inputs.
- Colisões.
- Combos.
- Poderes.
- Rollback.
- Reconexão.

Não altere o protocolo desnecessariamente.

### 12.4. Online História

Inclua o personagem na seleção do modo História online, mantendo a compatibilidade com os mecanismos atuais da campanha cooperativa.

Não modifique o comportamento dos outros heróis.

---

## 13. REGRAS ABSOLUTAS DE PRESERVAÇÃO DO JOGO

Durante toda a implementação, são proibidas as seguintes ações:

1. Alterar personagens existentes.
2. Modificar seus rostos.
3. Substituir suas vozes.
4. Alterar suas proporções.
5. Modificar golpes que já funcionam.
6. Trocar poderes de outros personagens.
7. Remover animações existentes.
8. Copiar integralmente os sprites de outro lutador.
9. Criar movimentação artificial apenas com deslocamento horizontal.
10. Gerar pernas que se movimentam somente abaixo dos joelhos.
11. Produzir sprites com membros desaparecendo.
12. Modificar a engine para corrigir problemas específicos do novo personagem sem necessidade técnica demonstrada.
13. Reduzir a quantidade ou a qualidade de animações para acelerar a implementação.
14. Misturar estilos artísticos diferentes.
15. Gerar falas em português europeu ou espanhol.
16. Reutilizar vozes de outros personagens sem autorização.
17. Substituir os poderes solicitados por efeitos genéricos.
18. Remover suporte a teclado, joystick, multiplayer ou modo História.
19. Declarar que as animações estão corretas sem realizar verificações visuais.
20. Publicar uma versão incompleta como se estivesse finalizada.

**A INCLUSÃO DO NOVO PERSONAGEM NÃO AUTORIZA MODIFICAÇÕES NOS PERSONAGENS ANTERIORES.**

---

## 14. VALIDAÇÃO TÉCNICA E VISUAL

Antes de concluir a implementação, execute os testes existentes e realize verificações específicas do novo personagem.

### 14.1. Testes automatizados

Utilize:

- `npm test`
- `npm run build`
- `npm run review:animation`
- `python scripts/check-sprite-integrity.py`

Adapte as verificações para contemplar o novo personagem, preservando a cobertura dos personagens atuais.

Os testes devem verificar:

- Carregamento dos sprites.
- Estrutura dos atlas.
- Integridade dos JSONs.
- Escalas.
- Âncoras.
- Transparência.
- Identificadores.
- Estados de animação.
- Dados de colisão.
- Compatibilidade com a engine.
- Funcionamento dos poderes.
- Ausência de regressões.

### 14.2. Testes visuais obrigatórios

Produza uma prancha de revisão com as poses do novo personagem.

Verifique cada animação quanto a:

- Fidelidade facial.
- Anatomia.
- Escala.
- Proporções.
- Presença de todos os membros.
- Continuidade.
- Qualidade dos recortes.
- Coerência com a ação executada.
- Identidade do estilo de luta.

Teste a animação no renderizador real do jogo.

A verificação estática de arquivos não substitui a análise visual das animações em movimento.

### 14.3. Comparação com o elenco existente

Coloque o novo personagem em combate contra lutadores já implementados.

Compare:

1. Altura e escala.
2. Qualidade do rosto.
3. Postura.
4. Caminhada.
5. Golpes.
6. Animações de defesa.
7. Queda.
8. Recuperação.
9. Efeitos de poderes.
10. Qualidade sonora.

Caso o novo personagem utilize uma modalidade já existente, execute também a comparação específica de movimentos definida na seção 7.

O resultado precisa demonstrar padronização visual e individualidade marcial.

### 14.4. Verificação de regressões

Confirme que os personagens já existentes continuam com:

- Os mesmos sprites.
- As mesmas vozes.
- Os mesmos golpes.
- Os mesmos poderes.
- As mesmas proporções.
- As mesmas animações.
- Os mesmos controles.
- O mesmo comportamento de combate.

Utilize comparação de arquivos e testes de regressão sempre que possível.

Distinga falhas preexistentes de falhas introduzidas.

---

## 15. ENTREGA E PUBLICAÇÃO NO GITHUB

A implementação deverá ser realizada diretamente no repositório conectado.

Não entregue apenas imagens ilustrativas ou descrições de como adicionar o personagem.

A solicitação é de integração funcional ao projeto.

### Entregáveis obrigatórios

1. Sprites do novo personagem.
2. Atlas preparados.
3. Metadados JSON.
4. Sequência de caminhada.
5. Retrato de seleção.
6. Configuração individual na engine.
7. Estilo marcial e variações de golpes.
8. Combos.
9. Hitboxes e hurtboxes.
10. Poderes e supergolpe.
11. Efeitos visuais.
12. Arquivos de voz.
13. Integração ao sistema de áudio.
14. Integração à seleção.
15. Integração ao 1 × 1.
16. Integração ao modo História.
17. Integração aos modos online.
18. Testes de integridade e regressão.

Crie apenas os arquivos e as alterações necessários.

Após implementar e validar, publique utilizando o fluxo atual de GitHub Pages.

Não modifique desnecessariamente a configuração da hospedagem.

Informe na entrega:

- Arquivos criados.
- Arquivos modificados.
- Funcionalidades implementadas.
- Testes executados.
- Resultados obtidos.
- Pendências efetivas, caso existam.
- Commit da implementação.

Não declare concluídas etapas que não foram efetivamente executadas.

---

## 16. CRITÉRIOS FINAIS DE ACEITAÇÃO

A implementação somente deverá ser considerada completa quando atender aos seguintes requisitos.

### PADRÃO VISUAL

O novo personagem apresenta o mesmo estilo gráfico, qualidade de sprites, proporções e acabamento dos personagens já existentes.

O rosto permanece fiel à fotografia enviada durante todas as animações.

### MOVIMENTAÇÃO

O personagem caminha, recua, luta, salta, defende e executa golpes com movimentação corporal completa.

Não desliza artificialmente.

Não movimenta apenas os joelhos.

Não perde membros durante animações.

### ESTILO MARCIAL

Os golpes correspondem à modalidade informada.

Se a modalidade já existir no jogo, o personagem apresenta variações próprias de técnicas, guarda, animações e combos.

A diferenciação precisa ser perceptível durante a luta.

### PODERES

Os poderes são exclusivos, coerentes com a identidade do personagem e funcionam corretamente.

### VOZ

A voz é individual, natural, em português brasileiro e sincronizada com os golpes.

### INTEGRAÇÃO

O personagem está disponível nos modos de jogo existentes sem comprometer outros lutadores ou funcionalidades.

### QUALIDADE

O novo personagem não apresenta qualidade visual, mecânica ou sonora inferior à do elenco de referência.

## INSTRUÇÃO FINAL — PRIORIDADE MÁXIMA

**O STREET VICENTE FIGHTER DEVE MANTER UMA IDENTIDADE VISUAL E MECÂNICA ÚNICA PARA TODO O ELENCO.**

Não quero que cada novo personagem pareça produzido por um desenvolvedor diferente.

O padrão de sprites, proporções, anatomia, acabamento visual, física, qualidade das animações e estrutura de combate deve permanecer consistente.

**O QUE MUDA ENTRE OS PERSONAGENS É A IDENTIDADE, O ESTILO MARCIAL, A VARIAÇÃO DOS GOLPES, OS COMBOS, OS PODERES E A VOZ.**

Se dois personagens utilizarem o mesmo estilo de luta, varie as técnicas e os movimentos dentro daquela modalidade, sem alterar sua essência.

Não copie movimentos completos e apenas troque o rosto.

Não simplifique a implementação dos próximos personagens.

Não reduza o padrão de qualidade ao aumentar o elenco.

**CRIE UM PERSONAGEM COMPLETO, COM ROSTO FIEL À FOTO, SPRITES CONSISTENTES, MOVIMENTAÇÃO NATURAL DO CORPO INTEIRO, GOLPES ORIGINAIS PARA SEU ESTILO, PODERES EXCLUSIVOS E VOZ PRÓPRIA EM PORTUGUÊS BRASILEIRO.**

O resultado final precisa transmitir a impressão de que todos os personagens do Street Vicente Fighter foram produzidos pela mesma equipe profissional de desenvolvimento de jogos.