"use client";

import { Users, Music, Zap } from "lucide-react";

export default function SocialProof() {
  const stats = [
    {
      icon: Music,
      value: "1,000+",
      label: "Soirées organisées",
    },
    {
      icon: Users,
      value: "10,000+",
      label: "Morceaux joués",
    },
    {
      icon: Zap,
      value: "99%",
      label: "Taux de satisfaction",
    },
  ];

  return (
    <section className="py-12 bg-gray-50 border-y border-gray-200">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Optional: Partner logos section (placeholder) */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">
            Utilisé par des organisateurs du monde entier
          </p>
          {/* Placeholder for future partner logos */}
        </div>
      </div>
    </section>
  );
}
