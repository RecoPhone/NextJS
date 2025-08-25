import Link from "next/link";

export default function CTA() {
  return (
    <section id="cta" className="container mx-auto px-4 py-16 lg:py-24">
      <div className="rounded-3xl bg-[#edfbe2] p-8 md:p-12 text-center shadow">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Prêt à faire durer votre appareil ?
        </h2>
        <p className="text-gray-700 mb-8 max-w-3xl mx-auto">
          Réparons ce qui doit l’être, reconditionnons quand c’est pertinent — et choisissez la{" "}
          <strong>tranquillité d’esprit</strong> avec nos <strong>abonnements</strong>.  
          RecoPhone, c’est aussi des <strong>smartphones reconditionnés</strong> testés et des{" "}
          <strong>accessoires</strong> utiles et durables.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/devis"
            className="px-6 py-3 rounded-2xl bg-[#54b435] text-white font-semibold hover:opacity-90 transition"
          >
            Devis réparation
          </Link>
          <Link
            href="/abonnements"
            className="px-6 py-3 rounded-2xl border border-[#54b435] text-[#54b435] font-semibold hover:bg-[#54b435]/10 transition"
          >
            Voir les abonnements
          </Link>
          <Link
            href="/reconditionnes"
            className="px-6 py-3 rounded-2xl border border-gray-300 text-[#222] font-semibold hover:bg-white transition"
          >
            Smartphones reconditionnés
          </Link>
        </div>
      </div>
    </section>
  );
}
