import test from "node:test";
import assert from "node:assert/strict";
import { catalog } from "../lib/catalog";
import { allContent } from "../lib/activity-content";
import { sequencePictures } from "../lib/pictures";
import { parseProfile } from "../lib/profile";
test("24 atividades distintas e 72 rodadas completas, por categoria e dificuldade", () => {
  assert.equal(catalog.length, 24);
  assert.equal(new Set(catalog.map((a) => a.id)).size, 24);
  assert.equal(catalog.filter((a) => a.difficulty === "beginner").length, 8);
  for (const a of catalog)
    assert.ok(["animals", "objects", "foods"].includes(a.category));
  assert.equal(
    catalog.reduce((n, a) => n + allContent[a.id].rounds.length, 0),
    72,
  );
  for (const activity of catalog) {
    const content = allContent[activity.id];
    assert.ok(content, activity.id);
    assert.equal(content.rounds.length, 3);
    for (const round of content.rounds) {
      assert.ok(round.prompt);
      if (round.words) {
        const pictures = sequencePictures(round.words);
        assert.ok(pictures.length >= 2);
        assert.equal(
          new Set(pictures.map((p) => p.emoji)).size,
          pictures.length,
          `Figuras repetidas: ${activity.id}`,
        );
        assert.equal(
          pictures.some(
            (p) => p.emoji === "✨" && !round.words!.includes("BRILHA"),
          ),
          false,
        );
      } else {
        assert.equal(round.choices.length, 3);
        assert.equal(
          round.choices.filter((c) => c.name === round.answer).length,
          1,
        );
        assert.equal(new Set(round.choices.map((c) => c.emoji)).size, 3);
      }
    }
  }
});
test("perfil valida nomes, limites e autorização do responsável", () => {
  assert.deepEqual(
    parseProfile({
      guardian_name: " Ana  Maria ",
      child_first_name: "João",
      consent: true,
    }),
    {
      guardian_name: "Ana Maria",
      child_first_name: "João",
      consent_version: "2026-10-28",
    },
  );
  for (const input of [
    null,
    {},
    { guardian_name: "Ana", child_first_name: "João", consent: false },
    { guardian_name: "A", child_first_name: "João", consent: true },
    { guardian_name: "Ana", child_first_name: "<script>", consent: true },
    { guardian_name: "Ana", child_first_name: "a".repeat(41), consent: true },
  ])
    assert.equal(parseProfile(input), null);
});
