import LabCard from "./LabCard";

interface Lab {
  id: string;
  name: string;
  local: string;
  capacity?: number | null;
  status: string;
}

interface LabListProps {
  labs: Lab[];
}

export default function LabList({ labs }: LabListProps) {
  if (labs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nenhum laboratório cadastrado.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {labs.map((lab) => (
        <li key={lab.id}>
          <LabCard {...lab} />
        </li>
      ))}
    </ul>
  );
}
