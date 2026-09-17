/**
 * Regras de negócio do módulo de insumos — Sprint 4.
 *
 * Funções puras e testáveis, sem dependência de React ou Convex:
 * o backend (Convex) aplica estas regras na escrita; o frontend as reutiliza
 * para validação preventiva (UX).
 */

export type MovementType = "entrada" | "saida";

export interface SupplyDraft {
  name: string;
  code: string;
  category: string;
  unit: string;
  minimumStock: number;
  responsibleId: string;
  initialBalance: number;
  lot: string;
  expiresAt: number | null; // timestamp; null = sem controle de validade
}

export interface Supply {
  _id: string;
  name: string;
  code: string;
  category: string;
  brand?: string;
  supplier?: string;
  unit: string;
  minimumStock: number;
  responsibleId: string;
  labId?: string;
  equipmentId?: string;
  balance: number;
  status: "ativo" | "inativo";
  deletedAt?: number;
}

export interface SupplyMovement {
  _id: string;
  supplyId: string;
  type: MovementType;
  quantity: number;
  lot: string;
  expiresAt: number | null;
  responsibleId: string;
  reservationId?: string;
  note?: string;
  createdAt: number;
}

export const SUPPLY_NAME_REQUIRED = "O nome do insumo é obrigatório.";
export const SUPPLY_CODE_REQUIRED = "O código do insumo é obrigatório.";
export const SUPPLY_UNIT_REQUIRED = "Informe a unidade de medida (ex.: g, mL, un).";
export const SUPPLY_RESPONSIBLE_REQUIRED = "Informe o responsável pelo insumo.";
export const SUPPLY_MIN_INVALID = "O estoque mínimo não pode ser negativo.";
export const SUPPLY_INITIAL_NEGATIVE = "O saldo inicial não pode ser negativo.";
export const SUPPLY_INITIAL_NEEDS_LOT = "Entrada inicial exige lote e validade.";
export const MOVEMENT_QUANTITY_INVALID = "A quantidade deve ser maior que zero.";
export const MOVEMENT_LOT_REQUIRED = "Informe o lote da movimentação.";
export const MOVEMENT_BALANCE_INSUFICIENTE = "Saldo insuficiente: a saída excede o estoque disponível.";

/** Valida o cadastro de um novo insumo. Retorna a primeira mensagem de erro ou null. */
export function validateSupplyDraft(draft: SupplyDraft): string | null {
  if (!draft.name.trim()) return SUPPLY_NAME_REQUIRED;
  if (!draft.code.trim()) return SUPPLY_CODE_REQUIRED;
  if (!draft.unit.trim()) return SUPPLY_UNIT_REQUIRED;
  if (!draft.responsibleId.trim()) return SUPPLY_RESPONSIBLE_REQUIRED;
  if (!Number.isFinite(draft.minimumStock) || draft.minimumStock < 0) return SUPPLY_MIN_INVALID;
  if (!Number.isFinite(draft.initialBalance) || draft.initialBalance < 0)
    return SUPPLY_INITIAL_NEGATIVE;
  if (draft.initialBalance > 0 && (!draft.lot.trim() || draft.expiresAt === null))
    return SUPPLY_INITIAL_NEEDS_LOT;
  return null;
}

/** Valida uma movimentação de entrada/saída. Retorna a primeira mensagem de erro ou null. */
export function validateMovement(draft: {
  type: MovementType;
  quantity: number;
  lot: string;
  currentBalance: number;
}): string | null {
  if (!Number.isFinite(draft.quantity) || draft.quantity <= 0) return MOVEMENT_QUANTITY_INVALID;
  if (!draft.lot.trim()) return MOVEMENT_LOT_REQUIRED;
  if (draft.type === "saida" && draft.quantity > draft.currentBalance)
    return MOVEMENT_BALANCE_INSUFICIENTE;
  return null;
}

/**
 * Calcula o saldo a partir do histórico de movimentações (fonte da verdade).
 * Entradas somam; saídas subtraem. Usado como regra de consistência defensiva.
 */
export function calculateBalance(movements: Pick<SupplyMovement, "type" | "quantity">[]): number {
  return movements.reduce(
    (acc, m) => (m.type === "entrada" ? acc + m.quantity : acc - m.quantity),
    0
  );
}

/** Estado do estoque em relação ao mínimo configurado. */
export type StockLevel = "critico" | "atencao" | "ok";

export function stockLevel(supply: Pick<Supply, "balance" | "minimumStock">): StockLevel {
  if (supply.balance <= 0) return "critico";
  if (supply.balance <= supply.minimumStock) return "atencao";
  return "ok";
}

/** Dias restantes até a validade do lote mais próximo (positivo = dias restantes). */
export function daysUntilExpiry(expiresAt: number | null, now: number = Date.now()): number | null {
  if (expiresAt === null) return null;
  return Math.ceil((expiresAt - now) / 86_400_000);
}

export const EXPIRY_WARNING_DAYS = 30;

/** Validade iminente: dentro da janela de alerta (ou já vencido). */
export function isExpiringSoon(expiresAt: number | null, now: number = Date.now()): boolean {
  const days = daysUntilExpiry(expiresAt, now);
  return days !== null && days <= EXPIRY_WARNING_DAYS;
}
