import { useState } from "react";
import { X, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { Supply, SupplyMovement } from "../domain/rules";
import {
  MOVEMENT_QUANTITY_INVALID,
  MOVEMENT_LOT_REQUIRED,
  MOVEMENT_BALANCE_INSUFICIENTE,
  daysUntilExpiry,
  isExpiringSoon,
} from "../domain/rules";
import { StockLevelBadge } from "./StockLevelBadge";

interface SupplyDetailProps {
  supply: Supply;
  movements: SupplyMovement[];
  onClose: () => void;
  onRegisterMovement: (args: {
    type: "entrada" | "saida";
    quantity: number;
    lot: string;
    note?: string;
  }) => Promise<void>;
}

function formatDate(ts: number | null): string {
  if (ts === null) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(ts));
}

/**
 * Ficha do insumo: saldo atual, validade do lote mais próximo, registro de
 * movimentação e histórico resumido — Sprint 4, entregas 4.2 e 4.4.
 */
export function SupplyDetail({ supply, movements, onClose, onRegisterMovement }: SupplyDetailProps) {
  const [type, setType] = useState<"entrada" | "saida">("saida");
  const [quantity, setQuantity] = useState("");
  const [lot, setLot] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nearestExpiry = movements
    .map((m) => m.expiresAt)
    .filter((e): e is number => typeof e === "number")
    .sort((a, b) => a - b)[0];
  const nearestExpiryMs = nearestExpiry === undefined ? null : nearestExpiry;

  const expiryDays = daysUntilExpiry(nearestExpiryMs);
  const expiringSoon = isExpiringSoon(nearestExpiryMs);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const qty = Number(quantity.replace(",", "."));
    // Validação preventiva no frontend (UX); o backend revalida (segurança).
    if (!Number.isFinite(qty) || qty <= 0) {
      setFormError(MOVEMENT_QUANTITY_INVALID);
      return;
    }
    if (!lot.trim()) {
      setFormError(MOVEMENT_LOT_REQUIRED);
      return;
    }
    if (type === "saida" && qty > supply.balance) {
      setFormError(MOVEMENT_BALANCE_INSUFICIENTE);
      return;
    }

    setSubmitting(true);
    try {
      await onRegisterMovement({ type, quantity: qty, lot, note: note.trim() || undefined });
      setQuantity("");
      setNote("");
      setSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao registrar movimentação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha do insumo ${supply.name}`}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground">{supply.name}</h2>
            <p className="text-sm text-muted-foreground">
              {supply.code} · {supply.category}
              {supply.supplier ? ` · fornecedor: ${supply.supplier}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha do insumo"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p className="text-lg font-semibold tabular-nums">
              {supply.balance} {supply.unit}
            </p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Estoque mínimo</p>
            <p className="text-lg font-semibold tabular-nums">{supply.minimumStock}</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Nível</p>
            <div className="mt-1">
              <StockLevelBadge balance={supply.balance} minimumStock={supply.minimumStock} />
            </div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Validade próxima</p>
            <p className={`text-sm font-semibold ${expiringSoon ? "text-destructive" : ""}`}>
              {nearestExpiryMs === null
                ? "—"
                : expiringSoon
                  ? `${expiryDays} dia(s) — atenção!`
                  : formatDate(nearestExpiryMs)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border p-4" noValidate>
          <h3 className="font-semibold text-foreground">Registrar movimentação</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="flex rounded-md border border-input overflow-hidden" role="group" aria-label="Tipo de movimentação">
              <button
                type="button"
                onClick={() => setType("entrada")}
                aria-pressed={type === "entrada"}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring ${
                  type === "entrada" ? "bg-emerald-600 text-white" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowDownToLine className="size-4" aria-hidden="true" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setType("saida")}
                aria-pressed={type === "saida"}
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring ${
                  type === "saida" ? "bg-amber-600 text-white" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowUpFromLine className="size-4" aria-hidden="true" /> Saída
              </button>
            </div>
            <div>
              <label htmlFor="movement-quantity" className="block text-sm font-medium">
                Quantidade ({supply.unit})
              </label>
              <input
                id="movement-quantity"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="movement-lot" className="block text-sm font-medium">
                Lote
              </label>
              <input
                id="movement-lot"
                type="text"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="movement-note" className="block text-sm font-medium">
              Justificativa / referência <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="movement-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: aula de química — turma 2026.1, reserva #12"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {formError && (
            <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          {success && (
            <p role="status" className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Movimentação registrada com sucesso.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {submitting ? "Registrando…" : "Registrar"}
          </button>
        </form>

        <h3 className="mt-6 font-semibold text-foreground">Histórico de movimentações</h3>
        {movements.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {movements.map((m) => (
              <li key={m._id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <div>
                  <span className={`font-semibold ${m.type === "entrada" ? "text-emerald-700" : "text-amber-700"}`}>
                    {m.type === "entrada" ? "+ " : "− "}
                    {m.quantity} {supply.unit}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    lote {m.lot} · val. {formatDate(m.expiresAt ?? null)}
                  </span>
                  {m.note && <span className="block text-xs text-muted-foreground">{m.note}</span>}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{formatDate(m.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
