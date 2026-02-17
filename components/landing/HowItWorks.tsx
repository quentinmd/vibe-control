"use client";

import { Users, QrCode, CheckCircle, PartyPopper } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: Users,
      title: "Créez votre session",
      description:
        "En quelques secondes, configurez votre soirée et obtenez un QR code unique à partager.",
    },
    {
      number: "2",
      icon: QrCode,
      title: "Invités scannent",
      description:
        "Vos invités scannent le QR code avec leur smartphone. Aucune app à installer.",
    },
    {
      number: "3",
      icon: CheckCircle,
      title: "Vous validez",
      description:
        "Recevez les suggestions en temps réel et décidez ce qui rejoint la playlist active.",
    },
    {
      number: "4",
      icon: PartyPopper,
      title: "Profitez",
      description:
        "La musique joue automatiquement. Vous gardez le contrôle, vos invités participent.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50" id="demo">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            4 étapes simples pour une soirée musicale collaborative réussie
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection line (desktop only) */}
          <div className="hidden lg:block absolute top-20 left-0 w-full h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 relative z-10">
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
