import { useState } from "react";
import { useSupplies, useSupplyDetail, useCreateSupply, useRegisterMovement } from "../services/useSupplies";
import type { SupplyDraft } from "../domain/rules";
import { SupplyList } from "./SupplyList";
import { SupplyDetail } from "./SupplyDetail";
import { SupplyForm } from "./SupplyForm";
import { QueryErrorBoundary } from "../../../components/QueryErrorBoundary";

/**
 * Página do módulo de insumos — Sprint 4.
 * Composição: listagem com filtros + ficha (movimentações) + cadastro.
 * Responsável simulado até o módulo de usuários/autenticação real (Sprint 1-2).
 */
const CURRENT_USER_ID = "user-demo";

export function InsumosPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  // Incrementa a cada "tentar novamente" para remontar a árvore de query.
  const [queryAttempt, setQueryAttempt] = useState(0);

  const { supplies, categories } = useSupplies({
    search,
    category,
    onlyLowStock,
  });
  const detail = useSupplyDetail(selectedId);
  const createSupply = useCreateSupply();
  const registerMovement = useRegisterMovement();

  async function handleCreate(draft: SupplyDraft & { brand?: string; supplier?: string }): Promise<void> {
    const createdId: unknown = await createSupply({
      name: draft.name,
      code: draft.code,
      category: draft.category,
      brand: draft.brand,
      supplier: draft.supplier,
      unit: draft.unit,
      minimumStock: draft.minimumStock,
      responsibleId: draft.responsibleId,
      initialBalance: draft.initialBalance,
      lot: draft.lot,
      expiresAt: draft.expiresAt,
    });
    void createdId;
  }

  return (
    <section aria-labelledby="insumos-heading" className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="insumos-heading" className="font-serif text-2xl font-bold text-foreground">
            Insumos e estoque
          </h1>
          <p className="text-sm text-muted-foreground">
            Entradas, saídas, estoque mínimo e validade — com rastreabilidade completa.
          </p>
        </div>
      </header>

      {/* 9.1: erros da query (rede/permissão) ficam visíveis com retry, sem tela branca. */}
      <QueryErrorBoundary
        key={queryAttempt}
        action="carregar os insumos"
        onRetry={() => setQueryAttempt((n) => n + 1)}
      >
        <SupplyList
          supplies={supplies}
          categories={categories}
          isLoading={supplies === undefined}
          error={null}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          onlyLowStock={onlyLowStock}
          onOnlyLowStockChange={setOnlyLowStock}
          onSelectSupply={setSelectedId}
          onCreateSupply={() => setFormOpen(true)}
        />
      </QueryErrorBoundary>

      {detail && (
        <SupplyDetail
          supply={detail.supply}
          movements={detail.movements}
          onClose={() => setSelectedId(null)}
          onRegisterMovement={async ({ type, quantity, lot, note }) => {
            await registerMovement({
              supplyId: detail.supply._id,
              type,
              quantity,
              lot,
              responsibleId: CURRENT_USER_ID,
              note,
            });
          }}
        />
      )}

      <SupplyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        defaultResponsibleId={CURRENT_USER_ID}
      />
    </section>
  );
}
