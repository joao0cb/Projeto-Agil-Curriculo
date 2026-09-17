import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SupplyList } from "./SupplyList";
import type { Supply } from "../domain/rules";

const supply = (partial: Partial<Supply>): Supply => ({
  _id: "1",
  name: "Reagente X",
  code: "RX-01",
  category: "Reagente",
  unit: "g",
  minimumStock: 5,
  responsibleId: "u1",
  balance: 20,
  status: "ativo",
  ...partial,
});

const baseProps = {
  categories: ["Reagente", "Vidraria"],
  isLoading: false,
  error: null,
  search: "",
  onSearchChange: vi.fn(),
  category: "todas",
  onCategoryChange: vi.fn(),
  onlyLowStock: false,
  onOnlyLowStockChange: vi.fn(),
  onSelectSupply: vi.fn(),
  onCreateSupply: vi.fn(),
};

describe("SupplyList", () => {
  it("mostra estado de carregamento", () => {
    render(<SupplyList {...baseProps} supplies={undefined} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando insumos…");
  });

  it("mostra estado vazio com chamada para ação quando sem filtros", () => {
    render(<SupplyList {...baseProps} supplies={[]} />);
    expect(screen.getByText("Nenhum insumo encontrado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cadastrar insumo/i })).toBeInTheDocument();
  });

  it("mostra estado vazio sugerindo ajustar filtros quando há busca", () => {
    render(<SupplyList {...baseProps} supplies={[]} search="zzz" />);
    expect(screen.getByText(/ajustar os filtros/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cadastrar insumo/i })).not.toBeInTheDocument();
  });

  it("renderiza insumos com saldo, unidade e nível de estoque", () => {
    render(<SupplyList {...baseProps} supplies={[supply({})]} />);
    expect(screen.getByText("Reagente X")).toBeInTheDocument();
    expect(screen.getByText("20", { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId("stock-level-ok")).toBeInTheDocument();
  });

  it("marca estoque baixo de forma textual (não só cor)", () => {
    render(
      <SupplyList
        {...baseProps}
        supplies={[supply({ balance: 4 })]}
      />
    );
    expect(screen.getByTestId("stock-level-atencao")).toHaveTextContent("estoque baixo");
  });

  it("permite digitar na busca e clicar no insumo", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSelectSupply = vi.fn();
    render(
      <SupplyList
        {...baseProps}
        supplies={[supply({})]}
        onSearchChange={onSearchChange}
        onSelectSupply={onSelectSupply}
      />
    );
    await user.type(screen.getByLabelText("Buscar insumos"), "reagente");
    expect(onSearchChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Reagente X/ }));
    expect(onSelectSupply).toHaveBeenCalledWith("1");
  });
});
