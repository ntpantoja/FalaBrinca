import test from "node:test";
import assert from "node:assert/strict";
import { recordedAudioType, MAX_AUDIO_BYTES } from "../lib/recorded-audio";
test("upload de áudio confere tipo, assinatura do contêiner e tamanho", () => {
  const webm = Buffer.alloc(32);
  webm.set([0x1a, 0x45, 0xdf, 0xa3]);
  assert.equal(
    recordedAudioType(webm, "audio/webm;codecs=opus")?.extension,
    "webm",
  );
  assert.equal(recordedAudioType(webm, "text/html"), null);
  assert.equal(
    recordedAudioType(Buffer.from("<html>não é áudio</html>"), "audio/webm"),
    null,
  );
  const mp4 = Buffer.alloc(32);
  mp4.write("ftyp", 4);
  assert.equal(recordedAudioType(mp4, "audio/mp4")?.mime, "audio/mp4");
  const ogg = Buffer.alloc(32);
  ogg.write("OggS");
  assert.equal(recordedAudioType(ogg, "audio/ogg")?.extension, "ogg");
  assert.equal(
    recordedAudioType(Buffer.alloc(MAX_AUDIO_BYTES + 1), "audio/webm"),
    null,
  );
});
