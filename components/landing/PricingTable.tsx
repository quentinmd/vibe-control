"use client";

import { useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { PRICING_PLANS } from "@/lib/pricing";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function PricingTable() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const calculatePrice = (basePrice: number) => {
    if (billingPeriod === "annual") {
      return (basePrice * 12 * 0.8).toFixed(2);
    }
    return basePrice.toFixed(2);
  };

  const handleSubscribe = async (
    planId: string,
    stripePriceIds?: { monthly?: string; annual?: string },
  ) => {
    // Plan gratuit → redirection vers /host
    if (planId === "free") {
      if (!user) {
        router.push("/signup");
      } else {
        router.push("/host");
      }
      return;
    }

    // Plans payants
    if (!user) {
      // Pas connecté → redirection vers signup
      router.push("/signup");
      return;
    }

    // Utilisateur connecté → créer session Stripe Checkout
    const stripePriceId =
      billingPeriod === "annual"
        ? stripePriceIds?.annual
        : stripePriceIds?.monthly;

    if (!stripePriceId) {
      alert(
        "Configuration Stripe manquante pour ce plan et cette période de facturation",
      );
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: stripePriceId,
          tier: planId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur: " + (data.error || "Impossible de créer la session"));
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Erreur lors de la création de la session de paiement");
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-20 bg-white" id="pricing">
      <div className="section-container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tarifs Simples et Transparents
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Choisissez le plan qui correspond à vos besoins. Changez ou annulez
            à tout moment.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-white text-primary-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-white text-primary-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annuel
              <span className="text-xs bg-accent-500 text-white px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative card p-8 flex flex-col animate-slide-up ${
                plan.popular
                  ? "ring-2 ring-primary-500 shadow-xl scale-105"
                  : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Populaire
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>

                <div className="flex items-baseline justify-center gap-1">
                  {plan.price === 0 ? (
                    <span className="text-5xl font-bold text-gray-900">
                      Gratuit
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        {billingPeriod === "annual"
                          ? calculatePrice(plan.price)
                          : plan.price}
                      </span>
                      <span className="text-gray-600">
                        {plan.currency}/
                        {billingPeriod === "annual" ? "an" : "mois"}
                      </span>
                    </>
                  )}
                </div>
                {billingPeriod === "annual" && plan.price > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Soit {plan.price}€/mois facturé annuellement
                  </p>
                )}
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.popular ? "btn-primary" : "btn-outline"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 mt-8 text-sm">
          * Toutes les fonctionnalités Premium incluent également les
          fonctionnalités du plan Gratuit
        </p>
      </div>
    </section>
  );
}
