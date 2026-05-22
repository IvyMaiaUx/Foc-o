import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '@/src/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Play, Lock, CheckCircle2, ChevronRight, Calendar } from 'lucide-react';
import { CurrentPlan, TrainingTask } from '@/src/types';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';


const translateLevel = (level: string) => {
  switch (level) {
    case 'beginner': return 'Iniciante';
    case 'intermediate': return 'Intermediário';
    case 'advanced': return 'Avançado';
    default: return level;
  }
};

export function Plano() {
  const navigate = useNavigate();
  const [dogName, setDogName] = useState<string>('seu cão');
  const [isLoading, setIsLoading] = useState(true);
  const [isSkipping, setIsSkipping] = useState(false);
  const [plan, setPlan] = useState<CurrentPlan | null>(null);
  const [knownCommands, setKnownCommands] = useState<string[]>([]);
  const [trainingBase, setTrainingBase] = useState<string>('beginner');

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dogProfile = await DogRepository.getDogProfile(user.uid);
      if (dogProfile) {
        setDogName(dogProfile.name || 'seu cão');
        setKnownCommands(dogProfile.knownCommands || []);
        setTrainingBase(dogProfile.trainingBase || 'beginner');
      }
      
      const currentP = await TrainingRepository.getCurrentPlan(user.uid);
      setPlan(currentP);

    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setIsLoading(false);
      setIsSkipping(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSkipTo = async (targetIndex: number) => {
    setIsSkipping(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await TrainingRepository.updatePlanProgress(user.uid, targetIndex);
        setTimeout(async () => {
          await loadData();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500); // give it a small delay for firestore
      }
    } catch (err) {
      console.error(err);
      setIsSkipping(false);
    }
  };

  if (isLoading || isSkipping) {
    return (
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  const tasks = plan?.tasks || [];
  const currentTaskIndex = plan?.currentTaskIndex || 0;

  const currentTask = tasks[currentTaskIndex];
  // Filter remaining tasks and group them by module
  const remainingTasks = tasks.slice(currentTaskIndex + 1);
  const upcomingModulesMap = remainingTasks.reduce((acc, t) => {
    if (!acc[t.moduleName]) acc[t.moduleName] = [];
    acc[t.moduleName].push(t);
    return acc;
  }, {} as Record<string, TrainingTask[]>);

  // Filter completed/skipped past tasks and group them by module
  const pastTasks = tasks.slice(0, currentTaskIndex);
  const pastModulesMap = pastTasks.reduce((acc, t) => {
    if (!acc[t.moduleName]) acc[t.moduleName] = [];
    acc[t.moduleName].push(t);
    return acc;
  }, {} as Record<string, TrainingTask[]>);
  
  const currentModule = currentTask?.module || '1';
  const currentModuleName = currentTask?.moduleName || 'Em breve';

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
            Trilha de Evolução Personalizada
          </p>
          <h1 className="font-serif text-[32px] text-[#055A43] tracking-tight leading-tight">
            Plano do <br />
            <span className="italic">{dogName}</span>
          </h1>
          <button 
            onClick={() => navigate('/agenda')}
            className="mt-6 flex items-center gap-2 text-[#055A43] text-sm font-semibold bg-[#055A43]/5 px-4 py-2.5 rounded-full border border-[#055A43]/10 hover:bg-[#055A43]/10 transition-colors active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver agenda completa</span>
          </button>
          {knownCommands.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-[#055A43] font-medium bg-[#055A43]/10 px-2 py-1 rounded-md">Nível: {translateLevel(trainingBase)}</span>
              <span className="text-xs text-[#506352] px-2 py-1 rounded-md border border-[#506352]/20">{knownCommands.length} comandos consolidados</span>
            </div>
          )}
        </motion.div>
      </header>

      <main className="px-6 py-8 flex flex-col gap-8">
        
        {!currentTask && (
          <div className="text-center text-[#5C615D] py-10">
             Não há treinos ativos no momento ou todos foram concluídos!
          </div>
        )}

        {currentTask && (
          <section className="mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center justify-between mb-4"
            >
              <div>
                <p className="text-[10px] font-medium text-[#055A43] tracking-widest uppercase mb-1">Bloco atual: {currentModule}</p>
                <h2 className="text-xl font-serif text-[#506352]">{currentModuleName}</h2>
              </div>
            </motion.div>

            <div className="flex flex-col gap-3">
              {/* Tarefa atual = Agora */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onClick={() => navigate(`/treino/${currentTask.id}`)}
                className="cursor-pointer bg-white border border-[#055A43]/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-6 relative overflow-hidden group mb-4"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#055A43]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-150" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="text-[10px] font-bold text-white bg-[#055A43] px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    Agora
                  </span>
                  <span className="text-[#055A43] text-[10px] font-bold uppercase tracking-widest bg-[#055A43]/10 px-3 py-1.5 rounded-full">{currentTask.duration}</span>
                </div>

                <h3 className="font-serif text-[22px] text-[#055A43] tracking-tight mb-2">{currentTask.title}</h3>
                <p className="text-[#5C615D] text-[13px] font-light leading-relaxed mb-6 line-clamp-2">
                  {TRAINING_TEMPLATES[currentTask.id]?.objective || currentTask.description}
                </p>

                <button className="w-full bg-[#055A43] text-white h-12 rounded-xl font-medium text-sm flex items-center justify-between px-5 transition-transform active:scale-[0.98] shadow-md shadow-[#055A43]/20 hover:bg-[#044735]">
                  <span>Iniciar sessão</span>
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </motion.div>

              {/* Próximos na fila agrupados por bloco */}
              {Object.entries(upcomingModulesMap).length > 0 && (
                <div className="mt-8 mb-8">
                  <h3 className="text-sm font-medium text-[#506352] mb-6 pl-1 font-serif text-[18px]">Próximas etapas</h3>
                  <p className="text-[#5C615D] text-xs mb-4 pl-1">Acompanhe a continuação do plano para o seu cão.</p>
                  
                  <div className="flex flex-col gap-6">
                    {Object.entries(upcomingModulesMap).map(([modName, modTasks], modIndex) => (
                      <div key={modName} className="mb-2">
                        <h4 className="text-[11px] font-bold text-[#055A43] uppercase tracking-wider mb-3 pl-2 opacity-80">
                          {modName}
                        </h4>
                        <div className="flex flex-col gap-3">
                          {(modTasks as TrainingTask[]).map((t, i) => {
                            const taskGlobalIndex = tasks.findIndex(x => x.id === t.id);
                            return (
                              <button 
                                key={t.id} 
                                onClick={() => handleSkipTo(taskGlobalIndex)}
                                className="w-full text-left bg-white border border-[#055A43]/10 hover:border-[#055A43]/30 rounded-[1.5rem] p-5 flex items-center gap-4 transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#055A43]/10 flex items-center justify-center shrink-0 group-hover:bg-[#055A43]/5">
                                  <ChevronRight className="w-5 h-5 text-[#5C615D]/60" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-medium text-[#5C615D]/60 uppercase tracking-widest">
                                      Em seguida
                                    </span>
                                    <span className="text-[10px] text-[#5C615D]/60 uppercase tracking-widest">{t.duration}</span>
                                  </div>
                                  <h4 className="font-serif text-[17px] text-[#506352]">{t.title}</h4>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Treinos anteriores / concluídos */}
              {Object.entries(pastModulesMap).length > 0 && (
                <div className="mt-8 pb-12">
                  <h3 className="text-sm font-medium text-[#506352] mb-6 pl-1 font-serif text-[18px]">Treinos Anteriores</h3>
                  <p className="text-[#5C615D] text-xs mb-4 pl-1">Revisite lições passadas para reforçar o aprendizado.</p>
                  
                  <div className="flex flex-col gap-6">
                    {Object.entries(pastModulesMap).map(([modName, modTasks]) => (
                      <div key={modName} className="mb-2 opacity-80">
                        <h4 className="text-[11px] font-bold text-[#055A43] uppercase tracking-wider mb-3 pl-2 opacity-80">
                          {modName}
                        </h4>
                        <div className="flex flex-col gap-3">
                          {(modTasks as TrainingTask[]).map((t) => {
                            const taskGlobalIndex = tasks.findIndex(x => x.id === t.id);
                            return (
                              <button 
                                key={t.id} 
                                onClick={() => handleSkipTo(taskGlobalIndex)}
                                className="w-full text-left bg-white border border-[#055A43]/10 hover:border-[#055A43]/30 rounded-[1.5rem] p-5 flex items-center gap-4 transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-full bg-[#E5F2ED] border border-[#055A43]/10 flex items-center justify-center shrink-0 group-hover:bg-[#055A43]/10">
                                  <CheckCircle2 className="w-4 h-4 text-[#055A43]" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-medium text-[#055A43]/60 uppercase tracking-widest">
                                      Voltar para
                                    </span>
                                    <span className="text-[10px] text-[#5C615D]/60 uppercase tracking-widest">{t.duration}</span>
                                  </div>
                                  <h4 className="font-serif text-[17px] text-[#506352]">{t.title}</h4>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
