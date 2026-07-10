import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, LineChart, Sparkles } from 'lucide-react';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { isBetaEnvironment } from '@/src/lib/beta';
import { auth } from '@/src/lib/firebase';
import { DogRepository } from '@/src/repositories/DogRepository';
import { clearOnboardingDraft } from '@/src/lib/onboardingDraft';

const benefits = [
  {
    icon: ClipboardList,
    title: 'Plano em sequência',
    description: 'Treinos claros, organizados por etapa e sem bagunçar a evolução.'
  },
  {
    icon: CheckCircle2,
    title: 'Check-ins comportamentais',
    description: 'Registre a rotina e ajude o Focão a entender o que está mudando.'
  },
  {
    icon: LineChart,
    title: 'Evolução visível',
    description: 'Acompanhe progresso, consistência e próximos passos.'
  }
];

export function OnboardingIntro() {
  const navigate = useNavigate();
  const isBeta = isBetaEnvironment();
  const [isContinuing, setIsContinuing] = useState(false);

  async function handleStart() {
    clearOnboardingDraft(); // início de um fluxo novo: descarta rascunho anterior
    if (!isBeta) {
      navigate('/onboarding/dog-data');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      navigate('/onboarding/dog-data');
      return;
    }

    setIsContinuing(true);
    try {
      const dogProfile = await DogRepository.getDogProfile(user.uid);
      if (dogProfile?.name) {
        navigate('/onboarding/dog-data', {
          state: {
            betaPrefilledDogBasics: true,
            dogData: {
              name: dogProfile.name || '',
              breed: dogProfile.breed || 'SRD',
              lifeStage: dogProfile.lifeStage || '',
              age: dogProfile.age || '',
              weight: dogProfile.weight || '',
              photoUrl: dogProfile.photoUrl || '',
              gender: dogProfile.gender || '',
            },
          },
        });
        return;
      }
      navigate('/onboarding/dog-data');
    } finally {
      setIsContinuing(false);
    }
  }

  return (
    <AuthLayout
      title="Treinos guiados, evolução visível e rotina mais clara."
      subtitle="O Focão organiza o próximo passo do seu cão e acompanha a evolução ao longo da jornada."
      step="COMECE PELO ESSENCIAL"
      showLogoutButton={true}
      showBackButton={false}
    >
      <div className="flex flex-col gap-6 flex-1">
        {isBeta && (
          <div className="rounded-2xl border border-[#055A43]/10 bg-[#055A43]/[0.04] px-4 py-3 text-[13px] font-medium leading-relaxed text-[#506352]">
            Você está usando uma versão beta gratuita e em validação.
          </div>
        )}
        <div className="rounded-[2rem] border border-[#055A43]/10 bg-[#055A43]/[0.03] p-5">
          <div className="w-12 h-12 rounded-full bg-[#055A43] text-white flex items-center justify-center mb-5 shadow-[0_8px_20px_rgba(5,90,67,0.18)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-[28px] leading-tight text-[#055A43] mb-3">
            Em poucos minutos, seu plano inicial fica pronto.
          </h2>
          <p className="text-[15px] leading-relaxed text-[#6B7A6E]">
            Vamos pedir só o necessário agora. Depois você pode completar o perfil para deixar relatórios e recomendações mais precisos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex gap-4 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/5 text-[#055A43] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#6B7A6E]">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleStart} className="w-full" isLoading={isContinuing}>
            Começar agora
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
