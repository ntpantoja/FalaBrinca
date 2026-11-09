"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO_BYTES } from "../lib/recorded-audio";
type Props = {
  name: string;
  value?: string;
  disabled?: boolean;
  onBusy: (value: boolean) => void;
  onChange: (url: string) => void;
  upload: (file: File) => Promise<string>;
};
export function AudioRecorder({
  name,
  value,
  disabled,
  onBusy,
  onChange,
  upload,
}: Props) {
  const [state, setState] = useState<
    "idle" | "requesting" | "recording" | "draft" | "uploading"
  >("idle");
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState("");
  const clip = useRef<Blob | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrl = useRef("");
  const mounted = useRef(true);
  function release() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  function clearClip() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = "";
    setPreview("");
    clip.current = null;
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      onBusy(false);
    };
  }, [onBusy]);
  async function start() {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setMessage(
        "Este navegador não oferece gravação. Use uma versão atual do Chrome, Edge ou Safari, com o site em HTTPS.",
      );
      return;
    }
    setState("requesting");
    setMessage("");
    onBusy(true);
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        input.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = input;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mimeType)
        throw new Error(
          "Este navegador não oferece um formato de áudio compatível. Tente Chrome, Edge ou Safari atualizado.",
        );
      const recording = new MediaRecorder(input, { mimeType });
      recorder.current = recording;
      const chunks: Blob[] = [];
      let size = 0;
      let failed = false;
      recording.ondataavailable = (e) => {
        if (e.data.size) {
          chunks.push(e.data);
          size += e.data.size;
        }
        if (size > MAX_AUDIO_BYTES && recording.state === "recording")
          recording.stop();
      };
      recording.onerror = () => {
        failed = true;
        release();
        if (mounted.current) {
          setMessage("A gravação foi interrompida. Tente novamente.");
          setState("idle");
          onBusy(false);
        }
      };
      recording.onstop = () => {
        release();
        if (!mounted.current || failed) return;
        const blob = new Blob(chunks, { type: mimeType });
        if (!blob.size || blob.size > MAX_AUDIO_BYTES) {
          setMessage(
            "O áudio ficou vazio ou ultrapassou 3 MB. Grave novamente.",
          );
          setState("idle");
          onBusy(false);
          return;
        }
        clearClip();
        clip.current = blob;
        previewUrl.current = URL.createObjectURL(blob);
        setPreview(previewUrl.current);
        setState("draft");
        setMessage(
          "Ouça a gravação. Depois escolha Usar este áudio ou Descartar.",
        );
      };
      setSeconds(0);
      recording.start(250);
      setState("recording");
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed++;
        setSeconds(elapsed);
        if (elapsed >= 20 && recording.state === "recording") recording.stop();
      }, 1000);
    } catch (error) {
      release();
      if (!mounted.current) return;
      setState("idle");
      onBusy(false);
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Permita o acesso ao microfone nas configurações deste site no navegador e tente novamente."
          : error instanceof DOMException && error.name === "NotFoundError"
            ? "Nenhum microfone foi encontrado. Conecte um microfone e tente novamente."
            : error instanceof Error
              ? error.message
              : "Não foi possível acessar o microfone.",
      );
    }
  }
  async function save() {
    if (!clip.current) return;
    setState("uploading");
    try {
      const url = await upload(
        new File([clip.current], "gravacao", { type: clip.current.type }),
      );
      if (!mounted.current) return;
      onChange(url);
      clearClip();
      setState("idle");
      onBusy(false);
      setMessage(
        "Áudio vinculado. Salve a atividade para publicar a alteração.",
      );
    } catch (e) {
      if (!mounted.current) return;
      setState("draft");
      setMessage(
        e instanceof Error
          ? e.message
          : "Falha ao enviar. Sua gravação continua disponível para tentar novamente.",
      );
    }
  }
  return (
    <section className="audio-editor" aria-label={`Áudio de ${name}`}>
      <strong>Pronúncia gravada</strong>
      <small>
        Grave apenas a palavra ou uma frase curta, com voz clara. Máximo: 20
        segundos. O áudio será ouvido pelos assinantes.
      </small>
      {value && (
        <audio
          key={value}
          controls
          preload="none"
          src={value}
          aria-label={`Ouvir áudio salvo de ${name}`}
        />
      )}
      {state === "idle" && (
        <div className="audio-editor-actions">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void start()}
          >
            {value ? "Gravar novamente" : "Gravar áudio"}
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange("");
                setMessage(
                  "A voz automática será usada após salvar a atividade.",
                );
              }}
            >
              Remover áudio
            </button>
          )}
        </div>
      )}
      {state === "requesting" && (
        <p role="status">Aguardando permissão para usar o microfone…</p>
      )}
      {state === "recording" && (
        <div className="audio-editor-actions">
          <span role="status">● Gravando {seconds}/20 s</span>
          <button type="button" onClick={() => recorder.current?.stop()}>
            Parar gravação
          </button>
        </div>
      )}
      {preview && (
        <audio
          key={preview}
          controls
          src={preview}
          aria-label={`Ouvir nova gravação de ${name}`}
        />
      )}
      {(state === "draft" || state === "uploading") && (
        <div className="audio-editor-actions">
          <button
            type="button"
            disabled={state === "uploading"}
            onClick={() => void save()}
          >
            {state === "uploading" ? "Enviando áudio…" : "Usar este áudio"}
          </button>
          <button
            type="button"
            disabled={state === "uploading"}
            onClick={() => {
              clearClip();
              setState("idle");
              onBusy(false);
              setMessage("Gravação descartada. Você pode gravar novamente.");
            }}
          >
            Descartar
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
