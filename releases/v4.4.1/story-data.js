// The campaign is independent of versus rounds. All content and tuning are shared by both peers.
export const STORY_HEROES=Object.freeze(['marcelo','rafael','gustavo','gelton','marcelino','marcos','joao','ruan']);
export const STORY_TITLE='Operação Resgate do NIT';
export const STORY_PREMISE='O sinal bateu. A luta começou. O sistema do Núcleo de Informática e Tecnologia (NIT) sofreu um cyberataque: um vírus de inteligência artificial trancou os portões da escola e tomou o controle da robótica, dos projetores e dos drones de segurança. A IA também corrompeu o conselho disciplinar. Marcelo, Rafael e Gustavo precisam atravessar o colégio e recuperar o servidor central antes do fim do turno.';
export const STORY_ACTS=Object.freeze([
 {id:'patio',title:'O Caos nos Corredores',place:'O Pátio e a Cantina',speaker:'rafael',quote:'No meu tempo, o sinal tocava e íamos em paz para o pátio... no meu tempo não era assim!',action:'Rafael fecha os punhos. O caminho até o Bloco A está tomado pelos equipamentos da escola.',objective:'Atravesse o pátio. Arremesse mesas e cadeiras e acerte as máquinas de refrigerante.',boss:'inspector',waves:[['snack','cleaner','turnstile'],['cleaner','snack','turnstile','snack'],['turnstile','cleaner','snack','cleaner']]},
 {id:'quimica',title:'O Laboratório em Reação',place:'Bloco de Química',speaker:'gustavo',quote:'Deixaram os reagentes instáveis? A culpa é do vírus... Reagiu, perdeu!',action:'Gustavo aplica uma sequência de pontapés de Kickboxing para desarmar a máquina.',objective:'Salte sobre ácido e névoa gelada. Desative os androides antes de avançar.',boss:'fairRobot',waves:[['lab','vial','lab'],['vial','lab','lab','vial'],['lab','vial','lab','lab']]},
 {id:'biblioteca',title:'O Arquivo Morto',place:'A Biblioteca Velha',speaker:'rafael',quote:'Querem apagar os livros impressos? Vou ter de te ensinar a História da velha guarda com os meus próprios punhos!',action:'Rafael assume a base de Boxe. Os arquivos impressos ainda podem ser salvos.',objective:'Evite os scanners e derrube estantes sobre os inimigos. Saia da área marcada.',boss:'substitute',waves:[['scanner','book','archaeologist'],['projector','scanner','book','archaeologist'],['archaeologist','projector','book','scanner']]},
 {id:'nit',title:'O Coração da Rede',place:'A Sala do Servidor e o NIT',speaker:'marcelo',quote:'Chega de lag nesta escola. O servidor é meu... Bora NIT!',action:'Marcelo ativa o modo Overclock de Kung Fu para iniciar a batalha final.',objective:'Desvie dos cabos elétricos. Desative os guardas e abra acesso ao servidor central.',boss:'aula',waves:[['elite','kungfu','elite'],['kungfu','elite','kungfu','elite'],['elite','kungfu','elite','kungfu']]}
]);
export const ENEMY_TYPES=Object.freeze({
 snack:{name:'Drone de lanches',cell:0,hp:185,w:150,h:130,speed:145,range:300,ranged:true,fly:190,damage:24,color:'#e9b349'},
 turnstile:{name:'Catraca de serras',cell:1,hp:260,w:150,h:200,speed:95,range:155,damage:36,color:'#dd6676'},
 cleaner:{name:'Robô de limpeza',cell:2,hp:220,w:150,h:210,speed:135,range:185,damage:31,color:'#7adaf0'},
 lab:{name:'Androide de laboratório',cell:3,hp:270,w:160,h:285,speed:130,range:195,damage:34,color:'#88d5d8'},
 vial:{name:'Proveta explosiva',cell:4,hp:170,w:115,h:190,speed:110,range:390,ranged:true,damage:29,color:'#9dea65'},
 scanner:{name:'Scanner laser',cell:5,hp:210,w:130,h:210,speed:125,range:450,ranged:true,damage:28,color:'#ff5579'},
 book:{name:'Livro virtual',cell:6,hp:145,w:140,h:135,speed:150,range:280,ranged:true,fly:180,damage:25,color:'#cb9bff'},
 archaeologist:{name:'Drone arqueólogo',cell:7,hp:220,w:160,h:140,speed:155,range:310,ranged:true,fly:200,damage:28,color:'#ddb374'},
 elite:{name:'Guarda cibernético',cell:8,hp:310,w:155,h:285,speed:160,range:200,damage:39,color:'#6af7b3'},
 kungfu:{name:'Protótipo de Kung Fu',cell:9,hp:290,w:170,h:290,speed:185,range:215,damage:38,color:'#b9fb82'},
 inspector:{name:'Inspetor-Geral do Bloco A',cell:10,hp:1150,w:225,h:285,speed:190,range:195,damage:95,boss:true,color:'#f5af62'},
 fairRobot:{name:'Robô de Bordo da Feira de Ciências',cell:11,hp:1300,w:285,h:340,speed:100,range:460,damage:53,boss:true,color:'#f6c56a'},
 substitute:{name:'Professor Substituto Corrompido',cell:12,hp:1200,w:220,h:285,speed:220,range:245,damage:80,boss:true,color:'#cf97f8'},
 aula:{name:'A.U.L.A. 3.0 · Holograma',cell:13,hp:1250,w:175,h:285,speed:250,range:330,damage:76,boss:true,color:'#62ffc0'},
 exo:{name:'A.U.L.A. 3.0 · Exoesqueleto',cell:14,hp:1600,w:320,h:350,speed:150,range:290,damage:110,boss:true,color:'#8bffae'},
 projector:{name:'Projetor corrompido',cell:15,hp:220,w:150,h:195,speed:110,range:460,ranged:true,damage:26,color:'#b898ff'}
});
export const STORY_RULES=Object.freeze({worldWidth:3600,laneTop:520,laneBottom:660,laneReach:42,turnSeconds:900,gates:[820,1680,2540],bossGate:3320,checkpointKey:'svf-story-checkpoint-v1'});
