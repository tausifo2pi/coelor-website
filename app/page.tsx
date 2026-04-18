import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Work from "@/components/Stats";
import Capabilities from "@/components/Services";
import Studio from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Capabilities />
        <Studio />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
