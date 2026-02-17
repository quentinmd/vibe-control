"use client";

import { Home, Building2, Heart, Briefcase } from "lucide-react";

export default function UseCases() {
  const useCases = [
    {
      icon: Home,
      title: "Soirées Privées",
      description:
        "Entre amis ou en famille, laissez tout le monde participer à la playlist sans perdre le contrôle.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Building2,
      title: "Bars & Clubs",
      description:
        "Engagez vos clients et créez une ambiance unique en leur donnant une voix dans la playlist.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Heart,
      title: "Mariages & Événements",
      description:
        "Le jour parfait mérite la playlist parfaite. Vos invités suggèrent, vous orchestrez.",
      gradient: "from-red-500 to-orange-500",
    },
    {
      icon: Briefcase,
      title: "Événements d'Entreprise",
      description:
        "Team building ou soirée d'entreprise, créez une ambiance collaborative et mémorable.",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="section-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Pour Toutes Vos Occasions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Que vous organisiez une fête ou gériez un établissement, Vibe
            Control s'adapte à vous
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
