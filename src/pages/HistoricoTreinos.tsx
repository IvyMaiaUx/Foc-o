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
    <div className="flex-1 bg-[#F7F5EF] font-sans min-h-screen pb-24">
      <div className="mx-auto max-w-xl">

        {/* Green header zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden bg-[#055A43] px-6 pt-14 pb-9"
        >
          <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 active:scale-[0.98] transition-all shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold text-white/45 tracking-[0.18em] uppercase mb-1">
                Módulo de Foco
              </p>
              <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight leading-none">
                Histórico
              </h1>
            </div>
          </div>

          {!isLoading && logs.length > 0 && (
            <div className="relative z-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-[13px] text-white/50">Sessões concluídas</p>
                <p className="font-serif text-[40px] font-semibold leading-none text-white">{logs.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-white/50">Tempo total</p>
                <p className="font-serif text-[40px] font-semibold leading-none text-white">
                  {logs.reduce((acc, log) => acc + log.durationMinutes, 0)}<span className="text-lg ml-1 text-white/60">m</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* White drawer */}
        <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] px-6 pt-7 pb-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-[#055A43]/20 border-t-[#055A43] rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-14 flex flex-col items-center rounded-[1.75rem] border border-[#055A43]/10 bg-white px-6"
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
                className="mt-8 px-6 py-3 bg-[#C2703E] text-white rounded-full font-medium shadow-md transition-transform active:scale-95"
              >
                Ir para o Plano
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-8">
              {(Object.entries(groupedLogs) as [string, TrainingLog[]][]).map(([month, monthLogs], index) => (
                <motion.section
                  key={month}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#055A43]/70 mb-3 pl-1 capitalize">
                    {month}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {monthLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 rounded-2xl border border-[#055A43]/8 bg-white p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E5F2ED]">
                          <CheckCircle2 className="h-4 w-4 text-[#055A43]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-serif text-[17px] text-[#506352] truncate">
                              {log.title}
                            </h5>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#055A43]/70 shrink-0">
                              {log.durationMinutes} min
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#6B7A6E]/70">
                            {formatDate(log.completedAt)} · {formatTime(log.completedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
