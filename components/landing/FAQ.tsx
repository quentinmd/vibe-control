"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Comment fonctionne Vibe Control ?",
      answer:
        "Vibe Control vous permet de créer une session musicale collaborative. Vous générez un QR code que vos invités scannent pour suggérer des morceaux. Vous recevez ces suggestions en temps réel et décidez ce qui rejoint la playlist active. Tout est synchronisé instantanément sur tous les appareils.",
    },
    {
      question: "Dois-je installer une application ?",
      answer:
        "Non ! Vibe Control fonctionne directement dans votre navigateur. Les invités scannent simplement le QR code avec leur smartphone et accèdent immédiatement à l'interface de suggestion sans rien installer.",
    },
    {
      question: "Quelles plateformes musicales sont supportées ?",
      answer:
        "Le plan gratuit inclut YouTube. Les plans Premium et Pro incluent également l'intégration Spotify Premium pour une qualité audio optimale et un catalogue musical complet.",
    },
    {
      question: "Puis-je utiliser Vibe Control sans connexion internet ?",
      answer:
        "Une connexion internet est nécessaire pour la synchronisation en temps réel et la lecture musicale. Cependant, une connexion basique suffit – pas besoin de haut débit.",
    },
    {
      question: "Comment annuler mon abonnement ?",
      answer:
        "Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. L'annulation prend effet à la fin de votre période de facturation actuelle. Aucun engagement, aucun frais caché.",
    },
    {
      question: "Y a-t-il une limite au nombre d'invités ?",
      answer:
        "Le plan gratuit autorise jusqu'à 20 invités simultanés. Les plans Premium et Pro n'ont aucune limite – invitez autant de personnes que vous le souhaitez !",
    },
    {
      question: "Puis-je personnaliser l'interface ?",
      answer:
        "Le plan Pro inclut des options de personnalisation avancées : branding personnalisé, domaine custom, et design du QR code. Parfait pour les établissements et événements professionnels.",
    },
    {
      question: "Les données sont-elles sécurisées ?",
      answer:
        "Absolument. Nous utilisons le chiffrement de bout en bout et nos serveurs sont hébergés en Europe. Nous ne partageons jamais vos données avec des tiers. Conforme RGPD.",
    },
  ];

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Questions Fréquentes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur Vibe Control
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-primary-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
