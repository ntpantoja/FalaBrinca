import test from "node:test";
import assert from "node:assert/strict";
import { placePuzzlePiece, shuffled } from "../lib/game-pieces";
import { catalog } from "../lib/catalog";
import { allContent } from "../lib/activity-content";
import { validateActivity } from "../lib/content-validation";
import { existsSync } from "node:fs";
test("quebra-cabeça só encaixa peça correta em espaço vazio sem duplicar peças", () => {
  const empty = [null, null, null, null];
  assert.equal(placePuzzlePiece(empty, 0, 1), null);
  assert.equal(placePuzzlePiece(empty, -1, 0), null);
  const first = placePuzzlePiece(empty, 0, 0)!;
  assert.deepEqual(first, [0, null, null, null]);
  assert.deepEqual(empty, [null, null, null, null]);
  assert.equal(placePuzzlePiece(first, 0, 0), null);
  let slots = first;
  for (let i = 1; i < 4; i++) slots = placePuzzlePiece(slots, i, i)!;
  assert.deepEqual(slots, [0, 1, 2, 3]);
  assert.deepEqual(shuffled([0, 1, 2, 3]).sort(), [0, 1, 2, 3]);
});
test("24 quebra-cabeças e oito memórias têm material válido e ilustrações locais existentes", () => {
  assert.equal(catalog.filter((a) => a.kind === "puzzle").length, 24);
  assert.equal(catalog.filter((a) => a.kind === "memory").length, 8);
  for (const a of catalog.filter(
    (a) => a.kind === "puzzle" || a.kind === "memory",
  )) {
    assert.ok(
      validateActivity({ ...a, published: true, content: allContent[a.id] }),
      a.id,
    );
    for (const r of allContent[a.id].rounds)
      for (const c of r.choices) {
        assert.ok(c.image_url);
        assert.ok(existsSync(`public${c.image_url}`), c.image_url);
      }
  }
  const puzzle = catalog.find((a) => a.kind === "puzzle")!;
  const bad = structuredClone({
    ...puzzle,
    published: true,
    content: allContent[puzzle.id],
  });
  bad.content.rounds[0].choices[0].image_url = "/puzzles/../../secret.svg";
  assert.equal(validateActivity(bad), null);
});
