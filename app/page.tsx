import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import SocialProof from "@/components/landing/SocialProof";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingTable from "@/components/landing/PricingTable";
import UseCases from "@/components/landing/UseCases";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title:
    "Vibe Control | Playlist collaborative pour soirées, bars et événements",
  description:
    "Créez une playlist collaborative avec QR code où l'hôte valide chaque suggestion en temps réel. Idéal pour soirées privées, bars, restaurants et événements.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SocialProof />
      <FeaturesGrid />
      <HowItWorks />
      <PricingTable />
      <UseCases />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
