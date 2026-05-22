import { TRAINING_TEMPLATES } from './trainingTemplates';

interface DogProfile {
  behaviorIssues?: string[];
  personalityTraits?: string[];
  energyLevel?: string;
  routine?: string | string[];
  walksPerDay?: string;
  livesWithPeople?: boolean;
  livesWithAnimals?: boolean;
}

/**
 * Motor adaptativo que gera a sequência ideal baseada no perfil do cão.
 * 
 * Ordem base: Bloco 1, Bloco 2
 * Depois: Ramificações prioritárias (ansiedade, passeio, autocontrole, socialização, necessidades bagunçadas)
 * Por fim: Complementares (Manejo, Vinculo)
 */
export function generateTrainingPlan(profile: DogProfile, trainingLogs?: Array<{ trainingId: string; feedback: string }>): string[] {
  let sequence: string[] = [];

  const addBlock = (blockId: string) => {
    const blockTasks = Object.keys(TRAINING_TEMPLATES).filter(id => id.startsWith(`${blockId}-`));
    // Sort tasks logically by ending number
    blockTasks.sort((a, b) => {
      const aNum = parseInt(a.split('-t')[1] || '0');
      const bNum = parseInt(b.split('-t')[1] || '0');
      return aNum - bNum;
    });
    // Only add if not already in the sequence
    for (const taskId of blockTasks) {
      if (!sequence.includes(taskId)) {
        sequence.push(taskId);
      }
    }
  };

  // Base obrigatória
  addBlock('b1');
  addBlock('b2');

  // Identifica prioridades berdasarkan do perfil (podemos ter múltiplas, vamos dar uma ordem de precedência)
  const priorities: string[] = [];
  
  if (profile.behaviorIssues?.includes('pulling')) {
    priorities.push('b4'); // Passeio
  }
  
  if (profile.behaviorIssues?.includes('separation_anxiety') || profile.behaviorIssues?.includes('destructive')) {
    priorities.push('b6'); // Ansiedade
  }
  
  const isImpulsive = profile.personalityTraits?.includes('Agitado') || profile.behaviorIssues?.includes('barking');
  if (isImpulsive) {
    if (!priorities.includes('b3')) priorities.push('b3'); // Autocontrole
  }

  const isReactive = profile.personalityTraits?.includes('Medroso');
  if (isReactive) {
    priorities.push('b5'); // Socialização e Ambiente
  }

  // Falta de rotina adequada
  if (profile.routine?.includes('apartment') && ['Nenhum', '1 a 2 vezes'].includes(profile.walksPerDay || '')) {
    // maybe needs B7 as priority?
  }
  
  // They mentioned "potty_routine mess", but we don't ask strictly in onboarding, so let's default B7 priority if apartment
  if (profile.routine?.includes('apartment')) {
    priorities.push('b7');
  }

  // Adiciona as prioridades descobertas
  for (const p of priorities) {
    addBlock(p);
  }

  // Completa os outros blocos de nivel comportamental / socialização caso não foram adicionados
  const behavioralBlocks = ['b3', 'b4', 'b5', 'b6', 'b7'];
  for (const bb of behavioralBlocks) {
    if (!priorities.includes(bb)) {
      addBlock(bb);
    }
  }

  // Por fim, complementares
  addBlock('b8');
  addBlock('b9');

  // Tarefas com 3+ feedbacks 'failed' são movidas para o final da sequência.
  // Isso permite que o cão evolua em outras habilidades antes de retentar o desafio.
  if (trainingLogs && trainingLogs.length > 0) {
    const failCounts: Record<string, number> = {};
    for (const log of trainingLogs) {
      if (log.feedback === 'failed') {
        failCounts[log.trainingId] = (failCounts[log.trainingId] || 0) + 1;
      }
    }
    const hardIds = Object.keys(failCounts).filter(id => failCounts[id] >= 3);
    if (hardIds.length > 0) {
      const normal = sequence.filter(id => !hardIds.includes(id));
      const deferred = sequence.filter(id => hardIds.includes(id));
      return [...normal, ...deferred];
    }
  }

  return sequence;
}
