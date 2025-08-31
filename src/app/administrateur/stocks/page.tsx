"use client";

import { useState } from "react";

export default function StocksPage() {
  const [brand, setBrand] = useState("Apple");

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold">Stocks fournisseur</h1>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#54b435]"
        >
          <option>Apple</option>
          <option>Samsung</option>
          <option>Xiaomi</option>
          <option>OnePlus</option>
          <option>Google</option>
        </select>
      </header>

      <div className="rounded-xl border p-4 text-sm text-gray-600">
        Placeholder d’intégration API fournisseur (GET /products) avec Bearer token. <br />
        On affichera un tableau paginé + filtre marque/modèle/type.
      </div>
    </section>
  );
}
