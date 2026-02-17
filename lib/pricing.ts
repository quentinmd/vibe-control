export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  limits: {
    sessions: string;
    suggestions: string;
    guests: string;
    duration: string;
  };
  cta: string;
  popular?: boolean;
  stripePriceId?: string; // For future Stripe integration
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    currency: "€",
    period: "mois",
    description: "Parfait pour découvrir Vibe Control",
    features: [
      "1 session active à la fois",
      "Jusqu'à 50 suggestions par session",
      "Lecteur YouTube intégré",
      "QR Code instantané",
      "20 invités maximum",
      "Durée de session : 4h",
    ],
    limits: {
      sessions: "1 active",
      suggestions: "50 par session",
      guests: "20 max",
      duration: "4h max",
    },
    cta: "Commencer gratuitement",
    stripePriceId: "", // To be filled later
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    currency: "€",
    period: "mois",
    description: "Idéal pour les organisateurs réguliers",
    features: [
      "Sessions illimitées simultanées",
      "Suggestions illimitées",
      "Intégration Spotify Premium",
      "Durée de session illimitée",
      "Invités illimités",
      "Analytics et statistiques",
      "Personnalisation du QR Code",
      "Sans publicité",
      "Support prioritaire",
    ],
    limits: {
      sessions: "Illimité",
      suggestions: "Illimité",
      guests: "Illimité",
      duration: "Illimité",
    },
    cta: "Démarrer Premium",
    popular: true,
    stripePriceId: "", // To be filled later
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    currency: "€",
    period: "mois",
    description: "Pour les professionnels et événements",
    features: [
      "Tout Premium inclus",
      "Multi-hôtes (co-modération)",
      "Branding personnalisé",
      "Domaine personnalisé",
      "Accès API",
      "Backup automatique des sessions",
      "Dashboard analytics avancé",
      "Statistiques d'engagement",
      "Support dédié 24/7",
      "Formation personnalisée",
    ],
    limits: {
      sessions: "Illimité",
      suggestions: "Illimité",
      guests: "Illimité",
      duration: "Illimité",
    },
    cta: "Contacter l'équipe",
    stripePriceId: "", // To be filled later
  },
];

export const ANNUAL_DISCOUNT = 0.2; // 20% discount for annual billing
