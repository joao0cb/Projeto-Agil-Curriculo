import { AlertTriangle } from "lucide-react";
import type { MaintenanceTicket, MaintenanceTicketStatus } from "../domain/rules";
import { MAINTENANCE_TICKET_STATUS } from "../domain/rules";
import { StatusBadge } from "../../../components/StatusBadge";

const CHAMADO_LABEL: Record<string, string> = {
  aberto: "Aberto",
  "em andamento": "Em andamento",
  "aguardando peca": "Aguardando peça",
  concluido: "Concluído",
  cancelado: "Cancelado",
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_PECA: "Aguardando peça",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

interface TicketRowProps {
  ticket: MaintenanceTicket;
  onUpdateStatus: (status: MaintenanceTicketStatus) => void;
}

const PRIORITY_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export function TicketRow({ ticket, onUpdateStatus }: TicketRowProps) {
  const statusRaw = String(ticket.status);
  const finished = statusRaw === "concluido" || statusRaw === "cancelado";
  const statusLabel = CHAMADO_LABEL[statusRaw] ?? statusRaw;
  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">{ticket.description}</h3>
            <StatusBadge value={statusLabel} />
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Aberto em {new Date(ticket.createdAt).toLocaleString("pt-BR")} · responsável: {ticket.requesterId}
          </p>
          {ticket.note && <p className="mt-1 text-sm text-muted-foreground">{ticket.note}</p>}
        </div>
        <div className="flex gap-2">
          <StatusActions ticket={ticket} onUpdateStatus={onUpdateStatus} />
        </div>
      </div>

          {!finished && (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span className="align-top leading-snug">Este equipamento não está disponível para nova reserva enquanto o chamado não for concluído.</span>
        </p>
      )}
    </li>
  );
}

function StatusActions({ ticket, onUpdateStatus }: { ticket: MaintenanceTicket; onUpdateStatus: (s: MaintenanceTicketStatus) => void }) {
  const statusRaw = String(ticket.status);
  const s = statusRaw.toUpperCase();
  const finished = s === "CONCLUIDO" || s === "CANCELADO";
  const options: { value: MaintenanceTicketStatus; label: string; disabled: boolean }[] = [
    { value: MAINTENANCE_TICKET_STATUS.ABERTO, label: "Voltar a aberto", disabled: finished || s === "ABERTO" },
    { value: MAINTENANCE_TICKET_STATUS.EM_ANDAMENTO, label: "Iniciar", disabled: finished || s === "EM_ANDAMENTO" },
    { value: MAINTENANCE_TICKET_STATUS.AGUARDANDO_PECA, label: "Aguardando peça", disabled: finished },
    { value: MAINTENANCE_TICKET_STATUS.CONCLUIDO, label: "Concluir", disabled: finished },
    { value: MAINTENANCE_TICKET_STATUS.CANCELADO, label: "Cancelar", disabled: finished },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={opt.disabled}
          onClick={() => opt.disabled ? undefined : onUpdateStatus(opt.value)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring ${
            opt.disabled
              ? "border-border text-muted-foreground"
              : "border-primary text-primary hover:bg-primary/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
