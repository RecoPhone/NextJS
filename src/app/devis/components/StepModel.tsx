"use client";

import React, { FC, useEffect, useMemo, useState } from "react";

/** ===== Types alignés sur prices.json ===== */
type Reparation = { type: string; prix: number };
type Modele = { nom: string; reparations: Reparation[] };
export type Categorie = { categorie: string; modeles: Modele[] };

export type StepModelProps = {
  data: Categorie[];
  selectedCategory?: string;
  selectedModel?: string;
  onSelect: (category: string, model: string) => void;
};

/** ===== Helpers ===== */
type Brand = "Apple" | "Samsung" | "Xiaomi" | "Autre";

const brandOfCategory = (label: string): Brand => {
  const s = label.toLowerCase();
  if (s.includes("iphone") || s.includes("ipad") || s.startsWith("apple")) return "Apple";
  if (s.includes("samsung") || s.includes("galaxy")) return "Samsung";
  if (s.includes("xiaomi") || s.includes("redmi") || s.includes("poco") || s.includes(" mi")) return "Xiaomi";
  return "Autre";
};

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));

/** ===== Component ===== */
const StepModel: FC<StepModelProps> = ({ data, selectedCategory, selectedModel, onSelect }) => {
  // ----- 1) Sources (brands -> categories -> models)
  const brands = useMemo<Brand[]>(() => {
    const found = data.map((c) => brandOfCategory(c.categorie));
    const order: Brand[] = ["Apple", "Samsung", "Xiaomi", "Autre"];
    return order.filter((b) => found.includes(b));
  }, [data]);

  const categoriesByBrand = useMemo(() => {
    const map = new Map<Brand, string[]>();
    for (const b of brands) map.set(b, []);
    for (const c of data) {
      const b = brandOfCategory(c.categorie);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(c.categorie);
    }
    for (const b of map.keys()) map.set(b, unique(map.get(b)!));
    return map;
  }, [data, brands]);

  const modelsByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of data) {
      map.set(c.categorie, unique(c.modeles.map((m) => m.nom)));
    }
    return map;
  }, [data]);

  // ----- 2) UI State (selections locales)
  const [brand, setBrand] = useState<Brand | "">("");
  const [category, setCategory] = useState<string>("");
  const [model, setModel] = useState<string>("");

  // ----- 3) Options dynamiques
  const categoryOptions = useMemo<string[]>(() => {
    if (!brand) return [];
    return categoriesByBrand.get(brand) ?? [];
  }, [brand, categoriesByBrand]);

  const modelOptions = useMemo<string[]>(() => {
    if (!category) return [];
    return modelsByCategory.get(category) ?? [];
  }, [category, modelsByCategory]);

  // ----- 4) Auto-sélections pour réduire les clics
  // Si une marque est choisie et qu'il n'y a qu'une seule catégorie => l'auto-sélectionner
  useEffect(() => {
    if (!brand) return;
    if (!category) {
      if (categoryOptions.length === 1) setCategory(categoryOptions[0]);
    } else {
      // Si la catégorie sélectionnée ne correspond plus à la marque (changement de marque), reset
      if (!categoryOptions.includes(category)) {
        setCategory("");
        setModel("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, categoryOptions.join("|")]);

  // Si une catégorie est choisie et qu'il n'y a qu'un seul modèle => l'auto-sélectionner + notifier
  useEffect(() => {
    if (!category) return;
    if (!model) {
      if (modelOptions.length === 1) {
        const m = modelOptions[0];
        setModel(m);
        onSelect(category, m);
      }
    } else {
      // Si le modèle ne fait plus partie des options (changement de catégorie), reset
      if (!modelOptions.includes(model)) {
        setModel("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, modelOptions.join("|")]);

  // ----- 5) Synchronisation si la page a déjà un état (ex: back/forward)
  useEffect(() => {
    if (!selectedCategory && !selectedModel) return;
    if (selectedCategory) {
      const inferredBrand = brandOfCategory(selectedCategory);
      if (brands.includes(inferredBrand)) setBrand(inferredBrand);
      setCategory(selectedCategory);
    }
    if (selectedModel) {
      setModel(selectedModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedModel]);

  // ----- 6) Handlers
  const onChangeBrand = (val: string) => {
    setBrand(val as Brand);
    setCategory("");
    setModel("");
  };

  const onChangeCategory = (val: string) => {
    setCategory(val);
    setModel("");
  };

  const onChangeModel = (val: string) => {
    setModel(val);
    if (val) onSelect(category, val);
  };

  // ----- 7) UI
  return (
    <section aria-labelledby="step-model-title" className="w-full">
      <header className="mb-4">
        <h2 id="step-model-title" className="text-xl font-semibold text-[#222]">
          1) Choisissez votre appareil
        </h2>
        <p className="text-sm text-gray-600">
          Sélectionnez <strong>Marque</strong>, puis <strong>Série</strong>, puis <strong>Modèle</strong>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Marque */}
        <div className="col-span-1">
          <label htmlFor="brand" className="block text-xs font-medium text-gray-700 mb-1">
            Marque
          </label>
          <select
            id="brand"
            value={brand}
            onChange={(e) => onChangeBrand(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435]"
          >
            <option value="" disabled>— Sélectionnez une marque —</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Catégorie / Série */}
        <div className="col-span-1">
          <label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1">
            Série / Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => onChangeCategory(e.target.value)}
            disabled={!brand}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435] disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="" disabled>— Sélectionnez une série —</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Modèle */}
        <div className="col-span-1">
          <label htmlFor="model" className="block text-xs font-medium text-gray-700 mb-1">
            Modèle
          </label>
          <select
            id="model"
            value={model}
            onChange={(e) => onChangeModel(e.target.value)}
            disabled={!category}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#54b435] disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="" disabled>— Sélectionnez un modèle —</option>
            {modelOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mini-résumé compact (aide visuelle) */}
      <div className="mt-3 text-xs text-gray-600">
        {brand && <span className="mr-2">Marque : <strong>{brand}</strong></span>}
        {category && <span className="mr-2">Série : <strong>{category}</strong></span>}
        {model && <span>Modèle : <strong>{model}</strong></span>}
      </div>

      {/* Reset */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => { setBrand(""); setCategory(""); setModel(""); }}
          className="text-[11px] text-gray-600 hover:underline"
        >
          Réinitialiser la sélection
        </button>
      </div>
    </section>
  );
};

export default StepModel;
