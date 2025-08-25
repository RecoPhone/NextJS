'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/** Courbe (wave) pour ancrer les éoliennes */
const HERO_WAVE_D =
  'M0,224L48,202.7C96,181,192,139,288,149.3C384,160,480,224,576,240C672,256,768,224,864,202.7C960,181,1056,171,1152,181.3C1248,192,1344,224,1392,240L1440,256L1440,320L0,320Z'

/** TypeWriter : tape le slogan une seule fois */
const TYPE_SENTENCE = 'Recycle – Repair – Relife – Protect'

/** Bande centrale (CTA) à éviter en % de largeur */
const CTA_BAND: [number, number] = [32, 68]

type WindmillPos = {
  leftPct: number
  bottomPct: number
  size: number
  speed: number
  delay: number
}

/** Éolienne (sans ombres), pales grandes, pivot au sommet, rotation horaire */
function Windmill({ size = 150, speed = 6, delay = 0 }: { size?: number; speed?: number; delay?: number }) {
  return (
    <svg
      viewBox="0 0 100 160"
      width={size}
      height={size}
      aria-hidden
      className="select-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="wm-mast" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c9d0d6" />
          <stop offset="100%" stopColor="#9aa1a8" />
        </linearGradient>
        <radialGradient id="wm-hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eef2f5" />
          <stop offset="100%" stopColor="#aab1b7" />
        </radialGradient>
      </defs>

      {/* mât : du pivot y=36 à la base y=160 (touche la colline) */}
      <rect x="48" y="36" width="4" height="124" rx="2" fill="url(#wm-mast)" />
      <circle cx="50" cy="36" r="5.5" fill="url(#wm-hub)" />

      {/* rotor : pivot EXACT (50,36), 3 pales à 120° */}
      <g
        className="wm-rotor"
        style={{
          transformOrigin: '50px 36px',
          animation: `wm-spin ${speed}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        <g transform="translate(50 36)">
          <rect x="-2.6" y="-38" width="5.2" height="38" rx="2.6" fill="#cfd6dc" />
          <rect x="-2.6" y="-38" width="5.2" height="38" rx="2.6" fill="#cfd6dc" transform="rotate(120)" />
          <rect x="-2.6" y="-38" width="5.2" height="38" rx="2.6" fill="#cfd6dc" transform="rotate(240)" />
        </g>
      </g>
    </svg>
  )
}

export default function HeroSection() {
  const pathRef = useRef<SVGPathElement | null>(null)
  const [mills, setMills] = useState<WindmillPos[]>([])

  /** 7 éoliennes : 3 à gauche, 4 à droite (nouvelle à ~79%), hors zone CTA, dispersion naturelle */
  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const total = path.getTotalLength()
    const viewW = 1440
    const viewH = 320
    const [BMIN, BMAX] = CTA_BAND

    const pointAt = (t: number) => {
      const p = path.getPointAtLength(total * t)
      return {
        xPct: (p.x / viewW) * 100,
        bottomPct: ((viewH - p.y) / viewH) * 100, // base du mât sur la courbe
      }
    }

    /** pousse t hors de la bande CTA au besoin (sans quitter la courbe) */
    const ensureOutsideBand = (t: number) => {
      let { xPct, bottomPct } = pointAt(t)
      let guard = 0
      while (xPct > BMIN && xPct < BMAX && guard < 400) {
        t += xPct < (BMIN + BMAX) / 2 ? -0.0025 : 0.0025
        if (t < 0.01) t = 0.01
        if (t > 0.99) t = 0.99
        ;({ xPct, bottomPct } = pointAt(t))
        guard++
      }
      return { xPct, bottomPct }
    }

    // 3 gauche, 4 droite (la nouvelle = ~0.79 juste à droite du CTA, vers l'extérieur)
    const seedsLeft  = [0.06, 0.14, 0.26]
    const seedsRight = [0.64, 0.55, 0.86, 0.96] // <-- ajout de 0.79

    // léger jitter pour casser la rigidité visuelle
    const jitter = (t: number, j: number) => Math.min(0.99, Math.max(0.01, t + j))
    const seeds = [
      jitter(seedsLeft[0],  +0.004), // ~0.064
      jitter(seedsLeft[1],  -0.007), // ~0.133
      jitter(seedsLeft[2],  +0.010), // ~0.270
      jitter(seedsRight[0], -0.006), // ~0.734
      jitter(seedsRight[1], +0.009), // ~0.793 
      jitter(seedsRight[2], +0.007), // ~0.867
      jitter(seedsRight[3], -0.004), // ~0.956
    ]

    const SIZES  = [146, 150, 152, 146, 148, 154, 148]
    const SPEEDS = [6.0, 6.3, 6.1, 6.4, 6.15, 6.0, 6.2]
    const DELAYS = [0.00, 0.20, 0.40, 0.60, 0.75, 0.90, 1.05]

    const arr = seeds.map((t, i) => {
      const safe = ensureOutsideBand(t)
      return {
        leftPct: safe.xPct,
        bottomPct: safe.bottomPct,
        size: SIZES[i],
        speed: SPEEDS[i],
        delay: DELAYS[i],
      }
    })

    setMills(arr)
  }, [])

  /** TypeWriter (une seule passe) */
  const [typed, setTyped] = useState('')
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    let i = 0
    let timer: number | null = null
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const write = () => {
      if (i <= TYPE_SENTENCE.length) {
        setTyped(TYPE_SENTENCE.slice(0, i))
        i++
        timer = window.setTimeout(write, 50)
      }
    }

    if (prefersReduced) setTyped(TYPE_SENTENCE)
    else write()

    const caret = window.setInterval(() => setBlink((b) => !b), 550)
    return () => {
      if (timer) window.clearTimeout(timer)
      window.clearInterval(caret)
    }
  }, [])

  return (
    <section id="hero" className="relative overflow-hidden isolate" aria-label="Section d’introduction RecoPhone">
      {/* Backdrop doux */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1200px 600px at 70% 10%, #54b4351a, transparent 60%), radial-gradient(900px 400px at 10% 0%, #54b43514, transparent 60%), #edfbe2',
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-28 md:pt-32 md:pb-36 lg:pt-36 lg:pb-40">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/images/contents/logo_recophone.webp"
            alt="RecoPhone"
            width={180}
            height={180}
            className="mx-auto mb-5 md:mb-6 select-none"
            priority
          />

          {/* TypeWriter = Slogan */}
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight tracking-tight text-[#222]">
            {typed}
            <span
              className={`ml-1 inline-block w-[2px] h-[1em] align-[-0.15em] bg-[#54b435] ${blink ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden
            />
          </h1>

          {/* Phrase budget sous le typewriter */}
          <p className="mt-3 md:mt-4 text-sm md:text-base text-[#222]/80">
            Préservez la planète mais aussi votre portefeuille
          </p>

          {/* CTA */}
          <div className="mt-7 md:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/devis"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-base md:text-lg font-semibold text-white bg-[#54b435] hover:bg-[#3e8e2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54b435]/40 transition-all"
              aria-label="Obtenir un devis de réparation gratuitement"
            >
              Je répare mon smartphone
            </Link>
            <Link
              href="/re-smartphones"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-base md:text-lg font-semibold text-[#2e6f1f] bg-white/70 border border-[#54b435]/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#54b435]/30 transition-all"
              aria-label="Acheter un smartphone reconditionné"
            >
              J’opte pour le reconditionné
            </Link>
          </div>
        </div>
      </div>

      {/* Courbe + éoliennes (3 G / 4 D) */}
      <div className="absolute inset-x-0 bottom-0 z-0 h-[200px] md:h-[260px] lg:h-[320px] select-none">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full">
          <path d={HERO_WAVE_D} fill="#54b435" fillOpacity="0.25" ref={pathRef} />
        </svg>

        {/* Éoliennes dispersées naturellement, desktop only */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {mills.map((m, i) => (
            <div
              key={`${i}-${m.leftPct.toFixed(2)}`}
              className="absolute"
              style={{
                left: `${m.leftPct}%`,
                bottom: `${m.bottomPct}%`,
                transform: 'translate(-50%, 0)',
              }}
            >
              <Windmill size={m.size} speed={m.speed} delay={m.delay} />
            </div>
          ))}
        </div>
      </div>

      {/* Animations & accessibilité */}
      <style jsx global>{`
        @keyframes wm-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .wm-rotor { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
