import Image from "next/image";

const items = [
  {
    src: "/images/histoire/BenCollin_Marchienne.webp",
    alt: "Atelier à domicile à Marchienne — travail minutieux sur smartphone",
    caption: "Les débuts à la maison : patience, méthode et envie de faire durer.",
    w: 1200, h: 900,
  },
  {
    src: "/images/histoire/BenCollin_Clersy.jpg",
    alt: "Visite d’un élu écologiste à l’atelier — échange autour de l’économie circulaire",
    caption: "Échanges avec des acteurs engagés : écologie et économie circulaire au cœur du projet.",
    w: 900, h: 1200,
  },
  {
    src: "/images/histoire/BenCollin_Dhaeyer.jpg",
    alt: "Rencontre à l’Hôtel de Ville de Fleurus — présentation des projets RecoPhone",
    caption: "Discussions avec la ville de Fleurus : comment mieux servir le territoire.",
    w: 900, h: 1200,
  },
  {
    src: "/images/histoire/BenCollin_HOPE.jpg",
    alt: "Salon HOPE 2025 — stand RecoPhone dédié à la réparation et au réemploi",
    caption: "Présent au salon HOPE 2025 : promouvoir la réparation et le réemploi.",
    w: 1200, h: 900,
  },
  {
    src: "/images/histoire/BenCollin_BVB.jpg",
    alt: "Maillot de futsal BVB Fleurus avec le logo RecoPhone — sponsoring local",
    caption: "Soutien au sport local : RecoPhone sponsor du BVB Fleurus (futsal).",
    w: 900, h: 1200,
    label: "Sponsoring local",
  },
];

export default function Gallery() {
  return (
    <section id="galerie" className="container mx-auto px-4 py-16 lg:py-24">
      <h2 className="text-3xl md:text-4xl font-bold mb-8">Des moments qui comptent</h2>

      {/* Masonry fluide via colonnes CSS (compatible Tailwind) */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {items.map((it, idx) => (
          <figure key={idx} className="mb-6 break-inside-avoid rounded-3xl overflow-hidden shadow bg-white group">
            <div className="relative">
              <Image
                src={it.src}
                alt={it.alt}
                width={it.w}
                height={it.h}
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
                priority={idx === 0}
              />
              {it.label && (
                <span className="absolute left-3 top-3 px-2 py-1 text-xs font-semibold rounded-full bg-[#54b435] text-white shadow">
                  {it.label}
                </span>
              )}
            </div>
            <figcaption className="p-4 text-gray-700">{it.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
