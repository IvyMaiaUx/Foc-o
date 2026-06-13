import { DogProfile, TrainingTask, CurrentPlan } from '../types';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { BLOCKS } from '@/src/lib/trainingTree';
import { sanitizeText } from '@/src/lib/textSanitizer';
import {
  recommendTrainingsForDog,
  generateDogTagsFromOnboarding,
  TrainingRecommendationScore,
  TRAINING_PROBLEM_TAGS,
} from '@/src/lib/TrainingTags';
import { knownCommandTrainingIds } from '@/src/lib/knownCommandTrainings';

type Template = (typeof TRAINING_TEMPLATES)[keyof typeof TRAINING_TEMPLATES];

const CORE_BLOCK_IDS = ['b1', 'b2'];
const RELEVANCE_FLOOR = 1; // treino não-fundamento precisa de score >= 1 (casar algo) para entrar
const TEMPLATE_LEVEL_RANK: Record<string, number> = { iniciante: 0, intermediario: 1, avancado: 2 };

// Vocabulário de tags de problema (fonte única em TrainingTags.ts).
const PROBLEM_TAGS = new Set<string>(TRAINING_PROBLEM_TAGS);

// Boost de ordenação para o treino que ataca o problema do cão: deve exceder o
// score orgânico máximo (~40) para garantir o front-load, mesmo acima do nível.
const PROBLEM_ORDER_BOOST = 1000;

function dogLevelRank(trainingBase?: string): number {
  if (trainingBase === 'advanced') return 2;
  if (trainingBase === 'intermediate') return 1;
  return 0; // beginner / default
}

export class IntelligentPlanMotor {
  static generatePlan(dogProfile: DogProfile, completedTrainingIds: string[] = []): CurrentPlan {
    const templates = Object.values(TRAINING_TEMPLATES) as Template[];
    const masteredIds = new Set<string>([
      ...knownCommandTrainingIds(dogProfile.knownCommands || []),
      ...completedTrainingIds,
    ]);

    // Tags de problema do cão (ex.: 'pulling' => 'puxa_na_guia').
    const dogProblemTags = new Set(
      generateDogTagsFromOnboarding(dogProfile).filter((tag) => PROBLEM_TAGS.has(tag as string))
    );
    const targetsProblem = (t: Template): boolean =>
      (t.problemTags || []).some((pt: string) => dogProblemTags.has(pt as any));

    const scored = recommendTrainingsForDog(templates, dogProfile, {
      completedIds: Array.from(masteredIds),
      masteredIds: Array.from(masteredIds),
    });
    const scoreById = new Map<string, TrainingRecommendationScore>();
    scored.forEach((s) => scoreById.set(s.trainingId, s));

    const dogRank = dogLevelRank(dogProfile.trainingBase);

    const selected = templates.filter((t) => {
      if (masteredIds.has(t.id)) return false;
      const isCore = CORE_BLOCK_IDS.includes(t.blockId);
      const isProblem = targetsProblem(t);
      // Núcleo e treinos do problema podem ir até 1 nível acima do cão (foco), nunca mais.
      const levelRank = TEMPLATE_LEVEL_RANK[t.levelTag] ?? 0;
      const maxLevel = dogRank + (isCore || isProblem ? 1 : 0);
      if (levelRank > maxLevel) return false;
      const score = scoreById.get(t.id)?.score ?? 0;
      if (!isCore && !isProblem && score < RELEVANCE_FLOOR) return false;
      return true;
    });

    const pool =
      selected.length > 0
        ? selected
        : templates.filter((t) => CORE_BLOCK_IDS.includes(t.blockId) && !masteredIds.has(t.id));

    // Score de ordenação: score do recomendador + boost se ataca o problema do cão.
    const planScoreOf = (t: Template): number =>
      (scoreById.get(t.id)?.score ?? 0) + (targetsProblem(t) ? PROBLEM_ORDER_BOOST : 0);

    const ordered = IntelligentPlanMotor.orderByScoreRespectingPrereqs(pool, planScoreOf);

    const tasks: TrainingTask[] = ordered.map((t) => {
      const b = BLOCKS[t.blockId];
      const rec = scoreById.get(t.id);
      const isProblem = targetsProblem(t);
      return {
        id: t.id,
        title: sanitizeText(t.name),
        duration: t.duration,
        module: b.id.replace('b', ''),
        moduleName: sanitizeText(b.name),
        description: sanitizeText(t.objective),
        steps: t.steps.map(sanitizeText),
        reason: rec ? sanitizeText(rec.reason) : undefined,
        // O treino que ataca o problema do cão é sempre prioridade alta.
        priority: isProblem ? 'alta' : rec?.priority,
      };
    });

    return {
      tasks,
      currentTaskIndex: 0,
      generatedAt: Date.now(),
      focus: sanitizeText(IntelligentPlanMotor.deriveFocus(dogProfile)),
      engine: 'intelligent',
    };
  }

  static orderByScoreRespectingPrereqs(
    pool: Template[],
    planScoreOf: (t: Template) => number
  ): Template[] {
    const inPool = new Set(pool.map((t) => t.id));
    const emitted = new Set<string>();
    const result: Template[] = [];
    const remaining = [...pool];

    while (remaining.length > 0) {
      const ready = remaining.filter((t) =>
        (t.prerequisites || []).every((p) => !inPool.has(p) || emitted.has(p))
      );
      const pickFrom = ready.length > 0 ? ready : remaining;
      pickFrom.sort((a, b) => {
        const sa = planScoreOf(a);
        const sb = planScoreOf(b);
        if (sb !== sa) return sb - sa;
        return a.id.localeCompare(b.id);
      });
      const next = pickFrom[0];
      result.push(next);
      emitted.add(next.id);
      remaining.splice(remaining.indexOf(next), 1);
    }

    return result;
  }

  static deriveFocus(dogProfile: DogProfile): string {
    const issues = dogProfile.behaviorIssues || [];
    if (issues.includes('pulling')) return 'Melhorar os passeios e foco externo';
    if (issues.includes('separation_anxiety') || issues.includes('destructive'))
      return 'Controle de ansiedade e relaxamento';
    if (dogProfile.trainingBase === 'advanced') return 'Refinamento e Truques Avançados';
    return 'Obediência básica e vínculo';
  }
}
