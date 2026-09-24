import { Calendar, FileText } from "lucide-react";
import type { Calibration } from "../domain/rules";
import { CALIBRATION_RESULT } from "../domain/rules";
import { StatusBadge } from "../../../components/StatusBadge";

interface CalibracaoCardProps {
  calibracao: Calibration;
}

export function CalibracaoCard({ calibracao }: CalibracaoCardProps) {
  void CALIBRATION_RESULT; // valores referenciados pelos testes de domínio; card usa StatusBadge

  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4" aria-hidden="true" />
              {new Date(calibracao.executionDate).toLocaleDateString("pt-BR")}
            </span>
            <StatusBadge value={calibracao.result} />
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
