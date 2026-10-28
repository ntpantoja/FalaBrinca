import Link from "next/link";
export default function Information() {
  return (
    <main className="adult-panel">
      <Link className="brand" href="/">
        🦕 FalaBrinca
      </Link>
      <h1>
        Uso, privacidade
        <br />e assinatura
      </h1>
      <p>
        Informações da versão inicial. Antes da abertura comercial, o
        responsável pelo serviço deverá publicar sua identificação e canal de
        atendimento e revisar os termos e a política de privacidade completos.
      </p>
      <h2>Uma experiência educativa</h2>
      <p>
        As brincadeiras são destinadas a crianças de 3 a 5 anos com
        acompanhamento de um adulto. Não fazemos diagnóstico ou avaliação de
        pronúncia. O aplicativo não substitui avaliação ou terapia
        fonoaudiológica.
      </p>
      <h2>Conta do responsável</h2>
      <p>
        O cadastro é exclusivo para maiores de 18 anos. E-mail e credenciais de
        autenticação são tratados pelo Supabase. Não pedimos nome, data de
        nascimento ou gravações de voz da criança. Não use o e-mail da criança
        no cadastro.
      </p>
      <h2>Mensalidade e cancelamento</h2>
      <p>
        O plano custa R$ 50,00 por mês, com renovação automática até o
        cancelamento. Criar conta não gera cobrança. A compra só é realizada ao
        confirmar no checkout seguro do Stripe. Os métodos disponíveis aparecem
        nessa etapa.
      </p>
      <p>
        O plano inclui uma trilha com seis figuras extras. As três atividades
        demonstrativas continuam gratuitas. O cancelamento é feito em Minha
        conta → Gerenciar assinatura e cancelamento. Ao cancelar a renovação,
        você mantém acesso pelo período já pago. Falhas de pagamento podem
        suspender o conteúdo de assinantes.
      </p>
      <p>
        O cancelamento da renovação não gera reembolso automático. Direitos
        legais aplicáveis, incluindo o direito de arrependimento quando cabível,
        devem ser atendidos pelo responsável pelo serviço.
      </p>
      <h2>Dados e armazenamento</h2>
      <p>
        As estrelas ficam apenas neste navegador, não são sincronizadas com a
        conta e podem ser apagadas na área dos adultos ou ao limpar os dados do
        site. A sessão de login é mantida no navegador até sair ou expirar. Não
        compartilhe o dispositivo com sua conta aberta.
      </p>
      <p>
        O Stripe processa o pagamento; os dados de cartão não passam pelo
        FalaBrinca. O sistema guarda identificadores do cliente e da assinatura,
        status e datas para gerenciar acesso. Supabase, Stripe e a hospedagem
        tratam dados conforme suas próprias políticas. A voz das palavras é
        oferecida pelo navegador/dispositivo e pode usar serviços do fabricante.
      </p>
      <h2>Instalação e conexão</h2>
      <p>
        A trilha gratuita pode ser usada offline após o primeiro carregamento em
        produção. Cadastro, pagamentos e acesso à trilha de assinantes precisam
        de conexão. Informações da conta e respostas financeiras não são
        guardadas no cache offline.
      </p>
      <Link className="back" href="/conta">
        Voltar à área dos responsáveis
      </Link>
      <Link className="back" href="/">
        Voltar às brincadeiras
      </Link>
    </main>
  );
}
