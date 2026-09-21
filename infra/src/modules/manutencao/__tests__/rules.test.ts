import { describe, it, expect } from "vitest";
import {
  isEquipmentUnavailableForReservation,
  unavailableReason,
  nextPreventiveDate,
  nextCalibrationDate,
  daysUntil,
  isOverdue,
  validateTicketDraft,
  normalizeEquipmentStatus,
  type MaintenanceTicketPriority,
} from "../domain/rules";

describe("isEquipmentUnavailableForReservation", () => {
  it("disponível está disponível", () => {
    expect(isEquipmentUnavailableForReservation({ status: normalizeEquipmentStatus("disponivel") })).toBe(false);
  });

  it("em uso permanece disponível para reserva", () => {
    expect(isEquipmentUnavailableForReservation({ status: normalizeEquipmentStatus("em uso") })).toBe(false);
  });

  it("em manutenção bloqueia reserva", () => {
    expect(isEquipmentUnavailableForReservation({ status: normalizeEquipmentStatus("em manutencao") })).toBe(true);
  });

  it("indisponível bloqueia reserva", () => {
    expect(isEquipmentUnavailableForReservation({ status: normalizeEquipmentStatus("indisponivel") })).toBe(true);
  });

  it("quebrado bloqueia reserva", () => {
    expect(isEquipmentUnavailableForReservation({ status: normalizeEquipmentStatus("quebrado") })).toBe(true);
  });
});

describe("unavailableReason", () => {
  it("retorna null para equipamento disponível", () => {
    expect(unavailableReason({ status: normalizeEquipmentStatus("disponivel") })).toBeNull();
  });

  it("explica indisponibilidade por manutenção", () => {
    expect(unavailableReason({ status: normalizeEquipmentStatus("em manutencao") })).toMatch(/manutenção/i);
  });

  it("explica indisponibilidade por defeito", () => {
    expect(unavailableReason({ status: normalizeEquipmentStatus("quebrado") })).toMatch(/defeito/i);
  });
});

describe("próximas datas preventivas/calibração", () => {
  const DAY = 86_400_000;
  const now = 1_700_000_000_000;

  it("calcula próxima manutenção a partir do último registro", () => {
    expect(nextPreventiveDate(now - 30 * DAY, 30)).toBe(now);
  });

  it("retorna null sem data anterior ou intervalo inválido", () => {
    expect(nextPreventiveDate(null, 30)).toBeNull();
    expect(nextPreventiveDate(now, 0)).toBeNull();
    expect(nextPreventiveDate(now, -1)).toBeNull();
  });

  it("calcula próxima calibração igualmente", () => {
    expect(nextCalibrationDate(now - 90 * DAY, 90)).toBe(now);
    expect(nextCalibrationDate(null, 30)).toBeNull();
  });

  it("daysUntil e isOverdue", () => {
    const soon = Date.now() + 5 * DAY;
    const past = Date.now() - 5 * DAY;
    expect(daysUntil(soon)).toBe(5);
    expect(daysUntil(past)).toBe(-5);
    expect(daysUntil(null)).toBeNull();
    expect(isOverdue(past)).toBe(true);
    expect(isOverdue(soon)).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});

describe("validateTicketDraft", () => {
  it("accepts a valid draft", () => {
    expect(
      validateTicketDraft({
        equipmentId: "eq-1",
        description: "Aquecedor não aquece.",
        priority: "media" as MaintenanceTicketPriority,
        requesterId: "user-1",
      })
    ).toBeNull();
  });

  it("rejects missing description", () => {
    expect(
      validateTicketDraft({
        equipmentId: "eq-1",
        description: "  ",
        priority: "media" as MaintenanceTicketPriority,
        requesterId: "user-1",
      })
    ).toBeTruthy();
  });

  it("rejects missing priority", () => {
    expect(
      validateTicketDraft({
        equipmentId: "eq-1",
        description: "Aquecedor não aquece.",
        priority: "media" as MaintenanceTicketPriority,
        requesterId: "user-1",
      })
    ).toBeNull();
  });
});
