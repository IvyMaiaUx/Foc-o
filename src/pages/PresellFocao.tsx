import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ClipboardList, LineChart, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { LeadRepository } from '@/src/repositories/LeadRepository';
import { getDefaultPresellConfig, PresellConfig } from '@/src/lib/presellConfig';
import { PresellConfigRepository } from '@/src/repositories/PresellConfigRepository';

type QuizAnswer = {
  routine?: string;
  challenge?: string;
  consistency?: string;
  training?: string;
  goal?: string;
};

function getDiagnosis(answers: QuizAnswer, config: PresellConfig) {
  const match = config.diagnoses.find((diagnosis) => {
    const answer = answers[diagnosis.match.field as keyof QuizAnswer];
    return answer && diagnosis.match.values.includes(answer);
  });

  return match || config.fallbackDiagnosis;
}

export function PresellFocao() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PresellConfig>(() => getDefaultPresellConfig());
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [lead, setLead] = useState({ name: '', dogName: '', email: '', whatsapp: '' });
  const [showCapture, setShowCapture] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    PresellConfigRepository.getConfig()
      .then(setConfig)
      .catch((error) => console.warn('[PresellFocao] failed to load config', error));
  }, []);

  const quizSteps = config.quizSteps.length ? config.quizSteps : getDefaultPresellConfig().quizSteps;
  const diagnosis = useMemo(() => getDiagnosis(answers, config), [answers, config]);
  const progress = Math.round(((currentStep + (showCapture || showResult ? 1 : 0)) / (quizSteps.length + 1)) * 100);
  const step = quizSteps[Math.min(currentStep, quizSteps.length - 1)];

  function chooseAnswer(value: string) {
    const nextAnswers = { ...answers, [step.id]: value };
    setAnswers(nextAnswers);
    if (currentStep >= quizSteps.length - 1) {
      setShowCapture(true);
      return;
    }
    setCurrentStep((current) => current + 1);
  }

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    const email = lead.email.trim().toLowerCase();
    const name = lead.name.trim() || lead.dogName.trim() || 'Tutor Focão';

    if (!email || !email.includes('@')) {
      setError('Informe um e-mail válido para receber o diagnóstico.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await LeadRepository.createMarketingLead({
        name,
        email,
        whatsapp: lead.whatsapp,
        dogName: lead.dogName,
        source: 'presell_quiz',
        quizProfile: diagnosis.key,
      });
      localStorage.setItem('focao_presell_email', email);
      if (lead.dogName.trim()) localStorage.setItem('focao_presell_dog_name', lead.dogName.trim());
      setShowResult(true);
    } catch (err) {
      console.error('[PresellFocao] lead capture failed', err);
      setError('Não conseguimos salvar seus dados agora. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function startRegister() {
    if (lead.email.trim()) localStorage.setItem('focao_presell_email', lead.email.trim().toLowerCase());
    if (lead.dogName.trim()) localStorage.setItem('focao_presell_dog_name', lead.dogName.trim());
    navigate(config.registerPath || '/register?source=presell');
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#102019]">
      <section className="relative min-h-[92vh] overflow-hidden bg-[#062F25] text-white">
        <img
          src={config.heroImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-42"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#062F25]/72 via-[#062F25]/64 to-[#F7F5EF]" />
        <div className="relative mx-auto flex min-h-[92vh] w-full max-w-5xl flex-col px-6 pb-12 pt-8">
          <header className="flex items-center justify-between">
            <div className="text-[13px] font-black uppercase tracking-[0.42em]">Focão</div>
            <button
              onClick={() => navigate('/login')}
              className="rounded-full border border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/90"
            >
              Entrar
            </button>
          </header>

          <div className="flex flex-1 flex-col justify-end pb-10 pt-20">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-white/70">{config.heroEyebrow}</p>
            <h1 className="max-w-3xl font-serif text-[45px] font-semibold leading-[0.98] tracking-normal sm:text-[64px]">
              {config.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-8 text-white/86">
              {config.heroSubtitle}
            </p>
            <button
              onClick={() => document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#055A43] shadow-xl"
            >
              {config.heroCta}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-6 py-10 md:grid-cols-3">
        {config.benefits.map((benefit, index) => {
          const Icon = [ClipboardList, CheckCircle2, LineChart][index] || Sparkles;
          return (
          <article key={benefit.title} className="rounded-[24px] border border-[#E2DCCF] bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#055A43]/8 text-[#055A43]">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-[24px] font-semibold text-[#102019]">{benefit.title}</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#59645E]">{benefit.text}</p>
          </article>
          );
        })}
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-14 pt-2">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#055A43]">Veja por dentro</p>
          <h2 className="mt-3 font-serif text-[30px] font-semibold leading-tight text-[#102019] sm:text-[36px]">
            Simples de usar, fácil de evoluir.
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { src: '/prints/01-home.png', caption: 'Seu próximo passo, sempre claro' },
            { src: '/prints/02-plano.png', caption: 'Treinos guiados, em sequência' },
            { src: '/prints/03-evolucao.png', caption: 'Acompanhe a evolução acontecer' },
          ].map((shot) => (
            <figure key={shot.src} className="flex flex-col items-center">
              <div className="relative aspect-[9/19.5] w-full max-w-[240px] overflow-hidden rounded-[34px] border-[6px] border-[#102019] bg-[#062F25] shadow-[0_20px_45px_rgba(6,47,37,0.18)]">
                <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/30" />
                <img
                  src={shot.src}
                  alt={shot.caption}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                />
              </div>
              <figcaption className="mt-4 text-center text-[14px] font-semibold leading-6 text-[#59645E]">
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="diagnostico" className="mx-auto w-full max-w-3xl px-6 pb-16 pt-4">
        <div className="mb-5 overflow-hidden rounded-full bg-[#E2DCCF]">
          <div className="h-2 rounded-full bg-[#055A43] transition-all" style={{ width: `${Math.max(progress, 8)}%` }} />
        </div>

        {!showCapture && !showResult && (
          <div className="rounded-[28px] border border-[#E2DCCF] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7B847F]">{step.eyebrow}</p>
            <h2 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-[#102019]">{step.question}</h2>
            <div className="mt-6 grid gap-3">
              {step.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => chooseAnswer(option.value)}
                  className="flex items-center justify-between rounded-2xl border border-[#E2DCCF] bg-[#FAF9F5] px-4 py-4 text-left text-[15px] font-bold text-[#27342E] transition hover:border-[#055A43]/35 hover:bg-[#055A43]/5"
                >
                  {option.label}
                  <ChevronRight className="h-4 w-4 text-[#055A43]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {showCapture && !showResult && (
          <form onSubmit={submitLead} className="rounded-[28px] border border-[#E2DCCF] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#055A43]/8 text-[#055A43]">
              <Mail className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7B847F]">{config.captureEyebrow}</p>
            <h2 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-[#102019]">
              {config.captureTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#59645E]">
              {config.captureText}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input
                value={lead.name}
                onChange={(event) => setLead((current) => ({ ...current, name: event.target.value }))}
                placeholder="Seu nome"
                className="h-14 rounded-2xl border border-[#E2DCCF] bg-[#FAF9F5] px-4 text-[15px] font-semibold text-[#102019] outline-none focus:border-[#055A43]"
              />
              <input
                value={lead.dogName}
                onChange={(event) => setLead((current) => ({ ...current, dogName: event.target.value }))}
                placeholder="Nome do cão"
                className="h-14 rounded-2xl border border-[#E2DCCF] bg-[#FAF9F5] px-4 text-[15px] font-semibold text-[#102019] outline-none focus:border-[#055A43]"
              />
              <input
                value={lead.email}
                onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
                placeholder="Seu melhor e-mail"
                type="email"
                className="h-14 rounded-2xl border border-[#E2DCCF] bg-[#FAF9F5] px-4 text-[15px] font-semibold text-[#102019] outline-none focus:border-[#055A43] sm:col-span-2"
              />
              <input
                value={lead.whatsapp}
                onChange={(event) => setLead((current) => ({ ...current, whatsapp: event.target.value }))}
                placeholder="WhatsApp opcional"
                type="tel"
                className="h-14 rounded-2xl border border-[#E2DCCF] bg-[#FAF9F5] px-4 text-[15px] font-semibold text-[#102019] outline-none focus:border-[#055A43] sm:col-span-2"
              />
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
            <button
              disabled={isSubmitting}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#055A43] text-sm font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando...' : config.captureButton}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {showResult && (
          <div className="rounded-[28px] border border-[#E2DCCF] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#055A43]/8 text-[#055A43]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7B847F]">{config.resultEyebrow}</p>
            <h2 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-[#102019]">{diagnosis.title}</h2>
            <p className="mt-4 text-[16px] leading-8 text-[#59645E]">{diagnosis.text}</p>
            <div className="mt-6 rounded-2xl border border-[#055A43]/10 bg-[#055A43]/[0.04] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#055A43]" />
                <p className="text-[14px] leading-6 text-[#506352]">
                  {config.resultSupportText}
                </p>
              </div>
            </div>
            <button
              onClick={startRegister}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#055A43] text-sm font-black uppercase tracking-[0.12em] text-white"
            >
              {config.resultCta}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
