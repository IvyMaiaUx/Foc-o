import { useNavigate } from 'react-router-dom';
import { Wordmark } from '@/src/components/branding/Wordmark';
import { hapticLightTap } from '@/src/lib/haptic';
import { isBetaEnvironment } from '@/src/lib/beta';

/**
 * Primeira tela de quem não está logado.
 *
 * A entrada é animada por CSS (classes `welcome-*` em index.css), e não pela
 * biblioteca de animação: assim o conteúdo continua visível se o JavaScript da
 * animação falhar, e `prefers-reduced-motion` é respeitado pelo sistema.
 *
 * O espaço reservado embaixo (`--lgpd-banner-h`) existe porque o banner de
 * cookies é `position: fixed` e, em tela de celular, cobria o botão "entrar" --
 * quem já era assinante não conseguia tocar nele sem antes lidar com o banner.
 */
export function Welcome() {
  const navigate = useNavigate();
  const isBeta = isBetaEnvironment();

  return (
    <div className="relative min-h-screen w-full font-sans flex flex-col justify-between overflow-hidden bg-[#041411]">
      {/* O fundo não anima: precisa estar pintado no primeiro quadro, senão
          aparece o branco da página antes do verde. */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(5,90,67,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(2,10,8,0.8),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#041411]/50 to-[#020A08]" />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
      </div>

      <div className="welcome-item welcome-logo w-full pt-14 flex justify-center relative z-10">
        <Wordmark tone="light" width={60} />
      </div>

      <div
        className="relative z-10 p-8 flex flex-col w-full max-w-md mx-auto"
        style={{ paddingBottom: 'calc(3rem + var(--lgpd-banner-h, 0px))' }}
      >
        <h1 className="font-serif text-[2.75rem] text-[#F2F5F3] leading-[1.1] mb-5 tracking-tight drop-shadow-md">
          {isBeta ? (
            <>
              <span className="welcome-item welcome-title-1">Bem-vindo ao</span>
              <span className="welcome-item welcome-title-2 italic text-[#E0E7E4]/80 font-light">Beta do Focão.</span>
            </>
          ) : (
            <>
              <span className="welcome-item welcome-title-1">Uma vida com</span>
              <span className="welcome-item welcome-title-2 italic text-[#E0E7E4]/80 font-light">mais harmonia.</span>
            </>
          )}
        </h1>

        <p className="welcome-item welcome-subtitle text-[#A8BDB4] text-[17px] font-light leading-relaxed mb-12 max-w-[320px]">
          {isBeta
            ? 'Você foi convidado para testar gratuitamente a versão inicial do app. Seu uso e seu feedback vão nos ajudar a melhorar a experiência antes do lançamento oficial.'
            : 'Um plano personalizado de rotina e treino para entender melhor o seu cão e construir uma convivência mais tranquila.'}
        </p>

        <div className="flex flex-col gap-4 w-full">
          {/* "Criar o plano do meu cão" e não "criar conta": o cadastro leva
              direto pro onboarding, que monta o plano. Se um dia essa rota parar
              de terminar no plano, este texto vira promessa falsa. */}
          <button
            onClick={() => { hapticLightTap(); navigate('/register'); }}
            className="welcome-item welcome-primary-action w-full bg-[#E8F0ED] text-[#033B2B] h-14 rounded-2xl font-medium text-base flex items-center justify-center transition-transform active:scale-[0.98] shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:bg-white"
          >
            {isBeta ? 'Começar teste' : 'Criar o plano do meu cão'}
          </button>
          <button
            onClick={() => { hapticLightTap(); navigate(isBeta ? '/beta' : '/login'); }}
            className="welcome-item welcome-secondary-action w-full bg-transparent border border-[#E0E7E4]/25 text-[#E0E7E4] h-14 rounded-2xl font-medium text-base flex items-center justify-center transition-all active:scale-[0.98] hover:bg-[#E0E7E4]/10"
          >
            {isBeta ? 'Saiba como funciona' : 'Já tenho uma conta — entrar'}
          </button>
          {isBeta && (
            <button
              onClick={() => { hapticLightTap(); navigate('/login'); }}
              className="welcome-item welcome-secondary-action text-[#A8BDB4] text-sm font-medium"
            >
              Já tenho conta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
