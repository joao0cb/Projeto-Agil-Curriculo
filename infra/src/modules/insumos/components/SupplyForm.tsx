import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import {
  validateSupplyDraft,
  type SupplyDraft,
} from "../domain/rules";

interface SupplyFormProps {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: SupplyDraft & { brand?: string; supplier?: string }) => Promise<void>;
  defaultResponsibleId: string;
}

const emptyDraft = (responsibleId: string): SupplyDraft & { brand: string; supplier: string } => ({
  name: "",
  code: "",
  category: "",
  brand: "",
  supplier: "",
  unit: "",
  minimumStock: 0,
  responsibleId,
  initialBalance: 0,
  lot: "",
  expiresAt: null,
});

/**
 * Cadastro de insumo com entrada de estoque inicial explícita —
 * Sprint 4, entregas 4.1 e 4.5. Validação preventiva no frontend;
 * o backend revalida tudo.
 */
export function SupplyForm({ open, onClose, onCreate, defaultResponsibleId }: SupplyFormProps) {
  const [draft, setDraft] = useState(() => emptyDraft(defaultResponsibleId));
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isDirty =
    draft.name.trim() !== "" ||
    draft.code.trim() !== "" ||
    draft.category.trim() !== "" ||
    draft.unit.trim() !== "" ||
    draft.brand.trim() !== "" ||
    draft.supplier.trim() !== "" ||
    draft.lot.trim() !== "" ||
    draft.minimumStock > 0 ||
    draft.initialBalance > 0 ||
    expiry !== "";

  function update<K extends keyof ReturnType<typeof emptyDraft>>(key: K, value: string | number) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const expiresAt = expiry ? new Date(`${expiry}T12:00:00`).getTime() : null;
    const candidate: SupplyDraft = { ...draft, expiresAt };

    // Validação preventiva (UX); backend revalida (segurança).
    const validationError = validateSupplyDraft(candidate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await onCreate(candidate);
      setDraft(emptyDraft(defaultResponsibleId));
      setExpiry("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar insumo.");
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo insumo"
      isDirty={isDirty}
      confirmDiscardMessage="Há dados não salvos neste insumo. Descartar o preenchimento?"
    >
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label htmlFor="supply-name" className="block text-sm font-medium">Nome *</label>
          <input id="supply-name" value={draft.name} onChange={(e) => update("name", e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="supply-code" className="block text-sm font-medium">Código *</label>
          <input id="supply-code" value={draft.code} onChange={(e) => update("code", e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="supply-category" className="block text-sm font-medium">Categoria *</label>
          <input id="supply-category" placeholder="Ex.: Reagente, Vidraria" value={draft.category} onChange={(e) => update("category", e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="supply-unit" className="block text-sm font-medium">Unidade (g, mL, un) *</label>
          <input id="supply-unit" value={draft.unit} onChange={(e) => update("unit", e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="supply-min" className="block text-sm font-medium">Estoque mínimo *</label>
          <input id="supply-min" type="number" min="0" value={draft.minimumStock} onChange={(e) => update("minimumStock", Number(e.target.value))} className={field} />
        </div>
        <div>
          <label htmlFor="supply-brand" className="block text-sm font-medium">Marca</label>
          <input id="supply-brand" value={draft.brand} onChange={(e) => update("brand", e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="supply-supplier" className="block text-sm font-medium">Fornecedor</label>
          <input id="supply-supplier" value={draft.supplier} onChange={(e) => update("supplier", e.target.value)} className={field} />
        </div>

        <fieldset className="sm:col-span-2 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold text-foreground">Estoque inicial</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="supply-initial" className="block text-sm font-medium">Quantidade</label>
              <input id="supply-initial" type="number" min="0" value={draft.initialBalance} onChange={(e) => update("initialBalance", Number(e.target.value))} className={field} />
            </div>
            <div>
              <label htmlFor="supply-lot" className="block text-sm font-medium">Lote {draft.initialBalance > 0 ? "*" : ""}</label>
              <input id="supply-lot" value={draft.lot} onChange={(e) => update("lot", e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="supply-expiry" className="block text-sm font-medium">Validade {draft.initialBalance > 0 ? "*" : ""}</label>
              <input id="supply-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={field} />
            </div>
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {submitting ? "Salvando…" : "Cadastrar insumo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
