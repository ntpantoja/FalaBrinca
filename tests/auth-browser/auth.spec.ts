import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { catalog, type ActivityContent } from "../../lib/catalog";
import { categories } from "../../lib/content-validation";
import { sequencePictures } from "../../lib/pictures";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "adulto@example.com",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
};
const jwt = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: user.id,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  { fixture: true },
]
  .map((p) => Buffer.from(JSON.stringify(p)).toString("base64url"))
  .join(".");
const session = {
  access_token: jwt,
  refresh_token: "refresh-local-test",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user,
};
async function authMock(page: Page) {
  await page.route("http://127.0.0.1:5400/auth/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/signup"))
      return route.fulfill({ json: { user, session: null } });
    if (path.endsWith("/token")) return route.fulfill({ json: session });
    if (path.endsWith("/user")) return route.fulfill({ json: user });
    return route.fulfill({ json: {} });
  });
  await page.route("**/api/account", (r) =>
    r.fulfill({ json: { active: false, status: "none", canManage: false } }),
  );
}
async function loginCallback(page: Page) {
  await page.goto(
    `/auth/continuar#access_token=${jwt}&refresh_token=refresh-local-test&expires_in=3600&token_type=bearer&type=signup`,
  );
  await page.waitForURL("**/conta?completar=1");
}
test("e-mail confirmado leva ao perfil, sem novo login; nomes, pagamento e saída — serviços simulados", async ({
  page,
}) => {
  await authMock(page);
  let profile: unknown = null;
  await page.route("**/api/profile", async (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      expect(body.consent).toBe(true);
      profile = {
        guardian_name: body.guardian_name,
        child_first_name: body.child_first_name,
        consent_version: "2026-10-28",
      };
    }
    return route.fulfill({ json: { profile } });
  });
  await page.route("**/api/checkout", (r) =>
    r.fulfill({
      status: 503,
      json: { error: "Pagamento de teste indisponível." },
    }),
  );
  await page.goto("/");
  await page.screenshot({
    path: "/tmp/falabrinca-novo-cadastro.png",
    fullPage: true,
  });
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel(/^Senha/).fill("SenhaTeste123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(
    page.getByRole("heading", { name: /Um convite chegou/ }),
  ).toBeVisible();
  await expect(page.locator(".email-check")).toContainText(
    "primeiro nome da criança",
  );
  await loginCallback(page);
  await expect(page.getByLabel("Seu nome", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveCount(0);
  await page.getByLabel("Seu nome", { exact: true }).fill("Ana Maria");
  await page
    .getByRole("textbox", { name: /^Primeiro nome da criança/ })
    .fill("Bia");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar para assinatura" }).click();
  await expect(page.getByRole("heading", { name: "Olá, Ana!" })).toBeVisible();
  await page.getByRole("button", { name: "Assinar por R$ 50,00/mês" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Pagamento de teste indisponível",
  );
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});
test("Google encaminha ao provedor com retorno para o cadastro — autorização não é simulada como login real", async ({
  page,
}) => {
  await authMock(page);
  await page.route("http://127.0.0.1:5400/auth/v1/authorize**", (r) =>
    r.fulfill({ contentType: "text/html", body: "<p>Provedor simulado</p>" }),
  );
  await page.goto("/conta");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await page.waitForURL("**/auth/v1/authorize?**");
  const url = new URL(page.url());
  expect(url.searchParams.get("provider")).toBe("google");
  expect(url.searchParams.get("redirect_to")).toBe(
    "http://localhost:3101/auth/continuar",
  );
});
test("recuperação mantém mensagem sem revelar se conta existe", async ({
  page,
}) => {
  await authMock(page);
  await page.goto("/conta");
  await page
    .getByRole("button", { name: "Já tenho conta", exact: true })
    .click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta");
});
// Conteúdo real do servidor, entregue por um transporte simulado somente nos testes de UI.
const content: Record<string, ActivityContent> = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "-e",
      "import('./lib/activity-content.ts').then(m=>process.stdout.write(JSON.stringify(m.allContent)))",
    ],
    { encoding: "utf8" },
  ),
);
for (const activity of catalog)
  test(`atividade visual completa: ${activity.title}`, async ({ page }) => {
    await authMock(page);
    await page.addInitScript(
      (value) =>
        localStorage.setItem("sb-127-auth-token", JSON.stringify(value)),
      session,
    );
    await page.route("**/api/profile", (r) =>
      r.fulfill({ json: { profile: null } }),
    );
    await page.route(`**/api/activities/${activity.id}`, (r) =>
      r.fulfill({ json: content[activity.id] }),
    );
    await page.route("**/api/library", (r) =>
      r.fulfill({ json: { activities: catalog, role: "subscriber" } }),
    );
    await page.goto("/atividades");
    await page
      .getByRole("button", { name: "Começar Atividade", exact: true })
      .click();
    await page
      .getByRole("button", { name: categories[activity.category], exact: true })
      .click();
    if (activity.difficulty !== "beginner")
      await page
        .getByRole("button", {
          name:
            activity.difficulty === "intermediate"
              ? "Intermediário: associar figuras"
              : "Avançado: histórias visuais",
          exact: true,
        })
        .click();
    await page
      .getByRole("button", { name: `Jogar ${activity.title}`, exact: true })
      .click();
    await page
      .locator(
        activity.kind === "figures" ? ".word-hero-card" : ".picture-prompt",
      )
      .waitFor();
    for (const [index, round] of content[activity.id].rounds.entries()) {
      if (activity.difficulty === "beginner") {
        await page
          .getByRole("button", { name: "Escolher a figura para continuar" })
          .click();
        await expect(page.locator(".selection-model")).toContainText("👂");
        await expect(page.locator(".word-choice-grid button")).toHaveCount(
          round.choices.length,
        );
      }
      const answers = round.words
        ? sequencePictures(round.words).map((piece) => piece.name.split(":")[1])
        : [round.answer];
      for (const name of answers)
        await page.getByRole("button", { name, exact: true }).click();
      await page
        .getByRole("button", {
          name:
            activity.kind === "figures"
              ? "Pratiquei esta palavra!"
              : index === 2
                ? "Ganhar minhas estrelas"
                : "Próxima descoberta",
        })
        .click();
    }
    await expect(page.locator(".reward-stars")).toContainText("+3");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("servidor limita master ao ID configurado e exige assinatura dos demais — provedor local simulado", async ({
  request,
}) => {
  const member = {
    Authorization: "Bearer member-fixture",
    Origin: "http://localhost:3101",
  };
  const master = {
    Authorization: "Bearer master-fixture",
    Origin: "http://localhost:3101",
  };
  expect(
    (await request.get("/api/admin/activities", { headers: member })).status(),
  ).toBe(403);
  expect(
    (await request.get("/api/library", { headers: member })).status(),
  ).toBe(403);
  expect(
    (
      await request.get("/api/activities/figuras-inicio", { headers: member })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/admin/seed", { headers: member })).status(),
  ).toBe(403);
  const owner = await request.get("/api/account", { headers: master });
  expect(owner.status()).toBe(200);
  expect((await owner.json()).isMaster).toBe(true);
  const imported = await request.post("/api/admin/seed", { headers: master });
  expect(imported.status()).toBe(200);
  const library = await request.get("/api/library", { headers: master });
  expect(library.status()).toBe(200);
  expect((await library.json()).activities.length).toBeGreaterThanOrEqual(24);
  const seedAgain = await request.post("/api/admin/seed", { headers: master });
  expect((await seedAgain.json()).imported).toBe(0);
  const id = "teste-edicao-segura";
  const payload = {
    ...catalog[0],
    id,
    title: "Card de teste do master",
    published: true,
    revision: 1,
    content: { id, rounds: content[catalog[0].id].rounds },
  };
  const create = await request.post("/api/admin/activities", {
    headers: master,
    data: payload,
  });
  expect(create.status()).toBe(201);
  expect(
    (
      await request.post("/api/admin/activities", {
        headers: member,
        data: payload,
      })
    ).status(),
  ).toBe(403);
  const updated = await request.put(`/api/admin/activities/${id}`, {
    headers: master,
    data: { ...payload, title: "Card atualizado" },
  });
  expect(updated.status()).toBe(200);
  expect((await updated.json()).activity.revision).toBe(2);
  expect(
    (
      await request.put(`/api/admin/activities/${id}`, {
        headers: master,
        data: payload,
      })
    ).status(),
  ).toBe(409);
  expect(
    (await request.get(`/api/activities/${id}`, { headers: master })).status(),
  ).toBe(200);
  expect(
    (
      await request.delete(`/api/admin/activities/${id}?revision=1`, {
        headers: master,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.delete(`/api/admin/activities/${id}?revision=2`, {
        headers: master,
      })
    ).status(),
  ).toBe(200);
  expect(
    (await request.get(`/api/activities/${id}`, { headers: master })).status(),
  ).toBe(404);
  expect(
    (
      await request.post("/api/admin/seed", {
        headers: { ...master, Origin: "https://outro.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/admin/media", {
        headers: master,
        multipart: {
          file: {
            name: "quebrada.png",
            mimeType: "image/png",
            buffer: Buffer.from("not an image"),
          },
        },
      })
    ).status(),
  ).toBe(400);
});

test("painel master cria, edita e apaga card pela interface — banco simulado", async ({
  page,
  request,
}) => {
  const owner = {
    ...user,
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    email: "master@example.test",
  };
  await page.addInitScript(
    (value) => localStorage.setItem("sb-127-auth-token", JSON.stringify(value)),
    { ...session, access_token: "master-fixture", user: owner },
  );
  await page.route("http://127.0.0.1:5400/auth/v1/user", (route) =>
    route.fulfill({ json: owner }),
  );
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "+ Nova atividade", exact: true })
    .click();
  await page.getByLabel("Título do card").fill("Animais do quintal");
  await page.getByLabel("Publicar na biblioteca dos assinantes").check();
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Animais do quintal", exact: true }),
  ).toBeVisible();
  let row = page.locator(".admin-activity-list article").filter({
    has: page.getByRole("heading", {
      name: "Animais do quintal",
      exact: true,
    }),
  });
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Título do card").fill("Animais do quintal atualizado");
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Animais do quintal atualizado",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/falabrinca-master-mobile.png",
    fullPage: true,
  });
  row = page.locator(".admin-activity-list article").filter({
    has: page.getByRole("heading", {
      name: "Animais do quintal atualizado",
      exact: true,
    }),
  });
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Apagar", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Animais do quintal atualizado",
      exact: true,
    }),
  ).toHaveCount(0);
});

async function paidApp(page: Page) {
  await authMock(page);
  await page.addInitScript(
    (value) => localStorage.setItem("sb-127-auth-token", JSON.stringify(value)),
    session,
  );
  await page.route("**/api/profile", (r) =>
    r.fulfill({
      json: {
        profile: {
          guardian_name: "Ana",
          child_first_name: "Bia",
          consent_version: "2026-10-28",
        },
      },
    }),
  );
  await page.route("**/api/library", (r) =>
    r.fulfill({ json: { activities: catalog, role: "subscriber" } }),
  );
  await page.route("**/api/activities/*", (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop()!;
    return route.fulfill({ json: content[id] });
  });
}
test("pagamento confirmado encaminha automaticamente ao painel — checkout e serviços simulados", async ({
  page,
}) => {
  await paidApp(page);
  let active = false;
  await page.route("**/api/account", (r) =>
    r.fulfill({
      json: { active, status: active ? "active" : "none", canManage: active },
    }),
  );
  await page.route("**/api/checkout", (r) => {
    active = true;
    return r.fulfill({
      json: { url: "http://localhost:3101/conta?checkout=success" },
    });
  });
  await page.goto("/conta");
  await page.getByRole("button", { name: "Assinar por R$ 50,00/mês" }).click();
  await page.waitForURL("**/atividades");
  await expect(
    page.getByRole("button", { name: "Começar Atividade", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Olá, Bia!" })).toBeVisible();
});
test("painel de referência, metas, progresso, gráfico, exportação e configurações usam prática real", async ({
  page,
}) => {
  await paidApp(page);
  await page.goto("/atividades");
  await expect(page.getByRole("heading", { name: "Olá, Bia!" })).toBeVisible();
  await page.screenshot({
    path: "/tmp/falabrinca-referencia-inicio.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar meta" }).click();
  await page.getByLabel("Recompensa combinada").fill("Desenhar juntos");
  await page.getByLabel("Estrelas a partir de agora").fill("1");
  await page.getByRole("button", { name: "Criar meta", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue praticando, sem pressa" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page
    .getByRole("button", { name: "Começar Atividade", exact: true })
    .click();
  await expect(page.locator(".kids-category")).toHaveCount(8);
  await page.screenshot({
    path: "/tmp/falabrinca-referencia-categorias.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Alimentos", exact: true }).click();
  await page
    .getByRole("button", { name: `Jogar ${catalog[0].title}`, exact: true })
    .click();
  await page.locator(".word-hero-card").waitFor();
  await page.screenshot({
    path: "/tmp/falabrinca-referencia-palavra.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Minha vez de repetir, sem gravação" })
    .click();
  await expect(page.getByRole("status")).toContainText("Não gravamos");
  for (const [index, round] of content[catalog[0].id].rounds.entries()) {
    await page
      .getByRole("button", { name: "Ir para a seleção da figura", exact: true })
      .click();
    await expect(page.locator(".selection-model .activity-image")).toHaveCount(
      0,
    );
    await expect(page.locator(".word-choice-grid button")).toHaveCount(
      round.choices.length,
    );
    if (index === 0)
      await page.getByRole("button", { name: "PÃO", exact: true }).click();
    await page.getByRole("button", { name: round.answer, exact: true }).click();
    await page.getByRole("button", { name: "Pratiquei esta palavra!" }).click();
  }
  await page
    .getByRole("button", { name: "Voltar ao início", exact: true })
    .click();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.locator(".percentage-ring")).toContainText("75%");
  await expect(page.locator(".progress-stats-grid")).toContainText("3");
  await page
    .getByRole("button", { name: "Resgatar recompensa", exact: true })
    .click();
  await expect(page.locator(".goal-item")).toContainText(
    "Recompensa resgatada!",
  );
  await page.screenshot({
    path: "/tmp/falabrinca-referencia-progresso.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: "Progresso", exact: true }).click();
  await expect(page.locator(".goal-item")).toContainText(
    "Recompensa resgatada!",
  );
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.getByRole("button", { name: "Pais", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Painel dos Pais" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar histórico" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/falabrinca-pratica-.*json/);
  await expect(page.locator(".weekly-chart svg")).toHaveAttribute(
    "aria-label",
    /3 palavras/,
  );
  await page.screenshot({
    path: "/tmp/falabrinca-referencia-pais.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Mostrar legenda de apoio nas figuras").check();
  await page.getByLabel("Velocidade da voz").selectOption("0.6");
  await expect(page.getByLabel("Velocidade da voz")).toHaveValue("0.6");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("imagem indisponível mostra desenho alternativo e não quebra a atividade", async ({
  page,
}) => {
  await paidApp(page);
  const broken = structuredClone(content[catalog[0].id]);
  broken.rounds[0].choices.find(
    (c) => c.name === broken.rounds[0].answer,
  )!.image_url = "https://media.example.test/missing.png";
  await page.route(`**/api/activities/${catalog[0].id}`, (r) =>
    r.fulfill({ json: broken }),
  );
  await page.route("https://media.example.test/**", (route) => route.abort());
  await page.goto("/atividades");
  await page
    .getByRole("button", { name: "Começar Atividade", exact: true })
    .click();
  await page.getByRole("button", { name: "Alimentos", exact: true }).click();
  await page
    .getByRole("button", { name: `Jogar ${catalog[0].title}`, exact: true })
    .click();
  await expect(page.locator(".word-hero-card")).toContainText("🍎");
  await expect(page.locator(".word-hero-card img")).toHaveCount(0);
});
