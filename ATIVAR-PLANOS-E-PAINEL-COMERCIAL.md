# Ativar três modalidades, dispositivos e painel master

## Valores definidos

| Opção | Cobrança | Renovação | Equivalente mensal |
| --- | --- | --- | --- |
| Mensal | R$ 50 a cada mês | Automática até cancelar | R$ 50 |
| Anual com renovação | R$ 450 de uma vez a cada ano | Automática até cancelar | R$ 37,50 |
| 12 meses sem renovação | R$ 500 uma única vez | Não renova | Aproximadamente R$ 41,67 |

Todos incluem as mesmas atividades e até três dispositivos cadastrados. O desconto do anual é de 25% sobre 12 mensalidades; o pagamento único tem desconto de aproximadamente 16,7%. O passe não é vitalício: termina um ano após o pagamento confirmado, ajustando 29 de fevereiro para 28 de fevereiro no ano seguinte.

## 1. Atualizar o Supabase

No mesmo projeto já usado pelo FalaBrinca, abra **SQL Editor → New query**. Copie todo o arquivo `supabase/commercial-devices-migration.sql`, cole e clique em **Run**.

O arquivo pode ser executado novamente. Ele cria tabelas e funções de acesso, controle de dispositivos e relatórios; não apaga contas, atividades ou assinaturas existentes. As tabelas financeiras e de dispositivos não permitem escrita direta pelos clientes. Em uma instalação nova, execute primeiro `supabase/schema.sql` e depois esta migração.

É importante fazer esta etapa antes de usar a nova versão: conta, checkout, dispositivos e relatórios consultam as novas tabelas.

## 2. Criar os preços no Stripe

Use o mesmo modo (teste ou produção) da chave secreta e do webhook configurados. Não misture IDs de teste com chaves de produção.

Em **Catálogo de produtos**, abra seu produto FalaBrinca e configure:

1. **R$ 50,00, BRL, recorrente, todo mês.** Pode manter seu preço mensal atual se ele já estiver correto.
2. **R$ 450,00, BRL, recorrente, todo ano.** A cobrança é anual de uma vez, não são 12 parcelas.
3. **R$ 500,00, BRL, pagamento único.** Não escolha recorrência neste preço. O app controla os 12 meses de acesso após o pagamento.

Copie o **ID do preço**, que começa com `price_`, de cada opção. Não use IDs de produto `prod_`. O aplicativo confere moeda, valor e intervalo antes de abrir o checkout; preços diferentes são recusados.

## 3. Variáveis na Vercel

Em **Configurações → Variáveis de ambiente**, mantenha as chaves atuais e configure:

| Nome | Conteúdo |
| --- | --- |
| `STRIPE_PRICE_ID` | `price_...` do mensal de R$ 50 |
| `STRIPE_ANNUAL_PRICE_ID` | `price_...` do recorrente anual de R$ 450 |
| `STRIPE_YEAR_PASS_PRICE_ID` | `price_...` do pagamento único de R$ 500 |

Os IDs de preço podem usar **Configuração**. As chaves secretas continuam usando **Segredo**. Aplique ao ambiente de Produção e reimplante depois de salvar. Não é necessário criar outro domínio ou mudar o segredo do webhook se você estiver editando o mesmo destino no mesmo modo.

## 4. Eventos no destino webhook

No Stripe, abra o destino `https://falabrinca-43kf.vercel.app/api/webhooks/stripe` e confira estes sete eventos:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `invoice.paid`
- `charge.refunded`

Os três primeiros já eram usados. Os demais liberam o passe pago, confirmam pagamentos assíncronos, registram recebimentos e tratam reembolsos. A URL de retorno do checkout não libera acesso sozinha. Eventos repetidos não somam dinheiro nem estendem a validade novamente. Conclusão de checkout sem pagamento aprovado não libera o passe.

O passe totalmente reembolsado perde o acesso; reembolso parcial mantém o período original. Reembolso de uma assinatura recorrente e cancelamento de sua renovação são operações diferentes no Stripe: confirme a situação no Stripe ao atender um cliente. A liberação e os relatórios dependem da entrega dos webhooks; falhas temporárias retornam erro para solicitar nova tentativa.

No **Portal do cliente**, mantenha o cancelamento ao final do período pago. Desative trocas de plano pelo portal nesta versão. O app bloqueia outra compra enquanto existir assinatura em andamento ou passe válido, para evitar duas cobranças. A troca de modalidade pode ser feita após o fim do acesso; alterações antecipadas exigem tratamento pelo proprietário no Stripe.

## 5. Dispositivos

A primeira entrada nas atividades cadastra o navegador. O quarto dispositivo recebe orientação para abrir **Minha conta → Gerenciar meus dispositivos** (`/dispositivos`), desconectar um antigo e ativar o atual.

O identificador é aleatório, mantido em cookie protegido e guardado no banco somente como hash. Não usamos impressão digital do aparelho. Um navegador/perfil/instalação com armazenamento separado conta como outro dispositivo, mesmo no mesmo celular. Limpar os dados do navegador pode ocupar uma nova vaga; a conta pode remover a vaga antiga.

O limite de dispositivos não sincroniza o progresso: estrelas e histórico de prática continuam locais em cada navegador nesta versão.

Sair da conta não libera automaticamente a vaga, para preservar o cadastro quando a pessoa voltar. Desconectar um dispositivo bloqueia suas próximas consultas de atividades ao servidor. Uma rodada já carregada pode continuar visível até a próxima consulta. O painel administrativo do master continua protegido pela identidade do proprietário, sem depender de assinatura.

## 6. Painel master

Acesse **Painel master → Clientes e vendas** (`/admin/clientes`). Ele mostra contas cadastradas, e-mail, nome do responsável quando informado, último login, última visita acompanhada, quantidade de dispositivos, modalidade e validade. Não expõe nomes das crianças nesse relatório.

O último login vem do Supabase. A contagem de logins e as visitas detalhadas começam nesta versão. Recarregar a página com a mesma sessão não conta como um novo login. Você pode buscar por nome/e-mail, filtrar contas que entraram e não compraram, contas sem compra registrada ou sem acesso válido e navegar em páginas de 50 contas. A própria conta master fica fora dos indicadores.

Assinaturas ativas antigas já registradas nos webhooks aparecem no painel, mas o histórico de recebimentos detalhados só começa quando os novos eventos passam a ser entregues. Para completar o histórico anterior, reenvie no Stripe os eventos `invoice.paid` e os eventos de reembolso correspondentes. Não troque os IDs de preço de assinaturas existentes sem planejar a migração. O Stripe é a referência financeira; os relatórios do app refletem os eventos recebidos.

## 7. Estimar a receita

O painel separa:

- **Recebido registrado:** pagamentos confirmados, antes de taxas e impostos.
- **Reembolsos registrados:** valores devolvidos vinculados aos pagamentos registrados.
- **Recorrência mensal equivalente:** R$ 50 por mensal ativo e R$ 37,50 por anual recorrente ativo. Isso não é uma previsão garantida de renovações futuras.
- **Equivalente dos passes:** R$ 500 dividido por 12, apresentado separadamente, sem tratar como receita recorrente.

Na simulação, informe novas vendas mensais/anuais/passes, custos fixos, percentuais de taxas/impostos e custo adicional por conta. Por exemplo: 10 mensais + 2 anuais + 3 passes geram R$ 2.900 de entrada bruta, R$ 575 de recorrência mensal equivalente e R$ 125 de equivalente mensal dos passes, sem recorrência. O saldo simulado é de caixa do mês; não considera automaticamente os custos futuros de atender os acessos anuais, cancelamentos ou todas as obrigações contábeis.

## 8. Conferir antes de cobrar clientes

Use primeiro o modo de teste para as três opções. Confirme que o preço exibido corresponde ao checkout, que a compra aprovada libera as atividades, que uma compra pendente não libera e que atualizar a página não duplica o acesso. Teste cancelamento da renovação, reembolso do passe, três navegadores e bloqueio do quarto. Depois configure preços/chaves/webhook no modo de produção e repita a conferência operacional com sua conta Stripe.

Validação técnica local: testes unitários dos três modos de checkout e webhooks com Stripe simulado, testes de navegador com autenticação/armazenamento simulados e PostgreSQL real isolado para verificar migração repetível, permissões, oito cadastros simultâneos de dispositivos, reenvio de eventos, reembolsos e totais do painel. Esses testes não confirmam sua configuração real na Vercel, Stripe ou Supabase.
