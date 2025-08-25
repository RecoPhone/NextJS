import Link from "next/link";

function MapFrame() {
  // Embed Google Maps sur l’adresse exacte (zoom modéré)
  const src =
    "https://www.google.com/maps?q=Rte+de+Saussin+38%2F23a,+5190+Jemeppe-sur-Sambre&output=embed";

  return (
    <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Hauteur fixe responsive : plus basse partout */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72">
        <iframe
          src={src}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label="Carte: RecoPhone — Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre"
        />
      </div>
    </div>
  );
}

export default function LocalTrust() {
  const cities = ["Fleurus", "Sombreffe", "Sambreville", "Temploux", "Jemeppe-sur-Sambre", "Spy"];

  const phoneDisplay = "+32 492 09 05 33";
  const phoneHref = "+32492090533";
  const email = "hello@recophone.be";

  return (
    <section id="local" className="bg-white">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Col gauche : ancrage local + villes + services */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ici, tout est local</h2>
            <p className="text-gray-700">
              RecoPhone est basé au <strong>Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre</strong> (Comptoir Informatique).
              Nous accompagnons particuliers et pros dans tout le bassin sambrevillois.
            </p>

            {/* Villes cibles */}
            <div className="mt-6 flex flex-wrap gap-2">
              {cities.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full bg-[#edfbe2] text-[#234] border border-[#54b435]/30 text-sm"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Services rapides */}
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Services rapides</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-gray-700">
                <li>• Écrans & batteries</li>
                <li>• Dock de charge</li>
                <li>• Caméras / lentilles</li>
                <li>• Face arrière</li>
                <li>• Diagnostics honnêtes</li>
                <li>• Conseils réemploi</li>
              </ul>
            </div>
          </div>

          {/* Col droite : carte + contact + horaires + actions */}
          <div>
            {/* 🗺️ Carte en premier */}
            <MapFrame />

            {/* Bloc infos */}
            <div className="mt-5 rounded-3xl border border-gray-200 p-6 bg-gray-50">
              <h3 className="font-semibold text-lg">Adresse & contact</h3>
              <div className="mt-2 text-gray-700">
                <p>
                  Rte de Saussin 38/23a<br />
                  5190 Jemeppe-sur-Sambre
                </p>
                <p className="mt-3">
                  Email :{" "}
                  <a href={`mailto:${email}`} className="text-[#54b435] underline underline-offset-2">
                    {email}
                  </a>
                </p>
                <p>
                  Téléphone :{" "}
                  <a href={`tel:${phoneHref}`} className="text-[#54b435] underline underline-offset-2">
                    {phoneDisplay}
                  </a>
                </p>
              </div>

              {/* Horaires */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Horaires</h4>
                <div className="rounded-2xl bg-white border border-gray-200 p-4">
                  <ul className="text-gray-700">
                    <li className="flex justify-between py-1">
                      <span>Lundi — Vendredi</span>
                      <span className="font-medium">09:00–12:00 · 13:00–17:30</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Samedi</span>
                      <span className="font-medium">Itinérance 09:00–17:00</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Dimanche</span>
                      <span className="font-medium">Fermé</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Le <strong>samedi</strong>, interventions uniquement <strong>en itinérance</strong> (sur rendez-vous).
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="https://www.google.com/maps/dir/?api=1&destination=Rte%20de%20Saussin%2038%2F23a%2C%205190%20Jemeppe-sur-Sambre"
                  className="px-4 py-2 rounded-xl bg-[#54b435] text-white font-semibold hover:opacity-90 transition"
                  rel="noopener noreferrer"
                >
                  Itinéraire
                </Link>
                <Link
                  href="/devis"
                  className="px-4 py-2 rounded-xl border border-[#54b435] text-[#54b435] font-semibold hover:bg-[#54b435]/10 transition"
                >
                  Demander un devis
                </Link>
                <a
                  href={`tel:${phoneHref}`}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-[#222] font-semibold hover:bg-gray-100 transition"
                >
                  Appeler
                </a>
                <a
                  href={`mailto:${email}`}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-[#222] font-semibold hover:bg-gray-100 transition"
                >
                  Écrire un mail
                </a>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Réparations smartphone & tablette. Garantie légale sur nos interventions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
