// Serviço local de teste. Não é um backend de produção e não valida JWTs reais.
import http from "node:http";
const tables = new Map();
const tableRows = (name) => {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name);
};
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
    if (token === "temporary-fixture")
      return send(503, { msg: "Temporary service failure" });
    if (token === "master-fixture") return send(200, user(master));
    if (token === "member-fixture") return send(200, user(member));
    return send(401, { msg: "Token de teste inválido" });
  }
  if (
    url.pathname.startsWith("/storage/v1/object/activity-audio/") &&
    req.method === "POST"
  ) {
    for await (const chunk of req) {
      /* consume fixture upload */
    }
    return send(200, { Key: url.pathname.split("/object/")[1] });
  }
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    let body = "";
    for await (const chunk of req) body += chunk;
    const p = JSON.parse(body || "{}");
    const rpc = url.pathname.split("/").pop();
    if (rpc === "record_account_visit") return send(200, null);
    if (rpc === "register_account_device") {
      const rows = tableRows("account_devices");
      const key = p.p_user_id + ":" + p.p_token_hash;
      const old = rows.get(key);
      if (old) return send(200, old.revoked ? "revoked" : "ok");
      if (
        [...rows.values()].filter(
          (d) => d.user_id === p.p_user_id && !d.revoked,
        ).length >= 3
      )
        return send(200, "limit");
      rows.set(key, {
        user_id: p.p_user_id,
        token_hash: p.p_token_hash,
        label: p.p_label,
        revoked: false,
        created_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });
      return send(200, "ok");
    }
    if (rpc === "master_customer_dashboard")
      return send(200, {
        page: p.p_page,
        pageSize: 50,
        total: 1,
        customers: [
          {
            id: member,
            email: "member@example.test",
            guardian_name: "Ana",
            created_at: "2026-01-01T00:00:00Z",
            last_sign_in_at: "2026-11-12T12:00:00Z",
            tracked_logins: 2,
            devices: 1,
            active: false,
            buyer: false,
            status: "none",
          },
        ],
        metrics: {
          registered: 1,
          loggedIn: 1,
          buyers: 0,
          withoutPurchase: 1,
          active: 0,
          monthly: 0,
          annual: 0,
          yearlyPass: 0,
          mrrCents: 0,
          passMonthlyEquivalentCents: 0,
          grossCents: 0,
          refundedCents: 0,
          netBeforeFeesCents: 0,
        },
        generatedAt: new Date().toISOString(),
      });
    return send(200, null);
  }
  if (!url.pathname.startsWith("/rest/v1/")) return send(404, {});
  const table = url.pathname.split("/").pop();
  const rows = tableRows(table);
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
      const key =
        row.id ??
        (row.token_hash
          ? row.user_id + ":" + row.token_hash
          : (row.user_id ?? row.source_id));
      if (rows.has(key)) {
        if (req.headers.prefer?.includes("ignore-duplicates")) continue;
        return send(409, { code: "23505" });
      }
      const record = { ...row, created_at: new Date().toISOString() };
      rows.set(key, record);
      inserted.push(record);
    }
    matching = inserted;
  }
  if (req.method === "PATCH") {
    matching = matching.map((row) => ({ ...row, ...data }));
    for (const row of matching)
      rows.set(
        row.id ??
          (row.token_hash
            ? row.user_id + ":" + row.token_hash
            : (row.user_id ?? row.source_id)),
        row,
      );
  }
  if (req.method === "DELETE")
    for (const row of matching)
      rows.delete(
        row.id ??
          (row.token_hash
            ? row.user_id + ":" + row.token_hash
            : (row.user_id ?? row.source_id)),
      );
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
