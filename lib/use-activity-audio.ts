"use client";
import { useEffect, useRef } from "react";
/** One playback channel per activity; stale failures cannot restart old audio. */
export function useActivityAudio(sound: boolean, volume = 1, rate = 0.8) {
  const player = useRef<HTMLAudioElement | null>(null);
  const version = useRef(0);
  function stop() {
    version.current++;
    if (player.current) {
      player.current.pause();
      player.current.removeAttribute("src");
      player.current.load();
      player.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function speak(text: string, audioUrl?: string) {
    stop();
    if (!sound) return;
    const current = version.current;
    function fallback() {
      if (current !== version.current || !("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang.toLowerCase() === "pt-br");
      if (voice) utterance.voice = voice;
      utterance.volume = volume;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
    if (!audioUrl) return fallback();
    const audio = new Audio(audioUrl);
    player.current = audio;
    audio.volume = volume;
    // Preserve the recorded voice's natural pace and pitch.
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      fallback();
    };
    audio.onerror = fail;
    void audio.play().catch(fail);
  }
  useEffect(() => stop, []);
  useEffect(() => {
    if (!sound) stop();
  }, [sound]);
  return { speak, stop };
}
