import type { StockLevel } from "../domain/rules";
import { stockLevel } from "../domain/rules";
import { StatusBadge } from "../../../components/StatusBadge";

const levelLabel: Record<StockLevel, string> = {
  ok: "estoque ok",
  atencao: "estoque baixo",
  critico: "sem estoque",
};

const levelVariant: Record<StockLevel, string> = {
  ok: "available",
  atencao: "pending",
  critico: "unavailable",
};

const levelSymbol: Record<StockLevel, string> = {
  ok: "●",
  atencao: "▲",
  critico: "✕",
};

interface StockLevelBadgeProps {
  balance: number;
  minimumStock: number;
}

/**
 * Badge de nível de estoque legível por cor **e** texto **e** símbolo,
 * conforme critério de acessibilidade da Sprint 4.
 */
export function StockLevelBadge({ balance, minimumStock }: StockLevelBadgeProps) {
  const level = stockLevel({ balance, minimumStock });
  return (
    <span data-testid={`stock-level-${level}`}>
      <StatusBadge
        value={levelLabel[level]}
        variant={levelVariant[level] as "available" | "pending" | "unavailable"}
      />
      <span className="sr-only">{levelSymbol[level]}</span>
    </span>
  );
}
