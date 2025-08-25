// src/app/accueil/WhySection.tsx
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import pointingBen from "/public/images/contents/recophone.png";

const Keyword = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-extrabold text-[#222] underline decoration-[#54b435] decoration-2 underline-offset-4 hover:decoration-4">
    {children}
  </strong>
);

export default function WhySection() {
  // JSON-LD: Local SEO + services
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "RecoPhone",
    url: "https://www.recophone.be",
    email: "hello@recophone.be",
    telephone: "+32 492 09 05 33",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rte de Saussin 38/23a",
      addressLocality: "Jemeppe-sur-Sambre",
      postalCode: "5190",
      addressRegion: "Namur",
      addressCountry: "BE",
    },
    areaServed: [
      "Jemeppe-sur-Sambre",
      "Sambreville",
      "Namur",
      "Province de Namur",
      "Belgique",
    ],
    knowsAbout: [
      "réparation smartphone",
      "réparation iPhone",
      "réparation Samsung",
      "remplacement écran",
      "remplacement batterie",
      "dock de charge",
      "face arrière",
      "réparation tablette iPad",
      "smartphone reconditionné",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services de réparation RecoPhone",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Remplacement écran smartphone" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Changement de batterie" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Réparation dock de charge" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Remplacement face arrière" } },
      ],
    },
  };

  return (
    <section
      id="pourquoi-recophone"
      className="bg-[#edfbe2] py-24 scroll-mt-24"
      aria-labelledby="why-title"
      itemScope
      itemType="https://schema.org/LocalBusiness"
    >
      {/* JSON-LD pour SEO local (Google) */}
      <Script
        id="recophone-why-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-6 flex flex-col-reverse lg:flex-row items-center gap-16">
        {/* IMAGE */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="w-[80%] sm:w-[70%] lg:w-[100%]">
            <Image
              src={pointingBen}
              alt="Ben de RecoPhone – réparation smartphone éco‑responsable à Namur"
              className="w-full h-auto object-contain"
              sizes="(min-width:1024px) 50vw, 90vw"
              priority
            />
          </div>
        </div>

            {/* TEXTE MANIFESTE */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-4xl font-extrabold text-[#222] mb-6 leading-tight">
                RecoPhone est une <span className="text-[#54b435]">solution durable</span><br />
                mais <span className="text-[#54b435]">c’est vous</span> qui faites la différence
            </h2>

            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Chez <strong className="keyword">RecoPhone</strong>, on ne se contente pas de
                <strong className="keyword"> réparer des téléphones</strong>.
                <br /><br />
                Avec vous, on évite des <strong className="keyword">déchets électroniques</strong>.
                Grâce à votre choix de <strong className="keyword">réparation smartphone à Namur</strong>,
                on réduit notre <strong className="keyword">empreinte carbone</strong>.
                <br />
                On sélectionne des <strong className="keyword">pièces durables</strong> et
                <strong className="keyword"> garanties</strong>, choisies avec soin.
                <br />
                On propose des <strong className="keyword">tarifs justes</strong>, parce que
                l’<strong className="keyword">écologie</strong> ne doit pas être un luxe.
                <br /><br />
                On rend la <strong className="keyword">réparation</strong>
                <strong className="keyword"> simple</strong>, <strong className="keyword">rapide</strong> et
                <strong className="keyword"> accessible</strong>.
                <br /><br />
                Et surtout : <strong className="keyword">c’est votre décision</strong> qui fait vivre RecoPhone -
                <strong className="keyword"> on fait tout ça avec vous</strong>.
            </p>
            </div>
      </div>
    </section>
  );
}
