"use client";
import { ArrowLeft, ArrowRight, Pause, Play, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Adventure, ActivityContent, Choice } from "../lib/catalog";
import { categories } from "../lib/content-validation";
export type DiscoveryProps = {
  adventure: Adventure;
  content: ActivityContent;
  sound: boolean;
  voiceSettings: { volume: number; rate: number };
  onExit: () => void;
  onAttempt: (word: string, correct: boolean) => void;
  onWord: (word: Choice) => void;
  onComplete: () => void;
  onPause: (value: boolean) => void;
};
export function DiscoveryFrame({
  adventure,
  step,
  count,
  sound,
  children,
  onExit,
  onListen,
  complete,
  onNext,
  paused,
  onPaused,
  feedback,
}: {
  adventure: Adventure;
  step: number;
  count: number;
  sound: boolean;
  children: ReactNode;
  onExit: () => void;
  onListen: () => void;
  complete: boolean;
  onNext: () => void;
  paused: boolean;
  onPaused: (value: boolean) => void;
  feedback: string;
}) {
  return (
    <section className="discovery-game">
      <div className="kids-screen-header">
        <button
          className="kids-back"
          aria-label="Voltar às atividades"
          onClick={onExit}
        >
          <ArrowLeft />
        </button>
        <h1>
          {adventure.kind === "puzzle" ? "🧩" : "🃏"}{" "}
          {categories[adventure.category]}
        </h1>
        <span className="word-counter">
          {step + 1}/{count}
        </span>
      </div>
      <div className="discovery-tools">
        <button
          className="word-listen"
          disabled={!sound || paused}
          aria-label="Ouvir a brincadeira"
          onClick={onListen}
        >
          <Volume2 />
        </button>
        <span aria-hidden="true">
          {complete
            ? "🌟 🎉 🌟"
            : adventure.kind === "puzzle"
              ? "👆 🧩 → 🖼️"
              : "👀 🃏 🃏"}
        </span>
        <button
          className="kids-back"
          aria-label="Fazer uma pausa"
          onClick={() => onPaused(true)}
        >
          <Pause />
        </button>
      </div>
      {children}
      <p className="discovery-feedback" role="status">
        <span aria-hidden="true">
          {complete ? "🎉" : feedback ? "🌿 💛" : "✨"}
        </span>
        <span className="sr-only">{feedback}</span>
      </p>
      <button
        className="kids-action learned-action"
        disabled={!complete || paused}
        aria-label={
          step === count - 1 ? "Ganhar minhas estrelas" : "Próxima descoberta"
        }
        onClick={onNext}
      >
        {step === count - 1 ? "⭐" : <ArrowRight size={30} />}
      </button>
      {paused && (
        <div className="modal-backdrop">
          <section
            className="modal pause-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pausa na brincadeira"
          >
            <span className="pause-art" aria-hidden="true">
              🌿 💧
            </span>
            <button
              className="kids-action purple-action"
              aria-label="Continuar a aventura"
              autoFocus
              onClick={() => onPaused(false)}
            >
              <Play />
            </button>
            <button className="back" onClick={onExit}>
              Voltar às atividades
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
