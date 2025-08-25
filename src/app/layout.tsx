import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "RecoPhone",
  description:
    "Réparation et reconditionnement de smartphones/tablettes. Écologie & économie circulaire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#edfbe2] text-[#222]">
        <CartProvider>
          <Navbar />     
          {children}
        </CartProvider>
          <Footer />
      </body>
    </html>
  );
}
