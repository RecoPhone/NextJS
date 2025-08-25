import type { Metadata } from "next";
import Script from "next/script";
import HeroStory from "./components/HeroStory";
import Origin from "./components/Origin";
import Values from "./components/Values";
import Timeline from "./components/Timeline";
import Gallery from "./components/Gallery";
import LocalTrust from "./components/LocalTrust";
import CTA from "./components/CTA";
import FAQ from "./components/FAQ";

export const metadata: Metadata = {
  title: "L’histoire de RecoPhone – Réparer mieux, plus longtemps",
  description:
    "De l’atelier à domicile à Marchienne au passage à temps plein en 2025 : découvrez l’histoire de RecoPhone, réparateur et reconditionneur engagé à Jemeppe-sur-Sambre. Villes desservies : Fleurus, Sombreffe, Sambreville, Temploux, Jemeppe-sur-Sambre, Spy.",
  alternates: { canonical: "/histoire" },
  openGraph: {
    title: "L’histoire de RecoPhone",
    description:
      "Une aventure locale fondée sur l’économie, la durabilité et la proximité client. Zones : Fleurus, Sombreffe, Sambreville, Temploux, Jemeppe-sur-Sambre, Spy.",
    url: "https://www.recophone.be/histoire",
    images: [{ url: "/images/branding/logo_recophone.webp", width: 1200, height: 630, alt: "RecoPhone" }],
    type: "article",
  },
};

export default function PageHistoire() {
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Histoire de RecoPhone",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "RecoPhone",
      "image": "/images/branding/logo_recophone.webp",
      "description": "Réparation et reconditionnement de smartphones et tablettes à Jemeppe-sur-Sambre.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rte de Saussin 38/23a",
        "addressLocality": "Jemeppe-sur-Sambre",
        "postalCode": "5190",
        "addressCountry": "BE"
      },
      "areaServed": [
        "Fleurus",
        "Sombreffe",
        "Sambreville",
        "Temploux",
        "Jemeppe-sur-Sambre",
        "Spy"
      ],
      "url": "https://www.recophone.be"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.recophone.be/" },
        { "@type": "ListItem", "position": 2, "name": "Histoire", "item": "https://www.recophone.be/histoire" }
      ]
    }
  };

  // Organization + Sponsoring
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RecoPhone",
    "logo": "/images/branding/logo_recophone.webp",
    "url": "https://www.recophone.be",
    "sponsor": { "@type": "SportsTeam", "name": "BVB Fleurus (Futsal)" }
  };

  return (
    <>
      <Script id="recophone-about-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />
      <Script id="recophone-org-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <main className="bg-white text-[#222]">
        <HeroStory />
        <Origin />
        <Values />
        <Timeline />
        <Gallery />
        <LocalTrust />
        <CTA />
        <FAQ />
      </main>
    </>
  );
}
