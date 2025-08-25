'use client'

import Image from 'next/image';
import { motion } from 'framer-motion';
import abonnementImage from '/public/images/contents/abonnements_recophone.png'; 

export default function HeaderSection() {
  return (
    <section className="relative bg-[#edfbe2] overflow-hidden py-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-10">
        {/* Colonne gauche */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#222] uppercase leading-tight">
            Protégez votre smartphone.<br />
            <span className="text-recophone-brand">Et votre portefeuille</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mt-6 max-w-xl">
            Avec nos abonnements responsables, vous évitez les mauvaises surprises, 
            vous économisez dès aujourd’hui et vous contribuez à une planète plus verte.
          </p>
        </div>

        {/* Colonne droite : image flottante */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="hidden md:flex justify-center"
        >
          <Image
            src={abonnementImage}
            alt="Tablette et smartphone écoresponsables RecoPhone"
            width={400}
            height={400}
            className="w-full max-w-[400px] drop-shadow-xl"
            priority
          />
        </motion.div>
      </div>
    </section>
  );
}
