import HeaderSection from "./accueil/HeaderSection";
import ImpactSection from "./accueil/ImpactSection";
import WhySection from "./accueil/WhySection";
import ServicesSection from "./accueil/ServicesSection";
import AvisSection from "./accueil/AvisSection";
import FAQSection from "./accueil/FAQSection"


export default function AccueilPage() {
  return (
    <main>
      <HeaderSection />
      <ImpactSection />
      <WhySection />
      <ServicesSection />
      <AvisSection />
      <FAQSection />
    </main>
  );
}
