import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, ChevronRight, Dumbbell, Flame, Sparkles, TrendingDown, TrendingUp, X } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EvolutionRepository, EvolutionSummary } from '@/src/repositories/EvolutionRepository';
import { CheckinRepository, CheckinData } from '@/src/repositories/CheckinRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { EvolutionInsightsMotor, ChartDayDetail, EvolutionInsights } from '@/src/motors/EvolutionInsightsMotor';
import { useNavigate } from 'react-router-dom';

export function Evolucao() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<EvolutionSummary | null>(null);
  const [insights, setInsights] = useState<EvolutionInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<ChartDayDetail | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Em paralelo (antes eram 3 idas sequenciais ao Firestore = lento).
        const [stats, checkins, trainingLogs] = await Promise.all([
          EvolutionRepository.getSummary(user.uid),
          CheckinRepository.getRecentCheckins(user.uid, 14),
          TrainingRepository.getTrainingLogs(user.uid),
        ]);
        setSummary(stats);
        setInsights(EvolutionInsightsMotor.generateInsights(stats, checkins, trainingLogs));
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const streak = EvolutionRepository.liveStreak(summary);

  return (
    <div className="flex-1 bg-[#F7F5EF] font-sans pb-28">

      {/* Green header zone — hero: título + score de evolução */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-[#055A43] px-6 pt-16 pb-9"
      >
        <div className="absolute -right-14 -top-14 w-52 h-52 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute right-10 top-24 w-20 h-20 rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[13px] font-medium text-white/55 mb-1.5">Seu progresso</p>
          <h1 className="font-serif text-[32px] text-white tracking-tight leading-tight">Evolução</h1>
        </div>

        {/* Score de Evolução — hero card aninhado na zona verde */}
        {insights && !insights.isEmpty && insights.smartReading.hasEnoughData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative z-10 mt-6 rounded-[20px] p-5 border border-white/10 bg-black/15"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 mb-2">Evolução geral</p>
                <div className="flex items-end gap-1">
                  <span className="font-serif text-[52px] leading-none text-white">{insights.evolutionScore}</span>
                  <span className="font-serif text-[20px] text-white/45 mb-1.5">/100</span>
                </div>
              </div>
              {insights.scoreDelta !== 0 && (
                <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 mt-1 ${insights.scoreDelta > 0 ? 'bg-emerald-400/15' : 'bg-amber-400/15'}`}>
                  {insights.scoreDelta > 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                    : <TrendingDown className="w-3.5 h-3.5 text-amber-300" />
                  }
                  <span className={`text-[12px] font-semibold ${insights.scoreDelta > 0 ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {insights.scoreDelta > 0 ? '+' : ''}{insights.scoreDelta} esta semana
                  </span>
                </div>
              )}
            </div>
            <p className="text-[14px] text-white/80 font-medium mt-4">{insights.scoreLabel}</p>
            <div className="mt-3 h-2 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${insights.evolutionScore}%` }}
                transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
                className="h-full bg-white/80 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* White drawer — sobrepõe a zona verde */}
      <div className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-[#055A43]/30 border-t-[#055A43] rounded-full animate-spin" />
          </div>
        ) : (
          <main className="px-6 pt-7 pb-8 flex flex-col gap-6">

            {/* Retomar — sensível à recência (some quando há atividade recente) */}
            {insights && !insights.isEmpty && insights.daysSinceLastActivity >= 7 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-[#FBF3E4] rounded-[20px] p-[18px] shadow-[0_8px_24px_rgba(45,74,58,0.08)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B07C3A] mb-2">
                  Bom te ver por aqui
                </p>
                <p className="text-[15px] font-semibold text-[#4A3A22] leading-snug mb-1">
                  {insights.daysSinceLastActivity >= 900
                    ? 'Que tal começar a acompanhar a evolução?'
                    : 'Que tal atualizar o diário do seu cão?'}
                </p>
                <p className="text-[13px] text-[#9A6A2E] leading-relaxed mb-4">
                  Um check-in rápido já atualiza a leitura da evolução.
                </p>
                <button
                  onClick={() => navigate('/checkin')}
                  className="h-[46px] px-5 rounded-full bg-[#C2703E] text-white text-[14px] font-medium active:scale-[0.97] transition-transform duration-150 ease-out"
                >
                  Fazer check-in
                </button>
              </motion.div>
            )}

            {/* Status row */}
            {insights && !insights.isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-white rounded-[1.75rem] p-5 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col gap-3"
              >
                {insights.statusItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'green' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <p className="text-[14px] text-[#506352] font-medium">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: insights?.isEmpty ? 0 : (summary?.totalSessions ?? 0), label: 'Sessões', color: '#055A43', icon: <Dumbbell className="w-4 h-4" /> },
                { value: insights?.totalCheckins ?? 0, label: 'Check-ins', color: '#506352', icon: <CheckCircle2 className="w-4 h-4" /> },
                { value: streak, label: streak === 1 ? 'Dia seguido' : 'Dias seguidos', color: '#C2703E', icon: <Flame className="w-4 h-4" /> },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                  className="bg-white rounded-[1.5rem] p-4 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)]"
                >
                  <div className="mb-2" style={{ color: stat.color }}>{stat.icon}</div>
                  <p className="font-serif text-[26px] leading-none mb-1" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] font-medium text-[#6B7A6E]/60 uppercase tracking-widest leading-tight">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Compact narrative */}
            {insights?.smartReading && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-[1.75rem] p-5 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#055A43]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#055A43]">Análise da semana</p>
                </div>
                <p className="font-serif text-[18px] text-gray-900 leading-snug mb-2">{insights.smartReading.headline}</p>
                <p className="text-[13px] text-[#6B7A6E] leading-relaxed mb-4">{insights.smartReading.recommendation}</p>
                <button
                  onClick={() => navigate('/relatorio')}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-[#055A43] uppercase tracking-widest"
                >
                  Ver relatório completo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Skill progress */}
            {insights && insights.skillProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#055A43] mb-5">Evolução por habilidade</p>
                <div className="flex flex-col gap-4">
                  {insights.skillProgress.map((skill) => (
                    <div key={skill.skill}>
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[13px] font-medium text-[#506352]">{skill.label}</p>
                        <p className="text-[12px] font-semibold text-[#055A43]">{skill.pct}%</p>
                      </div>
                      <div className="h-2 bg-[#055A43]/8 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                          className="h-full bg-[#055A43] rounded-full"
                        />
                      </div>
                      <p className="text-[11px] text-[#6B7A6E]/60 mt-1">{skill.completions} {skill.completions === 1 ? 'sessão concluída' : 'sessões concluídas'}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Emotional trends */}
            {insights && insights.emotionalTrends.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#055A43] mb-5">Evolução emocional</p>
                <div className="grid grid-cols-2 gap-3">
                  {insights.emotionalTrends.map((trend) => (
                    <div
                      key={trend.label}
                      className={`rounded-2xl p-4 border ${trend.isGood ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}
                    >
                      <p className="text-[12px] font-medium text-[#506352] mb-2">{trend.label}</p>
                      <div className="flex items-center gap-1.5">
                        {trend.direction === 'down'
                          ? <TrendingDown className={`w-4 h-4 ${trend.isGood ? 'text-emerald-600' : 'text-amber-600'}`} />
                          : <TrendingUp className={`w-4 h-4 ${trend.isGood ? 'text-emerald-600' : 'text-amber-600'}`} />
                        }
                        <p className={`text-[18px] font-serif font-medium ${trend.isGood ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {trend.direction === 'down' ? '↓' : '↑'} {trend.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly chart */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-medium text-[#055A43] text-[11px] tracking-widest uppercase">{insights?.chartTitle || 'Atividade Semanal'}</h3>
                  <p className="text-[11px] text-[#6B7A6E] mt-1 font-light">{insights?.chartSubtitle}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-[#506352]/60 shrink-0" />
              </div>
              <div className="flex items-end justify-between gap-2" style={{ height: '100px' }}>
                {insights?.chartData?.map((d, i) => {
                  const detail = insights.chartDayDetails?.[i];
                  const hasActivity = (detail?.hasCheckin || (detail?.trainings?.length ?? 0) > 0);
                  return (
                    <button
                      key={i}
                      onClick={() => detail && setSelectedDay(detail)}
                      className="flex flex-col items-center flex-1 h-full"
                    >
                      <div className="w-full bg-[#055A43]/5 rounded-t-lg relative flex flex-col justify-end h-full">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${d.value}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                          className={`w-full rounded-t-lg ${d.value > 0 ? (hasActivity ? 'bg-[#055A43]' : 'bg-[#055A43]/40') : 'bg-transparent'}`}
                        />
                      </div>
                      <span className="text-[9px] font-medium text-[#6B7A6E]/60 mt-2 uppercase tracking-widest">{d.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#6B7A6E]/50 mt-3 text-center">Toque em um dia para ver detalhes</p>
            </motion.div>

            {/* Timeline */}
            {insights && insights.timeline.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#055A43] mb-5">Linha do tempo</p>
                <div className="flex flex-col">
                  {insights.timeline.map((event, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${event.type === 'training' ? 'bg-[#055A43]/10' : 'bg-[#506352]/10'}`}>
                          {event.type === 'training'
                            ? <Dumbbell className="w-3.5 h-3.5 text-[#055A43]" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-[#506352]" />
                          }
                        </div>
                        {i < insights.timeline.length - 1 && (
                          <div className="w-px flex-1 bg-[#055A43]/8 my-1" style={{ minHeight: '16px' }} />
                        )}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="text-[10px] font-semibold text-[#6B7A6E]/60 uppercase tracking-widest mb-0.5">{event.dayLabel}</p>
                        <p className="text-[13px] font-medium text-[#506352] leading-snug">{event.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            {insights?.achievements && insights.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#055A43]">Conquistas</p>
                  <button onClick={() => navigate('/relatorio')} className="text-[11px] text-[#055A43] font-semibold uppercase tracking-widest">Ver relatório</button>
                </div>
                <div className="flex flex-col gap-3">
                  {insights.achievements.slice(0, 3).map((achievement, index) => (
                    <div
                      key={achievement.id}
                      className={`bg-white rounded-[1.5rem] p-5 border shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex items-center gap-4 ${index === 0 ? 'border-[#D8C3A5]/70' : 'border-[#055A43]/5'}`}
                    >
                      <div className="w-11 h-11 rounded-full bg-[#055A43]/5 flex items-center justify-center border border-[#055A43]/10 shrink-0">
                        <Award className="w-5 h-5 text-[#055A43]/60" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#506352]/70 mb-1">{achievement.context}</p>
                        <p className="font-serif text-[#055A43] text-[16px] leading-tight">{achievement.title}</p>
                        <p className="text-[#6B7A6E] text-[12px] font-light mt-0.5">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {insights?.isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[1.75rem] p-8 border border-[#055A43]/5 text-center"
              >
                <p className="font-serif text-[20px] text-[#055A43] mb-2">Comece hoje</p>
                <p className="text-[14px] text-[#6B7A6E] leading-relaxed">
                  Complete um treino ou check-in para ver sua evolução aqui.
                </p>
              </motion.div>
            )}
          </main>
        )}
      </div>

      {/* Day detail bottom sheet */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-[2rem] p-6 shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-serif text-[20px] text-[#055A43]">{selectedDay.dayLabel}</p>
              <button onClick={() => setSelectedDay(null)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-[#6B7A6E]" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {selectedDay.hasCheckin && (
                <div className="flex items-center gap-3 bg-[#055A43]/5 rounded-2xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-[#055A43] shrink-0" />
                  <p className="text-[14px] font-medium text-[#506352]">Check-in registrado</p>
                </div>
              )}
              {selectedDay.trainings.map((t, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#055A43]/5 rounded-2xl p-4">
                  <Dumbbell className="w-5 h-5 text-[#055A43] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-medium text-[#506352]">{t.title}</p>
                    {t.durationMinutes && (
                      <p className="text-[12px] text-[#6B7A6E]/70 mt-0.5">{t.durationMinutes} min</p>
                    )}
                  </div>
                </div>
              ))}
              {!selectedDay.hasCheckin && selectedDay.trainings.length === 0 && (
                <p className="text-[14px] text-[#6B7A6E] text-center py-2">Nenhuma atividade registrada neste dia.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedDay && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
