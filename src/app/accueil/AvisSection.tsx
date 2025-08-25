"use client";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const testimonials = [
  { name: "Matteo M.", text: "Service très rapide et toujours bien fait ! Je recommande à 1000 %.", stars: 5, photo: "/images/contents/avis/matteo.jpg" },
  { name: "Kirišti Š.", text: "Changement de batterie sur Pixel 7a : super service, rapide et efficace. Merci !", stars: 5, photo: "/images/contents/avis/kiristi.jpg" },
  { name: "Pauline R.", text: "Un nouvel écran au top, une batterie qui tient la charge, et la lentille me permet de refaire de superbes photos !", stars: 5, photo: "/images/contents/avis/pauline.jpg" },
  { name: "Domenico D.", text: "Travail soigné, très rapide et efficace. Je vous recommande vivement RecoPhone, vous en serez très satisfait 😊 N’hésitez surtout pas 😉", stars: 5, photo: "/images/contents/avis/domenico.jpg" },
  { name: "Eileen J.", text: "Très professionnel et travail de qualité ! Je ne peux que vous recommander 😉", stars: 5, photo: "/images/contents/avis/eileen.jpg" },
  { name: "Tedika M.", text: "RecoPhone se distingue par son sérieux, sa transparence et son engagement. Merci Ben pour ton professionnalisme !", stars: 5, photo: "/images/contents/avis/tedika.jpg" },
  { name: "Ben B.", text: "Excellent vendeur ! Très professionnel, à l’écoute et réactif. Le téléphone est en parfait état et livré rapidement. Je recommande vivement pour un achat en toute confiance.", stars: 5, photo: "/images/contents/avis/ben.jpg" },
  { name: "Marco T.", text: "Merci à Ben pour son professionnalisme et sa rapidité ! Je recommande à 100% 💪", stars: 5, photo: "/images/contents/avis/marco.jpg" },
  { name: "Romii I.", text: "Rapide et efficace. Qualité 100 %. Prix attractif.", stars: 5, photo: "/images/contents/avis/romii.jpg" },
  { name: "Adriano P.", text: "Il a réparé mon Samsung A15 en un temps record et à un prix imbattable. Rapide et efficace !", stars: 5, photo: "/images/contents/avis/adriano.jpg" },
];

export default function AvisSection() {
  const [isReady, setIsReady] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);
  const pauseRef = useRef(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1, spacing: 16 },
    breakpoints: {
      "(min-width: 768px)": { slides: { perView: 2, spacing: 24 } },
      "(min-width: 1024px)": { slides: { perView: 3, spacing: 32 } },
    },
    renderMode: "performance",
    created() {
      setIsReady(true);
    },
  });

  // Autoplay + pause on hover/focus
  useEffect(() => {
    if (!instanceRef.current) return;

    const el = sliderContainerRef.current;
    const tick = () => !pauseRef.current && instanceRef.current?.next();
    const id = setInterval(tick, 4000);

    const onEnter = () => (pauseRef.current = true);
    const onLeave = () => (pauseRef.current = false);

    el?.addEventListener("mouseenter", onEnter);
    el?.addEventListener("mouseleave", onLeave);
    el?.addEventListener("focusin", onEnter);
    el?.addEventListener("focusout", onLeave);

    return () => {
      clearInterval(id);
      el?.removeEventListener("mouseenter", onEnter);
      el?.removeEventListener("mouseleave", onLeave);
      el?.removeEventListener("focusin", onEnter);
      el?.removeEventListener("focusout", onLeave);
    };
  }, [instanceRef]);

  return (
    <section className="bg-white py-20 px-4 md:px-12">
      <div className="max-w-6xl mx-auto text-center relative">
        <h2 className="text-3xl md:text-4xl font-bold text-[#222] mb-6">
          Ils font confiance à RecoPhone
        </h2>
        <p className="text-[#222] mb-12 text-lg">
          Grâce à vous, on répare plus, on jette moins. <b>Merci pour votre engagement !</b>
        </p>

        {/* Flèches */}
        <div className="absolute top-[55%] left-0 z-10 hidden md:block">
          <button
            aria-label="Avis précédent"
            className="bg-[#edfbe2] hover:bg-[#d4f0c4] p-2 rounded-full shadow"
            onClick={() => instanceRef.current?.prev()}
          >
            <ChevronLeft className="text-[#54b435]" size={24} />
          </button>
        </div>
        <div className="absolute top-[55%] right-0 z-10 hidden md:block">
          <button
            aria-label="Avis suivant"
            className="bg-[#edfbe2] hover:bg-[#d4f0c4] p-2 rounded-full shadow"
            onClick={() => instanceRef.current?.next()}
          >
            <ChevronRight className="text-[#54b435]" size={24} />
          </button>
        </div>

        {/* Carrousel */}
        <div
          ref={(el) => {
            sliderRef(el);
            sliderContainerRef.current = el;
          }}
          className={`keen-slider transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}
        >
          {testimonials.map((avis, index) => (
            <div
              key={`${avis.name}-${index}`}
              className="keen-slider__slide bg-[#edfbe2] p-6 rounded-2xl shadow-xl flex flex-col items-center text-center"
            >
              <Image
                src={avis.photo}
                alt={`Photo de ${avis.name}`}
                width={80}
                height={80}
                sizes="80px"
                className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-[#54b435] select-none"
                draggable={false}
                priority={index === 0}
              />
              <div className="flex justify-center mb-2 text-green-600">
                {Array.from({ length: avis.stars }).map((_, i) => (
                  <Star key={i} size={18} fill="#54b435" className="text-[#54b435]" />
                ))}
              </div>
              <p className="text-[#222] italic mb-3 text-sm line-clamp-4">“{avis.text}”</p>
              <p className="font-semibold text-[#54b435]">{avis.name}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full text-center py-16">
          <h3 className="text-xl md:text-2xl font-semibold text-[#222] uppercase mb-4 tracking-wide">
            Et si c’était votre appareil qu’on réparait ensuite ?
          </h3>
          <p className="text-[#222] mb-6 uppercase tracking-widest text-sm md:text-base">
            Demandez votre devis gratuit, rapide et sans engagement
          </p>
          <Link
            href="/devis"
            className="inline-block bg-[#54b435] text-white px-6 py-3 rounded-xl font-bold text-base md:text-lg uppercase motion-safe:animate-pulse hover:bg-[#449a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#54b435]/40"
            aria-label="Aller à la page devis"
          >
            Réaliser mon devis
          </Link>
        </div>
      </div>
    </section>
  );
}
