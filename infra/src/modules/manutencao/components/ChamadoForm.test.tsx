import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ChamadoForm } from "./ChamadoForm";
import { DESCRIPTION_REQUIRED } from "../domain/rules";

describe("ChamadoForm", () => {
  it("abre e foca no campo de descrição", () => {
    render(<ChamadoForm open onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByLabelText(/descrição do defeito/i)).toBeInTheDocument();
  });

  it("exibe erro quando a descrição está vazia", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<ChamadoForm open onClose={vi.fn()} onCreate={onCreate} />);
    await user.click(screen.getByRole("button", { name: /abrir chamado/i }));
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText(new RegExp(DESCRIPTION_REQUIRED, "i"))).toBeInTheDocument();
  });

  it("chama onCreate quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<ChamadoForm open onClose={vi.fn()} onCreate={onCreate} />);
    await user.type(screen.getByLabelText(/descrição do defeito/i), "Aquecedor sem calor.");
    await user.click(screen.getByRole("button", { name: /abrir chamado/i }));
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Aquecedor sem calor.",
        priority: "media",
        requesterId: "user-demo",
      })
    );
  });
});
