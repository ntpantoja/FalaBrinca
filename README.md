# FalaBrinca

Aplicativo educativo visual para crianças de 3 a 5 anos, acompanhado por um adulto. **Não substitui avaliação ou terapia fonoaudiológica.**

## Fluxo atual

- `/`: cadastro/login direto com Google ou e-mail, perfil e escolha entre **R$ 50/mês**, **R$ 450/ano com renovação automática**, cobrado de uma vez e sem parcelamento na mesma área. Após confirmação do acesso, assinantes abrem o painel de prática e a conta master abre o dashboard administrativo.
- `/conta`: cadastro, Google, confirmação por e-mail, perfil familiar e assinatura.
- `/atividades`: biblioteca protegida. Todos os usuários comuns precisam de assinatura ativa ou passe válido e dispositivo cadastrado.
- `/admin`: dashboard exclusivo do master, com indicadores e atalhos para conteúdo, área do usuário, conta e dispositivos.
- `/admin/conteudo`: gestão de atividades, ilustrações e gravação de áudio por figura.
- `/admin/clientes`: endereço antigo mantido como alias do dashboard.
- `/dispositivos`: lista e desconexão dos até três dispositivos por conta.

As categorias são **Animais, Alimentos, Cores, Objetos, Emoções, Transportes, Ações e Natureza**. O material de importação inclui 131 atividades e 393 rodadas. Dificuldades:

1. **Inicial**: a figura de referência permanece visível acima de três opções na mesma tela. O áudio diz a palavra e convida à repetição; a criança toca no desenho igual. Um erro permite tentar novamente, e o acerto libera a próxima palavra. Não é preciso apertar outro botão para mostrar as opções.
2. **Intermediário**: associações de imagens com instruções faladas.
3. **Avançado**: organização de histórias em imagens.

Há também **24 atividades de quebra-cabeça de quatro peças** e **8 jogos da memória**, com áudio, pausa e recompensas. O atalho de prática guiada foi retirado. Veja [Ativar a biblioteca com 131 atividades](ATIVAR-131-ATIVIDADES.md) para executar a migração dos formatos e importar os novos cards, preservando edições existentes.

Não há leitura obrigatória nos jogos. Não gravamos a voz das crianças e não verificamos a pronúncia ou a repetição. O master pode gravar a pronúncia das figuras no editor. Favoritos e progresso ficam no dispositivo, separados da conta.

## Configurar os serviços

- **[Ativar planos, dispositivos e painel comercial](ATIVAR-PLANOS-E-PAINEL-COMERCIAL.md)** — preços, migração SQL e eventos de pagamento desta versão.
- **[Atualizar para o painel das referências](ATUALIZAR-PAINEL-VISUAL.md)** — categorias novas, progresso, metas, gráfico e acesso direto.
- [Cadastro e pagamentos](ATIVAR-CADASTRO-E-PAGAMENTOS.md).
- [Google e perfil familiar](ATUALIZAR-GOOGLE-E-PERFIL.md).
- **[Ativar a conta master e importar a biblioteca](ATIVAR-ACESSO-MASTER.md)** — necessário nesta atualização.

Para uma instalação nova, execute `supabase/schema.sql` e depois `supabase/commercial-devices-migration.sql`. Para a atualização de uma instalação já existente, execute as migrações necessárias de conteúdo e `supabase/commercial-devices-migration.sql`, configure `MASTER_USER_ID` e importe as atividades no painel. A biblioteca fica no banco, não é recriada nem sobrescrita ao reiniciar. Sem configuração ou sem assinatura, o sistema não libera jogos por fallback.

## Executar

Requer Node.js 24 LTS.

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. Copie `.env.example` para `.env.local` para configurar serviços de teste. Nunca envie chaves secretas ao GitHub ou ao chat.

```bash
npm run build
npm start
```

## Testes

```bash
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run test:auth-ui
```

`test:e2e` verifica entrada direta no cadastro, plano e ausência de demonstração, autenticação obrigatória, proteção do painel, webhook e exclusão das páginas privadas do cache. Precisa de build sem configuração Supabase pública.

`test:auth-ui` faz um build com serviço Supabase local **simulado**, testa confirmação, Google, as 131 atividades e permissões/CRUD do master. Não usa um banco Supabase real nem cobra cartões. O provedor em `tests/mock-supabase.mjs` é uma fixture de teste e nunca deve ser usado como backend real. Depois dessa suíte, execute `npm run build` com as configurações corretas para remover o build fictício. Em ambientes com Chromium já instalado, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Os testes de permissão verificam que metadados `role: master` no usuário comum não concedem acesso administrativo; o ID configurado e o usuário verificado no servidor são a autoridade. Os testes de edição incluem conflitos de versão e exclusão. Os painéis têm testes de fluxo de pagamento, dados de seleção, metas, persistência, exportação e configurações. Validações de conteúdo cobrem categorias, níveis, respostas e imagens.

**Validação local simulada não comprova a configuração real de Supabase, Google, Storage ou Stripe.** Execute a migração e o roteiro manual do guia na sua conta antes de usar comercialmente.

## Arquitetura

- `lib/access.ts`: verificação de assinatura ou master no servidor. Não confia no papel enviado pelo cliente.
- `app/api/library`, `app/api/activities/[id]`: dados protegidos da biblioteca e das rodadas.
- `app/api/admin/*`: somente master; operações de escrita também conferem origem da requisição.
- `learning_activities`: conteúdo no Supabase com RLS e escrita/leitura exclusivas pelas APIs do servidor.
- `MASTER_USER_ID`: UUID do proprietário configurado apenas no servidor. Não é senha nem e-mail. Não existe administrador padrão.
- `lib/catalog.ts` e `lib/activity-content.ts`: material de importação inicial. Não são fallback público.
- `app/api/admin/seed`: importação explícita; preserva registros existentes.
- `app/api/admin/media`: valida, redimensiona e reencoda ilustrações PNG/JPG/WebP antes de enviar ao Storage.
- `app/api/checkout`, `account`, `portal`, `webhooks/stripe`: cobrança, status verificado e cancelamento pelo Stripe.
- `app/api/profile`: nomes da família, com autorização explícita e verificação do usuário.

Não altere o identificador do preço Stripe sem planejar migração dos assinantes. O valor aceito continua sendo BRL 5000, recorrente mensal.

## PWA e privacidade

O aplicativo continua instalável em HTTPS. Cadastro, pagamento e prática precisam de internet. **Biblioteca, conta, painel master, APIs e callbacks não entram no cache**; atividades exigem conexão para validar o acesso. Uma rodada já carregada pode continuar em memória, mas cada nova abertura consulta o servidor. Conteúdo exibido pode ser capturado; não há DRM.

O primeiro nome da criança e o nome do responsável ficam no perfil autenticado, não no cache offline. Cartões são processados pelo Stripe. A voz usa recursos do navegador/dispositivo. As ilustrações da biblioteca ficam em um bucket público e não devem conter dados pessoais.

Antes de vender, mantenha identificação comercial e atendimento publicados, termos e privacidade revisados, SMTP, limites de autenticação, proteção contra abuso e monitoramento configurados. Não há reembolso automático, exclusão autônoma de conta ou sincronização do progresso nesta versão.

Para gravar a pronúncia de cada figura no painel master, siga [Gravar áudio das figuras](GRAVAR-AUDIO-DAS-FIGURAS.md). Em instalações existentes, execute `supabase/recorded-audio-migration.sql` uma vez no Supabase.

A versão comercial possui duas modalidades, até três dispositivos por conta e painel master de clientes/vendas. Para ativar em projeto existente ou novo, siga [Planos, dispositivos e painel comercial](ATIVAR-PLANOS-E-PAINEL-COMERCIAL.md), incluindo a migração SQL e os novos preços/eventos no Stripe.

Veja [Sessões e painel master](SESSOES-E-PAINEL-MASTER.md) para os ajustes de permanência do login e [Custos de operação](CUSTOS-DE-OPERACAO.md) para o orçamento de referência.

Para testar uma compra de R$ 5 sem mudar os preços dos clientes, siga [Teste privado de compra](TESTAR-COMPRA-R5.md). A opção aparece somente para a conta autorizada e depende de configurar um preço separado no Stripe.
