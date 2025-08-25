export default function Timeline() {
  const steps = [
    {
      year: "Avant 2020",
      title: "Les bases",
      text: "Expérience terrain en boutique spécialisée. Le goût du travail bien fait et de la pédagogie client."
    },
    {
      year: "2020",
      title: "Le déclic",
      text: "La fermeture de l’enseigne suite au Covid confirme une conviction : réparer et reconditionner, c’est essentiel."
    },
    {
      year: "2021–2024",
      title: "Atelier à domicile",
      text: "Premiers clients, bouche-à-oreille et process qualité qui se rodent à Marchienne."
    },
    {
      year: "Août 2025",
      title: "Passage à temps plein",
      text: "RecoPhone s’installe à Jemeppe-sur-Sambre pour servir davantage et plus vite."
    }
  ];

  return (
    <section id="frise" className="container mx-auto px-4 py-16 lg:py-24">
      <h2 className="text-3xl md:text-4xl font-bold mb-10">Une trajectoire simple et claire</h2>
      <ol className="relative border-s border-gray-200 pl-6">
        {steps.map((s, i) => (
          <li key={i} className="mb-10 ms-4">
            <div className="absolute w-3 h-3 bg-[#54b435] rounded-full -start-1.5 mt-1.5" />
            <time className="text-sm font-semibold text-[#54b435]">{s.year}</time>
            <h3 className="text-xl font-semibold mt-1">{s.title}</h3>
            <p className="text-gray-700 mt-1">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
