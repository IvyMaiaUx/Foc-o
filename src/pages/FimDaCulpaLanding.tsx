import { useRef } from 'react';
import { Navbar } from './ebook/components/Navbar';
import { Reveal } from './ebook/components/Reveal';
import { LeadForm } from './ebook/components/LeadForm';
import { Footer } from './ebook/components/Footer';

export function FimDaCulpaLanding() {
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

      <section className="px-6 md:px-16 lg:px-24 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
          <Reveal>
            <span
              style={{
                color: '#B07C3A',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Grátis · Bem-estar do tutor
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                color: '#1E1E1E',
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                lineHeight: 1.15,
                fontWeight: 500,
              }}
            >
              O Fim da Culpa
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                color: '#555',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                fontWeight: 300,
                maxWidth: '520px',
              }}
            >
              Aprenda a lidar com a culpa de deixar seu cão sozinho e construa uma rotina mais
              saudável para vocês dois — um guia curto, direto e sem julgamento.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <button
              onClick={scrollToForm}
              style={{
                marginTop: '8px',
                backgroundColor: '#055A43',
                color: '#F7F5EF',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.95rem',
                fontWeight: 500,
                padding: '16px 32px',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Baixar e-book grátis
            </button>
          </Reveal>
        </div>
      </section>

      <LeadForm formRef={formRef} contentName="ebook_fim_da_culpa" />
      <Footer />
    </div>
  );
}
