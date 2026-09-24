import { useState } from "react";
import { Wrench, Clock, Calendar } from "lucide-react";
import {
  useMaintenanceTickets,
  usePreventiveTasks,
  useCalibrations,
  useAbrirChamado,
  useAtualizarChamado,
  useRegistrarPreventiva,
} from "../services/useManutencao";
import type {
  MaintenanceTicket,
  MaintenanceTicketStatus,
  PreventiveTask,
  Calibration,
  MaintenanceTicketDraft,
} from "../domain/rules";
import { MAINTENANCE_TICKET_STATUS, PREVENTIVE_STATUS } from "../domain/rules";
import { StatusBadge } from "../../../components/StatusBadge";
import { TicketRow } from "./TicketRow";
import { ChamadoForm } from "./ChamadoForm";
import { PreventivaForm } from "./PreventivaForm";
import { CalibracaoCard } from "./CalibracaoCard";

export function ManutencaoPage() {
  const [activeTab, setActiveTab] = useState<"chamados" | "preventivas" | "calibracoes">("chamados");
  const [filters, setFilters] = useState<{ status?: string; equipmentId?: string }>({});
  const [formOpen, setFormOpen] = useState(false);
  const [preventivaForm, setPreventivaForm] = useState(false);

  const tickets = useMaintenanceTickets(filters);
  const tasks = usePreventiveTasks(false);
  const calibrations = useCalibrations(undefined);

  const abrirChamado = useAbrirChamado();
  const atualizarChamado = useAtualizarChamado();
  const registrarPreventiva = useRegistrarPreventiva();

  // 6.3/5.2: preventivas ainda não concluídas alimentam o seletor do form.
  const pendingTasks = ((tasks ?? []) as unknown as PreventiveTask[]).filter(
    (t) => t.status !== PREVENTIVE_STATUS.CONCLUIDA,
  );

  return (
    <section aria-labelledby="manutencao-heading" className="mx-auto w-full max-w-5xl flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="manutencao-heading" className="font-serif text-2xl font-bold text-foreground">
            Manutenção e calibração
          </h1>
          <p className="text-sm text-muted-foreground">
            Chamados, preventivas e calibrações — com bloqueio automático de reservas quando o equipamento está indisponível.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Wrench className="size-4" aria-hidden="true" /> Abrir chamado
          </button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-border" role="tablist" aria-label="Seção de manutenção">
        {(["chamados", "preventivas", "calibracoes"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab ? "true" : "false"}
            data-selected={activeTab === tab ? "true" : undefined}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-t-md border-b-2 border-transparent data-[selected=true]:border-primary data-[selected=true]:text-foreground"
          >
            {tab === "chamados" && <><Wrench className="mr-1.5 inline size-4" aria-hidden="true" /> Chamados</>}
            {tab === "preventivas" && <><Clock className="mr-1.5 inline size-4" aria-hidden="true" /> Preventivas</>}
            {tab === "calibracoes" && <><Calendar className="mr-1.5 inline size-4" aria-hidden="true" /> Calibrações</>}
          </button>
        ))}
      </div>

      {activeTab === "chamados" && (
        <ChamadosSection
          tickets={tickets as unknown as MaintenanceTicket[] | undefined}
          filters={filters}
          setFilters={setFilters}
          atualizarChamado={atualizarChamado}
        />
      )}
      {activeTab === "preventivas" && (
        <PreventivasSection
          tasks={tasks as unknown as PreventiveTask[] | undefined}
          onOpen={() => setPreventivaForm(true)}
        />
      )}
      {activeTab === "calibracoes" && (
        <CalibracoesSection calibrations={calibrations as unknown as Calibration[] | undefined} />
      )}

      <ChamadoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreate={async (draft: MaintenanceTicketDraft) => {
          await abrirChamado(draft);
          setFormOpen(false);
        }}
      />
      <PreventivaForm
        open={preventivaForm}
        onClose={() => setPreventivaForm(false)}
        tasks={pendingTasks}
        onSubmit={async ({ taskId, executionDate, note }) => {
          // 5.2: data e observação coletadas pelo form são enviadas de fato.
          await registrarPreventiva(taskId, { executionDate, responsibleId: "user-demo", note });
          setPreventivaForm(false);
        }}
      />
    </section>
  );
}

type ChamadosSectionProps = {
  tickets: MaintenanceTicket[] | undefined;
  filters: { status?: string; equipmentId?: string };
  setFilters: (f: { status?: string; equipmentId?: string }) => void;
  atualizarChamado: (ticketId: string, args: { status: MaintenanceTicketStatus; assigneeId?: string; note?: string }) => Promise<string>;
};

function ChamadosSection({ tickets, filters, setFilters, atualizarChamado }: ChamadosSectionProps) {
  const statusOptions: { value: MaintenanceTicketStatus; label: string }[] = [
    { value: MAINTENANCE_TICKET_STATUS.ABERTO, label: "Aberto" },
    { value: MAINTENANCE_TICKET_STATUS.EM_ANDAMENTO, label: "Em andamento" },
    { value: MAINTENANCE_TICKET_STATUS.AGUARDANDO_PECA, label: "Aguardando peça" },
    { value: MAINTENANCE_TICKET_STATUS.CONCLUIDO, label: "Concluído" },
    { value: MAINTENANCE_TICKET_STATUS.CANCELADO, label: "Cancelado" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="chamados-status" className="sr-only sm:not-sr-only text-sm">
            Status
          </label>
          <select
            id="chamados-status"
            value={filters.status || ""}
            onChange={(e) => setFilters({ status: e.target.value || undefined })}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>              {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tickets === undefined ? (
        <div role="status" aria-live="polite" className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Carregando chamados…
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium text-foreground">Nenhum chamado encontrado.</p>
          <p className="text-sm text-muted-foreground">
            {filters.status || filters.equipmentId ? "Tente ajustar os filtros." : "Abra o primeiro chamado para começar."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket._id}
              ticket={ticket}
              onUpdateStatus={(status) => atualizarChamado(ticket._id, { status, assigneeId: undefined, note: undefined })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type PreventivasSectionProps = {
  tasks: PreventiveTask[] | undefined;
  onOpen: () => void;
};

function PreventivasSection({ tasks, onOpen }: PreventivasSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Calendar className="size-4" aria-hidden="true" /> Registrar execução
        </button>
      </div>

      {tasks === undefined ? (
        <div role="status" aria-live="polite" className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Carregando preventivas…
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium text-foreground">Nenhuma manutenção preventiva cadastrada.</p>
          <p className="text-sm text-muted-foreground">Cadastre os equipamentos e defina periodicidades para aparecer aqui.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div key={task._id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{task.type}</h3>
                  <p className="text-sm text-muted-foreground">
                    Equipamento: {task.equipmentId} · intervalo {task.intervalDays} dias
                  </p>
                </div>
                {/* 4.2: badge via StatusBadge compartilhado, sem paleta local. */}
                <StatusBadge value={task.status} />
              </div>              {task.nextDate != null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Próxima: {new Date(task.nextDate).toLocaleDateString("pt-BR")} ·{" "}
                  última: {task.lastDate != null ? new Date(task.lastDate).toLocaleDateString("pt-BR") : "—"}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Última execução por {task.lastResponsibleId || "—"} · {task.lastNote || "sem observação"}
              </p>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}

type CalibracoesSectionProps = {
  calibrations: Calibration[] | undefined;
};

function CalibracoesSection({ calibrations }: CalibracoesSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {calibrations === undefined ? (
        <div role="status" aria-live="polite" className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Carregando calibrações…
        </div>
      ) : calibrations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium text-foreground">Nenhuma calibração registrada.</p>
          <p className="text-sm text-muted-foreground">Registre a primeira calibração de um equipamento para começar o controle.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {calibrations.map((cal) => (
            <CalibracaoCard key={cal._id} calibracao={cal} />
          ))}
        </ul>
      )}
    </div>
  );
}
