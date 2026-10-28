"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { browserAuth } from "../../lib/supabase-browser";
import { PLAN } from "../../lib/plan";
import { type FamilyProfile } from "../../lib/profile";

type Account = {
  active: boolean;
  status: string;
  canManage: boolean;
  isMaster?: boolean;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: string;
};
const statuses: Record<string, string> = {
  master: "Acesso master",
  active: "Ativa",
  trialing: "Período de teste",
  past_due: "Pagamento pendente",
  unpaid: "Pagamento não concluído",
  canceled: "Cancelada",
  incomplete: "Pagamento em andamento",
  incomplete_expired: "Pagamento expirado",
  paused: "Pausada",
  none: "Sem assinatura",
};
export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [managing, setManaging] = useState(false);
  const [mode, setMode] = useState<"signup" | "login" | "reset">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [profileState, setProfileState] = useState<
    "loading" | "edit" | "ready" | "error"
  >("loading");
  const [guardian, setGuardian] = useState("");
  const [child, setChild] = useState("");
  const [consent, setConsent] = useState(false);
  async function token() {
    const auth = browserAuth();
    return auth
      ? (await auth.auth.getSession()).data.session?.access_token
      : null;
  }
  async function refresh() {
    const access = await token();
    if (!access) return;
    setLoadingAccount(true);
    try {
      const response = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAccount(data);
      return data;
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível consultar sua assinatura.",
      );
    } finally {
      setLoadingAccount(false);
    }
  }
  async function loadProfile() {
    const access = await token();
    if (!access) return;
    setProfileState("loading");
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProfile(data.profile);
      if (data.profile) {
        setGuardian(data.profile.guardian_name);
        setChild(data.profile.child_first_name);
        setProfileState("ready");
      } else setProfileState("edit");
    } catch (e) {
      setProfileState("error");
      setMessage(
        e instanceof Error ? e.message : "Não foi possível carregar o perfil.",
      );
    }
  }
  useEffect(() => {
    const auth = browserAuth();
    setConfigured(!!auth);
    if (!auth) {
      setReady(true);
      return;
    }
    let alive = true;
    let changed = false;
    const {
      data: { subscription },
    } = auth.auth.onAuthStateChange((_event, session) => {
      changed = true;
      if (alive) {
        setUser(session?.user ?? null);
        setReady(true);
        if (session) {
          setPending("");
          try {
            sessionStorage.removeItem("falabrinca-pending-email");
          } catch {}
        }
      }
    });
    void auth.auth
      .getUser()
      .then(({ data }) => {
        if (alive && !changed) {
          setUser(data.user);
          setReady(true);
        }
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    try {
      const stored = sessionStorage.getItem("falabrinca-pending-email");
      if (stored) {
        setPending(stored);
        setEmail(stored);
      }
    } catch {}
    const params = new URLSearchParams(window.location.search);
    setManaging(params.get("gerenciar") === "1");
    if (params.get("modo") === "login") setMode("login");
    if (params.has("assinatura"))
      setMessage(
        "Escolha a assinatura mensal para acessar a biblioteca de atividades.",
      );
    if (params.has("checkout"))
      setMessage(
        params.get("checkout") === "success"
          ? "Você voltou do pagamento. Estamos consultando sua assinatura."
          : "O checkout foi fechado. Você pode escolher a assinatura quando quiser.",
      );
    if (params.has("reenviar")) setMode("signup");
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (user) {
      setGuardian(
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.slice(0, 80)
          : "",
      );
      void refresh().then((result) => {
        if (!result?.isMaster) void loadProfile();
      });
    } else {
      setProfile(null);
      setAccount(null);
      setGuardian("");
      setChild("");
    }
  }, [user?.id]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const auth = browserAuth();
    if (!auth) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await auth.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/recuperar-senha`,
        });
        if (error) throw error;
        setMessage(
          "Se houver uma conta com esse e-mail, você receberá as instruções de recuperação.",
        );
      } else if (mode === "signup") {
        const { data, error } = await auth.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/continuar`,
          },
        });
        if (error) throw error;
        setPassword("");
        if (!data.session) {
          setPending(email.trim());
          setCooldown(60);
          try {
            sessionStorage.setItem("falabrinca-pending-email", email.trim());
          } catch {}
        } else setMessage("Acesso confirmado! Vamos conhecer sua família.");
      } else {
        const { error } = await auth.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setPassword("");
        setPending("");
        setMessage("Que bom ter você aqui!");
      }
    } catch {
      setMessage(
        mode === "login"
          ? "Não foi possível entrar. Confira e-mail, senha e a confirmação do cadastro."
          : "Não foi possível concluir agora. Confira os dados e tente novamente em alguns instantes.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    const auth = browserAuth();
    if (!auth) return;
    setBusy(true);
    setMessage("");
    const { error } = await auth.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/continuar`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setMessage(
        "Não foi possível abrir o Google. Você pode usar seu e-mail ou tentar novamente.",
      );
      setBusy(false);
    }
  }
  async function resend() {
    const auth = browserAuth();
    if (!auth || cooldown) return;
    setBusy(true);
    const { error } = await auth.auth.resend({
      type: "signup",
      email: pending || email,
      options: { emailRedirectTo: `${window.location.origin}/auth/continuar` },
    });
    setCooldown(60);
    setMessage(
      error
        ? "Não foi possível reenviar agora. Aguarde um minuto e tente novamente."
        : "Enviamos uma nova solicitação de confirmação. Use o link mais recente.",
    );
    setBusy(false);
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const access = await token();
      if (!access) throw new Error("Seu acesso expirou. Entre novamente.");
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guardian_name: guardian,
          child_first_name: child,
          consent,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProfile(data.profile);
      setProfileState("ready");
      setConsent(false);
      setMessage("Perfil salvo. Agora você pode confirmar sua assinatura.");
      requestAnimationFrame(() =>
        document
          .getElementById("assinar")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function billing(path: "checkout" | "portal") {
    setBusy(true);
    setMessage("");
    try {
      const access = await token();
      if (!access) throw new Error("Entre na conta para continuar.");
      const response = await fetch(`/api/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      });
      const data = await response.json();
      if (!response.ok || !data.url)
        throw new Error(data.error ?? "Pagamento indisponível.");
      window.location.assign(data.url);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível continuar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    const { error } = await browserAuth()!.auth.signOut();
    if (error) setMessage("Não foi possível sair. Tente novamente.");
    else {
      setUser(null);
      setProfile(null);
      setAccount(null);
      setPending("");
      setMessage("Você saiu da conta.");
    }
    setBusy(false);
  }
  async function deleteNames() {
    if (
      !window.confirm(
        "Apagar os nomes da família? Isso não cancela a assinatura nem apaga o progresso neste dispositivo.",
      )
    )
      return;
    setBusy(true);
    try {
      const access = await token();
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${access}` },
      });
      if (!response.ok) throw new Error();
      setProfile(null);
      setGuardian("");
      setChild("");
      setProfileState("edit");
      setMessage("Os nomes foram apagados.");
    } catch {
      setMessage("Não foi possível apagar os nomes. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (
      !managing &&
      user &&
      account?.active &&
      (account.isMaster || profileState === "ready")
    )
      window.location.replace("/atividades");
  }, [managing, user?.id, account?.active, account?.isMaster, profileState]);
  useEffect(() => {
    if (
      !user ||
      account?.active ||
      new URLSearchParams(window.location.search).get("checkout") !== "success"
    )
      return;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      void refresh();
      if (count >= 8) clearInterval(timer);
    }, 2000);
    return () => clearInterval(timer);
  }, [user?.id, account?.active]);
  return (
    <main className="auth-entry">
      <header className="auth-entry-brand">
        <span aria-hidden="true">🦋</span>
        <h1>
          Fala<span>Brinca</span>
        </h1>
        <p>Vamos praticar juntos! 🌈</p>
      </header>
      <div className="entry-steps" aria-label="Etapas de acesso">
        <span className={user ? "done" : "current"}>1 · Conta</span>
        <i>→</i>
        <span
          className={
            profileState === "ready" || account?.isMaster
              ? "done"
              : user
                ? "current"
                : ""
          }
        >
          2 · Perfil
        </span>
        <i>→</i>
        <span
          className={
            account?.active
              ? "done"
              : user && profileState === "ready"
                ? "current"
                : ""
          }
        >
          3 · Assinatura
        </span>
      </div>
      <div className="entry-grid">
        <section className="entry-form kids-card">
          {!ready ? (
            <p role="status">Preparando seu acesso…</p>
          ) : !configured ? (
            <div className="entry-unavailable">
              <h2>Cadastro em preparação</h2>
              <p>
                O serviço de contas ainda está sendo configurado. Tente
                novamente em alguns instantes.
              </p>
            </div>
          ) : user ? (
            <>
              <div className="signed-in">
                <span>✓ Conectado</span>
                <small>{user.email}</small>
              </div>
              {account?.isMaster ? (
                <div>
                  <h2>Acesso master liberado</h2>
                  <p>
                    Sua conta pode acessar o aplicativo e administrar o
                    conteúdo.
                  </p>
                  <Link
                    className="kids-action purple-action"
                    href="/atividades"
                  >
                    Abrir aplicativo →
                  </Link>
                  <Link className="kids-action outlined-action" href="/admin">
                    Painel master
                  </Link>
                </div>
              ) : profileState === "loading" ? (
                <p>Carregando seu perfil…</p>
              ) : profileState === "error" ? (
                <div>
                  <h2>Vamos tentar de novo?</h2>
                  <p>Não foi possível carregar os dados do perfil.</p>
                  <button
                    className="kids-action outlined-action"
                    onClick={() => void loadProfile()}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : profileState === "edit" ? (
                <>
                  <h2>Complete seu perfil ✨</h2>
                  <p className="entry-copy">
                    Seu acesso já está confirmado. Preencha os nomes e continue
                    para a assinatura.
                  </p>
                  <form className="account-form" onSubmit={saveProfile}>
                    <label>
                      Seu nome
                      <input
                        required
                        autoComplete="name"
                        minLength={2}
                        maxLength={80}
                        value={guardian}
                        onChange={(e) => setGuardian(e.target.value)}
                      />
                    </label>
                    <label>
                      Primeiro nome da criança
                      <input
                        required
                        autoComplete="off"
                        minLength={2}
                        maxLength={40}
                        value={child}
                        onChange={(e) => setChild(e.target.value)}
                      />
                      <small>
                        Usado apenas para personalizar as boas-vindas.
                      </small>
                    </label>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        required
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      Tenho mais de 18 anos e autorização legal para cadastrar o
                      primeiro nome da criança, conforme as{" "}
                      <Link href="/informacoes">
                        informações de privacidade
                      </Link>
                      .
                    </label>
                    <button
                      className="kids-action purple-action"
                      disabled={busy}
                    >
                      {busy ? "Salvando…" : "Continuar para assinatura →"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="entry-profile">
                  <h2>Olá, {profile?.guardian_name.split(" ")[0]}! 👋</h2>
                  <p>Perfil de {profile?.child_first_name} preparado.</p>
                  <button
                    className="entry-link"
                    onClick={() => {
                      setProfileState("edit");
                      setConsent(false);
                    }}
                  >
                    Editar perfil
                  </button>
                  {managing && (
                    <button
                      className="entry-link"
                      disabled={busy}
                      onClick={() => void deleteNames()}
                    >
                      Apagar os nomes cadastrados
                    </button>
                  )}
                </div>
              )}
              <section className="entry-membership">
                <h3>Sua assinatura</h3>
                <span className="status-badge">
                  {loadingAccount
                    ? "Consultando…"
                    : account
                      ? (statuses[account.status] ?? "Em análise")
                      : "Aguardando consulta"}
                </span>
                {account?.periodEnd && (
                  <p>
                    {account.cancelAtPeriodEnd
                      ? "Acesso até"
                      : "Fim do período atual"}
                    :{" "}
                    {new Date(account.periodEnd).toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                    .
                  </p>
                )}
                {account?.cancelAtPeriodEnd && (
                  <p>
                    A renovação foi cancelada. Você mantém acesso pelo período
                    pago.
                  </p>
                )}
                {!account?.active && (
                  <button
                    className="entry-link"
                    disabled={busy || loadingAccount}
                    onClick={() => void refresh()}
                  >
                    Atualizar status do pagamento
                  </button>
                )}
                {account?.active && managing && (
                  <Link
                    className="kids-action purple-action"
                    href="/atividades"
                  >
                    Voltar ao aplicativo →
                  </Link>
                )}
                {account?.canManage && (
                  <button
                    className="kids-action outlined-action"
                    disabled={busy}
                    onClick={() => void billing("portal")}
                  >
                    Gerenciar pagamento e cancelamento
                  </button>
                )}
              </section>
              <button
                className="entry-link muted-action"
                disabled={busy}
                onClick={() => void logout()}
              >
                Sair da conta
              </button>
            </>
          ) : pending ? (
            <div className="email-check">
              <span className="email-illustration">
                ✉️<b>✓</b>
              </span>
              <h2>
                Um convite chegou
                <br />
                no seu e-mail 💌
              </h2>
              <p>
                Confira a caixa de entrada de <strong>{pending}</strong>.
              </p>
              <ol>
                <li>
                  <b>1</b>
                  <span>
                    Abra a mensagem de confirmação. Veja também o spam ou lixo
                    eletrônico.
                  </span>
                </li>
                <li>
                  <b>2</b>
                  <span>
                    Toque no link <strong>Confirmar e-mail</strong> da mensagem
                    mais recente.
                  </span>
                </li>
                <li>
                  <b>3</b>
                  <span>
                    Você volta conectado, preenche seu nome e o primeiro nome da
                    criança e confirma a assinatura. Não precisa digitar a senha
                    novamente.
                  </span>
                </li>
              </ol>
              <button
                className="kids-action outlined-action"
                disabled={busy || cooldown > 0}
                onClick={() => void resend()}
              >
                {cooldown ? `Reenviar em ${cooldown}s` : "Reenviar confirmação"}
              </button>
              <button
                className="entry-link"
                onClick={() => {
                  setPending("");
                  setMode("login");
                  try {
                    sessionStorage.removeItem("falabrinca-pending-email");
                  } catch {}
                }}
              >
                Usar outro e-mail ou entrar
              </button>
            </div>
          ) : (
            <>
              <div
                className="auth-tabs"
                role="group"
                aria-label="Tipo de acesso"
              >
                <button
                  className={mode === "signup" ? "active" : ""}
                  onClick={() => {
                    setMode("signup");
                    setMessage("");
                  }}
                >
                  Criar conta
                </button>
                <button
                  className={mode === "login" ? "active" : ""}
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                >
                  Já tenho conta
                </button>
              </div>
              <h2>
                {mode === "signup"
                  ? "Comece sua jornada ✨"
                  : mode === "login"
                    ? "Bom ter você de volta!"
                    : "Recupere seu acesso"}
              </h2>
              <p className="entry-copy">
                {mode === "signup"
                  ? "Cadastre-se e escolha seu plano para começar."
                  : mode === "login"
                    ? "Entre para continuar de onde parou."
                    : "Enviaremos um link para criar uma nova senha."}
              </p>
              {mode !== "reset" && (
                <>
                  <button
                    className="google-button"
                    disabled={busy}
                    onClick={() => void google()}
                  >
                    <span className="google-letter" aria-hidden="true">
                      G
                    </span>
                    Continuar com Google
                  </button>
                  <div className="auth-divider">
                    <span>ou use seu e-mail</span>
                  </div>
                </>
              )}
              <form className="account-form" onSubmit={submit}>
                <label>
                  E-mail
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                  />
                </label>
                {mode !== "reset" && (
                  <label>
                    Senha
                    {mode === "signup" && (
                      <small>Pelo menos 8 caracteres.</small>
                    )}
                    <div className="password-field">
                      <input
                        aria-label="Senha"
                        required
                        type={showPassword ? "text" : "password"}
                        minLength={mode === "signup" ? 8 : 1}
                        maxLength={128}
                        autoComplete={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? "◉" : "◎"}
                      </button>
                    </div>
                  </label>
                )}
                {mode === "signup" && (
                  <label className="checkbox">
                    <input type="checkbox" required />
                    Tenho mais de 18 anos e li as{" "}
                    <Link href="/informacoes">
                      informações de uso, privacidade e assinatura
                    </Link>
                    .
                  </label>
                )}
                <button className="kids-action purple-action" disabled={busy}>
                  {busy
                    ? "Aguarde…"
                    : mode === "signup"
                      ? "Criar minha conta"
                      : mode === "login"
                        ? "Entrar"
                        : "Enviar instruções"}
                </button>
              </form>
              {mode === "login" && (
                <button
                  className="entry-link"
                  onClick={() => {
                    setMode("reset");
                    setMessage("");
                  }}
                >
                  Esqueci minha senha
                </button>
              )}
            </>
          )}
          <div className="entry-feedback" role="status" aria-live="polite">
            {message}
          </div>
        </section>
        <aside className="entry-plan kids-card" id="assinar">
          <span className="entry-plan-label">ASSINATURA MENSAL</span>
          <h2>Um mundo para descobrir 🌈</h2>
          <div className="price">
            {PLAN.label}
            <span>/mês</span>
          </div>
          <ul>
            <li>Atividades visuais com áudio e repetição.</li>
            <li>Oito categorias para explorar.</li>
            <li>Progresso, metas e recompensas.</li>
            <li>Painel dos pais e prática guiada.</li>
          </ul>
          <p>
            Renovação automática até cancelar. O acesso continua até o fim do
            período pago ao cancelar a renovação.
          </p>
          <button
            className="kids-action purple-action"
            disabled={
              !ready ||
              !configured ||
              !user ||
              busy ||
              loadingAccount ||
              !account ||
              account.active ||
              profileState !== "ready" ||
              !["none", "canceled", "incomplete_expired"].includes(
                account.status,
              )
            }
            onClick={() => void billing("checkout")}
          >
            {account?.isMaster
              ? "Acesso master liberado"
              : account?.active
                ? "Sua assinatura está ativa"
                : !user
                  ? "Crie sua conta ou entre para assinar"
                  : "Assinar por R$ 50,00/mês"}
          </button>
          <small>
            Você confirma o pagamento no checkout seguro do Stripe. Criar uma
            conta, por si só, não gera cobrança.
          </small>
          <Link className="entry-link" href="/informacoes">
            Uso e privacidade
          </Link>
        </aside>
      </div>
      <p className="entry-disclaimer">
        Recurso educativo. Não substitui avaliação ou terapia fonoaudiológica.
      </p>
    </main>
  );
}
