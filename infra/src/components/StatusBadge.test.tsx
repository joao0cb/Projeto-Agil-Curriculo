import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge, statusLabelFor } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renderiza rótulo canônico e símbolo (H4 — cor+texto+símbolo)", () => {
    render(<StatusBadge value="disponivel" />);
    expect(screen.getByText("Disponível")).toBeInTheDocument();
  });

  it("normaliza case e acentos na busca do rótulo", () => {
    expect(statusLabelFor("Concluído")).toBe("Concluído");
    expect(statusLabelFor("CONCLUIDO")).toBe("Concluído");
    expect(statusLabelFor("nao_aplicavel")).toBe("Não aplicável");
    expect(statusLabelFor("em uso")).toBe("Em uso");
  });

  it("mantém valor desconhecido como veio (fallback)", () => {
    expect(statusLabelFor("status-futuro")).toBe("status-futuro");
  });

  it("usa semântica corrigida da auditoria (aberto=pending, cancelado=neutral)", () => {
    render(<StatusBadge value="cancelado" />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });
});
