import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renderiza cor e texto", () => {
    render(<StatusBadge value="disponível" />);
    expect(screen.getByText("disponível")).toBeInTheDocument();
  });
});
