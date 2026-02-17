import HeroSection from "@/components/landing/HeroSection";
import SocialProof from "@/components/landing/SocialProof";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingTable from "@/components/landing/PricingTable";
import UseCases from "@/components/landing/UseCases";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

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
