import { useRef, type CSSProperties } from 'react';
import { BookOpen, Check, Mail, Sprout } from 'lucide-react';
import { Navbar } from './ebook/components/Navbar';
import { Reveal } from './ebook/components/Reveal';
import { LeadForm } from './ebook/components/LeadForm';
import { Footer } from './ebook/components/Footer';
import { BrandLogo } from './ebook/components/BrandLogo';

// Tudo o que a página promete sai do próprio material e do e-mail de entrega
// (api/_email.js → leadMagnetFimDaCulpaEmail). Não há depoimento, número ou nota aqui de
// propósito: nada disso existe para este guia, e inventar foi o que já rendeu alerta de
// "páginas enganosas" no Search Console.

const eyebrow: CSSProperties = {
  color: '#B07C3A',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.78rem',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  color: '#1E1E1E',
  fontSize: 'clamp(1.5rem, 3.4vw, 2rem)',
  lineHeight: 1.2,
  fontWeight: 500,
};

const body: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  color: '#4A544D',
  fontSize: '1rem',
  lineHeight: 1.7,
};

const CONTEUDO = [
  {
    titulo: 'O que está acontecendo com seu cão',
    texto: 'Por que ele sofre quando você sai — e por que a culpa que você sente faz sentido, mas não precisa te paralisar.',
  },
  {
    titulo: 'O que fazer a partir de hoje',
    texto: 'Ações práticas para começar já, com mais clareza e menos peso.',
  },
];

const PASSOS = [
  { icon: Check, titulo: 'Deixe seu nome e e-mail', texto: 'Só isso. Sem cadastro, sem senha e sem cartão.' },
  { icon: Mail, titulo: 'Receba o link por e-mail', texto: 'Costuma chegar em poucos minutos, com o assunto “Guia: O Fim da Culpa”.' },
  { icon: BookOpen, titulo: 'Leia no seu ritmo', texto: 'Abra no celular ou no computador e comece pelas ações práticas.' },
];

export function FimDaCulpaLanding() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Leva o foco pro primeiro campo sem pular a rolagem suave.
    window.setTimeout(() => document.getElementById('lead-name')?.focus({ preventScroll: true }), 450);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)', backgroundColor: '#F7F5EF', overflowX: 'hidden' }}>
      <Navbar onCtaClick={scrollToForm} />
      <div style={{ height: '64px' }} />

      {/* Hero: valor à esquerda, formulário à direita. No celular o formulário vem logo
          depois do texto, sem precisar rolar a página inteira até achar onde pedir. */}
      <section className="px-5 md:px-16 lg:px-24 pt-10 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-start">
          <div className="flex flex-col gap-6">
            <Reveal>
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  style={{
                    width: '64px',
                    height: '84px',
                    borderRadius: '8px',
                    backgroundColor: '#055A43',
                    boxShadow: '8px 10px 24px rgba(5,90,67,0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '9px 8px',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <BrandLogo tone="light" width={34} />
                  <span style={{ fontFamily: 'var(--font-serif)', color: '#F7F5EF', fontSize: '0.62rem', lineHeight: 1.1 }}>
                    O Fim
                    <br />
                    da Culpa
                  </span>
                </div>
                <span style={eyebrow}>E-book gratuito · Para tutores</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: '#1E1E1E',
                  fontSize: 'clamp(2.1rem, 5.5vw, 3.4rem)',
                  lineHeight: 1.08,
                  fontWeight: 500,
                }}
              >
                O Fim da Culpa
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p style={{ ...body, fontSize: 'clamp(1.05rem, 2.2vw, 1.2rem)', color: '#333B35', maxWidth: '560px' }}>
                Um guia curto e sem julgamento para entender por que seu cão sofre quando você sai de
                casa — e o que fazer a respeito, sem se culpar no processo.
              </p>
            </Reveal>

            {/* No celular o formulário fica abaixo da dobra: um atalho logo após a promessa. */}
            <Reveal delay={0.17} className="lg:hidden">
              <button
                onClick={scrollToForm}
                style={{
                  width: '100%',
                  backgroundColor: '#055A43',
                  color: '#F7F5EF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: '52px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Receber o e-book grátis
              </button>
            </Reveal>

            <Reveal delay={0.2}>
              <div
                style={{
                  borderTop: '1px solid #E0DACE',
                  paddingTop: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  maxWidth: '560px',
                }}
              >
                <p style={{ ...eyebrow, color: '#055A43' }}>O que tem no guia</p>
                <ol className="flex flex-col gap-4">
                  {CONTEUDO.map((item, i) => (
                    <li key={item.titulo} className="flex gap-4">
                      <span
                        aria-hidden="true"
                        style={{
                          fontFamily: 'var(--font-serif)',
                          color: '#055A43',
                          fontSize: '1.4rem',
                          lineHeight: 1,
                          minWidth: '24px',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ fontFamily: 'var(--font-sans)', color: '#1E1E1E', fontWeight: 500, fontSize: '1rem', lineHeight: 1.4 }}>
                          {item.titulo}
                        </p>
                        <p style={{ ...body, fontSize: '0.95rem', marginTop: '4px' }}>{item.texto}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} className="lg:sticky lg:top-24">
            <LeadForm formRef={formRef} contentName="ebook_fim_da_culpa" delivery="fim_da_culpa" />
          </Reveal>
        </div>
      </section>

      {/* Como funciona: tira a dúvida "o que acontece depois que eu enviar". */}
      <section style={{ backgroundColor: '#EFEBE2' }} className="px-5 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <Reveal>
            <h2 style={sectionTitle}>Como você recebe</h2>
          </Reveal>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo}>
              <Reveal delay={0.06 * i} style={{ height: '100%' }}>
                <div
                  style={{
                    backgroundColor: '#F7F5EF',
                    border: '1px solid #E0DACE',
                    borderRadius: '16px',
                    padding: '22px',
                    display: 'flex',
                    gap: '14px',
                    height: '100%',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#DDEFE7',
                      color: '#055A43',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <passo.icon size={18} />
                  </span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', color: '#1E1E1E', fontWeight: 500, fontSize: '1rem' }}>{passo.titulo}</p>
                    <p style={{ ...body, fontSize: '0.92rem', marginTop: '4px' }}>{passo.texto}</p>
                  </div>
                </div>
              </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Para quem é — e o que o guia não é. Honestidade sobre o limite do material. */}
      <section className="px-5 md:px-16 lg:px-24 py-16 md:py-24">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <Reveal>
            <span className="flex items-center gap-2" style={{ ...eyebrow, color: '#055A43' }}>
              <Sprout size={16} aria-hidden="true" /> Para quem é
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 style={sectionTitle}>Para quem sai de casa com o coração apertado</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={body}>
              Se você fica pensando no seu cão enquanto está fora, ou volta para casa já esperando
              encontrar sinais de que ele passou mal, este guia é um bom ponto de partida para trocar a
              culpa por um plano.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p style={{ ...body, fontSize: '0.92rem', color: '#6B7A6E' }}>
              É um material introdutório. Se o quadro do seu cão for mais intenso, vale buscar
              acompanhamento de um profissional.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <button
              onClick={scrollToForm}
              style={{
                alignSelf: 'flex-start',
                marginTop: '6px',
                backgroundColor: '#055A43',
                color: '#F7F5EF',
                fontFamily: 'var(--font-sans)',
                fontSize: '1rem',
                fontWeight: 500,
                minHeight: '52px',
                padding: '14px 30px',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#044835')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#055A43')}
            >
              Quero o guia grátis
            </button>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
