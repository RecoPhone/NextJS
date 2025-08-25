"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    key: "essentiel" as const,
    title: "Essentiel",
    subtitle: "Parfait pour une utilisation individuelle",
    price: "14,99€",
    features: [
      "Sauvegarde mensuelle *",
      "Nettoyage annuel inclus",
      "10% de réduction sur réparations",
      "2 remplacements de verre *",
      "Diagnostic gratuit illimité",
      "Assistance sous 48h",
      "Premier mois gratuit *",
    ],
    cta: "Protéger son appareil",
  },
  {
    key: "familial" as const,
    title: "Familial",
    subtitle: "La tranquillité pour toute la famille",
    price: "29,99€",
    features: [
      "Sauvegarde mensuelle *",
      "Nettoyage annuel *",
      "15% de réduction sur réparations",
      "2 remplacements de verre *",
      "Diagnostic gratuit illimité",
      "Assistance sous 48h",
      "Premier mois gratuit *",
    ],
    cta: "Couvrir sa famille",
  },
  {
    key: "zen" as const,
    title: "Zen",
    subtitle: "La solution premium pour une sérénité totale",
    price: "34,99€",
    features: [
      "Sauvegarde mensuelle *",
      "Nettoyage annuel premium *",
      "20% de réduction sur réparations",
      "3 remplacements de verre *",
      "Diagnostic gratuit illimité",
      "Intervention rapide sous 24h",
      "Premier mois gratuit *",
    ],
    cta: "Adopter la sérénité",
  },
];

export default function PlansSection() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleSubscribe(planKey: "essentiel" | "familial" | "zen") {
    try {
      setLoadingKey(planKey);
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur inconnue");
      if (!data?.url) throw new Error("URL de redirection manquante.");
      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      alert(`Paiement impossible: ${err.message || "Erreur Stripe"}`);
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <section id="plans" className="py-20 px-4 bg-[#edfbe2]">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-[#222] uppercase mb-12"
        >
          Choisissez la formule qui vous correspond
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="rounded-3xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <h3 className="text-2xl font-bold text-center text-[#54b435] uppercase">
                {plan.title}
              </h3>
              <p className="text-sm text-center text-gray-600 mt-1 mb-6">{plan.subtitle}</p>
              <div className="text-center text-[#222] mb-6">
                <span className="text-xl align-top">€</span>
                <span className="text-5xl font-extrabold">{plan.price.replace("€", "")}</span>
                <span className="text-sm block mt-1 text-gray-600">mensuels</span>
              </div>
              <ul className="space-y-3 mb-6 text-left">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="mr-2 w-5 h-5 shrink-0 text-[#54b435]" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loadingKey === plan.key}
                  aria-busy={loadingKey === plan.key}
                  className="w-full rounded-xl bg-[#54b435] hover:bg-[#46962d] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#54b435] focus-visible:ring-offset-2"
                >
                  {loadingKey === plan.key ? "Redirection..." : plan.cta}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
