# Assets de Street Vicente Fighter

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
