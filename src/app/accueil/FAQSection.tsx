"use client";
import { useMemo, useState } from "react";
import Script from "next/script";

type FAQ = { question: string; answer: string };

const faqs: FAQ[] = [
  {
    question: "Combien de temps dure une réparation chez RecoPhone ?",
    answer:
      "La majorité des réparations sont réalisées en **moins d’une heure**, directement en **atelier**. Si la **pièce** nécessaire n’est pas disponible immédiatement, nous la commandons dans la journée, ce qui implique un **délai supplémentaire de 24h maximum**. Vous êtes informé(e) à chaque étape.",
  },
  {
    question: "Est-ce que vous faites toujours de l'itinérance ?",
    answer:
      "Oui, nous proposons toujours un service d’**itinérance**, **uniquement sur rendez-vous**, et **le samedi**. Cela permet d’intervenir près de chez vous, dans certaines zones définies. N’hésitez pas à nous contacter pour en savoir plus.",
  },
  {
    question: "Proposez-vous un service d’envoi postal ?",
    answer:
      "**Non**, nous ne proposons pas de réparation à distance par **envoi postal**. Ce choix est volontaire pour garantir un **contact direct**, une **qualité de service optimale**, et éviter tout risque lié au transport.",
  },
  {
    question: "Est-ce que mes données sont en sécurité ?",
    answer:
      "**Absolument**. Nous n’accédons **jamais à vos données personnelles**. Pour plus de sécurité, nous vous recommandons néanmoins de réaliser une **sauvegarde complète** avant toute intervention.",
  },
  {
    question: "Quelle garantie proposez-vous après réparation ?",
    answer:
      "Toutes nos réparations sont couvertes par une **garantie** : **1 an** sur les **pièces détachées** (écrans, connecteurs, caméras, etc.), et **6 mois** sur les **batteries**. Cette garantie couvre tout défaut de pièce ou de montage, hors **casse** ou **oxydation**.",
  },
];

export default function MiniFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // JSON-LD pour résultats enrichis FAQ
  const faqJsonLd = useMemo(() => {
    const stripMdBold = (t: string) => t.replace(/\*\*/g, "");
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: stripMdBold(f.answer),
        },
      })),
    };
  }, []);

  const formatAnswer = (answer: string) => {
    const parts = answer.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-[#222] font-semibold">
          {part.replace(/\*\*/g, "")}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <section
      className="bg-[#edfbe2] py-16 px-4"
      id="faq"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {/* JSON-LD */}
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#222] text-center mb-10 uppercase tracking-wide">
          Foire aux Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const panelId = `panel-${index}`;
            const buttonId = `button-${index}`;
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="border border-[#54b435] rounded-xl overflow-hidden bg-white"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left px-6 py-4 hover:bg-[#f4fff0] transition-colors duration-300 flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54b435]"
                  >
                    <span className="font-semibold text-[#222]" itemProp="name">
                      {faq.question}
                    </span>
                    <span className="ml-auto text-[#54b435] text-xl select-none">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>

                {/* Réponse toujours dans le DOM (meilleure indexation) */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`${isOpen ? "block" : "hidden"} px-6 pb-4 text-[#333] text-sm md:text-base leading-relaxed`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <p itemProp="text">{formatAnswer(faq.answer)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA vers la FAQ complète (sans animation) */}
        <div className="mt-10 text-center">
          <a
            href="/faq"
            className="inline-block bg-[#54b435] hover:bg-[#3e8e2f] text-white font-semibold px-8 py-4 rounded-xl transition duration-300 shadow-lg uppercase tracking-wide"
          >
            VOIR LA FAQ COMPLÈTE
          </a>
        </div>
      </div>
    </section>
  );
}
