import test from "node:test";
import assert from "node:assert/strict";
import { validateActivity, safeMediaUrl } from "../lib/content-validation";
import { catalog } from "../lib/catalog";
import { allContent } from "../lib/activity-content";
import { sequencePictures } from "../lib/pictures";
const example = () => ({
  ...catalog[0],
  published: true,
  revision: 1,
  content: { id: catalog[0].id, rounds: allContent[catalog[0].id].rounds },
});
test("editor valida todas as atividades importadas e remove campos de permissão injetados", () => {
  for (const a of catalog) {
    const value = validateActivity({
      ...a,
      published: true,
      content: {
        id: a.id,
        rounds: allContent[a.id].rounds.map((r) =>
          r.words ? { ...r, sequence: sequencePictures(r.words) } : r,
        ),
      },
    });
    assert.ok(value, a.id);
    assert.equal(Object.hasOwn(value, "isMaster"), false);
  }
  assert.equal(
    validateActivity({ ...example(), isMaster: true })?.title,
    catalog[0].title,
  );
});
test("editor rejeita categorias, níveis, imagens inseguras e respostas ambíguas", () => {
  for (const changed of [
    { category: "admin" },
    { difficulty: "beginner", kind: "sentence" },
    { id: "../admin" },
    { published: "true" },
    { content: { id: "x", rounds: [] } },
  ])
    assert.equal(validateActivity({ ...example(), ...changed }), null);
  const bad = example();
  bad.content.rounds = structuredClone(bad.content.rounds);
  bad.content.rounds[0].choices[0].image_url = "javascript:alert(1)";
  assert.equal(validateActivity(bad), null);
  assert.equal(safeMediaUrl("http://exemplo.com/a.png"), false);
  assert.equal(safeMediaUrl("https://exemplo.com/a.png"), true);
});
