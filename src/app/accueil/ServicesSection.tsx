"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import type { Variants } from "framer-motion"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import { FaTools, FaHeart, FaMobileAlt, FaCheck, FaArrowRight } from "react-icons/fa"

// Types ----------------------------------------------------------------------
type Service = {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  cta: string
  href: string
  Icon: IconType
}

// Data -----------------------------------------------------------------------
const services: Service[] = [
  {
    eyebrow: "RÉPARATION EXPRESS",
    title: "Réparation de smartphone",
    description: "Écran cassé ou batterie faible ? On répare vite et bien.",
    bullets: [
      "Devis 100% gratuit",
      "Pièces durables, garanties",
      "Selon stock : réparation ~30 minutes",
      "Données préservées",
    ],
    cta: "Je répare maintenant",
    href: "/devis",
    Icon: FaTools,
  },
  {
    eyebrow: "TRANQUILLITÉ AU QUOTIDIEN",
    title: "Abonnements sérénité",
    description: "Entretien, sauvegardes et réductions. ",
    bullets: [
      "-20% sur les réparations",
      "RDV prioritaire le samedi",
      "Conseils & suivi inclus",
      "Sauvegarde mensuelle",
    ],
    cta: "Je protège mon téléphone",
    href: "/abonnements",
    Icon: FaHeart,
  },
  {
    eyebrow: "SECONDE VIE, VRAI BON PLAN",
    title: "Téléphones reconditionnés",
    description: "Reconditionné, testé, garanti. Jusqu’à -60% du neuf.",
    bullets: [
      "Garantie 12 mois",
      "Batterie testée & validée",
      "Stocks renouvelés",
      "Contrôle 30+ points",
    ],
    cta: "Voir les modèles certifiés",
    href: "/re-smartphones",
    Icon: FaMobileAlt,
  },
]

// Animations -----------------------------------------------------------------
const parentVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0 },
} as const

// Component ------------------------------------------------------------------
export default function ServicesSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="services" className="relative bg-[#daf4c6] py-20">
      {/* Decorative soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(600px 200px at 10% 10%, rgba(84,180,53,0.15), transparent 60%), radial-gradient(600px 200px at 90% 30%, rgba(84,180,53,0.12), transparent 60%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-screen-xl px-4 text-center">
        <h2 className="mb-3 text-2xl sm:text-3xl font-semibold leading-snug tracking-widest uppercase text-[#222]">
        Nos services éco-responsables
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-xs sm:text-sm text-[#2a2a2a]/80 uppercase tracking-wider">
        Prolongez la vie de vos appareils. Réduisez les déchets électroniques.
        </p>

        <motion.ul
          role="list"
          initial={reduceMotion ? undefined : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.25 }}
          variants={parentVariants}
          className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {services.map(({ eyebrow, title, description, bullets, cta, href, Icon }, i) => {
            const isInternal = href.startsWith("/")
            const CTA_CLASSES =
              "mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#54b435] px-4 py-2 font-semibold uppercase tracking-wide text-white transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[#54b435] focus:ring-offset-2"

            const CardWrapper = ({ children }: { children: ReactNode }) => (
              <motion.article
                initial={reduceMotion ? undefined : "hidden"}
                whileInView={reduceMotion ? undefined : "show"}
                whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.45, delay: i * 0.05 }}
                viewport={{ once: true, amount: 0.25 }}
                variants={cardVariants}
                className="group relative h-full"
              >
                {/* Gradient border */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#d6f0c4] to-[#eafbe0] opacity-100" />
                <div className="relative flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 pb-5 shadow-xl ring-1 ring-black/5">
                  {children}
                </div>
              </motion.article>
            )

            return (
              <li key={title} className="h-full">
                <CardWrapper>
                  <Icon className="mb-3 text-4xl text-[#54b435]" aria-hidden />
                  <p className="mb-1 text-xs sm:text-[13px] font-semibold uppercase tracking-wider text-[#2a2a2a]/70">{eyebrow}</p>

                  <h3 className="mb-2 text-lg font-semibold leading-snug text-[#222] sm:text-xl">{title}</h3>

                  <p className="mb-4 text-sm leading-relaxed text-gray-700">{description}</p>

                  {/* Bullets */}
                  <ul className="mb-2 space-y-2 text-left">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-[#1f2937]">
                        <FaCheck className="mt-0.5 shrink-0 text-[#54b435]" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA + Trust */}
                  <div className="mt-auto pt-2">
                    {isInternal ? (
                      <Link href={href} className={CTA_CLASSES} aria-label={`${cta} — devis gratuit et réponse rapide`}>
                        <span>{cta}</span>
                        <FaArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ) : (
                      <a href={href} className={CTA_CLASSES} aria-label={cta}>
                        <span>{cta}</span>
                        <FaArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                      </a>
                    )}
                  </div>
                </CardWrapper>
              </li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
