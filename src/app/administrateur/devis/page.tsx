"use client";

import { useState } from "react";

export default function DevisPage() {
  const [search, setSearch] = useState("");

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold">Devis</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email, modèle...)"
          className="w-72 max-w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#54b435]"
        />
      </header>

      <div className="rounded-xl border p-4 text-sm text-gray-600">
        Liste des devis (à brancher sur ta source — JSON / API).<br />
        Filtrage côté client avec <code>search</code> (placeholder).
      </div>
    </section>
  );
}
