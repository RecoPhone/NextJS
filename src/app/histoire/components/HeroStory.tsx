"use client";
import Image from "next/image";
import Link from "next/link";

export default function HeroStory() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[#edfbe2]/70" aria-hidden />
      <div className="container mx-auto px-4 py-20 lg:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              L’<span className="text-[#54b435]">histoire</span> de RecoPhone
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              Réparer mieux, prolonger la vie des appareils et offrir une alternative
              plus responsable : voilà ce qui nous anime depuis le premier tournevis.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#origine" className="px-5 py-3 rounded-2xl bg-[#54b435] text-white font-semibold hover:opacity-90 transition">
                Découvrir notre trajectoire
              </Link>
              <Link href="/devis" className="px-5 py-3 rounded-2xl border border-[#54b435] text-[#54b435] font-semibold hover:bg-[#54b435]/10 transition">
                Demander un devis
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-3xl shadow-xl overflow-hidden">
            <Image
              src="/images/histoire/BenCollin_Marchienne.webp"
              alt="Travail minutieux sur un smartphone dans un atelier à domicile"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
