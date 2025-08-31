import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[#222] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Col 1 : Présentation */}
          <div>
            <h3 className="text-lg font-bold">RecoPhone</h3>
            <p className="mt-3 text-sm text-white/80">
              Réparation & reconditionnement de smartphones/tablettes. Écologie et économie circulaire.
            </p>
          </div>

          {/* Col 2 : Navigation (centrée en desktop) */}
          <nav aria-label="Pied de page - Navigation" className="md:justify-self-center md:text-center">
            <h4 className="text-sm font-semibold text-white/80">Navigation</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:underline hover:decoration-[#54b435]" href="/">Accueil</Link></li>
              <li><Link className="hover:underline hover:decoration-[#54b435]" href="/abonnements">Abonnements</Link></li>
              <li><Link className="hover:underline hover:decoration-[#54b435]" href="/re-smartphones">[RE]Smartphones</Link></li>
              <li><Link className="hover:underline hover:decoration-[#54b435]" href="/histoire">Histoire</Link></li>
              <li><Link className="hover:underline hover:decoration-[#54b435]" href="/devis">Devis gratuit</Link></li>
            </ul>
          </nav>

          {/* Col 3 : Contact & Légal (aligné à droite en desktop) */}
          <div className="md:justify-self-end md:text-right md:max-w-xs md:ml-auto">
            <h4 className="text-sm font-semibold text-white/80">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>📍 Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre</li>
              <li>📞 0492/09.05.33</li>
              <li>📧 hello@recophone.be</li>
              <li>TVA : <span className="font-semibold">BE0695866221</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} RecoPhone — Tous droits réservés.</p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
            <li>
              <Link className="hover:underline hover:decoration-[#54b435]" href="/legal/cgv">
                CGV
              </Link>
            </li>
            <li>
              <Link className="hover:underline hover:decoration-[#54b435]" href="/legal/confidentialite">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <span className="text-white/50">Fait avec 💚 en Belgique par DevMySite</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
