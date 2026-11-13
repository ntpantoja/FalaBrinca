# Teste privado de compra de R$ 5

Os planos públicos continuam em R$ 50/mês e R$ 450/ano. A compra de teste é uma assinatura mensal separada de R$ 5, disponível somente para a conta autorizada no servidor. O master pode testar o checkout mesmo já tendo acesso gratuito de proprietário.

## Ativar na sua conta master

1. No Stripe, use o mesmo modo das chaves atuais: teste/sandbox ou produção. Em **Catálogo de produtos**, crie um produto chamado **FalaBrinca — teste de compra**.
2. Adicione um preço de **R$ 5,00**, moeda **BRL**, cobrança **recorrente mensal**.
3. Copie o **ID do preço** (`price_...`). Não copie o ID `prod_...`.
4. Na Vercel, em **Configurações → Variáveis de ambiente**, adicione `STRIPE_TEST_PRICE_ID` com esse ID. Pode usar **Configuração**; o valor só é lido no servidor. Não altere `STRIPE_PRICE_ID` nem `STRIPE_ANNUAL_PRICE_ID`.
5. Aplique ao ambiente em uso e reimplante. Se já existir `BILLING_TEST_ENABLED=false`, mude para `true` para ativar.
6. Entre com sua conta master e clique no atalho **Teste de compra · R$ 5** no dashboard, ou acesse `https://falabrinca-43kf.vercel.app/conta?gerenciar=1#teste-compra`.
7. Procure **Compra de teste · R$ 5,00/mês** e clique em **Testar compra por R$ 5,00/mês**.
8. Confira o valor no checkout do Stripe e conclua o pagamento. A volta abre sua conta para consultar o status e gerenciar o cancelamento.

Não precisa executar SQL novo. O teste usa a estrutura de pagamentos que já deve estar configurada, incluindo o webhook e a migração comercial anterior.

## Cobrança real e encerramento

No modo de produção, a compra cobra R$ 5 de verdade. No modo de teste/sandbox, use os meios de pagamento de teste do Stripe; não há débito real. Não misture um preço de teste com uma chave de produção, nem o contrário.

Esta é uma assinatura mensal: haverá renovação de R$ 5 enquanto ela não for cancelada. Depois de conferir o processo:

1. Abra **Gerenciar pagamento e cancelamento** na sua conta, ou a assinatura no painel do Stripe, e cancele a renovação. Confira a confirmação do cancelamento.
2. Na Vercel, configure `BILLING_TEST_ENABLED=false` e reimplante para impedir novas compras de teste.
3. Mantenha `STRIPE_TEST_PRICE_ID` enquanto houver período pago ou eventos pendentes, para que o acesso e os eventos continuem sendo reconhecidos. Depois de encerrar os testes, pode arquivar esse preço no Stripe.

Desativar o botão não cancela uma assinatura já existente. O teste não transforma automaticamente a assinatura em R$ 50: uma nova contratação do plano normal precisa de confirmação do cliente. Os preços públicos não foram reduzidos, então não há uma restauração de preço a fazer para os demais usuários.

Se quiser devolver o pagamento, o reembolso é feito no Stripe. Reembolso e cancelamento da renovação são operações diferentes. Confira as taxas e condições da sua conta Stripe.

## Testar também a liberação de um cliente comum

O master já tem acesso às atividades independentemente de pagamento; comprar com ele testa checkout, cobrança e portal, mas não comprova o bloqueio/liberação de um assinante comum.

Para testar o fluxo completo com uma conta comum:

1. Crie e confirme outra conta de teste no FalaBrinca.
2. No Supabase, copie o UUID dessa conta em **Authentication → Users**.
3. Configure `BILLING_TEST_USER_ID` na Vercel com esse UUID, mantendo `STRIPE_TEST_PRICE_ID`, e reimplante.
4. Entre nessa conta, complete o perfil e compre pelo botão privado de teste na área da conta.
5. Após a confirmação, confira o acesso às atividades e o limite de dispositivos; depois cancele e desative o teste como acima.

O botão deixa de ser oferecido ao master quando outro UUID é escolhido. Nenhum outro cliente pode comprar por R$ 5 apenas alterando o navegador ou o corpo da requisição: o servidor valida a identidade, o valor, a moeda e a recorrência.

Não são permitidas compras de teste anuais, preços diferentes de R$ 5, nem uma segunda compra enquanto houver assinatura em andamento ou passe válido. As assinaturas do preço de teste são identificadas separadamente e não entram na receita recorrente dos planos comerciais do dashboard; use o Stripe para conferir os recebimentos de teste. Os webhooks existentes atendem a confirmação e o cancelamento, sem criar outro destino.

## Quando o teste não aparece ou está indisponível

O dashboard master possui um atalho permanente para o teste. A área da conta master mostra o card mesmo quando não é possível comprar, em vez de escondê-lo. A mensagem informa o estado lido pelo servidor da implantação atual:

- `STRIPE_TEST_PRICE_ID` ausente nesta implantação: confira o escopo **Produção** e reimplante após salvar.
- `BILLING_TEST_ENABLED=false`: o teste está desativado; use `true` para reativar e reimplante.
- `BILLING_TEST_USER_ID` aponta outra conta: entre na conta escolhida ou remova a variável para voltar a usar o master, depois reimplante.

Essas mensagens não expõem chaves ou IDs de outras contas. A opção só cria checkout se a configuração e a identidade autorizarem; a visibilidade do card não libera uma cobrança por conta própria. Se o dashboard não mostrar o novo atalho após a publicação, confira se o domínio está associado à implantação mais recente da branch main.
