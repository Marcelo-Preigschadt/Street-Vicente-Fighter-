# Assets de Street Vicente Fighter

## Estilos de luta — versão 2.4

O built-in `image_gen` criou três novos atlases transparentes 4 × 4 de 16 poses completas, usando os respectivos atlases base como referências de identidade, roupa, proporções e estética. Arquivos: [marcelo-style.webp](marcelo-style.webp), [rafael-style.webp](rafael-style.webp), [gustavo-style.webp](gustavo-style.webp). Os prompts integrais estão em [styles-prompts.json](styles-prompts.json). PNG gerado convertido para WebP de qualidade 92, alpha preservado. Todos os atlases antigos, o cenário e os WAV ficaram byte a byte iguais.

Ordem de poses: guarda e guarda alternativa; preparação e extensão do soco; preparação e extensão do segundo ataque; preparação e extensão do soco baixo; preparação e extensão do golpe baixo; preparação e extensão do soco aéreo; preparação e extensão do segundo ataque aéreo; aproximação e golpe de contato curto.

Marcelo usa palma, cotovelo, joelhada e chute de contenção. Rafael usa jab, cruzado, gancho, uppercut e golpes no corpo, sem chutes. Gustavo usa socos, circular, low kick e chute lateral voador. Ataques fortes específicos selecionam a pose de cotovelo ou uppercut. Cada quadro é uma silhueta inteira e opaca, com escala uniforme, sem recortar ou distorcer membros. Células usam margem de análise de 64 pixels e extração da maior silhueta conectada para preservar mãos e calçados que ultrapassam a grade nominal.

`src/styles-data.js` registra as áreas vulneráveis e de contato medidas nos pixels opacos, com o mesmo eixo, baseline, escala e seletor de pose usados pelo renderer. Técnicas e rotas ficam em `src/styles.js`; [fontes e sequências](FIGHTING-STYLES.md). A caminhada anterior continua calibrada pelo deslocamento efetivo; a nova guarda não altera a passada.

Sprites e cenário gerados com a ferramenta nativa imagegen. As fotos enviadas foram referências de identidade facial; os corpos, roupas complementares e poses foram ilustrados para o jogo. As imagens geradas foram convertidas para WebP com qualidade 91 e transparência preservada. Os originais das fotos não são distribuídos.

## Especificações dos sprites

Um atlas transparente de quatro colunas e quatro linhas por personagem, 16 poses. Corpo inteiro, mesma identidade e roupa em todas as células, voltado para a direita. Estética de lutadores digitalizados e pintados de jogos arcade dos anos 1990. Sem texto, fundo ou efeitos incluídos nos sprites.

Ordem das poses, da esquerda para a direita e de cima para baixo:

1. Guarda; guarda alternativa; passo de caminhada; passo contrário.
2. Salto; agachamento; preparação de soco; soco estendido.
3. Preparação de chute; chute alto; defesa; reação a golpe.
4. Preparação do especial; lançamento do especial; vitória; nocaute.

**Prof. Marcelo:** identidade facial da primeira fotografia; barba cheia e escura, cabelo escuro penteado para trás, polo verde oliva, jeans escuro e tênis escuro.

**Prof Rafael:** identidade facial da segunda fotografia; cabelo escuro curto, rosto oval e barba discreta, camisa azul clara com mangas dobradas, jeans escuro e calçados marrons.

## Especificação do cenário

Arena horizontal 16:9, laboratório de informática de uma escola brasileira, sem pessoas ou texto. Arte original com estética arcade, computadores, janelas, lousa verde, livros e luz de fim de tarde. Primeiro plano amplo e livre para o combate.

## Atlas adicionais de combate — versão 2.0

Gerados com a ferramenta nativa imagegen, usando cada atlas original como referência de identidade e estilo. Arquivos: `marcelo-combat.webp` e `rafael-combat.webp`; transparência preservada, qualidade WebP 90. Os atlases originais e o cenário permanecem byte a byte iguais. Os prompts completos estão em [combat-prompts.json](combat-prompts.json).

Ordem das 16 novas poses (índices 0 a 15):

- 0–3: preparação e extensão de soco agachado; preparação e extensão de rasteira.
- 4–7: preparação e extensão de soco aéreo; preparação e extensão de voadeira.
- 8–11: guarda neutra de calibração; guarda baixa; preparação e salto do antiaéreo.
- 12–15: queda; levantar; tentativa de agarrão; aterrissagem.

A renderização usa as poses de queda completas dos atlases originais. A análise dos novos atlases usa células com margem de 64 pixels e seleciona e extrai somente os pixels da maior silhueta conectada, excluindo fragmentos de outras poses, para preservar braços, pés e punhos que ultrapassam levemente a grade nominal. O tamanho é calibrado pela guarda neutra. Alcance e altura dos golpes são medidos no punho ou calçado da pose ativa.

Os poderes são desenhados por Canvas: janelas de código e trilhas binárias para informática, pergaminhos, marcos em algarismos romanos e escudos para história. Os efeitos acompanham a posição física dos projéteis e do golpe ascendente.

## Calibração de colisões — versão 2.1

Os quatro atlases aprovados foram mantidos byte a byte. `src/hitboxes.js` registra áreas vulneráveis de cabeça, tronco e pernas para as 16 poses de cada atlas e professor, medidas na silhueta opaca e relativas ao eixo e aos pés usados pela renderização. Cabeça e tronco consideram a região central; braços e pernas estendidos também recebem área vulnerável durante a extensão e o início do recolhimento. Um seletor compartilhado em `src/engine.js` escolhe a pose para o desenho e para a colisão, inclusive em caminhada, reação agachada e aterrissagem.

O contato ativo continua calibrado no punho/calçado, e a caixa que impede os corpos de se atravessarem é independente das áreas de golpe. Os sons, falas, efeitos temáticos e arquivos de imagem permanecem iguais à versão 2.0.2.

Na versão 2.1.1, cada quadro mostra uma única pose opaca, inclusive na caminhada. A interpolação da posição mantém o deslocamento suave sem misturar a transparência das imagens. Agachar, defender baixo, aterrissar, levantar e atacar mostram a silhueta correspondente à colisão, evitando a sobreposição de um corpo em pé com outro agachado.

## Caminhada articulada e super — versão 2.2

Os quatro atlases e todos os WAV aprovados permanecem byte a byte. A caminhada é uma animação por Canvas da própria guarda neutra: recortes opacos de coxas, panturrilhas e calçados são ligados a uma cadeia de duas articulações por perna. A face e a roupa do tronco são desenhadas diretamente do original. Sobreposição nos joelhos e tornozelos oculta as emendas sem fazer transição por transparência entre corpos completos.

`src/walk.js` calcula joelhos por cinemática inversa, apoio de cada pé, elevação durante a passagem e rotação do calçado. Cada ciclo corresponde a 200 pixels efetivamente percorridos. A metade de apoio cancela o deslocamento do corpo; a metade de passagem tem trajetória curva. Renderização e área vulnerável inferior usam os mesmos tornozelos e calçados. As áreas aprovadas de cabeça e tronco são mantidas, com o deslocamento vertical de respiração da caminhada. As caixas de separação dos corpos e os parâmetros de rasteira, salto e golpes da versão 2.1 continuam iguais.

`src/super-fx.js` mantém relógios separados para barra completa, abertura do super e impactos. Os efeitos de tela são desenhados no Canvas: fundo azul escuro, raios, anéis, halo, clarão curto e faixa com o nome do golpe. Verde é a identidade visual de Kernel Panic; âmbar é a de Marcha dos Séculos. A abertura congela a simulação por 14 quadros antes de integrar os lutadores/projéteis, enquanto a apresentação continua. Pausa e troca de round limpam ou suspendem os efeitos conforme o contexto. Nenhum asset visual ou voz da Capcom foi acrescentado nesta revisão.


## Prof. Gustavo e caminhada completa — versão 2.3

A foto fornecida de Gustavo foi usada como referência de identidade; os atlases aprovados dos professores anteriores foram usados como referência de estilo. O built-in `image_gen` gerou `gustavo.webp`, `gustavo-combat.webp` e os três `*-walk.webp`, com fundo transparente. Os PNG originais foram convertidos para WebP preservando o alpha. Prompts completos: [gustavo-prompts.json](gustavo-prompts.json) e [walk-prompts.json](walk-prompts.json).

Base e combate mantêm as 16 poses na ordem dos professores anteriores. Cada caminhada tem oito poses completas em quatro colunas por duas linhas. O renderer desenha uma única silhueta inteira e opaca em cada quadro. Foram removidos os recortes e a cinemática inversa da versão 2.2, que produziam emendas visíveis no quadril e nos joelhos. Escala uniforme por quadro e alinhamento pela pelve mantêm a altura do personagem. Desenho e colisão selecionam o mesmo quadro por distância efetiva, com reversão da sequência ao recuar.

As áreas vulneráveis e o alcance dos golpes de Gustavo foram medidos nos pixels opacos da nova arte. As áreas de guarda e combate dos professores anteriores, os parâmetros gerais de movimento/golpes e os efeitos de super permanecem iguais. As novas áreas de caminhada foram medidas nos três atlases completos.

Os poderes de Gustavo são desenhos por Canvas: um núcleo carregado com elétrons para Pulso Iônico; uma coluna de calor, bolhas e ΔH < 0 para Reação Exotérmica; moléculas com ligações e três ondas para Reação em Cadeia. A tela de ativação do super segue o padrão existente com identidade ciano/violeta.

As três falas foram geradas com voz de catálogo Mark, `eleven_v3`, `[shouting]`, `pt-br`, velocidade 1.15, e integradas como WAV PCM mono de 16 bits a 22.050 Hz. Os sprites e WAV anteriores foram verificados contra os hashes Git da versão 2.2.0. O clipe original Bora NIT mantém suas amostras.


## Movimento e tontura — 2.5.0

Novos assets de projeto: `assets/marcelo-motion.webp`, `assets/rafael-motion.webp` e `assets/gustavo-motion.webp`. Criados com o imagegen integrado, fundo transparente e o atlas de estilo de cada professor como referência de identidade. Rostos, roupas e desenho dos atlases anteriores foram preservados. Os prompts completos estão em [motion-prompts.json](motion-prompts.json).

Cada atlas tem 4 × 4 células. Índices 0–7: ciclo de passos em guarda; 8–9: entrada; 10–11: recuo; 12–15: desequilíbrio em pé após tontura. São silhuetas completas, sem deformação procedural das pernas. Os arquivos finais foram convertidos para WebP com alpha, qualidade 94. O recorte usa o maior componente conectado em cada célula com margem de 40 px; o eixo do corpo é calibrado na faixa do quadril. Uma escala uniforme por atlas preserva a altura e o abaixamento natural das poses. As áreas de cabeça, tronco e pernas foram medidas nos mesmos recortes e eixos usados pelo renderizador e registradas em `src/motion-data.js`.

Animação por distância efetiva: Krav Maga 160 px por ciclo, boxe 128 px, kickboxing 196 px. A física determina o progresso dos passos; colisão ou parede para o ciclo. A animação de tontura usa 4 poses a 7 quadros/s, com estrelas desenhadas no Canvas e recuperação regida pelo motor. Nenhuma fala ou poder aprovado foi modificado.

## Golpes, reações e energia — 2.6.0

Marcelo passa a kung fu; boxe de Rafael e kickboxing de Gustavo são mantidos. Novos arquivos adicionais por professor: `*-strike-v3.webp` (4 colunas × 4 linhas: direto, frontal/gancho/circular, soco no corpo, retorno/uppercut/circular alto), `*-low-v3.webp` (4 × 2: rasteira/gancho no corpo, golpe aéreo) e `*-reaction-v3.webp` (4 × 4: guarda/contra de defesa, reação na cabeça, no corpo, agachada). Cada golpe tem preparação, rotação, contato e recolhimento; reações também têm quatro poses. Toda imagem é de corpo inteiro, opaca sobre transparência real; nenhum membro recebe deformação.

Prompts exatos dos nove atlases finais: `alpha-prompts.json`. O renderer extrai a maior silhueta conectada de cada célula com margem de 96 px, pois as fileiras agachadas da arte não ocupam a mesma altura das fileiras em pé. Eixo pela pelve; chutes estendidos usam o pé de apoio; golpes aéreos usam o lado do tronco. Escala uniforme por atlas. `src/technique-data.js` mede cabeça, tronco, pernas e extremidade do punho/pé na mesma imagem opaca, relativa a esse eixo e aos pés. Seletor compartilhado em `src/technique.js` garante pose física e pose desenhada idênticas.

`src/fight-fx.js` desenha clarões de contato direcionais de curta duração, centelha curva de bloqueio, poeira ao pousar, anéis de lançamento, núcleos de energia, trilhas curvas e motivos de código, história e química. Não há números de dano sobre os rostos. Relógios de apresentação avançam no hitstop e ficam parados durante pausa. Limites por lista de efeitos evitam acúmulo. Efeitos decorativos são reduzidos por `prefers-reduced-motion`.

Referências primárias e custos próprios das adaptações de Combo Livre, contra de defesa e levantamento rápido estão em `FIGHTING-STYLES.md`. Cenário, todos os atlases anteriores e todos os WAV continuam byte a byte. Vozes e frases aprovadas não são regeneradas. Os impactos fortes ganham reforço grave sintetizado; as vozes permanecem nos mesmos arquivos e canais.
