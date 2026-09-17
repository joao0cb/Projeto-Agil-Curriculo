import { describe, it, expect } from "vitest";
import {
  validateSupplyDraft,
  validateMovement,
  calculateBalance,
  stockLevel,
  daysUntilExpiry,
  isExpiringSoon,
  MOVEMENT_BALANCE_INSUFICIENTE,
  MOVEMENT_QUANTITY_INVALID,
  SUPPLY_INITIAL_NEEDS_LOT,
  type SupplyMovement,
} from "./rules";

const DAY = 86_400_000;

function movement(partial: Partial<SupplyMovement>): Pick<SupplyMovement, "type" | "quantity"> {
  return { type: partial.type ?? "entrada", quantity: partial.quantity ?? 0 };
}

describe("calculateBalance — saldo a partir das movimentações", () => {
  it("calcula saldo com entradas e saídas", () => {
    const movements = [
      movement({ type: "entrada", quantity: 100 }),
      movement({ type: "saida", quantity: 30 }),
      movement({ type: "entrada", quantity: 20 }),
      movement({ type: "saida", quantity: 40 }),
    ];
    expect(calculateBalance(movements)).toBe(50);
  });

  it("retorna zero sem movimentações", () => {
    expect(calculateBalance([])).toBe(0);
  });

  it("permite saldo negativo apenas como sinal de inconsistência detectável", () => {
    expect(calculateBalance([movement({ type: "saida", quantity: 10 })])).toBe(-10);
  });
});

describe("validateMovement — regra de saída inválida", () => {
  it("bloqueia saída maior que o saldo com mensagem humana", () => {
    const error = validateMovement({ type: "saida", quantity: 15, lot: "L1", currentBalance: 10 });
    expect(error).toBe(MOVEMENT_BALANCE_INSUFICIENTE);
  });

  it("aceita saída exatamente igual ao saldo", () => {
    const error = validateMovement({ type: "saida", quantity: 10, lot: "L1", currentBalance: 10 });
    expect(error).toBeNull();
  });

  it("bloqueia quantidade zero, negativa ou não numérica", () => {
    expect(validateMovement({ type: "entrada", quantity: 0, lot: "L1", currentBalance: 0 })).toBe(
      MOVEMENT_QUANTITY_INVALID
    );
    expect(validateMovement({ type: "entrada", quantity: -5, lot: "L1", currentBalance: 0 })).toBe(
      MOVEMENT_QUANTITY_INVALID
    );
    expect(validateMovement({ type: "entrada", quantity: NaN, lot: "L1", currentBalance: 0 })).toBe(
      MOVEMENT_QUANTITY_INVALID
    );
  });

  it("exige lote em qualquer movimentação", () => {
    const error = validateMovement({ type: "entrada", quantity: 5, lot: "  ", currentBalance: 0 });
    expect(error).toMatch(/lote/i);
  });
});

describe("validateSupplyDraft — cadastro", () => {
  const base = {
    name: "Reagente X",
    code: "RX-01",
    category: "Reagente",
    unit: "g",
    minimumStock: 5,
    responsibleId: "user-1",
    initialBalance: 10,
    lot: "L2026",
    expiresAt: Date.now() + 30 * DAY,
  };

  it("aceita cadastro válido com estoque inicial", () => {
    expect(validateSupplyDraft(base)).toBeNull();
  });

  it("exige lote e validade quando há estoque inicial", () => {
    expect(validateSupplyDraft({ ...base, lot: "" })).toBe(SUPPLY_INITIAL_NEEDS_LOT);
    expect(validateSupplyDraft({ ...base, expiresAt: null })).toBe(SUPPLY_INITIAL_NEEDS_LOT);
  });

  it("aceita saldo inicial zero sem lote/validade", () => {
    expect(validateSupplyDraft({ ...base, initialBalance: 0, lot: "", expiresAt: null })).toBeNull();
  });

  it("bloqueia estoque mínimo ou saldo inicial negativos", () => {
    expect(validateSupplyDraft({ ...base, minimumStock: -1 })).toMatch(/mínimo/i);
    expect(validateSupplyDraft({ ...base, initialBalance: -2 })).toMatch(/negativo/i);
  });

  it("bloqueia campos obrigatórios vazios", () => {
    expect(validateSupplyDraft({ ...base, name: " " })).toMatch(/nome/i);
    expect(validateSupplyDraft({ ...base, code: "" })).toMatch(/código/i);
    expect(validateSupplyDraft({ ...base, unit: "" })).toMatch(/unidade/i);
    expect(validateSupplyDraft({ ...base, responsibleId: "" })).toMatch(/responsável/i);
  });
});

describe("stockLevel — níveis de estoque", () => {
  it("classifica crítico quando o saldo zerou", () => {
    expect(stockLevel({ balance: 0, minimumStock: 5 })).toBe("critico");
  });

  it("classifica atenção quando está no mínimo ou abaixo", () => {
    expect(stockLevel({ balance: 5, minimumStock: 5 })).toBe("atencao");
    expect(stockLevel({ balance: 3, minimumStock: 5 })).toBe("atencao");
  });

  it("classifica ok acima do mínimo", () => {
    expect(stockLevel({ balance: 6, minimumStock: 5 })).toBe("ok");
  });
});

describe("validade", () => {
  const now = new Date("2026-09-17T12:00:00Z").getTime();

  it("calcula dias restantes até o vencimento", () => {
    expect(daysUntilExpiry(now + 10 * DAY, now)).toBe(10);
  });

  it("alerta validade iminente dentro de 30 dias e vencidos", () => {
    expect(isExpiringSoon(now + 29 * DAY, now)).toBe(true);
    expect(isExpiringSoon(now - 1 * DAY, now)).toBe(true);
    expect(isExpiringSoon(now + 31 * DAY, now)).toBe(false);
  });

  it("ignora insumos sem controle de validade", () => {
    expect(daysUntilExpiry(null, now)).toBeNull();
    expect(isExpiringSoon(null, now)).toBe(false);
  });
});
