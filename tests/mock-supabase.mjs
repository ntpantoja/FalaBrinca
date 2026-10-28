// Serviço local de teste. Não é um backend de produção e não valida JWTs reais.
import http from "node:http";
const rows = new Map();
const master = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const member = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const user = (id) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: id === master ? "master@example.test" : "member@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email" },
  user_metadata: { role: "master" },
});
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:5400");
  function send(status, data) {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    });
    res.end(JSON.stringify(data));
  }
  if (req.method === "OPTIONS") return send(200, {});
  if (url.pathname === "/health") return send(200, { ready: true });
  if (url.pathname === "/auth/v1/user") {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token === "master-fixture") return send(200, user(master));
    if (token === "member-fixture") return send(200, user(member));
    return send(401, { msg: "Token de teste inválido" });
  }
  if (!url.pathname.startsWith("/rest/v1/")) return send(404, {});
  const table = url.pathname.split("/").pop();
  if (table !== "learning_activities") return send(200, []);
  let matching = [...rows.values()].filter((row) =>
    [...url.searchParams].every(
      ([key, value]) =>
        !value.startsWith("eq.") || String(row[key]) === value.slice(3),
    ),
  );
  const select = (row) => {
    const fields = url.searchParams.get("select");
    return !fields || fields === "*"
      ? row
      : Object.fromEntries(fields.split(",").map((key) => [key, row[key]]));
  };
  let body = "";
  for await (const chunk of req) body += chunk;
  let data = body ? JSON.parse(body) : null;
  if (req.method === "POST") {
    const inserted = [];
    for (const row of Array.isArray(data) ? data : [data]) {
      if (rows.has(row.id)) {
        if (req.headers.prefer?.includes("ignore-duplicates")) continue;
        return send(409, { code: "23505" });
      }
      const record = { ...row, created_at: new Date().toISOString() };
      rows.set(row.id, record);
      inserted.push(record);
    }
    matching = inserted;
  }
  if (req.method === "PATCH") {
    matching = matching.map((row) => ({ ...row, ...data }));
    for (const row of matching) rows.set(row.id, row);
  }
  if (req.method === "DELETE") for (const row of matching) rows.delete(row.id);
  const selected = matching.map(select);
  return send(
    200,
    req.headers.accept?.includes("vnd.pgrst.object")
      ? (selected[0] ?? null)
      : selected,
  );
});
server.listen(5400, "127.0.0.1");
process.on("SIGTERM", () => server.close());
