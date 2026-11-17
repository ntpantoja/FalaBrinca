# Ativar mensal e anual, dispositivos e painel master

## Valores atuais

| Opção | Cobrança | Renovação |
| --- | --- | --- |
| Mensal | R$ 20 a cada mês | Automática até cancelar |
| Anual | R$ 200 de uma vez a cada ano | Automática até cancelar |

Ambos incluem as mesmas atividades e até três dispositivos cadastrados. O anual tem desconto de aproximadamente 16,67% sobre 12 mensalidades. Aproximadamente R$ 16,67/mês é somente uma comparação: a cobrança é R$ 200 à vista, sem parcelamento.

O pagamento único de R$ 500 foi retirado da oferta e não pode gerar novas compras pela API. Acessos e confirmações de compras antigas continuam sendo atendidos até o fim de sua validade.

## Atualizar dos preços anteriores para R$ 20 e R$ 200

1. Antes de substituir as variáveis na Vercel, copie os IDs anteriores. Guarde o antigo `STRIPE_PRICE_ID` em `STRIPE_LEGACY_MONTHLY_PRICE_IDS` e o antigo `STRIPE_ANNUAL_PRICE_ID` em `STRIPE_LEGACY_ANNUAL_PRICE_IDS`. Caso já haja outros IDs legados, acrescente os novos à lista, separados por vírgulas. Isso preserva o acesso de assinantes antigos e evita compra duplicada.
2. No Stripe **em produção**, abra **Catálogo de produtos → FalaBrinca → Adicionar preço** e crie os preços recorrentes de **R$ 20/mês** e **R$ 200/ano**. O Stripe não permite alterar o valor de um preço já criado: crie novos preços.
3. Na Vercel, substitua `STRIPE_PRICE_ID` pelo novo ID mensal e `STRIPE_ANNUAL_PRICE_ID` pelo novo ID anual; salve em **Produção** e reimplante.
4. Confira os valores no checkout antes de pagar. Enquanto as variáveis apontarem aos valores anteriores, o app bloqueará novas compras por incompatibilidade de preço.

Assinaturas existentes continuam no valor contratado no Stripe. Esta atualização não altera automaticamente a cobrança ou a renovação de assinantes antigos. A mudança dessas assinaturas exige uma ação separada no Stripe, com definição da data e do rateio; não foi executada pelo app. Checkouts antigos já abertos também podem conservar o valor antigo: encerre-os no Stripe para não receber novas compras nesse valor.

Para atualizar o relatório financeiro e a classificação dos assinantes antigos no master, execute também `supabase/update-plan-prices.sql` no **Supabase → SQL Editor → New query → Run**. Esse arquivo atualiza somente a função do dashboard e não modifica cobranças. Não é preciso mudar chaves secretas nem webhook. A estimativa de recorrência usa os novos valores e a referência de R$ 50/mês e R$ 450/ano para IDs legados; recebimentos reais continuam vindo das faturas.

## 1. Supabase

Se já executou `supabase/commercial-devices-migration.sql` na atualização anterior, não é necessário executar outra migração para retirar o pagamento único.

Caso ainda não tenha atualizado, no Supabase abra **SQL Editor → New query**. Copie todo o arquivo `supabase/commercial-devices-migration.sql`, cole e clique em **Run**. Ele cria os controles de planos, pagamentos, dispositivos e relatórios, sem apagar contas ou atividades. Pode ser executado novamente. Em instalação nova, execute primeiro `supabase/schema.sql`.

## 2. Preços no Stripe

Use o mesmo modo (teste ou produção) da chave secreta e do webhook. No **Catálogo de produtos**, abra o produto FalaBrinca e configure:

1. **R$ 20,00, BRL, recorrente, todo mês.** Crie um novo preço se o existente tiver outro valor.
2. **R$ 200,00, BRL, recorrente, todo ano.** Cobrança anual de uma vez; não configure 12 parcelas.

Copie o **ID do preço**, que começa com `price_`, de cada opção. Não use o ID de produto `prod_`. O app confere moeda, valor e intervalo no servidor antes de abrir o checkout.

Não precisa criar preço de R$ 500. Se já o criou, arquive esse preço e desative eventuais links de pagamento dessa oferta no Stripe. Checkouts antigos já abertos podem continuar válidos até expirarem; se não quiser recebê-los, encerre-os no Stripe. Não apague registros de pagamentos anteriores.

## 3. Variáveis na Vercel

Em **Configurações → Variáveis de ambiente**, mantenha as chaves atuais e configure:

| Nome | Conteúdo |
| --- | --- |
| `STRIPE_PRICE_ID` | `price_...` do mensal de R$ 20 |
| `STRIPE_ANNUAL_PRICE_ID` | `price_...` do anual recorrente de R$ 200 |

Os IDs podem usar **Configuração**. As chaves secretas continuam usando **Segredo**. Aplique ao ambiente de Produção e reimplante depois de salvar.

`STRIPE_YEAR_PASS_PRICE_ID` não é necessário para vender os planos atuais. Se houve compra ou checkout do passe antigo, mantenha seu ID para processar confirmações/reembolsos pendentes. Ele não reativa a opção de compra.

## 4. Webhook e cancelamento

No Stripe, no destino `https://falabrinca-43kf.vercel.app/api/webhooks/stripe`, confira:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `charge.refunded`

Se já configurou `checkout.session.completed` e `checkout.session.async_payment_succeeded`, pode mantê-los para atender pagamentos antigos do passe. Não precisa alterar o segredo do webhook ao editar o mesmo destino no mesmo modo.

A volta do checkout não libera acesso sozinha: a assinatura precisa ser confirmada no servidor. O app bloqueia outra compra enquanto houver assinatura em andamento ou passe antigo válido. Eventos repetidos não duplicam recebimentos nem estendem passes antigos novamente.

No **Portal do cliente**, mantenha cancelamento ao final do período pago e desative trocas de plano nesta versão. O cancelamento da renovação mantém o acesso pelo período já pago. Troca antecipada de modalidade exige tratamento pelo proprietário no Stripe. Reembolso e cancelamento de renovação são operações diferentes: confira a situação da assinatura ao atender o cliente.

## 5. Dispositivos

A primeira entrada nas atividades cadastra o navegador. No quarto, a pessoa pode abrir **Minha conta → Gerenciar meus dispositivos** (`/dispositivos`), desconectar um antigo e ativar o atual.

O identificador é aleatório, mantido em cookie protegido e armazenado no banco somente como hash. Não usamos impressão digital do aparelho. Cada navegador/perfil/instalação com armazenamento separado conta como outro dispositivo, mesmo no mesmo celular. Limpar os dados pode ocupar uma nova vaga; é possível liberar a antiga.

Sair da conta não libera automaticamente a vaga. Desconectar bloqueia as próximas consultas de atividades; uma rodada já carregada pode continuar visível até a próxima consulta. O limite não sincroniza o progresso: estrelas e histórico de prática continuam locais em cada navegador.

## 6. Painel master

A conta master abre automaticamente o dashboard em `/admin`. O endereço anterior `/admin/clientes` continua funcionando. Mostra cadastros, e-mail, nome do responsável quando informado, último login, última visita acompanhada, dispositivos, modalidade e validade. O relatório não inclui nomes das crianças.

Use o filtro **Entraram e não compraram** para acompanhar as contas sem compra registrada. Há busca por nome/e-mail, filtros de acesso e paginação de 50 contas. A conta master fica fora dos totais. O último login vem do Supabase; as contagens de logins e visitas detalhadas começam nesta versão. Recarregar com a mesma sessão não conta como novo login.

O financeiro detalhado começa na entrega dos novos webhooks. Para completar recebimentos antigos, reenvie pelo Stripe os eventos `invoice.paid` e de reembolso correspondentes. Não troque IDs de preços de assinaturas existentes sem planejar a migração. O Stripe é a referência financeira; o painel reflete os eventos recebidos. Passes antigos aparecem no histórico se existirem, mas não entram na oferta nem na simulação de novas vendas.

## 7. Simular receita

O painel separa dinheiro recebido, reembolsos e receita recorrente mensal equivalente: R$ 20 por mensal ativo e aproximadamente R$ 16,67 por anual recorrente ativo. O anual gera R$ 200 de entrada de uma vez, não R$ 200 todo mês. A recorrência equivalente não garante renovações futuras.

Exemplo: 10 novas assinaturas mensais + 2 anuais geram R$ 600 de entrada bruta e aproximadamente R$ 233,33 de recorrência mensal equivalente. Informe custos fixos, percentuais de taxas/impostos e custo adicional por conta para estimar o saldo de caixa do mês. A simulação não desconta automaticamente os custos futuros de atender os acessos anuais, nem prevê cancelamentos ou todas as obrigações contábeis.

## 8. Conferir a configuração real

Use primeiro o modo de teste para mensal e anual. Confira o preço no checkout, compra aprovada, pagamento recusado, cancelamento da renovação, três dispositivos e bloqueio do quarto. Depois configure preços, chaves e webhook em produção e confira a operação na sua conta Stripe.

Os testes locais usam Stripe/autenticação simulados e PostgreSQL isolado. Não confirmam a configuração real da sua Vercel, Stripe ou Supabase.
