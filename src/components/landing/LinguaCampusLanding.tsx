import "./lingua/landing.css";
import { bricolage, dmSans } from "./lingua/fonts";
import { Hero } from "./lingua/Hero";
import { HowItWorks } from "./lingua/HowItWorks";
import { Management } from "./lingua/Management";
import { Families } from "./lingua/Families";
import { YourBrand } from "./lingua/YourBrand";
import { CaseStudy } from "./lingua/CaseStudy";
import { Founders } from "./lingua/Founders";
import { Pricing } from "./lingua/Pricing";
import { Onboarding } from "./lingua/Onboarding";
import { Faq } from "./lingua/Faq";
import { Contact } from "./lingua/Contact";
import { Footer } from "./lingua/Footer";

// Landing del producto (lingua-campus.com.ar), con el rediseño Cálido aprobado en el
// lienzo el 27/09/2026. Cada sección vive en `lingua/`; acá solo se ordenan y se cargan
// las fuentes. La landing de cada instituto es otra: `InstituteLanding`.

export default function LinguaCampusLanding() {
  return (
    <div className={`lc-landing ${bricolage.variable} ${dmSans.variable} font-body text-lc-ink antialiased`}>
      <Hero />
      <main>
        <HowItWorks />
        <Management />
        <Families />
        <YourBrand />
        <CaseStudy />
        <Founders />
        <Pricing />
        <Onboarding />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
