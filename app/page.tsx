"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, type ActivityKind } from "../components/activity";
import { figures, type FigureRound } from "../lib/activities";
import { browserAuth } from "../lib/supabase-browser";
export default function Home() {
  const [screen, setScreen] = useState<"home" | "game" | "reward" | "adult">(
    "home",
  );
  const [kind, setKind] = useState<ActivityKind>("figures");
  const [rounds, setRounds] = useState(figures);
  const [stars, setStars] = useState(0);
  const [earned, setEarned] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [speech, setSpeech] = useState(false);
  const [gate, setGate] = useState(false);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      const count = Number(localStorage.getItem("falabrinca-stars"));
      if (Number.isSafeInteger(count) && count > 0) setStars(count);
    } catch {}
    setLoaded(true);
    setSpeech("speechSynthesis" in window);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (
      new URLSearchParams(window.location.search).get("aventura") === "premium"
    )
      void premium();
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem("falabrinca-stars", String(stars));
      } catch {}
  }, [loaded, stars]);
  function start(activity: ActivityKind = "figures", data = figures) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setKind(activity);
    setRounds(data);
    setScreen("game");
    setMessage("");
  }
  function exit() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setScreen("home");
  }
  async function premium() {
    setBusy(true);
    setMessage("");
    try {
      const auth = browserAuth();
      if (!auth)
        throw new Error(
          "A trilha de assinantes será liberada após a configuração das contas. As três atividades gratuitas já estão disponíveis.",
        );
      const {
        data: { session },
      } = await auth.auth.getSession();
      if (!session) {
        setGate(true);
        setMessage(
          "Entre na área dos adultos para criar sua conta ou consultar a assinatura.",
        );
        return;
      }
      const response = await fetch("/api/activities/premium", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      start("premium", data.rounds as FigureRound[]);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível abrir a trilha. Confira sua conexão.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header>
        <button
          className="brand"
          aria-label="FalaBrinca, início"
          onClick={exit}
        >
          <span>🦕</span> Fala<span className="brand-light">Brinca</span>
        </button>
        <button
          className="adult-link"
          onClick={() => {
            setGate(true);
            setAnswer("");
          }}
        >
          Área dos adultos ↗
        </button>
      </header>
      <main>
        {screen === "home" && (
          <>
            <div className="eyebrow">
              PEQUENAS PALAVRAS, GRANDES DESCOBERTAS
            </div>
            <section className="hero">
              <div>
                <span className="pill">
                  🌿 Para explorar juntos • 3 a 5 anos
                </span>
                <h1>
                  Uma aventura
                  <br />a cada <em>palavra.</em>
                </h1>
                <p>
                  Conheça o Dino e descubra um mundo de figuras, sons e muita
                  imaginação. Vamos brincar de falar?
                </p>
                <button className="primary" onClick={() => start()}>
                  Começar a brincar <span>→</span>
                </button>
                <small>Sem pressa. Cada criança tem seu ritmo.</small>
              </div>
              <div
                className="dino-scene"
                aria-label="Dinossauro em uma paisagem com plantas"
              >
                <span className="sun">☀</span>
                <span className="cloud">☁</span>
                <span className="dino">🦕</span>
                <span className="plant">🌿</span>
                <span className="hello">Oi! Eu sou o Dino!</span>
                <span className="scene-caption">
                  SEU COMPANHEIRO DE DESCOBERTAS
                </span>
              </div>
            </section>
            <section className="adventures">
              <div className="section-title">
                <div>
                  <span className="eyebrow">TRILHA DAS DESCOBERTAS</span>
                  <h2>Vamos explorar?</h2>
                </div>
                <span className="star-count">⭐ {stars} estrelas</span>
              </div>
              <div className="cards">
                <button className="activity available" onClick={() => start()}>
                  <span className="activity-art">🍎 🦕</span>
                  <span className="tag">JOGUE AGORA • GRATUITO</span>
                  <h3>Que figura é essa?</h3>
                  <p>Ouça, encontre e fale com o Dino.</p>
                  <span className="card-bottom">
                    3 descobertas <b>→</b>
                  </span>
                </button>
                <button
                  className="activity available"
                  onClick={() => start("association")}
                >
                  <span className="activity-art lavender">🐱 🧩</span>
                  <span className="tag">JOGUE AGORA • GRATUITO</span>
                  <h3>Palavras que combinam</h3>
                  <p>Associe figuras em situações do dia a dia.</p>
                  <span className="card-bottom">
                    3 associações <b>→</b>
                  </span>
                </button>
                <button
                  className="activity available"
                  onClick={() => start("sentence")}
                >
                  <span className="activity-art peach">💬 🌈</span>
                  <span className="tag">JOGUE AGORA • GRATUITO</span>
                  <h3>Minha primeira frase</h3>
                  <p>Monte frases curtas com ajuda do adulto.</p>
                  <span className="card-bottom">
                    3 frases <b>→</b>
                  </span>
                </button>
              </div>
              <div className="premium-card">
                <div>
                  <span className="tag">TRILHA DE ASSINANTES</span>
                  <h3>Mais palavras para explorar 🦕</h3>
                  <p>Seis figuras extras na aventura do Dino.</p>
                </div>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void premium()}
                >
                  {busy ? "Abrindo…" : "Explorar a trilha →"}
                </button>
              </div>
              <p role="status" className="feedback">
                {message}
              </p>
            </section>
            <aside className="parent-note">
              <span>🤝</span>
              <div>
                <strong>Uma brincadeira para fazer em companhia</strong>
                <p>
                  O adulto pode nomear as figuras, dar exemplos e celebrar cada
                  tentativa. Não é preciso acertar de primeira.
                </p>
              </div>
            </aside>
          </>
        )}
        {screen === "game" && (
          <Activity
            key={`${kind}-${screen}`}
            kind={kind}
            rounds={rounds}
            speech={speech}
            onExit={exit}
            onComplete={(count) => {
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              setEarned(count);
              setStars((total) => total + count);
              setScreen("reward");
            }}
          />
        )}
        {screen === "reward" && (
          <section className="reward">
            <span className="game-dino">🦕</span>
            <div className="reward-stars">⭐ ⭐ ⭐</div>
            <h1>Que bela descoberta!</h1>
            <p>Vocês ganharam {earned} estrelas explorando palavras juntos.</p>
            <p>
              Seu jardim já tem <strong>{stars} estrelas</strong>. Cada
              tentativa merece carinho!
            </p>
            <button
              className="primary"
              onClick={() =>
                kind === "premium" ? void premium() : start(kind)
              }
            >
              Brincar de novo →
            </button>
            <button className="back" onClick={exit}>
              Voltar à trilha
            </button>
            <p role="status">{message}</p>
          </section>
        )}
        {screen === "adult" && (
          <section className="adult-panel">
            <button className="back" onClick={exit}>
              ← Voltar
            </button>
            <span className="eyebrow">ESPAÇO DOS RESPONSÁVEIS</span>
            <h1>
              Aprender juntos,
              <br />
              um pouquinho por dia.
            </h1>
            <p>
              O FalaBrinca é uma experiência educativa de estímulo à linguagem.
              Não substitui avaliação, orientação ou terapia fonoaudiológica.
            </p>
            <div className="subscription">
              <span className="pill">CONTA E ASSINATURA</span>
              <h2>Mais aventuras com o Dino</h2>
              <p>
                As três atividades demonstrativas são gratuitas. O plano de R$
                50,00 por mês inclui uma trilha com seis figuras extras.
              </p>
              <Link href="/conta" className="primary">
                Criar conta ou entrar →
              </Link>
              <p>
                Na sua conta, você pode assinar, conferir o pagamento e
                gerenciar o cancelamento.
              </p>
            </div>
            <h2>Privacidade nesta versão</h2>
            <p>
              Não gravamos voz nem pedimos dados da criança. As estrelas ficam
              somente neste navegador, separadas da conta do adulto.
            </p>
            <button
              className="back"
              onClick={() => {
                setStars(0);
                setMessage("Estrelas apagadas deste dispositivo.");
              }}
            >
              Apagar estrelas deste dispositivo
            </button>
            <p role="status">{message}</p>
            <h2>Instalar no celular</h2>
            <p>
              No Android, use “Instalar aplicativo” no menu do navegador. No
              iPhone, abra no Safari e use Compartilhar → Adicionar à Tela de
              Início.
            </p>
            <Link className="back" href="/informacoes">
              Uso, privacidade e assinatura
            </Link>
          </section>
        )}
      </main>
      <footer>
        <span>🦕 FalaBrinca</span>
        <p>Brincar, descobrir e se expressar. No seu tempo.</p>
        <small>Recurso educativo. Não substitui terapia fonoaudiológica.</small>
      </footer>
      {gate && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(event) => {
              event.preventDefault();
              if (answer.trim() === "12") {
                setScreen("adult");
                setGate(false);
                setMessage("");
              }
            }}
          >
            <h2>Um momento para o adulto</h2>
            <p>Para abrir a área dos responsáveis, quanto é 7 + 5?</p>
            <label>
              Resposta
              <input
                inputMode="numeric"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                autoFocus
              />
            </label>
            <small>
              Esta etapa é um lembrete de acompanhamento. O acesso à assinatura
              exige login.
            </small>
            <button className="primary" type="submit">
              Continuar
            </button>
            {answer && answer !== "12" && <p>Confira a soma para continuar.</p>}
            <button
              className="back"
              type="button"
              onClick={() => setGate(false)}
            >
              Voltar à brincadeira
            </button>
          </form>
        </div>
      )}
    </>
  );
}
