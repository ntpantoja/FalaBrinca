"use client";
import Link from "next/link";
import { authenticatedFetch, SessionExpiredError } from "../../lib/session";
import { useEffect, useState } from "react";
type Device = { id: string; label: string; current: boolean; lastSeen: string };
export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  async function api(method = "GET", id?: string) {
    let response: Response;
    try {
      response = await authenticatedFetch(
        `/api/devices${method === "POST" ? "?reactivate=1" : ""}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: id ? JSON.stringify({ id }) : undefined,
        },
      );
    } catch (error) {
      if (error instanceof SessionExpiredError)
        window.location.replace("/conta?modo=login");
      throw error;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }
  async function load() {
    try {
      const data = await api();
      setDevices(data.devices);
      setReady(true);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Falha ao consultar dispositivos.",
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function disconnect(device: Device) {
    if (
      !confirm(
        `Desconectar ${device.label}? Esse aparelho precisará ser ativado novamente para abrir atividades.`,
      )
    )
      return;
    setBusy(true);
    try {
      await api("DELETE", device.id);
      await load();
      setMessage("Dispositivo desconectado. A vaga está disponível.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao desconectar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function activate() {
    setBusy(true);
    setMessage("");
    try {
      await api("POST");
      window.location.assign("/atividades");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao ativar.");
      setBusy(false);
    }
  }
  return (
    <main className="commercial-page">
      <Link className="brand" href="/">
        FalaBrinca
      </Link>
      <section className="kids-card">
        <h1>Seus dispositivos</h1>
        <p>
          Até três dispositivos por conta. Cada navegador ou perfil de navegador
          conta como um dispositivo. Para usar um quarto, desconecte um dos
          anteriores.
        </p>
        <p>
          Limpar os dados do navegador pode criar um novo dispositivo; você pode
          liberar a vaga antiga aqui.
        </p>
        <p role="status">{message}</p>
        {ready && <p>{devices.length} de 3 vagas ocupadas</p>}
        <div className="device-list">
          {devices.map((d) => (
            <article key={d.id}>
              <div>
                <strong>
                  {d.label}
                  {d.current ? " · Este dispositivo" : ""}
                </strong>
                <p>
                  Último uso:{" "}
                  {new Date(d.lastSeen).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </p>
              </div>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void disconnect(d)}
              >
                Desconectar
              </button>
            </article>
          ))}
        </div>
        <button
          className="primary"
          disabled={busy || !ready}
          onClick={() => void activate()}
        >
          {busy ? "Aguarde…" : "Ativar este dispositivo e continuar"}
        </button>
        <p>
          <Link href="/conta?gerenciar=1">Voltar à minha conta</Link>
        </p>
      </section>
    </main>
  );
}
