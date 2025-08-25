import { ReactNode } from "react";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-700">{children}</p>
    </div>
  );
}

export default function Values() {
  return (
    <section id="valeurs" className="bg-[#edfbe2]">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Nos valeurs, sans compromis</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Économie utile">
            Des réparations au <strong>juste prix</strong> et des appareils qui durent plus longtemps : 
            on évite l’achat neuf quand ce n’est pas nécessaire.
          </Card>
          <Card title="Durabilité">
            Sélection rigoureuse des pièces, reconditionnement soigné, <strong>réduction des déchets</strong>.
          </Card>
          <Card title="Proximité client">
            Conseils clairs, diagnostic honnête et suivi humain.
            Vous parlez directement avec la personne qui répare votre appareil.
          </Card>
        </div>
      </div>
    </section>
  );
}
