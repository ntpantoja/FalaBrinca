# Gravar a pronúncia das figuras

## Ativar uma vez

1. No GitHub, abra `supabase/recorded-audio-migration.sql` e copie o conteúdo inteiro.
2. No Supabase do FalaBrinca, abra **SQL Editor → New query**, cole e clique em **Run**.
3. Isso cria o bucket `activity-audio`. Não precisa alterar as variáveis da Vercel nem liberar uploads públicos. As atividades atuais continuam funcionando.

## Gravar pelo painel master

1. Abra https://falabrinca-43kf.vercel.app/admin com sua conta master.
2. Abra **Gestão de conteúdo** e clique em **Editar** na atividade desejada.
3. Na imagem, encontre **Pronúncia gravada → Gravar áudio** e permita o microfone no navegador.
4. Fale apenas a palavra ou uma frase curta. Clique em **Parar gravação**; o limite automático é 20 segundos e 3 MB.
5. Ouça a prévia. Clique em **Usar este áudio** para enviar, ou **Descartar** para refazer.
6. Clique em **Salvar atividade**. Se desejar disponibilizar aos assinantes, mantenha a atividade publicada.
7. Abra a atividade: com o som ativado, a gravação começa automaticamente e cada nova figura também é narrada. O alto-falante permite ouvir novamente.

É possível ouvir o áudio salvo, gravar novamente ou removê-lo para voltar à voz automática. Cada figura em cada rodada tem seu próprio vínculo: gravar uma figura não altera automaticamente as outras aparições dela. A voz gravada mantém o ritmo natural; o volume e o botão de som das configurações são respeitados.

Nas atividades iniciais, a gravação substitui a pronúncia automática do modelo e do botão Ouvir. Nas associações e histórias, a figura selecionada reproduz sua gravação; perguntas, frases completas e mensagens de incentivo ainda podem usar voz automática. Se não houver gravação ou o arquivo falhar, o app tenta a voz automática disponível no dispositivo.

Use Chrome, Edge ou Safari atualizado e HTTPS. Se a reprodução automática for bloqueada pelo celular, toque no alto-falante. O microfone é solicitado somente ao gravar no painel master. Nada é gravado das crianças durante a atividade.

Os áudios de conteúdo ficam em arquivos públicos, como as ilustrações. Grave somente o material educativo que deseja disponibilizar, sem informações pessoais. Ao remover ou substituir o áudio no editor, o vínculo é alterado; arquivos antigos permanecem no Storage e podem ser limpos manualmente depois, conferindo antes se estão em uso. Gravações enviadas exigem salvar a atividade para alterar a biblioteca.
