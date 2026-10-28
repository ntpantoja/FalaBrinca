"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { browserAuth } from "../../lib/supabase-browser";
import { PLAN } from "../../lib/plan";
import { type FamilyProfile } from "../../lib/profile";
import { DinoScene } from "../../components/dino-scene";
type Account = {
  active: boolean;
  status: string;
  canManage: boolean;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: string;
};
const statuses: Record<string, string> = {
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
    if (params.has("checkout"))
      setMessage(
        params.get("checkout") === "success"
          ? "Você voltou do pagamento. Estamos consultando sua assinatura."
          : "O checkout foi fechado. Você pode continuar com as atividades gratuitas.",
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
      void loadProfile();
      void refresh();
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
      setMessage("Tudo pronto! O cantinho da família está preparado.");
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
  return (
    <>
      <header className="family-header">
        <Link className="brand" href="/">
          🦕 Fala<span className="brand-light">Brinca</span>
        </Link>
        <Link className="adult-link" href="/">
          ← Voltar às brincadeiras
        </Link>
      </header>
      <main className="family-main">
        <div className="family-intro">
          <span className="eyebrow">UM CANTINHO PARA QUEM CUIDA</span>
          <h1>
            {user && profile
              ? `Olá, ${profile.guardian_name.split(" ")[0]}!`
              : "Pequenas descobertas.\nGrandes conexões."}
          </h1>
          <p>
            {user
              ? "Acompanhe sua família e sua assinatura, sem complicação."
              : "Crie seu acesso e venha explorar com a criança. Uma experiência visual, lúdica e sem cobrança por desempenho."}
          </p>
        </div>
        <div className="family-grid">
          <section className="account-card auth-card">
            {!ready ? (
              <p role="status">Preparando seu cantinho…</p>
            ) : !configured ? (
              <div className="notice">
                <span>🌱</span>
                <h2>Cadastro em preparação</h2>
                <p>
                  Enquanto preparamos o serviço de contas, vocês já podem
                  experimentar as atividades gratuitas.
                </p>
                <Link className="primary" href="/">
                  Experimentar gratuitamente →
                </Link>
              </div>
            ) : user ? (
              <>
                <div className="account-identity">
                  <span className="profile-avatar">
                    {profile?.guardian_name?.[0] || "🌿"}
                  </span>
                  <div>
                    <span className="eyebrow">MINHA FAMÍLIA</span>
                    <p className="account-email">{user.email}</p>
                  </div>
                </div>
                {profileState === "loading" ? (
                  <p>Carregando os dados da família…</p>
                ) : profileState === "error" ? (
                  <div className="notice">
                    <p>
                      Não foi possível carregar o perfil. Seu acesso à conta
                      está confirmado.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => void loadProfile()}
                    >
                      Tentar carregar novamente
                    </button>
                  </div>
                ) : profileState === "edit" ? (
                  <>
                    <div className="onboarding-steps">
                      <span className="done">✓ Acesso confirmado</span>
                      <span>2 · Sua família</span>
                    </div>
                    <h2>
                      {profile ? "Editar os nomes" : "Vamos conhecer vocês?"}
                    </h2>
                    <p className="form-intro">
                      Você já está conectado. Só falta dizer como podemos chamar
                      vocês nas boas-vindas.
                    </p>
                    <form className="account-form" onSubmit={saveProfile}>
                      <label>
                        Nome do responsável
                        <input
                          value={guardian}
                          onChange={(e) => setGuardian(e.target.value)}
                          minLength={2}
                          maxLength={80}
                          autoComplete="name"
                          required
                          placeholder="Como você gostaria de ser chamado?"
                        />
                      </label>
                      <label>
                        Primeiro nome da criança
                        <input
                          value={child}
                          onChange={(e) => setChild(e.target.value)}
                          minLength={2}
                          maxLength={40}
                          autoComplete="off"
                          required
                          placeholder="Só o primeiro nome, sem sobrenome"
                        />
                        <small>
                          Usado para personalizar as boas-vindas. Não pedimos
                          foto, data de nascimento ou gravação de voz.
                        </small>
                      </label>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          required
                        />
                        Sou responsável legal pela criança, tenho mais de 18
                        anos e autorizo o uso desses nomes para personalização,
                        conforme as{" "}
                        <Link href="/informacoes">
                          informações de privacidade
                        </Link>
                        .
                      </label>
                      <button className="primary" disabled={busy}>
                        {busy ? "Preparando…" : "Salvar e começar a explorar →"}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="family-profile">
                    <h2>O cantinho de {profile?.child_first_name} 🦕</h2>
                    <p>
                      Responsável: <strong>{profile?.guardian_name}</strong>
                    </p>
                    <Link className="primary" href="/">
                      Vamos brincar →
                    </Link>
                    <button
                      className="icon-text"
                      onClick={() => {
                        setProfileState("edit");
                        setConsent(false);
                      }}
                    >
                      ✎ Editar nomes da família
                    </button>
                    <button
                      className="back muted-action"
                      disabled={busy}
                      onClick={() => void deleteNames()}
                    >
                      Apagar os nomes cadastrados
                    </button>
                  </div>
                )}
                <div className="membership-panel">
                  <span className="eyebrow">SUA ASSINATURA</span>
                  <div className="status-badge">
                    {loadingAccount
                      ? "Consultando…"
                      : account
                        ? (statuses[account.status] ?? "Em análise")
                        : "Status ainda não consultado"}
                  </div>
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
                      A renovação está cancelada. Você mantém o acesso até o fim
                      do período pago.
                    </p>
                  )}
                  {account?.active && (
                    <Link className="secondary" href="/?aventura=premium">
                      Explorar todas as atividades →
                    </Link>
                  )}
                  <button
                    className="secondary"
                    disabled={busy || loadingAccount}
                    onClick={() => void refresh()}
                  >
                    Atualizar status
                  </button>
                  {account?.canManage && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => void billing("portal")}
                    >
                      Gerenciar assinatura e cancelamento
                    </button>
                  )}
                </div>
                <button
                  className="back"
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
                <span className="eyebrow">FALTA SÓ CONFIRMAR SEU ACESSO</span>
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
                      Procure a mensagem de confirmação do FalaBrinca. Veja
                      também o spam ou lixo eletrônico.
                    </span>
                  </li>
                  <li>
                    <b>2</b>
                    <span>
                      Toque no link <strong>Confirmar e-mail</strong> da
                      mensagem mais recente.
                    </span>
                  </li>
                  <li>
                    <b>3</b>
                    <span>
                      Você volta conectado e preenche{" "}
                      <strong>seu nome e o primeiro nome da criança</strong>.
                      Não precisa digitar a senha outra vez.
                    </span>
                  </li>
                </ol>
                <button
                  className="secondary"
                  disabled={busy || cooldown > 0}
                  onClick={() => void resend()}
                >
                  {cooldown
                    ? `Reenviar em ${cooldown}s`
                    : "Reenviar confirmação"}
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    const { data } = await browserAuth()!.auth.getUser();
                    if (data.user) {
                      setUser(data.user);
                      setPending("");
                    } else
                      setMessage(
                        "Abra o link no seu e-mail. O acesso será confirmado no navegador em que você abrir a mensagem.",
                      );
                  }}
                >
                  Já cliquei no link
                </button>
                <button
                  className="back"
                  onClick={() => {
                    setPending("");
                    setMode("login");
                    try {
                      sessionStorage.removeItem("falabrinca-pending-email");
                    } catch {}
                  }}
                >
                  Usar outro e-mail ou entrar em uma conta existente
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
                    ? "Sua família é bem-vinda."
                    : mode === "reset"
                      ? "Vamos recuperar seu acesso."
                      : "Que bom ter você de volta."}
                </h2>
                <p className="form-intro">
                  {mode === "signup"
                    ? "A conta é do adulto. Criar seu acesso é gratuito."
                    : mode === "reset"
                      ? "Enviaremos um link para você escolher uma nova senha."
                      : "Entre e continue de onde sua família parou."}
                </p>
                {mode !== "reset" && (
                  <>
                    <button
                      className="google-button"
                      disabled={busy}
                      onClick={() => void google()}
                    >
                      <svg
                        viewBox="0 0 48 48"
                        width="22"
                        height="22"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285f4"
                          d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.5 9.5 0 01-4.1 6.3v5.2h6.7c3.9-3.6 6-8.8 6-15.2"
                        />
                        <path
                          fill="#34a853"
                          d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20.4 20.4 0 0024 44"
                        />
                        <path
                          fill="#fbbc05"
                          d="M12.8 27.6a12 12 0 010-7.2v-5.3H5.9a20 20 0 000 17.8z"
                        />
                        <path
                          fill="#ea4335"
                          d="M24 12.2c3 0 5.5 1 7.5 2.9l5.7-5.7A19.6 19.6 0 0024 4a20.4 20.4 0 00-18.1 11.1l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2"
                        />
                      </svg>
                      Continuar com Google
                    </button>
                    <div className="auth-divider">
                      <span>ou use seu e-mail</span>
                    </div>
                  </>
                )}
                <form className="account-form" onSubmit={submit}>
                  <label>
                    E-mail do responsável
                    <input
                      type="email"
                      autoComplete="email"
                      required
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
                          type={showPassword ? "text" : "password"}
                          required
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
                          onClick={() => setShowPassword((value) => !value)}
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
                  <button className="primary" disabled={busy}>
                    {busy
                      ? "Aguarde…"
                      : mode === "signup"
                        ? "Criar conta gratuita"
                        : mode === "login"
                          ? "Entrar"
                          : "Enviar instruções"}
                  </button>
                </form>
                {mode === "login" && (
                  <button
                    className="back"
                    onClick={() => {
                      setMode("reset");
                      setMessage("");
                    }}
                  >
                    Esqueci minha senha
                  </button>
                )}
                <small className="auth-privacy">
                  O acesso com Google usa a conta do responsável. O primeiro
                  nome da criança será informado depois, com sua autorização.
                </small>
              </>
            )}
            <div
              className="feedback account-feedback"
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          </section>
          <aside className="family-aside">
            <div className="family-art">
              <DinoScene />
              <span>Explorar é mais gostoso juntos. ♡</span>
            </div>
            <section className="account-card plan-card">
              <span className="pill">EXPLORADORES DO DINO</span>
              <h2>Um mundo de descobertas.</h2>
              <div className="price">
                {PLAN.label}
                <span>/mês</span>
              </div>
              <ul className="benefits">
                <li>
                  <b>24 atividades visuais</b>, com 72 rodadas.
                </li>
                <li>Figuras, associações e histórias em imagens.</li>
                <li>Instruções faladas: não precisa saber ler.</li>
                <li>
                  Favoritos, estrelas e jardim de conquistas no dispositivo.
                </li>
                <li>Gerenciamento e cancelamento pelo portal seguro.</li>
              </ul>
              <p className="renewal">
                Três atividades gratuitas para experimentar. O plano libera as
                outras 21. Cobrança recorrente de R$ 50,00 por mês até cancelar;
                ao cancelar a renovação, o acesso continua até o fim do período
                pago.
              </p>
              <button
                className="primary"
                disabled={
                  !ready ||
                  !configured ||
                  !user ||
                  busy ||
                  loadingAccount ||
                  !account ||
                  account.active ||
                  !["none", "canceled", "incomplete_expired"].includes(
                    account.status,
                  )
                }
                onClick={() => void billing("checkout")}
              >
                {account?.active
                  ? "Sua assinatura está ativa"
                  : !user
                    ? "Entre ou crie sua conta para assinar"
                    : "Assinar por R$ 50,00/mês"}
              </button>
              <small>
                Criar conta não gera cobrança. Você confirma a compra no
                checkout seguro do Stripe.
              </small>
            </section>
            <p className="family-disclaimer">
              🌿 Um recurso educativo para explorar junto. Não substitui
              avaliação ou terapia fonoaudiológica.
            </p>
          </aside>
        </div>
        <Link className="back" href="/informacoes">
          Uso, privacidade e assinatura
        </Link>
      </main>
    </>
  );
}
