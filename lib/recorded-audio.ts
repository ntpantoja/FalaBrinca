export const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
/** Check container signatures as well as the browser's declared audio type. */
export function recordedAudioType(bytes: Uint8Array, mime: string) {
  const base = mime.split(";")[0].trim().toLowerCase();
  const ascii = (start: number, text: string) =>
    [...text].every((c, i) => bytes[start + i] === c.charCodeAt(0));
  if (bytes.length < 16 || bytes.length > MAX_AUDIO_BYTES) return null;
  if (
    base === "audio/webm" &&
    [0x1a, 0x45, 0xdf, 0xa3].every((v, i) => bytes[i] === v)
  )
    return { mime: "audio/webm", extension: "webm" };
  if (base === "audio/ogg" && ascii(0, "OggS"))
    return { mime: "audio/ogg", extension: "ogg" };
  if (base === "audio/mp4" && ascii(4, "ftyp"))
    return { mime: "audio/mp4", extension: "m4a" };
  return null;
}
