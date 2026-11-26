"use client";
import { creditPractice } from "../../lib/daily-usage";
import { activityGroup, activityGroups } from "../../lib/activity-groups";
import Link from "next/link";
import { authenticatedFetch, SessionExpiredError } from "../../lib/session";
import { unlockActivityAudio } from "../../lib/activity-audio-player";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  BarChart3,
  UsersRound,
  Settings,
  Lock,
  ArrowRight,
  Heart,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Activity } from "../../components/activity";
import { PuzzleActivity } from "../../components/puzzle-activity";
import { MemoryActivity } from "../../components/memory-activity";
import { kindLabels } from "../../lib/catalog";
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
  const [format, setFormat] = useState<"all" | "puzzle" | "memory">("all");
  const [category, setCategory] = useState<Category>("animals");
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
  const gained = useRef(0);
  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
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
    if (t.since !== null) {
      const elapsed = Math.max(0, now - t.since);
      t.elapsed += elapsed;
      setProgress((p) => ({
        ...p,
        practice: {
          ...p.practice,
          dailyUsage: creditPractice(
            p.practice.dailyUsage,
            Date.now(),
            elapsed,
          ),
        },
      }));
    }
    t.paused = paused;
    t.since = !paused && document.visibilityState === "visible" ? now : null;
  }
  useEffect(() => {
    if (!game) return;
    const timer = setInterval(
      () => updateTiming(timing.current?.paused ?? false),
      1000,
    );
    return () => clearInterval(timer);
  }, [game]);
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
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setGame(null);
    setReward(null);
    setView(next);
    setMessage("");
  }
  async function start(adventure: Adventure) {
    if (progress.sound) unlockActivityAudio();
    setBusy(true);
    setMessage("");
    try {
      const response = await authenticatedFetch(
        `/api/activities/${adventure.id}`,
      );
      const data = await response.json();
      if (response.status === 428) {
        window.location.replace("/dispositivos");
        return;
      }
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
      if (e instanceof SessionExpiredError) {
        window.location.replace("/conta?modo=login");
        return;
      }
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
      practice: {
        ...p.practice,
        dailyUsage: creditPractice(p.practice.dailyUsage, Date.now(), 0, true),
      },
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
    setView("activities");
    setMessage("");
  }
  const NewGame =
    game?.adventure.kind === "memory" ? MemoryActivity : PuzzleActivity;
  const level = Math.floor(progress.stars / 10) + 1;
  const levelPercent = (progress.stars % 10) * 10;
  const categoryActivities = activities.filter(
    (a) =>
      a.category === category &&
      (format === "all" || activityGroup(a.kind) === format),
  );
  const levels = (["beginner", "intermediate", "advanced"] as const).map(
    (difficulty) => {
      const items = categoryActivities.filter(
        (a) => a.difficulty === difficulty,
      );
      const completed = items.filter((a) => progress.completed[a.id]).length;
      return {
        items,
        completed,
        next: items.find((a) => !progress.completed[a.id]),
      };
    },
  );
  const nextActivity = levels.find((level) => level.next)?.next;
  const featuredActivity =
    nextActivity ?? levels.find((level) => level.items.length)?.items[0];
  return (
    <main className={`kids-app ${game ? "kids-playing" : ""}`}>
      {game ? (
        game.adventure.kind === "puzzle" || game.adventure.kind === "memory" ? (
          <NewGame
            key={game.adventure.id}
            adventure={game.adventure}
            content={game.content}
            sound={progress.sound}
            voiceSettings={progress.practice}
            onExit={() => navigate("activities")}
            onAttempt={attempt}
            onWord={practiced}
            onComplete={() => complete()}
            onPause={updateTiming}
          />
        ) : game.adventure.kind === "figures" ? (
          <WordPractice
            key={game.adventure.id}
            adventure={game.adventure}
            content={game.content}
            settings={progress.practice}
            sound={progress.sound}
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
              sound={progress.sound}
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
          {nextActivity && (
            <button
              className="kids-action purple-action"
              disabled={busy}
              onClick={() => void start(nextActivity)}
            >
              <Play size={22} />
              Próxima atividade
            </button>
          )}
          <button
            className="kids-action outlined-action"
            disabled={busy}
            onClick={() => navigate("activities")}
          >
            Voltar à categoria
          </button>
          {message && <p role="status">{message}</p>}
          <button
            className="kids-action purple-action"
            disabled={busy}
            onClick={() => navigate("home")}
          >
            <Play size={22} />
            Voltar ao início
          </button>
          <button
            className="kids-action outlined-action"
            disabled={busy}
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
              onClick={() => {
                setFormat("all");
                navigate("categories");
              }}
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
              onClick={() => {
                setFormat("puzzle");
                navigate("categories");
              }}
            >
              <span aria-hidden="true">🧩</span>Quebra-cabeças
            </button>
            <button
              className="kids-action teal-action"
              onClick={() => {
                setFormat("memory");
                navigate("categories");
              }}
            >
              <span aria-hidden="true">🃏</span>Jogos de memória
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
                Painel master · dashboard
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
            subtitle={format === "all" ? undefined : activityGroups[format]}
            onBack={() => {
              if (!busy) navigate("categories");
            }}
          />
          {featuredActivity && (
            <>
              <div
                className="kids-levels"
                role="group"
                aria-label="Níveis da categoria"
              >
                {levels.map((level, index) => {
                  const unavailable = !level.items.length;
                  const locked = levels
                    .slice(0, index)
                    .some((previous) => previous.next);
                  const finished = level.items.length > 0 && !level.next;
                  const status = unavailable
                    ? "sem atividades"
                    : locked
                      ? "bloqueado"
                      : finished
                        ? "concluído"
                        : "disponível";
                  return (
                    <button
                      key={index}
                      className="kids-level"
                      disabled={busy || unavailable || locked}
                      aria-label={`Nível ${index + 1}, ${status}`}
                      onClick={() => void start(level.next ?? level.items[0])}
                    >
                      {locked || unavailable ? (
                        <Lock size={20} />
                      ) : finished ? (
                        <Check size={20} />
                      ) : (
                        <span aria-hidden="true">⭐</span>
                      )}
                      <strong>{index + 1}</strong>
                      <small>
                        {level.completed}/{level.items.length}
                      </small>
                    </button>
                  );
                })}
              </div>
              <article className="kids-card kids-activity-card">
                <button
                  className="kids-activity-open"
                  aria-label={`Jogar ${featuredActivity.title}`}
                  disabled={busy}
                  onClick={() => void start(featuredActivity)}
                >
                  <span aria-hidden="true">{featuredActivity.emoji}</span>
                  <div>
                    <h2>{featuredActivity.title}</h2>
                    <small>{kindLabels[featuredActivity.kind]}</small>
                    <small>
                      {progress.completed[featuredActivity.id]
                        ? "✓ Já explorada"
                        : "Toque para jogar"}
                    </small>
                  </div>
                  <ArrowRight size={21} />
                </button>
                <button
                  className={
                    progress.favorites.includes(featuredActivity.id)
                      ? "word-favorite active"
                      : "word-favorite"
                  }
                  aria-label={`Favoritar ${featuredActivity.title}`}
                  aria-pressed={progress.favorites.includes(
                    featuredActivity.id,
                  )}
                  onClick={() =>
                    setProgress((p) => ({
                      ...p,
                      favorites: p.favorites.includes(featuredActivity.id)
                        ? p.favorites.filter((id) => id !== featuredActivity.id)
                        : [...p.favorites, featuredActivity.id],
                    }))
                  }
                >
                  <Heart
                    size={19}
                    fill={
                      progress.favorites.includes(featuredActivity.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </article>
            </>
          )}
          {!featuredActivity && (
            <div className="kids-card kids-empty">
              <span>{icons[category]}</span>
              <p>Ainda não há atividades disponíveis aqui.</p>
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
          setProgress={setProgress}
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
