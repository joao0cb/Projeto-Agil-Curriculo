import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";

interface PreventivaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (taskId: string) => Promise<void>;
}

export function PreventivaForm({ open, onClose, onSubmit }: PreventivaFormProps) {
  const [executionDate, setExecutionDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taskId = "preventiva-demo";

  const isDirty = executionDate !== "" || note.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!executionDate) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(taskId);
    } catch (err) {
      // Auditoria 1.2: falha da mutation não podia ficar silenciosa.
      // A mudança do payload é da etapa 4 (formulários) — aqui só o feedback.
      setError(err instanceof Error ? err.message : "Erro ao registrar a execução.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar execução da manutenção preventiva"
      isDirty={isDirty}
      confirmDiscardMessage="Há dados não salvos nesta execução. Descartar o preenchimento?"
    >
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

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

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
    </Modal>
  );
}
