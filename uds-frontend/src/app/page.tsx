import Navbar from "@/components/website/Navbar";
import HeroSection from "@/components/website/HeroSection";
import ProjectsSection from "@/components/website/ProjectsSection";
import ResearchSection from "@/components/website/ResearchSection";
import OutreachSection from "@/components/website/OutreachSection";
import InternshipsSection from "@/components/website/InternshipsSection";
import EventsSection from "@/components/website/EventsSection";
import SponsorsSection from "@/components/website/SponsorsSection";
import AchievementsSection from "@/components/website/AchievementsSection";
import GallerySection from "@/components/website/GallerySection";
import ContactSection from "@/components/website/ContactSection";
import Footer from "@/components/website/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <ProjectsSection />
      <ResearchSection />
      <OutreachSection />
      <InternshipsSection />
      <EventsSection />
      <SponsorsSection />
      <AchievementsSection />
      <GallerySection />
      <ContactSection />
      <Footer />
    </div>
  );
}
