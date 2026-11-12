import test from "node:test";
import assert from "node:assert/strict";
import { temporaryAuthFailure } from "../lib/auth-errors";
test("rede, limite de requisições e falhas do serviço não significam sessão inválida", () => {
  for (const status of [0, 408, 429, 500, 502, 503, 504])
    assert.equal(temporaryAuthFailure({ status }), true);
  assert.equal(temporaryAuthFailure({ name: "AuthRetryableFetchError" }), true);
  assert.equal(temporaryAuthFailure({ name: "TypeError" }), true);
});
test("tokens inválidos e sessão revogada continuam exigindo autenticação", () => {
  for (const status of [400, 401, 403, 404, 422])
    assert.equal(temporaryAuthFailure({ status }), false);
  assert.equal(temporaryAuthFailure(null), false);
});
