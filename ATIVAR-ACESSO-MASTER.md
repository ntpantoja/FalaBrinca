# Ativar sua conta master e o editor de cards

Use sua conta que já existe no FalaBrinca. **Não é criada uma senha compartilhada nem um usuário administrativo automático.** O servidor verifica o ID do usuário autenticado no Supabase e compara com uma configuração privada do servidor. Outros usuários não podem ativar o master pelo cadastro, pelo e-mail ou pelo navegador.

## 1. Atualizar o banco e o espaço de ilustrações

1. Abra o projeto Supabase que está conectado à Vercel.
2. Entre em **Editor SQL → Nova consulta**.
3. No GitHub, abra `supabase/master-content-migration.sql`, copie o conteúdo inteiro, cole na consulta e clique em **Executar**.

Esse arquivo cria a tabela `learning_activities` e o bucket de ilustrações `activity-media`. A tabela tem RLS e nega acesso direto a usuários públicos/autenticados. Somente as APIs verificadas no servidor podem ler e editar. As ilustrações do bucket são públicas; use desenhos e figuras das atividades, não fotos ou dados de crianças. Não habilite upload público no bucket.

A atualização não muda contas, assinaturas ou cobranças.

## 2. Vincular sua conta ao acesso master

1. No Supabase, abra **Autenticação → Usuários**.
2. Encontre o e-mail da **sua conta já cadastrada** no FalaBrinca.
3. Abra o usuário e copie o **ID do usuário / UID**. É um UUID parecido com `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
4. Na Vercel, abra **FalaBrinca → Configurações → Variáveis de ambiente**.
5. Adicione:
   - Nome: `MASTER_USER_ID`
   - Valor: o **ID da sua conta**, não o e-mail e não a senha.
   - Tipo: **Configuração** é suficiente; é um identificador, não uma credencial.
   - Ambiente: **Produção**.
6. Salve. Em **Implantações → três pontos → Reimplantar** e aguarde concluir.

Não use prefixo `NEXT_PUBLIC_`. A permissão é conferida no servidor, nunca em metadados enviados pelo usuário. Para transferir a administração no futuro, altere esse ID nas configurações da hospedagem e reimplante.

## 3. Abrir seu painel e preparar a biblioteca

1. Acesse `https://falabrinca-43kf.vercel.app/conta?modo=login`.
2. Entre com sua conta de sempre (e-mail/senha ou Google já configurado).
3. Sua conta mostrará **Acesso master** e um botão para abrir o painel. Você também pode abrir `https://falabrinca-43kf.vercel.app/admin`.
4. Clique em **Importar 24 atividades iniciais** e confirme.

A importação cria 24 atividades com 72 rodadas. Não sobrescreve atividades que já existem com o mesmo identificador. Se você apagar uma atividade inicial e clicar em importar novamente, ela será recriada; a confirmação informa isso. Nada é reimportado automaticamente ao iniciar o aplicativo.

Sua conta master pode acessar e testar a biblioteca sem contratar assinatura. **Isso não concede acesso gratuito aos outros usuários.** Todas as atividades, inclusive as antigas demonstrações, agora exigem assinatura ativa dos usuários comuns.

## 4. Criar ou editar uma atividade

No painel:

- **Nova atividade**: cria um card e suas rodadas, inicialmente em rascunho.
- **Categoria**: Animais, Objetos ou Alimentos.
- **Dificuldade**: Inicial (ouvir e repetir), Intermediário (associar) ou Avançado (histórias visuais).
- **Figura do card**: escolha um desenho/emoji para representar a atividade.
- **Rodadas**: personalize a instrução falada e as figuras. O nível inicial usa o nome da figura correta no áudio de repetição.
- **Enviar ilustração**: escolha PNG, JPG ou WebP de até 2 MB. O servidor converte a imagem para WebP e remove metadados. Você também pode usar somente desenhos/emoji.
- **Figura correta**: marque a alternativa esperada nos níveis inicial e intermediário.
- **Histórias**: edite a frase falada e as figuras da sequência. Os nomes das figuras servem ao áudio e à acessibilidade; não aparecem escritos no jogo.
- **Adicionar rodada**: permite de 1 a 12 rodadas. Cada rodada concluída rende uma estrela.
- **Ver prévia**: testa o conteúdo do editor sem alterar o progresso da criança. A prévia não salva automaticamente.
- **Publicar na biblioteca dos assinantes**: marque para disponibilizar o card; desmarque para ocultar sem apagar.
- **Salvar atividade**: aplica as alterações no banco. Peça ao assinante para atualizar a biblioteca caso já esteja com a página aberta.

O campo de nome serve para o áudio. O campo de desenho/emoji deve conter figuras, não palavras. Evite opções com a mesma imagem: a criança precisa distinguir as alternativas visualmente.

Alterar o tipo de dificuldade recria as rodadas do editor e pede confirmação. Salve primeiro o que quiser preservar.

## 5. Apagar cards

Clique em **Apagar** na atividade e confirme. Isso remove o card e as rodadas da biblioteca. Uma atividade que já está aberta em memória pode ser terminada até a próxima consulta; novas aberturas são verificadas no servidor.

Para somente esconder um card, prefira desmarcar **Publicar** e salvar. Imagens enviadas não são apagadas automaticamente ao excluir um card, para não quebrar outras atividades que possam usar a mesma ilustração. A limpeza de arquivos sem uso pode ser feita no Storage do Supabase.

O editor verifica a versão antes de salvar/apagar. Se outra aba mudou o card, ele pede para atualizar a lista em vez de sobrescrever silenciosamente.

## Como funciona o nível inicial

1. A imagem aparece sozinha e o aplicativo fala a palavra.
2. O adulto convida a criança a repetir, sem exigir pronúncia perfeita.
3. Ao tocar no botão com a mão, aparecem três figuras para selecionar.
4. A criança toca na figura correspondente e recebe incentivo.

O app **não grava voz, não confirma se houve repetição e não avalia pronúncia**. A etapa de repetição é uma proposta educativa acompanhada pelo adulto, não uma avaliação clínica.

## Testar antes de divulgar

- Com sua conta: abrir `/admin`, importar, criar um rascunho, publicar, editar e apagar um card de teste.
- Com outra conta: confirmar que não abre o painel master.
- Com conta sem assinatura: confirmar que não recebe conteúdo nem acessando diretamente as URLs das antigas atividades gratuitas.
- Com assinante: abrir `/atividades`, escolher categoria e dificuldade, concluir a etapa de ouvir/repetir e depois selecionar.
- Verificar o cancelamento no portal Stripe e a expiração do acesso após o período pago.

O preço permanece **R$ 50,00 por mês**. Não é necessário recriar o preço no Stripe para esta atualização.
