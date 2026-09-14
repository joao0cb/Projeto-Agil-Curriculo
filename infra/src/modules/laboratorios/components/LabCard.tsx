import { StatusBadge } from "../../components/StatusBadge";

interface LabCardProps {
  id: string;
  name: string;
  local: string;
  capacity?: number | null;
  status: string;
}

export default function LabCard({ name, local, capacity, status }: LabCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg text-foreground">{name}</h3>
        <StatusBadge value={status} />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div>
          <dt className="font-medium text-foreground">Local</dt>
          <dd>{local}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Capacidade</dt>
          <dd>{capacity ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
