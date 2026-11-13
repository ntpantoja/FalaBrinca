"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { DiscoveryFrame, type DiscoveryProps } from "./discovery-frame";
import { useActivityAudio } from "../lib/use-activity-audio";
import { placePuzzlePiece, shuffled } from "../lib/game-pieces";
import type { Choice } from "../lib/catalog";
const positions = [
  "superior esquerdo",
  "superior direito",
  "inferior esquerdo",
  "inferior direito",
];
function PuzzlePicture({ choice }: { choice: Choice }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [choice.image_url]);
  if (choice.image_url && !failed)
    return (
      <img
        className="activity-image"
        src={choice.image_url}
        alt=""
        draggable={false}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  return (
    <svg className="activity-image" viewBox="0 0 400 400" aria-hidden="true">
      <rect width="400" height="400" fill="#e8ddfc" />
      <circle cx="45" cy="45" r="30" fill="#fff" />
      <path d="M0 320Q100 260 210 330T400 305V400H0Z" fill="#d2f8ea" />
      <circle cx="340" cy="340" r="24" fill="#ffd45c" />
      <text
        x="200"
        y="255"
        textAnchor="middle"
        fontSize="215"
        fontFamily="Noto Color Emoji,Apple Color Emoji,Segoe UI Emoji,sans-serif"
      >
        {choice.emoji}
      </text>
    </svg>
  );
}
function PieceArt({ choice, piece }: { choice: Choice; piece: number }) {
  return (
    <span className="puzzle-crop" aria-hidden="true">
      <span
        className="puzzle-whole"
        style={{
          left: `${-(piece % 2) * 100}%`,
          top: `${-Math.floor(piece / 2) * 100}%`,
        }}
      >
        <PuzzlePicture choice={choice} />
      </span>
    </span>
  );
}
export function PuzzleActivity(props: DiscoveryProps) {
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const placed = useRef<(number | null)[]>(slots);
  const [order, setOrder] = useState(() => shuffled([0, 1, 2, 3]));
  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [ghost, setGhost] = useState<{
    piece: number;
    x: number;
    y: number;
    size: number;
  } | null>(null);
  const drag = useRef<{
    piece: number;
    startX: number;
    startY: number;
    size: number;
    moved: boolean;
  } | null>(null);
  const ignoreClick = useRef(false);
  const advancing = useRef(false);
  const board = useRef<HTMLDivElement>(null);
  const target = props.content.rounds[step].choices[0];
  const { speak, stop } = useActivityAudio(
    props.sound,
    props.voiceSettings.volume,
    props.voiceSettings.rate,
  );
  const complete = slots.every((p) => p !== null);
  const listen = () =>
    speak(
      `Vamos montar ${target.name.toLowerCase()}? Arraste as quatro peças para o quadro.`,
      target.audio_url,
    );
  useEffect(() => {
    listen();
    return stop;
  }, [step, props.sound]);
  function place(piece: number, slot: number) {
    if (paused || advancing.current) return;
    const next = placePuzzlePiece(placed.current, piece, slot);
    if (placed.current[slot] !== null) return;
    props.onAttempt(target.name, !!next);
    if (!next) {
      setFeedback("Vamos tentar outro espaço, sem pressa.");
      speak("Vamos tentar outro espaço, sem pressa.");
      return;
    }
    placed.current = next;
    setSlots(next);
    setSelected(null);
    if (next.every((p) => p !== null)) {
      setFeedback("Você montou a figura!");
      speak(`Você montou ${target.name.toLowerCase()}!`, target.audio_url);
    } else setFeedback("Isso! Mais uma peça encontrou seu lugar.");
  }
  function startDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    piece: number,
  ) {
    if (paused || placed.current.includes(piece)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      piece,
      startX: event.clientX,
      startY: event.clientY,
      size: rect.width,
      moved: false,
    };
    ignoreClick.current = false;
    setSelected(piece);
  }
  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    if (
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      ) > 6
    )
      current.moved = true;
    if (current.moved)
      setGhost({
        piece: current.piece,
        x: event.clientX,
        y: event.clientY,
        size: current.size,
      });
  }
  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    drag.current = null;
    setGhost(null);
    if (!current) return;
    ignoreClick.current = current.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.moved) return;
    const cell = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-puzzle-slot]");
    if (cell && board.current?.contains(cell))
      place(current.piece, Number(cell.dataset.puzzleSlot));
  }
  function next() {
    if (!complete || advancing.current) return;
    advancing.current = true;
    props.onWord(target);
    if (step === props.content.rounds.length - 1) {
      props.onComplete();
      return;
    }
    const empty = [null, null, null, null];
    placed.current = empty;
    setSlots(empty);
    setSelected(null);
    setFeedback("");
    setOrder(shuffled([0, 1, 2, 3]));
    setStep((s) => s + 1);
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
        drag.current = null;
        setGhost(null);
      }}
    >
      <div
        className="puzzle-model"
        role="img"
        aria-label={`Modelo do quebra-cabeça: ${target.name}`}
      >
        <PuzzlePicture choice={target} />
      </div>
      <div
        className={`puzzle-board ${complete ? "completed" : ""}`}
        ref={board}
        aria-label="Quadro do quebra-cabeça"
      >
        {slots.map((piece, index) => (
          <button
            key={index}
            data-puzzle-slot={index}
            className={`puzzle-cell ${piece !== null ? "filled" : ""}`}
            disabled={paused || piece !== null}
            aria-label={`Espaço ${positions[index]}${piece !== null ? ", preenchido" : ""}`}
            onClick={() => {
              if (selected !== null) place(selected, index);
            }}
          >
            {piece === null ? (
              <span className="puzzle-slot-hint" aria-hidden="true">
                ✧
              </span>
            ) : (
              <PieceArt choice={target} piece={piece} />
            )}
          </button>
        ))}
      </div>
      <div
        className="puzzle-tray"
        role="group"
        aria-label="Quatro peças para arrastar"
      >
        {order.map((piece) => (
          <button
            key={piece}
            data-piece={piece}
            className={`puzzle-piece ${selected === piece ? "selected" : ""}`}
            disabled={paused || slots.includes(piece)}
            aria-label={`Peça ${positions[piece]}`}
            aria-pressed={selected === piece}
            onPointerDown={(e) => startDrag(e, piece)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => {
              drag.current = null;
              setGhost(null);
              ignoreClick.current = true;
            }}
            onClick={() => {
              if (ignoreClick.current) {
                ignoreClick.current = false;
                return;
              }
              if (!placed.current.includes(piece)) setSelected(piece);
            }}
          >
            {slots.includes(piece) ? (
              <span aria-hidden="true">✓</span>
            ) : (
              <PieceArt choice={target} piece={piece} />
            )}
          </button>
        ))}
      </div>
      {ghost && (
        <div
          className="puzzle-drag-ghost"
          style={{
            left: ghost.x - ghost.size / 2,
            top: ghost.y - ghost.size / 2,
            width: ghost.size,
            height: ghost.size,
          }}
        >
          <PieceArt choice={target} piece={ghost.piece} />
        </div>
      )}
    </DiscoveryFrame>
  );
}
