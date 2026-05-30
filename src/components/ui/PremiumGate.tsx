import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';

interface PremiumGateProps {
  featureName: string;
}

export function PremiumGate({ featureName }: PremiumGateProps) {
  const navigate = useNavigate();
  
  useEffect(() => {
    AnalyticsRepository.logEvent('premium_viewed', { feature: featureName });
  }, [featureName]);
  return (
    <div className="min-h-screen bg-[#F9F9F8] font-sans flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 bg-[#055A43]/5 rounded-[1.5rem] flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-[#055A43]/40" />
      </div>
      <h2 className="font-serif text-[28px] text-[#055A43] tracking-tight leading-tight mb-3">
        {featureName}
      </h2>
      <p className="text-[15px] text-[#5C615D] font-light leading-relaxed mb-8 max-w-xs">
        Este recurso faz parte do plano Premium. Inicie seus 7 dias gratuitos para desbloquear.
      </p>
      <button
        onClick={() => navigate('/assinatura')}
        className="w-full max-w-xs bg-[#055A43] text-white py-4 rounded-xl font-medium shadow-md shadow-[#055A43]/20 hover:opacity-90 transition-opacity active:scale-[0.98]"
      >
        Ver planos
      </button>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 text-[13px] text-[#5C615D]/60 underline underline-offset-2"
      >
        Voltar
      </button>
    </div>
  );
}
