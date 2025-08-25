'use client'
/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useState } from "react";

// ------------------------------------------------------------
// FAQ SECTION — RecoPhone (UI ++, SEO ++, Tailwind 3.x safe)
// - Search bar + category chips
// - Accessible accordions (<details>/<summary>)
// - Smooth open animation via group-open + CSS grid trick (Tailwind 3.x)
// - JSON-LD (schema.org/FAQPage) for rich results
// - Brand colors: #edfbe2, #54b435, #ffffff, #222222
// ------------------------------------------------------------

type Category =
  | "Général"
  | "Réparations"
  | "À domicile"
  | "Devis & Prix"
  | "Garantie & Données"
  | "Reconditionné"
  | "Abonnements"
  | "Facturation";

type FaqItem = {
  id: string;
  category: Category;
  top?: boolean; // badge "Le + demandé"
  q: string;
  // Plain text (for SEO / JSON-LD)
  aText: string;
  // Rich UI answer (no <ul> inside <p> to avoid hydration issues)
  a: React.ReactNode;
};

const faqs: FaqItem[] = [
  {
    id: "services",
    category: "Général",
    top: true,
    q: "Quels services propose RecoPhone ?",
    aText:
      "Réparations de smartphones et tablettes, vente de smartphones reconditionnés, accessoires utiles et abonnements de tranquillité. Approche écologique et économie circulaire.",
    a: (
      <>
        Réparations <strong>smartphones & tablettes</strong>,
        <strong> reconditionné</strong>, accessoires utiles et
        <strong> abonnements de tranquillité</strong>, le tout avec une
        approche <strong>éco‑responsable</strong>.
      </>
    ),
  },
  {
    id: "delais-reparations",
    category: "Réparations",
    top: true,
    q: "Combien de temps prend une réparation ?",
    aText:
      "La plupart des réparations courantes (écran, batterie, connecteur) prennent 30 à 90 minutes selon le modèle et la disponibilité. Les iPads peuvent prendre plus de temps.",
    a: (
      <>
        La majorité des réparations (écran, batterie, connecteur) durent
        <strong> 30–90 min</strong> selon le modèle et la disponibilité.
        <br />Les <strong>iPads</strong> peuvent demander plus de temps.
      </>
    ),
  },
  {
    id: "rendez-vous",
    category: "Réparations",
    q: "Comment réserver un créneau ?",
    aText:
      "Utilisez le formulaire Devis : choisissez l’appareil et la réparation, puis sélectionnez un créneau. Les samedis sont dédiés à l’itinérance.",
    a: (
      <>
        Passe par notre formulaire <strong>Devis</strong> pour choisir
        l’appareil/la réparation, puis réserve un créneau.
        <br />Le <strong>samedi</strong> est dédié à l’itinérance.
      </>
    ),
  },
  {
    id: "zones-domicile",
    category: "À domicile",
    q: "Intervenez‑vous à domicile ? Dans quelles zones ?",
    aText:
      "Oui. Nous nous déplaçons notamment à Fleurus, Sombreffe, Sambreville, Temploux, Jemeppe‑sur‑Sambre, Spy et alentours. Samedi en itinérance.",
    a: (
      <>
        Oui. Nous couvrons
        <strong> Fleurus, Sombreffe, Sambreville, Temploux, Jemeppe‑sur‑Sambre, Spy</strong>
        et alentours. Le <strong>samedi</strong>, intervention en itinérance.
      </>
    ),
  },
  {
    id: "garantie",
    category: "Garantie & Données",
    top: true,
    q: "Vos pièces sont‑elles garanties ?",
    aText:
      "Oui, 12 mois contre défaut de fabrication. La garantie ne couvre pas les chocs, pressions ou contacts liquides.",
    a: (
      <>
        Oui, <strong>12 mois</strong> contre défaut de fabrication.
        <br />Sont exclus : chocs, pressions, <em>liquides</em> et mauvaise
        utilisation.
      </>
    ),
  },
  {
    id: "donnees",
    category: "Garantie & Données",
    q: "Mes données sont‑elles en sécurité pendant la réparation ?",
    aText:
      "Nous n’effaçons pas l’appareil et n’accédons pas à vos données. Travail en mode sécurisé. Vous pouvez retirer vos comptes ou activer un code invité.",
    a: (
      <>
        Nous <strong>n’effaçons pas</strong> l’appareil et
        <strong> n’accédons pas</strong> à tes données. Travail en mode
        sécurisé. Tu peux retirer tes comptes ou activer un code invité.
      </>
    ),
  },
  {
    id: "devis",
    category: "Devis & Prix",
    q: "Comment obtenir un devis clair et rapide ?",
    aText:
      "Utilisez notre Devis en ligne : sélection de la marque, du modèle et du type de réparation. Un récapitulatif se met à jour en temps réel et vous recevez le devis par e‑mail.",
    a: (
      <>
        Utilise le <strong>Devis</strong> en ligne : marque → modèle →
        réparation. Le <strong>récap</strong> s’actualise en direct et tu
        reçois le tout par e‑mail.
      </>
    ),
  },
  {
    id: "prix",
    category: "Devis & Prix",
    q: "Comment calculez‑vous les prix ?",
    aText:
      "Le prix affiché inclut la pièce sélectionnée et la main‑d’œuvre. Il peut différer du prix fournisseur car nous appliquons un tarif client avec garantie, tests et support inclus.",
    a: (
      <>
        Affichés <strong>pièce + main‑d’œuvre</strong>. Différent du prix
        fournisseur : <strong>garantie, tests, support</strong> et logistique
        inclus.
      </>
    ),
  },
  {
    id: "marques",
    category: "Réparations",
    q: "Quelles marques et modèles réparez‑vous ?",
    aText:
      "Apple (iPhone, iPad), Samsung (S, A, Note, Tab), Xiaomi (Mi, Redmi, Poco), OnePlus et Google. Pour iPad : LCD, vitre tactile et batterie.",
    a: (
      <>
        <strong>Apple</strong> (iPhone, iPad) • <strong>Samsung</strong> (S, A,
        Note, Tab) • <strong>Xiaomi</strong> (Mi, Redmi, Poco) •
        <strong> OnePlus</strong> • <strong>Google</strong>.
        <br />Pour <strong>iPad</strong> : LCD, vitre tactile et batterie.
      </>
    ),
  },
  {
    id: "reconditionne",
    category: "Reconditionné",
    q: "Que signifie “reconditionné” chez RecoPhone ?",
    aText:
      "Un smartphone reconditionné est testé, nettoyé et vérifié sur de nombreux points, avec batterie et composants dans des seuils fonctionnels. Garanti et prêt à l’emploi.",
    a: (
      <>
        Un smartphone <strong>reconditionné</strong> est testé, nettoyé,
        vérifié sur de nombreux points de contrôle, <strong>garanti</strong> et
        prêt à l’emploi.
      </>
    ),
  },
  {
    id: "abos",
    category: "Abonnements",
    q: "En quoi consistent vos abonnements (Essentiel, Familial, Zen) ?",
    aText:
      "Trois offres mensuelles (14,99 €, 29,99 €, 34,99 €) pour la tranquillité d’esprit : sauvegardes, nettoyage, diagnostics, réductions sur réparations et remplacements de verre, délais d’intervention prioritaires, etc.",
    a: (
      <>
        Trois offres — <strong>Essentiel (14,99€)</strong>,
        <strong> Familial (29,99€)</strong>, <strong>Zen (34,99€)</strong> —
        avec : sauvegardes, nettoyage, diagnostics, réductions,
        remplacements de verre, <strong>délais prioritaires</strong>, etc.
      </>
    ),
  },
  {
    id: "horaires",
    category: "Général",
    q: "Quels sont vos horaires d’ouverture ?",
    aText:
      "Lundi–vendredi 09:00–12:00 et 13:00–17:30. Le samedi, itinérance 09:00–17:00.",
    a: (
      <>
        <strong>Lun–Ven</strong> 09:00–12:00, 13:00–17:30 •
        <strong> Samedi</strong> itinérance 09:00–17:00.
      </>
    ),
  },
  {
    id: "facture-tva",
    category: "Facturation",
    q: "Proposez‑vous une facture et la TVA pour les pros ?",
    aText:
      "Oui, facture conforme avec TVA. Indiquez vos informations d’entreprise lors du devis.",
    a: (
      <>
        Oui, facture conforme avec <strong>TVA</strong>. Indique tes infos
        d’entreprise dans le <strong>Devis</strong>.
      </>
    ),
  },
  {
    id: "paiements",
    category: "Facturation",
    q: "Quels moyens de paiement acceptez‑vous ?",
    aText:
      "Cartes bancaires, virement et espèces. Paiement en deux fois possible selon conditions.",
    a: (
      <>
        <strong>Cartes bancaires</strong>, virement, espèces. Paiement en
        <strong> deux fois</strong> possible selon conditions.
      </>
    ),
  },
  {
    id: "rupture-stock",
    category: "Réparations",
    q: "Si la pièce n’est pas en stock, quels délais prévoir ?",
    aText:
      "Nous commandons immédiatement et vous informons du délai estimé (généralement 24–72 h ouvrées).",
    a: (
      <>
        Commande <strong>immédiate</strong> et info de délai estimé — en
        général <strong>24–72 h ouvrées</strong>.
      </>
    ),
  },
  {
    id: "apres-reparation",
    category: "Réparations",
    q: "Que se passe‑t‑il si l’écran se recasse après la réparation ?",
    aText:
      "Les dommages accidentels ne sont pas couverts. Selon votre abonnement, des remplacements de verre à prix réduit peuvent s’appliquer.",
    a: (
      <>
        Les dommages <strong>accidentels</strong> ne sont pas couverts.
        <br />Avec nos <strong>abonnements</strong>, des remplacements de verre
        à tarif réduit peuvent s’appliquer.
      </>
    ),
  },
];

const CATEGORIES: Category[] = [
  "Général",
  "Réparations",
  "À domicile",
  "Devis & Prix",
  "Garantie & Données",
  "Reconditionné",
  "Abonnements",
  "Facturation",
];

function useFilteredFaq(query: string, category: Category | "Tous") {
  const normalized = query.trim().toLowerCase();
  return useMemo(() => {
    const source = faqs;
    const byCat = category === "Tous" ? source : source.filter((f) => f.category === category);
    if (!normalized) return byCat;
    return byCat.filter((f) =>
      [f.q, f.aText, f.category].some((v) => v.toLowerCase().includes(normalized))
    );
  }, [query, category]);
}

function mark(text: string, needle: string) {
  if (!needle) return text;
  try {
    const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === needle.toLowerCase() ? (
        <mark key={i} className="rounded px-0.5 bg-[#edfbe2] text-[#222222]">
          {p}
        </mark>
      ) : (
        <React.Fragment key={i}>{p}</React.Fragment>
      )
    );
  } catch {
    return text;
  }
}

const FAQSectionPro: React.FC = () => {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "Tous">("Tous");
  const results = useFilteredFaq(query, cat);

  // JSON-LD includes ALL Q&A (not just filtered) for SEO completeness
  const faqLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.aText },
      })),
    }),
    []
  );

  return (
    <section id="faq" aria-labelledby="faq-title" className="w-full bg-[#edfbe2] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <header className="mb-8 md:mb-10 text-center">
          <p className="text-xs md:text-sm tracking-widest font-semibold text-[#54b435]">
            FAQ • QUESTIONS FRÉQUENTES
          </p>
          <h2 id="faq-title" className="mt-2 text-3xl md:text-4xl font-extrabold text-[#222222]">
            Vos questions, nos <span className="text-[#54b435]">réponses claires</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-neutral-700">
            Pensée pour le <strong>référencement</strong> et l’<strong>expérience client</strong>.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
          <div className="flex-1 relative">
            <input
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une question (ex. batterie, domicile, TVA)…"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-sm md:text-base shadow-sm outline-none focus:ring-2 focus:ring-[#54b435]/30"
              aria-label="Rechercher dans la FAQ"
            />
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400">
              <path d="M11 19a8 8 0 1 1 5.293-14.293A8 8 0 0 1 11 19Zm8.707 1.707-4.2-4.2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Tous", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1.5 text-sm shadow-sm transition ${
                  cat === c
                    ? "bg-[#54b435] border-[#54b435] text-white"
                    : "bg-white border-neutral-200 text-[#222222] hover:border-[#54b435]/50"
                }`}
                aria-pressed={cat === c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-xs md:text-sm text-neutral-600">
          {results.length} résultat{results.length > 1 ? "s" : ""}
          {query || cat !== "Tous" ? " • filtré(s)" : ""}
        </div>

        {/* List */}
        <div className="space-y-3 md:space-y-4">
          {results.map((item, idx) => {
            const contentId = `faq-content-${item.id}`;
            return (
              <details key={item.id} className="group rounded-2xl border border-neutral-200 bg-white shadow-sm open:shadow-md">
                <summary className="list-none cursor-pointer select-none px-5 py-4 md:px-6 md:py-5 flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-0.5 h-5 w-5 grid place-items-center rounded-full border border-[#54b435]/40">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-[#54b435] transition-transform group-open:rotate-45">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base md:text-lg font-semibold text-[#222222]">
                        {mark(item.q, query)}
                      </h3>
                      {item.top && (
                        <span className="inline-flex items-center rounded-full bg-[#edfbe2] text-[#222222] border border-[#54b435]/30 px-2 py-0.5 text-[11px] font-semibold">
                          Le + demandé
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-white text-neutral-600 border border-neutral-200 px-2 py-0.5 text-[11px]">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs md:text-sm text-neutral-600">
                      {/* Short teaser from aText */}
                      {item.aText.length > 100 ? item.aText.slice(0, 100) + "…" : item.aText}
                    </p>
                  </div>
                </summary>

                {/* Animated content */}
                <div className="px-5 md:px-6">
                  <div className="grid grid-rows-[0fr] group-open:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                    <div id={contentId} className="overflow-hidden">
                      <div className="pb-5 md:pb-6 text-neutral-700 leading-relaxed text-sm md:text-base">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 md:mt-14 flex flex-col items-center gap-3">
          <a
            href="/devis"
            className="inline-flex items-center justify-center rounded-2xl bg-[#54b435] px-5 py-3 text-white font-semibold shadow hover:opacity-95 transition"
          >
            Obtenir un devis en ligne
          </a>
          <p className="text-sm text-neutral-600 text-center">
            Toujours pas la réponse ? Écris‑nous :
            {" "}
            <a href="mailto:hello@recophone.be" className="underline decoration-[#54b435] underline-offset-2">
              hello@recophone.be
            </a>
            {" "}•{" "}
            <a href="tel:+32492090533" className="underline decoration-[#54b435] underline-offset-2">
              +32 492 09 05 33
            </a>
          </p>
        </div>
      </div>

      {/* JSON‑LD (all questions) */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </section>
  );
};

export default FAQSectionPro;
