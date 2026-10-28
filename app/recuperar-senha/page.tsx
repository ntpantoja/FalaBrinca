"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { browserAuth } from "../../lib/supabase-browser";
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("As senhas precisam ser iguais.");
      return;
    }
    const auth = browserAuth();
    if (!auth) {
      setMessage("Recuperação de senha ainda não disponível.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: sessionError } = await auth.auth.getUser();
      if (sessionError || !data.user)
        throw new Error(
          "Abra o link mais recente enviado ao seu e-mail ou solicite outra recuperação.",
        );
      const { error } = await auth.auth.updateUser({ password });
      if (error)
        throw new Error(
          "Não foi possível atualizar a senha. Solicite um novo link de recuperação.",
        );
      setPassword("");
      setConfirmation("");
      setMessage("Senha atualizada. Você pode acessar sua conta.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível atualizar a senha.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="account-page">
      <Link className="brand" href="/">
        FalaBrinca
      </Link>
      <section className="account-card">
        <h1>Nova senha</h1>
        <p>Abra esta página pelo link recebido no seu e-mail.</p>
        <form className="account-form" onSubmit={submit}>
          <label>
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Repita a nova senha
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
        <p role="status">{message}</p>
        <Link className="back" href="/conta">
          Ir para minha conta
        </Link>
      </section>
    </main>
  );
}
