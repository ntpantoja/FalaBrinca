"use client";
import { useEffect, useRef, useState } from "react";
import type { ActivityContent, Adventure } from "../lib/catalog";
import { sequencePictures } from "../lib/pictures";
export function Activity({
  adventure,
  content,
  sound,
  onExit,
  onComplete,
}: {
  adventure: Adventure;
  content: ActivityContent;
  sound: boolean;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState(false);
  const finished = useRef(false);
  const round = content.rounds[step];
  const count = content.rounds.length;
  const sentence = !!round.words;
  const sequence = sentence ? sequencePictures(round.words!) : [];
  const choices = sentence
    ? [...sequence.slice(1), sequence[0]]
    : round.choices;
  function speak(text: string) {
    if (!sound || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "pt-BR";
    voice.rate = 0.8;
    window.speechSynthesis.speak(voice);
  }
  useEffect(() => {
    speak(
      sentence
        ? `Vamos contar uma história com figuras. ${round.answer}. Toque nas figuras na ordem.`
        : round.prompt,
    );
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [step, sound]);
  function choose(name: string) {
    if (correct || paused) return;
    if (sentence) {
      if (name !== sequence[words.length].name) {
        setFeedback("Vamos tentar outra figura.");
        speak("Vamos por partes? Escolha a próxima figura da história.");
        return;
      }
      const next = [...words, name];
      setWords(next);
      if (next.length === sequence.length) {
        setCorrect(true);
        setFeedback("História completa!");
        speak(`Muito bem! ${round.answer}. Que tal contar juntos?`);
      } else {
        setFeedback("Isso! Qual figura vem agora?");
        speak("Isso! Qual figura vem agora?");
      }
    } else if (name === round.answer) {
      setCorrect(true);
      setFeedback("Isso!");
      speak(
        `Isso! ${round.answer.toLowerCase()}. Que tal falar com seu adulto?`,
      );
    } else {
      setFeedback("Vamos tentar de novo.");
      speak("Vamos tentar de novo? Observe as figuras com seu adulto.");
    }
  }
  function next() {
    if (step === count - 1) {
      if (!finished.current) {
        finished.current = true;
        onComplete(count);
      }
      return;
    }
    setStep((n) => n + 1);
    setCorrect(false);
    setFeedback("");
    setWords([]);
    setHint(false);
  }
  const target =
    round.choices.find((c) => c.name === round.answer)?.emoji ||
    adventure.emoji;
  return (
    <section className="game picture-game">
      <div className="game-top">
        <button
          className="round-tool"
          aria-label="Voltar à trilha"
          onClick={onExit}
        >
          ←
        </button>
        <div
          className="round-dots"
          aria-label={`Rodada ${step + 1} de ${count}`}
        >
          {content.rounds.map((_, i) => (
            <span
              key={i}
              className={i < step ? "done" : i === step ? "current" : ""}
            />
          ))}
        </div>
        <button
          className="round-tool"
          aria-label="Fazer uma pausa"
          onClick={() => {
            setPaused(true);
            speak("Uma pausa faz bem.");
          }}
        >
          Ⅱ
        </button>
      </div>
      <h1 className="sr-only">{round.prompt}</h1>
      <div className="picture-prompt">
        <span className="little-dino">🦕</span>
        <div
          className="picture-bubble"
          aria-label={sentence ? "História para montar" : round.prompt}
        >
          {sentence ? round.scene : round.scene || target}
          {!sentence && <span className="picture-question">?</span>}
        </div>
        <button
          className="listen big-listen"
          aria-label={sentence ? "Ouvir a história" : "Ouvir a pergunta"}
          disabled={!sound}
          onClick={() =>
            speak(
              sentence
                ? `${round.answer}. Toque nas figuras na ordem.`
                : round.prompt,
            )
          }
        >
          🔊
        </button>
      </div>
      {sentence && (
        <div
          className="picture-sequence"
          aria-label="Sua história"
          aria-live="polite"
        >
          {sequence.map((piece, i) => (
            <div
              key={piece.name}
              className={words[i] ? "sequence-slot filled" : "sequence-slot"}
              aria-label={
                words[i] ? piece.name.split(":")[1] : `Espaço ${i + 1}`
              }
            >
              <span>{words[i] ? piece.emoji : hint ? piece.emoji : "?"}</span>
              {i < sequence.length - 1 && <b aria-hidden="true">→</b>}
            </div>
          ))}
        </div>
      )}
      <div
        className={
          sentence
            ? "picture-options sequence-options"
            : "choices picture-options"
        }
      >
        {choices.map((choice) => (
          <button
            key={choice.name}
            aria-label={sentence ? choice.name.split(":")[1] : choice.name}
            disabled={correct || words.includes(choice.name) || paused}
            onClick={() => choose(choice.name)}
            className={
              (correct && !sentence && choice.name === round.answer) ||
              (hint && !sentence && choice.name === round.answer)
                ? "chosen"
                : ""
            }
          >
            <span aria-hidden="true">{choice.emoji}</span>
          </button>
        ))}
      </div>
      <div className="picture-feedback" aria-live="polite">
        <span aria-hidden="true">
          {correct ? "🌟 🎉 🌟" : feedback ? "🌿 💛" : "✦ ✦ ✦"}
        </span>
        <span className="sr-only">{feedback}</span>
      </div>
      <div className="game-actions">
        {!correct && (
          <button
            className="round-tool"
            aria-label="Uma ajudinha"
            onClick={() => {
              setHint((value) => !value);
              speak(
                sentence
                  ? round.answer
                  : `Procure ${round.answer.toLowerCase()}.`,
              );
            }}
          >
            💡
          </button>
        )}
        {sentence && !correct && (
          <button
            className="round-tool"
            aria-label="Recomeçar a história"
            onClick={() => {
              setWords([]);
              setFeedback("");
              speak("Vamos contar de novo.");
            }}
          >
            ↺
          </button>
        )}
        {correct && (
          <button
            className="primary picture-next"
            aria-label={
              step === count - 1
                ? "Ganhar minhas estrelas"
                : "Próxima descoberta"
            }
            onClick={next}
          >
            {step === count - 1 ? "⭐" : "→"}
          </button>
        )}
      </div>
      {paused && (
        <div className="modal-backdrop">
          <section
            className="modal pause-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Pausa na brincadeira"
          >
            <span className="pause-art">💧 🌿 🧘</span>
            <h2 className="sr-only">Uma pausa faz bem</h2>
            <button
              className="primary picture-next"
              aria-label="Continuar a aventura"
              autoFocus
              onClick={() => setPaused(false)}
            >
              ▶
            </button>
            <button
              className="round-tool"
              aria-label="Encerrar por agora"
              onClick={onExit}
            >
              ⌂
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
