import { useMemo } from "react";
import { Search, Plus, Filter } from "lucide-react";
import type { Supply } from "../domain/rules";
import { stockLevel } from "../domain/rules";
import { StockLevelBadge } from "./StockLevelBadge";

interface SupplyListProps {
  supplies: Supply[] | undefined;
  categories: string[] | undefined;
  isLoading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onlyLowStock: boolean;
  onOnlyLowStockChange: (value: boolean) => void;
  onSelectSupply: (id: string) => void;
  onCreateSupply: () => void;
}

/**
 * Listagem de insumos com busca por nome/código/categoria, filtro por
 * categoria e por estoque baixo — Sprint 4, entrega 4.4.
 */
export function SupplyList(props: SupplyListProps) {
  const {
    supplies,
    categories,
    isLoading,
    error,
    search,
    onSearchChange,
    category,
    onCategoryChange,
    onlyLowStock,
    onOnlyLowStockChange,
    onSelectSupply,
    onCreateSupply,
  } = props;

  const lowStockCount = useMemo(
    () => (supplies ?? []).filter((s) => stockLevel(s) !== "ok").length,
    [supplies]
  );

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Carregando insumos…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive">
        <p className="font-semibold">Não foi possível carregar os insumos.</p>
        <p className="mt-1 text-sm">{error} Verifique a conexão e tente novamente.</p>
      </div>
    );
  }

  if (!supplies || supplies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="font-medium text-foreground">Nenhum insumo encontrado.</p>
        <p className="text-sm text-muted-foreground">
          {search || (category && category !== "todas") || onlyLowStock
            ? "Tente ajustar os filtros de busca."
            : "Cadastre o primeiro insumo para começar o controle de estoque."}
        </p>
        {!search && (!category || category === "todas") && !onlyLowStock && (
          <button
            type="button"
            onClick={onCreateSupply}
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" /> Cadastrar insumo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, código ou categoria…"
            aria-label="Buscar insumos"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Categoria</span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todas">Todas</option>
            {(categories ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={(e) => onOnlyLowStockChange(e.target.checked)}
            className="size-4 rounded border-input accent-[var(--color-primary)]"
          />
          Só estoque baixo ({lowStockCount})
        </label>

        <button
          type="button"
          onClick={onCreateSupply}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" /> Novo insumo
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {supplies.map((supply) => (
          <li key={supply._id}>
            <button
              type="button"
              onClick={() => onSelectSupply(supply._id)}
              className="w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{supply.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {supply.code} · {supply.category}
                    {supply.unit ? ` · unidade: ${supply.unit}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {supply.balance} <span className="text-sm font-normal text-muted-foreground">{supply.unit}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">mínimo: {supply.minimumStock}</p>
                  </div>
                  <StockLevelBadge balance={supply.balance} minimumStock={supply.minimumStock} />
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
