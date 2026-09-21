/** Regras de negócio do módulo de manutenção — Sprint 5.

 * Funções puras e testáveis, sem dependência de React ou Convex.
 * O backend aplica as mesmas regras na escrita; o frontend as reutiliza
 * para validação preventiva e para decidir se um equipamento aparece
 * como disponível para nova reserva.
 */

export const MAINTENANCE_TICKET_STATUS = {
  ABERTO: "aberto",
  EM_ANDAMENTO: "em andamento",
  AGUARDANDO_PECA: "aguardando peca",
  CONCLUIDO: "concluido",
  CANCELADO: "cancelado",
} as const;

export const PREVENTIVE_STATUS = {
  PROGRAMADA: "programada",
  EM_ANDAMENTO: "em andamento",
  CONCLUIDA: "concluida",
  NAO_APLICAVEL: "nao_aplicavel",
} as const;

export const CALIBRATION_STATUS = {
  PENDENTE: "pendente",
  EM_ANDAMENTO: "em andamento",
  CONCLUIDA: "concluida",
  NAO_APLICAVEL: "nao_aplicavel",
} as const;

export const CALIBRATION_RESULT = {
  APROVADO: "aprovado",
  REPROVADO: "reprovado",
  NAO_APLICAVEL: "nao_aplicavel",
} as const;

export const EQUIPMENT_STATUS = {
  DISPONIVEL: "disponivel",
  EM_USO: "em uso",
  EM_MANUTENCAO: "em manutencao",
  INDISPONIVEL: "indisponivel",
  QUEBRADO: "quebrado",
} as const;

export type MaintenanceTicketPriority = "baixa" | "media" | "alta";
export type MaintenanceTicketStatus = (typeof MAINTENANCE_TICKET_STATUS)[keyof typeof MAINTENANCE_TICKET_STATUS];
export type PreventiveStatus = (typeof PREVENTIVE_STATUS)[keyof typeof PREVENTIVE_STATUS];
export type CalibrationStatus = (typeof CALIBRATION_STATUS)[keyof typeof CALIBRATION_STATUS];
export type CalibrationResult = (typeof CALIBRATION_RESULT)[keyof typeof CALIBRATION_RESULT];
export type EquipmentStatus = (typeof EQUIPMENT_STATUS)[keyof typeof EQUIPMENT_STATUS];

export interface MaintenanceTicketDraft {
  equipmentId: string;
  description: string;
  priority: MaintenanceTicketPriority;
  requesterId: string;
  note?: string;
}

export interface MaintenanceTicket {
  _id: string;
  equipmentId: string;
  description: string;
  priority: MaintenanceTicketPriority;
  requesterId: string;
  status: MaintenanceTicketStatus;
  assigneeId?: string;
  note?: string;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
}

export interface PreventiveTask {
  _id: string;
  equipmentId: string;
  type: string;
  intervalDays: number;
  lastDate?: number | null;
  nextDate?: number | null;
  lastResponsibleId?: string;
  lastNote?: string;
  status: PreventiveStatus;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
}

export interface Calibration {
  _id: string;
  equipmentId: string;
  executionDate: number;
  responsibleId: string;
  result: CalibrationResult;
  certificateRef?: string;
  note?: string;
  createdAt: number;
  deletedAt?: number;
}

export interface Equipment {
  _id: string;
  name: string;
  serialNumber: string;
  labId?: string;
  status: EquipmentStatus;
  responsibleId?: string;
}

export const PRIORITY_REQUIRED = "Informe a prioridade do chamado.";
export const DESCRIPTION_REQUIRED = "Descreva o defeito ou necessidade.";
export const EQUIPMENT_REQUIRED = "Informe o equipamento.";
export const RESPONSAVEL_REQUIRED = "Informe o responsável.";
export const INTERVALO_INVALID = "Intervalo de manutenção/prevenção inválido.";

export function isEquipmentUnavailableForReservation(equipment: Pick<Equipment, "status">): boolean {
  return (
    equipment.status === EQUIPMENT_STATUS.EM_MANUTENCAO ||
    equipment.status === EQUIPMENT_STATUS.INDISPONIVEL ||
    equipment.status === EQUIPMENT_STATUS.QUEBRADO
  );
}

export function unavailableReason(equipment: Pick<Equipment, "status">): string | null {
  const s = equipment.status;
  if (s === EQUIPMENT_STATUS.EM_MANUTENCAO) {
    return "Equipamento em manutenção — indisponível para novas reservas.";
  }
  if (s === EQUIPMENT_STATUS.INDISPONIVEL) {
    return "Equipamento indisponível. Verifique o histórico de manutenções.";
  }
  if (s === EQUIPMENT_STATUS.QUEBRADO) {
    return "Equipamento com defeito registrado — resolva o chamado antes de reservar.";
  }
  return null;
}

export function nextPreventiveDate(lastDate: number | null, intervalDays: number): number | null {
  if (lastDate === null || !Number.isFinite(intervalDays) || intervalDays <= 0) {
    return null;
  }
  return lastDate + intervalDays * 86_400_000;
}

export function nextCalibrationDate(lastDate: number | null, intervalDays: number): number | null {
  if (lastDate === null || !Number.isFinite(intervalDays) || intervalDays <= 0) {
    return null;
  }
  return lastDate + intervalDays * 86_400_000;
}

export function daysUntil(nextDate: number | null, now: number = Date.now()): number | null {
  if (nextDate === null) return null;
  return Math.ceil((nextDate - now) / 86_400_000);
}

export function isOverdue(nextDate: number | null, now: number = Date.now()): boolean {
  const days = daysUntil(nextDate, now);
  return days !== null && days <= 0;
}

export function validateTicketDraft(draft: MaintenanceTicketDraft): string | null {
  if (!draft.equipmentId.trim()) return EQUIPMENT_REQUIRED;
  if (!draft.description.trim()) return DESCRIPTION_REQUIRED;
  if (draft.priority !== "baixa" && draft.priority !== "media" && draft.priority !== "alta") {
    return PRIORITY_REQUIRED;
  }
  if (!draft.requesterId.trim()) return RESPONSAVEL_REQUIRED;
  return null;
}

/** Converte o status vindo do backend (string livre) para o tipo EquipmentStatus. */
export function normalizeEquipmentStatus(raw: string): EquipmentStatus {
  if (raw === EQUIPMENT_STATUS.EM_USO) return EQUIPMENT_STATUS.EM_USO;
  if (raw === EQUIPMENT_STATUS.EM_MANUTENCAO) return EQUIPMENT_STATUS.EM_MANUTENCAO;
  if (raw === EQUIPMENT_STATUS.INDISPONIVEL) return EQUIPMENT_STATUS.INDISPONIVEL;
  if (raw === EQUIPMENT_STATUS.QUEBRADO) return EQUIPMENT_STATUS.QUEBRADO;
  return EQUIPMENT_STATUS.DISPONIVEL;
}
