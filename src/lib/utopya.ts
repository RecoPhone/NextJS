import type { UtopyaPayload, UtopyaItem } from "@/types/utopya";

export const UTOPYA_JSON =
  process.env.NEXT_PUBLIC_UTOPYA_JSON_URL ??
  "https://download.recophone.be/data/utopya.json"; // ← ton JSON public

export const REVALIDATE_SECONDS = 600; // 10 min

export function parsePriceToNumber(price_raw_eur?: string | null): number | null {
  if (!price_raw_eur) return null;
  const raw = price_raw_eur.replace(/[^\d,.\-]/g, "");
  if (!raw) return null;
  const normalized =
    raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw;
  const n = Number(normalized);
  return isNaN(n) ? null : n;
}

export function extractBrand(name?: string | null): string | null {
  if (!name) return null;
  const list = ["Apple", "Samsung", "Xiaomi"];
  const hit = list.find(b => name.toLowerCase().includes(b.toLowerCase()));
  return hit ?? (name.split(" ")[0] || null);
}

export async function fetchUtopya(): Promise<UtopyaPayload> {
  const res = await fetch(UTOPYA_JSON, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Fetch utopya.json failed: ${res.status}`);
  const data = (await res.json()) as UtopyaPayload;

  // small sanity + enrichissements utiles (prixNum/brand)
  const items: UtopyaItem[] = (data.items ?? []).map(it => ({
    ...it,
    capacity: it.capacity ?? (it.name?.match(/(\d+)\s?(GB|Go|TB)/i)?.[0]?.replace("Go","GB") ?? null),
  }));
  return { count: items.length, items };
}
