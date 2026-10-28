"use client";
import { useState } from "react";
import { associations, sentences, type FigureRound } from "../lib/activities";
export type ActivityKind = "figures" | "association" | "sentence" | "premium";
const titles = {
  figures: "Que figura é essa?",
  association: "Palavras que combinam",
  sentence: "Minha primeira frase",
  premium: "Novas descobertas",
};
export function Activity({
  kind,
  rounds,
  speech,
  onExit,
  onComplete,
}: {
  kind: ActivityKind;
  rounds: FigureRound[];
  speech: boolean;
  onExit: () => void;
  onComplete: (stars: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const count = kind === "premium" || kind === "figures" ? rounds.length : 3;
  const figure = rounds[step];
  const association = associations[step];
  const sentence = sentences[step];
  const prompt =
    kind === "sentence"
      ? "Vamos montar uma frase?"
      : kind === "association"
        ? association.prompt
        : `Encontre: ${figure.word.toLowerCase()}`;
  function speak(text: string) {
    if (!speech) return;
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "pt-BR";
    voice.rate = 0.8;
    window.speechSynthesis.speak(voice);
  }
  function choose(name: string) {
    if (correct) return;
    if (kind === "sentence") {
      if (name !== sentence.words[words.length]) {
        setFeedback(
          "Vamos por partes? Ouça a frase e comece pela próxima palavra.",
        );
        return;
      }
      const next = [...words, name];
      setWords(next);
      if (next.length === sentence.words.length) {
        setCorrect(true);
        setFeedback("Vocês montaram uma frase! Que tal falar juntos?");
      } else setFeedback("Isso! Qual palavra vem agora?");
    } else if (
      name === (kind === "association" ? association.answer : figure.word)
    ) {
      setCorrect(true);
      setFeedback("Isso! Agora fale a palavra com seu adulto.");
    } else
      setFeedback("Vamos tentar de novo? Observe as figuras com seu adulto.");
  }
  function next() {
    if (step === count - 1) {
      onComplete(count);
      return;
    }
    setStep((n) => n + 1);
    setCorrect(false);
    setFeedback("");
    setWords([]);
  }
  return (
    <section className="game">
      <button className="back" onClick={onExit}>
        ← Voltar à trilha
      </button>
      <div className="eyebrow">
        {titles[kind]} • {step + 1} DE {count}
      </div>
      <progress
        value={step + (correct ? 1 : 0)}
        max={count}
        aria-label="Progresso da atividade"
      />
      <span className="game-dino" aria-hidden="true">
        🦕
      </span>
      <h1>{prompt}</h1>
      {kind === "sentence" ? (
        <>
          <div
            className="association-prompt"
            aria-label={sentence.words.join(" ")}
          >
            {sentence.emoji}
          </div>
          <p>
            Toque nas palavras na ordem:{" "}
            <strong>{sentence.words.join(" → ")}</strong>
          </p>
          <button
            className="listen"
            disabled={!speech}
            onClick={() => speak(sentence.words.join(" "))}
          >
            🔊 Ouvir a frase
          </button>
          <div className="sentence" aria-live="polite">
            {words.length ? (
              words.map((word, i) => <span key={i}>{word}</span>)
            ) : (
              <span>A frase vai aparecer aqui</span>
            )}
          </div>
          <div className="word-choices">
            {sentence.options.map((word) => (
              <button
                key={word}
                disabled={correct || words.includes(word)}
                onClick={() => choose(word)}
              >
                {word}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {kind === "association" ? (
            <div className="association-prompt" aria-hidden="true">
              {association.emoji}
            </div>
          ) : (
            <p>{figure.hint}</p>
          )}
          <button
            className="listen"
            disabled={!speech}
            onClick={() =>
              speak(kind === "association" ? association.prompt : figure.word)
            }
          >
            🔊 {kind === "association" ? "Ouvir a pergunta" : "Ouvir a palavra"}
          </button>
          <div className="choices">
            {(kind === "association"
              ? association.choices
              : figure.choices
            ).map((choice) => (
              <button
                key={choice.name}
                disabled={correct}
                onClick={() => choose(choice.name)}
                className={
                  correct &&
                  choice.name ===
                    (kind === "association" ? association.answer : figure.word)
                    ? "chosen"
                    : ""
                }
              >
                <span aria-hidden="true">{choice.emoji}</span>
                {choice.name}
              </button>
            ))}
          </div>
        </>
      )}
      {!speech && (
        <p>Seu navegador não oferece voz. Peça ao adulto para ler.</p>
      )}
      <div className="feedback" aria-live="polite">
        {feedback || "Explore com calma. Cada tentativa é uma descoberta."}
      </div>
      {correct && (
        <button className="primary" onClick={next}>
          {step === count - 1
            ? "Ganhar minhas estrelas ⭐"
            : "Próxima descoberta →"}
        </button>
      )}
      <p className="adult-tip">
        Para o adulto: convide a criança a falar, sem cobrar repetição ou
        pronúncia perfeita. As figuras são ilustrativas e podem variar conforme
        o dispositivo.
      </p>
    </section>
  );
}
