import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { FeaturedItems } from "@/components/featured-items";
import { ImpactStats } from "@/components/impact-stats";
import { AboutSection } from "@/components/about-section";
import { Footer } from "@/components/footer";
import { LocationProvider } from "@/context/LocationProvider";
import { useEffect } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";
const Index = () => {
  const { hash } = useRouterLocation();

  // Links such as /#how-it-works can arrive from other pages; jump to the section once it has rendered
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  return (
    <LocationProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <HeroSection />
        <HowItWorks />
        <FeaturedItems />
        <ImpactStats />
        <AboutSection />
        <Footer />
      </div>
    </LocationProvider>
  );
};

export default Index;
