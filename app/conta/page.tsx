"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { browserAuth } from "../../lib/supabase-browser";
import { PLAN } from "../../lib/plan";
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
  const [mode, setMode] = useState<"login" | "signup" | "reset">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  async function refresh() {
    const auth = browserAuth();
    if (!auth) return;
    const {
      data: { session },
    } = await auth.auth.getSession();
    if (!session) return;
    setLoadingAccount(true);
    try {
      const response = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAccount(data);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar a assinatura.",
      );
    } finally {
      setLoadingAccount(false);
    }
  }
  useEffect(() => {
    const auth = browserAuth();
    setConfigured(!!auth);
    if (!auth) {
      setReady(true);
      return;
    }
    auth.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const {
      data: { subscription },
    } = auth.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccount(null);
    });
    const result = new URLSearchParams(window.location.search).get("checkout");
    if (result)
      setMessage(
        result === "success"
          ? "Você voltou do pagamento. Atualize o status para confirmar sua assinatura."
          : "Pagamento cancelado. Nenhuma nova assinatura foi confirmada aqui.",
      );
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) void refresh();
  }, [user]); // Status sempre conferido no servidor.
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
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/conta` },
        });
        if (error) throw error;
        setPassword("");
        setMessage(
          data.session
            ? "Conta criada. Você já pode consultar a assinatura."
            : "Confira seu e-mail e confirme o cadastro. Depois volte aqui para entrar.",
        );
      } else {
        const { error } = await auth.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setPassword("");
        setMessage("Você entrou na sua conta.");
      }
    } catch {
      setMessage(
        mode === "login"
          ? "Não foi possível entrar. Confira o e-mail, a senha e a confirmação de cadastro."
          : "Não foi possível concluir. Confira os dados ou tente novamente mais tarde.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function billing(path: "checkout" | "portal") {
    const auth = browserAuth();
    if (!auth) return;
    setBusy(true);
    setMessage("");
    try {
      const {
        data: { session },
      } = await auth.auth.getSession();
      if (!session) throw new Error("Entre na sua conta para continuar.");
      const response = await fetch(`/api/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
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
      setAccount(null);
      setMessage("Você saiu da conta.");
    }
    setBusy(false);
  }
  return (
    <>
      <header>
        <Link className="brand" href="/">
          🦕 FalaBrinca
        </Link>
        <Link className="adult-link" href="/">
          Voltar às brincadeiras
        </Link>
      </header>
      <main className="account-page">
        <span className="eyebrow">ESPAÇO DOS RESPONSÁVEIS</span>
        <h1>
          Mais descobertas.
          <br />
          <em>Juntos, todo mês.</em>
        </h1>
        <p>
          Crie uma conta de adulto para acompanhar sua assinatura. A primeira
          trilha continua gratuita, sem cadastro.
        </p>
        <div className="account-grid">
          <section className="account-card">
            <h2>
              {user
                ? "Minha conta"
                : mode === "signup"
                  ? "Crie sua conta"
                  : mode === "reset"
                    ? "Recupere sua senha"
                    : "Bem-vindo de volta"}
            </h2>
            {!ready ? (
              <p role="status">Carregando sua conta…</p>
            ) : !configured ? (
              <div className="notice">
                <strong>Cadastro em preparação</strong>
                <p>
                  A atividade gratuita já funciona. O cadastro será liberado
                  assim que o serviço de contas estiver configurado.
                </p>
                <Link className="back" href="/">
                  Experimentar gratuitamente
                </Link>
              </div>
            ) : user ? (
              <>
                <p className="account-email">{user.email}</p>
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
                    A renovação está cancelada. Você mantém acesso até o fim do
                    período já pago.
                  </p>
                )}
                {account?.active && (
                  <Link className="primary" href="/?aventura=premium">
                    Explorar a trilha de assinantes →
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
                <button
                  className="back"
                  disabled={busy}
                  onClick={() => void logout()}
                >
                  Sair da conta
                </button>
              </>
            ) : (
              <>
                <form className="account-form" onSubmit={submit}>
                  <label>
                    E-mail do responsável
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                    />
                  </label>
                  {mode !== "reset" && (
                    <label>
                      Senha
                      {mode === "signup" && (
                        <small>Use pelo menos 8 caracteres.</small>
                      )}
                      <input
                        type="password"
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
                    </label>
                  )}
                  {mode === "signup" && (
                    <label className="checkbox">
                      <input type="checkbox" required />
                      Sou maior de 18 anos e li as{" "}
                      <Link href="/informacoes">
                        informações de uso, privacidade e assinatura
                      </Link>
                      .
                    </label>
                  )}
                  <button className="primary" disabled={busy} type="submit">
                    {busy
                      ? "Aguarde…"
                      : mode === "signup"
                        ? "Criar conta gratuita"
                        : mode === "reset"
                          ? "Enviar instruções"
                          : "Entrar"}
                  </button>
                </form>
                <div className="auth-links">
                  <button
                    className="back"
                    disabled={busy}
                    onClick={() => {
                      setMode(mode === "signup" ? "login" : "signup");
                      setMessage("");
                    }}
                  >
                    {mode === "signup"
                      ? "Já tenho conta → Entrar"
                      : "Quero criar uma conta"}
                  </button>
                  {mode === "login" && (
                    <button
                      className="back"
                      disabled={busy}
                      onClick={() => {
                        setMode("reset");
                        setMessage("");
                      }}
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
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
          <section className="account-card plan-card">
            <span className="pill">PLANO MENSAL</span>
            <h2>{PLAN.name}</h2>
            <div className="price">
              {PLAN.label}
              <span>/mês</span>
            </div>
            <p>
              Uma assinatura para o responsável acompanhar novas palavras com a
              criança.
            </p>
            <ul className="benefits">
              <li>Três atividades gratuitas: figuras, associação e frases.</li>
              <li>Trilha de assinantes com seis figuras extras.</li>
              <li>Estrelas e conquistas no dispositivo.</li>
              <li>Gerenciamento e cancelamento pelo portal seguro.</li>
            </ul>
            <p className="renewal">
              Cobrança recorrente de R$ 50,00 a cada mês, até cancelar. Cancele
              pelo portal para impedir a próxima renovação; o acesso continua
              até o fim do período pago.
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
              Você conferirá a cobrança e os métodos disponíveis no checkout do
              Stripe antes de confirmar. Criar conta é gratuito e não gera
              cobrança.
            </small>
          </section>
        </div>
        <aside className="parent-note">
          <span>🌿</span>
          <div>
            <strong>Estímulo educativo, com acompanhamento de um adulto</strong>
            <p>
              O FalaBrinca não avalia a fala e não substitui terapia
              fonoaudiológica. Não coletamos nome, idade ou gravações da
              criança.
            </p>
          </div>
        </aside>
        <Link className="back" href="/informacoes">
          Uso, privacidade e assinatura
        </Link>
      </main>
    </>
  );
}
