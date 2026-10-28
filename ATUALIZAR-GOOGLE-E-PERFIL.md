# Atualização visual, confirmação por e-mail e Google

A versão nova tem **27 atividades com 81 rodadas**. A área infantil usa figuras, sequências de imagens, botões com símbolos e áudio. Não exige leitura. Textos de cadastro, mensalidade, privacidade e instruções para os responsáveis ficam na área adulta. Todas as atividades exigem assinatura ativa. O preço permanece R$ 50,00/mês. Para o editor de conteúdo, veja também ATIVAR-ACESSO-MASTER.md.

## 1. Atualizar o banco para guardar os nomes

Esta etapa é necessária mesmo que você já tenha configurado pagamentos.

1. Abra seu projeto no Supabase → **Editor SQL → Nova consulta**.
2. No GitHub, abra `supabase/profile-migration.sql` e copie o conteúdo inteiro. Não copie somente o endereço do arquivo.
3. Cole no Editor SQL e clique em **Executar**.

Isso cria somente a tabela de perfis da família e suas permissões; não altera cobranças ou assinaturas. A tabela tem RLS ativada e não permite leitura ou escrita direta com chave pública. As operações passam por uma API que verifica o usuário e usa seu identificador autenticado, nunca um ID escolhido pelo navegador. Não é necessário executar novamente o esquema financeiro inteiro.

Cada conta de responsável tem um perfil familiar nesta versão. O formulário pede nome do responsável, primeiro nome da criança e autorização explícita do responsável legal. É possível editar ou apagar esses nomes na conta. Não há foto, data de nascimento ou gravação de voz.

## 2. Fazer o link de confirmação voltar para a tela certa

No Supabase → **Autenticação → Configuração de URL**:

- Mantenha a URL do site: `https://falabrinca-43kf.vercel.app`.
- **Adicione**, sem remover as URLs existentes: `https://falabrinca-43kf.vercel.app/auth/continuar`.
- Mantenha também `/conta` e `/recuperar-senha`, para links antigos e recuperação.
- Para testar localmente, adicione `http://localhost:3000/auth/continuar`.

No Supabase → **Autenticação → Modelos de e-mail → Confirmar cadastro**, confira se o botão usa `{{ .ConfirmationURL }}`. Se o botão apontar manualmente para `/conta` ou para uma tela de login, restaure o link de confirmação do Supabase. Nunca coloque um código fixo nesse modelo.

Você pode personalizar o texto do e-mail assim, mantendo o endereço dinâmico do botão:

```html
<h2>Seu cantinho no FalaBrinca está quase pronto 🦕</h2>
<p>
  Confirme seu e-mail para continuar. Depois, você vai preencher seu nome e o
  primeiro nome da criança, sem digitar a senha novamente.
</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar e-mail e continuar</a></p>
<p>Se você não pediu esse cadastro, pode ignorar esta mensagem.</p>
```

O app aceita o retorno com sessão no fragmento da URL, código de autenticação e token de e-mail. Depois de validar o acesso com o Supabase, encaminha para o formulário de família. Um link expirado ou sem sessão mostra uma explicação e opção de reenviar; não inventa uma autenticação. Usuários já existentes também recebem o formulário ao entrar pela primeira vez após esta atualização.

## 3. Habilitar “Continuar com Google”

O botão já está implementado. Ele só consegue autenticar de verdade quando o Google e o Supabase estiverem configurados:

1. No Supabase, abra **Autenticação → Provedores → Google**. Copie a **URL de retorno/callback** mostrada ali. Ela normalmente é `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
2. Abra https://console.cloud.google.com e crie ou selecione um projeto.
3. Na **Plataforma de autenticação do Google** (ou **APIs e serviços → Tela de consentimento OAuth**), configure o nome FalaBrinca, e-mail de suporte e os dados solicitados. O aplicativo autentica o adulto, não a criança.
4. Em **Clientes → Criar cliente**, escolha **Aplicativo da Web**. Algumas telas usam **Credenciais → Criar credenciais → ID do cliente OAuth**.
5. Em **Origens JavaScript autorizadas**, adicione `https://falabrinca-43kf.vercel.app`.
6. Em **URIs de redirecionamento autorizados**, cole exatamente a URL de callback que você copiou do Supabase. **Aqui é o callback do Supabase**, não o `/auth/continuar` do FalaBrinca.
7. Salve e copie o **ID do cliente** e o **segredo do cliente** diretamente para a configuração do provedor Google no Supabase. Habilite o provedor e salve.
8. Se a configuração do Google estiver em **Teste**, adicione seu e-mail como usuário de teste. Antes de oferecer o login ao público, conclua a configuração de público/publicação exigida pelo Google.

Não adicione o segredo do Google em variáveis `NEXT_PUBLIC_*`, no GitHub ou no chat. Nenhuma nova variável Google é necessária na Vercel: o segredo é configurado no provedor Supabase.

O fluxo é: **Google → confirmação do provedor → FalaBrinca → nomes da família**. Se o perfil já existir, abre diretamente a conta. O login não contrata assinatura.

## 4. Conferir a publicação e testar

1. Aguarde a publicação da nova versão na Vercel concluir. Se alterar as variáveis de ambiente, reimplante.
2. Cadastre um e-mail novo. A tela deve explicar onde procurar a mensagem e o que acontece em cada etapa.
3. Abra o link mais recente do e-mail. Você deve voltar conectado, no formulário dos nomes, sem outra tela de login.
4. Preencha os nomes e marque a autorização. Salve e abra as brincadeiras.
5. Saia e entre com Google. Se usar uma conta nova, também deve aparecer o formulário da família.
6. Teste editar/apagar os nomes na conta, sem afetar a assinatura.
7. No jogo, confirme: só figuras nas respostas e nas peças da história; alto-falante repete instruções, lâmpada ajuda, pausa interrompe a brincadeira. Teste em um celular real, pois vozes e aparência dos pictogramas variam conforme o dispositivo.

O progresso, estrelas, favoritos e histórico continuam somente no navegador/dispositivo, separados do perfil no banco. Não há avaliação de fala ou comparação entre crianças. O aplicativo é educativo e não substitui terapia fonoaudiológica.

## Como diagnosticar

- **“O perfil da família ainda não está disponível”**: execute `supabase/profile-migration.sql` no projeto Supabase que está ligado à Vercel.
- **Google retorna “provider is not enabled”**: habilite Google no Supabase.
- **Google retorna `redirect_uri_mismatch`**: confira o callback do Supabase no cliente OAuth do Google.
- **Link vai para o lugar errado**: confira a lista de URLs permitidas e o modelo de confirmação do Supabase. Solicite um novo e-mail após corrigir.
- **Link expirou**: volte ao cadastro e use Reenviar confirmação; não precisa criar outra conta.
