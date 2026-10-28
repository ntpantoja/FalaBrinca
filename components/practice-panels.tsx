"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Star,
  BookOpen,
  Medal,
  Clock,
  Plus,
  Trash2,
  Download,
  Target,
  TrendingUp,
  Settings,
  Volume2,
  LogOut,
  ShieldCheck,
  RotateCcw,
  Check,
  Gift,
  UsersRound,
} from "lucide-react";
import { emptyProgress, type Progress } from "../lib/progress";
import {
  emptyPractice,
  selectionSummary,
  weeklyCounts,
  canRedeem,
  type RewardGoal,
} from "../lib/practice-progress";
export function KidsHeader({
  title,
  subtitle,
  onBack,
  aside,
}: {
  title: ReactNode;
  subtitle?: string;
  onBack: () => void;
  aside?: ReactNode;
}) {
  return (
    <div className="kids-screen-header">
      <button className="kids-back" aria-label="Voltar" onClick={onBack}>
        <ArrowLeft size={22} />
      </button>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {aside && <div className="kids-header-aside">{aside}</div>}
    </div>
  );
}
const minutes = (p: Progress) =>
  Math.round(
    p.practice.sessions.reduce((n, s) => n + s.milliseconds, 0) / 6000,
  ) / 10;
export function WeeklyChart({ progress }: { progress: Progress }) {
  const days = weeklyCounts(progress.practice.words);
  const max = Math.max(
    4,
    Math.ceil(Math.max(0, ...days.map((d) => d.count)) / 4) * 4,
  );
  const points = days
    .map((d, i) => `${45 + i * 49},${145 - (d.count / max) * 115}`)
    .join(" ");
  return (
    <div className="weekly-chart">
      <svg
        viewBox="0 0 390 185"
        role="img"
        aria-label={days
          .map((d) => `${d.label}: ${d.count} palavras`)
          .join(", ")}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i}>
            <line
              x1="45"
              x2="339"
              y1={30 + i * 28.75}
              y2={30 + i * 28.75}
              stroke="#e2e8f2"
              strokeDasharray="3 4"
            />
            <text x="33" y={34 + i * 28.75} textAnchor="end">
              {Number((max - (i * max) / 4).toFixed(1))}
            </text>
          </g>
        ))}
        {days.map((d, i) => (
          <g key={d.key}>
            <line
              x1={45 + i * 49}
              x2={45 + i * 49}
              y1="30"
              y2="145"
              stroke="#e2e8f2"
              strokeDasharray="3 4"
            />
            <text x={45 + i * 49} y="166" textAnchor="middle">
              {d.label}
            </text>
          </g>
        ))}
        <polyline
          points={points}
          fill="none"
          stroke="#7d4ee5"
          strokeWidth="3"
        />
        {days.map((d, i) => (
          <circle
            key={d.key}
            cx={45 + i * 49}
            cy={145 - (d.count / max) * 115}
            r="4"
            fill="white"
            stroke="#4cc4b8"
            strokeWidth="3"
          />
        ))}
      </svg>
    </div>
  );
}
export function ProgressPanel({
  progress,
  setProgress,
  name,
  onBack,
}: {
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
  name: string;
  onBack: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(10);
  const [message, setMessage] = useState("");
  const stats = selectionSummary(progress.practice.attempts);
  function add() {
    if (
      !title.trim() ||
      target < 1 ||
      target > 1000 ||
      progress.practice.goals.length >= 20
    )
      return;
    const goal: RewardGoal = {
      id: crypto.randomUUID(),
      title: title.trim().slice(0, 80),
      target,
      baseline: progress.stars,
      createdAt: new Date().toISOString(),
    };
    setProgress((p) => ({
      ...p,
      practice: { ...p.practice, goals: [...p.practice.goals, goal] },
    }));
    setAdding(false);
    setTitle("");
  }
  return (
    <>
      <KidsHeader
        title="Progresso 📊"
        subtitle={name}
        onBack={onBack}
        aside={
          <button
            className="tiny-action"
            onClick={() => {
              if (
                window.confirm(
                  "Zerar progresso, histórico e metas deste navegador? Sua conta e assinatura serão mantidas.",
                )
              )
                setProgress((p) => ({
                  ...emptyProgress,
                  sound: p.sound,
                  practice: {
                    ...structuredClone(emptyPractice),
                    volume: p.practice.volume,
                    rate: p.practice.rate,
                    showLabels: p.practice.showLabels,
                  },
                }));
            }}
          >
            <RotateCcw size={14} />
            Zerar
          </button>
        }
      />
      <section className="kids-card accuracy-card">
        <div
          className="percentage-ring"
          style={{
            background: `conic-gradient(#7d4ee5 ${stats.percent}%, #edf1f6 0)`,
          }}
        >
          <span>{stats.percent}%</span>
        </div>
        <div>
          <h2>Taxa de acerto</h2>
          <p>
            {stats.correct} de {stats.total} seleções de figuras
          </p>
          <small>
            <TrendingUp size={15} />
            Cada tentativa é uma descoberta.
          </small>
        </div>
      </section>
      <div className="progress-stats-grid">
        {[
          [<Star key="star" />, progress.stars, "Estrelas", "yellow"],
          [
            <BookOpen key="book" />,
            Object.keys(progress.practice.words).length,
            "Palavras praticadas",
            "purple",
          ],
          [
            <Medal key="medal" />,
            progress.practice.sessions.length,
            "Sessões",
            "teal",
          ],
          [
            <Clock key="clock" />,
            minutes(progress),
            "Tempo ativo (min)",
            "pink",
          ],
        ].map(([icon, value, label, color], i) => (
          <div className="kids-card progress-stat" key={i}>
            <span className={`stat-icon ${color}`}>{icon}</span>
            <strong>{value}</strong>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <section className="kids-card goals-card">
        <div className="panel-title">
          <h2>🏆 Metas e recompensas</h2>
          <button
            className="add-goal"
            aria-label="Adicionar meta"
            disabled={progress.practice.goals.length >= 20}
            onClick={() => setAdding(true)}
          >
            <Plus />
          </button>
        </div>
        {!progress.practice.goals.length && (
          <div className="goals-empty">
            <Gift size={28} />
            <p>
              Combine uma recompensa de brincadeira e celebre as descobertas.
            </p>
          </div>
        )}
        {progress.practice.goals.map((goal) => {
          const earned = Math.max(0, progress.stars - goal.baseline);
          const ready = canRedeem(goal, progress.stars);
          return (
            <div
              key={goal.id}
              className={`goal-item ${goal.redeemedAt ? "redeemed" : ""}`}
            >
              <div className="goal-heading">
                <strong>
                  {goal.redeemedAt ? <Check size={18} /> : <Star size={18} />}{" "}
                  {goal.title}
                </strong>
                <button
                  aria-label={`Apagar meta ${goal.title}`}
                  onClick={() => {
                    if (window.confirm("Apagar essa meta?"))
                      setProgress((p) => ({
                        ...p,
                        practice: {
                          ...p.practice,
                          goals: p.practice.goals.filter(
                            (g) => g.id !== goal.id,
                          ),
                        },
                      }));
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="goal-progress">
                <progress
                  value={Math.min(earned, goal.target)}
                  max={goal.target}
                />
                <span>
                  {Math.min(earned, goal.target)}/{goal.target}
                </span>
              </div>
              {goal.redeemedAt ? (
                <small>✓ Recompensa resgatada!</small>
              ) : (
                <button
                  className="redeem-button"
                  disabled={!ready}
                  onClick={() => {
                    setProgress((p) => ({
                      ...p,
                      practice: {
                        ...p.practice,
                        goals: p.practice.goals.map((g) =>
                          g.id === goal.id
                            ? { ...g, redeemedAt: new Date().toISOString() }
                            : g,
                        ),
                      },
                    }));
                    setMessage("Recompensa registrada. Celebrem juntos!");
                  }}
                >
                  {ready
                    ? "Resgatar recompensa"
                    : "Continue praticando, sem pressa"}
                </button>
              )}
            </div>
          );
        })}
      </section>
      <p className="practice-disclaimer">
        Os acertos medem apenas a escolha das figuras, não a pronúncia. O
        histórico fica neste navegador e pode ser apagado.
      </p>
      <p role="status" className="kids-feedback">
        {message}
      </p>
      {adding && (
        <div className="modal-backdrop">
          <form
            className="modal kids-modal"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <h2>Uma meta para celebrar 🎉</h2>
            <label>
              Recompensa combinada
              <input
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: escolher a próxima brincadeira"
              />
            </label>
            <label>
              Estrelas a partir de agora
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </label>
            <button className="kids-action purple-action">Criar meta</button>
            <button
              className="back"
              type="button"
              onClick={() => setAdding(false)}
            >
              Voltar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
export function ParentsPanel({
  progress,
  name,
  role,
  onBack,
}: {
  progress: Progress;
  name: string;
  role: string;
  onBack: () => void;
}) {
  function download() {
    const report = {
      exportedAt: new Date().toISOString(),
      scope: "Prática educativa neste navegador; não é avaliação de fala.",
      selection: selectionSummary(progress.practice.attempts),
      words: Object.values(progress.practice.words),
      sessions: progress.practice.sessions,
      weekly: weeklyCounts(progress.practice.words),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `falabrinca-pratica-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <KidsHeader
        title={
          <>
            Painel dos Pais <UsersRound size={25} />
          </>
        }
        subtitle={name}
        onBack={onBack}
        aside={
          <button
            className="add-goal"
            aria-label="Exportar histórico"
            onClick={download}
          >
            <Download size={21} />
          </button>
        }
      />
      <div className="parent-stats">
        {[
          [
            <Target key="level" />,
            Math.floor(progress.stars / 10) + 1,
            "Nível",
          ],
          [
            <TrendingUp key="words" />,
            Object.keys(progress.practice.words).length,
            "Palavras",
          ],
          [<Clock key="time" />, minutes(progress), "Minutos ativos"],
        ].map(([icon, value, label], i) => (
          <div className="kids-card" key={i}>
            {icon}
            <strong>{value}</strong>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <section className="kids-card weekly-card">
        <h2>Evolução semanal 📈</h2>
        <p>Novas palavras marcadas como praticadas.</p>
        <WeeklyChart progress={progress} />
      </section>
      <section className="kids-card family-tips">
        <h2>Uma rotina leve 🌱</h2>
        <p>
          Mostre a imagem, ouçam a palavra e convide a criança a repetir.
          Celebre as tentativas e faça uma pausa quando quiserem.
        </p>
        <p>
          Não há gravação nem avaliação automática da fala. O recurso é
          educativo e não substitui terapia fonoaudiológica.
        </p>
        <Link className="kids-action outlined-action" href="/conta?gerenciar=1">
          Minha conta e assinatura
        </Link>
        {role === "master" && (
          <Link className="kids-action purple-action" href="/admin">
            <ShieldCheck size={20} />
            Administrar conteúdo
          </Link>
        )}
      </section>
    </>
  );
}
export function SettingsPanel({
  progress,
  setProgress,
  onBack,
}: {
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
  onBack: () => void;
}) {
  return (
    <>
      <KidsHeader title="Configurações ⚙️" onBack={onBack} />
      <section className="kids-card settings-card">
        <h2>
          <Volume2 size={21} /> Áudio e apresentação
        </h2>
        <label className="setting-switch">
          Ouvir instruções
          <input
            type="checkbox"
            checked={progress.sound}
            onChange={(e) => {
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              setProgress((p) => ({ ...p, sound: e.target.checked }));
            }}
          />
        </label>
        <label>
          Volume
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={progress.practice.volume}
            onChange={(e) =>
              setProgress((p) => ({
                ...p,
                practice: { ...p.practice, volume: Number(e.target.value) },
              }))
            }
          />
        </label>
        <label>
          Velocidade da voz
          <select
            value={progress.practice.rate}
            onChange={(e) =>
              setProgress((p) => ({
                ...p,
                practice: { ...p.practice, rate: Number(e.target.value) },
              }))
            }
          >
            <option value="0.6">Bem devagar</option>
            <option value="0.8">Devagar</option>
            <option value="1">Natural</option>
          </select>
        </label>
        <label className="setting-switch">
          Mostrar legenda de apoio nas figuras
          <input
            type="checkbox"
            checked={progress.practice.showLabels}
            onChange={(e) =>
              setProgress((p) => ({
                ...p,
                practice: { ...p.practice, showLabels: e.target.checked },
              }))
            }
          />
        </label>
        <small>
          A criança pode brincar sem ler. A legenda é opcional para quem
          acompanha.
        </small>
      </section>
      <section className="kids-card settings-card">
        <h2>Conta e privacidade</h2>
        <Link className="settings-link" href="/conta?gerenciar=1">
          Editar perfil e gerenciar assinatura →
        </Link>
        <Link className="settings-link" href="/informacoes">
          Uso e privacidade →
        </Link>
        <p>
          O progresso fica somente neste navegador. Pausas e tempo com a aba
          oculta não entram no tempo ativo.
        </p>
        <button
          className="kids-action outlined-action"
          onClick={async () => {
            const { browserAuth } = await import("../lib/supabase-browser");
            const { error } = await browserAuth()!.auth.signOut();
            if (!error) window.location.replace("/");
          }}
        >
          <LogOut size={19} />
          Sair da conta
        </button>
      </section>
    </>
  );
}
