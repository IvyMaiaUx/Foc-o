import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { WeeklyReportGateResult } from '@/src/lib/weeklyReportGate';

interface LockedReportStateProps {
  result: WeeklyReportGateResult;
  dogName: string;
  onCheckin: () => void;
  onTrain: () => void;
}

export function LockedReportState({ result, dogName, onCheckin, onTrain }: LockedReportStateProps) {
  const { overallPct, requirements } = result;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(overallPct, 0), 100);
  const dashoffset = circumference * (1 - clampedPct / 100);

  const trainingsMet = requirements.find((r) => r.key === 'trainings')?.met ?? false;
  const ctaLabel = trainingsMet ? 'Registrar check-in de hoje' : 'Fazer treino de hoje';
  const ctaAction = trainingsMet ? onCheckin : onTrain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center px-6 py-8"
    >
      <h2 className="font-serif text-[26px] text-[#055A43] tracking-tight leading-tight mb-1">
        Construindo a semana{dogName ? ` ${dogName.endsWith('a') ? 'da' : 'de'} ${dogName}` : ''}
      </h2>
      <p className="text-[14px] text-[#6B7A6E] leading-relaxed max-w-[280px] mb-8">
        Faltam alguns registros pra liberar seu relatório. Continue acompanhando o dia a dia!
      </p>

      {/* Donut de progresso */}
      <div className="relative w-[140px] h-[140px] mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#055A43" strokeOpacity="0.08" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#055A43"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-[32px] text-[#055A43] leading-none">{clampedPct}%</span>
          <span className="text-[10px] uppercase tracking-widest text-[#6B7A6E]/70 mt-1">concluído</span>
        </div>
      </div>

      {/* Checklist gamificado */}
      <div className="w-full max-w-[300px] flex flex-col gap-3 mb-8">
        {requirements.map((r) => (
          <div
            key={r.key}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
              r.met ? 'bg-[#055A43]/[0.04] border-[#055A43]/20' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {r.met ? (
                <CheckCircle2 className="w-5 h-5 text-[#055A43]" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
              <span className={`text-sm font-medium ${r.met ? 'text-[#055A43]' : 'text-[#6B7A6E]'}`}>
                {r.label}
              </span>
            </div>
            <span className={`text-sm font-semibold ${r.met ? 'text-[#055A43]' : 'text-[#6B7A6E]/70'}`}>
              {Math.min(r.current, r.target)}/{r.target}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={ctaAction}
        className="w-full max-w-[300px] bg-[#055A43] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-[#055A43]/20 active:scale-[0.98] transition-transform"
      >
        {ctaLabel}
      </button>
    </motion.div>
  );
}
