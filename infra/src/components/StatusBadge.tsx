import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type StatusVariant =
  | "available"
  | "pending"
  | "unavailable"
  | "maintenance";

const variantClasses: Record<StatusVariant, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500",
  pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500",
  unavailable: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500",
  maintenance: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 focus:ring-sky-500",
};

const variant = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: { variant: variantClasses },
    defaultVariants: {
      variant: "available" as StatusVariant,
    },
  }
);

export interface StatusBadgeProps {
  value: string;
  variant?: StatusVariant;
}

const statusMap: Record<string, StatusVariant> = {
  // equipamento / laboratório
  disponível: "available",
  disponivel: "available",
  "em uso": "pending",
  pendente: "pending",
  atrasado: "pending",
  indisponível: "unavailable",
  indisponivel: "unavailable",
  quebrado: "unavailable",
  "em manutenção": "maintenance",
  "em manutencao": "maintenance",
  manutencao: "maintenance",
  maintenance: "maintenance",
  // chamado de manutenção
  aberto: "unavailable",
  "aguardando peca": "pending",
  concluido: "available",
  cancelado: "pending",
};

function statusSymbol(variantName: StatusVariant): string {
  return variantName === "available" ? "●" : variantName === "maintenance" ? "◐" : variantName === "unavailable" ? "✕" : "◌";
}

export function StatusBadge({ value, variant: forced }: StatusBadgeProps) {
  const resolved: StatusVariant =
    forced ?? statusMap[value.toLowerCase().trim()] ?? "pending";
  return (
    <span className={twMerge(clsx(variant({ variant: resolved })))}>
      <span className="mr-1.5" aria-hidden="true">
        {statusSymbol(resolved)}
      </span>
      {value}
    </span>
  );
}
