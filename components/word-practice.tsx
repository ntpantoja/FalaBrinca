"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  Mic,
  Star,
  Lock,
  Pause,
  Play,
  Check,
} from "lucide-react";
import type { Adventure, ActivityContent, Choice } from "../lib/catalog";
import { Picture } from "./picture";
import { categories } from "../lib/content-validation";
import type { PracticeData } from "../lib/practice-progress";
type Props = {
  adventure: Adventure;
  content: ActivityContent;
  settings: Pick<PracticeData, "volume" | "rate" | "showLabels">;
  sound: boolean;
  onExit: () => void;
  onAttempt: (word: string, correct: boolean) => void;
  onWord: (word: Choice) => void;
  onComplete: () => void;
  onPause: (value: boolean) => void;
};
export function WordPractice({
  adventure,
  content,
  settings,
  sound,
  onExit,
  onAttempt,
  onWord,
  onComplete,
  onPause,
}: Props) {
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<"listen" | "select" | "success">("listen");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [feedback, setFeedback] = useState("");
  const [myTurn, setMyTurn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [unlocked, setUnlocked] = useState(0);
  const practiced = useRef(new Set<number>());
  const round = content.rounds[step];
  const target = round.choices.find((c) => c.name === round.answer)!;
  function speak(text: string) {
    if (!sound || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.toLowerCase() === "pt-br") ??
      voices.find((v) => v.lang.toLowerCase().startsWith("pt"));
    if (voice) utterance.voice = voice;
    utterance.rate = settings.rate;
    utterance.volume = settings.volume;
    window.speechSynthesis.speak(utterance);
  }
  useEffect(() => {
    speak(
      `${round.answer}. Repita comigo: ${round.answer}. Depois, toque na seta para brincar.`,
    );
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [step, sound]);
  function go(index: number) {
    setStep(index);
    setStage("listen");
    setFeedback("");
    setMyTurn(false);
  }
  function beginSelection() {
    const shuffled = [...round.choices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setChoices(shuffled);
    setStage("select");
    setFeedback("");
    setMyTurn(false);
    speak(`Onde está ${round.answer}? Toque no desenho.`);
  }
  function select(choice: Choice) {
    const correct = choice.name === round.answer;
    onAttempt(round.answer, correct);
    if (correct) {
      setStage("success");
      setFeedback("Isso! Você encontrou a figura.");
      speak(`Isso! ${round.answer}.`);
    } else {
      setFeedback("Vamos tentar de novo?");
      speak("Vamos tentar outra figura, sem pressa.");
    }
  }
  function done() {
    if (!practiced.current.has(step)) {
      practiced.current.add(step);
      onWord(target);
    }
    if (step === content.rounds.length - 1) {
      onComplete();
      return;
    }
    setUnlocked((n) => Math.max(n, step + 1));
    go(step + 1);
  }
  return (
    <section className="word-practice">
      <div className="kids-screen-header">
        <button
          className="kids-back"
          aria-label="Voltar às atividades"
          onClick={onExit}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1>
            {adventure.emoji} {categories[adventure.category]}
          </h1>
        </div>
        <span className="word-counter">
          {step + 1}/{content.rounds.length}
        </span>
      </div>
      <div className="word-levels" aria-label="Palavras da atividade">
        {content.rounds.map((r, index) => (
          <button
            key={index}
            className={step === index ? "current" : ""}
            disabled={index > unlocked}
            aria-label={`Palavra ${index + 1}${index > unlocked ? ", bloqueada" : ""}`}
            onClick={() => go(index)}
          >
            {index > unlocked ? (
              <Lock size={20} />
            ) : (
              <span className="word-stars">
                {practiced.current.has(index) ? (
                  <Check size={23} />
                ) : (
                  <Star size={25} fill="#fcd651" />
                )}
              </span>
            )}
            <small>{index + 1}</small>
          </button>
        ))}
      </div>
      {stage === "select" ? (
        <div className="word-selection">
          <h2 className="sr-only">Selecione {round.answer}</h2>
          <div className="selection-model">
            <span aria-hidden="true">👂</span>
            <button
              className="kids-icon-button"
              aria-label="Ouvir a palavra novamente"
              disabled={!sound}
              onClick={() =>
                speak(`Onde está ${round.answer}? Toque no desenho.`)
              }
            >
              <Volume2 />
            </button>
          </div>
          <div className="word-choice-grid">
            {choices.map((choice) => (
              <button
                key={choice.name}
                aria-label={choice.name}
                onClick={() => select(choice)}
                className="figure-answer"
              >
                <Picture choice={choice} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`word-hero-card ${stage === "success" ? "word-correct" : ""}`}
        >
          <Picture choice={target} />
          {settings.showLabels && (
            <div className="word-caption">
              {round.answer.charAt(0) + round.answer.slice(1).toLowerCase()}
            </div>
          )}
          {stage === "success" && (
            <span className="word-success-check">
              <Check />
            </span>
          )}
        </div>
      )}
      <div className="word-controls">
        <button
          className="kids-back"
          aria-label="Palavra anterior"
          disabled={step === 0}
          onClick={() => go(step - 1)}
        >
          <ArrowLeft size={21} />
        </button>
        <button
          className="word-listen"
          aria-label="Ouvir a palavra"
          disabled={!sound}
          onClick={() =>
            speak(`${round.answer}. Repita comigo: ${round.answer}.`)
          }
        >
          <Volume2 size={29} />
          <span className="sr-only">Ouvir</span>
        </button>
        <button
          className={`word-mic ${myTurn ? "my-turn" : ""}`}
          aria-label="Minha vez de repetir, sem gravação"
          onClick={() => {
            setMyTurn(true);
            speak(
              `Agora é sua vez de falar: ${round.answer}. Não estamos gravando sua voz.`,
            );
          }}
        >
          <Mic size={32} />
        </button>
        <button
          className="kids-back"
          aria-label={
            stage === "listen"
              ? "Ir para a seleção da figura"
              : "Rever a figura"
          }
          onClick={() => {
            if (stage === "listen") beginSelection();
            else {
              setStage("listen");
              setMyTurn(false);
              speak(round.answer);
            }
          }}
        >
          <ArrowRight size={21} />
        </button>
      </div>
      <p className="word-status" role="status">
        {feedback ||
          (myTurn
            ? "Sua vez de falar. Não gravamos sua voz."
            : stage === "listen"
              ? "Ouça, repita e toque na seta para escolher a figura."
              : "Toque na figura que combina com a palavra.")}
      </p>
      <button
        className="kids-action learned-action"
        disabled={stage === "select"}
        onClick={stage === "success" ? done : beginSelection}
      >
        {stage === "success" ? (
          <Check size={32} aria-hidden="true" />
        ) : (
          <ArrowRight size={32} aria-hidden="true" />
        )}
        <span aria-hidden="true">{stage === "success" ? "⭐" : "👆"}</span>
        <span className="sr-only">
          {stage === "success"
            ? "Pratiquei esta palavra! ✨"
            : "Escolher a figura para continuar"}
        </span>
      </button>
      <div className="word-footer">
        <button
          className="word-pause"
          aria-label="Fazer uma pausa"
          onClick={() => {
            setPaused(true);
            onPause(true);
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
          }}
        >
          <Pause size={17} /> Pausa
        </button>
        <span>Sem pressa. Cada tentativa conta.</span>
      </div>
      {paused && (
        <div className="modal-backdrop">
          <section
            className="modal pause-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pausa na atividade"
          >
            <span className="pause-art">🌿 💧</span>
            <h2>Vamos descansar um pouquinho?</h2>
            <p>A atividade espera por você.</p>
            <button
              className="kids-action purple-action"
              autoFocus
              onClick={() => {
                setPaused(false);
                onPause(false);
              }}
            >
              <Play />
              Continuar
            </button>
            <button className="back" onClick={onExit}>
              Voltar às categorias
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
