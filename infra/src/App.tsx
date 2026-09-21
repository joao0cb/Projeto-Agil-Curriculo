import { useState } from "react";
import { FlaskConical, Package, Wrench } from "lucide-react";
import { InsumosPage, useSupplies, stockLevel } from "./modules/insumos";
import { ManutencaoPage } from "./modules/manutencao";
import type { Supply } from "./modules/insumos";

type Tab = "inicio" | "insumos" | "manutencao";

function LowStockAlert() {
  const { supplies } = useSupplies({ onlyLowStock: true });
  if (!supplies || supplies.length === 0) return null;
  return (
    <div
      role="alert"
      className="mx-auto mt-4 w-full max-w-5xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <strong className="font-semibold">Alerta de estoque:</strong>{" "}
      {supplies.length} insumo(s) no estoque mínimo ou zerados —{" "}
      {supplies
        .slice(0, 3)
        .map((s: Supply) => `${s.name} (${s.balance} ${s.unit})`)
        .join(", ")}
      {supplies.length > 3 ? "…" : ""}
    </div>
  );
}

function Dashboard() {
  const { supplies } = useSupplies({});
  const list = supplies ?? [];
  const low = list.filter((s: Supply) => stockLevel(s) !== "ok").length;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Insumos ativos</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {supplies === undefined ? "…" : list.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Alertas de estoque</p>
          <p className={`mt-1 text-3xl font-semibold tabular-nums ${low > 0 ? "text-amber-700" : ""}`}>
            {supplies === undefined ? "…" : low}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Laboratórios</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">—</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Módulos de reservas e cadastros das sprints anteriores integram este painel; o módulo de
        insumos entra agora na Sprint 4.
      </p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("inicio");

  const tabButton = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-5 text-primary" aria-hidden="true" />
            <span className="font-serif text-lg font-bold">Gestão de Laboratório</span>
          </div>
          <nav aria-label="Navegação principal">
            <ul className="flex items-center gap-1">
              <li>
                <button type="button" className={tabButton(tab === "inicio")} onClick={() => setTab("inicio")} aria-current={tab === "inicio" ? "page" : undefined}>
                  Início
                </button>
              </li>
              <li>
                <button type="button" className={tabButton(tab === "insumos")} onClick={() => setTab("insumos")} aria-current={tab === "insumos" ? "page" : undefined}>
                  <Package className="size-4" aria-hidden="true" /> Insumos
                </button>
              </li>
              <li>
                <button type="button" className={tabButton(tab === "manutencao")} onClick={() => setTab("manutencao")} aria-current={tab === "manutencao" ? "page" : undefined}>
                  <Wrench className="size-4" aria-hidden="true" /> Manutenção
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {tab === "inicio" ? <Dashboard /> : tab === "insumos" ? <InsumosPage /> : <ManutencaoPage />}
      </main>
      {tab === "inicio" && <LowStockAlert />}
    </div>
  );
}
