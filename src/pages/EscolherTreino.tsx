import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { BLOCKS } from '@/src/lib/trainingTree';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumGate } from '@/src/components/ui/PremiumGate';
import { sanitizeText } from '@/src/lib/textSanitizer';
import { getDailyTrainingLimit, countTrainingSessionsToday } from '@/src/lib/trainingLimits';

export function EscolherTreino() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [sessionsToday, setSessionsToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const logs = await TrainingRepository.getTrainingLogs(user.uid, 30);
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          setSessionsToday(countTrainingSessionsToday(logs, todayStart.getTime()));
        }
      } catch (err) {
        console.error('Erro ao carregar treinos de hoje:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
        <header className="px-6 pt-safe-top mt-6 pb-6 flex items-start justify-between z-10 relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7A6E]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </header>
        <PremiumGate featureName="Escolher treino" />
      </div>
    );
  }

  const dailyLimit = getDailyTrainingLimit(isPremium);
  const limitReached = sessionsToday >= dailyLimit;

  const blocksInOrder = Object.values(BLOCKS).sort((a, b) => a.order - b.order);
  const templatesByBlock = blocksInOrder.map((block) => ({
    block,
    templates: Object.values(TRAINING_TEMPLATES).filter((t) => t.blockId === block.id),
  }));

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
      <header className="px-6 pt-safe-top mt-6 pb-4 flex items-center justify-between z-10 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7A6E]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="bg-[#055A43]/10 px-3 py-1.5 rounded-full text-[#055A43] text-[10px] font-bold tracking-widest uppercase">
          {isLoading ? '...' : `${Math.min(sessionsToday, dailyLimit)}/${dailyLimit} hoje`}
        </span>
      </header>

      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <h1 className="font-serif text-[32px] leading-[1.1] tracking-tight text-[#055A43] mb-3">
          Escolher treino
        </h1>
        <p className="text-[#6B7A6E] text-[15px] font-light leading-relaxed mb-6">
          Pratique qualquer treino do catálogo, além do plano do dia. Vale como treino extra e não muda a sequência do plano.
        </p>

        {limitReached && (
          <div className="bg-[#055A43]/5 border border-[#055A43]/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Lock className="w-4 h-4 text-[#055A43] shrink-0" />
            <p className="text-[#055A43] text-sm font-medium">
              Vocês já fizeram {dailyLimit} treinos hoje. Volte amanhã para escolher mais.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {templatesByBlock.map(({ block, templates }) => (
            templates.length > 0 && (
              <div key={block.id}>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#055A43]/60 mb-3">
                  {sanitizeText(block.name)}
                </h2>
                <div className="flex flex-col gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => !limitReached && navigate(`/treino/${t.id}`)}
                      disabled={limitReached}
                      className="text-left bg-white rounded-2xl p-4 shadow-sm border border-[#E5E5E5] flex items-center justify-between gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#055A43] text-[15px] truncate">{sanitizeText(t.name)}</p>
                        <p className="text-[#6B7A6E] text-[13px] mt-0.5 line-clamp-1">{sanitizeText(t.objective)}</p>
                      </div>
                      <span className="text-[11px] font-medium text-[#6B7A6E] bg-[#F7F5EF] px-2.5 py-1 rounded-full shrink-0">
                        {t.duration}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </main>
    </div>
  );
}
