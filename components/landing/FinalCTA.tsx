"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Prêt à Contrôler la Vibe de Votre Prochaine Soirée ?
          </h2>

          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers d'organisateurs qui font confiance à Vibe
            Control pour créer l'ambiance musicale parfaite.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/host">
              <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 min-w-[220px]">
                Commencer Maintenant
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>

            <a href="#pricing">
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 min-w-[180px]">
                Voir les Tarifs
              </button>
            </a>
          </div>

          <p className="text-white/80 text-sm mt-6">
            Gratuit jusqu'à 50 suggestions • Sans carte bancaire
          </p>
        </div>
      </div>
    </section>
  );
}
