"use client";
import { useEffect, useRef, useState } from "react";
import { DiscoveryFrame, type DiscoveryProps } from "./discovery-frame";
import { Picture } from "./picture";
import { useActivityAudio } from "../lib/use-activity-audio";
import { shuffled } from "../lib/game-pieces";
function deck() {
  return shuffled(
    [0, 1, 2].flatMap((pair) => [
      { id: `${pair}-a`, pair },
      { id: `${pair}-b`, pair },
    ]),
  );
}
export function MemoryActivity(props: DiscoveryProps) {
  const [step, setStep] = useState(0);
  const [cards, setCards] = useState(deck);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState("");
  const advancing = useRef(false);
  const items = props.content.rounds[step].choices;
  const { speak, stop } = useActivityAudio(
    props.sound,
    props.voiceSettings.volume,
    props.voiceSettings.rate,
  );
  const complete = matched.length === 3;
  const listen = () =>
    speak(
      "Vamos encontrar os pares? Toque em duas cartas e procure os desenhos iguais.",
    );
  useEffect(() => {
    listen();
    return stop;
  }, [step, props.sound]);
  useEffect(() => {
    if (revealed.length !== 2 || paused) return;
    const timer = setTimeout(() => {
      setRevealed([]);
      setFeedback("");
    }, 1800);
    return () => clearTimeout(timer);
  }, [revealed, paused]);
  function flip(card: { id: string; pair: number }) {
    if (
      paused ||
      complete ||
      revealed.length === 2 ||
      revealed.includes(card.id) ||
      matched.includes(card.pair)
    )
      return;
    const choice = items[card.pair];
    speak(choice.name, choice.audio_url);
    if (revealed.length === 0) {
      setRevealed([card.id]);
      return;
    }
    const first = cards.find((c) => c.id === revealed[0])!;
    const correct = first.pair === card.pair;
    props.onAttempt(choice.name, correct);
    if (correct) {
      setMatched((old) => [...old, card.pair]);
      setRevealed([]);
      props.onWord(choice);
      setFeedback(
        matched.length === 2
          ? "Todos os pares encontrados!"
          : "Você encontrou um par!",
      );
    } else {
      setRevealed([revealed[0], card.id]);
      setFeedback("Vamos lembrar onde estão as figuras e tentar de novo.");
    }
  }
  function next() {
    if (!complete || advancing.current) return;
    advancing.current = true;
    if (step === props.content.rounds.length - 1) {
      props.onComplete();
      return;
    }
    setStep((s) => s + 1);
    setCards(deck());
    setRevealed([]);
    setMatched([]);
    setFeedback("");
  }
  useEffect(() => {
    advancing.current = false;
  }, [step]);
  return (
    <DiscoveryFrame
      adventure={props.adventure}
      step={step}
      count={props.content.rounds.length}
      sound={props.sound}
      onExit={props.onExit}
      onListen={listen}
      complete={complete}
      onNext={next}
      paused={paused}
      feedback={feedback}
      onPaused={(value) => {
        setPaused(value);
        props.onPause(value);
        stop();
      }}
    >
      <div
        className="memory-grid"
        role="group"
        aria-label="Encontre três pares de desenhos"
      >
        {cards.map((card, index) => {
          const open =
            revealed.includes(card.id) || matched.includes(card.pair);
          return (
            <button
              key={card.id}
              data-memory-pair={card.pair}
              className={`memory-card ${open ? "open" : ""} ${matched.includes(card.pair) ? "matched" : ""}`}
              aria-label={open ? items[card.pair].name : `Carta ${index + 1}`}
              aria-pressed={open}
              disabled={
                paused || matched.includes(card.pair) || revealed.length === 2
              }
              onClick={() => flip(card)}
            >
              {open ? (
                <Picture choice={items[card.pair]} />
              ) : (
                <span aria-hidden="true">⭐</span>
              )}
            </button>
          );
        })}
      </div>
      <div
        className="memory-pairs"
        aria-label={`${matched.length} de 3 pares encontrados`}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden="true">
            {matched.includes(i) ? "💛" : "🤍"}
          </span>
        ))}
      </div>
    </DiscoveryFrame>
  );
}
