import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import type { PreventiveTask } from "../domain/rules";

interface PreventivaFormProps {
  open: boolean;
  onClose: () => void;
  /** Preventivas pendentes para o usuário escolher (H5/H6 — 5.2/6.1). */
  tasks: PreventiveTask[];
  onSubmit: (args: { taskId: string; executionDate: number; note?: string }) => Promise<void>;
}

const TASK_REQUIRED = "Selecione a preventiva que foi executada.";
const DATE_REQUIRED = "Informe a data de execução.";

export function PreventivaForm({ open, onClose, tasks, onSubmit }: PreventivaFormProps) {
  const [taskId, setTaskId] = useState("");
  const [executionDate, setExecutionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDirty = taskId !== "" || note.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // H5 (5.2): tudo o que o form coleta é enviado — nada é descartado.
    const errors: Record<string, string> = {};
    if (!taskId) errors.taskId = TASK_REQUIRED;
    if (!executionDate) errors.executionDate = DATE_REQUIRED;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        taskId,
        executionDate: new Date(`${executionDate}T12:00:00`).getTime(),
        note: note.trim() || undefined,
      });
    } catch {
      setSubmitError(
        "Não foi possível registrar a execução. Seus dados continuam preenchidos — verifique a conexão e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar execução da manutenção preventiva"
      isDirty={isDirty}
      confirmDiscardMessage="Há dados não salvos nesta execução. Descartar o preenchimento?"
    >
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
        {submitError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
            Nenhuma preventiva pendente encontrada — cadastre preventivas para os equipamentos primeiro.
          </p>
        ) : (
          <div>
            <label htmlFor="preventiva-task" className="block text-sm font-medium">
              Preventiva executada *
            </label>
            <select
              id="preventiva-task"
              value={taskId}
              onChange={(e) => {
                setTaskId(e.target.value);
                setFieldErrors((f) => ({ ...f, taskId: undefined as unknown as string }));
              }}
              aria-invalid={fieldErrors.taskId ? true : undefined}
              aria-describedby={fieldErrors.taskId ? "preventiva-task-error" : undefined}
              className={`${inputBase}${fieldErrors.taskId ? " border-destructive" : ""}`}
            >
              <option value="">Selecione…</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.type} — Equipamento: {task.equipmentId}
                </option>
              ))}
            </select>
            {fieldErrors.taskId && (
              <p id="preventiva-task-error" className="mt-1 text-xs text-destructive">
                {fieldErrors.taskId}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="preventiva-date" className="block text-sm font-medium">
            Data de execução *
          </label>
          <input
            id="preventiva-date"
            type="date"
            value={executionDate}
            onChange={(e) => {
              setExecutionDate(e.target.value);
              setFieldErrors((f) => ({ ...f, executionDate: undefined as unknown as string }));
            }}
            aria-invalid={fieldErrors.executionDate ? true : undefined}
            aria-describedby={fieldErrors.executionDate ? "preventiva-date-error" : undefined}
            className={`${inputBase}${fieldErrors.executionDate ? " border-destructive" : ""}`}
          />
          {fieldErrors.executionDate && (
            <p id="preventiva-date-error" className="mt-1 text-xs text-destructive">
              {fieldErrors.executionDate}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="preventiva-note" className="block text-sm font-medium">
            Observação <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="preventiva-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={inputBase}
            placeholder="Ex.: troca de filtro, limpeza geral, revisão de cabo."
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || tasks.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {submitting ? "Registrando…" : "Registrar execução"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
