import { Calendar, FileText } from "lucide-react";
import type { Calibration } from "../domain/rules";
import { CALIBRATION_RESULT } from "../domain/rules";

interface CalibracaoCardProps {
  calibracao: Calibration;
}

const RESULT_LABEL: Record<string, string> = {
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  nao_aplicavel: "Não aplicável",
};

export function CalibracaoCard({ calibracao }: CalibracaoCardProps) {
  const label = RESULT_LABEL[calibracao.result] ?? calibracao.result;

  const isAprovado = calibracao.result === CALIBRATION_RESULT.APROVADO;
  const isReprovado = calibracao.result === CALIBRATION_RESULT.REPROVADO;
  const statusClass =
    isAprovado
      ? "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
      : isReprovado
        ? "inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700"
        : "inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700";

  const dot = isAprovado ? "●" : isReprovado ? "✕" : "⊘";

  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4" aria-hidden="true" />
              {new Date(calibracao.executionDate).toLocaleDateString("pt-BR")}
            </span>
            <span className={statusClass}>
              <span className="mr-1.5" aria-hidden="true">{dot}</span>
              {label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Responsável: {calibracao.responsibleId}</p>
          {calibracao.note && <p className="mt-1 text-sm text-muted-foreground">{calibracao.note}</p>}
          {calibracao.certificateRef && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="size-4" aria-hidden="true" />
              <span className="truncate">Certificado/laudo: {calibracao.certificateRef}</span>
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
