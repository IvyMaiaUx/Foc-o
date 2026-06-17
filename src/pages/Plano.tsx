import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  History,
  Layers3,
  Lock,
  Play,
} from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { CurrentPlan, TrainingTask } from '@/src/types';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { sanitizeText } from '@/src/lib/textSanitizer';
import { useAuth } from '@/src/contexts/AuthContext';

interface PlanModule {
  name: string;
  tasks: TrainingTask[];
  completed: number;
  isCurrent: boolean;
}

function translateLevel(level: string) {
  switch (level) {
    case 'beginner': return 'Iniciante';
    case 'intermediate': return 'Intermediário';
    case 'advanced': return 'Avançado';
    default: return level;
  }
}

function taskDescription(task: TrainingTask) {
  return sanitizeText(TRAINING_TEMPLATES[task.id]?.objective || task.description);
}

export function Plano() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [dogName, setDogName] = useState('seu cão');
  const [dogGender, setDogGender] = useState('male');
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<CurrentPlan | null>(null);
  const [knownCommands, setKnownCommands] = useState<string[]>([]);
  const [trainingBase, setTrainingBase] = useState('beginner');
  const [showFullSequence, setShowFullSequence] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const [dogProfile, currentPlan] = await Promise.all([
          DogRepository.getDogProfile(user.uid),
          TrainingRepository.getCurrentPlan(user.uid),
        ]);

        if (dogProfile) {
          setDogName(dogProfile.name || 'seu cão');
          setDogGender(dogProfile.gender || 'male');
          setKnownCommands(dogProfile.knownCommands || []);
          setTrainingBase(dogProfile.trainingBase || 'beginner');
        }

        setPlan(currentPlan);
      } catch (error) {
        console.error('[Plano] failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const tasks = plan?.tasks || [];
  const currentTaskIndex = Math.min(plan?.currentTaskIndex || 0, tasks.length);
  const currentTask = tasks[currentTaskIndex];
  const completedTasks = tasks.slice(0, currentTaskIndex);
  const upcomingTasks = tasks.slice(currentTaskIndex + 1);
  const visibleUpcomingTasks = showFullSequence ? upcomingTasks : upcomingTasks.slice(0, 2);
  const overallProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const modules = useMemo<PlanModule[]>(() => {
    return tasks.reduce<PlanModule[]>((result, task, index) => {
      let module = result.find((item) => item.name === task.moduleName);
      if (!module) {
        module = { name: task.moduleName, tasks: [], completed: 0, isCurrent: false };
        result.push(module);
      }
      module.tasks.push(task);
      if (index < currentTaskIndex) module.completed += 1;
      if (index === currentTaskIndex) module.isCurrent = true;
      return result;
    }, []);
  }, [currentTaskIndex, tasks]);

  const currentModule = modules.find((module) => module.isCurrent);
  const currentModuleStep = currentModule && currentTask
    ? currentModule.tasks.findIndex((task) => task.id === currentTask.id) + 1
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FAFAFA] pb-28 font-sans">
      <header className="border-b border-[#055A43]/5 bg-white px-6 pb-7 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-xl"
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#506352]">
            Trilha de evolução personalizada
          </p>
          <h1 className="font-serif text-[34px] leading-tight text-[#055A43]">
            Plano de treino
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5C615D]">
            Acompanhe a evolução {dogGender === 'female' ? 'da' : 'do'} {dogName} passo a passo.
          </p>

          <div className="mt-6 rounded-2xl border border-[#055A43]/10 bg-[#F8FBF9] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5C615D]/70">
                  Progresso geral
                </p>
                <p className="mt-1 text-sm font-semibold text-[#055A43]">
                  {completedTasks.length} de {tasks.length} etapas do plano
                </p>
              </div>
              <span className="font-serif text-2xl text-[#055A43]">{overallProgress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#055A43]/10">
              <div
                className="h-full rounded-full bg-[#055A43] transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/agenda')}
            className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#055A43]"
          >
            <Calendar className="h-4 w-4" />
            Ver agenda completa
          </button>
        </motion.div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-9 px-6 py-8">
        {!currentTask ? (
          <section className="rounded-[1.75rem] border border-[#055A43]/10 bg-white p-7 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[#055A43]" />
            <h2 className="mt-4 font-serif text-2xl text-[#055A43]">Plano concluído</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C615D]">
              Todas as etapas atuais foram concluídas. Continue registrando a rotina para acompanhar a evolução.
            </p>
          </section>
        ) : (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#055A43]">Seu próximo treino</p>
                <h2 className="mt-1 font-serif text-xl text-[#506352]">{sanitizeText(currentTask.moduleName)}</h2>
              </div>
              <span className="rounded-full bg-[#055A43]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#055A43]">
                Treino atual
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[1.75rem] bg-[#055A43] p-6 text-white shadow-[0_14px_32px_rgba(5,90,67,0.2)]"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/75">
                <span>{currentModule ? `Etapa ${currentModuleStep} de ${currentModule.tasks.length}` : 'Etapa atual'}</span>
                <span>{currentTask.duration}</span>
              </div>
              <h3 className="mt-7 font-serif text-[27px] leading-tight">{sanitizeText(currentTask.title)}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/80">
                {taskDescription(currentTask)}
              </p>
              <button
                onClick={() => navigate(`/treino/${currentTask.id}`)}
                className="mt-7 flex h-13 w-full items-center justify-between rounded-xl bg-white px-5 text-sm font-bold text-[#055A43] transition-transform active:scale-[0.98]"
              >
                <span>Começar treino</span>
                <Play className="h-4 w-4 fill-current" />
              </button>
            </motion.div>
          </section>
        )}

        {upcomingTasks.length > 0 && (
          <section>
            <h2 className="font-serif text-[22px] text-[#506352]">Próximos passos</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#5C615D]">
              A sequência prevista para continuar a evolução.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {visibleUpcomingTasks.map((task, index) => (
                <div
                  key={`${task.id}-${index}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#055A43]/8 bg-white p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAFAFA] text-[#5C615D]/55">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#055A43]/70">
                        {index === 0 ? 'Próximo passo' : 'Em breve'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[#5C615D]/60">{task.duration}</span>
                    </div>
                    <h3 className="mt-1 truncate font-serif text-[17px] text-[#506352]">{sanitizeText(task.title)}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#5C615D]/70">
                      {index === 0 ? 'Libera ao concluir o treino atual.' : 'Libera após concluir a próxima etapa.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {upcomingTasks.length > 2 && (
              <button
                onClick={() => setShowFullSequence((current) => !current)}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#055A43]"
              >
                {showFullSequence ? 'Ocultar sequência completa' : 'Ver sequência completa'}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFullSequence ? 'rotate-180' : ''}`} />
              </button>
            )}
          </section>
        )}

        {completedTasks.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-[22px] text-[#506352]">Concluídos recentemente</h2>
                <p className="mt-1 text-xs text-[#5C615D]">Refaça um exercício sem alterar sua trilha.</p>
              </div>
              {isPremium && (
                <button onClick={() => navigate('/historico')} className="text-xs font-bold text-[#055A43]">
                  Histórico
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {completedTasks.slice(-2).reverse().map((task) => (
                <button
                  key={task.id}
                  onClick={() => navigate(isPremium ? `/treino/${task.id}?modo=revisao` : '/assinatura')}
                  className="flex items-center gap-4 rounded-2xl border border-[#055A43]/8 bg-white p-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E5F2ED]">
                    {isPremium ? <History className="h-4 w-4 text-[#055A43]" /> : <Lock className="h-4 w-4 text-[#055A43]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#055A43]/70">
                      {isPremium ? 'Revisão disponível' : 'Revisão Premium'}
                    </span>
                    <h3 className="mt-1 truncate font-serif text-[17px] text-[#506352]">{sanitizeText(task.title)}</h3>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#5C615D]/45" />
                </button>
              ))}
            </div>
          </section>
        )}

        {modules.length > 0 && (
          <section>
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-[#055A43]" />
              <h2 className="font-serif text-[22px] text-[#506352]">Módulos do plano</h2>
            </div>
            <p className="mt-1 text-xs text-[#5C615D]">Progresso por área de desenvolvimento.</p>
            <div className="mt-4 flex flex-col gap-3">
              {modules.map((module) => {
                const progress = Math.round((module.completed / module.tasks.length) * 100);
                const isCompleted = module.completed === module.tasks.length;
                return (
                  <div key={module.name} className="rounded-2xl border border-[#055A43]/8 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#055A43]">{sanitizeText(module.name)}</h3>
                        <p className="mt-1 text-xs text-[#5C615D]">
                          {module.completed} de {module.tasks.length} concluídos
                        </p>
                      </div>
                      <span className="rounded-full bg-[#055A43]/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#055A43]">
                        {isCompleted ? 'Concluído' : module.isCurrent ? 'Em andamento' : 'Futuro'}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#055A43]/10">
                      <div className="h-full rounded-full bg-[#055A43]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {knownCommands.length > 0 && (
          <p className="text-center text-xs text-[#5C615D]/70">
            Nível {translateLevel(trainingBase)} · {knownCommands.length} comandos consolidados
          </p>
        )}
      </main>
    </div>
  );
}
