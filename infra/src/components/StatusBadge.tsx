import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const variants: Record<
  StatusVariant,
  string
> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500",
  pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500",
  unavailable: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500",
  maintenance: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 focus:ring-sky-500",
};

export type StatusVariant = "available" | "pending" | "unavailable" | "maintenance";

const variant = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: { variant: variants },
    defaultVariants: {
      variant: "available" as const,
    },
  }
);

interface StatusBadgeProps {
  value: string;
  variant?: StatusVariant;
}

const statusMap: Record<string, StatusVariant> = {
  disponível: "available",
  disponivel: "available",
  pendente: "pending",
  atrasado: "pending",
  indisponível: "unavailable",
  indisponivel: "unavailable",
  "em manutenção": "maintenance",
  mantencao: "maintenance",
  maintenance: "maintenance",
};

function statusSymbol(variant: StatusVariant): string {
  return variant === "available" ? "●" : variant === "maintenance" ? "◐" : variant === "unavailable" ? "✕" : "◌";
}

export function StatusBadge({ value, variant: forced }: StatusBadgeProps) {
  const mapped: StatusVariant =
    forced ?? statusMap[value.toLowerCase().trim()] ?? "pending";
  return (
    <span className={twMerge(clsx(variant({ variant: mapped })))}>
      <span className="mr-1.5" aria-hidden="true">
        {statusSymbol(mapped)}
      </span>
      {value}
    </span>
  );
}
