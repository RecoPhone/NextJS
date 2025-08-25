'use client';

import { ShieldCheck, DatabaseBackup, Wrench, Clock } from 'lucide-react';

export default function AvantagesSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Colonne gauche : Storytelling */}
        <div className="text-gray-700 space-y-6 text-base md:text-lg leading-relaxed">
          <h2 className="text-3xl md:text-4xl font-bold text-[#222] uppercase mb-4">
            Pourquoi nos abonnements changent tout ?
          </h2>

          <p>
            Un jour, c’est un écran fissuré. Un autre, une batterie qui faiblit. Et parfois, tout s’éteint sans prévenir.
            <br />
            <strong className="text-recophone-brand font-semibold">
              Le problème, c’est toujours le même : vous n’avez pas le temps, ni le budget pour ça.
            </strong>
          </p>

          <p>
            Chez RecoPhone, on a créé une solution pour changer ça.  
            <strong> Nos abonnements</strong> vous assurent que <em>tout est prévu à l’avance</em>.  
            Vous n’êtes plus seul face aux imprévus.
          </p>

          <p className="text-xl font-semibold text-[#222] mt-4">
            Et ça change tout.  
            Vraiment.
          </p>
        </div>

        {/* Colonne droite : Avantages listés */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-7 h-7 text-recophone-brand mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-[#222]">
                Vous êtes couvert avant même qu’un problème arrive
              </h3>
              <p className="text-gray-600 text-sm">
                Finies les urgences et les dépenses surprises. Vous êtes déjà protégé.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <DatabaseBackup className="w-7 h-7 text-recophone-brand mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-[#222]">
                Vos données sont en sécurité
              </h3>
              <p className="text-gray-600 text-sm">
                Une sauvegarde mensuelle automatique pour ne jamais rien perdre.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Wrench className="w-7 h-7 text-recophone-brand mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-[#222]">
                Des réparations à tarif préférentiel
              </h3>
              <p className="text-gray-600 text-sm">
                Jusqu’à 20% de réduction, intervention rapide, et priorité SAV.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Clock className="w-7 h-7 text-recophone-brand mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-[#222]">
                Vous gagnez du temps. Et de la sérénité.
              </h3>
              <p className="text-gray-600 text-sm">
                Assistance itinérante sous 24h ou 48h. Vous continuez votre journée, RecoPhone s’occupe du reste.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
