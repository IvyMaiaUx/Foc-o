# Plano Inteligente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar o plano de treino selecionando e ordenando os 54 treinos por score derivado da anamnese (objetivo + problemas + perfil + nível), ativando o motor de tags hoje morto.

**Architecture:** Abordagem A — `src/lib/TrainingTags.ts` vira a lib pura de score (com 1 bug corrigido); um novo `IntelligentPlanMotor` orquestra seleção/dose/ordenação e devolve `CurrentPlan` no modelo atual; `Analyzing.tsx` apenas liga os fios e a tela `Personality` volta ao fluxo.

**Tech Stack:** React 19 + TypeScript + Vite 6 + Firebase. Testes novos com Vitest (a ser instalado).

**Spec:** `docs/superpowers/specs/2026-06-13-plano-inteligente-design.md`

---

## Estrutura de arquivos

- `package.json` — adicionar Vitest + scripts de teste (modificar).
- `src/lib/TrainingTags.ts` — corrigir emissão de tag de nível + regra `agitation` (modificar).
- `src/types/index.ts` — adicionar `reason?`/`priority?` opcionais em `TrainingTask` (modificar).
- `src/motors/IntelligentPlanMotor.ts` — novo motor de política (criar).
- `src/pages/onboarding/Routine.tsx` — navegar para `/onboarding/personality` (modificar, 1 linha).
- `src/pages/onboarding/Personality.tsx` — corrigir rótulo de etapa (modificar, 1 linha).
- `src/pages/onboarding/Analyzing.tsx` — desligar filtro de comportamentos + trocar motor (modificar).
- `src/lib/adaptivePlanMotor.ts` e `src/motors/AdaptivePlanMotor.ts` — remover (deletar) após a troca.
- Testes: `src/lib/TrainingTags.test.ts`, `src/motors/IntelligentPlanMotor.test.ts` (criar).

---

## Task 1: Setup do Vitest

**Files:**
- Modify: `package.json`
- Create: `src/lib/__smoke__.test.ts`

- [ ] **Step 1: Instalar o Vitest**

Run: `npm install -D vitest`
Expected: `vitest` adicionado em devDependencies; `npm install` conclui sem erro.

- [ ] **Step 2: Adicionar scripts de teste**

Em `package.json`, dentro de `"scripts"`, adicionar duas linhas (depois de `"lint": "tsc --noEmit"`):

```json
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Criar um smoke test**

Create `src/lib/__smoke__.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS — 1 arquivo, 1 teste verde. (Vitest lê o `vite.config.ts`; o alias `@` já resolve.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/__smoke__.test.ts
git commit -m "test: configura Vitest para os testes do plano inteligente"
```

---

## Task 2: Corrigir emissão de tag de nível em TrainingTags

Hoje `generateDogTagsFromOnboarding` lê `trainingBase` mas nunca emite a tag de nível (`iniciante`/`intermediario`/`avancado`), então `scoreTrainingForDog` (que casa `levelTag` contra essas tags) nunca aplica o bônus/penalidade de nível. Também falta mapear o comportamento `agitation`.

**Files:**
- Modify: `src/lib/TrainingTags.ts`
- Test: `src/lib/TrainingTags.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `src/lib/TrainingTags.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateDogTagsFromOnboarding, scoreTrainingForDog } from './TrainingTags';
import { DogProfile } from '../types';

function baseProfile(over: Partial<DogProfile> = {}): DogProfile {
  return {
    name: 'Rex', breed: 'SRD', age: '2 anos', weight: '10kg',
    routine: [], energyLevel: 'medium', behaviorIssues: [],
    trainingBase: 'beginner', knownCommands: [], goals: [],
    createdAt: 0, updatedAt: 0,
    ...over,
  } as DogProfile;
}

describe('generateDogTagsFromOnboarding - level tag', () => {
  it('emite "iniciante" para trainingBase beginner', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'beginner' }))).toContain('iniciante');
  });
  it('emite "intermediario" para trainingBase intermediate', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'intermediate' }))).toContain('intermediario');
  });
  it('emite "avancado" para trainingBase advanced', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'advanced' }))).toContain('avancado');
  });
  it('mapeia behaviorIssue agitation para a tag de perfil agitado', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ behaviorIssues: ['agitation'] }))).toContain('agitado');
  });
});

describe('scoreTrainingForDog - nível', () => {
  const dogTags = generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'beginner' }));

  it('dá +2 a um treino iniciante para um cão iniciante', () => {
    const t = { id: 'x', tags: [], problemTags: [], objectiveTags: [], profileTags: [], levelTag: 'iniciante' };
    expect(scoreTrainingForDog(t, dogTags).score).toBe(2);
  });
  it('penaliza (-5) um treino avancado para um cão iniciante', () => {
    const t = { id: 'y', tags: [], problemTags: [], objectiveTags: [], profileTags: [], levelTag: 'avancado' };
    expect(scoreTrainingForDog(t, dogTags).score).toBe(-5);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- TrainingTags`
Expected: FAIL — os testes de `iniciante/intermediario/avancado` e `agitado` falham (tag não emitida).

- [ ] **Step 3: Implementar a correção**

Em `src/lib/TrainingTags.ts`, dentro de `generateDogTagsFromOnboarding`, logo após a linha `const base = onboardingData.trainingBase || 'beginner';` (a const `base` já existe mas não é usada), inserir a emissão da tag de nível:

```ts
  // Nível / Base
  const base = onboardingData.trainingBase || 'beginner';
  if (base === 'advanced') tags.push('avancado' as any);
  else if (base === 'intermediate') tags.push('intermediario' as any);
  else tags.push('iniciante' as any);
```

Ainda em `generateDogTagsFromOnboarding`, no bloco `// Problemas de comportamento` (o `issues.forEach`), adicionar a regra de `agitation` junto às demais (após a linha do `focus/foco`):

```ts
    if (norm.includes('focus') || norm.includes('foco')) tags.push('falta_de_foco' as any);
    if (norm.includes('agita')) tags.push('agitado');
    if (norm.includes('potty') || norm.includes('xixi')) tags.push('xixi_fora_lugar' as any);
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- TrainingTags`
Expected: PASS — todos os 6 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/TrainingTags.ts src/lib/TrainingTags.test.ts
git commit -m "fix(tags): emite tag de nivel e mapeia agitation no motor de score"
```

---

## Task 3: Adicionar reason/priority opcionais em TrainingTask

Para o app mostrar **por que** cada treino está no plano.

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Adicionar os campos opcionais**

Em `src/types/index.ts`, na interface `TrainingTask`, adicionar dois campos opcionais ao final (antes do `}`):

```ts
export interface TrainingTask {
  id: string;
  title: string;
  duration: string;
  module: string;
  moduleName: string;
  description: string;
  steps: string[];
  reason?: string;
  priority?: 'alta' | 'normal' | 'baixa';
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run build`
Expected: build conclui sem erro (campos opcionais não quebram nada existente).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): TrainingTask aceita reason e priority opcionais"
```

---

## Task 4: Criar o IntelligentPlanMotor

Orquestra: pontua → seleciona (corta dominados/acima-do-nível/irrelevantes; garante núcleo) → ordena topologicamente por score → mapeia para `TrainingTask[]`.

**Files:**
- Create: `src/motors/IntelligentPlanMotor.ts`
- Test: `src/motors/IntelligentPlanMotor.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `src/motors/IntelligentPlanMotor.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { IntelligentPlanMotor } from './IntelligentPlanMotor';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { DogProfile } from '@/src/types';

function profile(over: Partial<DogProfile> = {}): DogProfile {
  return {
    name: 'Rex', breed: 'SRD', age: '2 anos', weight: '10kg',
    routine: [], housingType: 'apartment', energyLevel: 'medium',
    personalityTraits: [], behaviorIssues: [], trainingBase: 'beginner',
    knownCommands: [], goals: [], createdAt: 0, updatedAt: 0,
    ...over,
  } as DogProfile;
}

const levelOf = (id: string) => (TRAINING_TEMPLATES as any)[id].levelTag as string;
const blockOf = (id: string) => (TRAINING_TEMPLATES as any)[id].blockId as string;

describe('IntelligentPlanMotor.generatePlan', () => {
  it('sempre retorna um plano não-vazio com índice 0', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile());
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.currentTaskIndex).toBe(0);
    expect(typeof plan.focus).toBe('string');
  });

  it('cão iniciante não recebe treino avancado', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ trainingBase: 'beginner' }));
    expect(plan.tasks.every(t => levelOf(t.id) !== 'avancado')).toBe(true);
  });

  it('exclui treinos de comandos já dominados', () => {
    // 'Senta' -> b2-t1 em knownCommandTrainings
    const plan = IntelligentPlanMotor.generatePlan(profile({ knownCommands: ['Senta'], trainingBase: 'intermediate' }));
    expect(plan.tasks.some(t => t.id === 'b2-t1')).toBe(false);
  });

  it('front-loada o treino do problema (puxa-guia => bloco b4 na primeira metade)', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ behaviorIssues: ['pulling'] }));
    const firstHalf = plan.tasks.slice(0, Math.ceil(plan.tasks.length / 2));
    expect(firstHalf.some(t => blockOf(t.id) === 'b4')).toBe(true);
    expect(plan.focus).toContain('passeio'.toLowerCase());
  });

  it('respeita pré-requisitos (nenhum treino aparece antes do seu prereq presente no plano)', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ trainingBase: 'advanced' }));
    const pos = new Map(plan.tasks.map((t, i) => [t.id, i]));
    for (const t of plan.tasks) {
      const prereqs = (TRAINING_TEMPLATES as any)[t.id].prerequisites || [];
      for (const p of prereqs) {
        if (pos.has(p)) expect(pos.get(p)!).toBeLessThan(pos.get(t.id)!);
      }
    }
  });

  it('anexa reason e priority às tasks', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ behaviorIssues: ['pulling'] }));
    expect(plan.tasks.every(t => typeof t.reason === 'string' && t.reason!.length > 0)).toBe(true);
    expect(plan.tasks.some(t => t.priority === 'alta')).toBe(true);
  });

  it('filhote sem problemas ainda recebe o núcleo (b1/b2 presentes)', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ age: '3 meses', behaviorIssues: [], trainingBase: 'beginner' }));
    const blocks = new Set(plan.tasks.map(t => blockOf(t.id)));
    expect(blocks.has('b1')).toBe(true);
    expect(blocks.has('b2')).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- IntelligentPlanMotor`
Expected: FAIL — "Cannot find module './IntelligentPlanMotor'".

- [ ] **Step 3: Implementar o motor**

Create `src/motors/IntelligentPlanMotor.ts`:

```ts
import { DogProfile, TrainingTask, CurrentPlan } from '../types';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { BLOCKS } from '@/src/lib/trainingTree';
import { sanitizeText } from '@/src/lib/textSanitizer';
import { recommendTrainingsForDog, TrainingRecommendationScore } from '@/src/lib/TrainingTags';
import { knownCommandTrainingIds } from '@/src/lib/knownCommandTrainings';

type Template = (typeof TRAINING_TEMPLATES)[keyof typeof TRAINING_TEMPLATES];

const CORE_BLOCK_IDS = ['b1', 'b2'];
const RELEVANCE_FLOOR = 1; // treino não-fundamento precisa de score >= 1 (i.e. casar algo) para entrar
const TEMPLATE_LEVEL_RANK: Record<string, number> = { iniciante: 0, intermediario: 1, avancado: 2 };

function dogLevelRank(trainingBase?: string): number {
  if (trainingBase === 'advanced') return 2;
  if (trainingBase === 'intermediate') return 1;
  return 0; // beginner / default
}

export class IntelligentPlanMotor {
  static generatePlan(dogProfile: DogProfile): CurrentPlan {
    const templates = Object.values(TRAINING_TEMPLATES) as Template[];
    const masteredIds = knownCommandTrainingIds(dogProfile.knownCommands || []);

    // 1. Pontuar (a lib deriva as tags do cão e pontua cada treino)
    const scored = recommendTrainingsForDog(templates, dogProfile, {
      completedIds: Array.from(masteredIds),
      masteredIds: Array.from(masteredIds),
    });
    const scoreById = new Map<string, TrainingRecommendationScore>();
    scored.forEach((s) => scoreById.set(s.trainingId, s));

    const dogRank = dogLevelRank(dogProfile.trainingBase);

    // 2. Selecionar
    const selected = templates.filter((t) => {
      if (masteredIds.has(t.id)) return false; // já domina
      const isCore = CORE_BLOCK_IDS.includes(t.blockId);
      const above = (TEMPLATE_LEVEL_RANK[t.levelTag] ?? 0) > dogRank;
      if (above && !isCore) return false; // acima do nível
      const score = scoreById.get(t.id)?.score ?? 0;
      if (!isCore && score < RELEVANCE_FLOOR) return false; // irrelevante
      return true;
    });

    // Núcleo garantido / fallback: nunca retornar vazio
    const pool =
      selected.length > 0
        ? selected
        : templates.filter((t) => CORE_BLOCK_IDS.includes(t.blockId) && !masteredIds.has(t.id));

    // 3. Ordenar: topológico, guloso por score, respeitando prerequisites
    const ordered = IntelligentPlanMotor.orderByScoreRespectingPrereqs(pool, scoreById);

    // 4. Mapear para TrainingTask[]
    const tasks: TrainingTask[] = ordered.map((t) => {
      const b = BLOCKS[t.blockId];
      const rec = scoreById.get(t.id);
      return {
        id: t.id,
        title: sanitizeText(t.name),
        duration: t.duration,
        module: b.id.replace('b', ''),
        moduleName: sanitizeText(b.name),
        description: sanitizeText(t.objective),
        steps: t.steps.map(sanitizeText),
        reason: rec ? sanitizeText(rec.reason) : undefined,
        priority: rec?.priority,
      };
    });

    return {
      tasks,
      currentTaskIndex: 0,
      generatedAt: Date.now(),
      focus: sanitizeText(IntelligentPlanMotor.deriveFocus(dogProfile)),
    };
  }

  // Ordenação topológica gulosa: entre os treinos cujos pré-requisitos (presentes no pool)
  // já saíram, escolhe sempre o de maior score. Desempate estável por id.
  static orderByScoreRespectingPrereqs(
    pool: Template[],
    scoreById: Map<string, TrainingRecommendationScore>
  ): Template[] {
    const inPool = new Set(pool.map((t) => t.id));
    const emitted = new Set<string>();
    const result: Template[] = [];
    const remaining = [...pool];

    while (remaining.length > 0) {
      const ready = remaining.filter((t) =>
        (t.prerequisites || []).every((p) => !inPool.has(p) || emitted.has(p))
      );
      const pickFrom = ready.length > 0 ? ready : remaining; // segurança contra ciclo/prereq externo
      pickFrom.sort((a, b) => {
        const sa = scoreById.get(a.id)?.score ?? 0;
        const sb = scoreById.get(b.id)?.score ?? 0;
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- IntelligentPlanMotor`
Expected: PASS — todos os testes verdes.

> Se "front-loada o treino do problema" falhar, NÃO afrouxe o teste: verifique se `generateDogTagsFromOnboarding` está mapeando `'pulling' -> 'puxa_na_guia'` e se os treinos do bloco `b4` têm `problemTags` com `puxa_na_guia` (eles têm). O problema mais provável é a tag de nível (Task 2) não estar emitida.

- [ ] **Step 5: Commit**

```bash
git add src/motors/IntelligentPlanMotor.ts src/motors/IntelligentPlanMotor.test.ts
git commit -m "feat(plano): IntelligentPlanMotor seleciona e ordena treinos por score"
```

---

## Task 5: Ligar no onboarding e remover o motor antigo

**Files:**
- Modify: `src/pages/onboarding/Routine.tsx:30`
- Modify: `src/pages/onboarding/Analyzing.tsx` (import :10, filtro :110, motor :169)
- Delete: `src/lib/adaptivePlanMotor.ts`, `src/motors/AdaptivePlanMotor.ts`

- [ ] **Step 1: Religar a tela Personality no fluxo**

Em `src/pages/onboarding/Routine.tsx`, no `handleNext` (linha ~30), trocar o destino:

```ts
    navigate('/onboarding/personality', {
      state: {
        ...stateData,
        routine,
        hasOutdoorArea: routine === 'house',
        walksPerDay,
        walkDuration,
        livesWithPeople: '',
        livesWithAnimals: false,
        animalRelationship: ''
      }
    });
```

(A `Personality.tsx` já faz `navigate('/onboarding/behavior', { state: { ...stateData, energyLevel, personalityTraits, rewardPreference } })`, e Behavior/TrainingBase/Goals já repassam `...stateData` — confirmado — então os campos chegam ao `Analyzing`.)

- [ ] **Step 2: Trocar import e chamada do motor + desligar o filtro de comportamentos**

Em `src/pages/onboarding/Analyzing.tsx`:

(a) Linha 10 — trocar o import:

```ts
import { IntelligentPlanMotor } from "@/src/motors/IntelligentPlanMotor";
```

(b) Linha ~110 — manter `lack_focus`/`agitation`, descartar só `none`:

```ts
          behaviorIssues: (behaviors || []).filter((behavior: string) => behavior !== 'none'),
```

(c) Linha ~169 — usar o novo motor:

```ts
        const generatedPlan = IntelligentPlanMotor.generatePlan({
          id: "profile",
          ...finalDogProfile,
        } as DogProfile);
```

- [ ] **Step 3: Remover o motor antigo (único call site já migrado)**

Run:
```bash
git rm src/lib/adaptivePlanMotor.ts src/motors/AdaptivePlanMotor.ts
```

- [ ] **Step 4: Garantir que nada mais referencia o motor antigo**

Run: `grep -rn "AdaptivePlanMotor\|adaptivePlanMotor\|generateTrainingPlan" src/`
Expected: sem resultados (zero referências remanescentes).

- [ ] **Step 5: Build + testes**

Run: `npm run build && npm test`
Expected: build sem erro; todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add src/pages/onboarding/Routine.tsx src/pages/onboarding/Analyzing.tsx
git commit -m "feat(onboarding): liga IntelligentPlanMotor, religa Personality e usa anamnese completa"
```

---

## Task 6: Corrigir rótulo de etapa da Personality

O fluxo agora tem 6 etapas (DogData, Routine, Personality, Behavior, TrainingBase, Goals). A Personality dizia "ETAPA 4 DE 7".

**Files:**
- Modify: `src/pages/onboarding/Personality.tsx:56`

- [ ] **Step 1: Ajustar o rótulo**

Em `src/pages/onboarding/Personality.tsx`, na prop `step` do `AuthLayout` (linha ~56):

```tsx
      step="ETAPA 3 DE 6"
```

(Opcional, se houver tempo: alinhar os rótulos das outras telas para "DE 6" — fora do caminho crítico; não bloquear nisto.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: sem erro.

- [ ] **Step 3: Commit**

```bash
git add src/pages/onboarding/Personality.tsx
git commit -m "chore(onboarding): rotulo de etapa da Personality (3 de 6)"
```

---

## Verificação manual final (não automatizável)

- [ ] Rodar `npm run dev`, criar uma conta nova e percorrer o onboarding: confirmar que a tela **Energia e personalidade** aparece **depois** de Rotina e **antes** de Comportamento.
- [ ] Concluir o onboarding com um cão "puxa-guia, iniciante" e abrir a tela **Plano**: confirmar que treinos de passeio (bloco 4) aparecem cedo e que nenhum treino avançado aparece.
- [ ] Repetir com um cão "avançado" e confirmar que o plano inclui treinos avançados e tem foco diferente.

---

## Self-review (cobertura do spec)

- Seleção + dose por score → Task 4 (seleção + ordenação por score). ✓
- Religar Personality → Task 5 Step 1 + Task 6. ✓
- Parar de descartar `lack_focus`/`agitation` → Task 5 Step 2(b) + Task 2 (regra `agitation`). ✓
- Objetivo (`goals`) influenciando → via `generateDogTagsFromOnboarding` (já lê `goals`) consumido no score (Task 4). ✓
- Corte por nível + bug de tag de nível → Task 2 + Task 4 (filtro `above`). ✓
- Núcleo garantido / fallback não-vazio → Task 4 (pool fallback). ✓
- Pré-requisitos respeitados → Task 4 (`orderByScoreRespectingPrereqs`). ✓
- Inteligência visível (`reason`/`priority`) → Task 3 + Task 4 (map). ✓
- Saída no modelo atual (`CurrentPlan`) → Task 4. ✓
- Remoção do gerador antigo → Task 5. ✓
- Fora de escopo (adaptação, HealthCare, mais treinos) → não há tasks; correto.
