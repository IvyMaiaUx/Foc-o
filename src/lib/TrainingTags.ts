import { DogProfile, TrainingTask } from '../types';

export type TrainingCategoryTag = 'foco' | 'conexao' | 'obediencia_basica' | 'autocontrole' | 'passeio' | 'socializacao' | 'ansiedade_separacao' | 'higiene_necessidades' | 'manejo' | 'enriquecimento';
export const TRAINING_PROBLEM_TAGS = [
  'puxa_na_guia', 'latidos', 'destruicao', 'mordidas', 'xixi_fora_lugar',
  'ansiedade_separacao', 'reatividade', 'medo', 'pula_em_pessoas', 'falta_de_foco',
] as const;
export type TrainingProblemTag = typeof TRAINING_PROBLEM_TAGS[number];
// Taxonomia canônica de COMPORTAMENTO (interna, usada pelo motor). 7 tags.
export type TrainingObjectiveTag = 'calma' | 'foco' | 'obediencia' | 'social' | 'rotina' | 'passeio' | 'convivencia';
export type DogProfileTag = 'filhote' | 'adulto' | 'senior' | 'pequeno_porte' | 'medio_porte' | 'grande_porte' | 'apartamento' | 'casa' | 'alta_energia' | 'media_energia' | 'baixa_energia' | 'medroso' | 'agitado' | 'calmo' | 'sociavel' | 'reativo' | 'iniciante' | 'intermediario' | 'avancado';
export type TrainingStatusTag = 'novo' | 'em_andamento' | 'dominado' | 'travado' | 'reforco';

export type TrainingTag = TrainingCategoryTag | TrainingProblemTag | TrainingObjectiveTag | DogProfileTag | TrainingStatusTag;

export interface TrainingRecommendationScore {
  trainingId: string;
  score: number;
  matchedTags: string[];
  reason: string;
  priority: 'alta' | 'normal' | 'baixa';
}

export function generateDogTagsFromOnboarding(onboardingData: DogProfile): DogProfileTag[] {
  const tags: DogProfileTag[] = [];

  // Nível / Base
  const base = onboardingData.trainingBase || 'beginner';
  if (base === 'advanced') tags.push('avancado');
  else if (base === 'intermediate') tags.push('intermediario');
  else tags.push('iniciante');

  // Idade
  const ageStr = String(onboardingData.age || '').toLowerCase();
  const ageNum = parseInt(ageStr, 10);
  if (ageStr.includes('mes') || ageStr.includes('mês') || (Number.isFinite(ageNum) && ageNum === 0)) {
    tags.push('filhote');
  } else if (Number.isFinite(ageNum)) {
    if (ageNum < 1) tags.push('filhote');
    else if (ageNum <= 7) tags.push('adulto');
    else tags.push('senior');
  } else {
    tags.push('adulto'); // default
  }

  // Porte (Tamanho)
  const size = onboardingData.size || '';
  if (size === 'small') tags.push('pequeno_porte');
  else if (size === 'medium') tags.push('medio_porte');
  else if (size === 'large' || size === 'giant') tags.push('grande_porte');

  // Moradia
  const housing = String(onboardingData.housingType || '').toLowerCase();
  if (housing.includes('apartamento') || housing.includes('apartment')) {
    tags.push('apartamento');
  } else {
    tags.push('casa');
  }

  // Energia
  const energy = onboardingData.energyLevel || 'medium';
  if (energy === 'high') tags.push('alta_energia');
  else if (energy === 'low') tags.push('baixa_energia');
  else tags.push('media_energia');

  // Personalidade
  const traits = onboardingData.personalityTraits || onboardingData.personality || [];
  traits.forEach((t: string) => {
    const norm = t.toLowerCase();
    if (norm.includes('agitado')) tags.push('agitado');
    if (norm.includes('medroso')) tags.push('medroso');
    if (norm.includes('calmo')) tags.push('calmo');
    if (norm.includes('amig') || norm.includes('socia')) tags.push('sociavel');
    if (norm.includes('reati')) tags.push('reativo');
  });

  // Problemas de comportamento
  const issues = onboardingData.behaviorIssues || [];
  issues.forEach((i: string) => {
    const norm = i.toLowerCase();
    if (norm.includes('pull') || norm.includes('puxa')) tags.push('puxa_na_guia' as any);
    if (norm.includes('bark') || norm.includes('latid')) tags.push('latidos' as any);
    if (norm.includes('destru') || norm.includes('destro')) tags.push('destruicao' as any);
    if (norm.includes('bit') || norm.includes('mord')) tags.push('mordidas' as any);
    if (norm.includes('anxiety') || norm.includes('ansied')) tags.push('ansiedade_separacao' as any);
    if (norm.includes('reacti') || norm.includes('reati')) tags.push('reatividade' as any);
    if (norm.includes('fear') || norm.includes('medo')) tags.push('medo' as any);
    if (norm.includes('jump') || norm.includes('pula')) tags.push('pula_em_pessoas' as any);
    if (norm.includes('focus') || norm.includes('foco')) tags.push('falta_de_foco' as any);
    if (norm.includes('agita')) tags.push('agitado');
    if (norm.includes('potty') || norm.includes('xixi')) tags.push('xixi_fora_lugar' as any);
  });

  // Frequência de passeio — boosted para treinos de passeio quando o cão anda pouco ou não anda
  const walksPerDay = String(onboardingData.walksPerDay || '').toLowerCase();
  if (walksPerDay === 'não passeia' || walksPerDay === '0' || walksPerDay === 'nao passeia') {
    tags.push('passeio' as any); // precisa aprender a passear
  }
  if (walksPerDay === '3+ vezes' || walksPerDay.includes('3')) {
    if (!tags.includes('alta_energia')) tags.push('alta_energia'); // cão muito ativo
  }

  // Objetivos
  const goals = onboardingData.goals || [];
  goals.forEach((g: string) => {
    const norm = g.toLowerCase();
    if (norm.includes('obedience') || norm.includes('obedi')) tags.push('obediencia' as any);
    if (norm.includes('bond') || norm.includes('vincul')) tags.push('foco' as any);
    if (norm.includes('walk') || norm.includes('passei')) tags.push('passeio' as any);
    if (norm.includes('behavior') || norm.includes('comporta')) tags.push('calma' as any);
    if (norm.includes('anxiety_alone')) {
      tags.push('ansiedade_separacao' as any);
      tags.push('calma' as any); // independencia foi fundida em calma
    } else if (norm.includes('anxiety') || norm.includes('ansied')) {
      tags.push('calma' as any);
    }
    if (norm.includes('bark') || norm.includes('latid')) tags.push('latidos' as any);
    if (norm.includes('destru') || norm.includes('destro')) tags.push('destruicao' as any);
    if (norm.includes('sociali')) tags.push('social' as any);
    if (norm.includes('trick') || norm.includes('comand')) tags.push('obediencia' as any);
    if (norm.includes('routin') || norm.includes('rotin')) tags.push('rotina' as any);
  });

  return Array.from(new Set(tags));
}

export function scoreTrainingForDog(
  training: any, // TrainingTemplate structure
  dogTags: DogProfileTag[],
  progress?: { completedIds: string[]; masteredIds: string[] }
): { score: number; matchedTags: string[] } {
  let score = 0;
  const matchedTags: string[] = [];

  const trainingTags = training.tags || [];
  const problemTags = training.problemTags || [];
  const objectiveTags = training.objectiveTags || [];
  const profileTags = training.profileTags || [];
  const levelTag = training.levelTag || 'iniciante';

  // 1. Matches de problemTags (+5)
  problemTags.forEach((pt: string) => {
    if (dogTags.includes(pt as any)) {
      score += 5;
      matchedTags.push(pt);
    }
  });

  // 2. Matches de objectiveTags (+4)
  objectiveTags.forEach((ot: string) => {
    if (dogTags.includes(ot as any)) {
      score += 4;
      matchedTags.push(ot);
    }
  });

  // 3. Matches de profileTags (+3)
  profileTags.forEach((pft: string) => {
    if (dogTags.includes(pft as any)) {
      score += 3;
      matchedTags.push(pft);
    }
  });

  // Determine dog's base level from tags
  const isDogIniciante = dogTags.includes('iniciante' as any) || (!dogTags.includes('intermediario' as any) && !dogTags.includes('avancado' as any));
  const isDogIntermediario = dogTags.includes('intermediario' as any);
  const isDogAvancado = dogTags.includes('avancado' as any);

  // 4. Matches de levelTag (+2)
  if (levelTag === 'iniciante' && isDogIniciante) {
    score += 2;
    matchedTags.push(levelTag);
  } else if (levelTag === 'intermediario' && isDogIntermediario) {
    score += 2;
    matchedTags.push(levelTag);
  } else if (levelTag === 'avancado' && isDogAvancado) {
    score += 2;
    matchedTags.push(levelTag);
  }

  // 5. Categoria/base relevante (+1)
  trainingTags.forEach((ct: string) => {
    if (dogTags.includes(ct as any)) {
      score += 1;
      matchedTags.push(ct);
    }
  });

  // Penalidade: Acima do nível recomendado (-5)
  let isAboveLevel = false;
  if (isDogIniciante && (levelTag === 'intermediario' || levelTag === 'avancado')) {
    isAboveLevel = true;
  } else if (isDogIntermediario && levelTag === 'avancado') {
    isAboveLevel = true;
  }

  if (isAboveLevel) {
    score -= 5;
  }

  // Penalidade: Já dominado / Concluído (-10)
  const isMastered = progress?.masteredIds?.includes(training.id) || progress?.completedIds?.includes(training.id);
  if (isMastered) {
    score -= 10;
  }

  return { score, matchedTags: Array.from(new Set(matchedTags)) };
}

const tagPortugueseLabels: Record<string, string> = {
  foco: 'foco',
  conexao: 'conexão com o tutor',
  obediencia_basica: 'obediência básica',
  autocontrole: 'autocontrole',
  passeio: 'passeio tranquilo',
  socializacao: 'socialização',
  social: 'socialização',
  ansiedade_separacao: 'ansiedade de separação',
  higiene_necessidades: 'higiene e necessidades',
  manejo: 'cuidados e manejo físico',
  enriquecimento: 'enriquecimento mental',
  puxa_na_guia: 'puxar a guia',
  latidos: 'latidos excessivos',
  destruicao: 'destruição de objetos',
  mordidas: 'morder brinquedos/mãos',
  xixi_fora_lugar: 'fazer xixi fora do lugar',
  reatividade: 'reatividade',
  medo: 'medo de barulhos ou pessoas',
  pula_em_pessoas: 'pular nas pessoas',
  falta_de_foco: 'falta de foco',
  filhote: 'idade de filhote',
  adulto: 'fase de adulto',
  senior: 'fase sênior',
  pequeno_porte: 'pequeno porte',
  medio_porte: 'médio porte',
  grande_porte: 'grande porte',
  apartamento: 'morar em apartamento',
  casa: 'morar em casa',
  alta_energia: 'alta energia',
  media_energia: 'média energia',
  baixa_energia: 'baixa energia',
  medroso: 'comportamento medroso',
  agitado: 'comportamento agitado',
  calmo: 'comportamento calmo',
  sociavel: 'sociabilidade',
  reativo: 'comportamento reativo',
  independencia: 'necessidade de independência',
  rotina: 'criação de rotina',
  energia_mental: 'gasto de energia mental',
  convivencia: 'convivência harmônica'
};

export function recommendTrainingsForDog(
  trainings: any[],
  onboardingData: DogProfile,
  progressData?: { completedIds: string[]; masteredIds: string[]; manualOverrides?: Record<string, any> }
): TrainingRecommendationScore[] {
  const dogTags = generateDogTagsFromOnboarding(onboardingData);
  const recommendations: TrainingRecommendationScore[] = [];

  trainings.forEach((training) => {
    const { score, matchedTags } = scoreTrainingForDog(training, dogTags, progressData);

    // Mapeamento dos termos traduzidos
    const translatedMatched = matchedTags
      .map(tag => tagPortugueseLabels[tag] || tag)
      .slice(0, 3);
    
    let reason = '';
    if (translatedMatched.length > 0) {
      reason = `Recomendado porque combina com ${translatedMatched.join(', ')} e necessidades de comportamento.`;
    } else {
      reason = `Recomendado para o desenvolvimento e evolução geral do seu cão.`;
    }

    let priority: 'alta' | 'normal' | 'baixa' = 'normal';
    if (score >= 8) priority = 'alta';
    else if (score < 3) priority = 'baixa';

    // Se houver override manual no progresso
    const override = progressData?.manualOverrides?.[training.id];
    let finalPriority = priority;
    if (override && override.priority) {
      finalPriority = override.priority;
    }

    recommendations.push({
      trainingId: training.id,
      score,
      matchedTags,
      reason,
      priority: finalPriority
    });
  });

  // Ordena por score decrescente
  return recommendations.sort((a, b) => b.score - a.score);
}
