import Link from "next/link";

export default function Origin() {
  const tiles = [
    { title: "Réparation & reconditionnement", text: "Approche durable, pièces testées, conseils clairs." },
    { title: "Abonnements sérénité", text: "Pour la tranquillité d’esprit au quotidien." },
    { title: "Smartphones reconditionnés", text: "Une alternative fiable et économique au neuf." },
    { title: "Accessoires utiles & durables", text: "Protège-écrans, coques, câbles, chargeurs." },
    { title: "Zones desservies", text: "Fleurus, Sombreffe, Sambreville, Temploux, Jemeppe-sur-Sambre, Spy." },
    { title: "Proximité client", text: "Vous échangez directement avec la personne qui répare." },
  ];

  return (
    <section id="origine" className="container mx-auto px-4 py-16 lg:py-24">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        {/* Texte narratif */}
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">D’où vient RecoPhone ?</h2>
          <div className="space-y-5 text-gray-700 leading-relaxed">
            <p>
              Moi, c’est <strong>Ben</strong>. J’ai fait mes armes chez Belwatech (devenu Helpix).
              Quand la crise du Covid a forcé l’enseigne à fermer, l’évidence s’est imposée :
              <strong> réparer</strong> et <strong>reconditionner</strong> ne sont pas juste un métier —
              c’est ma manière d’agir pour une <strong>économie plus sobre</strong> et des appareils qui durent.
            </p>
            <p>
              J’ai lancé <strong>RecoPhone</strong> à côté de mon 38h, dans un petit atelier à domicile à Marchienne.
              De fil en aiguille, la demande a grandi. En <strong>août 2025</strong>, j’ai pris mon élan :
              passage à <strong>temps plein</strong> pour servir la communauté au quotidien.
            </p>
            <p>
              Aujourd’hui, RecoPhone est installé au{" "}
              <strong>Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre</strong> (Comptoir Informatique) et accompagne
              les particuliers et pros de <strong>Fleurus</strong>, <strong>Sombreffe</strong>, <strong>Sambreville</strong>,{" "}
              <strong>Temploux</strong>, <strong>Jemeppe-sur-Sambre</strong> et <strong>Spy</strong>.
            </p>
          </div>

          {/* Badges valeurs + lien */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {["Économie", "Durabilité", "Proximité client"].map((b) => (
              <span key={b} className="px-3 py-1 rounded-full bg-[#edfbe2] border border-[#54b435]/30 text-sm">
                {b}
              </span>
            ))}
            <Link href="#valeurs" className="ms-2 text-[#54b435] font-semibold underline underline-offset-4">
              Voir nos engagements
            </Link>
          </div>
        </div>

        {/* Tuiles “confiance” (pas d’images → pas de répétition) */}
        <div className="grid sm:grid-cols-2 gap-4">
          {tiles.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-gray-700 text-sm mt-1">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
