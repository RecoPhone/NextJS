'use client';

import React, { useEffect, useRef, useState } from 'react';

/* Hook "in-view" maison (pas de lib externe) */
function useInViewOnce(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      options ?? { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, options]);

  return { ref, inView };
}

/* Réglages synchronisation */
const DRIVE_SECONDS = 16;                 // boucle voiture
const FINISH_EARLY_MS = 2500;             // avance de fin des compteurs
const COUNTER_MS = DRIVE_SECONDS * 1000 - FINISH_EARLY_MS;

const CO2_MAX = 80;                       // kg
const KM_MAX = 400;                       // km
const CO2_DECIMALS = 1;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const numberFmt = (n: number, d = 0) =>
  new Intl.NumberFormat('fr-BE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

/* SVG voiture (hatchback verte RecoPhone) */
const CarSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 160 74" width="160" height="74" aria-hidden="true" className={className}>
    {/* ombre */}
    <ellipse cx="80" cy="62" rx="54" ry="6" fill="#000" opacity="0.18" />
    {/* carrosserie */}
    <g>
      <path
        d="M14 48 L26 36 C32 30 40 26 55 25 L98 25 C108 25 118 28 128 36 L146 48 C150 50 152 52 152 55 C152 58 150 60 147 60 L22 60 C17 60 12 58 12 54 C12 52 12 50 14 48 Z"
        fill="#54b435"
      />
      <path d="M44 29 C56 18 88 16 110 29 L126 40 L36 40 L44 29 Z" fill="#ffffff" opacity="0.9" />
      <path d="M24 48 C30 42 38 38 54 37 L100 37 C112 37 124 42 134 48" fill="none" stroke="#2a6a1f" strokeWidth="2" opacity="0.5" />
      <rect x="88" y="44" width="12" height="3" rx="1.5" fill="#2a2a2a" opacity="0.6" />
      <rect x="138" y="49" width="8" height="4" rx="2" fill="#ffe08a" />
      <rect x="16" y="49" width="6" height="4" rx="2" fill="#ef4444" />
    </g>
    {/* roues */}
    <g className="wheel">
      <circle cx="120" cy="60" r="9.5" fill="#111" />
      <circle cx="120" cy="60" r="4.5" fill="#d1d5db" />
      <path d="M120 51 L120 56 M120 64 L120 69 M111 60 L116 60 M124 60 L129 60" stroke="#9ca3af" strokeWidth="1.5" />
    </g>
    <g className="wheel">
      <circle cx="48" cy="60" r="9.5" fill="#111" />
      <circle cx="48" cy="60" r="4.5" fill="#d1d5db" />
      <path d="M48 51 L48 56 M48 64 L48 69 M39 60 L44 60 M52 60 L57 60" stroke="#9ca3af" strokeWidth="1.5" />
    </g>
  </svg>
);

const ImpactSection: React.FC = () => {
  const { ref, inView } = useInViewOnce({ threshold: 0.25 });

  const [co2, setCo2] = useState(0);
  const [km, setKm] = useState(0);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Compteurs (1 seule fois, finissent avant fin du 1er passage)
  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setCo2(CO2_MAX);
      setKm(KM_MAX);
      return;
    }

    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / COUNTER_MS);
      const p = easeOutCubic(t);

      setCo2(Number((CO2_MAX * p).toFixed(CO2_DECIMALS)));
      setKm(Math.round(KM_MAX * p));

      if (t < 1) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView]);

  // Variable CSS pour la durée de boucle
  const driveStyle: React.CSSProperties = { ['--drive-seconds' as any]: `${DRIVE_SECONDS}s` };

  return (
    <section ref={ref} className="relative bg-[#edfbe2] py-24 text-[#222] overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Titre */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold uppercase mb-4">RÉPARER, C’EST AGIR</h2>
          <p className="text-sm md:text-base font-medium text-[#333] uppercase tracking-wider max-w-xl mx-auto leading-snug">
            PRODUIRE UN SMARTPHONE GÉNÈRE ENTRE 60 ET 100 KG DE CO₂
          </p>
        </div>

        {/* Bloc principal */}
        <div className="bg-white shadow-xl rounded-2xl p-8 md:p-12 lg:p-14 relative overflow-hidden border-l-[12px] border-[#54b435]">
          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-8 text-center">
            <div className="bg-[#f3fdf0] p-6 rounded-xl shadow-md">
              <p className="text-sm font-semibold text-[#222]/60 uppercase mb-2">ÉMISSIONS ÉVITÉES</p>
              <p className="text-5xl font-extrabold text-[#54b435]">
                {numberFmt(co2, CO2_DECIMALS)} <span className="text-xl text-[#222]">kg CO₂</span>
              </p>
            </div>
            <div className="bg[#f3fdf0] p-6 rounded-xl shadow-md bg-[#f3fdf0]">
              <p className="text-sm font-semibold text-[#222]/60 uppercase mb-2">DISTANCE ÉQUIVALENTE</p>
              <p className="text-5xl font-extrabold text-[#54b435]">
                {numberFmt(km)} <span className="text-xl text-[#222]">km</span>
              </p>
              <p className="text-sm text-[#222]/60 mt-1">Soit environ <strong>Bruxelles → Strasbourg</strong></p>
            </div>
          </div>

          {/* Route + voiture */}
          <div className="-mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-16 mt-10">
            <div className="relative w-full h-16 sm:h-20 md:h-28 lg:h-36 overflow-hidden">
              {/* trait de route */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-300" aria-hidden="true" />

              {/* wrapper qui se déplace en X */}
              <div className="absolute inset-0 drive-loop motion-reduce:animate-none" style={driveStyle} aria-hidden="true">
                {/* wrapper interne (flottement Y + centrage vertical) */}
                <div className="absolute top-1/2 car-float motion-reduce:animate-none">
                  <CarSVG className="w-28 sm:w-32 md:w-36 lg:w-44 wheel-spin motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intertitre */}
        <div className="text-center max-w-3xl mx-auto mt-20 mb-10 px-4">
          <p className="text-2xl md:text-3xl font-extrabold text-[#222] uppercase tracking-wider">MAIS AUSSI ...</p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {[
            { icon: '✈️', text: '1H DE VOL EN AVION ÉVITÉE' },
            { icon: '💡', text: '1 MOIS D’ÉLECTRICITÉ NON CONSOMMÉ' },
            { icon: '🍔', text: '33 BURGERS AU BŒUF' },
            { icon: '🏭', text: '2 JOURS D’ÉMISSIONS INDUSTRIELLES' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={[
                'group bg-white px-6 py-8 rounded-2xl border-l-4 border-[#54b435]',
                'shadow-md transform-gpu transition-all duration-500', // <- pas de 'transform' pour éviter le warning
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                'hover:-translate-y-1 hover:shadow-xl',
              ].join(' ')}
              style={{ transitionDelay: `${idx * 120}ms` }}
            >
              <div className="text-5xl mb-4 will-change-transform" aria-hidden="true">
                <span className="inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:-rotate-6">
                  {item.icon}
                </span>
              </div>
              <p className="text-sm md:text-base text-[#222] font-semibold uppercase tracking-wide leading-snug">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Accroche + CTA */}
        <p className="text-sm md:text-base text-[#222] text-center font-medium uppercase tracking-wide mt-16 mb-6 opacity-0 animate-fadeIn motion-reduce:animate-none">
          VOUS POUVEZ FAIRE LA DIFFÉRENCE EN QUELQUES CLICS
        </p>
        <div className="flex justify-center">
          <a
            href="/devis"
            className="px-8 py-4 bg-[#54b435] hover:bg-[#3e8e2f] text-white font-semibold text-lg rounded-xl transition-colors duration-300 shadow-lg"
          >
            JE RÉPARE MON SMARTPHONE
          </a>
        </div>

        {/* Sources (centré & stylé) */}
        <div className="mt-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="flex items-center justify-center gap-3 text-xs font-bold tracking-widest uppercase text-[#222]/70">
              <span className="h-px w-10 bg-[#54b435]/40" />
              Sources
              <span className="h-px w-10 bg-[#54b435]/40" />
            </p>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <li>
                <a
                  href="https://impactco2.fr/outils/numerique/smartphone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#f6fff1] border border-[#54b435]/20 text-sm text-[#222] hover:bg-white hover:shadow-sm hover:border-[#54b435]/40 transition"
                >
                  <span className="font-medium">ADEME / ARCEP</span>
                  <span className="hidden sm:inline text-[#222]/60">— Empreinte smartphone (~86 kg CO₂e)</span>
                  <svg viewBox="0 0 24 24" className="size-3.5 opacity-60 transition group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
              </li>

              <li>
                <a
                  href="https://www.fairphone.com/wp-content/uploads/2024/09/Fairphone5_LCA_Report_2024.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#f6fff1] border border-[#54b435]/20 text-sm text-[#222] hover:bg-white hover:shadow-sm hover:border-[#54b435]/40 transition"
                >
                  <span className="font-medium">Fairphone 5 — LCA</span>
                  <span className="hidden sm:inline text-[#222]/60">— 42,1 kg CO₂e total</span>
                  <svg viewBox="0 0 24 24" className="size-3.5 opacity-60 transition group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
              </li>

              <li>
                <a
                  href="https://www.recommerce-group.com/about-us/sustainable-committment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#f6fff1] border border-[#54b435]/20 text-sm text-[#222] hover:bg-white hover:shadow-sm hover:border-[#54b435]/40 transition"
                >
                  <span className="font-medium">Recommerce</span>
                  <span className="hidden sm:inline text-[#222]/60">— ~50 kg CO₂ évités/reconditionné</span>
                  <svg viewBox="0 0 24 24" className="size-3.5 opacity-60 transition group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
              </li>

              <li>
                <a
                  href="https://blog.recommerce.com/green-circle/economie-circulaire/impact-reconditionne/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#f6fff1] border border-[#54b435]/20 text-sm text-[#222] hover:bg-white hover:shadow-sm hover:border-[#54b435]/40 transition"
                >
                  <span className="font-medium">Recommerce (détails)</span>
                  <span className="hidden sm:inline text-[#222]/60">— 77–91% de réduction</span>
                  <svg viewBox="0 0 24 24" className="size-3.5 opacity-60 transition group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
              </li>

              <li>
                <a
                  href="https://globalcarbonatlas.org/emissions/carbon-emissions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#f6fff1] border border-[#54b435]/20 text-sm text-[#222] hover:bg-white hover:shadow-sm hover:border-[#54b435]/40 transition"
                >
                  <span className="font-medium">Global Carbon Atlas</span>
                  <span className="hidden sm:inline text-[#222]/60">— Contexte mondial CO₂</span>
                  <svg viewBox="0 0 24 24" className="size-3.5 opacity-60 transition group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M7 17L17 7M17 7H9M17 7v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
