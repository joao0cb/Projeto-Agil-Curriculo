import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import {
  validateSupplyDraftFields,
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
 * Sprint 4, entregas 4.1 e 4.5. Validação preventiva campo a campo no
 * frontend (UX, auditoria 5.3/9.2); o backend revalida tudo (segurança).
 */
export function SupplyForm({ open, onClose, onCreate, defaultResponsibleId }: SupplyFormProps) {
  const [draft, setDraft] = useState(() => emptyDraft(defaultResponsibleId));
  const [expiry, setExpiry] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
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
    setFieldErrors((f) => (f[key as string] ? { ...f, [key]: undefined as unknown as string } : f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const expiresAt = expiry ? new Date(`${expiry}T12:00:00`).getTime() : null;
    const candidate: SupplyDraft = { ...draft, expiresAt };

    // Validação preventiva campo a campo (UX); backend revalida (segurança).
    const errors = validateSupplyDraftFields(candidate);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onCreate(candidate);
      setDraft(emptyDraft(defaultResponsibleId));
      setExpiry("");
      onClose();
    } catch {
      // H9: falha da mutation com caminho de volta; dados permanecem no form.
      setFormError(
        "Não foi possível cadastrar o insumo. Seus dados continuam preenchidos — verifique a conexão e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const invalidField = (name: string) => (fieldErrors[name] ? `${field} border-destructive` : field);
  const describedBy = (name: string) => (fieldErrors[name] ? `supply-${name}-error` : undefined);
  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <p id={`supply-${name}-error`} className="mt-1 text-xs text-destructive" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo insumo"
      isDirty={isDirty}
      confirmDiscardMessage="Há dados não salvos neste insumo. Descartar o preenchimento?"
    >
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
        {formError && (
          <p
            role="alert"
            aria-live="assertive"
            className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="supply-name" className="block text-sm font-medium">Nome *</label>
          <input
            id="supply-name"
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className={invalidField("name")}
          />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor="supply-code" className="block text-sm font-medium">Código *</label>
          <input
            id="supply-code"
            value={draft.code}
            onChange={(e) => update("code", e.target.value)}
            aria-invalid={fieldErrors.code ? true : undefined}
            aria-describedby={describedBy("code")}
            className={invalidField("code")}
          />
          {fieldError("code")}
        </div>
        <div>
          <label htmlFor="supply-category" className="block text-sm font-medium">Categoria *</label>
          <input
            id="supply-category"
            placeholder="Ex.: Reagente, Vidraria"
            value={draft.category}
            onChange={(e) => update("category", e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="supply-unit" className="block text-sm font-medium">Unidade (g, mL, un) *</label>
          <input
            id="supply-unit"
            value={draft.unit}
            onChange={(e) => update("unit", e.target.value)}
            aria-invalid={fieldErrors.unit ? true : undefined}
            aria-describedby={describedBy("unit")}
            className={invalidField("unit")}
          />
          {fieldError("unit")}
        </div>
        <div>
          <label htmlFor="supply-min" className="block text-sm font-medium">Estoque mínimo *</label>
          <input
            id="supply-min"
            type="number"
            min="0"
            value={draft.minimumStock}
            onChange={(e) => update("minimumStock", e.target.value === "" ? 0 : Number(e.target.value))}
            aria-invalid={fieldErrors.minimumStock ? true : undefined}
            aria-describedby={describedBy("minimumStock")}
            className={invalidField("minimumStock")}
          />
          {fieldError("minimumStock")}
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
              <input
                id="supply-initial"
                type="number"
                min="0"
                value={draft.initialBalance}
                onChange={(e) => update("initialBalance", e.target.value === "" ? 0 : Number(e.target.value))}
                aria-invalid={fieldErrors.initialBalance ? true : undefined}
                aria-describedby={describedBy("initialBalance")}
                className={invalidField("initialBalance")}
              />
              {fieldError("initialBalance")}
            </div>
            <div>
              <label htmlFor="supply-lot" className="block text-sm font-medium">Lote {draft.initialBalance > 0 ? "*" : ""}</label>
              <input
                id="supply-lot"
                value={draft.lot}
                onChange={(e) => update("lot", e.target.value)}
                aria-invalid={fieldErrors.lot ? true : undefined}
                aria-describedby={describedBy("lot")}
                className={invalidField("lot")}
              />
              {fieldError("lot")}
            </div>
            <div>
              <label htmlFor="supply-expiry" className="block text-sm font-medium">Validade {draft.initialBalance > 0 ? "*" : ""}</label>
              <input
                id="supply-expiry"
                type="date"
                value={expiry}
                onChange={(e) => {
                  setExpiry(e.target.value);
                  setFieldErrors((f) => ({ ...f, expiresAt: undefined as unknown as string }));
                }}
                aria-invalid={fieldErrors.expiresAt ? true : undefined}
                aria-describedby={describedBy("expiresAt")}
                className={invalidField("expiresAt")}
              />
              {fieldError("expiresAt")}
            </div>
          </div>
        </fieldset>

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
