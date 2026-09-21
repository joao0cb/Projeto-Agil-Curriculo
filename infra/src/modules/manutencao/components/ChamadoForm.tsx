import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { MaintenanceTicketDraft, MaintenanceTicketPriority } from "../domain/rules";
import { validateTicketDraft } from "../domain/rules";

interface ChamadoFormProps {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: MaintenanceTicketDraft) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: MaintenanceTicketPriority; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

export function ChamadoForm({ open, onClose, onCreate }: ChamadoFormProps) {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenanceTicketPriority>("media");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const draft: MaintenanceTicketDraft = {
      equipmentId: "equipamento-demo", // substituir por seleção real de equipamento
      description: description.trim(),
      priority,
      requesterId: "user-demo",
      note: note.trim() || undefined,
    };

    const validation = validateTicketDraft(draft);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      await onCreate(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir chamado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chamado-form-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="chamado-form-title" className="font-serif text-xl font-bold text-foreground">
            Abrir chamado de manutenção
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <label htmlFor="chamado-description" className="block text-sm font-medium">
            Descrição do defeito ou necessidade *
          </label>
          <textarea
            id="chamado-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex.: aquecedor de 250°C não aquece."
          />

          <fieldset className="border border-border rounded-md p-3">
            <legend className="px-1 text-sm font-semibold text-foreground">Prioridade *</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                  <input
                    type="radio"
                    name="priority"
                    value={opt.value}
                    checked={priority === opt.value}
                    onChange={(e) => setPriority(e.target.value as MaintenanceTicketPriority)}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="chamado-note" className="block text-sm font-medium">
            Observação <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="chamado-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex.: já disponível peça no almoxarife."
          />

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {submitting ? "Abrindo…" : "Abrir chamado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
