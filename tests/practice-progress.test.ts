import test from "node:test";
import assert from "node:assert/strict";
import {
  selectionSummary,
  weeklyCounts,
  canRedeem,
  readPractice,
  wordKey,
} from "../lib/practice-progress";
test("seleções calculam percentual real e não inventam tentativas ou nota de fala", () => {
  assert.deepEqual(selectionSummary([]), { correct: 0, total: 0, percent: 0 });
  const at = "2026-10-28T15:00:00Z";
  assert.deepEqual(
    selectionSummary([
      { at, word: "GATO", correct: false },
      { at, word: "GATO", correct: true },
      { at, word: "BOLA", correct: true },
    ]),
    { correct: 2, total: 3, percent: 67 },
  );
});
test("recompensas respeitam a linha inicial e só podem ser registradas uma vez", () => {
  const goal = {
    id: "1",
    title: "Brincadeira",
    target: 5,
    baseline: 10,
    createdAt: "2026-10-28T15:00:00Z",
  };
  assert.equal(canRedeem(goal, 14), false);
  assert.equal(canRedeem(goal, 15), true);
  assert.equal(
    canRedeem({ ...goal, redeemedAt: "2026-10-28T16:00:00Z" }, 20),
    false,
  );
});
test("evolução semanal usa dias de São Paulo, inclusive na virada UTC", () => {
  const chart = weeklyCounts(
    {
      gato: {
        word: "GATO",
        emoji: "🐱",
        category: "animals",
        at: "2026-10-28T01:30:00Z",
      },
      bola: {
        word: "BOLA",
        emoji: "⚽",
        category: "objects",
        at: "2026-10-28T15:00:00Z",
      },
    },
    new Date("2026-10-28T16:00:00Z"),
  );
  assert.equal(chart.length, 7);
  assert.equal(chart.find((d) => d.key === "2026-10-27")?.count, 1);
  assert.equal(chart.find((d) => d.key === "2026-10-28")?.count, 1);
});
test("dados antigos ou inválidos não quebram o novo painel", () => {
  assert.equal(readPractice(undefined).sessions.length, 0);
  const safe = readPractice({
    attempts: [{ correct: "yes" }],
    sessions: [{ milliseconds: -1 }],
    volume: 9,
    rate: 0,
    showLabels: "true",
  });
  assert.equal(safe.attempts.length, 0);
  assert.equal(safe.sessions.length, 0);
  assert.equal(safe.volume, 1);
  assert.equal(safe.rate, 0.8);
  assert.equal(safe.showLabels, false);
  assert.equal(wordKey(" GATO "), "gato");
});
