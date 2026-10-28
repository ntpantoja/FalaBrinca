"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity } from "../../components/activity";
import { type ActivityContent, type Adventure } from "../../lib/catalog";
import { browserAuth } from "../../lib/supabase-browser";
import { emptyProgress, readProgress, type Progress } from "../../lib/progress";
const categoryIcons = {
  all: "🗺️",
  animals: "🐶",
  objects: "⚽",
  foods: "🍎",
  favorites: "♡",
};
const categoryLabels = {
  all: "Todas",
  animals: "Animais",
  objects: "Objetos",
  foods: "Alimentos",
  favorites: "Favoritas",
};
const levelIcons = { beginner: "🌱", intermediate: "🌿", advanced: "🌳" };
export default function Library({
  activities,
  role,
}: {
  activities: Adventure[];
  role: string;
}) {
  const [view, setView] = useState<"library" | "garden" | "adult">("library");
  const [game, setGame] = useState<{
    adventure: Adventure;
    content: ActivityContent;
  } | null>(null);
  const [reward, setReward] = useState<{ title: string; stars: number } | null>(
    null,
  );
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [speech, setSpeech] = useState(false);
  const [category, setCategory] = useState<keyof typeof categoryIcons>("all");
  const [level, setLevel] = useState<keyof typeof levelIcons>("beginner");
  const [gate, setGate] = useState(false);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
    setSpeech("speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "falabrinca-progress-v3",
          JSON.stringify(progress),
        );
        localStorage.setItem("falabrinca-stars", String(progress.stars));
      } catch {}
  }, [ready, progress]);
  function speak(text: string) {
    if (!speech || !progress.sound) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "pt-BR";
    voice.rate = 0.8;
    window.speechSynthesis.speak(voice);
  }
  function navigate(next: typeof view) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setView(next);
    setGame(null);
    setReward(null);
    setMessage("");
  }
  async function start(adventure: Adventure) {
    setBusy(true);
    setMessage("");
    try {
      const auth = browserAuth();
      const session = auth ? (await auth.auth.getSession()).data.session : null;
      if (!session) {
        window.location.replace("/conta?modo=login");
        return;
      }
      const response = await fetch(`/api/activities/${adventure.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        window.location.replace("/conta?assinatura=necessaria");
        return;
      }
      if (!response.ok) throw new Error(data.error);
      setGame({ adventure, content: data });
      setReward(null);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível abrir essa atividade.",
      );
    } finally {
      setBusy(false);
    }
  }
  function complete(stars: number) {
    if (!game) return;
    const a = game.adventure;
    setProgress((p) => ({
      ...p,
      stars: p.stars + stars,
      completed: { ...p.completed, [a.id]: (p.completed[a.id] || 0) + 1 },
      lastActivity: a.id,
      history: [{ id: a.id, at: new Date().toISOString() }, ...p.history].slice(
        0,
        30,
      ),
    }));
    setGame(null);
    setReward({ title: a.title, stars });
  }
  const filtered = activities.filter(
    (a) =>
      a.difficulty === level &&
      (category === "all" ||
        (category === "favorites" && progress.favorites.includes(a.id)) ||
        a.category === category),
  );
  const completed = activities.filter((a) => progress.completed[a.id]).length;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("library")}>
          Fala<span className="brand-light">Brinca</span>
        </button>
        <nav aria-label="Navegação principal">
          <button
            className={view === "library" ? "nav-item active" : "nav-item"}
            aria-label="Atividades"
            onClick={() => navigate("library")}
          >
            ▦
          </button>
          <button
            className={view === "garden" ? "nav-item active" : "nav-item"}
            aria-label="Meu jardim"
            onClick={() => navigate("garden")}
          >
            ✿
          </button>
        </nav>
        <button
          className="parent-nav"
          onClick={() => {
            setGate(true);
            setAnswer("");
          }}
        >
          Área dos adultos ↗
        </button>
      </aside>
      <div className="main-shell">
        <header className="app-topbar">
          <button
            className="brand mobile-brand"
            onClick={() => navigate("library")}
          >
            FalaBrinca
          </button>
          <div className="topbar-copy" aria-hidden="true">
            🌱 · 🌿 · 🌳
          </div>
          <div className="topbar-actions">
            <button
              className="sound-button"
              aria-label={progress.sound ? "Desativar som" : "Ativar som"}
              aria-pressed={progress.sound}
              onClick={() => {
                setProgress((p) => ({ ...p, sound: !p.sound }));
                if ("speechSynthesis" in window)
                  window.speechSynthesis.cancel();
              }}
            >
              {progress.sound ? "🔊" : "🔇"}
            </button>
            <span
              className="star-count"
              aria-label={`${progress.stars} estrelas`}
            >
              ⭐ {progress.stars}
            </span>
            <button
              className="avatar-button"
              aria-label="Área dos adultos"
              onClick={() => {
                setGate(true);
                setAnswer("");
              }}
            >
              ♧
            </button>
          </div>
        </header>
        <main className="dashboard-main">
          {game ? (
            <Activity
              key={game.adventure.id}
              adventure={game.adventure}
              content={game.content}
              sound={speech && progress.sound}
              onExit={() => navigate("library")}
              onComplete={complete}
            />
          ) : reward ? (
            <section className="reward picture-reward">
              <div className="reward-orbit" aria-hidden="true">
                🌟
              </div>
              <h1 className="sr-only">Aventura concluída</h1>
              <div
                className="reward-stars"
                aria-label={`${reward.stars} estrelas ganhas`}
              >
                ⭐ +{reward.stars}
              </div>
              <p className="sr-only">
                {reward.title}: {progress.stars} estrelas no total.
              </p>
              <button
                className="primary picture-next"
                aria-label="Escolher outra atividade"
                onClick={() => navigate("library")}
              >
                ▦ →
              </button>
            </section>
          ) : view === "library" ? (
            <>
              <h1 className="sr-only">Escolha uma atividade</h1>
              <div
                className="level-picker"
                role="group"
                aria-label="Dificuldade"
              >
                {(Object.keys(levelIcons) as (keyof typeof levelIcons)[]).map(
                  (id, index) => (
                    <button
                      key={id}
                      aria-label={
                        [
                          "Inicial: ouvir e repetir",
                          "Intermediário: associar figuras",
                          "Avançado: histórias visuais",
                        ][index]
                      }
                      aria-pressed={level === id}
                      className={level === id ? "selected" : ""}
                      onClick={() => {
                        setLevel(id);
                        speak(
                          [
                            "Ouvir, repetir e selecionar.",
                            "Associar figuras.",
                            "Histórias com imagens.",
                          ][index],
                        );
                      }}
                    >
                      <span>{levelIcons[id]}</span>
                      <b aria-hidden="true">{"●".repeat(index + 1)}</b>
                    </button>
                  ),
                )}
              </div>
              <div className="library-controls">
                <div
                  className="filter-chips"
                  role="group"
                  aria-label="Categoria"
                >
                  {(
                    Object.keys(categoryIcons) as (keyof typeof categoryIcons)[]
                  ).map((id) => (
                    <button
                      key={id}
                      aria-label={categoryLabels[id]}
                      aria-pressed={category === id}
                      className={
                        category === id ? "filter-chip selected" : "filter-chip"
                      }
                      onClick={() => {
                        setCategory(id);
                        speak(categoryLabels[id]);
                      }}
                    >
                      {categoryIcons[id]}
                    </button>
                  ))}
                </div>
                <button
                  className="round-tool"
                  aria-label="Ouvir instruções"
                  onClick={() =>
                    speak(
                      "Escolha animais, objetos ou alimentos. Na primeira etapa, ouça a palavra, repita com seu adulto e depois toque na figura.",
                    )
                  }
                >
                  🔊
                </button>
              </div>
              <div className="adventure-grid">
                {filtered.map((a) => (
                  <article
                    className={`adventure-card ${a.color}`}
                    key={a.id}
                    data-activity-id={a.id}
                  >
                    <button
                      className={`favorite-button ${progress.favorites.includes(a.id) ? "favorited" : ""}`}
                      aria-label={`${progress.favorites.includes(a.id) ? "Remover dos" : "Adicionar aos"} favoritos: ${a.title}`}
                      aria-pressed={progress.favorites.includes(a.id)}
                      onClick={() =>
                        setProgress((p) => ({
                          ...p,
                          favorites: p.favorites.includes(a.id)
                            ? p.favorites.filter((id) => id !== a.id)
                            : [...p.favorites, a.id],
                        }))
                      }
                    >
                      {progress.favorites.includes(a.id) ? "♥" : "♡"}
                    </button>
                    <button
                      className="adventure-open picture-card-open"
                      aria-label={`Jogar ${a.title}`}
                      disabled={busy}
                      onClick={() => void start(a)}
                    >
                      <div className="card-art">
                        <span className="card-decoration">✦</span>
                        <span className="card-emoji" aria-hidden="true">
                          {a.emoji}
                        </span>
                      </div>
                      <h2 className="sr-only">{a.title}</h2>
                      <div className="activity-meta" aria-hidden="true">
                        <span>
                          {categoryIcons[a.category]} ·{" "}
                          {levelIcons[a.difficulty]}
                        </span>
                        <span className="play-circle">
                          {progress.completed[a.id] ? (
                            "✓"
                          ) : (
                            <span className="small-triangle" />
                          )}
                        </span>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <span aria-hidden="true">🌱</span>
                  <p className="sr-only">
                    Nenhuma atividade nessa seleção. Escolha outra categoria ou
                    nível.
                  </p>
                </div>
              )}
              <span className="sr-only" role="status">
                {message}
              </span>
            </>
          ) : view === "garden" ? (
            <section className="garden-page">
              <h1 className="sr-only">Seu jardim</h1>
              <div className="garden-heading" aria-hidden="true">
                🌱 🌼 🌳 🌈
              </div>
              <div className="garden-stats">
                <div aria-label={`${progress.stars} estrelas`}>
                  <span>⭐</span>
                  <strong>{progress.stars}</strong>
                </div>
                <div
                  aria-label={`${completed} de ${activities.length} atividades concluídas`}
                >
                  <span>🗺️</span>
                  <strong>
                    {completed}/{activities.length}
                  </strong>
                </div>
                <div aria-label={`${progress.favorites.length} favoritas`}>
                  <span>♡</span>
                  <strong>{progress.favorites.length}</strong>
                </div>
              </div>
              <div className="badge-grid">
                {[1, 3, 6, 12, 18, 24].map((n, i) => (
                  <button
                    key={n}
                    className={`badge-card ${completed >= n ? "unlocked" : ""}`}
                    aria-label={`Conquista de ${n} atividades`}
                    onClick={() =>
                      speak(
                        completed >= n
                          ? "Que bela descoberta!"
                          : `Vamos explorar ${n} atividades, sem pressa.`,
                      )
                    }
                  >
                    <span>{["🥚", "🌱", "🌼", "🌳", "🌈", "🏆"][i]}</span>
                    <small>
                      {completed >= n ? "⭐" : "🔒"} {n}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="adult-panel">
              <span className="eyebrow">ÁREA DOS RESPONSÁVEIS</span>
              <h1>Descobrir no seu tempo.</h1>
              <p>
                As atividades iniciais mostram uma imagem e pronunciam seu nome.
                Convide a criança a repetir e depois selecionar. O aplicativo
                não grava a voz nem avalia a pronúncia.
              </p>
              <p>
                🌱 Inicial: ouvir, repetir e selecionar. 🌿 Intermediário:
                associar figuras. 🌳 Avançado: montar histórias visuais.
              </p>
              <p>
                As categorias são animais, objetos e alimentos. Você pode usar o
                alto-falante para ouvir novamente e o botão de pausa para
                descansar.
              </p>
              <Link className="primary" href="/conta">
                Minha conta e assinatura →
              </Link>
              {role === "master" && (
                <Link className="secondary" href="/admin">
                  Administrar conteúdo · acesso master
                </Link>
              )}
              <h2>Progresso no dispositivo</h2>
              <p>
                {progress.stars} estrelas e {completed} atividades concluídas.
                Esse progresso fica neste navegador, mesmo ao trocar de conta.
              </p>
              <button
                className="secondary"
                onClick={() => {
                  if (
                    window.confirm(
                      "Apagar estrelas, histórico e favoritos deste dispositivo?",
                    )
                  )
                    setProgress({ ...emptyProgress });
                }}
              >
                Apagar progresso local
              </button>
              <Link className="back" href="/informacoes">
                Uso e privacidade
              </Link>
              <button
                className="back"
                onClick={async () => {
                  await browserAuth()?.auth.signOut();
                  window.location.replace("/");
                }}
              >
                Sair da conta
              </button>
            </section>
          )}
        </main>
        <footer className="app-footer">
          <span className="sr-only">
            Educativo. Não substitui terapia fonoaudiológica.
          </span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Navegação no celular">
        <button
          aria-label="Atividades"
          className={view === "library" ? "active" : ""}
          onClick={() => navigate("library")}
        >
          ▦
        </button>
        <button
          aria-label="Meu jardim"
          className={view === "garden" ? "active" : ""}
          onClick={() => navigate("garden")}
        >
          ✿
        </button>
      </nav>
      {gate && (
        <div className="modal-backdrop">
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Área dos adultos"
            onSubmit={(e) => {
              e.preventDefault();
              if (answer === "12") {
                setGate(false);
                navigate("adult");
              }
            }}
          >
            <h2>Agora é com o adulto</h2>
            <p>Quanto é 7 + 5?</p>
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
            <button className="primary">Continuar</button>
            <button
              className="back"
              type="button"
              onClick={() => setGate(false)}
            >
              Voltar à atividade
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
