"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { browserAuth } from "../../../lib/supabase-browser";
import { PLANS, type PlanId } from "../../../lib/plan";
import { estimateSales } from "../../../lib/commercial";
const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "—";
type Customer = {
  id: string;
  email: string;
  guardian_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  last_seen_at?: string;
  tracked_logins: number;
  devices: number;
  plan?: PlanId;
  active: boolean;
  buyer: boolean;
  status: string;
  pass_end?: string;
  period_end?: number;
  cancel_at_period_end: boolean;
};
type Metrics = {
  registered: number;
  loggedIn: number;
  buyers: number;
  withoutPurchase: number;
  active: number;
  monthly: number;
  annual: number;
  yearlyPass: number;
  mrrCents: number;
  passMonthlyEquivalentCents: number;
  grossCents: number;
  refundedCents: number;
  netBeforeFeesCents: number;
  firstRecordedPayment?: string;
};
type Dashboard = {
  customers: Customer[];
  metrics: Metrics;
  total: number;
  pageSize: number;
  generatedAt: string;
};
export default function CustomersPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [scenario, setScenario] = useState({
    monthly: 10,
    annual: 5,
    fixed: 0,
    fees: 0,
    perAccount: 0,
  });
  async function load(requestedPage = page) {
    setBusy(true);
    setMessage("");
    try {
      const session = (await browserAuth()?.auth.getSession())?.data.session;
      if (!session)
        throw new Error("Entre na sua conta master para consultar clientes.");
      const response = await fetch(
        `/api/admin/customers?${new URLSearchParams({ page: String(requestedPage), search, filter })}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      setPage(requestedPage);
    } catch (error) {
      setData(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar clientes.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load(1);
  }, []);
  const estimate = estimateSales(
    scenario.monthly,
    scenario.annual,
    0,
    scenario.fixed,
    scenario.fees,
    scenario.perAccount,
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    void load(1);
  }
  return (
    <main className="commercial-page commercial-dashboard">
      <header>
        <Link className="brand" href="/admin">
          FalaBrinca · Master
        </Link>
        <Link href="/admin">Gestão de conteúdo</Link>
      </header>
      <h1>Clientes, acessos e vendas</h1>
      <p>
        Dados exclusivos do proprietário. Cada pessoa é contada por sua conta, e
        não por dispositivo.
      </p>
      <p role="status">{message}</p>
      {!data && !busy && (
        <Link className="primary" href="/conta?gerenciar=1">
          Entrar na conta master
        </Link>
      )}
      {data && (
        <>
          <div className="commercial-metrics">
            {[
              ["Cadastros", data.metrics.registered],
              ["Já entraram na conta", data.metrics.loggedIn],
              ["Compradores identificados", data.metrics.buyers],
              ["Sem compra registrada", data.metrics.withoutPurchase],
              ["Acessos válidos", data.metrics.active],
              [
                "Conversão de cadastros",
                `${data.metrics.registered ? ((100 * data.metrics.buyers) / data.metrics.registered).toFixed(1) : "0"}%`,
              ],
              ["Recebido registrado (bruto)", money(data.metrics.grossCents)],
              ["Reembolsos registrados", money(data.metrics.refundedCents)],
              [
                "Recebido menos reembolsos",
                money(data.metrics.netBeforeFeesCents),
              ],
              [
                "Receita recorrente mensal equivalente",
                money(data.metrics.mrrCents),
              ],
              ...(data.metrics.yearlyPass > 0
                ? [
                    [
                      "Passes antigos: equivalente mensal, sem recorrência",
                      money(data.metrics.passMonthlyEquivalentCents),
                    ],
                  ]
                : []),
            ].map(([label, value]) => (
              <article className="kids-card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <p>
            {data.metrics.monthly} mensais · {data.metrics.annual} anuais
            recorrentes
            {data.metrics.yearlyPass > 0
              ? ` · ${data.metrics.yearlyPass} passes antigos válidos`
              : ""}
            .
          </p>
          <p className="notice">
            Recebimentos e reembolsos são registrados pelos webhooks após a
            ativação desta versão. Pagamentos antigos precisam ter seus eventos
            reenviados pelo Stripe para completar o histórico. Acesso e
            assinaturas refletem o último evento recebido; o Stripe continua
            sendo a referência financeira. Valores antes de taxas e impostos. A
            conta master fica fora dos totais.
          </p>
          <form className="commercial-filters" onSubmit={submit}>
            <label>
              Buscar por nome ou e-mail
              <input
                value={search}
                maxLength={100}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Situação
              <select
                aria-label="Situação"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas as contas</option>
                <option value="no_purchase">Sem compra registrada</option>
                <option value="logged_no_purchase">
                  Entraram e não compraram
                </option>
                <option value="active">Com acesso válido</option>
                <option value="inactive">Sem acesso válido</option>
              </select>
            </label>
            <button className="primary" disabled={busy}>
              Consultar
            </button>
          </form>
          <div className="customer-list">
            {data.customers.map((c) => (
              <article className="kids-card" key={c.id}>
                <div>
                  <h2>{c.guardian_name || c.email}</h2>
                  <p>{c.email}</p>
                  <span className="pill">
                    {c.plan
                      ? PLANS[c.plan].name
                      : c.buyer
                        ? "Compra anterior registrada"
                        : "Sem compra registrada"}
                  </span>
                  <p>
                    {c.active ? "Acesso válido" : "Sem acesso válido"}
                    {c.cancel_at_period_end ? " · Renovação cancelada" : ""}
                  </p>
                </div>
                <dl>
                  <dt>Cadastro</dt>
                  <dd>{date(c.created_at)}</dd>
                  <dt>Último login</dt>
                  <dd>{date(c.last_sign_in_at)}</dd>
                  <dt>Última visita registrada</dt>
                  <dd>{date(c.last_seen_at)}</dd>
                  <dt>Logins acompanhados nesta versão</dt>
                  <dd>{c.tracked_logins}</dd>
                  <dt>Dispositivos</dt>
                  <dd>{c.devices}/3</dd>
                  <dt>Fim do período de acesso</dt>
                  <dd>
                    {date(
                      c.pass_end ||
                        (c.period_end
                          ? new Date(c.period_end * 1000).toISOString()
                          : null),
                    )}
                  </dd>
                </dl>
              </article>
            ))}
          </div>
          {!data.customers.length && (
            <p>Nenhuma conta encontrada com esses filtros.</p>
          )}
          <div className="commercial-pagination">
            <button
              className="secondary"
              disabled={busy || page <= 1}
              onClick={() => void load(page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {page} · {data.total} contas
            </span>
            <button
              className="secondary"
              disabled={busy || page * data.pageSize >= data.total}
              onClick={() => void load(page + 1)}
            >
              Próxima
            </button>
          </div>
          <small>
            Atualizado em {date(data.generatedAt)}. E-mails não confirmados
            também aparecem nos cadastros. “Sem compra registrada” não substitui
            uma conferência de pagamentos históricos no Stripe.
          </small>
        </>
      )}
      {data && (
        <section className="kids-card sales-estimator">
          <h2>Simular novas vendas</h2>
          <p>
            Projeção de novas compras em um mês, separada do dinheiro já
            recebido. Informe seus custos para estimar o saldo.
          </p>
          <div className="editor-grid">
            {(
              [
                ["monthly", "Novas assinaturas mensais"],
                ["annual", "Novas assinaturas anuais"],
                ["fixed", "Custos fixos do mês (R$)"],
                ["fees", "Taxas e impostos estimados (%)"],
                ["perAccount", "Custo adicional por nova conta (R$)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min="0"
                  max={key === "fees" ? 100 : 1000000}
                  step={
                    ["fixed", "fees", "perAccount"].includes(key) ? "0.01" : "1"
                  }
                  value={scenario[key]}
                  onChange={(e) =>
                    setScenario({ ...scenario, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <dl>
            <dt>Entrada bruta das novas vendas</dt>
            <dd>{money(estimate.gross * 100)}</dd>
            <dt>Recorrência mensal equivalente adicionada</dt>
            <dd>{money(estimate.mrr * 100)}</dd>
            <dt>Saldo estimado do mês</dt>
            <dd>{money(estimate.estimatedBalance * 100)}</dd>
          </dl>
          <p>
            O anual de R$ 450 entra de uma vez, mas equivale a R$ 37,50/mês de
            receita recorrente. Esta simulação não prevê cancelamentos nem
            substitui sua contabilidade. O saldo é de caixa do mês e não
            desconta automaticamente os custos futuros de atender os acessos
            anuais. Custos zerados não significam custos inexistentes.
          </p>
        </section>
      )}
    </main>
  );
}
