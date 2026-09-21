import type { Equipment } from "../domain/rules";
import { isEquipmentUnavailableForReservation, unavailableReason, normalizeEquipmentStatus } from "../domain/rules";
import { EQUIPMENT_STATUS } from "../domain/rules";

interface EquipmentCardProps {
  equipment: Equipment;
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const reason = unavailableReason(equipment);
  const normalized = normalizeEquipmentStatus(equipment.status);

  const isAtivo =
    normalized === EQUIPMENT_STATUS.DISPONIVEL || normalized === EQUIPMENT_STATUS.EM_USO;
  const isActiveManutencao = normalized === EQUIPMENT_STATUS.EM_MANUTENCAO;

  const statusLabel =
    normalized === EQUIPMENT_STATUS.DISPONIVEL
      ? "Disponível"
      : normalized === EQUIPMENT_STATUS.EM_USO
        ? "Em uso"
        : normalized === EQUIPMENT_STATUS.EM_MANUTENCAO
          ? "Em manutenção"
          : normalized === EQUIPMENT_STATUS.INDISPONIVEL
            ? "Indisponível"
            : "Quebrado";

  const dot =
    normalized === EQUIPMENT_STATUS.DISPONIVEL
      ? "●"
      : normalized === EQUIPMENT_STATUS.EM_USO
        ? "◐"
        : normalized === EQUIPMENT_STATUS.EM_MANUTENCAO
          ? "◐"
          : "✕";

  const activeClass =
    normalized === EQUIPMENT_STATUS.DISPONIVEL
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === EQUIPMENT_STATUS.EM_USO
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  const blockedClass =
    normalized === EQUIPMENT_STATUS.INDISPONIVEL || normalized === EQUIPMENT_STATUS.QUEBRADO
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  const statusClass = isAtivo || isActiveManutencao ? activeClass : blockedClass;

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{equipment.name}</h3>
          <p className="text-sm text-muted-foreground">Nº serie {equipment.serialNumber}</p>
          {equipment.labId && <p className="text-xs text-muted-foreground">Laboratório: {equipment.labId}</p>}
          {equipment.responsibleId && <p className="text-xs text-muted-foreground">Responsável: {equipment.responsibleId}</p>}
        </div>
        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
          <span className="mr-1.5" aria-hidden="true">{dot}</span>
          {statusLabel}
        </span>
      </div>

      {reason && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="leading-snug">{reason}</span>
        </div>
      )}

      {!isEquipmentUnavailableForReservation(equipment) && (
        <p className="mt-2 text-xs text-muted-foreground">Disponível para reservas.</p>
      )}
    </article>
  );
}
