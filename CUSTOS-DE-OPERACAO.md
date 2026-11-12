# Orçamento de referência para operar o FalaBrinca

Planejamento preparado em 12/11/2026. Os valores abaixo são hipóteses de orçamento, não uma cotação atual: não foram conferidos preços ao vivo nem os planos já contratados na sua conta. Confirme preços, câmbio, impostos sobre serviços internacionais e franquias antes de contratar.

## Infraestrutura para um início comercial pequeno

Para planejar, considere um projeto em produção e um único assento pago de administração:

| Item | Hipótese de orçamento |
| --- | --- |
| Vercel Pro | US$ 20/mês de referência; aproximadamente R$ 110 com câmbio hipotético de R$ 5,50 |
| Supabase Pro | US$ 25/mês de referência; aproximadamente R$ 137,50 no mesmo câmbio |
| Envio de e-mails de cadastro e recuperação (SMTP) | Reservar de R$ 0 a R$ 50/mês em baixo volume; depende do provedor e da franquia |
| Domínio próprio | Reservar aproximadamente R$ 40 a R$ 80/ano; o endereço atual `.vercel.app` não exige comprar domínio |
| Margem para variação cambial e consumo adicional | Reservar aproximadamente R$ 50 a R$ 100/mês no início |

Com essas hipóteses, planeje **R$ 300 a R$ 400/mês de infraestrutura**. Vercel e Supabase podem cobrar consumo excedente, projetos adicionais ou outros recursos. O número de assinantes e os acessos simultâneos não têm capacidade garantida por esse orçamento: acompanhe métricas reais, transferência de imagens/áudios e limites dos planos.

Para cadastro por e-mail em produção, configure um provedor SMTP adequado e autentique seu domínio de envio. Não dependa apenas do remetente de teste do serviço de autenticação para atender clientes.

Links para conferir a cotação atual:

- https://vercel.com/pricing
- https://supabase.com/pricing
- https://stripe.com/br/pricing
- https://stripe.com/br/billing/pricing

## Cobrança e impostos

As taxas reais dependem do Stripe, do meio de pagamento, do país do cartão e da utilização de Billing. Para uma simulação inicial, **reserve 6% dos recebimentos** para processamento e recorrência. Essa reserva não é a tabela contratual do Stripe; confira também tarifas fixas, reembolsos, contestações e regras do seu contrato.

Exemplo apenas para planejamento:

- Mensal de R$ 50: reserva de R$ 3, sobrando R$ 47 antes de hospedagem, impostos e outras despesas.
- Anual de R$ 450: reserva de R$ 27, sobrando R$ 423 no ano; equivale a R$ 35,25 por mês antes das demais despesas.

Impostos do negócio, emissão de notas, abertura/regularização da empresa e eventual contabilidade não estão incluídos nos R$ 300–400. Dependem do seu CNPJ, atividade e regime tributário; peça uma proposta ao contador. Divulgação e suporte também são despesas separadas, conforme a estratégia escolhida.

## Quantos clientes cobrem a infraestrutura?

Usando custos fixos de R$ 300/mês e a hipótese de taxa de 6%:

- Aproximadamente **7 clientes mensais**: 7 × R$ 47 = R$ 329/mês.
- Ou aproximadamente **9 clientes anuais**: 9 × R$ 423 ÷ 12 = R$ 317,25/mês equivalente.

Com R$ 400/mês de custos fixos, seriam aproximadamente 9 mensais ou 12 anuais. Esses pontos de equilíbrio cobrem somente a infraestrutura modelada, sem impostos, contador, propaganda, reembolsos, cancelamentos ou remuneração do seu trabalho. O dinheiro anual entra de uma vez, mas precisa sustentar o atendimento durante os 12 meses.

No dashboard master, ajuste custos fixos e taxas do simulador aos seus valores reais. Não trate contas cadastradas como vendas nem o pagamento anual inteiro como receita mensal.

## O que não tem cobrança de IA por uso nesta versão

As atividades atuais não chamam uma API paga de IA para avaliar fala. Áudios gravados pelo master são arquivos armazenados e reproduzidos pelo app; geram consumo de armazenamento e tráfego, não uma tarifa de IA por reprodução. A voz automática usa o navegador/dispositivo. O Google login e a instalação PWA não exigem uma assinatura adicional específica no código atual.
