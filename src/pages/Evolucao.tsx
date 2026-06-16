import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Flame, Target, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EvolutionRepository, EvolutionSummary } from '@/src/repositories/EvolutionRepository';
import { CheckinRepository, CheckinData } from '@/src/repositories/CheckinRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { EvolutionInsightsMotor, WeeklyChartPoint, EvolutionInsights } from '@/src/motors/EvolutionInsightsMotor';

import { useNavigate } from 'react-router-dom';

export function Evolucao() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<EvolutionSummary | null>(null);
  const [insights, setInsights] = useState<EvolutionInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        const stats = await EvolutionRepository.getSummary(user.uid);
        setSummary(stats);

        const checkins = await CheckinRepository.getRecentCheckins(user.uid, 7);
        const trainingLogs = await TrainingRepository.getTrainingLogs(user.uid);

        const generatedInsights = EvolutionInsightsMotor.generateInsights(stats, checkins, trainingLogs);
        setInsights(generatedInsights);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="flex-1 bg-[#FAFAFA] font-sans pb-24">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 bg-white border-b border-[#055A43]/5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-[14px] font-medium text-[#506352] mb-1">
            Seu progresso
          </p>
          <h1 className="font-serif text-[32px] text-[#055A43] tracking-tight leading-tight">
            Evolução
          </h1>
        </motion.div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-2 border-[#055A43]/30 border-t-[#055A43] rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="px-6 py-8 flex flex-col gap-6">
          
          {/* Journey Insight */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-[#055A43]/[0.03] rounded-3xl p-6 border border-[#055A43]/10"
          >
            <p className="font-serif text-[#055A43] text-xl leading-snug">
              {insights?.journeyInsight}
            </p>
          </motion.div>

          {insights?.smartReading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/10 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#055A43]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#055A43]">
                  Leitura de evolução
                </p>
              </div>

              <p className="font-serif text-[24px] text-gray-900 leading-snug mb-3">
                {insights.smartReading.headline}
              </p>
              <p className="text-[14px] text-[#5C615D] leading-relaxed mb-5">
                {insights.smartReading.body}
              </p>

              <div className="grid gap-2 mb-5">
                {insights.smartReading.evidence.map((item) => (
                  <div key={item} className="rounded-2xl bg-[#FAFAFA] border border-[#055A43]/5 px-4 py-3">
                    <p className="text-[12px] font-semibold text-[#506352]">{item}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 rounded-2xl bg-orange-50/70 border border-orange-100 px-4 py-3 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#5C615D] leading-relaxed">{insights.smartReading.attention}</p>
              </div>

              <div className="rounded-2xl bg-[#055A43]/[0.04] border border-[#055A43]/10 px-4 py-3">
                <p className="text-[12px] font-semibold text-[#055A43] leading-relaxed">
                  {insights.smartReading.recommendation}
                </p>
              </div>
            </motion.div>
          )}

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
             <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.1 }}
               className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
             >
               <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43] mb-3">
                 <Target className="w-5 h-5" />
               </div>
               <p className="font-serif text-2xl text-[#055A43] leading-none mb-1">{(insights?.isEmpty ? 0 : summary?.totalSessions) || 0}</p>
               <p className="text-[10px] font-medium text-[#5C615D]/60 uppercase tracking-widest">
                 {((insights?.isEmpty ? 0 : summary?.totalSessions) || 0) === 1 ? 'Sessão' : 'Sessões'}
               </p>
             </motion.div>
             
             <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
             >
               <div className="w-10 h-10 rounded-full bg-[#5F2620]/5 flex items-center justify-center text-[#5F2620] mb-3">
                 <Flame className="w-5 h-5" />
               </div>
               <p className="font-serif text-2xl text-[#5F2620] leading-none mb-1">{(insights?.isEmpty ? 0 : EvolutionRepository.liveStreak(summary)) || 0}</p>
               <p className="text-[10px] font-medium text-[#5C615D]/60 uppercase tracking-widest">
                 {((insights?.isEmpty ? 0 : EvolutionRepository.liveStreak(summary)) || 0) === 1 ? 'Dia seguido' : 'Dias seguidos'}
               </p>
             </motion.div>
          </div>

          {/* Chart */}
          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
             className="bg-white rounded-[1.5rem] p-6 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mt-2"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-medium text-[#055A43] text-sm tracking-widest uppercase">{insights?.chartTitle || 'Atividade Semanal'}</h3>
                <p className="text-xs text-[#5C615D] mt-1 font-light max-w-[200px] leading-relaxed">{insights?.chartSubtitle}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#506352] shrink-0" />
            </div>
            
            <div className="flex items-end justify-between h-40 mt-6 gap-2">
              {insights?.chartData?.map((d: any, i: number) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-[#055A43]/5 rounded-t-lg relative group flex flex-col justify-end" style={{ height: '100px' }}>
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-1000 ${d.value > 0 ? 'bg-[#055A43]' : 'bg-transparent'}`} 
                      style={{ height: `${d.value}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-[#5C615D]/60 mt-3 uppercase tracking-widest">{d.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Intelligent Achievements */}
          {insights?.achievements && insights.achievements.length > 0 && (
            <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.4 }}
               className="mt-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[#506352] text-sm tracking-widest uppercase px-2">Conquistas inteligentes</h3>
                <button onClick={() => navigate('/relatorio')} className="text-xs text-[#055A43] font-medium uppercase tracking-widest px-2">Ver Relatório</button>
              </div>
              
              <div className="flex flex-col gap-3">
                {insights.achievements.slice(0, 3).map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className={`bg-white rounded-[1.5rem] p-5 border shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 ${
                      index === 0 ? 'border-[#D8C3A5]/70' : 'border-[#055A43]/5'
                    }`}
                  >
                <div className="w-12 h-12 rounded-full bg-[#FAFAFA] flex items-center justify-center border border-[#055A43]/10">
                  <Award className="w-6 h-6 text-[#5C615D]/60" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#506352]/70 mb-1">{achievement.context}</p>
                  <p className="font-serif text-[#055A43] text-lg leading-tight">{achievement.title}</p>
                  <p className="text-[#5C615D] text-xs font-light">{achievement.description}</p>
                </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      )}
    </div>
  );
}
