export default function AdminHome() {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
        <span className="text-xs text-gray-500">Version initiale</span>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500 mb-1">Devis en attente</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500 mb-1">Paiements Stripe (24h)</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500 mb-1">Stock pièces (alerte)</p>
          <p className="text-2xl font-semibold">—</p>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <p className="text-sm text-gray-600">
          Bienvenue Ben 👋 — choisis une section dans la navigation à gauche.
        </p>
      </div>
    </section>
  );
}
