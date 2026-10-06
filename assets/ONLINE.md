# Seleção online — 3.3.0

Entrar por código ou pela busca pública conecta a dupla e mantém a tela de seleção aberta. Cada cliente pode trocar seu próprio personagem; ambos veem a escolha e o estado ESCOLHENDO/CONFIRMADO. Confirmar bloqueia os próprios cards; Alterar personagem desconfirma e libera a troca. A preparação dos atlas só começa quando ambas as confirmações chegam ao anfitrião. A luta inicia depois do carregamento de ambos e da sincronização do relógio.

A sala usa estado autoritativo do anfitrião, revisão monotônica e número de ordem por jogador para evitar que mensagens anteriores substituam escolhas novas. O visitante mantém a escolha otimista até receber a confirmação correspondente. Pacotes de carregamento não iniciam uma partida antes da confirmação dupla. Heartbeat permanece ativo durante a seleção, sem expirar o tempo de conexão enquanto alguém escolhe. Seleções iguais continuam permitidas quando escolhidas intencionalmente.

Protocolo svf-online-3-3-0 e namespace de salas/fila 330 isolam o novo handshake de versões anteriores. Simulação de rollback, controles, pausa e revanche permanecem compartilhados. Validação automatizada usa dois clientes independentes com transporte PeerJS simulado, incluindo escolha durante a conexão, confirmações, troca, mensagens antigas, carregamento lento e desconexão.

## Lista de salas — 3.3.1

As salas criadas por Criar sala são registradas no projeto Supabase rulmufwtytgfmznuduuo. A lista pública atualiza a cada 5 segundos e permite entrar por clique nas salas com “Aguardando jogador”. Ao conectar um adversário, a sala fica ocupada, aparece como “Jogando” e o botão fica desabilitado. A seleção e a confirmação dos dois personagens continuam obrigatórias antes da luta. A busca rápida mantém sua fila PeerJS independente.

O anfitrião renova o registro a cada 20 segundos e remove a sala ao cancelar ou sair. Fechamentos abruptos deixam de aparecer depois de 3 minutos sem heartbeat. O horário de expiração é definido pelo banco. A chave publishable é pública; um token aleatório de 256 bits autoriza somente o anfitrião a alterar ou remover sua sala. Apenas seu hash SHA-256 fica no banco, sem permissão de leitura pública dessa coluna. RLS e privilégios por coluna impedem a alteração de salas de terceiros. O schema aplicado está em assets/rooms-schema.sql.
