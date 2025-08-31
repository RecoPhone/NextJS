// File: src/app/confidentialite/page.tsx
"use client";

import Image from "next/image";
import { useCallback } from "react";

/**
 * RecoPhone — Politique de Confidentialité (RGPD)
 * - Layout et UX alignés avec la page CGV
 * - Sommaire ancré + bouton "Imprimer / PDF"
 * - Tailwind classes "compatibles" (pas de features expérimentales)
 * - Pas de dépendances externes
 */

const BRAND = {
  bg: "#edfbe2",
  accent: "#54b435",
  text: "#222222",
  white: "#ffffff",
};

const UPDATED_AT = "30 août 2025";
const VERSION = "1.0";

export default function PrivacyPage() {
  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{ ["--bg" as any]: BRAND.bg, ["--text" as any]: BRAND.text }}
    >
      {/* Header */}
      <header className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 relative hidden sm:block">
              <Image
                src="/images/contents/icone_recophone.png"
                alt="RecoPhone"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-700">
                Documents légaux
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Politique de Confidentialité (RGPD)
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-700">
              <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-sm ring-1 ring-black/5">
                Mis à jour le {UPDATED_AT}
              </span>{" "}
              <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-sm ring-1 ring-black/5">
                Version {VERSION}
              </span>
            </p>

            <div className="no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[var(--accent)] px-4 py-2 text-white shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ["--accent" as any]: BRAND.accent }}
                aria-label="Imprimer ou sauvegarder en PDF"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9V2h12v7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                Imprimer / PDF
              </button>
            </div>
          </div>
        </div>

        <div
          className="h-2 w-full bg-[var(--accent)]"
          style={{ ["--accent" as any]: BRAND.accent }}
        />
      </header>

      {/* Layout */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[300px_1fr] gap-8">
        {/* Sommaire */}
        <aside className="no-print">
          <nav className="sticky top-6 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-black/5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Sommaire
            </p>
            <ol className="space-y-2 text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-block rounded px-2 py-1 hover:bg-[var(--bg)] hover:text-black"
                    style={{ ["--bg" as any]: BRAND.bg }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Contenu */}
        <article className="prose prose-neutral max-w-none">
          <Section id="perimetre" title="1) Objet & périmètre">
            <p>
              La présente Politique explique comment <strong>RecoPhone</strong> collecte, utilise,
              conserve et protège vos données personnelles lorsque vous utilisez notre site, nos
              formulaires de devis/contact, nos services de réparation (atelier & interventions
              itinérantes le samedi), l’achat de produits reconditionnés et nos abonnements.
            </p>
          </Section>

          <Section id="responsable" title="2) Responsable du traitement">
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              <Item term="Responsable" desc="RecoPhone — Personne physique" />
              <Item term="N° d’entreprise (BCE) & TVA" desc="BE0695866221" />
              <Item term="Adresse" desc="Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre, Belgique" />
              <Item term="E-mail (contact RGPD)" desc="hello@recophone.be" />
              <Item term="Tél." desc="+32 492 09 05 33" />
              <Item term="Site" desc="https://www.recophone.be" />
            </dl>
          </Section>

          <Section id="donnees" title="3) Données que nous traitons">
            <ul>
              <li>
                <strong>Identification & contact</strong> : nom, prénom, e-mail, téléphone, adresse,
                infos de rendez-vous.
              </li>
              <li>
                <strong>Devis & réparation</strong> : marque/modèle, type de panne, pièces
                sélectionnées, photos/notes transmises, signature, documents (ex. PDF de devis/contrat).
              </li>
              <li>
                <strong>Abonnements</strong> : offre choisie, historique d’avantages, statut de
                paiement (pas de stockage des numéros de carte par RecoPhone).
              </li>
              <li>
                <strong>Paiement</strong> : géré par un prestataire de paiement certifié (ex. Stripe).
                RecoPhone ne connaît ni ne conserve les données complètes de carte.
              </li>
              <li>
                <strong>Navigation</strong> : pages consultées, événements techniques, journal d’erreurs,
                métadonnées (adresse IP raccourcie/pseudonymisée lorsque possible), cookies/traceurs
                selon vos choix.
              </li>
              <li>
                <strong>Support</strong> : échanges e-mail/téléphone, contenus nécessaires au suivi.
              </li>
            </ul>
          </Section>

          <Section id="finalites" title="4) Finalités & bases légales (RGPD)">
            <ul>
              <li>
                <strong>Exécution d’un contrat / mesures précontractuelles</strong> : traiter vos
                demandes de devis, réaliser la réparation, livrer un produit, gérer un abonnement.
              </li>
              <li>
                <strong>Obligation légale</strong> : facturation/comptabilité (conservation légale),
                garanties légales, sécurité des transactions.
              </li>
              <li>
                <strong>Intérêt légitime</strong> : sécurité du site, prévention de la fraude,
                amélioration de nos services, mesure d’audience respectueuse.
              </li>
              <li>
                <strong>Consentement</strong> : communications commerciales (newsletter), cookies
                non essentiels/marketing, prise de rendez-vous tiers si applicable. Vous pouvez
                retirer votre consentement à tout moment.
              </li>
            </ul>
          </Section>

          <Section id="sources" title="5) Provenance des données">
            <p>
              Nous collectons principalement les données que vous nous fournissez directement via
              nos formulaires, e-mails et appels. Certaines données techniques proviennent
              automatiquement de votre appareil lors de la navigation (cf. Cookies & traceurs).
            </p>
          </Section>

          <Section id="destinataires" title="6) Destinataires & sous-traitants">
            <ul>
              <li>
                <strong>Paiement</strong> : prestataire certifié (ex. Stripe) pour traiter vos
                règlements et empêcher la fraude.
              </li>
              <li>
                <strong>Hébergement & e-mail</strong> : fournisseurs techniques (hébergeur, messagerie
                professionnelle) assurant disponibilité et envoi/réception.
              </li>
              <li>
                <strong>Stockage de documents</strong> : devis/contrats PDF peuvent être conservés
                sur un sous-domaine sécurisé de RecoPhone (ex. zone dédiée au téléchargement).
              </li>
              <li>
                <strong>Outils d’analyse</strong> : solutions de mesure d’audience respectueuses
                (sans cookies si possible) et journaux techniques pour la stabilité.
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              Nos prestataires agissent sur instructions (art. 28 RGPD), avec garanties de sécurité
              et accords de traitement.
            </p>
          </Section>

          <Section id="transferts" title="7) Transferts hors EEE">
            <p>
              Certains prestataires peuvent être situés en dehors de l’Espace Économique Européen.
              Dans ce cas, nous veillons à l’existence de <strong>garanties appropriées</strong> :
              clauses contractuelles types (SCC), règles d’entreprise contraignantes (BCR) ou
              équivalence de protection. Vous pouvez demander des informations sur ces garanties.
            </p>
          </Section>

          <Section id="durees" title="8) Durées de conservation">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <ul className="m-0">
                <li><strong>Devis & dossiers de réparation</strong> : durée de la relation + jusqu’à 5 ans (prescription contractuelle), sauf litige.</li>
                <li><strong>Facturation & comptabilité</strong> : 7 ans (obligation légale).</li>
                <li><strong>Abonnements</strong> : durée de l’abonnement + 3 ans en archivage intermédiaire.</li>
                <li><strong>Support e-mail</strong> : 36 mois après dernière interaction utile.</li>
                <li><strong>Journaux techniques</strong> : 6 à 12 mois selon finalités de sécurité.</li>
                <li><strong>Cookies</strong> : durée selon le type (cf. section Cookies & traceurs).</li>
              </ul>
            </div>
          </Section>

          <Section id="cookies" title="9) Cookies & traceurs">
            <p>
              Nous utilisons des traceurs strictement nécessaires au fonctionnement (ex. session,
              sécurité). Les cookies <strong>non essentiels</strong> (mesure d’audience avancée,
              marketing) ne sont activés qu’avec votre <strong>consentement</strong>. Vous pouvez
              modifier vos choix à tout moment via le gestionnaire de préférences (bannière ou page
              dédiée lorsqu’elle est disponible).
            </p>
            <ul className="mt-3">
              <li><strong>Nécessaires</strong> : authentification, équilibrage de charge, sécurité.</li>
              <li><strong>Mesure</strong> : audience agrégée et anonyme lorsque possible (privilégiée sans cookie).</li>
              <li><strong>Marketing</strong> : uniquement si vous y consentez.</li>
            </ul>
          </Section>

          <Section id="securite" title="10) Sécurité">
            <p>
              Nous mettons en œuvre des mesures organisationnelles et techniques raisonnables :
              chiffrement en transit, contrôle d’accès, journalisation, durcissement de l’hébergement,
              sauvegardes, principe de minimisation des données.
            </p>
          </Section>

          <Section id="droits" title="11) Vos droits">
            <ul>
              <li><strong>Accès</strong> : connaître les données détenues et en obtenir copie.</li>
              <li><strong>Rectification</strong> : corriger des données inexactes.</li>
              <li><strong>Effacement</strong> : suppression dans les limites légales (« droit à l’oubli »).</li>
              <li><strong>Limitation</strong> : restreindre temporairement le traitement.</li>
              <li><strong>Opposition</strong> : vous opposer au traitement fondé sur l’intérêt légitime (y compris prospection).</li>
              <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré.</li>
              <li><strong>Retrait du consentement</strong> : à tout moment pour les traitements concernés.</li>
            </ul>
          </Section>

          <Section id="exercer" title="12) Exercer vos droits">
            <p>
              Contactez-nous à <a href="mailto:hello@recophone.be" className="underline">hello@recophone.be</a> en précisant votre
              demande et un justificatif d’identité si nécessaire. Nous répondons en principe sous
              <strong> 1 mois</strong> (prolongeable de 2 mois pour complexité/volume).
            </p>
            <p className="text-sm text-gray-600">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une plainte
              auprès de l’Autorité de protection des données (Belgique).
            </p>
          </Section>

          <Section id="mineurs" title="13) Mineurs">
            <p>
              Nos services ne visent pas les personnes de moins de 16 ans. Nous ne collectons pas
              sciemment leurs données sans consentement parental.
            </p>
          </Section>

          <Section id="maj" title="14) Mises à jour de la Politique">
            <p>
              Nous pouvons modifier cette Politique pour refléter des évolutions légales ou
              organisationnelles. La version applicable est celle publiée à la date indiquée en haut
              de page.
            </p>
          </Section>

          <Section id="contact" title="15) Contact & réclamations">
            <address className="not-italic">
              <div><strong>RecoPhone</strong> — Personne physique</div>
              <div>Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre, Belgique</div>
              <div>N° d’entreprise (BCE) & TVA : BE0695866221</div>
              <div>hello@recophone.be — +32 492 09 05 33</div>
            </address>
            <p className="mt-2 text-sm text-gray-600">
              Autorité de protection des données (Belgique) — consultez leur site pour les modalités
              de plainte et de contact.
            </p>

            <div className="mt-8 no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-white"
              >
                Imprimer / PDF
              </button>
            </div>
          </Section>

          <p className="mt-10 text-xs text-gray-500">
            Cette Politique ne constitue pas un avis juridique. Pour un contrôle 100 % sécurisé, faites valider par un juriste.
          </p>

          <div className="mt-8 no-print">
            <a href="#perimetre" className="inline-block rounded-xl border px-4 py-2 hover:bg-white">
              ↑ Retour en haut
            </a>
          </div>
        </article>
      </div>

      <style>{printStyles}</style>
    </main>
  );
}

/* ────────────────────────────────────────────
   Composants utilitaires
   ──────────────────────────────────────────── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]" style={{ ["--text" as any]: BRAND.text }}>
        {title}
      </h2>
      <div className="mt-4 leading-relaxed text-[17px] text-gray-800">{children}</div>
    </section>
  );
}

function Item({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-gray-700">{term}</dt>
      <dd className="text-[17px]">{desc}</dd>
    </div>
  );
}

const toc: { id: string; label: string }[] = [
  { id: "perimetre", label: "1) Objet & périmètre" },
  { id: "responsable", label: "2) Responsable du traitement" },
  { id: "donnees", label: "3) Données traitées" },
  { id: "finalites", label: "4) Finalités & bases légales" },
  { id: "sources", label: "5) Provenance des données" },
  { id: "destinataires", label: "6) Destinataires & sous-traitants" },
  { id: "transferts", label: "7) Transferts hors EEE" },
  { id: "durees", label: "8) Durées de conservation" },
  { id: "cookies", label: "9) Cookies & traceurs" },
  { id: "securite", label: "10) Sécurité" },
  { id: "droits", label: "11) Vos droits" },
  { id: "exercer", label: "12) Exercer vos droits" },
  { id: "mineurs", label: "13) Mineurs" },
  { id: "maj", label: "14) Mises à jour" },
  { id: "contact", label: "15) Contact & réclamations" },
];

const printStyles = `
@media print {
  .no-print { display: none !important; }
  header, aside { display: none !important; }
  main { background: #fff !important; }
  article { font-size: 12pt; }
  h1, h2 { page-break-after: avoid; }
  section { break-inside: avoid; }
  a { color: #000 !important; text-decoration: none !important; }
}
`;
