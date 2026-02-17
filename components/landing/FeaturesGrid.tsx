"use client";

import { QrCode, Clock, CheckCircle, Radio } from "lucide-react";

export default function FeaturesGrid() {
  const features = [
    {
      icon: QrCode,
      title: "QR Code Instantané",
      description:
        "Générez un QR code unique en une seconde. Vos invités scannent et suggèrent immédiatement.",
    },
    {
      icon: Clock,
      title: "Modération Temps Réel",
      description:
        "Validez ou refusez chaque suggestion instantanément. Gardez le contrôle total de l'ambiance.",
    },
    {
      icon: Radio,
      title: "Synchronisation Automatique",
      description:
        "Tous les appareils se synchronisent en temps réel grâce à notre technologie Realtime.",
    },
    {
      icon: CheckCircle,
      title: "Playlist Contrôlée",
      description:
        "Fini les morceaux inappropriés. Vous décidez ce qui passe, vos invités participent.",
    },
  ];

  return (
    <section className="py-20 bg-white" id="features">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Fonctionnalités Puissantes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour organiser la soirée musicale
            parfaite
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card-feature text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
