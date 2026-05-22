import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, AlertCircle, TrendingUp, CheckCircle2, Sparkles, Activity, FileText, Info } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { WeeklyReportMotor, WeeklyActivity } from '@/src/motors/WeeklyReportMotor';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumGate } from '@/src/components/ui/PremiumGate';

export function RelatorioSemanal() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [dogName, setDogName] = useState('Seu cão');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyActivity | null>(null);

  if (!isPremium) return <PremiumGate featureName="Relatório Semanal" />;

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const stats = await EvolutionRepository.getSummary(user.uid);
          
          const dog = await DogRepository.getDogProfile(user.uid);
          if (dog) setDogName(dog.name);

          // Get last 7 days data
          const checkins = await CheckinRepository.getRecentCheckins(user.uid, 7);
          
          const logs = await TrainingRepository.getTrainingLogs(user.uid);
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentLogs = logs.filter(log => log.completedAt && log.completedAt >= sevenDaysAgo);

          const generatedReport = WeeklyReportMotor.generateReport(stats, checkins, recentLogs);
          setReport(generatedReport);
        }
      } catch (err) {
        console.error("Error loading week report data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F8] font-sans flex flex-col relative selection:bg-[#055A43]/20">
      <header className="px-6 pt-16 pb-6 bg-[#F9F9F8] border-b border-[#055A43]/5 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#055A43]/5 flex items-center justify-center text-[#5C615D] active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium text-[#506352] tracking-[0.15em] uppercase mb-0.5">
            Análise Comportamental
          </p>
          <h1 className="font-serif text-[24px] text-[#055A43] tracking-tight leading-none">
            Relatório Semanal
          </h1>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-[#055A43]/20 border-t-[#055A43] rounded-full animate-spin" />
        </div>
      ) : !report ? (
        <div className="flex-1 flex items-center justify-center">
           <p className="text-[#5C615D]">Erro ao carregar relatório.</p>
        </div>
      ) : (
        <main className="flex-1 px-6 py-6 overflow-y-auto pb-32">
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
              <p className="text-[#5C615D] text-[16px] font-light leading-relaxed max-w-[280px]">
                {report.maturityLevel === 'empty' 
                  ? `Precisamos de mais alguns dias de atividade para montar o relatório do ${dogName}.` 
                  : `Um olhar detalhado sobre o desenvolvimento do ${dogName}.`}
              </p>
            </div>

            {report.maturityLevel === 'empty' ? (
              <div className="bg-white rounded-[2rem] p-8 border border-[#055A43]/10 shadow-sm text-center flex flex-col items-center justify-center py-16">
                 <div className="w-16 h-16 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-6 border border-gray-100">
                    <Info className="w-8 h-8 text-[#5C615D]/40" />
                 </div>
                 <h3 className="font-serif text-2xl text-[#055A43] mb-3">Relatório em construção</h3>
                 <p className="text-[#5C615D] font-light leading-relaxed text-[15px] max-w-[240px]">
                   Seu relatório semanal ficará mais completo conforme você registra treinos e check-ins.
                 </p>
              </div>
            ) : (
              <>
                {/* Main Stats Card */}
                <div className="bg-[#055A43] rounded-[2.5rem] p-8 text-white shadow-[0_20px_40px_-15px_rgb(5,90,67,0.4)] mb-10 relative overflow-hidden group border border-[#055A43]/20">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110 pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-800/40 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="grid grid-cols-2 gap-6 relative z-10 mb-8">
                    <div>
                      <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Treinos
                      </p>
                      <p className="font-serif text-[42px] leading-none drop-shadow-sm">{report.totalTrainings}</p>
                    </div>
                    <div>
                      <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Check-ins
                      </p>
                      <p className="font-serif text-[42px] leading-none drop-shadow-sm">{report.totalCheckins}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 relative z-10">
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
                </div>

                <div className="pl-1">
                  <h3 className="font-bold text-[#506352] text-[11px] tracking-[0.15em] uppercase mb-5">Análise Comportamental</h3>
                  
                  {report.behaviorAverage > 0 && (
                    <div className="bg-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-4 flex gap-5 items-start transition-colors hover:border-[#055A43]/20">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6 text-[#055A43]" />
                      </div>
                      <div className="pt-1 w-full">
                        <p className="font-bold text-gray-900 text-[15px] mb-1 flex justify-between">
                          Comportamento Positivo <span className="text-[#055A43]">{report.behaviorAverage}%</span>
                        </p>
                        <div className="w-full bg-[#FAFAFA] h-1.5 rounded-full mt-2 mb-3">
                           <div className="h-full bg-[#055A43]" style={{ width: `${report.behaviorAverage}%`, borderRadius: '999px' }} />
                        </div>
                        <p className="text-[#5C615D] font-light text-[14px] leading-relaxed">
                          {report.predominantMood ? `Humor predominante: ${report.predominantMood}.` : 'Registros variados na semana.'}
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
                        <p className="font-bold text-gray-900 text-[15px] mb-1">Destaque da Semana</p>
                        <p className="text-[#5C615D] font-light text-[14px] leading-relaxed">
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
                        <p className="font-bold text-gray-900 text-[15px] mb-1">Atenção e Ajuste</p>
                        <p className="text-[#5C615D] font-light text-[14px] leading-relaxed mb-3">
                           {report.attentionPoint}
                        </p>
                        {report.nextWeekSuggestion && (
                          <div className="bg-[#FAFAFA] p-3 rounded-xl border border-orange-100">
                            <p className="text-[12px] text-[#5C615D] font-medium">
                               <span className="text-orange-500 font-bold uppercase tracking-widest text-[10px] mr-2">Sugestão</span> 
                               {report.nextWeekSuggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(!report.attentionPoint && report.nextWeekSuggestion) && (
                    <div className="bg-[#FAFAFA] p-4 rounded-[1.5rem] border border-gray-100 mb-8">
                      <p className="text-[13px] text-[#5C615D] font-medium leading-relaxed">
                         <span className="text-[#055A43] font-bold uppercase tracking-widest text-[10px] block mb-1">Próxima Semana</span> 
                         {report.nextWeekSuggestion}
                      </p>
                    </div>
                  )}

                  {report.activeDays > 0 && (
                    <div className="bg-gradient-to-br from-[#FAFAFA] to-white rounded-[2rem] p-6 border border-[#055A43]/10 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm mb-1">Consistência</p>
                        <p className="text-[13px] text-[#5C615D] font-medium">{Math.round((report.activeDays / 7) * 100)}% da semana ativa</p>
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
  );
}


