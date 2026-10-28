"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity } from "../components/activity";
import { DinoScene } from "../components/dino-scene";
import {
  catalog,
  kindLabels,
  type ActivityContent,
  type Adventure,
  type ActivityKind,
} from "../lib/catalog";
import { freeContent } from "../lib/free-content";
import { browserAuth } from "../lib/supabase-browser";
import { emptyProgress, readProgress, type Progress } from "../lib/progress";
const badges = [
  { count: 1, emoji: "🥚", name: "Primeira descoberta" },
  { count: 3, emoji: "🌱", name: "Pequeno explorador" },
  { count: 6, emoji: "🌼", name: "Jardim de palavras" },
  { count: 12, emoji: "🦕", name: "Amigo do Dino" },
  { count: 18, emoji: "🌈", name: "Mundo de histórias" },
  { count: 24, emoji: "🏆", name: "Grande explorador" },
];
export default function Home() {
  const [view, setView] = useState<"home" | "library" | "garden" | "adult">(
    "home",
  );
  const [game, setGame] = useState<{
    adventure: Adventure;
    content: ActivityContent;
  } | null>(null);
  const [reward, setReward] = useState<{
    adventure: Adventure;
    stars: number;
  } | null>(null);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [speech, setSpeech] = useState(false);
  const [child, setChild] = useState("");
  const [subscriber, setSubscriber] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | ActivityKind | "favorites" | "free"
  >("all");
  const [gate, setGate] = useState(false);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setProgress(readProgress());
    setLoaded(true);
    setSpeech("speechSynthesis" in window);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const auth = browserAuth();
    if (auth)
      void auth.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) return;
        void fetch("/api/account", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })
          .then(async (response) => {
            if (response.ok)
              setSubscriber((await response.json()).active === true);
          })
          .catch(() => {});
        try {
          const response = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          });
          if (response.ok) {
            const data = await response.json();
            setChild(data.profile?.child_first_name || "");
          }
        } catch {}
      });
    const id = new URLSearchParams(window.location.search).get("atividade");
    if (id && catalog.some((a) => a.id === id))
      void start(catalog.find((a) => a.id === id)!);
    else if (
      new URLSearchParams(window.location.search).get("aventura") === "premium"
    )
      setView("library");
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          "falabrinca-progress-v3",
          JSON.stringify(progress),
        );
        localStorage.setItem("falabrinca-stars", String(progress.stars));
      } catch {}
  }, [progress, loaded]);
  function navigate(next: typeof view) {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setGame(null);
    setReward(null);
    setView(next);
    setMessage("");
  }
  async function start(adventure: Adventure) {
    setMessage("");
    if (adventure.free) {
      setGame({ adventure, content: freeContent[adventure.id] });
      setReward(null);
      return;
    }
    setBusy(true);
    try {
      const auth = browserAuth();
      const session = auth ? (await auth.auth.getSession()).data.session : null;
      if (!session) {
        setMessage(
          "Essa aventura faz parte do plano mensal. Peça ao adulto para entrar na conta.",
        );
        setGate(true);
        setAnswer("");
        return;
      }
      const response = await fetch(`/api/activities/${adventure.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGame({ adventure, content: data });
      setReward(null);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível abrir a aventura. Confira sua conexão.",
      );
    } finally {
      setBusy(false);
    }
  }
  function complete(stars: number) {
    if (!game) return;
    const adventure = game.adventure;
    setProgress((p) => ({
      ...p,
      stars: p.stars + stars,
      completed: {
        ...p.completed,
        [adventure.id]: (p.completed[adventure.id] || 0) + 1,
      },
      lastActivity: adventure.id,
      history: [
        { id: adventure.id, at: new Date().toISOString() },
        ...p.history,
      ].slice(0, 30),
    }));
    setGame(null);
    setReward({ adventure, stars });
  }
  function favorite(id: string) {
    setProgress((p) => ({
      ...p,
      favorites: p.favorites.includes(id)
        ? p.favorites.filter((item) => item !== id)
        : [...p.favorites, id],
    }));
  }
  const completed = Object.keys(progress.completed).filter((id) =>
    catalog.some((a) => a.id === id),
  ).length;
  const filtered = catalog.filter(
    (a) =>
      (filter === "all" ||
        (filter === "favorites" && progress.favorites.includes(a.id)) ||
        (filter === "free" && a.free) ||
        a.kind === filter) &&
      `${a.title} ${a.description}`
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .includes(
          query
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase(),
        ),
  );
  const suggestion =
    catalog.filter((a) => a.free).find((a) => !progress.completed[a.id]) ||
    catalog[0];
  function narrate(text: string) {
    if (!speech || !progress.sound) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "pt-BR";
    voice.rate = 0.8;
    window.speechSynthesis.speak(voice);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="FalaBrinca, início"
        >
          <span className="brand-mark">🦕</span>Fala
          <span className="brand-light">Brinca</span>
        </button>
        <nav aria-label="Navegação principal">
          {(
            [
              ["home", "⌂", "Início"],
              ["library", "▦", "Atividades"],
              ["garden", "✿", "Meu jardim"],
            ] as const
          ).map(([id, icon, title]) => (
            <button
              key={id}
              className={view === id && !game ? "nav-item active" : "nav-item"}
              onClick={() => navigate(id)}
              aria-label={title}
            >
              <span>{icon}</span>
              <span className="sr-only">{title}</span>
              {id === "library" && <small>24</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-garden" aria-hidden="true">
          🌱<span>✦</span>🦕
        </div>
        <button
          className="parent-nav"
          onClick={() => {
            setGate(true);
            setAnswer("");
          }}
        >
          ♧ Área dos adultos ↗
        </button>
      </aside>
      <div className="main-shell">
        <header className="app-topbar">
          <button
            className="mobile-brand brand"
            onClick={() => navigate("home")}
          >
            🦕 FalaBrinca
          </button>
          <div className="topbar-copy" aria-hidden="true">
            🌿 · ✦ · 🦕
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
                🦕<span>✨</span>
              </div>
              <h1 className="sr-only">Aventura concluída</h1>
              <div
                className="reward-stars"
                aria-label={`${reward.stars} estrelas ganhas`}
              >
                ⭐ +{reward.stars}
              </div>
              <p className="sr-only">
                Vocês concluíram {reward.adventure.title}. Seu jardim já tem{" "}
                {progress.stars} estrelas.
              </p>
              <div className="picture-reward-actions">
                <button
                  className="primary picture-next"
                  aria-label="Escolher outra aventura"
                  onClick={() => navigate("library")}
                >
                  ▦ →
                </button>
                <button
                  className="round-tool"
                  aria-label="Brincar de novo"
                  onClick={() => void start(reward.adventure)}
                >
                  ↺
                </button>
                <button
                  className="round-tool"
                  aria-label="Ver meu jardim de conquistas"
                  onClick={() => navigate("garden")}
                >
                  🌱
                </button>
              </div>
              <span className="sr-only" role="status">
                {message}
              </span>
            </section>
          ) : (
            <>
              {(view === "home" || view === "library") && (
                <>
                  <h1 className="sr-only">
                    {view === "home"
                      ? "Bem-vindos ao mundo do Dino"
                      : "Biblioteca de 24 atividades com figuras"}
                  </h1>
                  {view === "home" && (
                    <>
                      <section className="welcome-hero picture-hero">
                        <DinoScene />
                        <div className="picture-hero-actions">
                          <button
                            className="primary big-play"
                            aria-label="Começar a brincar"
                            onClick={() => void start(catalog[0])}
                          >
                            <span
                              className="play-triangle"
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            className="round-tool"
                            aria-label="Ouvir boas-vindas e instruções"
                            onClick={() =>
                              narrate(
                                `Olá${child ? `, ${child}` : ""}! Eu sou o Dino! Vamos brincar? Toque na seta para começar, ou escolha um desenho. Peça ao seu adulto para brincar junto.`,
                              )
                            }
                          >
                            🔊
                          </button>
                        </div>
                        <span className="floating-star" aria-hidden="true">
                          ✦
                        </span>
                      </section>
                      <div className="discovery-row">
                        <button
                          className="daily-card picture-daily"
                          aria-label={`Sugestão para hoje: ${suggestion.title}`}
                          onClick={() => void start(suggestion)}
                        >
                          <span className="daily-emoji">
                            {suggestion.emoji}
                          </span>
                          <div aria-hidden="true">☀️ · ● ● ●</div>
                          <span>▶</span>
                        </button>
                        <button
                          className="journey-card"
                          aria-label={`Meu jardim: ${completed} de 24 aventuras exploradas`}
                          onClick={() => navigate("garden")}
                        >
                          <span>🌱</span>
                          <div>
                            <strong>{completed} / 24</strong>
                            <progress
                              value={completed}
                              max={24}
                              aria-label="Atividades exploradas"
                            />
                          </div>
                          <span>→</span>
                        </button>
                      </div>
                    </>
                  )}
                  <section className="library-section">
                    <div className="section-title picture-section-title">
                      <span aria-hidden="true">
                        🗺️ <b>24</b>
                      </span>
                      <h2 className="sr-only">Escolha uma aventura</h2>
                      <button
                        className="round-tool"
                        aria-label="Ouvir como escolher uma atividade"
                        onClick={() =>
                          narrate(
                            "Escolha um desenho para brincar. O coração guarda suas atividades favoritas. As figuras com cadeado precisam da ajuda do adulto para entrar na assinatura.",
                          )
                        }
                      >
                        🔊
                      </button>
                    </div>
                    <div className="library-controls">
                      <div
                        className="filter-chips"
                        role="group"
                        aria-label="Filtrar atividades"
                      >
                        {(
                          [
                            ["all", "🗺️", "Todas"],
                            ["figures", "🖼️", "Figuras"],
                            ["association", "🧩", "Associações"],
                            ["sentence", "💬", "Histórias em imagens"],
                            ["free", "🎁", "Gratuitas"],
                            ["favorites", "♡", "Favoritas"],
                          ] as const
                        ).map(([id, icon, label]) => (
                          <button
                            key={id}
                            aria-label={label}
                            aria-pressed={filter === id}
                            className={
                              filter === id
                                ? "filter-chip selected"
                                : "filter-chip"
                            }
                            onClick={() => {
                              setFilter(id);
                              setQuery("");
                              narrate(label);
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                      <span
                        className="catalog-count"
                        aria-label={`${filtered.length} atividades`}
                      >
                        {filtered.length} ✦
                      </span>
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
                            onClick={() => favorite(a.id)}
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
                              <span
                                className="access-tag"
                                aria-label={
                                  a.free
                                    ? "Gratuito"
                                    : subscriber
                                      ? "Incluída na sua assinatura"
                                      : "Plano de assinantes"
                                }
                              >
                                {a.free ? "🎁" : subscriber ? "🌟" : "🔒"}
                              </span>
                            </div>
                            <h3 className="sr-only">{a.title}</h3>
                            <div className="activity-meta" aria-hidden="true">
                              <span>
                                {a.kind === "figures"
                                  ? "🖼️"
                                  : a.kind === "association"
                                    ? "🧩"
                                    : "💬"}{" "}
                                · ● ● ●
                              </span>
                              <span
                                className={
                                  progress.completed[a.id]
                                    ? "completion-label"
                                    : "play-circle"
                                }
                              >
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
                        <span aria-hidden="true">♡ 🦕</span>
                        <p className="sr-only">
                          Salve uma favorita tocando no coração.
                        </p>
                        <button
                          className="round-tool"
                          aria-label="Ver todas as aventuras"
                          onClick={() => setFilter("all")}
                        >
                          🗺️
                        </button>
                      </div>
                    )}
                    <span className="sr-only" role="status">
                      {message}
                    </span>
                  </section>
                </>
              )}
              {view === "garden" && (
                <section className="garden-page">
                  <h1 className="sr-only">Seu jardim de descobertas</h1>
                  <div className="garden-heading" aria-hidden="true">
                    🌱 🌼 🦕 🌈
                  </div>
                  <div className="garden-stats">
                    <div aria-label={`${progress.stars} estrelas`}>
                      <span>⭐</span>
                      <strong>{progress.stars}</strong>
                    </div>
                    <div aria-label={`${completed} de 24 aventuras exploradas`}>
                      <span>🗺️</span>
                      <strong>{completed}/24</strong>
                    </div>
                    <div aria-label={`${progress.favorites.length} favoritas`}>
                      <span>♡</span>
                      <strong>{progress.favorites.length}</strong>
                    </div>
                  </div>
                  <h2 className="sr-only">Pequenas conquistas</h2>
                  <div className="badge-grid">
                    {badges.map((b) => (
                      <button
                        key={b.count}
                        className={`badge-card ${completed >= b.count ? "unlocked" : ""}`}
                        aria-label={`${b.name}: ${completed >= b.count ? "conquistada" : `explore ${b.count} aventuras`}`}
                        onClick={() =>
                          narrate(
                            completed >= b.count
                              ? `Você conquistou: ${b.name}!`
                              : `Explore ${b.count} aventuras para essa descoberta.`,
                          )
                        }
                      >
                        <span>{b.emoji}</span>
                        <small aria-hidden="true">
                          {completed >= b.count ? "⭐" : "🔒"} {b.count}
                        </small>
                      </button>
                    ))}
                  </div>
                  <h2 className="sr-only">Últimas descobertas</h2>
                  {!progress.history.length ? (
                    <div className="empty-state">
                      <span>🗺️ 🦕</span>
                      <button
                        className="primary picture-next"
                        aria-label="Explorar atividades"
                        onClick={() => navigate("library")}
                      >
                        ▶
                      </button>
                    </div>
                  ) : (
                    <div className="history-list">
                      {progress.history.slice(0, 8).map((h, i) => {
                        const a = catalog.find((item) => item.id === h.id);
                        return a ? (
                          <button
                            key={`${h.at}-${i}`}
                            aria-label={`Jogar novamente ${a.title}`}
                            onClick={() => void start(a)}
                          >
                            <span>{a.emoji}</span>
                            <span className="history-stars" aria-hidden="true">
                              ⭐ ⭐ ⭐
                            </span>
                            <b>↺</b>
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}
                  <span className="sr-only" role="status">
                    {message}
                  </span>
                </section>
              )}
              {view === "adult" && (
                <section className="adult-panel">
                  <span className="eyebrow">ESPAÇO DOS RESPONSÁVEIS</span>
                  <h1>
                    Um cantinho para
                    <br />
                    cuidar das descobertas.
                  </h1>
                  <p>
                    Todas as atividades da criança funcionam com figuras e
                    áudio, sem depender de leitura. Explore junto e celebre cada
                    tentativa.
                  </p>
                  <div className="subscription">
                    <span className="pill">EXPLORADORES DO DINO</span>
                    <h2>24 atividades visuais. Muitas conversas.</h2>
                    <p>
                      São 72 rodadas em três modos: reconhecer figuras, fazer
                      associações e organizar histórias com imagens. Três
                      atividades são gratuitas; o plano de R$ 50,00 por mês
                      libera as outras 21.
                    </p>
                    <Link href="/conta" className="primary">
                      Criar conta ou entrar →
                    </Link>
                  </div>
                  <h2>Escolher uma atividade para a criança</h2>
                  <label className="search-box">
                    <span>⌕</span>
                    <input
                      type="search"
                      aria-label="Buscar atividade"
                      placeholder="Buscar atividade…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <div className="adult-activity-list">
                    {catalog
                      .filter((a) =>
                        a.title.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((a) => (
                        <button
                          key={a.id}
                          disabled={busy}
                          onClick={() => void start(a)}
                        >
                          <span>{a.emoji}</span>
                          <div>
                            <strong>{a.title}</strong>
                            <small>
                              {kindLabels[a.kind]} ·{" "}
                              {a.free ? "gratuito" : "assinantes"}
                            </small>
                          </div>
                          <b>→</b>
                        </button>
                      ))}
                  </div>
                  <h2>O jardim neste dispositivo</h2>
                  <p>
                    {progress.stars} estrelas e {completed} atividades
                    exploradas. Histórico e favoritos ficam neste navegador,
                    separados dos nomes da conta e mesmo ao trocar de usuário.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Apagar estrelas, favoritos e histórico deste dispositivo? Isso não altera a assinatura.",
                        )
                      ) {
                        setProgress({ ...emptyProgress });
                        setMessage("Progresso apagado deste dispositivo.");
                      }
                    }}
                  >
                    Apagar progresso deste dispositivo
                  </button>
                  <h2>Uma rotina leve</h2>
                  <p>
                    O alto-falante repete as instruções. A lâmpada oferece uma
                    ajuda visual. O botão de pausa permite descansar. Se o
                    dispositivo não tiver voz em português, o adulto pode narrar
                    a atividade; os jogos de figuras também oferecem modelos
                    visuais.
                  </p>
                  <h2>Instalar no celular</h2>
                  <p>
                    No Android, use “Instalar aplicativo”. No iPhone, Safari →
                    Compartilhar → Adicionar à Tela de Início.
                  </p>
                  <Link className="back" href="/informacoes">
                    Uso, privacidade e assinatura
                  </Link>
                  <p role="status">{message}</p>
                </section>
              )}
            </>
          )}
        </main>
        <footer className="app-footer">
          <span aria-hidden="true">🌿 · 🦕 · ♡</span>
          <small className="sr-only">
            Recurso educativo. Não substitui terapia fonoaudiológica.
          </small>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Navegação no celular">
        {(
          [
            ["home", "⌂", "Início"],
            ["library", "▦", "Atividades"],
            ["garden", "✿", "Meu jardim"],
          ] as const
        ).map(([id, icon, label]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => navigate(id)}
            aria-label={label}
          >
            <span>{icon}</span>
          </button>
        ))}
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
              if (answer.trim() === "12") {
                navigate("adult");
                setGate(false);
              }
            }}
          >
            <span className="bridge-icon">🌿</span>
            <h2>Agora é com o adulto</h2>
            <p>Para abrir a área da família, quanto é 7 + 5?</p>
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
            <small>Esse lembrete não substitui o login da conta.</small>
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
    </div>
  );
}
