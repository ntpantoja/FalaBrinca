import test from "node:test";
import assert from "node:assert/strict";
import { creditPractice } from "../lib/daily-usage";
import { activityGroup } from "../lib/activity-groups";
test("tempo divide a virada de Brasília e conclusão conta só uma atividade", () => {
  const end = Date.parse("2026-11-14T03:00:01Z");
  const usage = creditPractice({}, end, 2000, true);
  assert.deepEqual(usage["2026-11-13"], { milliseconds: 1000, activities: 0 });
  assert.deepEqual(usage["2026-11-14"], { milliseconds: 1000, activities: 1 });
  assert.deepEqual(creditPractice(usage, end, NaN), usage);
});
test("modalidades separam memória e quebra-cabeças da linguagem", () => {
  assert.equal(activityGroup("memory"), "memory");
  assert.equal(activityGroup("puzzle"), "puzzle");
  for (const kind of ["figures", "association", "sentence"] as const)
    assert.equal(activityGroup(kind), "learning");
});
