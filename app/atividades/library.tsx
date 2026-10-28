"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  BarChart3,
  UsersRound,
  Settings,
  Star,
  ArrowRight,
  Heart,
  ShieldCheck,
  Sparkles,
  Check,
} from "lucide-react";
import { Activity } from "../../components/activity";
import { WordPractice } from "../../components/word-practice";
import {
  KidsHeader,
  ProgressPanel,
  ParentsPanel,
  SettingsPanel,
} from "../../components/practice-panels";
import { categories, type Category } from "../../lib/content-validation";
import {
  type Adventure,
  type ActivityContent,
  type Choice,
} from "../../lib/catalog";
import { browserAuth } from "../../lib/supabase-browser";
import { emptyProgress, readProgress, type Progress } from "../../lib/progress";
import { wordKey } from "../../lib/practice-progress";
const icons: Record<Category, string> = {
  animals: "🐾",
  foods: "🍎",
  colors: "🎨",
  objects: "🧸",
  emotions: "😊",
  transports: "🚗",
  actions: "🏃",
  nature: "🌿",
};
const order: Category[] = [
  "animals",
  "foods",
  "colors",
  "objects",
  "emotions",
  "transports",
  "actions",
  "nature",
];
type Timing = {
  activityId: string;
  startedAt: string;
  elapsed: number;
  since: number | null;
  paused: boolean;
};
export default function Library({
  activities,
  role,
}: {
  activities: Adventure[];
  role: string;
}) {
  const [view, setView] = useState<
    "home" | "categories" | "activities" | "progress" | "parents" | "settings"
  >("home");
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("Explorador");
  const [speech, setSpeech] = useState(false);
  const [category, setCategory] = useState<Category>("animals");
  const [difficulty, setDifficulty] =
    useState<Adventure["difficulty"]>("beginner");
  const [game, setGame] = useState<{
    adventure: Adventure;
    content: ActivityContent;
  } | null>(null);
  const [reward, setReward] = useState<{ stars: number; title: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const timing = useRef<Timing | null>(null);
  const queue = useRef<Adventure[]>([]);
  const gained = useRef(0);
  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
    setSpeech("speechSynthesis" in window);
    const auth = browserAuth();
    if (auth)
      void auth.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) return;
        try {
          const response = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          });
          if (response.ok) {
            const data = await response.json();
            if (data.profile?.child_first_name)
              setName(data.profile.child_first_name);
          }
        } catch {}
      });
    const visibility = () => updateTiming(timing.current?.paused ?? false);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
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
  function updateTiming(paused: boolean) {
    const t = timing.current;
    if (!t) return;
    const now = performance.now();
    if (t.since !== null) t.elapsed += now - t.since;
    t.paused = paused;
    t.since = !paused && document.visibilityState === "visible" ? now : null;
  }
  function finishSession() {
    const t = timing.current;
    if (!t) return;
    updateTiming(true);
    timing.current = null;
    const session = {
      id: crypto.randomUUID(),
      activityId: t.activityId,
      startedAt: t.startedAt,
      milliseconds: Math.round(t.elapsed),
    };
    setProgress((p) => ({
      ...p,
      practice: {
        ...p.practice,
        sessions: [...p.practice.sessions, session].slice(-300),
      },
    }));
  }
  function navigate(next: typeof view) {
    finishSession();
    queue.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setGame(null);
    setReward(null);
    setView(next);
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
      if (!Array.isArray(data.rounds) || !data.rounds.length)
        throw new Error("Essa atividade ainda não tem figuras disponíveis.");
      finishSession();
      timing.current = {
        activityId: adventure.id,
        startedAt: new Date().toISOString(),
        elapsed: 0,
        since:
          document.visibilityState === "visible" ? performance.now() : null,
        paused: false,
      };
      gained.current = 0;
      setGame({ adventure, content: data });
      setReward(null);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível abrir a atividade.",
      );
    } finally {
      setBusy(false);
    }
  }
  function attempt(word: string, correct: boolean) {
    setProgress((p) => ({
      ...p,
      practice: {
        ...p.practice,
        attempts: [
          ...p.practice.attempts,
          { at: new Date().toISOString(), word, correct },
        ].slice(-2000),
      },
    }));
  }
  function practiced(word: Choice) {
    if (!game) return;
    const a = game.adventure;
    gained.current++;
    setProgress((p) => ({
      ...p,
      stars: p.stars + 1,
      practice: {
        ...p.practice,
        words: {
          ...p.practice.words,
          [wordKey(word.name)]: p.practice.words[wordKey(word.name)] ?? {
            word: word.name,
            emoji: word.emoji,
            category: a.category,
            at: new Date().toISOString(),
          },
        },
      },
    }));
  }
  function complete(advancedStars = 0) {
    if (!game) return;
    const a = game.adventure;
    const stars = gained.current + advancedStars;
    setProgress((p) => ({
      ...p,
      stars: p.stars + advancedStars,
      completed: { ...p.completed, [a.id]: (p.completed[a.id] || 0) + 1 },
      lastActivity: a.id,
      history: [{ id: a.id, at: new Date().toISOString() }, ...p.history].slice(
        0,
        30,
      ),
    }));
    finishSession();
    setGame(null);
    setReward({ title: a.title, stars });
  }
  function chooseCategory(value: Category) {
    setCategory(value);
    setDifficulty(
      activities.find(
        (a) => a.category === value && a.difficulty === "beginner",
      )
        ? "beginner"
        : (activities.find((a) => a.category === value)?.difficulty ??
            "beginner"),
    );
    setView("activities");
    setMessage("");
  }
  async function guided() {
    const selected: Adventure[] = [];
    for (const c of ["animals", "foods", "objects"] as Category[]) {
      const a = activities.find(
        (item) => item.category === c && item.difficulty === "beginner",
      );
      if (a) selected.push(a);
    }
    if (!selected.length) {
      setMessage(
        "A biblioteca ainda precisa de atividades iniciais publicadas.",
      );
      return;
    }
    queue.current = selected.slice(1);
    await start(selected[0]);
  }
  const level = Math.floor(progress.stars / 10) + 1;
  const levelPercent = (progress.stars % 10) * 10;
  const filtered = activities.filter(
    (a) => a.category === category && a.difficulty === difficulty,
  );
  const onNextGuided = async () => {
    const next = queue.current.shift();
    if (next) await start(next);
    else navigate("home");
  };
  return (
    <main className={`kids-app ${game ? "kids-playing" : ""}`}>
      {game ? (
        game.adventure.kind === "figures" ? (
          <WordPractice
            key={game.adventure.id}
            adventure={game.adventure}
            content={game.content}
            settings={progress.practice}
            sound={speech && progress.sound}
            onExit={() => navigate("activities")}
            onAttempt={attempt}
            onWord={practiced}
            onComplete={() => complete()}
            onPause={updateTiming}
          />
        ) : (
          <div className="kids-advanced">
            <Activity
              key={game.adventure.id}
              adventure={game.adventure}
              content={game.content}
              sound={speech && progress.sound}
              voiceSettings={progress.practice}
              onExit={() => navigate("activities")}
              onAttempt={attempt}
              onPause={updateTiming}
              onComplete={complete}
            />
          </div>
        )
      ) : reward ? (
        <section className="kids-completion">
          <span>🎉</span>
          <h1>Que bela descoberta!</h1>
          <p>{reward.title}</p>
          <strong className="reward-stars">⭐ +{reward.stars}</strong>
          <button
            className="kids-action purple-action"
            onClick={() => void onNextGuided()}
          >
            <Play size={22} />
            {queue.current.length ? "Próxima descoberta" : "Voltar ao início"}
          </button>
          <button
            className="kids-action outlined-action"
            onClick={() => navigate("progress")}
          >
            <BarChart3 size={21} />
            Ver progresso
          </button>
        </section>
      ) : view === "home" ? (
        <>
          <header className="kids-brand">
            <span className="butterfly" aria-hidden="true">
              🦋
            </span>
            <h1>
              Fala<span>Brinca</span>
            </h1>
            <p>Vamos praticar juntos! 🌈</p>
          </header>
          <section className="kids-card profile-greeting">
            <span className="profile-fox" aria-hidden="true">
              🦊
            </span>
            <div>
              <h2>Olá, {name}! 👋</h2>
              <p>
                Nível {level} · {progress.stars} ⭐
              </p>
            </div>
            <div
              className="mini-ring"
              style={{
                background: `conic-gradient(#8250e5 ${levelPercent}%, #edf1f6 0)`,
              }}
              aria-label={`${levelPercent}% do próximo nível`}
            >
              <span>{levelPercent}</span>
            </div>
          </section>
          <div className="home-actions">
            <button
              className="kids-action purple-action start-practice"
              onClick={() => navigate("categories")}
            >
              <Play size={25} />
              Começar Atividade
            </button>
            <div className="home-action-row">
              <button
                className="kids-action teal-action"
                onClick={() => navigate("progress")}
              >
                <BarChart3 size={23} />
                Progresso
              </button>
              <button
                className="kids-action outlined-action"
                onClick={() => navigate("parents")}
              >
                <UsersRound size={23} />
                Pais
              </button>
            </div>
            <button
              className="kids-action gold-action"
              disabled={busy}
              onClick={() => void guided()}
            >
              <Play size={23} />
              {busy ? "Preparando…" : "Prática Guiada"}
              <Sparkles size={20} />
            </button>
            <button
              className="kids-action outlined-action"
              onClick={() => navigate("settings")}
            >
              <Settings size={23} />
              Configurações
            </button>
            {role === "master" && (
              <Link className="master-shortcut" href="/admin">
                <ShieldCheck size={16} />
                Painel master · editar atividades
              </Link>
            )}
          </div>
          <p className="kids-feedback" role="status">
            {message}
          </p>
        </>
      ) : view === "categories" ? (
        <>
          <KidsHeader
            title="Categorias 📚"
            subtitle="Escolha uma categoria"
            onBack={() => navigate("home")}
          />
          <div className="kids-categories">
            {order.map((c) => (
              <button
                key={c}
                className={`kids-category category-${c}`}
                onClick={() => chooseCategory(c)}
              >
                <span aria-hidden="true">{icons[c]}</span>
                <strong>{categories[c]}</strong>
              </button>
            ))}
          </div>
        </>
      ) : view === "activities" ? (
        <>
          <KidsHeader
            title={`${icons[category]} ${categories[category]}`}
            subtitle="Escolha uma atividade"
            onBack={() => navigate("categories")}
          />
          <div
            className="kids-difficulty"
            role="group"
            aria-label="Dificuldade"
          >
            {(["beginner", "intermediate", "advanced"] as const).map(
              (value, i) => (
                <button
                  key={value}
                  aria-label={
                    [
                      "Inicial: ouvir e repetir",
                      "Intermediário: associar figuras",
                      "Avançado: histórias visuais",
                    ][i]
                  }
                  className={difficulty === value ? "selected" : ""}
                  aria-pressed={difficulty === value}
                  onClick={() => setDifficulty(value)}
                >
                  <span>{"⭐".repeat(i + 1)}</span>
                  <small>{["Inicial", "Associações", "Histórias"][i]}</small>
                </button>
              ),
            )}
          </div>
          <div className="kids-activity-list">
            {filtered.map((a) => (
              <article className="kids-card kids-activity-card" key={a.id}>
                <button
                  className="kids-activity-open"
                  aria-label={`Jogar ${a.title}`}
                  disabled={busy}
                  onClick={() => void start(a)}
                >
                  <span aria-hidden="true">{a.emoji}</span>
                  <div>
                    <h2>{a.title}</h2>
                    <small>
                      {progress.completed[a.id]
                        ? "✓ Já explorada"
                        : "Ouvir e descobrir juntos"}
                    </small>
                  </div>
                  <ArrowRight size={21} />
                </button>
                <button
                  className={
                    progress.favorites.includes(a.id)
                      ? "word-favorite active"
                      : "word-favorite"
                  }
                  aria-label={`Favoritar ${a.title}`}
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
                  <Heart
                    size={19}
                    fill={
                      progress.favorites.includes(a.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="kids-card kids-empty">
              <span>{icons[category]}</span>
              <p>Ainda não há atividade publicada neste nível.</p>
              <button
                className="kids-action outlined-action"
                onClick={() => setView("categories")}
              >
                Escolher outra categoria
              </button>
            </div>
          )}
          <p className="kids-feedback" role="status">
            {message}
          </p>
        </>
      ) : view === "progress" ? (
        <ProgressPanel
          progress={progress}
          setProgress={setProgress}
          name={name}
          onBack={() => navigate("home")}
        />
      ) : view === "parents" ? (
        <ParentsPanel
          progress={progress}
          name={name}
          role={role}
          onBack={() => navigate("home")}
        />
      ) : (
        <SettingsPanel
          progress={progress}
          setProgress={setProgress}
          onBack={() => navigate("home")}
        />
      )}
      {!game && (
        <footer className="kids-footer">
          Educativo. Não substitui terapia fonoaudiológica.
        </footer>
      )}
    </main>
  );
}
