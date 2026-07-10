import { useRef } from 'react';
import { Navbar } from './ebook/components/Navbar';
import { HeroSection } from './ebook/components/HeroSection';
import { PainSection } from './ebook/components/PainSection';
import { TestimonialsSection } from './ebook/components/TestimonialsSection';
import { LearnSection } from './ebook/components/LearnSection';
import { BenefitsSection } from './ebook/components/BenefitsSection';
import { EditorialSection } from './ebook/components/EditorialSection';
import { LeadForm } from './ebook/components/LeadForm';
import { AppCTA } from './ebook/components/AppCTA';
import { Footer } from './ebook/components/Footer';

export function EbookLanding() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      style={{
        fontFamily: 'var(--font-sans)',
        backgroundColor: '#F7F5EF',
        overflowX: 'hidden',
      }}
    >
      <Navbar onCtaClick={scrollToForm} />
      <div style={{ height: '64px' }} />
      <HeroSection onCtaClick={scrollToForm} />
      <PainSection />
      <TestimonialsSection />
      <LearnSection />
      <BenefitsSection />
      <EditorialSection />
      <LeadForm formRef={formRef} />
      <AppCTA />
      <Footer />
    </div>
  );
}
