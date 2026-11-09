"use client";
let player: HTMLAudioElement | null = null;
/** Reuse the element activated by the child's tap, including after an API fetch. */
export function activityAudioPlayer() {
  player ??= new Audio();
  return player;
}
export function unlockActivityAudio() {
  const audio = activityAudioPlayer();
  // A short silent WAV starts synchronously within the selection gesture.
  const bytes = new Uint8Array(204);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => {
    [...text].forEach((char, i) => {
      bytes[offset + i] = char.charCodeAt(0);
    });
  };
  write(0, "RIFF");
  view.setUint32(4, 196, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, "data");
  view.setUint32(40, 160, true);
  bytes.fill(128, 44);
  audio.src = `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
  void audio.play().catch(() => {
    /* The visible listen button remains available. */
  });
}
