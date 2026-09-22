import { useEffect, useRef, type CSSProperties } from 'react';
import {
  BookOpen,
  Check,
  Clock3,
  DoorOpen,
  Heart,
  KeyRound,
  Mail,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Navbar } from './ebook/components/Navbar';
import { Reveal } from './ebook/components/Reveal';
import { LeadForm } from './ebook/components/LeadForm';
import { Footer } from './ebook/components/Footer';

// Todas as promessas abaixo aparecem no próprio guia. Não usamos depoimentos,
// estatísticas ou resultados inventados para forçar conversão.

const colors = {
  pine: '#055A43',
  pineDark: '#043F31',
  paper: '#F7F5EF',
  paperDark: '#EFEBE2',
  ink: '#26322B',
  soft: '#59675E',
  line: '#DED8CC',
  amber: '#B77437',
  amberSoft: '#F5E8D6',
  white: '#FFFDF8',
};

const eyebrow: CSSProperties = {
  color: colors.amber,
  fontFamily: 'var(--font-sans)',
  fontSize: '0.76rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const sectionTitle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  color: colors.ink,
  fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
  lineHeight: 1.12,
  letterSpacing: '-0.025em',
  fontWeight: 500,
};

const body: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  color: colors.soft,
  fontSize: '1rem',
  lineHeight: 1.72,
};

const SINAIS = [
  {
    icon: DoorOpen,
    title: 'A saída pesa antes mesmo da porta fechar',
    text: 'Você pega a chave, ele se agita e a culpa acompanha o resto do seu dia.',
  },
  {
    icon: PawPrint,
    title: 'O comportamento parece desobediência',
    text: 'Latido, choro, xixi ou objetos destruídos deixam você sem saber como reagir.',
  },
  {
    icon: Heart,
    title: 'Você muda a própria rotina',
    text: 'Encurta compromissos, olha a câmera o tempo todo ou evita sair para ele não sofrer.',
  },
  {
    icon: KeyRound,
    title: 'As tentativas não trazem segurança',
    text: 'Despedidas longas e muita festa na volta parecem carinho, mas podem intensificar o momento.',
  },
];

const CAPITULOS = [
  { number: '01', part: 'Entender', title: 'A culpa que você sente não é exagero', text: 'De onde ela vem e como transformar esse peso em direção.' },
  { number: '02', part: 'Entender', title: 'Por que seu cão se desespera', text: 'O que acontece por trás do latido, da destruição e da agitação.' },
  { number: '03', part: 'Entender', title: 'O que a culpa pode te impedir de ver', text: 'Quando uma reação bem-intencionada acaba reforçando o medo.' },
  { number: '04', part: 'Agir', title: 'Por onde começar hoje', text: 'Três mudanças pequenas e possíveis para iniciar sem sobrecarregar a rotina.' },
  { number: '05', part: 'Agir', title: 'Construindo tolerância à ausência', text: 'Um passo a passo gradual, dos primeiros segundos ao tempo real da sua rotina.' },
  { number: '06', part: 'Agir', title: 'Quando comemorar o progresso', text: 'Como perceber avanços reais sem cobrar perfeição de você ou do seu cão.' },
];

const PRIMEIRAS_ACOES = [
  { number: '1', title: 'Neutralize saídas e voltas', text: 'Reduza a intensidade do ritual, sem ser frio e sem ignorar seu cão.' },
  { number: '2', title: 'Quebre a previsão dos gatilhos', text: 'Pegue a chave ou vista o casaco em momentos em que você não vai sair.' },
  { number: '3', title: 'Crie uma associação positiva', text: 'Reserve um item seguro e interessante para os primeiros minutos da ausência.' },
];

const PASSOS = [
  { icon: Check, title: 'Preencha nome e e-mail', text: 'Sem senha, cartão ou cadastro no aplicativo.' },
  { icon: Mail, title: 'Receba o link', text: 'O e-mail costuma chegar em poucos minutos.' },
  { icon: BookOpen, title: 'Leia no seu ritmo', text: 'O arquivo abre no celular ou no computador.' },
];

const FAQ = [
  { question: 'O e-book é realmente gratuito?', answer: 'Sim. Você informa seu nome e e-mail para receber o link, sem cobrança e sem precisar cadastrar cartão.' },
  { question: 'Ele serve para qualquer cão?', answer: 'O guia traz orientações gerais para tutores que percebem sofrimento ligado à ausência. O ritmo e a intensidade do treino precisam respeitar cada cão.' },
  { question: 'O material substitui um profissional?', answer: 'Não. Ele é um ponto de partida. Tentativa de fuga, automutilação, tremores, salivação intensa ou sofrimento persistente merecem avaliação individual.' },
  { question: 'Em quanto tempo vou ver resultado?', answer: 'O guia não promete prazo fechado. Alguns cães avançam em dias; outros precisam de semanas na mesma etapa. A orientação é aumentar o tempo apenas quando a etapa anterior estiver tranquila.' },
];

function PrimaryButton({ onClick, children, full = false }: { onClick: () => void; children: string; full?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: full ? '100%' : undefined,
        backgroundColor: colors.pine,
        color: colors.white,
        fontFamily: 'var(--font-sans)',
        fontSize: '1rem',
        fontWeight: 700,
        minHeight: '54px',
        padding: '14px 28px',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 24px rgba(5,90,67,0.18)',
      }}
    >
      {children}
    </button>
  );
}

export function FimDaCulpaLanding() {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'O Fim da Culpa | E-book gratuito sobre ansiedade de separação | Focão';

    const description = 'Baixe grátis O Fim da Culpa, um guia prático para entender a ansiedade de separação do seu cão e começar um treino gradual.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const createdMeta = !meta;
    const previousDescription = meta?.content;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    return () => {
      document.title = previousTitle;
      if (meta && createdMeta) meta.remove();
      else if (meta && previousDescription !== undefined) meta.content = previousDescription;
    };
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('lead-name')?.focus({ preventScroll: true }), 450);
  };

  return (
    <div id="top" style={{ fontFamily: 'var(--font-sans)', backgroundColor: colors.paper, overflowX: 'hidden' }}>
      <Navbar onCtaClick={scrollToForm} />
      <div style={{ height: '64px' }} />

      <main>
        <section className="relative px-5 md:px-12 lg:px-20 pt-10 pb-16 md:pt-16 md:pb-24">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[68%]"
            style={{ background: 'radial-gradient(circle at 82% 16%, rgba(183,116,55,0.14), transparent 34%), linear-gradient(180deg, #F2EEE5 0%, #F7F5EF 100%)' }}
          />

          <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.03fr_0.97fr] gap-11 lg:gap-16 items-start">
            <div className="flex flex-col gap-6 lg:pt-7">
              <Reveal>
                <div className="flex flex-wrap items-center gap-3">
                  <span style={{ ...eyebrow, color: colors.pine }}>Guia gratuito</span>
                  <span aria-hidden="true" style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors.amber }} />
                  <span style={{ ...eyebrow, letterSpacing: '0.06em' }}>15 páginas · leitura prática</span>
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 style={{ fontFamily: 'var(--font-serif)', color: colors.ink, fontSize: 'clamp(2.55rem, 6.5vw, 4.65rem)', lineHeight: 0.98, letterSpacing: '-0.045em', fontWeight: 500, maxWidth: '720px' }}>
                  Sair de casa não deveria deixar você se sentindo um tutor ruim.
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p style={{ ...body, fontSize: 'clamp(1.05rem, 2.2vw, 1.23rem)', color: '#3D4A42', maxWidth: '650px' }}>
                  Entenda por que seu cão sofre quando você sai e aprenda por onde começar, com orientações graduais, sem punição e sem promessas irreais.
                </p>
              </Reveal>

              <Reveal delay={0.16}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                  {['Ações para hoje', 'Treino gradual', 'Sem julgamento'].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-full px-4 py-3" style={{ background: 'rgba(255,253,248,0.78)', border: `1px solid ${colors.line}` }}>
                      <Check size={16} color={colors.pine} strokeWidth={2.5} aria-hidden="true" />
                      <span style={{ color: colors.ink, fontSize: '0.86rem', fontWeight: 700 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="lg:hidden">
                  <PrimaryButton onClick={scrollToForm} full>Quero receber o e-book grátis</PrimaryButton>
                </div>
              </Reveal>

              <Reveal delay={0.22}>
                <div className="relative mt-2 mx-auto lg:mx-0 w-full max-w-[390px] lg:max-w-[420px]" aria-label="Capa do e-book O Fim da Culpa">
                  <div className="absolute -inset-5 rounded-[40px] rotate-3" style={{ background: colors.amberSoft }} />
                  <div className="relative grid grid-cols-[20px_1fr] drop-shadow-[0_24px_35px_rgba(35,49,40,0.22)]">
                    <div className="rounded-l-[10px]" style={{ background: colors.pineDark, boxShadow: 'inset -5px 0 8px rgba(0,0,0,0.2)' }} />
                    <img src="/ebooks/o-fim-da-culpa-cover.png" alt="Capa do e-book O Fim da Culpa" className="w-full rounded-r-[10px]" style={{ aspectRatio: '210 / 297', objectFit: 'cover', background: colors.white }} />
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="lg:sticky lg:top-24">
              <LeadForm formRef={formRef} contentName="ebook_fim_da_culpa" delivery="fim_da_culpa" />
              <p className="flex items-start justify-center gap-2 mt-4 px-3 text-center" style={{ color: '#718077', fontSize: '0.78rem', lineHeight: 1.5 }}>
                <ShieldCheck size={15} color={colors.pine} className="mt-0.5 shrink-0" aria-hidden="true" />
                Seus dados são usados para entregar o material e podem ser removidos quando você quiser.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="px-5 md:px-12 lg:px-20 py-16 md:py-24" style={{ background: colors.white }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="max-w-3xl">
                <span style={{ ...eyebrow, color: colors.pine }}>Isso acontece por aí?</span>
                <h2 style={{ ...sectionTitle, marginTop: '12px' }}>Quando a ansiedade dele começa a controlar a sua rotina</h2>
                <p style={{ ...body, marginTop: '16px', maxWidth: '690px' }}>O guia parte de situações comuns e explica o que pode estar por trás delas. Sem tratar medo como manha e sem colocar toda a responsabilidade nas suas costas.</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-10">
              {SINAIS.map((item, index) => (
                <div key={item.title} className="h-full">
                <Reveal delay={0.05 * index} style={{ height: '100%' }}>
                  <article className="h-full rounded-[20px] p-6 md:p-7 flex gap-4" style={{ background: colors.paper, border: `1px solid ${colors.line}` }}>
                    <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: '#DCEBE4', color: colors.pine }}><item.icon size={21} aria-hidden="true" /></span>
                    <div>
                      <h3 style={{ color: colors.ink, fontFamily: 'var(--font-serif)', fontSize: '1.2rem', lineHeight: 1.3, fontWeight: 600 }}>{item.title}</h3>
                      <p style={{ ...body, fontSize: '0.94rem', marginTop: '7px' }}>{item.text}</p>
                    </div>
                  </article>
                </Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 md:px-12 lg:px-20 py-16 md:py-24" style={{ background: colors.pineDark }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="max-w-3xl">
                <span style={{ ...eyebrow, color: '#E4B985' }}>O que você vai encontrar</span>
                <h2 style={{ ...sectionTitle, color: colors.white, marginTop: '12px' }}>Primeiro entender. Depois agir.</h2>
                <p style={{ ...body, color: '#C9D7D0', marginTop: '16px', maxWidth: '680px' }}>São seis capítulos curtos. A primeira parte organiza o que você está vendo; a segunda transforma isso em pequenas ações de treino.</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-11">
              {CAPITULOS.map((chapter, index) => (
                <div key={chapter.number} className="h-full">
                <Reveal delay={0.04 * index} style={{ height: '100%' }}>
                  <article className="h-full rounded-[20px] p-6 flex flex-col gap-5" style={{ background: 'rgba(255,253,248,0.075)', border: '1px solid rgba(255,255,255,0.14)' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#E4B985', fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>{chapter.number}</span>
                      <span className="rounded-full px-3 py-1" style={{ color: '#DDE8E3', border: '1px solid rgba(255,255,255,0.16)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{chapter.part}</span>
                    </div>
                    <div>
                      <h3 style={{ color: colors.white, fontFamily: 'var(--font-serif)', fontSize: '1.28rem', lineHeight: 1.25, fontWeight: 600 }}>{chapter.title}</h3>
                      <p style={{ ...body, color: '#BFCFC7', fontSize: '0.92rem', marginTop: '9px' }}>{chapter.text}</p>
                    </div>
                  </article>
                </Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 md:px-12 lg:px-20 py-16 md:py-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <span style={{ ...eyebrow, color: colors.pine }}>Uma amostra do guia</span>
                <h2 style={{ ...sectionTitle, marginTop: '12px' }}>Três mudanças para começar hoje</h2>
                <p style={{ ...body, marginTop: '16px' }}>O objetivo inicial não é deixar seu cão sozinho por horas. É diminuir a carga emocional e criar uma base antes de aumentar o tempo.</p>
                <div className="flex items-center gap-2 mt-6" style={{ color: colors.pine, fontSize: '0.88rem', fontWeight: 700 }}><Clock3 size={18} aria-hidden="true" /> Pequenos passos, repetidos com consistência</div>
              </div>
            </Reveal>

            <div className="flex flex-col gap-4">
              {PRIMEIRAS_ACOES.map((action, index) => (
                <div key={action.number}>
                <Reveal delay={0.07 * index}>
                  <article className="rounded-[22px] p-6 md:p-8 grid grid-cols-[48px_1fr] gap-4 md:gap-6" style={{ background: colors.white, border: `1px solid ${colors.line}`, boxShadow: '0 10px 30px rgba(38,50,43,0.05)' }}>
                    <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: colors.amberSoft, color: '#8C572A', fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 700 }}>{action.number}</span>
                    <div>
                      <h3 style={{ color: colors.ink, fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600 }}>{action.title}</h3>
                      <p style={{ ...body, fontSize: '0.96rem', marginTop: '7px' }}>{action.text}</p>
                    </div>
                  </article>
                </Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 md:px-12 lg:px-20 py-16 md:py-20" style={{ background: colors.paperDark }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto">
                <span style={{ ...eyebrow, color: colors.pine }}>Como você recebe</span>
                <h2 style={{ ...sectionTitle, marginTop: '12px' }}>Do formulário para a sua caixa de entrada</h2>
              </div>
            </Reveal>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-10">
              {PASSOS.map((step, index) => (
                <li key={step.title}>
                  <Reveal delay={0.06 * index} style={{ height: '100%' }}>
                    <div className="h-full rounded-[20px] p-6 md:p-7" style={{ background: colors.white, border: `1px solid ${colors.line}` }}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#DDEDE5', color: colors.pine }}><step.icon size={20} aria-hidden="true" /></div>
                      <p style={{ color: colors.ink, fontWeight: 700, marginTop: '18px' }}>{step.title}</p>
                      <p style={{ ...body, fontSize: '0.91rem', marginTop: '6px' }}>{step.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 md:px-12 lg:px-20 py-16 md:py-24" style={{ background: colors.white }}>
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="text-center">
                <span style={{ ...eyebrow, color: colors.pine }}>Antes de baixar</span>
                <h2 style={{ ...sectionTitle, marginTop: '12px' }}>Perguntas frequentes</h2>
              </div>
            </Reveal>

            <div className="mt-9 flex flex-col gap-3">
              {FAQ.map((item, index) => (
                <div key={item.question}>
                <Reveal delay={0.04 * index}>
                  <details className="group rounded-[16px] p-5 md:p-6" style={{ background: colors.paper, border: `1px solid ${colors.line}` }}>
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4" style={{ color: colors.ink, fontWeight: 700 }}>
                      {item.question}
                      <span aria-hidden="true" className="text-xl font-normal transition-transform group-open:rotate-45" style={{ color: colors.pine }}>+</span>
                    </summary>
                    <p style={{ ...body, fontSize: '0.93rem', marginTop: '13px', paddingRight: '30px' }}>{item.answer}</p>
                  </details>
                </Reveal>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 md:px-12 lg:px-20 py-16 md:py-20" style={{ background: colors.pine }}>
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <Reveal>
              <Sparkles size={30} color="#EAC08E" className="mx-auto" aria-hidden="true" />
              <h2 style={{ ...sectionTitle, color: colors.white, marginTop: '16px' }}>Troque a culpa por um ponto de partida.</h2>
              <p style={{ ...body, color: '#D3E1DA', marginTop: '14px', maxWidth: '640px' }}>Seu cão não está tentando te punir. E você não precisa descobrir sozinho o que fazer primeiro.</p>
              <div className="mt-8">
                <button onClick={scrollToForm} style={{ background: colors.white, color: colors.pineDark, border: 'none', borderRadius: '999px', minHeight: '54px', padding: '14px 30px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>Receber O Fim da Culpa grátis</button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
