import { useState } from "react";
import { Calendar } from "lucide-react";

interface PreventivaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (taskId: string) => Promise<void>;
}

export function PreventivaForm({ open, onClose, onSubmit }: PreventivaFormProps) {
  const [executionDate, setExecutionDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const taskId = "preventiva-demo";

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!executionDate) return;

    setSubmitting(true);
    try {
      await onSubmit(taskId);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preventiva-form-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="preventiva-form-title" className="font-serif text-xl font-bold text-foreground">
            Registrar execução da manutenção preventiva
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Calendar className="size-5" aria-hidden="true" />?
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          <label htmlFor="preventiva-date" className="block text-sm font-medium">
            Data de execução *
          </label>
          <input
            id="preventiva-date"
            type="date"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <label htmlFor="preventiva-note" className="block text-sm font-medium">
            Observação <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="preventiva-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex.: troca de filtro, limpeza geral, revisão de cabo."
          />

          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !executionDate}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {submitting ? "Registrando…" : "Registrar execução"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
