import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
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

  const isDirty = description.trim() !== "" || note.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const draft: MaintenanceTicketDraft = {
      equipmentId: "equipamento-demo", // seleção real de equipamento chega com o módulo de equipamentos (S2)
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
    } catch {
      // H9: a falha não fica silenciosa e oferece um caminho — os dados continuam no form.
      setError(
        "Não foi possível abrir o chamado. Seus dados continuam preenchidos — verifique a conexão e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Abrir chamado de manutenção"
      isDirty={isDirty}
      confirmDiscardMessage="Há dados não salvos neste chamado. Descartar o preenchimento?"
    >
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="chamado-description" className="block text-sm font-medium">
            Descrição do defeito ou necessidade *
          </label>
          <textarea
            id="chamado-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "chamado-error-message" : undefined}
            className={`mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring${error ? " border-destructive" : ""}`}
            placeholder="Ex.: aquecedor de 250°C não aquece."
          />
        </div>

        <fieldset className="border border-border rounded-md p-3">
          <legend className="px-1 text-sm font-semibold text-foreground">Prioridade *</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted focus-within:ring-2 focus-within:ring-ring"
              >
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

        <div>
          <label htmlFor="chamado-note" className="block text-sm font-medium">
            Observação <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="chamado-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex.: peça já disponível no almoxarifado."
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
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {submitting ? "Abrindo…" : "Abrir chamado"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
