"use client";
import { useState } from "react";

const faqs = [
  {
    q: "Pourquoi réparer plutôt que racheter ?",
    a: "Parce que c’est souvent plus économique et meilleur pour l’environnement. On prolonge la durée de vie de votre appareil et on évite des déchets électroniques."
  },
  {
    q: "Proposez-vous des pièces ‘premium’ ou ‘origine’ ?",
    a: "On sélectionne des pièces fiables et adaptées à l’usage. Notre priorité : la durabilité et le rendu final (écran, batterie, connectique)."
  },
  {
    q: "Combien de temps dure une réparation ?",
    a: "Souvent dans la journée pour les pannes courantes (écran, batterie, dock). Pour des cas spécifiques, on vous donne un délai transparent."
  }
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="container mx-auto px-4 pb-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">Questions fréquentes</h2>
      <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 overflow-hidden">
        {faqs.map((f, idx) => (
          <details
            key={idx}
            open={open === idx}
            onClick={() => setOpen(open === idx ? null : idx)}
            className="group"
          >
            <summary className="cursor-pointer list-none p-5 font-semibold flex items-center justify-between">
              <span>{f.q}</span>
              <span className="text-[#54b435] ms-4 group-open:rotate-45 transition">+</span>
            </summary>
            <div className="px-5 pb-5 text-gray-700">{f.a}</div>
          </details>
        ))}
      </div>
      {/* JSON-LD FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
          })
        }}
      />
    </section>
  );
}
