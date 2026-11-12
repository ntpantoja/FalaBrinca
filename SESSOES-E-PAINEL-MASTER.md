# Sessões e entrada master

## Dashboard

A conta master, validada no servidor pelo `MASTER_USER_ID`, abre `/admin` após entrar por e-mail, Google ou ao acessar o link inicial com uma sessão válida. A decisão de privilégio continua sendo do servidor; dados locais de perfil não concedem acesso administrativo.

O dashboard oferece atalhos para:

- **Gestão de conteúdo** (`/admin/conteudo`): cards, imagens e gravação de áudio.
- **Área do usuário** (`/atividades`): conferir as atividades sem sair da conta master.
- **Minha conta** (`/conta?gerenciar=1`): consultar o próprio acesso sem redirecionamento automático.
- **Meus dispositivos** (`/dispositivos`): consultar e desconectar aparelhos.

O link antigo `/admin/clientes` continua abrindo o dashboard. O editor usa as mesmas APIs protegidas; as atividades existentes não foram movidas no banco. Esta mudança não exige SQL ou chaves novas.

## Permanência do login

Não havia um temporizador do app para sair por inatividade. Foram encontrados e ajustados caminhos que poderiam parecer uma desconexão:

- Falhas temporárias do serviço de autenticação eram respondidas como sessão expirada. Agora falhas de rede/serviço são tratadas separadamente e não autorizam conteúdo por fallback.
- O botão de sair usava o padrão global do Supabase, que invalida também a renovação de outras sessões da mesma conta. Agora a saída é local, apenas no navegador atual.
- As consultas protegidas recuperam a sessão persistida, renovam o token quando necessário e tentam novamente uma única vez se o servidor rejeitar um token antigo. Renovações simultâneas compartilham a mesma operação.
- Uma indisponibilidade temporária permite tentar de novo sem apagar a sessão ou confundir a falha com falta de assinatura.

O armazenamento e a renovação automática foram deixados explícitos na configuração do Supabase. A chave de armazenamento permanece a mesma, preservando as sessões existentes. A autenticação e a checagem dos três dispositivos continuam obrigatórias.

## O que conferir no Supabase caso continue acontecendo

Não foi possível inspecionar as configurações da sua conta real neste ambiente. Em **Authentication**, procure as configurações de sessão, quando disponíveis no seu plano:

- **Inactivity timeout**: se houver um limite curto, ele pode encerrar a sessão após uma pausa. Para a experiência solicitada, não configure expiração por inatividade.
- **Time-box user sessions / Session timebox**: um limite de duração total exige login novamente ao terminar, mesmo com renovação de token.
- **Single session per user**: deixe desativado se quiser permitir os três aparelhos. O próprio app limita os dispositivos; restringir a uma sessão no Supabase derruba os anteriores.

Não é necessário transformar o token de acesso em um token sem validade. A renovação usa o refresh token. Senha alterada, sessão revogada, exclusão dos dados do navegador, navegação anônima ou políticas do navegador ainda podem exigir novo login. O modo instalado e o navegador podem ter armazenamentos diferentes.

Nos testes locais, foram verificadas a restauração de uma sessão com token vencido, a renovação após uma rejeição, a recuperação após falha temporária e a saída com escopo local. Isso não reproduz todas as configurações e políticas de um celular real; a causa exata do relato depende de conferir o ambiente real caso persista.
