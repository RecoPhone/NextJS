export function eur(value: number) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}