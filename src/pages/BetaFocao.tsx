import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, CheckCircle2, HeartHandshake, Lightbulb, MessageSquareText, Sparkles } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/contexts/AuthContext';

const betaPoints = [
  'Acesso gratuito nesta fase',
  'Versão em validação',
  'Melhorias com base no seu feedback',
  'Recursos oficiais na versão futura',
];

export function BetaFocao() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const openSupport = (prompt: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/suporte', { state: { betaPrompt: prompt } });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 py-10 pb-24 font-sans text-[#506352]">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#055A43]/10 bg-white text-[#5C615D] shadow-sm"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <section className="rounded-[2rem] border border-[#055A43]/10 bg-white p-6 shadow-[0_12px_32px_rgba(5,90,67,0.06)]">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#055A43] text-white shadow-[0_10px_24px_rgba(5,90,67,0.18)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C615D]/70">Beta Focão</p>
          <h1 className="font-serif text-[34px] leading-tight text-[#055A43]">
            Ajude a construir o Focão
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#5C615D]">
            Você está participando da fase beta do app. Nesta etapa, seu papel é testar, explorar e nos dizer o que funciona bem e o que precisa melhorar.
          </p>
          <p className="mt-4 rounded-2xl border border-[#055A43]/10 bg-[#055A43]/[0.03] p-4 text-[13px] leading-relaxed text-[#506352]">
            Este acesso faz parte da fase de testes do app. Novidades e recursos adicionais serão apresentados na versão oficial.
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-[#055A43]/10 bg-white p-5">
          <h2 className="font-serif text-2xl text-[#055A43]">Como funciona o Beta</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5C615D]">
            Durante essa fase, o acesso ao app é gratuito e temporário. Nosso objetivo é entender o que funciona melhor, o que precisa ser ajustado e quais recursos geram mais valor para você.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {betaPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-2xl bg-[#F7F6F3] px-4 py-3 text-sm font-medium text-[#506352]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#055A43]" />
                {point}
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => openSupport('[Feedback beta] O que mais gostei foi: ')}
            className="flex items-center justify-between rounded-2xl border border-[#055A43]/10 bg-white p-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <HeartHandshake className="h-5 w-5 text-[#055A43]" />
              <span><strong className="block text-sm text-[#055A43]">Enviar feedback</strong><small className="text-xs text-[#5C615D]">Conte sua experiência</small></span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => openSupport('[Bug beta] Encontrei o seguinte problema: ')}
            className="flex items-center justify-between rounded-2xl border border-[#055A43]/10 bg-white p-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <Bug className="h-5 w-5 text-[#055A43]" />
              <span><strong className="block text-sm text-[#055A43]">Reportar problema</strong><small className="text-xs text-[#5C615D]">Descreva o que aconteceu</small></span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => openSupport('[Sugestão beta] Minha sugestão é: ')}
            className="flex items-center justify-between rounded-2xl border border-[#055A43]/10 bg-white p-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-[#055A43]" />
              <span><strong className="block text-sm text-[#055A43]">Sugerir função</strong><small className="text-xs text-[#5C615D]">Ideias para a versão oficial</small></span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => openSupport('[Avaliação beta] Minha avaliação geral é: ')}
            className="flex items-center justify-between rounded-2xl border border-[#055A43]/10 bg-white p-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <MessageSquareText className="h-5 w-5 text-[#055A43]" />
              <span><strong className="block text-sm text-[#055A43]">Avaliar experiência</strong><small className="text-xs text-[#5C615D]">Muito boa, boa ou pode melhorar</small></span>
            </span>
          </button>
        </section>

        <Button onClick={() => (user ? navigate('/') : navigate('/register'))} className="w-full">
          {user ? 'Continuar usando' : 'Entendi, quero testar'}
        </Button>
      </main>
    </div>
  );
}
