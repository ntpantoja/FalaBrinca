# Atualização: cadastro direto e painel de prática

## Como ficou o fluxo

1. O link principal abre diretamente **Criar conta / Já tenho conta**, com Google e e-mail. Não há página de apresentação antes do cadastro.
2. Depois da confirmação, o usuário completa o perfil e contrata o plano de **R$ 50,00/mês**, na mesma área de acesso. O pagamento é confirmado no checkout seguro Stripe.
3. Quando o servidor confirma assinatura ativa, o app abre o painel automaticamente. O parâmetro `checkout=success` sozinho não libera acesso.
4. O painel apresenta Começar Atividade, Progresso, Pais, Prática Guiada e Configurações, com os cards e as cores inspirados nas referências.
5. A conta master continua dispensada da assinatura e pode abrir o editor de conteúdo.

O cadastro usa rótulos simples, como E-mail, Senha e Seu nome. A autorização para usar o primeiro nome da criança permanece no formulário de perfil, junto das informações de privacidade.

## Uma atualização no banco

No Supabase → **Editor SQL → Nova consulta**, copie e execute todo o conteúdo de:

`supabase/reference-layout-migration.sql`

Esse arquivo cria a biblioteca caso ela ainda não exista, mantém os registros existentes e amplia as categorias para **Animais, Alimentos, Cores, Objetos, Emoções, Transportes, Ações e Natureza**. Não muda contas, pagamentos ou o preço da mensalidade. Reclassifica somente os cards iniciais que nunca foram editados; cards editados pelo proprietário são preservados.

Depois da publicação na Vercel, entre com sua conta master em `/admin` e clique em **Importar atividades iniciais** para adicionar os novos cards de cores, ações e sentimentos. Os registros existentes não são sobrescritos. O material inicial agora tem **27 atividades e 81 rodadas**. Se você ainda não vinculou a conta master, siga `ATIVAR-ACESSO-MASTER.md` usando seu ID de usuário existente.

Nenhuma nova chave Stripe ou Google é necessária nesta atualização. As configurações já existentes continuam sendo usadas.

## Prática de palavras

- Uma figura grande aparece; a voz do navegador fala seu nome.
- O botão **Ouvir** repete o modelo.
- O botão com microfone oferece um convite para a criança repetir. **Não solicita acesso ao microfone, não grava e não analisa voz.**
- A seta abre a seleção por figuras.
- Depois de escolher a figura correta, **Pratiquei esta palavra** registra uma estrela e a prática da palavra. Não é uma certificação de aprendizagem nem avaliação clínica.
- Se uma imagem enviada ao editor não carregar, aparece o desenho/emoji alternativo.
- A legenda escrita é opcional em Configurações e fica desligada por padrão; a criança não precisa ler.

As atividades de associações e histórias visuais continuam disponíveis nos demais níveis. A Prática Guiada organiza uma sequência curta de até três atividades iniciais de animais, alimentos e objetos; não é terapia.

## Progresso e relatórios

- **Taxa de acerto:** proporção de escolhas corretas de figuras. Não mede pronúncia ou qualidade da fala.
- **Palavras praticadas:** palavras marcadas ao terminar a seleção, contadas uma vez por palavra.
- **Sessões:** atividades encerradas ou concluídas neste navegador.
- **Minutos ativos:** duração das sessões, excluindo pausas e tempo com a aba oculta. Recarregar ou fechar o navegador durante uma atividade pode descartar o tempo da sessão ainda não encerrada.
- **Evolução semanal:** novas palavras marcadas em cada um dos últimos sete dias, no fuso de São Paulo.
- **Metas:** o usuário combina uma recompensa e escolhe quantas estrelas ganhar a partir da criação da meta. O resgate só fica disponível quando a meta é atingida e é registrado uma única vez. Não há recompensa financeira ou cobrança por resgate.
- **Exportação:** o botão de download do Painel dos Pais baixa um JSON do histórico de prática, sem e-mail ou credenciais.

Os dados ficam somente neste navegador, separados do perfil e da assinatura; não são sincronizados entre dispositivos e permanecem ao trocar de conta no mesmo navegador. O painel permite zerar os dados com confirmação. São mantidas as últimas 2.000 seleções e 300 sessões.

## Configurações

É possível ativar/desativar áudio, ajustar volume, escolher velocidade da voz e ativar legenda de apoio. A área de conta e cancelamento continua acessível em **Configurações → Editar perfil e gerenciar assinatura** ou pelo Painel dos Pais. A soma de acesso à área dos pais é apenas um lembrete de acompanhamento; a autorização real usa a sessão e a assinatura no servidor.

## Verificação após publicar

1. Abra o link sem login: deve mostrar cadastro/login e plano, sem atividades.
2. Entre com uma conta assinante: deve abrir o painel de prática automaticamente.
3. Entre com uma conta sem assinatura: deve permanecer na contratação.
4. Complete uma atividade inicial, incluindo uma seleção incorreta: confira a atualização real de estrelas e taxa de seleção.
5. Crie uma meta, ganhe estrelas, resgate e recarregue: o resgate deve permanecer registrado.
6. Abra Pais, confira o gráfico e exporte o histórico.
7. Altere volume/velocidade/legenda e teste uma atividade.
8. Confira o painel master e a edição nas oito categorias.

O aplicativo continua educativo e não substitui avaliação ou terapia fonoaudiológica. As vozes disponíveis dependem do navegador e do dispositivo. Cadastro, pagamento e atividades precisam de internet; páginas de autenticação e dados privados não ficam no cache offline.
