"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserAuth } from "../../lib/supabase-browser";
import type { Adventure } from "../../lib/catalog";
import { authenticatedFetch, SessionExpiredError } from "../../lib/session";
import Library from "./library";
export default function ActivitiesPage() {
  const [data, setData] = useState<{
    activities: Adventure[];
    role: string;
  } | null>(null);
  const [error, setError] = useState("");
  async function load() {
    setError("");
    const auth = browserAuth();
    if (!auth) {
      setError("O acesso às contas ainda está sendo configurado.");
      return;
    }
    try {
      const device = await authenticatedFetch("/api/devices", {
        method: "POST",
      });
      if (device.status === 409) {
        window.location.replace("/dispositivos");
        return;
      }
      if (!device.ok) {
        const result = await device.json();
        throw new Error(result.error);
      }
      const response = await authenticatedFetch("/api/library");
      const result = await response.json();
      if (response.status === 401) {
        window.location.replace("/conta?modo=login");
        return;
      }
      if (response.status === 428) {
        window.location.replace("/dispositivos");
        return;
      }
      if (response.status === 403) {
        window.location.replace("/conta?assinatura=necessaria");
        return;
      }
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        window.location.replace("/conta?modo=login");
        return;
      }
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível verificar seu acesso. Confira sua conexão.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!data)
    return (
      <main className="auth-bridge">
        <Link className="brand" href="/">
          FalaBrinca
        </Link>
        <section className="account-card">
          <span className="bridge-icon">{error ? "🌿" : "🔒"}</span>
          <h1>
            {error ? "Vamos tentar de novo?" : "Preparando suas atividades…"}
          </h1>
          <p role="status">
            {error || "Estamos verificando sua conta e assinatura."}
          </p>
          {error && (
            <>
              <button className="primary" onClick={() => void load()}>
                Tentar novamente
              </button>
              <Link className="back" href="/conta">
                Ir para minha conta
              </Link>
            </>
          )}
        </section>
      </main>
    );
  return <Library activities={data.activities} role={data.role} />;
}
