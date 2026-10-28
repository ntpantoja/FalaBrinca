# FalaBrinca 🦕

PWA educativa para crianças de 3 a 5 anos com acompanhamento de um adulto, feita em Next.js e TypeScript. **Não substitui avaliação ou terapia fonoaudiológica.**

## Novidades desta versão

- Três atividades gratuitas: identificar figuras, associar objetos e montar frases, cada uma com três rodadas.
- Voz do navegador, tentativas sem punição e estrelas locais.
- Cadastro, confirmação de e-mail, login, saída e recuperação de senha de responsáveis via Supabase Auth.
- Plano Exploradores do Dino: **R$ 50,00/mês**, com seis figuras adicionais disponíveis exclusivamente por uma API autenticada.
- Checkout Stripe vinculado ao usuário, consulta de assinatura no servidor e portal para cancelamento/gerenciamento.
- Webhook Stripe com assinatura verificada, processamento idempotente e armazenamento protegido por RLS.
- PWA gratuita offline, sem cache de páginas da conta, tokens ou respostas financeiras.

As integrações exigem configuração externa. Sem ela, as atividades gratuitas funcionam e a área de contas informa que está em preparação. Não há cadastro local fictício nem liberação de acesso por um parâmetro da URL.

## Executar no computador

Instale Node.js 24 LTS e Git. No terminal:

```bash
git clone https://github.com/ntpantoja/FalaBrinca.git
cd FalaBrinca
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para parar, Ctrl+C. Se já baixou anteriormente, use `git pull` e depois `npm ci`.

Veja **[ATIVAR-CADASTRO-E-PAGAMENTOS.md](ATIVAR-CADASTRO-E-PAGAMENTOS.md)** para a ativação na Vercel.

## Testes

```bash
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run test:auth-ui
```

Os testes de navegador usam o build de produção em `localhost:3100` e dados fictícios do webhook. Não criam contas reais nem cobram cartões. Execute `npm run build` antes deles; o build deve estar sem configuração pública Supabase para os testes de indisponibilidade. Não use credenciais reais no ambiente de testes. Em máquinas com Chromium já instalado, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` com seu caminho.

`npm run test:auth-ui` faz um build separado com um endereço fictício de autenticação e testa cadastro, login, saída e pedido de recuperação com respostas simuladas, na porta 3101. Ao terminar, rode `npm run build` novamente com as configurações corretas antes de usar o aplicativo fora dos testes.

Cobertura: três atividades completas, tentativas incorretas, recompensas persistidas, apresentação do preço, indisponibilidade sem configuração, autenticação exigida nas APIs, rejeição de origem externa no checkout, webhook com assinatura inválida, resposta de reenvio quando não há banco e atividade offline sem cache da conta. Testes unitários validam valor, moeda, recorrência e estados com acesso premium.

**Os testes locais não comprovam integração com contas reais Supabase/Stripe.** Após configurar, execute o roteiro de ponta a ponta no guia antes de vender. O esquema SQL deve ser aplicado e validado no seu projeto Supabase.

## PWA

```bash
npm run build
npm start
```

Acesse a página inicial e espere o service worker ativar antes de testar offline. O service worker não registra em desenvolvimento. Ao publicar alterações, incremente o nome do cache em `public/sw.js`. No Android use “Instalar aplicativo”; no iPhone, Safari → Compartilhar → Adicionar à Tela de Início. Fora de localhost, HTTPS é obrigatório.

Cadastro, assinatura e trilha de assinantes precisam de conexão. A atividade premium já carregada pode terminar em memória, mas precisa validar acesso ao abri-la novamente. Não há DRM: conteúdo exibido pode ser copiado ou capturado pelo usuário.

## Arquitetura

- `app/page.tsx`, `components/activity.tsx`, `lib/activities.ts`: trilhas educativas.
- `app/conta/page.tsx`: cadastro/login, status e assinatura.
- `app/recuperar-senha/page.tsx`: redefinição pelo link de e-mail.
- `app/api/checkout`: exige usuário confirmado, origem correta, webhook configurado e preço exato de R$ 50 mensais; reutiliza sessão aberta e rejeita assinatura em andamento.
- `app/api/account`: consulta o Stripe, não aceita status informado pelo cliente.
- `app/api/portal`: abre o portal para o cliente associado ao usuário autenticado.
- `app/api/activities/premium`: só entrega figuras extras após verificar assinatura ativa ou em teste no Stripe.
- `app/api/webhooks/stripe`: verifica o corpo original com a assinatura Stripe e persiste eventos atomicamente. Responde com erro para permitir reenvio em falhas de persistência.
- `supabase/schema.sql`: tabelas, RLS e função transacional restrita ao servidor.
- `app/informacoes`: informações iniciais de uso e privacidade; requer identificação comercial e revisão antes da abertura de vendas.

A assinatura é consultada diretamente no Stripe para autorização. O banco guarda um resumo por assinatura e ignora eventos anteriores; eventos diferentes do mesmo segundo podem atualizar esse resumo na ordem de chegada, mas não determinam o acesso premium. Não altere o preço cadastrado sem planejar migração: o acesso é associado a `STRIPE_PRICE_ID`.

## Limites atuais

- Estrelas não são sincronizadas na conta; ficam neste navegador e podem ser apagadas na área dos adultos.
- Não há gravação de voz nem avaliação automática de pronúncia.
- Não há painel administrativo, reembolso automatizado ou exclusão autônoma de conta. Cancelamento de renovação ocorre pelo portal Stripe; atendimento e solicitações de dados precisam de canal do responsável comercial antes do lançamento.
- Configure SMTP próprio, limites de autenticação, proteção contra abuso e monitoramento no Supabase/Stripe antes de divulgação pública.
- O portal deve ser configurado para cancelar ao fim do período, sem troca de plano nesta versão.
- Não há limitação distribuída própria das rotas de cobrança. Configure regras de proteção/rate limit na hospedagem antes de abrir vendas em escala.

## Privacidade

A conta usa somente e-mail do responsável e autenticação Supabase. Identificadores e estado financeiro são guardados para gerenciar acesso. Cartões são processados pelo Stripe. A fala usa o recurso do navegador/dispositivo. Não envie dados da criança no cadastro. As chaves secretas ficam apenas no servidor; `.env.local` não entra no Git.
