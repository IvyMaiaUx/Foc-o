export type PresellQuizOption = {
  value: string;
  label: string;
};

export type PresellQuizStep = {
  id: 'routine' | 'challenge' | 'consistency' | 'training' | 'goal' | string;
  eyebrow: string;
  question: string;
  options: PresellQuizOption[];
};

export type PresellDiagnosis = {
  key: string;
  match: {
    field: string;
    values: string[];
  };
  title: string;
  text: string;
};

export type PresellBenefit = {
  title: string;
  text: string;
};

export type PresellConfig = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroImageUrl: string;
  benefits: PresellBenefit[];
  quizSteps: PresellQuizStep[];
  captureEyebrow: string;
  captureTitle: string;
  captureText: string;
  captureButton: string;
  resultEyebrow: string;
  resultSupportText: string;
  resultCta: string;
  registerPath: string;
  diagnoses: PresellDiagnosis[];
  fallbackDiagnosis: Omit<PresellDiagnosis, 'match'>;
};

export function getDefaultPresellConfig(): PresellConfig {
  return {
    heroEyebrow: 'Comece pelo essencial',
    heroTitle: 'Treinos guiados, evolução visível e rotina mais clara.',
    heroSubtitle: 'O Focão organiza o próximo passo do seu cão e acompanha a evolução ao longo da jornada.',
    heroCta: 'Começar agora',
    heroImageUrl: 'https://images.unsplash.com/photo-1551730459-92db2a308d6a?auto=format&fit=crop&w=1600&q=80',
    benefits: [
      { title: 'Plano em sequência', text: 'Treinos claros, organizados por etapa e sem bagunçar a evolução.' },
      { title: 'Check-ins comportamentais', text: 'Registre a rotina e ajude o Focão a entender o que está mudando.' },
      { title: 'Evolução visível', text: 'Acompanhe progresso, consistência e próximos passos.' },
    ],
    quizSteps: [
      {
        id: 'routine',
        eyebrow: 'Rotina',
        question: 'Hoje, como está a rotina do seu cão?',
        options: [
          { value: 'confusa', label: 'Meio bagunçada' },
          { value: 'regular', label: 'Existe rotina, mas falha' },
          { value: 'boa', label: 'É boa, quero evoluir' },
        ],
      },
      {
        id: 'challenge',
        eyebrow: 'Comportamento',
        question: 'O que mais atrapalha no dia a dia?',
        options: [
          { value: 'ansiedade', label: 'Ansiedade ou agitação' },
          { value: 'passeio', label: 'Passeio difícil' },
          { value: 'obediencia', label: 'Falta de obediência' },
          { value: 'xixi', label: 'Xixi ou rotina instável' },
        ],
      },
      {
        id: 'consistency',
        eyebrow: 'Consistência',
        question: 'Com que frequência você consegue treinar?',
        options: [
          { value: 'baixo', label: 'Quase nunca' },
          { value: 'medio', label: 'Algumas vezes na semana' },
          { value: 'alto', label: 'Quase todo dia' },
        ],
      },
      {
        id: 'training',
        eyebrow: 'Direção',
        question: 'O que falta para o treino funcionar melhor?',
        options: [
          { value: 'sequencia', label: 'Saber o próximo passo' },
          { value: 'registro', label: 'Acompanhar evolução' },
          { value: 'clareza', label: 'Ter treinos mais simples' },
        ],
      },
      {
        id: 'goal',
        eyebrow: 'Objetivo',
        question: 'Qual resultado você mais quer agora?',
        options: [
          { value: 'calma', label: 'Mais calma em casa' },
          { value: 'passeio', label: 'Passeios mais tranquilos' },
          { value: 'obediencia', label: 'Obediência e foco' },
          { value: 'rotina', label: 'Rotina mais previsível' },
        ],
      },
    ],
    captureEyebrow: 'Diagnóstico pronto',
    captureTitle: 'Para onde devemos enviar o diagnóstico e o plano inicial do seu cão?',
    captureText: 'Precisamos do seu e-mail para salvar seu progresso e garantir que você não perca seu plano personalizado.',
    captureButton: 'Ver meu diagnóstico',
    resultEyebrow: 'Diagnóstico inicial',
    resultSupportText: 'Em poucos minutos, seu plano inicial fica pronto. Depois você pode completar o perfil para deixar relatórios e recomendações mais precisos.',
    resultCta: 'Baixar o app e iniciar plano agora',
    registerPath: '/register?source=presell',
    diagnoses: [
      {
        key: 'passeio',
        match: { field: 'challenge', values: ['passeio'] },
        title: 'Seu cão precisa de uma sequência mais clara para o passeio.',
        text: 'O primeiro plano deve reduzir improviso, organizar comandos simples e medir se a rotina está ficando mais previsível.',
      },
      {
        key: 'calma',
        match: { field: 'challenge', values: ['ansiedade'] },
        title: 'Seu cão parece precisar de mais previsibilidade e treino curto.',
        text: 'A prioridade é criar uma rotina possível, com exercícios guiados e check-ins para entender o que melhora ou piora.',
      },
      {
        key: 'obediencia',
        match: { field: 'challenge', values: ['obediencia'] },
        title: 'Seu cão precisa de progressão, não de comandos soltos.',
        text: 'O melhor começo é seguir treinos por etapa, registrar consistência e avançar quando o comportamento estiver mais estável.',
      },
    ],
    fallbackDiagnosis: {
      key: 'rotina',
      title: 'Seu cão precisa de uma rotina mais clara para evoluir.',
      text: 'O plano inicial deve organizar o essencial: próximos treinos, check-ins comportamentais e acompanhamento visível da evolução.',
    },
  };
}
