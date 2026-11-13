// Requires the local Docker daemon and the official postgres:17-alpine image.
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const execute = promisify(execFile);
const name = `falabrinca-db-${process.pid}`;
const env = { ...process.env };
for (const key of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete env[key];
const args = ["--host=unix:///var/run/docker.sock"];
const docker = (command, options = {}) =>
  execFileSync("docker", [...args, ...command], {
    env,
    encoding: "utf8",
    ...options,
  });
const sql = (text) =>
  docker(
    [
      "exec",
      "-i",
      name,
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
    ],
    { input: text },
  );
try {
  docker([
    "run",
    "--rm",
    "-d",
    "--name",
    name,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "postgres:17-alpine",
  ]);
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      docker(
        ["exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"],
        { stdio: "pipe" },
      );
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!ready) throw new Error("Postgres did not start");
  sql(readFileSync("tests/sql/commercial-bootstrap.sql", "utf8"));
  const migration = readFileSync(
    "supabase/commercial-devices-migration.sql",
    "utf8",
  );
  sql(migration);
  sql(migration);
  const playful = readFileSync(
    "supabase/playful-activities-migration.sql",
    "utf8",
  );
  sql(playful);
  sql(playful);
  sql(`insert into learning_activities values('new-puzzle','puzzle','{}'),('new-memory','memory','{}');
    do $$ begin
      if (select content->>'audio_url' from learning_activities where id='preserve-recording') <> 'https://example.test/custom.webm' then raise exception 'existing recording changed'; end if;
      begin insert into learning_activities values('invalid','unknown','{}'); raise exception 'invalid kind accepted'; exception when check_violation then null; end;
    end; $$;`);
  sql(readFileSync("tests/sql/commercial-assertions.sql", "utf8"));
  const register = (id) =>
    execute(
      "docker",
      [
        ...args,
        "exec",
        "-i",
        name,
        "psql",
        "-U",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-Atc",
        `select register_account_device('cccccccc-cccc-4ccc-8ccc-cccccccccccc','concurrent${id}','browser')`,
      ],
      { env, encoding: "utf8" },
    );
  const result = await Promise.all(
    Array.from({ length: 8 }, (_, i) => register(i)),
  );
  assert.equal(result.filter((r) => r.stdout.trim() === "ok").length, 3);
  assert.equal(result.filter((r) => r.stdout.trim() === "limit").length, 5);
  assert.equal(
    sql(
      "select count(*) from account_devices where user_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc' and not revoked",
    ).trim(),
    "3",
  );
  console.log(
    "PostgreSQL: migration is repeatable; permissions, device limit, 8 concurrent registrations, checkout lock, idempotency, refunds, calendar access and dashboard totals passed.",
  );
} finally {
  docker(["rm", "-f", name], { stdio: "pipe" });
}
