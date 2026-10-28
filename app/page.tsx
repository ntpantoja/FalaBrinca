import Link from "next/link";
import { PLAN } from "../lib/plan";
export default function Landing() {
  return (
    <>
      <header className="marketing-header">
        <Link href="/" className="brand">
          Fala<span className="brand-light">Brinca</span>
          <span className="brand-spark">✦</span>
        </Link>
        <nav aria-label="Acesso">
          <Link className="text-link" href="/conta?modo=login">
            Entrar
          </Link>
          <Link className="primary small-primary" href="/conta?modo=cadastro">
            Criar minha conta →
          </Link>
        </nav>
      </header>
      <main className="marketing-main">
        <section className="sales-hero">
          <div>
            <span className="pill">
              PARA CRIANÇAS DE 3 A 5 ANOS · COM UM ADULTO
            </span>
            <h1>
              Pequenas palavras.
              <br />
              <em>Grandes descobertas.</em>
            </h1>
            <p>
              Um espaço educativo para a criança ouvir, repetir e reconhecer
              figuras, com atividades visuais e lúdicas. Sem precisar saber ler.
            </p>
            <Link className="primary" href="/conta?modo=cadastro">
              Quero fazer parte →
            </Link>
            <div className="hero-price">
              <strong>{PLAN.label}</strong>
              <span>por mês · assinatura com renovação automática</span>
            </div>
            <small>
              Crie sua conta, escolha a assinatura e explore com a criança.
            </small>
          </div>
          <div
            className="learning-preview"
            aria-label="Ilustração de como funciona a atividade"
          >
            <div className="preview-category">OUVIR · REPETIR · SELECIONAR</div>
            <div className="preview-picture">
              <span>🐶</span>
              <b>🔊</b>
            </div>
            <div className="preview-choices">
              <span>🐱</span>
              <span className="preview-correct">
                🐶<b>✓</b>
              </span>
              <span>🐰</span>
            </div>
            <div className="preview-caption">
              Uma figura. Uma palavra. Uma descoberta.
            </div>
            <span className="preview-spark">✦</span>
          </div>
        </section>
        <section className="sales-section">
          <span className="eyebrow">UMA ROTINA LEVE DE DESCOBERTAS</span>
          <h2>Começa simples. Cresce com a brincadeira.</h2>
          <div className="learning-steps">
            <article>
              <span>🔊</span>
              <b>01 · Ouvir e repetir</b>
              <p>
                Uma imagem aparece e o aplicativo fala seu nome. O adulto
                convida a criança a repetir e selecionar a figura.
              </p>
            </article>
            <article>
              <span>🧩</span>
              <b>02 · Fazer conexões</b>
              <p>
                Associações entre figuras e situações familiares, com instruções
                faladas e ajuda visual.
              </p>
            </article>
            <article>
              <span>💬</span>
              <b>03 · Contar histórias</b>
              <p>
                Sequências ilustradas para organizar ideias e conversar com o
                adulto, sem palavras escritas nos jogos.
              </p>
            </article>
          </div>
        </section>
        <section className="sales-categories">
          <div>
            <span className="eyebrow">UM MUNDO QUE A CRIANÇA RECONHECE</span>
            <h2>
              Animais, objetos
              <br />e alimentos.
            </h2>
            <p>
              Atividades organizadas por categoria e dificuldade, com tempo para
              observar, ouvir de novo e experimentar.
            </p>
          </div>
          <div className="category-preview">
            <span>
              🐶<small>Animais</small>
            </span>
            <span>
              ⚽<small>Objetos</small>
            </span>
            <span>
              🍎<small>Alimentos</small>
            </span>
          </div>
        </section>
        <section className="sales-plan" id="plano">
          <div>
            <span className="eyebrow">ASSINATURA FALABRINCA</span>
            <h2>
              Mais momentos para
              <br />
              aprender juntos.
            </h2>
            <p>
              Uma conta do responsável, uma biblioteca visual e novas
              possibilidades de conversa no dia a dia.
            </p>
            <ul>
              <li>Atividades por categoria e nível de dificuldade.</li>
              <li>Figuras grandes, áudio, ajuda e pausa.</li>
              <li>Favoritos e jardim de conquistas no dispositivo.</li>
              <li>Gerenciamento e cancelamento da renovação pelo portal.</li>
            </ul>
          </div>
          <div className="sales-price-card">
            <span className="pill">PLANO MENSAL</span>
            <div className="price">
              {PLAN.label}
              <span>/mês</span>
            </div>
            <p>
              Renovação automática até cancelar. Ao cancelar, o acesso continua
              até o fim do período pago.
            </p>
            <Link className="primary" href="/conta?modo=cadastro">
              Criar conta e assinar →
            </Link>
            <Link className="back" href="/conta?modo=login">
              Já tenho conta · entrar
            </Link>
            <small>
              O acesso às atividades exige login e assinatura ativa. Você
              confirma a compra no checkout seguro. O cadastro, por si só, não
              gera cobrança.
            </small>
          </div>
        </section>
        <aside className="parent-note">
          <span>🌿</span>
          <div>
            <strong>
              Educação com acolhimento, sem cobrança por desempenho.
            </strong>
            <p>
              O aplicativo incentiva a repetição, mas não grava a voz nem avalia
              a pronúncia. Não substitui avaliação ou terapia fonoaudiológica.
            </p>
          </div>
        </aside>
      </main>
      <footer className="marketing-footer">
        <span className="brand">
          Fala<span className="brand-light">Brinca</span>
        </span>
        <Link href="/informacoes">Uso, privacidade e assinatura</Link>
      </footer>
    </>
  );
}
