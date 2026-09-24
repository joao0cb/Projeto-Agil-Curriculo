import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TicketRow } from "./TicketRow";
import type { MaintenanceTicket } from "../domain/rules";

const ticket = (partial: Partial<MaintenanceTicket>): MaintenanceTicket => ({
  _id: "t1",
  equipmentId: "eq-1",
  description: "Aquecedor não aquece.",
  priority: "media",
  requesterId: "user-demo",
  status: "aberto",
  createdAt: Date.now(),
  ...partial,
});

describe("TicketRow", () => {
  it("renderiza chamado aberto com status e prioridade", () => {
    render(<TicketRow ticket={ticket({ status: "aberto" })} onUpdateStatus={vi.fn()} />);
    expect(screen.getByText("Aquecedor não aquece.")).toBeInTheDocument();
    expect(screen.getByText("Aberto")).toBeInTheDocument();
    expect(screen.getByText("Média")).toBeInTheDocument();
  });

  it("mostra aviso de bloqueio de reserva quando em andamento (H8 8.1: ruído só onde muda decisão)", () => {
    render(<TicketRow ticket={ticket({ status: "em andamento" })} onUpdateStatus={vi.fn()} />);
    expect(screen.getByText(/bloqueado para novas reservas/i)).toBeInTheDocument();
  });

  it("não mostra aviso quando o chamado está aberto, concluído ou cancelado", () => {
    for (const status of ["aberto", "concluido", "cancelado"] as const) {
      render(<TicketRow ticket={ticket({ status })} onUpdateStatus={vi.fn()} />);
      expect(screen.queryByText(/bloqueado para novas reservas/i)).not.toBeInTheDocument();
    }
  });

  it("habilita ações apropriadas e chama update na transição", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<TicketRow ticket={ticket({ status: "aberto" })} onUpdateStatus={onUpdate} />);

    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(onUpdate).toHaveBeenCalledWith("em andamento");
  });

  it("desabilita ações inválidas para chamado finalizado", () => {
    render(<TicketRow ticket={ticket({ status: "concluido" })} onUpdateStatus={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Concluir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
