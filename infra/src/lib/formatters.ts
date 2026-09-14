export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
