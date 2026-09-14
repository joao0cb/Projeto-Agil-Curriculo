import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LabList from "./LabList";

describe("LabList", () => {
  it("renderiza lista com laboratórios", () => {
    render(
      <LabList
        labs={[
          { id: "1", name: "Lab A", local: "Bloco 1", capacity: 20, status: "disponível" },
        ]}
      />
    );
    expect(screen.getByText("Lab A")).toBeInTheDocument();
  });
});
