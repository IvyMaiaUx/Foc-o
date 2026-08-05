import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, AlertCircle, TrendingUp, CheckCircle2, Sparkles, Activity, FileText, Info } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { UserRepository } from '@/src/repositories/UserRepository';
import { WeeklyReportMotor, WeeklyActivity } from '@/src/motors/WeeklyReportMotor';
import { evaluateWeeklyReportGate, WeeklyReportGateResult } from '@/src/lib/weeklyReportGate';
import { LockedReportState } from '@/src/components/reports/LockedReportState';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumGate } from '@/src/components/ui/PremiumGate';
import { CheckinInsightsMotor, CheckinInsights } from '@/src/motors/CheckinInsightsMotor';
import { CustomEventRepository } from '@/src/repositories/CustomEventRepository';
import { EvolutionInsightsMotor, EvolutionInsights } from '@/src/motors/EvolutionInsightsMotor';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { WeeklyReportOverride, WeeklyReportOverrideRepository } from '@/src/repositories/WeeklyReportOverrideRepository';

const DAY_MS = 24 * 60 * 60 * 1000;

function checkinTimestamp(date?: string): number {
  return date ? new Date(`${date}T00:00:00`).getTime() : 0;
}

export function RelatorioSemanal() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [dogName, setDogName] = useState('Seu cão');
  const [gate, setGate] = useState<WeeklyReportGateResult | null>(null);
  const [dogGender, setDogGender] = useState('male');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyActivity | null>(null);
  const [checkinInsights, setCheckinInsights] = useState<CheckinInsights | null>(null);
  const [evolutionInsights, setEvolutionInsights] = useState<EvolutionInsights | null>(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [adminReport, setAdminReport] = useState<WeeklyReportOverride | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isPremium) {
        setLoading(false);
        return;
      }

      try {
        const user = auth.currentUser;
        if (user) {
          const stats = await EvolutionRepository.getSummary(user.uid);
          setAdminReport(await WeeklyReportOverrideRepository.get(user.uid));
          
          const dog = await DogRepository.getDogProfile(user.uid);
          if (dog) {
            setDogName(dog.name);
            setDogGender(dog.gender || 'male');
          }

          // Keep two real calendar windows so the report can compare weeks.
          const checkins = await CheckinRepository.getRecentCheckins(user.uid, 14);
          
          const logs = await TrainingRepository.getTrainingLogs(user.uid);
          const now = Date.now();
          const sevenDaysAgo = now - 7 * DAY_MS;
          const fourteenDaysAgo = now - 14 * DAY_MS;
          const recentCheckins = checkins.filter((checkin) => checkinTimestamp(checkin.date) >= sevenDaysAgo);
          const previousCheckins = checkins.filter((checkin) => {
            const timestamp = checkinTimestamp(checkin.date);
            return timestamp >= fourteenDaysAgo && timestamp < sevenDaysAgo;
          });
          const recentLogs = logs.filter(log => log.completedAt && log.completedAt >= sevenDaysAgo);
          const previousLogs = logs.filter(log => log.completedAt && log.completedAt >= fourteenDaysAgo && log.completedAt < sevenDaysAgo);

          setGate(evaluateWeeklyReportGate(recentCheckins, recentLogs));

          const generatedReport = WeeklyReportMotor.generateReport(stats, recentCheckins, recentLogs, previousCheckins, previousLogs);
          setReport(generatedReport);
          AnalyticsRepository.logEvent('report_viewed', {
            maturityLevel: generatedReport?.maturityLevel || 'empty',
            totalTrainings: generatedReport?.totalTrainings || 0,
            totalCheckins: generatedReport?.totalCheckins || 0
          });
          setEvolutionInsights(EvolutionInsightsMotor.generateInsights(stats, recentCheckins, recentLogs));

          // Fetch custom events and completions history for routine insights
          const [events, ...compsResults] = await Promise.all([
            CustomEventRepository.getEvents(user.uid),
            ...recentCheckins.map(async (c) => {
              if (!c.date) return { date: '', data: {} };
              const comps = await CustomEventRepository.getCompletions(user.uid, c.date);
              return { date: c.date, data: comps };
            })
          ]);

          const completionsHistory: Record<string, Record<string, boolean>> = {};
          compsResults.forEach(r => {
            if (r.date) {
              completionsHistory[r.date] = r.data;
            }
          });

          const insights = CheckinInsightsMotor.analyze(recentCheckins, logs, events, completionsHistory);
          setCheckinInsights(insights);

          if (generatedReport && generatedReport.maturityLevel !== 'empty') {
            await EvolutionRepository.incrementReportsViewed(user.uid);

            const profile = await UserRepository.getUserProfile(user.uid);
            const isWhatsappEnabled = profile?.whatsappEnabled ?? false;
            setWhatsappEnabled(isWhatsappEnabled);

            const promptDismissed = localStorage.getItem('focao_whatsapp_prompt_dismissed');
            if (!isWhatsappEnabled && !promptDismissed) {
              setTimeout(() => {
                setShowWhatsappModal(true);
              }, 800);
            }
          }
        }
      } catch (err) {
        console.error("Error loading week report data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isPremium]);

  if (!isPremium) return <PremiumGate featureName="Relatório Semanal" />;

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col relative selection:bg-[#055A43]/20">
      {/* Green metric header zone */}
      <div className="relative overflow-hidden bg-[#055A43] px-6 pt-16 pb-9">
        <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 active:scale-[0.98] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-medium text-white/45 tracking-[0.15em] uppercase mb-0.5">
                Análise comportamental
              </p>
              <h1 className="font-serif text-[24px] text-white tracking-tight leading-none">
                Relatório semanal
              </h1>
            </div>
          </div>

          {report && gate?.unlocked && (
            <button
              onClick={() => navigate('/relatorio-impressao')}
              className="flex items-center gap-1.5 rounded-full bg-[#C2703E] text-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all hover:bg-[#a85f33]"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          )}
        </div>

        {report && gate?.unlocked && report.maturityLevel !== 'empty' && (
          <>
            <div className="relative z-10 grid grid-cols-2 gap-6 mt-8">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Treinos
                </p>
                <p className="font-serif text-[42px] leading-none text-white/95">{report.totalTrainings}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Check-ins
                </p>
                <p className="font-serif text-[42px] leading-none text-white/95">{report.totalCheckins}</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3 mt-5">
              <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                <span className="text-white/90 text-[11px] font-bold tracking-[0.15em] uppercase">
                  {report.activeDays} de 7 dias com registros
                </span>
              </div>
              {report.streak > 0 && (
                <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                   <span className="text-white/90 text-[11px] font-bold tracking-[0.15em] uppercase">
                     {report.streak === 1 ? '1 dia seguido' : `${report.streak} dias seguidos`}
                   </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* White drawer */}
      <div className="relative -mt-6 flex-1 flex flex-col rounded-t-[26px] bg-[#F7F5EF]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
             <div className="w-8 h-8 border-2 border-[#055A43]/20 border-t-[#055A43] rounded-full animate-spin" />
          </div>
        ) : !report ? (
          <div className="flex-1 flex items-center justify-center py-24">
             <p className="text-[#6B7A6E]">Erro ao carregar relatório.</p>
          </div>
        ) : (!gate?.unlocked) ? (
          <main className="flex-1 px-6 pt-7 pb-32 overflow-y-auto flex items-center justify-center">
            <LockedReportState
              result={gate}
              dogName={dogName}
              dogGender={dogGender}
              onCheckin={() => navigate('/checkin')}
              onTrain={() => navigate('/treino')}
            />
          </main>
        ) : (
          <main className="flex-1 px-6 pt-7 pb-32 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-8 pl-1">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2 text-[#055A43]">
                     <Sparkles className="w-4 h-4 text-yellow-500" />
                     <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Últimos 7 dias</span>
                   </div>
                </div>
                <p className="text-[#6B7A6E] text-[16px] font-light leading-relaxed max-w-[280px]">
                  {(() => {
                    const art = dogGender === 'female' ? 'da' : 'do';
                    return report.maturityLevel === 'empty'
                      ? `Precisamos de mais alguns dias de atividade para montar o relatório ${art} ${dogName}.`
                      : `Um olhar detalhado sobre o desenvolvimento ${art} ${dogName}.`;
                  })()}
                </p>
              </div>

              {report.maturityLevel === 'empty' ? (
                <div className="bg-white rounded-[2rem] p-8 border border-[#055A43]/10 shadow-sm text-center flex flex-col items-center justify-center py-16">
                   <div className="w-16 h-16 rounded-full bg-[#F7F5EF] flex items-center justify-center mb-6 border border-gray-100">
                      <Info className="w-8 h-8 text-[#6B7A6E]/40" />
                   </div>
                   <h3 className="font-serif text-2xl text-[#055A43] mb-3">Relatório em construção</h3>
                   <p className="text-[#6B7A6E] font-light leading-relaxed text-[15px] max-w-[240px]">
                     Seu relatório semanal ficará mais completo conforme você registra treinos e check-ins.
                   </p>
                </div>
              ) : (
                <>
                  {evolutionInsights?.smartReading && (
                  <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-[#055A43]" />
                      <p className="text-[11px] font-bold text-[#055A43] uppercase tracking-[0.15em]">
                        Resumo inteligente
                      </p>
                    </div>
                    <p className="font-serif text-[24px] text-gray-900 leading-snug mb-3">
                      {evolutionInsights.smartReading.headline}
                    </p>
                    <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed mb-5">
                      {evolutionInsights.smartReading.body}
                    </p>
                    <div className="grid gap-2 mb-5">
                      {evolutionInsights.smartReading.evidence.map((item) => (
                        <div key={item} className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/5 px-4 py-3">
                          <p className="text-[12px] font-semibold text-[#506352]">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-[#055A43]/[0.04] border border-[#055A43]/10 px-4 py-3">
                      <p className="text-[12px] font-semibold text-[#055A43] leading-relaxed">
                        {evolutionInsights.smartReading.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {adminReport && (adminReport.title || adminReport.summary || adminReport.recommendation) && (
                  <div className="bg-[#F3EDE3]/45 rounded-[2rem] p-6 border border-[#D8C3A5]/70 shadow-[0_8px_24px_rgba(0,0,0,0.025)] mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-[#8B7357]" />
                      <p className="text-[11px] font-bold text-[#8B7357] uppercase tracking-[0.15em]">
                        Acompanhamento da equipe Focão
                      </p>
                    </div>
                    {adminReport.title && (
                      <p className="font-serif text-[23px] text-[#055A43] leading-snug mb-3">{adminReport.title}</p>
                    )}
                    {adminReport.summary && (
                      <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed whitespace-pre-line">{adminReport.summary}</p>
                    )}
                    {adminReport.recommendation && (
                      <div className="mt-4 rounded-2xl bg-white/70 border border-[#D8C3A5]/50 px-4 py-3">
                        <p className="text-[12px] font-semibold text-[#506352] leading-relaxed whitespace-pre-line">
                          {adminReport.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[#055A43]" />
                    <p className="text-[11px] font-bold text-[#055A43] uppercase tracking-[0.15em]">
                      Comparação entre semanas
                    </p>
                  </div>
                  <p className="font-serif text-[22px] text-gray-900 leading-snug mb-2">
                    {report.comparison.headline}
                  </p>
                  <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed">
                    {report.comparison.detail}
                  </p>
                  {report.comparison.hasPreviousWeekData && (
                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <div className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/5 px-3 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#506352]/70">Dias ativos</p>
                        <p className="mt-1 text-[15px] font-bold text-[#055A43]">{report.comparison.currentActiveDays} <span className="text-[#8A918D] font-medium">vs. {report.comparison.previousActiveDays}</span></p>
                      </div>
                      <div className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/5 px-3 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#506352]/70">Treinos</p>
                        <p className="mt-1 text-[15px] font-bold text-[#055A43]">{report.comparison.currentTrainings} <span className="text-[#8A918D] font-medium">vs. {report.comparison.previousTrainings}</span></p>
                      </div>
                      <div className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/5 px-3 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#506352]/70">Check-ins</p>
                        <p className="mt-1 text-[15px] font-bold text-[#055A43]">{report.comparison.currentCheckins} <span className="text-[#8A918D] font-medium">vs. {report.comparison.previousCheckins}</span></p>
                      </div>
                    </div>
                  )}
                </div>

                {report.recurringPattern && (
                  <div className="bg-[#F3EDE3]/45 rounded-[2rem] p-6 border border-[#D8C3A5]/70 shadow-[0_8px_24px_rgba(0,0,0,0.025)] mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[#8B7357]" />
                      <p className="text-[11px] font-bold text-[#8B7357] uppercase tracking-[0.15em]">
                        Padrão recorrente
                      </p>
                    </div>
                    <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed">
                      {report.recurringPattern}
                    </p>
                  </div>
                )}

                {evolutionInsights?.achievements && evolutionInsights.achievements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-[#506352] text-[11px] tracking-[0.15em] uppercase mb-4 pl-1">
                      Conquistas da jornada
                    </h3>
                    <div className="flex flex-col gap-3">
                      {evolutionInsights.achievements.slice(0, 3).map((achievement, index) => (
                        <div
                          key={achievement.id}
                          className={`bg-white rounded-[1.5rem] p-5 border shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex gap-4 items-start ${
                            index === 0 ? 'border-[#D8C3A5]/70' : 'border-[#055A43]/10'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center border shrink-0 ${
                            index === 0
                              ? 'bg-[#F3EDE3]/70 border-[#D8C3A5]/80'
                              : 'bg-[#F7F5EF] border-[#055A43]/10'
                          }`}>
                            <Star className={`w-5 h-5 ${index === 0 ? 'text-[#8B7357]' : 'text-[#055A43]/60'}`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#506352]/70 mb-1">
                              {achievement.context}
                            </p>
                            <p className="font-serif text-[#055A43] text-lg leading-tight">{achievement.title}</p>
                            <p className="text-[#6B7A6E] text-[13px] font-light leading-relaxed">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pl-1">
                  <h3 className="font-bold text-[#506352] text-[11px] tracking-[0.15em] uppercase mb-5">Análise comportamental</h3>
                  
                  {report.behaviorAverage > 0 && (
                    <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-4 flex gap-5 items-start transition-colors hover:border-[#055A43]/20">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6 text-[#055A43]" />
                      </div>
                      <div className="pt-1 w-full">
                        <p className="font-bold text-gray-900 text-[15px] mb-1 flex justify-between">
                          Comportamento positivo <span className="text-[#055A43]">{report.behaviorAverage}%</span>
                        </p>
                        <div className="w-full bg-[#F7F5EF] h-1.5 rounded-full mt-2 mb-3">
                           <div className="h-full bg-[#055A43]" style={{ width: `${report.behaviorAverage}%`, borderRadius: '999px' }} />
                        </div>
                        <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed">
                          {report.predominantMood ? `Humor predominante: ${report.predominantMood}.` : 'Registros variados na semana.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {checkinInsights?.hasEnoughData && (
                    <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-4 flex gap-5 items-start transition-colors hover:border-[#055A43]/20">
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="pt-1 w-full">
                        <p className="font-bold text-gray-900 text-[15px] mb-1">Padrões de rotina</p>
                        <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed">
                          {checkinInsights.insightText}
                        </p>
                      </div>
                    </div>
                  )}

                  {report.mainImprovement && (
                    <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-4 flex gap-5 items-start transition-colors hover:border-[#055A43]/20">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Star className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="pt-1 w-full">
                        <p className="font-bold text-gray-900 text-[15px] mb-1">Destaque da semana</p>
                        <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed">
                          {report.mainImprovement}
                        </p>
                      </div>
                    </div>
                  )}

                  {report.attentionPoint && (
                    <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8 flex gap-5 items-start transition-colors hover:border-orange-500/20">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="pt-1">
                        <p className="font-bold text-gray-900 text-[15px] mb-1">Atenção e ajuste</p>
                        <p className="text-[#6B7A6E] font-light text-[14px] leading-relaxed mb-3">
                           {report.attentionPoint}
                        </p>
                        {report.nextWeekSuggestion && (
                          <div className="bg-[#F7F5EF] p-3 rounded-xl border border-orange-100">
                            <p className="text-[12px] text-[#6B7A6E] font-medium">
                               <span className="text-orange-500 font-bold uppercase tracking-widest text-[10px] mr-2">Sugestão</span> 
                               {report.nextWeekSuggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(!report.attentionPoint && report.nextWeekSuggestion) && (
                    <div className="bg-[#F7F5EF] p-4 rounded-[1.5rem] border border-gray-100 mb-8">
                      <p className="text-[13px] text-[#6B7A6E] font-medium leading-relaxed">
                         <span className="text-[#055A43] font-bold uppercase tracking-widest text-[10px] block mb-1">Próxima semana</span>
                         {report.nextWeekSuggestion}
                      </p>
                    </div>
                  )}

                  {report.activeDays > 0 && (
                    <div className="bg-gradient-to-br from-[#F7F5EF] to-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm mb-1">Consistência</p>
                        <p className="text-[13px] text-[#6B7A6E] font-medium">{Math.round((report.activeDays / 7) * 100)}% da semana ativa</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#055A43]/5 to-[#055A43]/10 flex items-center justify-center border border-[#055A43]/10">
                        <TrendingUp className="w-5 h-5 text-[#055A43]" />
                      </div>
                    </div>
                  )}
                </div>
                </>
              )}
            </motion.div>
          </main>
        )}
      </div>
    </div>
  );
}
