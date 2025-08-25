"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { Categorie } from "./StepModel";
import type { QuoteItem } from "./QuoteCard";
import InfoTip from "./InfoTip";

// 👉 Importe le fichier généré : src/data/deviceColors.ts
import { DEVICE_COLORS } from "../data/deviceColors";

export type StepRepairsProps = {
  data: Categorie[];
  selectedCategory?: string;
  selectedModel?: string;
  items: QuoteItem[];
  onChangeItems: (items: QuoteItem[]) => void;
};

type Row = { id: string; label: string; price: number; group: "part" | "extra" };

const formatPrice = (n: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);

/* ──────────────────────────────────────────────────────────────────────────────
   Couleurs — helpers
   ────────────────────────────────────────────────────────────────────────────── */
const TTL_MS = 15 * 60 * 1000;

function ttlKey(cat: string | undefined, model: string | undefined, label: string) {
  return `recophone:color:${cat ?? ""}|${model ?? ""}|${label}`;
}
function ttlGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: T; e: number };
    if (!parsed.e || Date.now() > parsed.e) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}
function ttlSet<T>(key: string, v: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ v, e: Date.now() + TTL_MS }));
  } catch {}
}

// mapping plus permissif
function brandKeyFromCategory(cat?: string): "apple" | "samsung_s" | "samsung_a" | "xiaomi" | null {
  if (!cat) return null;
  const c = cat.toLowerCase();
  if (c.startsWith("iphone")) return "apple";
  if (c.includes("samsung") && (c.includes("série s") || c.includes("serie s") || c.includes("galaxy s"))) return "samsung_s";
  if (c.includes("samsung") && (c.includes("série a") || c.includes("serie a") || c.includes("galaxy a"))) return "samsung_a";
  if (c.includes("xiaomi") || c.includes("redmi") || c.includes("poco")) return "xiaomi";
  return null;
}

function requiresColor(label: string): { part: "back" | "frame" } | null {
  const l = label.toLowerCase();
  if (/(face arrière|dos|back (glass|cover)|coque arrière)/i.test(l)) return { part: "back" };
  if (/(châssis|chassis|frame)/i.test(l)) return { part: "frame" };
  return null;
}

/* ──────────────────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────────────────── */
const StepRepairs: React.FC<StepRepairsProps> = ({
  data,
  selectedCategory,
  selectedModel,
  items,
  onChangeItems,
}) => {
  // 1) Pièces du JSON (ordre strict)
  const partRows: Row[] = useMemo(() => {
    if (!selectedCategory || !selectedModel) return [];
    const cat = data.find((c) => c.categorie === selectedCategory);
    const mod = cat?.modeles.find((m) => m.nom === selectedModel);
    const reps = mod?.reparations ?? [];
    return reps.map((r, i) => ({
      id: `p-${i}`,
      label: r.type,
      price: r.prix,
      group: "part",
    }));
  }, [data, selectedCategory, selectedModel]);

  // 2) Services supplémentaires
  const extraRows: Row[] = useMemo(
    () => [
      { id: "x-desoxy", label: "Désoxydation", price: 80, group: "extra" },
      { id: "x-data", label: "Récupération / Transfert de données", price: 50, group: "extra" },
      { id: "x-clean", label: "Nettoyage & Diagnostic", price: 15, group: "extra" },
    ],
    []
  );

  const selectedSet = useMemo(() => new Set(items.map((it) => it.key)), [items]);
  const isChecked = (row: Row) => selectedSet.has(row.label);
  const allRows = useMemo<Row[]>(() => [...partRows, ...extraRows], [partRows, extraRows]);

  // 3) Couleurs disponibles pour le modèle (si concerné)
  const brandKey = brandKeyFromCategory(selectedCategory ?? "");
  const modelColors: string[] = useMemo(() => {
    if (!brandKey || !selectedModel) return [];
    return DEVICE_COLORS[brandKey]?.[selectedModel] ?? [];
  }, [brandKey, selectedModel]);

  // 4) State couleur par libellé (persisté 15 min)
  const [colorByLabel, setColorByLabel] = useState<Record<string, string | null>>({});

  // Préremplissage depuis items (meta) et localStorage
  useEffect(() => {
    const next: Record<string, string | null> = {};
    for (const row of partRows) {
      const need = requiresColor(row.label);
      if (!need) continue;
      // depuis items.meta si présent
      const fromItem = items.find((it) => it.key === row.label)?.meta?.color ?? undefined;
      if (typeof fromItem !== "undefined") {
        next[row.label] = fromItem;
        continue;
      }
      // sinon TTL
      const k = ttlKey(selectedCategory, selectedModel, row.label);
      const v = ttlGet<string | null>(k);
      if (v !== null) next[row.label] = v;
    }
    if (Object.keys(next).length > 0) setColorByLabel((old) => ({ ...old, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedModel, partRows.length]);

  // Mise à jour couleur pour un row + mise à jour items sélectionnés
  const setRowColor = (row: Row, value: string | null, partKind: "back" | "frame") => {
    setColorByLabel((m) => ({ ...m, [row.label]: value }));
    ttlSet(ttlKey(selectedCategory, selectedModel, row.label), value);

    // si l'item est déjà sélectionné, on pousse la meta immédiatement
    if (selectedSet.has(row.label)) {
      const nextItems = items.map((it) =>
        it.key === row.label
          ? { ...it, meta: { ...(it.meta ?? {}), color: value, partKind } }
          : it
      );
      onChangeItems(nextItems);
    }
  };

  // Sélection/désélection d'une réparation
  const toggle = (row: Row) => {
    const next = new Set(selectedSet);
    if (next.has(row.label)) next.delete(row.label);
    else next.add(row.label);

    // Recalcule les items dans l’ordre : pièces JSON -> services
    const nextItems: QuoteItem[] = allRows
      .filter((r) => next.has(r.label))
      .map((r) => {
        const base: QuoteItem = { key: r.label, label: r.label, price: r.price };
        const need = requiresColor(r.label);
        if (need) {
          base.meta = {
            ...(base.meta ?? {}),
            partKind: need.part,
            color: colorByLabel[r.label] ?? null, // null = "Je ne sais pas"
          };
        }
        return base;
      });

    onChangeItems(nextItems);
  };

  if (!selectedCategory || !selectedModel) {
    return (
      <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 p-4 rounded-xl">
        Sélectionnez d’abord un <strong>appareil</strong>.
      </div>
    );
  }

  return (
    <section aria-labelledby="step-repairs-title" className="w-full">
      <header className="mb-3">
        <h2 id="step-repairs-title" className="text-xl font-semibold text-[#222]">
          3) Choisissez vos réparations
        </h2>
        <p className="text-sm text-gray-600">
          Cochez les éléments à réparer. Certains nécessitent la <strong>couleur</strong> (dos/châssis).
        </p>
      </header>

      {/* --- Pièces principales (issues du JSON) --- */}
      {partRows.length > 0 ? (
        <ul className="rounded-2xl border border-gray-200 bg-white divide-y">
          {partRows.map((row) => {
            const checked = isChecked(row);
            const need = requiresColor(row.label);
            const showColorPicker = !!need && checked;

            return (
              <li key={row.id} className="p-3">
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Checkbox */}
                  <div className="col-span-2 sm:col-span-1 flex items-center">
                    <input
                      id={`rp-${row.id}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-[#54b435] focus:ring-[#54b435]"
                      checked={checked}
                      onChange={() => toggle(row)}
                    />
                  </div>

                  {/* Label */}
                  <label
                    htmlFor={`rp-${row.id}`}
                    className="col-span-7 sm:col-span-8 text-sm text-[#222] cursor-pointer"
                  >
                    {row.label}
                  </label>

                  {/* Prix */}
                  <div className="col-span-3 sm:col-span-3 text-right text-sm font-medium">
                    <span className={checked ? "" : "text-gray-500"}>{formatPrice(row.price)}</span>
                  </div>
                </div>

                {/* Sélecteur de couleur (liste déroulante) */}
                {showColorPicker && (
                  <div className="mt-2 pl-7 sm:pl-10">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-700">
                          Couleur {need?.part === "back" ? "— Face arrière" : "— Châssis"}
                        </span>
                        <InfoTip content="Choisissez la couleur officielle du modèle. Laissez « Je ne sais pas » si vous n’êtes pas sûr." />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <select
                          className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
                          value={colorByLabel[row.label] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? null : e.target.value;
                            setRowColor(row, val, need!.part);
                          }}
                        >
                          {/* Valeur vide = Je ne sais pas */}
                          <option value="">Je ne sais pas</option>
                          {modelColors.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>

                        {/* Message d’info si aucune couleur trouvée */}
                        {modelColors.length === 0 && (
                          <span className="text-[11px] text-gray-500">
                            Aucune couleur définie pour ce modèle dans la base — le client pourra préciser plus tard.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-300 p-4 rounded-xl">
          Aucune réparation spécifique listée pour <strong>{selectedModel}</strong>.
        </div>
      )}

      {/* --- Services supplémentaires --- */}
      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-[#222]">Services (optionnel)</h3>
        <ul className="rounded-2xl border border-gray-200 bg-white divide-y">
          {extraRows.map((row) => {
            const checked = isChecked(row);
            return (
              <li key={row.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2 sm:col-span-1 flex items-center">
                  <input
                    id={`rx-${row.id}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#54b435] focus:ring-[#54b435]"
                    checked={checked}
                    onChange={() => toggle(row)}
                  />
                </div>
                <label
                  htmlFor={`rx-${row.id}`}
                  className="col-span-7 sm:col-span-8 text-sm text-[#222] cursor-pointer"
                >
                  {row.label}
                </label>
                <div className="col-span-3 sm:col-span-3 text-right text-sm font-medium">
                  <span className={checked ? "" : "text-gray-500"}>{formatPrice(row.price)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-2 text-[11px] text-gray-500">
        Astuce : vous pouvez sélectionner plusieurs éléments (ex. écran + désoxydation).
      </p>
    </section>
  );
};

export default StepRepairs;
