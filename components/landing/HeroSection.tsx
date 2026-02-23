"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Contrôlez la Musique de Vos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                Soirées
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              La playlist collaborative où vous gardez le contrôle total. Vos
              invités suggèrent, vous validez. Simple, rapide, et en temps réel.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <button className="btn-primary w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <a href="#demo">
                <button className="btn-secondary w-full sm:w-auto min-w-[180px] flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Voir la démo
                </button>
              </a>
            </div>

            <p className="text-sm text-gray-500">
              ✓ Pas de carte bancaire requise ✓ Gratuit jusqu'à 50 suggestions
            </p>
          </div>

          {/* Right column - Hero image placeholder */}
          <div className="relative animate-slide-up">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-100 to-accent-100 aspect-video flex items-center justify-center">
              {/* Placeholder for future image/video */}
              <div className="text-center p-8">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white" />
                </div>
                <p className="text-gray-600 font-medium">
                  Vidéo de démonstration
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-200 rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-200 rounded-full opacity-50 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
