import content from "@/data/site-content.json";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Integrations from "@/components/Integrations";
import Process from "@/components/Process";
import Proof from "@/components/home/Proof";
import PricingTeaser from "@/components/home/PricingTeaser";
import Pains from "@/components/home/Pains";
import WhatWeBuild from "@/components/home/WhatWeBuild";
import WhyCustom from "@/components/home/WhyCustom";
import Team from "@/components/home/Team";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

// Every section is a server-rendered <section id> inside <main>: the Tracker reads them once at mount for section views.
export default function Page() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar brand={content.brand.name} links={content.nav} cta={content.navCta} />
      <main id="main">
        <Hero />
        <Pains />
        <WhatWeBuild />
        <Integrations />
        <WhyCustom />
        <Proof />
        <Process />
        <PricingTeaser />
        <Team />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
