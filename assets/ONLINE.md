# Seleção online — 3.3.0

Entrar por código ou pela busca pública conecta a dupla e mantém a tela de seleção aberta. Cada cliente pode trocar seu próprio personagem; ambos veem a escolha e o estado ESCOLHENDO/CONFIRMADO. Confirmar bloqueia os próprios cards; Alterar personagem desconfirma e libera a troca. A preparação dos atlas só começa quando ambas as confirmações chegam ao anfitrião. A luta inicia depois do carregamento de ambos e da sincronização do relógio.

A sala usa estado autoritativo do anfitrião, revisão monotônica e número de ordem por jogador para evitar que mensagens anteriores substituam escolhas novas. O visitante mantém a escolha otimista até receber a confirmação correspondente. Pacotes de carregamento não iniciam uma partida antes da confirmação dupla. Heartbeat permanece ativo durante a seleção, sem expirar o tempo de conexão enquanto alguém escolhe. Seleções iguais continuam permitidas quando escolhidas intencionalmente.

Protocolo svf-online-3-3-0 e namespace de salas/fila 330 isolam o novo handshake de versões anteriores. Simulação de rollback, controles, pausa e revanche permanecem compartilhados. Validação automatizada usa dois clientes independentes com transporte PeerJS simulado, incluindo escolha durante a conexão, confirmações, troca, mensagens antigas, carregamento lento e desconexão.
