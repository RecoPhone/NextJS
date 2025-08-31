// File: src/app/cgv/page.tsx
"use client";

import Image from "next/image";
import { useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// RecoPhone — CGV
// ─────────────────────────────────────────────────────────────────────────────
//
// • Tailwind: classes compatibles (sans features expérimentales)
// • Bouton "Imprimer / PDF" : imprime une version optimisée (styles @media print)
// • Sommaire sticky (desktop), ancres accessibles avec scroll-mt pour header
// • Couleurs marque : #edfbe2 (fond), #54b435 (accent), #222222 (texte)
//
// Astuce: mets ton logo dans /public/logo_recophone.webp (sinon masque la balise)
//
// ─────────────────────────────────────────────────────────────────────────────

const BRAND = {
  bg: "#edfbe2",
  accent: "#54b435",
  text: "#222222",
  white: "#ffffff",
};

const UPDATED_AT = "30 août 2025";
const VERSION = "1.0";

export default function CGVPage() {
  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]" style={{ ["--bg" as any]: BRAND.bg, ["--text" as any]: BRAND.text }}>
      {/* Header / Hero */}
      <header className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4 mb-6">
            {/* Logo (facultatif) */}
            <div className="h-12 w-12 relative hidden sm:block">
              <Image src="/images/contents/icone_recophone.png" alt="RecoPhone" fill className="object-contain" priority />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-gray-700">Documents légaux</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Conditions Générales de Vente (CGV)</h1>
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
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V2h12v7" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                Imprimer / PDF
              </button>
            </div>
          </div>
        </div>

        {/* Bande décorative */}
        <div className="h-2 w-full bg-[var(--accent)]" style={{ ["--accent" as any]: BRAND.accent }} />
      </header>

      {/* Layout: TOC + Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[300px_1fr] gap-8">
        {/* Sommaire */}
        <aside className="no-print">
          <nav className="sticky top-6 rounded-2xl bg-white/80 backdrop-blur p-5 shadow-sm ring-1 ring-black/5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">Sommaire</p>
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
              <li className="pt-2 border-t border-gray-200">
                <a href="#annexe" className="inline-block rounded px-2 py-1 hover:bg-[var(--bg)] hover:text-black" style={{ ["--bg" as any]: BRAND.bg }}>
                  Annexe — Formulaire de rétractation
                </a>
              </li>
            </ol>
          </nav>
        </aside>

        {/* Contenu */}
        <article className="prose prose-neutral max-w-none">
          <NoteLegal />

          <Section id="objet" title="1) Objet et champ d’application">
            <p>
              Les présentes conditions générales de vente (« CGV ») régissent, sans restriction ni réserve, l’ensemble des ventes de
              produits et prestations de services proposées par <strong>RecoPhone</strong> (ci-après « le Vendeur », « nous ») à des
              consommateurs et, le cas échéant, à des professionnels, via&nbsp;: (i) le site et ses pages de devis/paiement, (ii) la vente
              à distance (internet, téléphone, e-mail), (iii) la vente hors établissement (interventions itinérantes le samedi), ou (iv)
              la vente en personne lors d’événements. Toute commande implique l’acceptation sans réserve des présentes CGV.
            </p>
          </Section>

          <Section id="vendeur" title="2) Informations légales du Vendeur">
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              <Item term="Statut" desc="Personne physique" />
              <Item term="N° d’entreprise (BCE) & TVA" desc="BE0695866221" />
              <Item term="Siège" desc="Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre, Belgique" />
              <Item term="E-mail" desc="hello@recophone.be" />
              <Item term="Tél." desc="+32 492 09 05 33" />
              <Item term="Site" desc="https://www.recophone.be" />
            </dl>
          </Section>

          <Section id="definitions" title="3) Définitions">
            <ul>
              <li><strong>Client</strong> : personne physique (consommateur) ou morale achetant un produit et/ou un service.</li>
              <li><strong>Produits</strong> : smartphones/tablettes reconditionnés, accessoires et pièces.</li>
              <li><strong>Services</strong> : réparations, diagnostics, maintenance, sauvegarde/restauration, abonnements.</li>
              <li><strong>Contrat à distance</strong> : conclu sans présence physique simultanée des parties.</li>
              <li><strong>Contrat hors établissement</strong> : conclu en dehors des locaux de RecoPhone.</li>
            </ul>
          </Section>

          <Section id="offres" title="4) Produits et Services">
            <ul>
              <li><strong>Réparations</strong> : écran, batterie, connecteurs, caméras, diagnostics…</li>
              <li><strong>Reconditionné & accessoires</strong> : appareils remis en état, coques, câbles, etc.</li>
              <li><strong>Abonnements</strong> : Essentiel, Familial, Zen (avantages selon l’offre).</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Les visuels/compatibilités sont indicatifs. RecoPhone peut adapter la référence d’une pièce par un équivalent de qualité
              au moins équivalente.
            </p>
          </Section>

          <Section id="devis" title="5) Devis, disponibilité et validité">
            <ul>
              <li>Les devis sont valables <strong>15 jours</strong> à compter de leur émission, sauf mention contraire.</li>
              <li>Exécution après <strong>acceptation</strong> (signature électronique, validation, e-mail d’accord, ou acompte).</li>
              <li>En cas d’indisponibilité&nbsp;: nouvelle date, pièce équivalente ou remboursement de la pièce.</li>
            </ul>
          </Section>

          <Section id="prix" title="6) Prix, taxes et facturation">
            <ul>
              <li>Prix indiqués <strong>TVAC</strong> en euros, hors frais spécifiques (livraison/déplacement).</li>
              <li>Facture sur demande (pour professionnels : communiquer mentions légales complètes).</li>
            </ul>
          </Section>

          <Section id="paiement" title="7) Paiement">
            <ul>
              <li><strong>Moyens</strong> : carte (prestataire sécurisé), virement, espèces (dans les limites légales).</li>
              <li><strong>Abonnements</strong> : prélèvement mensuel récurrent ; défaut de paiement → suspension/résiliation après notification.</li>
              <li><strong>Sécurisation</strong> : RecoPhone ne stocke pas les données complètes de carte.</li>
              <li><strong>Retard</strong> : intérêts/frais de recouvrement possibles selon droit applicable.</li>
            </ul>
          </Section>

          <Section id="livraison" title="8) Livraison, retrait et interventions à domicile">
            <ul>
              <li><strong>Produits</strong> : livraison (Belgique, autres pays sur demande) ou retrait convenu. Délais indicatifs.</li>
              <li><strong>Réparations en atelier</strong> : dépôt/retrait sur rendez-vous ou selon horaires communiqués.</li>
              <li>
                <strong>Interventions itinérantes (samedi)</strong> : créneaux selon disponibilité et zone.{" "}
                <strong>Frais de déplacement :</strong> gratuits ≤ <strong>15 km</strong>, puis <strong>3,5 €/km</strong>.
              </li>
              <li>Impossibilité imputable au Client (absence, accès impossible…) : replanification et frais possibles.</li>
            </ul>
          </Section>

          <Section id="retractation" title="9) Droit de rétractation (distance & hors établissement)">
            <p><strong>Consommateurs uniquement.</strong></p>
            <h4 className="mt-4 text-base font-semibold">9.1 Délai & conditions</h4>
            <ul>
              <li>Produits : <strong>14 jours</strong> à compter de la <strong>réception</strong>.</li>
              <li>Services : <strong>14 jours</strong> à compter de la <strong>conclusion</strong> du contrat.</li>
            </ul>
            <p className="mt-2">Notification par déclaration dénuée d’ambiguïté (e-mail/courrier) ou via le formulaire type (voir Annexe).</p>

            <h4 className="mt-4 text-base font-semibold">9.2 Effets</h4>
            <ul>
              <li>Retour des biens sous <strong>14 jours</strong>, à vos frais, en état propre à la revente, avec accessoires complets.</li>
              <li>Remboursement des paiements reçus (frais de livraison standard inclus) au plus tard sous <strong>14 jours</strong>.</li>
              <li>Services entamés avec votre accord : montant proportionnel dû ; si exécutés intégralement pendant le délai, pas de rétractation.</li>
            </ul>

            <h4 className="mt-4 text-base font-semibold">9.3 Exceptions (exemples)</h4>
            <ul>
              <li>Biens scellés d’hygiène ouverts (ex. écouteurs intra-auriculaires).</li>
              <li>Contenu numérique non matériel commencé avec accord et renonciation.</li>
              <li>Biens personnalisés.</li>
              <li>Services pleinement exécutés pendant le délai avec accord/renonciation.</li>
            </ul>
          </Section>

          <Section id="garanties" title="10) Garantie légale & garanties commerciales">
            <h4 className="text-base font-semibold">10.1 Garantie légale (consommateurs)</h4>
            <ul>
              <li>Produits neufs : <strong>2 ans</strong> contre les défauts de conformité.</li>
              <li>Produits d’occasion / reconditionnés : <strong>2 ans</strong>, sauf réduction <strong>expresse</strong> mais jamais &lt; <strong>1 an</strong> (indication claire préalable).</li>
              <li>Exclusions usuelles : usure normale, casse accidentelle, oxydation/liquides, mauvaise utilisation, intervention non autorisée.</li>
            </ul>

            <h4 className="mt-4 text-base font-semibold">10.2 Garantie commerciale RecoPhone (réparations)</h4>
            <ul>
              <li><strong>Pièces & main-d’œuvre</strong> : <strong>12 mois</strong> à compter de la date de réparation.</li>
              <li><strong>Batteries</strong> : <strong>6 mois</strong> (composant consommable avec perte de capacité naturelle).</li>
              <li>Exclusions : chocs/casse/pression/torsion, liquides/oxydation, poussière liée à mauvaise utilisation, ouverture par un tiers, logiciels/paramétrage, perte de données, dommages indirects.</li>
              <li>Remède : réparation ou remplacement ; si impossible/disproportionné : remboursement approprié.</li>
            </ul>
          </Section>

          <Section id="donnees" title="11) Sauvegarde et confidentialité des données">
            <p>
              Le Client reste responsable de la <strong>sauvegarde</strong> de ses données avant intervention. RecoPhone prend des
              précautions raisonnables mais ne peut être tenue responsable d’une perte de données non imputable à une faute lourde ou
              intentionnelle. Un service de sauvegarde/restauration peut être proposé sur demande.
            </p>
          </Section>

          <Section id="responsabilite" title="12) Responsabilité">
            <p>
              RecoPhone n’est responsable que des <strong>dommages directs et prévisibles</strong> issus d’un manquement prouvé. Sont
              exclus : dommages indirects (perte de chance/exploitation/données, préjudice moral). La responsabilité totale est
              <strong> plafonnée</strong> au <strong>montant TTC</strong> payé pour la commande concernée, sauf faute lourde ou dol.
            </p>
          </Section>

          <Section id="abonnements" title="13) Abonnements (Essentiel / Familial / Zen)">
            <ul>
              <li>Durée indéterminée avec reconduction mensuelle.</li>
              <li>Résiliation à tout moment, effet fin de période en cours (pas de remboursement prorata sauf faute de RecoPhone).</li>
              <li>Modifications (contenu/prix) avec préavis raisonnable ; possibilité de résilier en cas de désaccord.</li>
              <li>Rétractation : cf. Article 9.</li>
            </ul>
          </Section>

          <Section id="reclamations" title="14) Réclamations et médiation">
            <p>
              En cas de difficulté : <a href="mailto:hello@recophone.be" className="underline">hello@recophone.be</a> — +32 492 09 05 33. À défaut, vous pouvez saisir le{" "}
              <a className="underline" href="https://www.mediationconsommateur.be" target="_blank" rel="noopener noreferrer">
                Service de Médiation pour le Consommateur (Belgique)
              </a>.
            </p>
            <p className="text-sm text-gray-600">
              La plateforme européenne RLL/ODR a été fermée le 20/07/2025 ; privilégiez la médiation nationale.
            </p>
          </Section>

          <Section id="rgpd" title="15) Données personnelles (RGPD)">
            <p>
              Voir notre <a href="/confidentialite" className="underline">Politique de confidentialité</a> : bases légales, durées de conservation,
              destinataires, droits (accès, rectification, opposition, limitation, effacement, portabilité) et contact.
            </p>
          </Section>

          <Section id="pi" title="16) Propriété intellectuelle">
            <p>Contenus du site, marques, logos, visuels et textes protégés ; toute reproduction non autorisée est interdite.</p>
          </Section>

          <Section id="force-majeure" title="17) Force majeure">
            <p>Les obligations sont suspendues pendant tout événement de force majeure (catastrophe, pannes majeures, grèves, etc.).</p>
          </Section>

          <Section id="divers" title="18) Nullité partielle – Intégralité – Modifications">
            <p>La nullité d’une clause n’affecte pas les autres. Version applicable : celle en vigueur au jour de la commande.</p>
          </Section>

          <Section id="droit" title="19) Droit applicable – Juridiction compétente">
            <p>Droit belge. Tribunaux de l’arrondissement du siège, sans préjudice des règles impératives protectrices du consommateur.</p>
          </Section>

          <Section id="contact" title="20) Contact">
            <address className="not-italic">
              <div><strong>RecoPhone</strong> — Personne physique</div>
              <div>Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre, Belgique</div>
              <div>N° d’entreprise (BCE) & TVA : BE0695866221</div>
              <div>hello@recophone.be — +32 492 09 05 33</div>
            </address>
          </Section>

          <Section id="annexe" title="Annexe — Modèle de formulaire de rétractation">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
              <p className="mb-3"><em>(À compléter et renvoyer uniquement si vous souhaitez vous rétracter)</em></p>
              <p>À l’attention de : <strong>RecoPhone</strong>, Rte de Saussin 38/23a, 5190 Jemeppe-sur-Sambre — hello@recophone.be</p>
              <div className="mt-4 space-y-2 text-sm">
                <p>Je/Nous [*] vous notifie/notifions [*] par la présente ma/notre [*] rétractation du contrat portant sur :</p>
                <ul className="list-disc pl-5">
                  <li>— Commandé le [date] / reçu le [date]</li>
                  <li>— Nom du/des consommateur(s)</li>
                  <li>— Adresse du/des consommateur(s)</li>
                  <li>— Signature (si papier)</li>
                  <li>— Date</li>
                </ul>
                <p>[*] Rayez la mention inutile.</p>
              </div>
            </div>
          </Section>

          <p className="mt-10 text-xs text-gray-500">
            Ces CGV ne constituent pas un avis juridique. Pour un contrôle 100 % sécurisé, faites valider par un juriste.
          </p>

          <div className="mt-8 no-print">
            <a href="#objet" className="inline-block rounded-xl border px-4 py-2 hover:bg-white">↑ Retour en haut</a>
          </div>
        </article>
      </div>

      {/* Styles impression */}
      <style>{printStyles}</style>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Petits composants utilitaires
// ─────────────────────────────────────────────────────────────────────────────

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

function NoteLegal() {
  return (
    <div
      className="mb-8 rounded-2xl border border-[var(--accent)] bg-white p-5 shadow-sm"
      style={{ ["--accent" as any]: BRAND.accent }}
      role="note"
      aria-label="Note légale"
    >
      <p className="m-0 text-[15px]">
        Ces CGV s’appliquent aux ventes de produits et services RecoPhone (atelier, distance, hors établissement — interventions
        itinérantes le samedi). Elles complètent les droits impératifs du consommateur. La version en vigueur est celle affichée
        ci-dessous à la date de la commande.
      </p>
    </div>
  );
}

const toc: { id: string; label: string }[] = [
  { id: "objet", label: "1) Objet et champ d’application" },
  { id: "vendeur", label: "2) Informations légales du Vendeur" },
  { id: "definitions", label: "3) Définitions" },
  { id: "offres", label: "4) Produits et Services" },
  { id: "devis", label: "5) Devis, disponibilité, validité" },
  { id: "prix", label: "6) Prix, taxes et facturation" },
  { id: "paiement", label: "7) Paiement" },
  { id: "livraison", label: "8) Livraison & interventions" },
  { id: "retractation", label: "9) Droit de rétractation" },
  { id: "garanties", label: "10) Garanties" },
  { id: "donnees", label: "11) Données" },
  { id: "responsabilite", label: "12) Responsabilité" },
  { id: "abonnements", label: "13) Abonnements" },
  { id: "reclamations", label: "14) Réclamations & médiation" },
  { id: "rgpd", label: "15) Données personnelles (RGPD)" },
  { id: "pi", label: "16) Propriété intellectuelle" },
  { id: "force-majeure", label: "17) Force majeure" },
  { id: "divers", label: "18) Nullité, intégralité, modifs" },
  { id: "droit", label: "19) Droit applicable" },
  { id: "contact", label: "20) Contact" },
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
