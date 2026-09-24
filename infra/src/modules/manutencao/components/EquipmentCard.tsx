import { StatusBadge } from "../../../components/StatusBadge";
import type { Equipment } from "../domain/rules";
import { isEquipmentUnavailableForReservation, unavailableReason } from "../domain/rules";

interface EquipmentCardProps {
  equipment: Equipment;
}

/**
 * Card de equipamento — H4 (4.3): badge via StatusBadge compartilhado
 * (cor + texto + símbolo + title), sem recalcular paleta/ícone localmente.
 */
export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const reason = unavailableReason(equipment);

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{equipment.name}</h3>
          <p className="text-sm text-muted-foreground">Nº de série {equipment.serialNumber}</p>
          {equipment.labId && <p className="text-xs text-muted-foreground">Laboratório: {equipment.labId}</p>}
          {equipment.responsibleId && (
            <p className="text-xs text-muted-foreground">Responsável: {equipment.responsibleId}</p>
          )}
        </div>
        <StatusBadge value={String(equipment.status)} />
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
