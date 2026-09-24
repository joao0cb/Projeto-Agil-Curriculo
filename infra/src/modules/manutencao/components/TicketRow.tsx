import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { MaintenanceTicket, MaintenanceTicketStatus } from "../domain/rules";
import { MAINTENANCE_TICKET_STATUS } from "../domain/rules";
import { StatusBadge, statusLabelFor } from "../../../components/StatusBadge";

interface TicketRowProps {
  ticket: MaintenanceTicket;
  onUpdateStatus: (status: MaintenanceTicketStatus) => Promise<unknown> | unknown;
}

const PRIORITY_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export function TicketRow({ ticket, onUpdateStatus }: TicketRowProps) {
  const statusRaw = String(ticket.status);
  const finished = statusRaw === MAINTENANCE_TICKET_STATUS.CONCLUIDO || statusRaw === MAINTENANCE_TICKET_STATUS.CANCELADO;
  // H4 (4.1): rótulo vem da fonte única (StatusBadge), sem mapa local duplicado.
  const statusLabel = statusLabelFor(statusRaw);

  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">{ticket.description}</h3>
            <StatusBadge value={statusRaw} />
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Aberto em {new Date(ticket.createdAt).toLocaleString("pt-BR")} · solicitante: {ticket.requesterId}
          </p>
          {ticket.note && <p className="mt-1 text-sm text-muted-foreground">{ticket.note}</p>}
        </div>
        <div className="flex gap-2">
          <StatusActions ticket={ticket} onUpdateStatus={onUpdateStatus} />
        </div>
      </div>

      {/* H8 (8.1): aviso longo apenas quando muda a decisão do usuário — chamado em atendimento. */}
      {statusRaw === MAINTENANCE_TICKET_STATUS.EM_ANDAMENTO && (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span className="leading-snug">
            Este equipamento permanece bloqueado para novas reservas até a conclusão do chamado.
          </span>
        </p>
      )}
      {finished && (
        <span className="sr-only">Status final: {statusLabel}.</span>
      )}
    </li>
  );
}

function StatusActions({
  ticket,
  onUpdateStatus,
}: {
  ticket: MaintenanceTicket;
  onUpdateStatus: (s: MaintenanceTicketStatus) => Promise<unknown> | unknown;
}) {
  const [pendingStatus, setPendingStatus] = useState<MaintenanceTicketStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const statusRaw = String(ticket.status);
  const finished = statusRaw === MAINTENANCE_TICKET_STATUS.CONCLUIDO || statusRaw === MAINTENANCE_TICKET_STATUS.CANCELADO;
  const options: {
    value: MaintenanceTicketStatus;
    label: string;
    disabled: boolean;
    confirm?: string;
  }[] = [
    {
      value: MAINTENANCE_TICKET_STATUS.ABERTO,
      label: "Voltar a aberto",
      disabled: finished || statusRaw === MAINTENANCE_TICKET_STATUS.ABERTO,
    },
    {
      value: MAINTENANCE_TICKET_STATUS.EM_ANDAMENTO,
      label: "Iniciar",
      disabled: finished || statusRaw === MAINTENANCE_TICKET_STATUS.EM_ANDAMENTO,
    },
    {
      value: MAINTENANCE_TICKET_STATUS.AGUARDANDO_PECA,
      label: "Aguardando peça",
      disabled: finished,
    },
    {
      value: MAINTENANCE_TICKET_STATUS.CANCELADO,
      label: "Cancelar",
      disabled: finished,
      // H3 (3.3): ação que encerra o chamado pede confirmação.
      confirm: "Cancelar este chamado? O equipamento voltará a ficar disponível para reservas.",
    },
    {
      value: MAINTENANCE_TICKET_STATUS.CONCLUIDO,
      label: "Concluir",
      disabled: finished,
      confirm: "Concluir este chamado? O equipamento voltará a ficar disponível para reservas.",
    },
  ];

  return (
    <div className="flex flex-col items-end gap-1.5">
      {actionError && (
        <p role="alert" className="max-w-56 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {actionError}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 justify-end">
      {options.map((opt) => {
        const busy = pendingStatus === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled || pendingStatus !== null}
            onClick={async () => {
              if (opt.disabled || pendingStatus !== null) return;
              if (opt.confirm && !window.confirm(opt.confirm)) return;
              // H1 (1.1)/H9 (9.3): transição com feedback — botão em estado de
              // espera, erro visível e o card só muda quando a query re-renderiza.
              setPendingStatus(opt.value);
              setActionError(null);
              try {
                await onUpdateStatus(opt.value);
              } catch {
                setActionError(
                  `Não foi possível ${opt.label.toLowerCase()} o chamado. Tente novamente — o status continua o mesmo.`,
                );
              } finally {
                setPendingStatus(null);
              }
            }}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring ${
              opt.disabled || busy
                ? "border-border text-muted-foreground"
                : "border-primary text-primary hover:bg-primary/5"
            }`}
          >
            {busy ? "Aplicando…" : opt.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
