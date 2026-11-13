# Ativar a biblioteca com 131 atividades

O atalho de prática guiada foi retirado. A biblioteca ganhou 104 atividades e passa de 27 para **131 atividades**, com **393 rodadas**, distribuídas nas oito categorias existentes.

| Formato | Atividades | Como brincar |
| --- | ---: | --- |
| Ouvir e reconhecer figuras | 83 | Ouvir a pronúncia, repetir se quiser e selecionar o desenho |
| Associações | 8 | Relacionar desenhos a uma pergunta falada |
| Histórias visuais | 8 | Organizar uma sequência de figuras |
| Quebra-cabeças | 24 | Montar três figuras por atividade, cada uma com quatro peças |
| Memória | 8 | Encontrar três pares por rodada, em três rodadas |

Não são apenas novos nomes para a mesma tela: as atividades de figuras trazem novos conjuntos temáticos, e os quebra-cabeças e a memória têm interações próprias. Há 216 ilustrações locais em SVG, com pictogramas e molduras coloridas, reaproveitadas nos novos formatos. Os jogos não exigem leitura, não avaliam pronúncia e não substituem terapia fonoaudiológica.

## 1. Atualizar o banco

No Supabase já usado pelo app, abra **SQL Editor → New query**. Copie todo o conteúdo de `supabase/playful-activities-migration.sql`, cole e clique em **Run**.

A atualização permite os formatos `puzzle` e `memory`. Não apaga nem altera o conteúdo dos cards, imagens ou áudios existentes. Pode ser executada novamente. Não muda preços, assinaturas, limite de dispositivos, usuários ou permissões do master.

## 2. Importar pelo master

Após a implantação da Vercel, entre em `/admin` com sua conta master:

1. Abra **Gestão de conteúdo**.
2. Clique em **Importar biblioteca (131)**.
3. Confira a confirmação e aceite a importação.
4. Abra **Área do usuário** para conferir as categorias e os novos atalhos.

Se as 27 atividades anteriores estiverem no banco, são acrescentadas 104. Cards com o mesmo identificador não são sobrescritos: suas edições e gravações permanecem. Atividades iniciais que você apagou são recriadas ao importar novamente, como a confirmação informa. Nada é reimportado automaticamente quando alguém abre o aplicativo.

As atividades novas usam voz automática inicialmente. Você pode gravar a pronúncia natural de cada figura em **Gestão de conteúdo**, como nos cards anteriores. A atualização não cria gravações humanas nem copia automaticamente áudios entre cards diferentes.

## Quebra-cabeças de quatro peças

No início há uma imagem pequena de referência, um quadro 2 × 2 e quatro peças embaralhadas. A criança pode:

- Arrastar uma peça com o dedo ou mouse até o espaço correspondente.
- Tocar na peça e depois no espaço, ou usar os botões pelo teclado.

Peças certas permanecem no lugar; tentativas em outro espaço permitem tentar novamente. Não há contagem regressiva ou perda de pontos. Depois das quatro peças, a seta avança para outra figura. A atividade concluída rende três estrelas, uma por figura montada. Uma pausa interrompe o tempo ativo registrado.

O master pode trocar a figura por uma ilustração própria, preferencialmente quadrada, e gravar seu áudio. As quatro peças são geradas automaticamente a partir da imagem. Se uma imagem não carregar, existe alternativa visual pelo pictograma.

## Jogo da memória

Há seis cartas, formando três pares. Ao virar uma carta, o app fala seu nome, usando a gravação se houver. Pares diferentes ficam visíveis por um breve período e voltam a ficar ocultos; pares encontrados permanecem. Não há limite de tentativas. A atividade completa tem nove pares em três rodadas e rende nove estrelas.

As seleções e encaixes entram no histórico de tentativas; não representam uma avaliação da fala. Palavras já praticadas não são duplicadas na contagem de vocabulário, mesmo se aparecerem em outro formato.

## Editar e criar novas brincadeiras

O editor agora tem **Formato da atividade**, além de categoria e dificuldade. Escolha **Quebra-cabeças** para uma imagem por rodada ou **Jogo da memória** para três figuras diferentes. A memória duplica as cartas automaticamente; não é preciso cadastrar seis imagens.

A mudança de formato pede confirmação e recria as rodadas do rascunho. A prévia usa o jogo correto, sem alterar o progresso da criança. Salve e publique para disponibilizar as alterações aos assinantes.

O acesso continua protegido por conta, assinatura/passe válido e dispositivo. O progresso permanece local no navegador, conforme a versão anterior.

## Material de desenvolvimento

`scripts/build-activity-library.py` mantém os conjuntos de vocabulário e gera os metadados, conteúdo inicial e SVGs. Requer Python somente para regenerar esse material; o app continua executando em Next.js/Node. Depois de alterar o gerador, execute-o e formate `lib/expanded-catalog.ts` e `lib/expanded-content.ts` com Prettier. O conteúdo das rodadas continua em módulo `server-only`; só os metadados entram no catálogo público do código cliente.

Os testes incluem conclusão das 131 atividades, arraste real de toque no Chromium, tentativas erradas, memória, editor/preview e migração repetível em PostgreSQL com preservação de uma gravação existente. Os serviços de autenticação e armazenamento da suíte de navegador são simulados; a configuração real do seu Supabase precisa receber a atualização acima.
