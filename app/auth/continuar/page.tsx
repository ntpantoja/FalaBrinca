"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserAuth } from "../../../lib/supabase-browser";
export default function ContinueAuth() {
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function finish() {
      const auth = browserAuth();
      if (!auth) {
        setError("O serviço de contas ainda não está configurado.");
        return;
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.slice(1));
        if (params.get("error") || hash.get("error"))
          throw new Error(
            "Esse link não pôde ser confirmado. Ele pode ter expirado ou já ter sido usado.",
          );
        const code = params.get("code");
        const token = params.get("token_hash");
        if (code) {
          // O SDK também pode consumir automaticamente o código ao inicializar.
          const initialized = await auth.auth.getSession();
          if (!initialized.data.session) {
            const { error } = await auth.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
        } else if (token) {
          const { error } = await auth.auth.verifyOtp({
            token_hash: token,
            type: "email",
          });
          if (error) throw error;
        }
        const {
          data: { session },
        } = await auth.auth.getSession();
        if (!session)
          throw new Error(
            "Abra o link de confirmação mais recente enviado ao seu e-mail.",
          );
        const { data, error } = await auth.auth.getUser();
        if (error || !data.user)
          throw new Error(
            "Não foi possível validar seu acesso. Solicite um novo link.",
          );
        if (!cancelled) window.location.replace("/conta?completar=1");
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error && e.message.startsWith("Abra")
              ? e.message
              : "O link expirou ou não pôde ser confirmado. Volte ao cadastro para reenviar o e-mail.",
          );
      }
    }
    void finish();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <main className="auth-bridge">
      <div className="brand">FalaBrinca</div>
      <div className="account-card">
        <span className="bridge-icon">{error ? "✉️" : "🌱"}</span>
        <h1>{error ? "Vamos tentar de novo?" : "Preparando seu cantinho…"}</h1>
        <p role="status">
          {error ||
            "Estamos confirmando seu acesso. Em seguida, você vai preencher os nomes da família, sem precisar entrar novamente."}
        </p>
        {error && (
          <Link className="primary" href="/conta?reenviar=1">
            Reenviar confirmação ou entrar →
          </Link>
        )}
      </div>
    </main>
  );
}
