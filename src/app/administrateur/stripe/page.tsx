export default function StripePage() {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">Stripe</h1>
      </header>

      <div className="rounded-xl border p-4 text-sm text-gray-600">
        Tableau de bord Stripe à venir : paiements récents, abonnements, liens de paiement.
        <br />
        Tu pourras ici consommer tes endpoints internes (ex: <code>/api/admin/stripe/...</code>).
      </div>
    </section>
  );
}
