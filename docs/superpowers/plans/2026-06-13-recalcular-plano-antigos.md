# Recalcular Plano para Usuários Antigos (Opt-in) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que um usuário antigo complete a anamnese faltante (Personality) e recalcule seu plano com o `IntelligentPlanMotor`, preservando os treinos já concluídos, via opt-in (botão no Perfil + banner na Home).

**Architecture:** Um `PlanRegenerationService` orquestra leitura do perfil/histórico, mescla as respostas de Personality, chama o motor (com os concluídos excluídos) e salva o novo plano carimbado. A tela `Personality` ganha um "modo atualização". A elegibilidade é detectada por um marcador `engine: 'intelligent'` no plano.

**Tech Stack:** React 19 + TypeScript + Vite 6 + Firebase. Testes em Vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-recalcular-plano-antigos-design.md`

---

## Estrutura de arquivos

- `src/types/index.ts` — `CurrentPlan` ganha `engine?: 'intelligent'` (modificar).
- `src/motors/IntelligentPlanMotor.ts` — `generatePlan` aceita `completedTrainingIds` e carimba `engine` (modificar).
- `src/lib/planUpgrade.ts` — helper `isPlanUpgradeEligible` (criar).
- `src/services/PlanRegenerationService.ts` — orquestra a regeração (criar).
- `src/pages/onboarding/Personality.tsx` — modo atualização (modificar).
- `src/pages/Perfil.tsx` — botão "Recalcular meu plano" para elegíveis (modificar).
- `src/pages/Home.tsx` — banner dispensável para elegíveis (modificar).
- Testes: `src/motors/IntelligentPlanMotor.test.ts` (estender), `src/lib/planUpgrade.test.ts` (criar), `src/services/PlanRegenerationService.test.ts` (criar).

---

## Task 1: Motor aceita concluídos e carimba o plano

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/motors/IntelligentPlanMotor.ts`
- Test: `src/motors/IntelligentPlanMotor.test.ts`

- [ ] **Step 1: Adicionar o marcador `engine` ao tipo**

Em `src/types/index.ts`, na interface `CurrentPlan`, adicionar o campo opcional ao final:
```ts
export interface CurrentPlan {
  tasks: TrainingTask[];
  currentTaskIndex: number;
  generatedAt: number;
  focus: string;
  engine?: 'intelligent';
}
```

- [ ] **Step 2: Escrever os testes que falham**

Em `src/motors/IntelligentPlanMotor.test.ts`, adicionar dentro do `describe('IntelligentPlanMotor.generatePlan', ...)`:
```ts
  it('carimba o plano com engine intelligent', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile());
    expect(plan.engine).toBe('intelligent');
  });

  it('exclui os treinos concluídos passados como argumento', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ trainingBase: 'intermediate' }), ['b2-t2']);
    expect(plan.tasks.some(t => t.id === 'b2-t2')).toBe(false);
  });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- IntelligentPlanMotor`
Expected: FAIL — `engine` é undefined e `b2-t2` ainda aparece (o 2º arg é ignorado hoje).

- [ ] **Step 4: Implementar**

Em `src/motors/IntelligentPlanMotor.ts`, alterar a assinatura e o cálculo de dominados. Trocar:
```ts
  static generatePlan(dogProfile: DogProfile): CurrentPlan {
    const templates = Object.values(TRAINING_TEMPLATES) as Template[];
    const masteredIds = knownCommandTrainingIds(dogProfile.knownCommands || []);
```
por:
```ts
  static generatePlan(dogProfile: DogProfile, completedTrainingIds: string[] = []): CurrentPlan {
    const templates = Object.values(TRAINING_TEMPLATES) as Template[];
    const masteredIds = new Set<string>([
      ...knownCommandTrainingIds(dogProfile.knownCommands || []),
      ...completedTrainingIds,
    ]);
```
E no `return`, adicionar o carimbo:
```ts
    return {
      tasks,
      currentTaskIndex: 0,
      generatedAt: Date.now(),
      focus: sanitizeText(IntelligentPlanMotor.deriveFocus(dogProfile)),
      engine: 'intelligent',
    };
```
(`masteredIds` já é um `Set<string>`; o resto do método — `masteredIds.has(...)`, `Array.from(masteredIds)` — continua válido.)

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- IntelligentPlanMotor`
Expected: PASS — todos os testes do motor verdes.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/motors/IntelligentPlanMotor.ts src/motors/IntelligentPlanMotor.test.ts
git commit -m "feat(plano): motor exclui concluidos e carimba engine intelligent"
```

---

## Task 2: Helper de elegibilidade

**Files:**
- Create: `src/lib/planUpgrade.ts`
- Test: `src/lib/planUpgrade.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/planUpgrade.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isPlanUpgradeEligible } from './planUpgrade';
import { CurrentPlan, DogProfile } from '../types';

const dog = { name: 'Rex' } as DogProfile;
const basePlan = (over: Partial<CurrentPlan> = {}): CurrentPlan =>
  ({ tasks: [], currentTaskIndex: 0, generatedAt: 0, focus: 'x', ...over });

describe('isPlanUpgradeEligible', () => {
  it('elegível quando o plano não tem carimbo intelligent', () => {
    expect(isPlanUpgradeEligible(dog, basePlan())).toBe(true);
  });
  it('não elegível quando o plano já é intelligent', () => {
    expect(isPlanUpgradeEligible(dog, basePlan({ engine: 'intelligent' }))).toBe(false);
  });
  it('não elegível sem perfil ou sem plano', () => {
    expect(isPlanUpgradeEligible(null, basePlan())).toBe(false);
    expect(isPlanUpgradeEligible(dog, null)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- planUpgrade`
Expected: FAIL — "Cannot find module './planUpgrade'".

- [ ] **Step 3: Implementar**

Create `src/lib/planUpgrade.ts`:
```ts
import { CurrentPlan, DogProfile } from '../types';

/**
 * Um usuário é elegível ao recálculo inteligente quando tem perfil e plano,
 * mas o plano ainda não foi gerado pelo motor inteligente (sem o carimbo).
 */
export function isPlanUpgradeEligible(
  profile: DogProfile | null,
  plan: CurrentPlan | null
): boolean {
  if (!profile || !plan) return false;
  return plan.engine !== 'intelligent';
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- planUpgrade`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/planUpgrade.ts src/lib/planUpgrade.test.ts
git commit -m "feat(plano): helper isPlanUpgradeEligible"
```

---

## Task 3: PlanRegenerationService

**Files:**
- Create: `src/services/PlanRegenerationService.ts`
- Test: `src/services/PlanRegenerationService.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `src/services/PlanRegenerationService.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanRegenerationService } from './PlanRegenerationService';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { DogProfile, CurrentPlan } from '@/src/types';

const profile = {
  id: 'profile', name: 'Rex', breed: 'SRD', age: '2 anos', weight: '10kg',
  routine: [], energyLevel: 'medium', personalityTraits: [], behaviorIssues: ['pulling'],
  trainingBase: 'intermediate', knownCommands: [], goals: [], createdAt: 0, updatedAt: 0,
} as DogProfile;

const answers = { energyLevel: 'high', personalityTraits: ['Agitado'], rewardPreference: 'treats' };

describe('PlanRegenerationService.regenerate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(DogRepository, 'getDogProfile').mockResolvedValue(profile);
    vi.spyOn(DogRepository, 'saveDogProfile').mockResolvedValue('profile');
    vi.spyOn(TrainingRepository, 'getTrainingLogs').mockResolvedValue([{ trainingId: 'b2-t2' }]);
    vi.spyOn(TrainingRepository, 'saveCurrentPlan').mockResolvedValue(undefined);
  });

  it('salva os campos de personality no perfil', async () => {
    await PlanRegenerationService.regenerate('u1', answers);
    expect(DogRepository.saveDogProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
      energyLevel: 'high',
      personalityTraits: ['Agitado'],
      rewardPreference: 'treats',
    }));
  });

  it('exclui os treinos concluídos do novo plano', async () => {
    const plan = await PlanRegenerationService.regenerate('u1', answers);
    expect(plan.tasks.some(t => t.id === 'b2-t2')).toBe(false);
  });

  it('carimba o plano salvo como intelligent', async () => {
    const plan = await PlanRegenerationService.regenerate('u1', answers);
    expect(plan.engine).toBe('intelligent');
    const saved = (TrainingRepository.saveCurrentPlan as any).mock.calls[0][1] as CurrentPlan;
    expect(saved.engine).toBe('intelligent');
  });

  it('lança se o perfil do cão não existir', async () => {
    vi.spyOn(DogRepository, 'getDogProfile').mockResolvedValue(null);
    await expect(PlanRegenerationService.regenerate('u1', answers)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- PlanRegenerationService`
Expected: FAIL — "Cannot find module './PlanRegenerationService'".

- [ ] **Step 3: Implementar**

Create `src/services/PlanRegenerationService.ts`:
```ts
import { DogProfile, CurrentPlan } from '../types';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { IntelligentPlanMotor } from '@/src/motors/IntelligentPlanMotor';

export interface PersonalityAnswers {
  energyLevel: string;
  personalityTraits: string[];
  rewardPreference: string;
}

export class PlanRegenerationService {
  /**
   * Recalcula o plano de um usuário existente:
   * mescla as respostas de Personality no perfil, exclui os treinos já
   * concluídos e gera um novo plano inteligente. Não-destrutivo: só
   * atualiza os campos de Personality + o plano.
   */
  static async regenerate(userId: string, answers: PersonalityAnswers): Promise<CurrentPlan> {
    const profile = await DogRepository.getDogProfile(userId);
    if (!profile) {
      throw new Error('Perfil do cão não encontrado para recalcular o plano.');
    }

    const personalityUpdate = {
      energyLevel: answers.energyLevel || profile.energyLevel,
      personalityTraits: answers.personalityTraits,
      personality: answers.personalityTraits,
      rewardPreference: answers.rewardPreference,
    };

    await DogRepository.saveDogProfile(userId, personalityUpdate);

    const mergedProfile: DogProfile = { ...profile, ...personalityUpdate };

    const logs = await TrainingRepository.getTrainingLogs(userId);
    const completedIds = Array.from(
      new Set(logs.map((log: any) => log?.trainingId).filter(Boolean) as string[])
    );

    const plan = IntelligentPlanMotor.generatePlan(mergedProfile, completedIds);
    await TrainingRepository.saveCurrentPlan(userId, plan);
    return plan;
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- PlanRegenerationService`
Expected: PASS — 4 testes verdes (o motor real roda determinístico sobre o perfil mockado).

- [ ] **Step 5: Commit**

```bash
git add src/services/PlanRegenerationService.ts src/services/PlanRegenerationService.test.ts
git commit -m "feat(plano): PlanRegenerationService recalcula preservando concluidos"
```

---

## Task 4: Modo atualização na tela Personality

**Files:**
- Modify: `src/pages/onboarding/Personality.tsx`

- [ ] **Step 1: Adicionar imports**

No topo de `src/pages/onboarding/Personality.tsx`, junto aos imports existentes, adicionar:
```ts
import { auth } from '@/src/lib/firebase';
import { PlanRegenerationService } from '@/src/services/PlanRegenerationService';
```

- [ ] **Step 2: Pré-preencher em modo update**

Logo após `const dogName = stateData.dogData?.name || 'seu cão';`, adicionar:
```ts
  const isUpdateMode = stateData.mode === 'updatePlan';
  const existing = stateData.dogData || {};
```
E trocar os três `useState` para pré-preencher quando em modo update:
```ts
  const [energyLevel, setEnergyLevel] = useState(isUpdateMode ? (existing.energyLevel || '') : '');
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(
    isUpdateMode ? (existing.personalityTraits || existing.personality || []) : []
  );
  const [rewardPreference, setRewardPreference] = useState(isUpdateMode ? (existing.rewardPreference || '') : '');
```

- [ ] **Step 3: Ramificar o `handleNext` para regenerar em modo update**

Trocar o `handleNext` atual:
```ts
  const handleNext = () => {
    if (!energyLevel || personalityTraits.length === 0 || !rewardPreference) return;
    navigate('/onboarding/behavior', { 
      state: { ...stateData, energyLevel, personalityTraits, rewardPreference } 
    });
  };
```
por:
```ts
  const handleNext = async () => {
    if (!energyLevel || personalityTraits.length === 0 || !rewardPreference) return;

    if (isUpdateMode) {
      const ok = window.confirm(
        'Vamos gerar um novo plano com base no seu perfil. Seus treinos já concluídos serão mantidos.'
      );
      if (!ok) return;
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        await PlanRegenerationService.regenerate(user.uid, {
          energyLevel,
          personalityTraits,
          rewardPreference,
        });
        navigate('/plano', { state: { planRecalculated: true } });
      } catch (err) {
        window.alert('Não foi possível recalcular seu plano agora. Tente novamente em instantes.');
      }
      return;
    }

    navigate('/onboarding/behavior', {
      state: { ...stateData, energyLevel, personalityTraits, rewardPreference },
    });
  };
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: sem erro de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/pages/onboarding/Personality.tsx
git commit -m "feat(plano): modo atualizacao na tela Personality recalcula o plano"
```

---

## Task 5: Botão "Recalcular meu plano" no Perfil

**Files:**
- Modify: `src/pages/Perfil.tsx`

> Contexto: `Perfil.tsx` é uma lista de botões de navegação (`navigate('/editar-perfil')` etc.). O `DogProfile` já é carregado na página. Siga o padrão de botão existente.

- [ ] **Step 1: Carregar o plano e computar elegibilidade**

No `Perfil.tsx`, garantir que o componente tem o `dogProfile` e o `CurrentPlan` em estado. Se o plano ainda não é carregado, adicionar:
```ts
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { isPlanUpgradeEligible } from '@/src/lib/planUpgrade';
// ...dentro do componente:
const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
// dentro do useEffect que já carrega o perfil (ou um novo), adicionar:
//   const plan = await TrainingRepository.getCurrentPlan(user.uid); setCurrentPlan(plan);
const canRecalcular = isPlanUpgradeEligible(dogProfile, currentPlan);
```
(Importar `CurrentPlan` de `@/src/types` se ainda não estiver.)

- [ ] **Step 2: Adicionar o botão (apenas para elegíveis), seguindo o padrão da lista**

Adicionar, junto aos outros botões de navegação da lista (próximo ao botão de `/editar-perfil`):
```tsx
{canRecalcular && (
  <button
    onClick={() =>
      navigate('/onboarding/personality', {
        state: { mode: 'updatePlan', dogData: dogProfile },
      })
    }
    className="w-full text-left"
  >
    Recalcular meu plano
  </button>
)}
```
> Ajuste as classes/ícone para casar visualmente com os demais itens da lista do Perfil (siga o item de `/editar-perfil` como referência).

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sem erro.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Perfil.tsx
git commit -m "feat(plano): botao Recalcular meu plano no Perfil para elegiveis"
```

---

## Task 6: Banner dispensável na Home

**Files:**
- Modify: `src/pages/Home.tsx`

> Contexto: `Home.tsx` já tem um banner de WhatsApp condicional (`userProfile?.whatsappEnabled !== true`) com `motion.div`. Siga exatamente esse padrão. A Home já carrega `dogProfile` e `currentPlan` no `loadData`.

- [ ] **Step 1: Estado de dispensa + elegibilidade**

No `Home.tsx`, adicionar:
```ts
import { isPlanUpgradeEligible } from '@/src/lib/planUpgrade';
// ...
const [planBannerDismissed, setPlanBannerDismissed] = useState(
  () => localStorage.getItem('focao_plan_upgrade_dismissed') === 'true'
);
const showPlanUpgradeBanner = !planBannerDismissed && isPlanUpgradeEligible(dogProfile, currentPlan);
```

- [ ] **Step 2: Renderizar o banner (no padrão do banner de WhatsApp)**

Adicionar, perto do banner de WhatsApp existente:
```tsx
{showPlanUpgradeBanner && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-[#055A43]/20 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(5,90,67,0.05)] flex gap-4 items-start"
  >
    <div className="flex-1 flex flex-col gap-1.5">
      <h3 className="font-semibold text-sm text-[#055A43]">Deixe seu plano mais inteligente</h3>
      <p className="text-[13px] text-[#5C615D] leading-relaxed">
        Responda mais algumas perguntas e recalculamos seu plano com base no perfil do seu cão.
        Seus treinos já concluídos são mantidos.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            hapticLightTap();
            navigate('/onboarding/personality', { state: { mode: 'updatePlan', dogData: dogProfile } });
          }}
          className="bg-[#055A43] text-white text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 cursor-pointer"
        >
          Recalcular plano
        </button>
        <button
          onClick={() => {
            localStorage.setItem('focao_plan_upgrade_dismissed', 'true');
            setPlanBannerDismissed(true);
          }}
          className="text-[#5C615D] text-xs font-medium px-3 py-2"
        >
          Agora não
        </button>
      </div>
    </div>
  </motion.div>
)}
```
(`hapticLightTap` e `navigate` já existem no `Home.tsx`.)

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sem erro.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(plano): banner dispensavel de recalculo na Home para elegiveis"
```

---

## Verificação manual final (não automatizável)

> Executar em `focao-beta.web.app` **após o CORS do beta ser corrigido**, ou em produção com uma conta antiga real.

- [ ] Como usuário antigo (plano sem carimbo `engine`), abrir a Home → o banner "Deixe seu plano mais inteligente" aparece; "Agora não" some e não volta (localStorage).
- [ ] No Perfil, o botão "Recalcular meu plano" aparece; em usuário com plano já inteligente, **não** aparece.
- [ ] Tocar o botão → tela Personality em modo update (pré-preenchida) → confirmar → cai no Plano com um plano novo, sem refazer treinos já concluídos.
- [ ] Cancelar a confirmação mantém o plano antigo intacto.

---

## Self-review (cobertura do spec)

- Preserva concluídos → Task 1 (motor aceita `completedTrainingIds`) + Task 3 (service deriva dos logs). ✓
- Coleta só Personality → Task 4 (modo update reusa a tela). ✓
- Entrada: botão Perfil + banner Home → Tasks 5 e 6. ✓
- Elegibilidade via carimbo → Task 1 (carimbo) + Task 2 (helper). ✓
- Confirmação antes de trocar → Task 4 (`window.confirm`). ✓
- Não-destrutivo / erro mantém plano antigo → Task 3 (só atualiza personality+plano) + Task 4 (try/catch, só navega no sucesso). ✓
- Testes → Tasks 1-3 (TDD); UI (4-6) com verificação manual. ✓
- Fora de escopo (adaptação contínua, HealthCare, auto-recálculo) → sem tasks. ✓
