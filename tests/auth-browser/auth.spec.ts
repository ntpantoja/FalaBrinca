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
  await page.route("**/api/devices", (route) =>
    route.fulfill({ json: { registered: true } }),
  );
  await page.route("http://127.0.0.1:5400/auth/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/signup"))
      return route.fulfill({
        json: {
          user: {
            ...user,
            email_confirmed_at: null,
            identities: [{ id: "new-email-identity", provider: "email" }],
          },
          session: null,
        },
      });
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
    page.getByRole("heading", { name: /Confirme seu e-mail/ }),
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
for (const duplicate of ["obfuscated", "explicit"] as const) {
  test(`cadastro existente mostra aviso e abre login: ${duplicate}`, async ({
    page,
  }) => {
    await authMock(page);
    await page.route("http://127.0.0.1:5400/auth/v1/signup**", (route) =>
      route.fulfill(
        duplicate === "explicit"
          ? {
              status: 422,
              json: {
                error_code: "user_already_exists",
                msg: "User already registered",
              },
            }
          : { json: { user, session: null } },
      ),
    );
    await page.goto("/");
    await page.getByLabel("E-mail", { exact: true }).fill(user.email);
    await page.getByLabel(/^Senha/).fill("SenhaTeste123!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar minha conta" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Este e-mail já está cadastrado",
    );
    await expect(
      page.getByRole("heading", { name: "Bom ter você de volta!" }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
      user.email,
    );
    await expect(page.getByLabel(/^Senha/)).toHaveValue("");
    await expect(page.locator(".email-check")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("falabrinca-pending-email")),
      )
      .toBeNull();
    await page.getByRole("button", { name: "Esqueci minha senha" }).click();
    await expect(
      page.getByRole("button", { name: "Enviar instruções" }),
    ).toBeVisible();
  });
}
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
test("cancelamento do provedor volta ao login sem sugerir e-mail expirado", async ({
  page,
}) => {
  await authMock(page);
  await page.goto(
    "/auth/continuar?error=access_denied&error_description=private-detail",
  );
  await expect(page.getByRole("status")).toContainText(
    "A entrada não foi autorizada",
  );
  await expect(page.getByRole("status")).not.toContainText("expirou");
  await expect(page.getByRole("status")).not.toContainText("private-detail");
  await page.getByRole("link", { name: "Voltar para entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Bom ter você de volta!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continuar com Google" }),
  ).toBeEnabled();
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
        activity.kind === "figures"
          ? ".word-hero-card"
          : activity.kind === "puzzle"
            ? ".puzzle-board"
            : activity.kind === "memory"
              ? ".memory-grid"
              : ".picture-prompt",
      )
      .waitFor();
    for (const [index, round] of content[activity.id].rounds.entries()) {
      if (activity.kind === "figures") {
        await expect(
          page.getByRole("img", {
            name: `Figura para imitar: ${round.answer}`,
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Pratiquei esta palavra!" }),
        ).toBeDisabled();
        await expect(page.locator(".word-choice-grid button")).toHaveCount(
          round.choices.length,
        );
      }
      if (activity.kind === "puzzle") {
        for (let piece = 0; piece < 4; piece++) {
          await page.locator(`[data-piece="${piece}"]`).click();
          await page.locator(`[data-puzzle-slot="${piece}"]`).click();
        }
      } else if (activity.kind === "memory") {
        for (let pair = 0; pair < 3; pair++) {
          const cards = page.locator(`[data-memory-pair="${pair}"]`);
          await cards.nth(0).click();
          await cards.nth(1).click();
        }
      } else {
        const answers = round.words
          ? sequencePictures(round.words).map(
              (piece) => piece.name.split(":")[1],
            )
          : [round.answer];
        for (const name of answers)
          await page.getByRole("button", { name, exact: true }).click();
      }
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
    await expect(page.locator(".reward-stars")).toContainText(
      activity.kind === "memory" ? "+9" : "+3",
    );
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
  await page.goto("/admin/conteudo");
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
    await expect(
      page.getByRole("img", {
        name: `Figura para imitar: ${round.answer}`,
        exact: true,
      }),
    ).toBeVisible();
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
test("nível inicial mantém lápis como modelo e três opções, com áudio e sem avançar no erro", async ({
  page,
}) => {
  await paidApp(page);
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.defineProperty(window, "testSpoken", { value: spoken });
    window.speechSynthesis.speak = (utterance) => {
      spoken.push(utterance.text);
    };
  });
  const activity = catalog.find(
    (a) => a.category === "objects" && a.difficulty === "beginner",
  )!;
  const rounds = ["LÁPIS", "BOLA"].map((answer) => ({
    prompt: `Encontre ${answer}`,
    answer,
    hint: "Observe o desenho de cima.",
    choices: [
      {
        name: "LÁPIS",
        emoji: "✏️",
        image_url: "https://media.example.test/pencil.svg",
      },
      { name: "BOLA", emoji: "⚽" },
      { name: "LIVRO", emoji: "📘" },
    ],
  }));
  await page.route(`**/api/activities/${activity.id}`, (r) =>
    r.fulfill({ json: { id: activity.id, rounds } }),
  );
  await page.route("https://media.example.test/pencil.svg", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path fill="orange" d="M20 60L65 15L85 35L40 80L10 90Z"/></svg>',
    }),
  );
  await page.goto("/atividades");
  await page
    .getByRole("button", { name: "Começar Atividade", exact: true })
    .click();
  await page.getByRole("button", { name: "Objetos", exact: true }).click();
  await page
    .getByRole("button", { name: `Jogar ${activity.title}`, exact: true })
    .click();
  const model = page.getByRole("img", {
    name: "Figura para imitar: LÁPIS",
    exact: true,
  });
  const options = page.getByRole("group", {
    name: "Escolha entre três figuras",
  });
  await expect(model).toBeVisible();
  await expect(options.getByRole("button")).toHaveCount(3);
  await expect(model.locator("img")).toHaveJSProperty("naturalWidth", 100);
  await expect(
    options.getByRole("button", { name: "LÁPIS", exact: true }).locator("img"),
  ).toHaveAttribute(
    "src",
    (await model.locator("img").getAttribute("src")) as string,
  );
  const modelBox = await model.boundingBox();
  const optionsBox = await options.boundingBox();
  expect(optionsBox!.y).toBeGreaterThanOrEqual(modelBox!.y + modelBox!.height);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { testSpoken: string[] }).testSpoken.join(" "),
      ),
    )
    .toContain("LÁPIS. Repita comigo: LÁPIS.");
  const next = page.getByRole("button", { name: "Pratiquei esta palavra!" });
  await expect(next).toBeDisabled();
  await options.getByRole("button", { name: "LIVRO", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Vamos tentar de novo");
  await expect(next).toBeDisabled();
  await expect(next).toHaveCSS("background-color", "rgb(220, 38, 38)");
  await expect(model).toBeVisible();
  await options.getByRole("button", { name: "LÁPIS", exact: true }).click();
  await expect(next).toBeEnabled();
  await expect(next).toHaveCSS("background-color", "rgb(53, 184, 134)");
  await expect(
    options.getByRole("button", { name: "BOLA", exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: "/tmp/falabrinca-lapis.png", fullPage: true });
  await next.click();
  await expect(
    page.getByRole("img", { name: "Figura para imitar: BOLA", exact: true }),
  ).toBeVisible();
  await expect(
    options.getByRole("button", { name: "BOLA", exact: true }),
  ).toBeEnabled();
  await expect(next).toBeDisabled();
  await expect(next).not.toHaveClass(/retry-action/);
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

test("master grava áudio com MediaRecorder, confere prévia e salva na figura — armazenamento local simulado", async ({
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
  // The fixture Storage host is HTTP; production Storage URLs are HTTPS.
  await page.route("**/api/admin/audio", async (route) => {
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.url).toContain("activity-audio/words/");
    await route.fulfill({
      json: { url: "https://media.example.test/palavra.webm" },
    });
  });
  await page.route("https://media.example.test/**", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto("/admin/conteudo");
  await page
    .getByRole("button", { name: "+ Nova atividade", exact: true })
    .click();
  await page.getByLabel("Título do card").fill("Figuras com minha voz");
  const audio = page.getByRole("region", {
    name: "Áudio de GATO",
    exact: true,
  });
  await audio
    .getByRole("button", { name: "Gravar áudio", exact: true })
    .click();
  await expect(audio.getByRole("status")).toContainText("Gravando 1/20", {
    timeout: 10000,
  });
  await expect(
    page.getByRole("button", { name: "Salvar atividade", exact: true }),
  ).toBeDisabled();
  await audio
    .getByRole("button", { name: "Parar gravação", exact: true })
    .click();
  await expect(audio.getByLabel("Ouvir nova gravação de GATO")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.screenshot({
    path: "/tmp/falabrinca-gravar-audio.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await audio
    .getByRole("button", { name: "Usar este áudio", exact: true })
    .click();
  await expect(audio.getByLabel("Ouvir áudio salvo de GATO")).toHaveAttribute(
    "src",
    "https://media.example.test/palavra.webm",
  );
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  const row = page.locator(".admin-activity-list article").filter({
    has: page.getByRole("heading", {
      name: "Figuras com minha voz",
      exact: true,
    }),
  });
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(page.getByLabel("Ouvir áudio salvo de GATO")).toHaveAttribute(
    "src",
    "https://media.example.test/palavra.webm",
  );
  await page
    .getByRole("button", { name: "Remover áudio", exact: true })
    .click();
  await expect(page.getByLabel("Ouvir áudio salvo de GATO")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  const headers = {
    Authorization: "Bearer member-fixture",
    Origin: "http://localhost:3101",
  };
  expect((await request.post("/api/admin/audio", { headers })).status()).toBe(
    403,
  );
  expect(
    (
      await request.post("/api/admin/audio", {
        headers: {
          Authorization: "Bearer master-fixture",
          Origin: "https://estranho.example",
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/admin/audio", {
        headers: { ...headers, Authorization: "Bearer master-fixture" },
        multipart: {
          file: {
            name: "falso.webm",
            mimeType: "audio/webm",
            buffer: Buffer.from("isto nao e um audio"),
          },
        },
      })
    ).status(),
  ).toBe(400);
});

test("atividade inicia gravação automaticamente e narra a próxima figura sem botão ouvir", async ({
  page,
}) => {
  await paidApp(page);
  await page.addInitScript(() => {
    Object.assign(window, {
      testAudio: [] as string[],
      testSpoken: [] as string[],
    });
    HTMLMediaElement.prototype.play = function () {
      (window as unknown as { testAudio: string[] }).testAudio.push(this.src);
      return Promise.resolve();
    };
    window.speechSynthesis.speak = (u) => {
      (window as unknown as { testSpoken: string[] }).testSpoken.push(u.text);
    };
  });
  const withAudio = structuredClone(content[catalog[0].id]);
  const first = withAudio.rounds[0];
  first.choices.find((c) => c.name === first.answer)!.audio_url =
    "https://media.example.test/gravado.webm";
  await page.route(`**/api/activities/${catalog[0].id}`, (r) =>
    r.fulfill({ json: withAudio }),
  );
  const wav = Buffer.alloc(3244);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(3236, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(3200, 40);
  await page.route("https://media.example.test/**", (r) =>
    r.fulfill({ contentType: "audio/wav", body: wav }),
  );
  await page.goto("/atividades");
  await page
    .getByRole("button", { name: "Começar Atividade", exact: true })
    .click();
  await page.getByRole("button", { name: "Alimentos", exact: true }).click();
  await page
    .getByRole("button", { name: `Jogar ${catalog[0].title}`, exact: true })
    .click();
  await expect
    .poll(async () =>
      page.evaluate(
        () => (window as unknown as { testAudio: string[] }).testAudio,
      ),
    )
    .toContain("https://media.example.test/gravado.webm");
  expect(
    await page.evaluate(
      () => (window as unknown as { testSpoken: string[] }).testSpoken,
    ),
  ).toHaveLength(0);
  await page.getByRole("button", { name: first.answer, exact: true }).click();
  await page.getByRole("button", { name: "Pratiquei esta palavra!" }).click();
  expect(
    (
      await page.evaluate(
        () => (window as unknown as { testSpoken: string[] }).testSpoken,
      )
    ).join(" "),
  ).toContain(withAudio.rounds[1].answer);
});

test("cadastro oferece somente mensal e anual com renovação explícita", async ({
  page,
}) => {
  await authMock(page);
  await page.goto("/");
  await expect(page.getByRole("radio")).toHaveCount(2);
  await page.getByRole("radio", { name: /Anual com renovação/ }).check();
  await expect(page.locator(".plan-option.selected")).toContainText(
    "R$ 450,00",
  );
  await expect(page.locator(".plan-option.selected")).toContainText(
    "Renovação anual automática",
  );
  await expect(page.locator(".plan-options")).not.toContainText("R$ 500,00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("servidor limita a três dispositivos, permite desconectar e isola contas — banco local simulado", async ({
  playwright,
  request,
}) => {
  const contexts = await Promise.all(
    Array.from({ length: 4 }, () =>
      playwright.request.newContext({
        baseURL: "http://localhost:3101",
        extraHTTPHeaders: {
          Authorization: "Bearer member-fixture",
          Origin: "http://localhost:3101",
        },
      }),
    ),
  );
  try {
    for (let i = 0; i < 3; i++)
      expect((await contexts[i].post("/api/devices")).status()).toBe(200);
    expect((await contexts[3].post("/api/devices")).status()).toBe(409);
    const mine = await contexts[0].get("/api/devices");
    const devices = (await mine.json()).devices;
    expect(devices).toHaveLength(3);
    expect(devices.filter((d: { current: boolean }) => d.current)).toHaveLength(
      1,
    );
    const victim = devices.find((d: { current: boolean }) => d.current);
    expect(
      (
        await contexts[1].delete("/api/devices", { data: { id: victim.id } })
      ).status(),
    ).toBe(200);
    expect((await contexts[0].post("/api/devices")).status()).toBe(409);
    expect((await contexts[3].post("/api/devices")).status()).toBe(200);
    const owner = await request.get("/api/devices", {
      headers: { Authorization: "Bearer master-fixture" },
    });
    expect(
      (await owner.json()).devices.every(
        (d: { id: string }) =>
          !devices.some((old: { id: string }) => old.id === d.id),
      ),
    ).toBe(true);
    expect(
      (
        await request.get("/api/admin/customers", {
          headers: { Authorization: "Bearer member-fixture" },
        })
      ).status(),
    ).toBe(403);
  } finally {
    await Promise.all(contexts.map((c) => c.dispose()));
  }
});
test("master consulta clientes sem compra e simula receitas sem inflar recorrência", async ({
  page,
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
  await page.goto("/admin/clientes");
  await expect(
    page.getByRole("heading", { name: "Painel master", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".customer-list")).toContainText(
    "member@example.test",
  );
  await page
    .getByLabel("Situação", { exact: true })
    .selectOption("no_purchase");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page.locator(".customer-list")).toContainText(
    "Sem compra registrada",
  );
  await page
    .getByLabel("Novas assinaturas mensais", { exact: true })
    .fill("10");
  await page.getByLabel("Novas assinaturas anuais", { exact: true }).fill("2");
  await expect(page.locator(".sales-estimator")).toContainText("1.400,00");
  await expect(page.locator(".sales-estimator")).toContainText("575,00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/falabrinca-clientes-vendas.png",
    fullPage: true,
  });
});

async function masterBrowser(page: Page) {
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
}
for (const entry of ["/", "/conta?modo=login"])
  test(`entrada master abre dashboard por ${entry} e atalhos levam às áreas corretas`, async ({
    page,
  }) => {
    await masterBrowser(page);
    await page.goto(entry);
    await page.waitForURL("**/admin");
    await expect(
      page.getByRole("heading", { name: "Painel master", exact: true }),
    ).toBeVisible();
    const shortcuts = page.getByRole("navigation", {
      name: "Atalhos do painel master",
    });
    await expect(shortcuts.getByRole("link")).toHaveCount(5);
    await shortcuts.getByRole("link", { name: /Gestão de conteúdo/ }).click();
    await page.waitForURL("**/admin/conteudo");
    await expect(
      page.getByRole("heading", { name: "Seu conteúdo, do seu jeito." }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Dashboard master", exact: true })
      .click();
    await page.waitForURL("**/admin");
    await page
      .getByRole("navigation", { name: "Atalhos do painel master" })
      .getByRole("link", { name: /Área do usuário/ })
      .click();
    await page.waitForURL("**/atividades");
    await expect(
      page.getByRole("button", { name: "Começar Atividade", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Painel master · dashboard/ }).click();
    await page.waitForURL("**/admin");
  });
test("master pode gerenciar a conta sem ser redirecionado em ciclo", async ({
  page,
}) => {
  await masterBrowser(page);
  await page.goto("/conta?gerenciar=1");
  await expect(
    page.getByRole("heading", { name: "Acesso master liberado" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/conta\?gerenciar=1$/);
  await page.getByRole("link", { name: "Painel master", exact: true }).click();
  await page.waitForURL("**/admin");
});
test("sessão renova após rejeição de token e abre atividades sem pedir outro login", async ({
  page,
}) => {
  await paidApp(page);
  const fresh = jwt; // Provider fixture returns a valid renewed session.
  let refreshes = 0,
    attempts = 0;
  await page.route("http://127.0.0.1:5400/auth/v1/token**", async (route) => {
    refreshes++;
    await route.fulfill({ json: { ...session, access_token: fresh } });
  });
  await page.route("**/api/library", async (route) => {
    attempts++;
    if (attempts === 1)
      return route.fulfill({ status: 401, json: { error: "Token expired" } });
    await route.fulfill({ json: { activities: catalog, role: "subscriber" } });
  });
  await page.goto("/atividades");
  await expect(
    page.getByRole("button", { name: "Começar Atividade", exact: true }),
  ).toBeVisible();
  expect(attempts).toBe(2);
  expect(refreshes).toBe(1);
  expect(
    await page.evaluate(() => !!localStorage.getItem("sb-127-auth-token")),
  ).toBe(true);
});
test("falha temporária de validação retorna serviço indisponível e não sessão expirada", async ({
  request,
}) => {
  const response = await request.get("/api/library", {
    headers: { Authorization: "Bearer temporary-fixture" },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).error).not.toContain("sessão expirou");
});
test("sair da conta invalida somente a sessão do aparelho atual", async ({
  page,
}) => {
  await paidApp(page);
  let scope = "";
  await page.route("http://127.0.0.1:5400/auth/v1/logout**", async (route) => {
    scope = new URL(route.request().url()).searchParams.get("scope") ?? "";
    await route.fulfill({ json: {} });
  });
  await page.goto("/conta?gerenciar=1");
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Você saiu da conta");
  expect(scope).toBe("local");
});

test("retorno com token vencido renova a sessão persistida sem novo login", async ({
  page,
}) => {
  await authMock(page);
  let refreshed = 0;
  await page.addInitScript(
    (value) => localStorage.setItem("sb-127-auth-token", JSON.stringify(value)),
    { ...session, expires_at: Math.floor(Date.now() / 1000) - 60 },
  );
  await page.route("http://127.0.0.1:5400/auth/v1/token**", async (route) => {
    refreshed++;
    await route.fulfill({ json: session });
  });
  await page.route("**/api/library", (route) =>
    route.fulfill({ json: { activities: catalog, role: "subscriber" } }),
  );
  await page.goto("/atividades");
  await expect(
    page.getByRole("button", { name: "Começar Atividade", exact: true }),
  ).toBeVisible();
  expect(refreshed).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/atividades$/);
});
test("queda temporária mantém a sessão e permite tentar novamente sem entrar de novo", async ({
  page,
}) => {
  await paidApp(page);
  let calls = 0;
  await page.route("**/api/library", async (route) => {
    calls++;
    if (calls === 1)
      return route.fulfill({
        status: 503,
        json: {
          error: "Serviço temporariamente indisponível. Tente novamente.",
        },
      });
    await route.fulfill({ json: { activities: catalog, role: "subscriber" } });
  });
  await page.goto("/atividades");
  await expect(page.getByRole("status")).toContainText(
    "temporariamente indisponível",
  );
  await expect(page).toHaveURL(/\/atividades$/);
  expect(
    await page.evaluate(() => !!localStorage.getItem("sb-127-auth-token")),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Começar Atividade", exact: true }),
  ).toBeVisible();
});

test("quebra-cabeça funciona por arraste real de toque, aceita tentativas e forma quatro peças", async ({
  page,
}) => {
  await paidApp(page);
  await page.goto("/atividades");
  await expect(page.getByRole("button", { name: /Guiada/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Quebra-cabeças", exact: true })
    .click();
  await page.getByRole("button", { name: "Animais", exact: true }).click();
  const activity = catalog.find(
    (a) => a.kind === "puzzle" && a.category === "animals",
  )!;
  await page
    .getByRole("button", { name: `Jogar ${activity.title}`, exact: true })
    .click();
  await expect(page.locator(".puzzle-board")).toBeVisible();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  async function drag(piece: number, slot: number) {
    const source = page.locator(`[data-piece="${piece}"]`);
    await source.scrollIntoViewIfNeeded();
    const from = (await source.boundingBox())!;
    const to = (await page
      .locator(`[data-puzzle-slot="${slot}"]`)
      .boundingBox())!;
    const sx = from.x + from.width / 2,
      sy = from.y + from.height / 2,
      tx = to.x + to.width / 2,
      ty = to.y + to.height / 2;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: sx, y: sy }],
    });
    for (let step = 1; step <= 8; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: sx + ((tx - sx) * step) / 8, y: sy + ((ty - sy) * step) / 8 },
        ],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await drag(0, 1);
  await expect(page.locator(".puzzle-cell.filled")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Próxima descoberta", exact: true }),
  ).toBeDisabled();
  for (let piece = 0; piece < 4; piece++) {
    await drag(piece, piece);
    await expect(page.locator(".puzzle-cell.filled")).toHaveCount(piece + 1);
  }
  await page.screenshot({
    path: "/tmp/falabrinca-quebra-cabeca.png",
    fullPage: true,
  });
  await expect(page.locator(".puzzle-board")).toHaveClass(/completed/);
  await cdp.detach();
  await page
    .getByRole("button", { name: "Próxima descoberta", exact: true })
    .click();
  await expect(page.locator(".puzzle-cell.filled")).toHaveCount(0);
});
test("memória esconde pares diferentes e mantém os pares encontrados, sem leitura", async ({
  page,
}) => {
  await paidApp(page);
  await page.goto("/atividades");
  await page
    .getByRole("button", { name: "Jogos de memória", exact: true })
    .click();
  await page.getByRole("button", { name: "Alimentos", exact: true }).click();
  const activity = catalog.find(
    (a) => a.kind === "memory" && a.category === "foods",
  )!;
  await page
    .getByRole("button", { name: `Jogar ${activity.title}`, exact: true })
    .click();
  await expect(page.locator(".memory-card")).toHaveCount(6);
  await page.locator('[data-memory-pair="0"]').nth(0).click();
  await page.locator('[data-memory-pair="1"]').nth(0).click();
  await expect(page.locator(".memory-card.open")).toHaveCount(2);
  await expect(page.locator(".memory-card.matched")).toHaveCount(0);
  await expect(page.locator(".memory-card.open")).toHaveCount(0, {
    timeout: 5000,
  });
  await page.locator('[data-memory-pair="0"]').nth(0).click();
  await page.locator('[data-memory-pair="0"]').nth(1).click();
  await expect(page.locator(".memory-card.matched")).toHaveCount(2);
  await page.screenshot({
    path: "/tmp/falabrinca-memoria.png",
    fullPage: true,
  });
});
test("master cria quebra-cabeça e memória pelo editor e abre a prévia correta", async ({
  page,
}) => {
  await masterBrowser(page);
  await page.goto("/admin/conteudo");
  await page
    .getByRole("button", { name: "+ Nova atividade", exact: true })
    .click();
  await page.getByLabel("Título do card").fill("Quebra-cabeça do gato");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByLabel("Formato da atividade", { exact: true })
    .selectOption("puzzle");
  await expect(page.locator(".choice-editor")).toHaveCount(1);
  await page.getByRole("button", { name: "Ver prévia", exact: true }).click();
  await expect(page.locator(".admin-preview .puzzle-board")).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByLabel("Formato da atividade", { exact: true })
    .selectOption("memory");
  await expect(page.locator(".choice-editor")).toHaveCount(3);
  await page.getByRole("button", { name: "Ver prévia", exact: true }).click();
  await expect(page.locator(".admin-preview .memory-grid")).toBeVisible();
});

test("conta autorizada envia a compra de teste de R$ 5 sem alterar a oferta pública", async ({
  page,
}) => {
  await masterBrowser(page);
  await page.route("**/api/account", (route) =>
    route.fulfill({
      json: {
        active: true,
        status: "master",
        isMaster: true,
        canManage: false,
        testCheckoutEnabled: true,
        canTestPurchase: true,
      },
    }),
  );
  let sent: unknown = null;
  await page.route("**/api/checkout", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({
      status: 503,
      json: { error: "Checkout de teste interceptado" },
    });
  });
  await page.goto("/conta?gerenciar=1");
  await expect(
    page.getByRole("region", { name: "Compra privada de teste" }),
  ).toContainText("R$ 5,00/mês");
  await expect(page.locator(".plan-options")).toContainText("R$ 50,00");
  await expect(page.locator(".plan-options")).toContainText("R$ 450,00");
  await page
    .getByRole("button", { name: "Testar compra por R$ 5,00/mês", exact: true })
    .click();
  await expect(page.locator(".entry-feedback")).toContainText(
    "Checkout de teste interceptado",
  );
  expect(sent).toEqual({ plan: "monthly", testPurchase: true });
});
test("compra de teste não aparece para visitante nem para cliente comum", async ({
  page,
}) => {
  await authMock(page);
  await page.goto("/");
  await expect(
    page.getByRole("button", {
      name: "Testar compra por R$ 5,00/mês",
      exact: true,
    }),
  ).toHaveCount(0);
  await paidApp(page);
  await page.goto("/conta?gerenciar=1");
  await expect(
    page.getByRole("button", {
      name: "Testar compra por R$ 5,00/mês",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("dashboard master tem atalho de R$ 5 e mostra diagnóstico em vez de ocultar o teste", async ({
  page,
}) => {
  await masterBrowser(page);
  await page.goto("/admin");
  await page.getByRole("link", { name: /Teste de compra · R\$ 5/ }).click();
  await expect(page).toHaveURL(/\/conta\?gerenciar=1#teste-compra$/);
  const testCard = page.getByRole("region", {
    name: "Compra privada de teste",
  });
  await expect(testCard).toBeVisible();
  await expect(testCard).toContainText(
    "Esta implantação não recebeu STRIPE_TEST_PRICE_ID",
  );
  await expect(
    testCard.getByRole("button", {
      name: "Testar compra por R$ 5,00/mês",
      exact: true,
    }),
  ).toBeDisabled();
});
