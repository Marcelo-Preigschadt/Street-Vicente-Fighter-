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
