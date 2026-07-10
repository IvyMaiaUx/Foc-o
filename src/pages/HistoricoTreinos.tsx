import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CalendarClock, Play, CheckCircle2 } from 'lucide-react';
import { auth, db } from '@/src/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumGate } from '@/src/components/ui/PremiumGate';

interface TrainingLog {
  id: string;
  trainingId: string;
  title: string;
  completedAt: Date | null;
  durationMinutes: number;
}

export function HistoricoTreinos() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (!isPremium) return <PremiumGate featureName="Histórico Completo" />;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const logsRef = collection(db, 'users', user.uid, 'trainingLogs');
        const q = query(logsRef, orderBy('completedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedLogs: TrainingLog[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedLogs.push({
            id: doc.id,
            trainingId: data.trainingId,
            title: data.title,
            completedAt: data.completedAt ? (typeof data.completedAt === 'number' ? new Date(data.completedAt) : (data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt))) : null,
            durationMinutes: data.durationMinutes || 0,
          });
        });
        
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Data desconhecida';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Group logs by month
  const groupedLogs = logs.reduce((acc, log) => {
    if (!log.completedAt) return acc;
    const monthYear = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).format(log.completedAt);
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(log);
    return acc;
  }, {} as Record<string, TrainingLog[]>);

  return (
    <div className="flex-1 bg-white font-sans min-h-screen">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 bg-white border-b border-[#055A43]/5 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F7F5EF] border border-[#055A43]/5 flex items-center justify-center text-[#6B7A6E] active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium text-[#506352] tracking-[0.15em] uppercase mb-0.5">
            Módulo de Foco
          </p>
          <h1 className="font-serif text-[24px] text-[#055A43] tracking-tight leading-none">
            Histórico
          </h1>
        </div>
      </header>

      <main className="px-6 py-6 pb-24">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#055A43]/20 border-t-[#055A43] rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-[#055A43]/5 rounded-full flex items-center justify-center mb-6">
              <CalendarClock className="w-10 h-10 text-[#055A43]/40" />
            </div>
            <h2 className="font-serif text-2xl text-[#055A43] mb-2">Sem histórico</h2>
            <p className="text-[#6B7A6E] text-[15px] font-light max-w-[260px]">
              Vocês ainda não concluíram nenhum treino. Que tal começar hoje?
            </p>
            <button 
              onClick={() => navigate('/plano')}
              className="mt-8 px-6 py-3 bg-[#055A43] text-white rounded-full font-medium shadow-md transition-transform active:scale-95"
            >
              Ir para o Plano
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Stats section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#055A43] text-white rounded-[2rem] p-6 shadow-lg shadow-[#055A43]/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
              <h3 className="text-white/80 uppercase tracking-widest text-[10px] font-medium mb-4">Métricas de foco</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-serif text-4xl mb-1">{logs.length}</p>
                  <p className="text-white/80 text-xs font-light">Sessões<br/>concluídas</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-4xl mb-1">
                    {logs.reduce((acc, log) => acc + log.durationMinutes, 0)}<span className="text-xl ml-1">m</span>
                  </p>
                  <p className="text-white/80 text-xs font-light">Tempo de<br/>treino</p>
                </div>
              </div>
            </motion.div>

            {/* List */}
            <div className="flex flex-col gap-6">
              {(Object.entries(groupedLogs) as [string, TrainingLog[]][]).map(([month, monthLogs], index) => (
                <motion.div 
                  key={month}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="text-[11px] font-bold text-[#506352] uppercase tracking-[0.15em] mb-4 pl-2 capitalize">
                    {month}
                  </h4>
                  <div className="flex flex-col gap-4 relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-4 bottom-4 w-px bg-gray-100 -z-10" />
                    
                    {monthLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shrink-0 z-10 shadow-sm mt-1">
                          <CheckCircle2 className="w-5 h-5 text-[#055A43]" />
                        </div>
                        <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(45,74,58,0.08)] transition-shadow group-hover:shadow-md">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-[#055A43] text-[15px] leading-snug">
                              {log.title}
                            </h5>
                            <span className="text-[12px] font-medium text-[#506352] bg-[#F7F5EF] px-2 py-0.5 rounded border border-gray-100 ml-2 shrink-0">
                              {log.durationMinutes} min
                            </span>
                          </div>
                          <div className="flex items-center text-[#6B7A6E]/70 text-xs">
                            <span>{formatDate(log.completedAt)}</span>
                            <span className="mx-1.5">•</span>
                            <span>{formatTime(log.completedAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
