import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type StatusVariant =
  | "available"
  | "pending"
  | "unavailable"
  | "maintenance"
  | "neutral";

const variantClasses: Record<StatusVariant, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-500",
  pending: "border-amber-200 bg-amber-50 text-amber-700 focus:ring-amber-500",
  unavailable: "border-red-200 bg-red-50 text-red-700 focus:ring-red-500",
  maintenance: "border-sky-200 bg-sky-50 text-sky-700 focus:ring-sky-500",
  neutral: "border-border bg-muted text-muted-foreground focus:ring-ring",
};

const variant = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: { variant: variantClasses },
    defaultVariants: { variant: "neutral" as StatusVariant },
  },
);

export interface StatusMeta {
  /** Variante visual (cor da severidade). */
  variant: StatusVariant;
  /** Símbolo distinto por estado — nunca dois estados diferentes com o mesmo glifo. */
  symbol: string;
  /** Descrição para humanos, usada como title/aria-label (auditoria 2.6). */
  description: string;
}

/**
 * Fonte única de verdade status → (variante, símbolo, descrição).
 *
 * Chaves são normalizadas: minúsculas e sem acentos (a busca também
 * normaliza, então "Concluído" e "concluido" resolvem igual).
 *
 * Semântica corrigida na auditoria UX (achados 2.1/2.2/2.5):
 * - Chamado "aberto" é fila de trabalho (pending), não problema (unavailable);
 * - "cancelado" é encerramento (neutral), não espera (pending);
 * - "em uso" e "em manutenção" têm símbolos diferentes (◔ e ⚙).
 */
export const STATUS_META: Record<string, StatusMeta> = {
  // Equipamentos
  disponivel: { variant: "available", symbol: "●", description: "Disponível para reservas." },
  "em uso": { variant: "pending", symbol: "◔", description: "Em uso neste momento; confira a agenda antes de reservar." },
  pendente: { variant: "pending", symbol: "◔", description: "Aguardando ação ou confirmação." },
  atrasado: { variant: "pending", symbol: "◔", description: "Prazo vencido — requer atenção." },
  "em manutencao": { variant: "maintenance", symbol: "⚙", description: "Em manutenção — indisponível para novas reservas." },
  indisponivel: { variant: "unavailable", symbol: "⊘", description: "Indisponível para reservas." },
  quebrado: { variant: "unavailable", symbol: "✕", description: "Com defeito registrado — resolva o chamado antes de reservar." },

  // Chamados de manutenção
  aberto: { variant: "pending", symbol: "○", description: "Chamado aberto, aguardando atendimento." },
  "em andamento": { variant: "maintenance", symbol: "◐", description: "Atendimento em andamento." },
  "aguardando peca": { variant: "pending", symbol: "◔", description: "Parado aguardando peça ou insumo." },
  concluido: { variant: "available", symbol: "●", description: "Concluído." },
  cancelado: { variant: "neutral", symbol: "⊘", description: "Cancelado — sem impacto no fluxo." },

  // Manutenções preventivas
  programada: { variant: "pending", symbol: "○", description: "Programada para execução futura." },
  concluida: { variant: "available", symbol: "●", description: "Execução concluída." },
  "nao aplicavel": { variant: "neutral", symbol: "—", description: "Não se aplica a este registro." },

  // Calibrações
  aprovado: { variant: "available", symbol: "●", description: "Calibração aprovada." },
  reprovado: { variant: "unavailable", symbol: "✕", description: "Calibração reprovada — o equipamento requer ajuste." },
};

/** Minúsculas + sem acentos + underscores como espaços: "Concluído" → "concluido", "nao_aplicavel" → "nao aplicavel". */
export function normalizeStatusKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/_/g, " ");
}

/** Busca o metadado canônico de um status/label (case/acento-insensitive). */
export function statusMetaFor(value: string): StatusMeta | undefined {
  return STATUS_META[normalizeStatusKey(value)];
}

/**
 * Fonte única de rótulos legíveis por status (auditoria UX — H4, achado 4.1):
 * componentes nunca mais mantêm mapas locais status → label.
 */
export const STATUS_LABELS: Record<string, string> = {
  // Equipamentos
  disponivel: "Disponível",
  "em uso": "Em uso",
  pendente: "Pendente",
  atrasado: "Atrasado",
  "em manutencao": "Em manutenção",
  indisponivel: "Indisponível",
  quebrado: "Quebrado",

  // Chamados de manutenção
  aberto: "Aberto",
  "em andamento": "Em andamento",
  "aguardando peca": "Aguardando peça",
  concluido: "Concluído",
  cancelado: "Cancelado",

  // Manutenções preventivas
  programada: "Programada",
  concluida: "Concluída",
  "nao aplicavel": "Não aplicável",

  // Calibrações
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

/** Rótulo canônico e legível de um status (case/acento/underscore-insensitive). */
export function statusLabelFor(value: string): string {
  return STATUS_LABELS[normalizeStatusKey(value)] ?? value;
}

/** Resolve a variante de um status (útil fora do badge, ex.: classes de linha). */
export function statusVariantFor(value: string): StatusVariant | undefined {
  return statusMetaFor(value)?.variant;
}

export interface StatusBadgeProps {
  /** Valor ou label do status (case/acento-insensitive). */
  value: string;
  /** Força a variante, sobrescrevendo o mapeamento. */
  variant?: StatusVariant;
  /** Força o símbolo, sobrescrevendo o mapeamento. */
  symbol?: string;
  className?: string;
}

export function StatusBadge({ value, variant: forcedVariant, symbol: forcedSymbol, className }: StatusBadgeProps) {
  const meta = statusMetaFor(value);
  const resolved: StatusVariant = forcedVariant ?? meta?.variant ?? "neutral";
  const symbol = forcedSymbol ?? meta?.symbol ?? "○";
  const description = meta?.description;
  const label = statusLabelFor(value);

  return (
    <span
      className={twMerge(clsx(variant({ variant: resolved })), className)}
      title={description}
      aria-label={description ? `${label}: ${description}` : undefined}
    >
      <span className="mr-1.5" aria-hidden="true">
        {symbol}
      </span>
      {label}
    </span>
  );
}
