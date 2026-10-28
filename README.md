# FalaBrinca 🦕

Primeira versão de um aplicativo educativo de linguagem para crianças de 3 a 5 anos, acompanhado por um adulto. **Não substitui avaliação ou terapia fonoaudiológica.**

## O que funciona

- Interface responsiva com tema de dinossauros.
- Identificação de três figuras: maçã, gato e bola. Uma resposta incorreta permite tentar novamente; cada acerto convida à fala sem avaliar pronúncia.
- Leitura de palavras com a síntese de voz do navegador, quando disponível.
- Recompensa de três estrelas por atividade concluída, salva apenas no navegador.
- Manifesto e service worker para instalação e uso offline após o primeiro carregamento em produção. O áudio depende das vozes disponíveis no dispositivo.
- Área de responsáveis com uma barreira simples de soma (não é autenticação).
- Endpoint de checkout recorrente Stripe. Sem configuração, responde com indisponibilidade e não cobra.

Associação de palavras e formação de frases estão sinalizadas como **em breve**.

## Executar no computador, passo a passo

1. Instale o **Node.js 24 LTS** em https://nodejs.org e o Git em https://git-scm.com.
2. Depois que estes arquivos estiverem publicados no GitHub, baixe o projeto:

   ```bash
   git clone https://github.com/ntpantoja/FalaBrinca.git
   cd FalaBrinca
   ```

   Se recebeu os arquivos por ZIP, extraia e abra um terminal na pasta que contém `package.json`.

3. Instale as dependências com as versões do arquivo de lock:

   ```bash
   npm ci
   ```

4. Inicie o modo de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Abra `http://localhost:3000` no navegador. Para parar, pressione Ctrl+C no terminal. Alterações nos arquivos aparecem automaticamente.

Não é necessário configurar pagamentos para brincar.

## Como testar

```bash
npm run build
npm run typecheck
npm start
```

Pare o servidor de desenvolvimento antes de usar `npm start` na mesma porta. O build deve terminar sem erros. Abra `http://localhost:3000` e:

1. Clique em “Começar a brincar”. Escolha uma figura incorreta: deve permitir outra tentativa.
2. Ouça a palavra, se o navegador oferecer voz, e escolha a figura correta.
3. Conclua as três rodadas. Deve receber exatamente três estrelas. Recarregue: elas devem permanecer.
4. Abra a área dos adultos, responda 12 e clique em “Consultar assinatura”. Sem credenciais, deve informar indisponibilidade.
5. No DevTools, simule um celular de 390 px de largura. Confira botões, texto e rolagem.
6. Com `npm start` (produção), recarregue, espere o service worker ficar ativo em DevTools → Application → Service Workers, ative Offline e recarregue. A atividade deve continuar acessível; pagamentos precisam de internet.

O service worker fica desativado em desenvolvimento. Após mudanças no código, atualize o nome do cache em `public/sw.js` antes de publicar uma nova versão. HTTPS é necessário fora de localhost. Abrir o IP do computador no celular por HTTP não permite testar a instalação PWA corretamente. No Android use o menu de instalação; no iPhone use Safari → Compartilhar → Adicionar à Tela de Início. A instalação e as vozes variam conforme o navegador.

## Assinatura mensal: integração inicial

Foi escolhido Stripe Checkout para evitar capturar dados de cartão no aplicativo. Ainda **não é um sistema de assinaturas pronto para vendas**. Nesta versão, somente o fluxo de criação de uma sessão está preparado.

Para testar, em uma conta Stripe no ambiente de teste:

1. Crie um produto e um preço **recorrente mensal**, em BRL. Copie o identificador `price_...`.
2. Copie `.env.example` para `.env.local` (Windows: `copy .env.example .env.local`; macOS/Linux: `cp .env.example .env.local`).
3. Preencha `STRIPE_SECRET_KEY` com a chave secreta de **teste**, `STRIPE_PRICE_ID` com o preço mensal de teste e mantenha `APP_URL=http://localhost:3000`.
4. Reinicie o servidor. Entre na área de adultos e abra o checkout. Use somente os cartões de teste documentados pelo Stripe.

Nunca publique `.env.local`, nunca use chaves secretas em variáveis `NEXT_PUBLIC_*` e nunca compartilhe chaves no chat. O valor não é fixado no código: o preço configurado no Stripe é o que será cobrado. A rota de retorno informa apenas que houve um retorno do checkout; **não comprova pagamento**.

Antes de vender, implementar em uma tarefa posterior:

- Contas e autenticação dos responsáveis, banco de dados e vínculo entre usuário e cliente Stripe.
- Webhook com verificação de assinatura e processamento idempotente dos eventos de assinatura/fatura.
- Autorização no servidor para conteúdo pago; tratamento de inadimplência e cancelamento.
- Portal do assinante para gerenciamento e cancelamento, limites de requisições e proteção contra abuso do checkout.
- Política de privacidade, termos, consentimentos e revisão dos requisitos aplicáveis à proteção de dados de crianças e às assinaturas.
- Testes completos de checkout, renovação, falha de pagamento e cancelamento antes de habilitar chaves reais.

A primeira atividade é gratuita e não há conteúdo pago desbloqueado nesta versão. Não há gravação de voz, análise de fala ou coleta de identificação da criança. As estrelas usam localStorage e podem ser apagadas na área de adultos. A voz usa o serviço disponibilizado pelo navegador/dispositivo.

## Estrutura

- `app/page.tsx`: telas e primeira atividade.
- `app/globals.css`: aparência responsiva.
- `app/api/checkout/route.ts`: criação da sessão Stripe no servidor.
- `public/manifest.webmanifest`, `public/sw.js` e ícones: PWA.

## Estado de publicação

Criar os arquivos neste ambiente não os envia automaticamente ao GitHub e não publica um site. Depois de revisar, salve-os em um primeiro commit e envie a branch `main` pelo fluxo Git autorizado. Hospedagem Next.js e variáveis seguras do provedor serão necessárias para disponibilizar o aplicativo em HTTPS.
