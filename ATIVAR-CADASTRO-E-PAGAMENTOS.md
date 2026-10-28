> **Acesso atual:** todas as atividades exigem assinatura. O proprietário tem acesso pelo painel master após seguir [ATIVAR-ACESSO-MASTER.md](ATIVAR-ACESSO-MASTER.md). Não há mais demonstrações gratuitas.

> **Já configurou os serviços?** Para esta versão, faça também os passos de [ATUALIZAR-GOOGLE-E-PERFIL.md](ATUALIZAR-GOOGLE-E-PERFIL.md), incluindo tabela de perfis, retorno de confirmação e Google.

# Como ativar cadastro e mensalidade de R$ 50,00

O código está preparado, mas você precisa criar e configurar seus serviços. **Comece em modo de teste: nenhum cartão real deve ser cobrado nesta etapa.** Nunca envie chaves secretas pelo chat nem cole no GitHub.

## 1. Criar o serviço de contas no Supabase

1. Acesse https://supabase.com, crie sua conta e um projeto. Guarde a senha do banco com segurança; ela não é usada no aplicativo.
2. Abra o **Editor SQL**, crie uma consulta, copie o conteúdo inteiro de `supabase/schema.sql` deste repositório e execute. O arquivo cria as tabelas financeiras e restringe a escrita ao servidor.
3. Em **Autenticação → Provedores**, habilite login por **E-mail**, mantendo **confirmar e-mail** habilitado. Configure o comprimento mínimo da senha como 8 ou mais.
4. Em **Autenticação → Configuração de URL**, use:
   - URL do site: `https://falabrinca-43kf.vercel.app`
   - URLs de redirecionamento permitidas: `https://falabrinca-43kf.vercel.app/conta` e `https://falabrinca-43kf.vercel.app/recuperar-senha`, além de `https://falabrinca-43kf.vercel.app/auth/continuar`.
   - Para desenvolvimento local, adicione também `http://localhost:3000/conta` e `http://localhost:3000/recuperar-senha`.
5. Em **Configurações do projeto → API** (ou **Chaves de API**), localize a URL do projeto, a chave pública `anon` e a chave secreta de servidor `service_role` nas chaves legadas. A chave `service_role` nunca pode aparecer no navegador ou em uma variável com prefixo `NEXT_PUBLIC_`.
6. Antes de abrir cadastros ao público, configure **SMTP próprio** em Autenticação para envio de confirmação e recuperação de senha. O serviço de e-mail de teste do Supabase possui limites e restrições de destinatário. Ative as proteções de autenticação disponíveis e confira os limites de envio.

## 2. Criar o plano no Stripe

1. Crie uma conta em https://stripe.com e selecione o ambiente **de teste** ou sandbox.
2. No **Catálogo de produtos**, crie “Exploradores do Dino”.
3. Adicione um preço **recorrente**, **mensal**, de **R$ 50,00**, moeda **BRL**. Copie o identificador `price_...`.
4. Localize a chave secreta do ambiente de teste (`sk_test_...`). Não use a chave publicável no lugar da secreta.
5. Configure o **Portal do cliente** para permitir atualização do pagamento e **cancelamento ao final do período pago**. Desative mudanças de plano nesta primeira versão. Configure nome comercial, suporte e políticas no Stripe.
6. Em **Workbench → Webhooks** (a localização pode variar), adicione um destino:
   - URL: `https://falabrinca-43kf.vercel.app/api/webhooks/stripe`
   - Eventos: `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
   - Copie o segredo de assinatura do destino (`whsec_...`). Cada ambiente possui seu próprio segredo.

A rota verifica assinatura criptográfica do webhook. Não teste abrindo sua URL no navegador: ela aceita somente POST assinado pelo Stripe.

## 3. Preencher as variáveis na Vercel

No projeto **FalaBrinca → Configurações → Variáveis de ambiente**, adicione estas variáveis no ambiente **Produção**:

| Nome                            | Valor a preencher                                         |
| ------------------------------- | --------------------------------------------------------- |
| `APP_URL`                       | `https://falabrinca-43kf.vercel.app` — sem barra no final |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do seu projeto Supabase                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon do Supabase                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave secreta service_role do Supabase                    |
| `STRIPE_SECRET_KEY`             | Chave secreta de teste do Stripe                          |
| `STRIPE_PRICE_ID`               | Identificador do preço mensal de R$ 50,00 criado no teste |
| `STRIPE_WEBHOOK_SECRET`         | Segredo do destino webhook de teste                       |

Marque as chaves secretas como sensíveis quando essa opção estiver disponível. Não adicione prefixo `NEXT_PUBLIC_` a nenhuma chave secreta. A URL e a chave `anon` do Supabase são públicas por projeto; as permissões dos dados são garantidas pela autenticação e RLS.

Depois, abra **Implantações → implantação mais recente → três pontos → Reimplantar**. As variáveis `NEXT_PUBLIC_*` entram no build: salvar uma variável sem reimplantar não atualiza a tela de cadastro.

Se usar outro domínio, atualize `APP_URL`, redirecionamentos do Supabase e destino webhook. Não use a URL de prévia com variáveis de produção; cada ambiente deve ter seu próprio conjunto de credenciais.

Para testar localmente, copie `.env.example` para `.env.local`, preencha com os dados de teste e reinicie o servidor. Para encaminhar webhooks locais, use o Stripe CLI com `stripe listen --forward-to localhost:3000/api/webhooks/stripe` e use o segredo `whsec_...` que esse comando informa, somente no arquivo local.

## 4. Testar o caminho completo

1. No app, abra **Área dos adultos**, responda a soma e clique em **Criar conta ou entrar**.
2. Cadastre um **e-mail do responsável** com senha de pelo menos 8 caracteres e leia as informações de uso. Criar conta não cobra nada.
3. Abra o e-mail e confirme o cadastro. O app deve voltar conectado e pedir seu nome, o primeiro nome da criança e a autorização. Preencha e salve. Se o link estiver expirado, use o reenvio de confirmação.
4. Confira “Sem assinatura” e **R$ 50,00/mês**. Clique em **Assinar por R$ 50,00/mês**.
5. No checkout de teste, confirme o preço e utilize um cartão de teste autorizado pela documentação do Stripe — por exemplo, `4242 4242 4242 4242`, data futura e CVC de teste. Nunca use cartão real no ambiente de teste.
6. Ao retornar, clique em **Atualizar status**. O acesso só será liberado se o servidor consultar uma assinatura ativa no Stripe. O endereço `?checkout=success` por si só não libera nada.
7. Abra **Explorar a trilha de assinantes** e escolha e conclua uma das atividades da biblioteca. Saia da conta e tente abrir novamente: deve exigir login.
8. Em **Gerenciar assinatura e cancelamento**, cancele a renovação. Volte e atualize o status: deverá indicar acesso até o fim do período pago.
9. No Stripe, confira que os eventos foram entregues ao webhook com resposta **200**. Use **Reenviar** para verificar que o mesmo evento não duplica registros. Confira no Supabase o cliente e o resumo da assinatura.
10. Teste **Esqueci minha senha**, receba o e-mail, defina uma senha nova e confirme novo login.
11. Teste checkout cancelado, cartão recusado e eventos de inadimplência/encerramento usando as ferramentas de teste do Stripe. Confira que assinaturas inativas não abrem a trilha premium.
12. Use outra conta de responsável e confirme que ela não vê nem gerencia a assinatura da primeira.

Todas as atividades exigem conta confirmada e assinatura ativa; somente o proprietário configurado como master é dispensado da assinatura. O cadastro é dos responsáveis; não cadastre a criança.

## 5. Antes de começar a vender

Ainda será necessário cadastrar a identificação comercial e um canal real de atendimento no aplicativo, revisar termos e privacidade, definir atendimento de reembolso/arrependimento e solicitações de dados e configurar a proteção contra abuso na hospedagem. A página `/informacoes` informa como a versão atual funciona, mas não substitui essa preparação comercial.

Depois de concluir os testes e a preparação comercial:

1. Ative sua conta comercial Stripe conforme os requisitos solicitados pelo provedor.
2. Crie novamente o produto e o preço de **R$ 50,00/mês** no ambiente real. O identificador de teste não funciona no real.
3. Configure o portal e o webhook também no ambiente real.
4. Substitua na Vercel somente as credenciais Stripe pelo conjunto real correspondente (chave, preço e segredo de webhook).
5. Reimplante e confira o preço apresentado no checkout antes da divulgação.

Não há sincronização de estrelas, favoritos ou histórico entre dispositivos nesta versão. Cancelar a renovação é diferente de reembolsar uma compra: reembolsos são administrados pelo responsável no Stripe, respeitando os direitos aplicáveis.
