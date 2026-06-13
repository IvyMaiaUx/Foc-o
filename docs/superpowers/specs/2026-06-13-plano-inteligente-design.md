# Plano Inteligente — Design

**Data:** 2026-06-13
**Status:** Aprovado (aguardando revisão do spec → plano de implementação)
**Escopo:** Fase 1 de 3 (Plano → Relatório Semanal → Relatório Mensal). Este spec cobre **apenas o Plano**.

## Problema

A geração do plano de treino hoje é **quase genérica**: todo cão recebe os mesmos ~54 treinos, só levemente reordenados por 3-4 flags de comportamento. Diagnóstico (auditoria de 2026-06-13):

- O **objetivo principal** (`goals`) é coletado mas **nunca lido** por nenhum motor.
- Dois comportamentos (`lack_focus`, `agitation`) são **filtrados fora** em `Analyzing.tsx:110` antes de chegar ao motor.
- As telas **Personality** (energia/temperamento/recompensa) e **HealthCare** estão **órfãs** do fluxo de onboarding — seus dados chegam `undefined`.
- Existe um **motor de recomendação por tags completo e funcional** (`src/lib/TrainingTags.ts`) e **todos os 54 treinos têm metadata rica** (`problemTags`, `objectiveTags`, `profileTags`, `levelTag`) — mas é **100% código morto**, nunca chamado.

## Objetivo

Plano genuinamente personalizado a partir da anamnese: **cada cão recebe uma seleção e ordenação de treinos diferentes**, escolhidos por score (objetivo + problemas + perfil + nível), ativando o motor de tags que já existe.

## Decisões (travadas com o usuário)

1. **Definição:** Seleção + dose por cão — cães diferentes recebem treinos diferentes, priorizados por score. (Não é só reordenar o mesmo catálogo.)
2. **Entrada:** Religar a tela **Personality** ao fluxo para ter o perfil completo no score.
3. **Formato de saída:** **Sequência priorizada** — mantém o modelo/UI atuais (`CurrentPlan` com `tasks: TrainingTask[]` + `currentTaskIndex`).
4. **Adaptação:** **Gera agora, adapta depois.** Esta fase entrega um gerador sólido a partir da anamnese; a adaptação por check-ins/feedback é fase posterior (ligada ao relatório semanal).
5. **Arquitetura:** Abordagem A — novo motor de política orquestrando a lib de score existente.

## Arquitetura

### Componentes

- **`src/lib/TrainingTags.ts`** *(existe — vira lib pura de score; correção de bug)*
  - Funções mantidas: `generateDogTagsFromOnboarding`, `scoreTrainingForDog`, `recommendTrainingsForDog`.
  - **Bug a corrigir:** `generateDogTagsFromOnboarding` lê `trainingBase` mas **nunca emite a tag de nível** (`iniciante`/`intermediario`/`avancado`). Como `scoreTrainingForDog` casa `levelTag` contra essas tags, o bônus de nível (+2) e a penalidade de nível-acima (−5) ficam tortos (todo cão é tratado como iniciante). Passar a emitir a tag de nível a partir de `trainingBase`.
  - Pura e determinística → testável isoladamente.

- **`src/motors/IntelligentPlanMotor.ts`** *(NOVO — política/orquestração)*
  - API: `generatePlan(dogProfile: DogProfile, knownCommands: string[]): CurrentPlan`.
  - Pontua os 54 templates → aplica seleção + dose + ordenação (ver "Política") → mapeia para `TrainingTask[]` → devolve `CurrentPlan`.

- **`src/pages/onboarding/Analyzing.tsx`** *(edita)*
  - Remove o filtro de `behaviorIssues` (`:110`) que descarta `lack_focus`/`agitation`.
  - Monta o perfil completo (inclui `energyLevel`, `personalityTraits`, `rewardPreference`, `goals`, `goalNotes`).
  - Chama `IntelligentPlanMotor.generatePlan(...)` no lugar do motor antigo.

- **`src/pages/onboarding/Routine.tsx`** *(edita — 1 linha)*
  - Navegação passa a `Routine → Personality → Behavior` (a Personality já aponta para `/behavior`). Encaixe limpo, +1 etapa no onboarding.

- **Removidos:** `src/lib/adaptivePlanMotor.ts` e `src/motors/AdaptivePlanMotor.ts` (substituídos pelo novo motor; evita dois geradores divergentes). Na implementação: localizar **todos** os call sites de geração (não só `Analyzing.tsx` — ex.: regeração ao concluir o plano, DevTools) e migrá-los para `IntelligentPlanMotor` antes de remover.

### Fluxo de dados

```
Onboarding (DogData → Routine → Personality → Behavior → TrainingBase → Goals)
   └─> Analyzing.tsx monta DogProfile completo
         └─> IntelligentPlanMotor.generatePlan(profile, knownCommands)
               ├─ recommendTrainingsForDog(TRAINING_TEMPLATES, profile, { masteredIds })
               │     └─ generateDogTagsFromOnboarding + scoreTrainingForDog  (lib pura)
               ├─ seleção (corta dominados / acima-do-nível / irrelevantes; garante núcleo)
               ├─ ordenação topológica por score (respeita prerequisites)
               └─ map → TrainingTask[] (+ reason, + priority)
         └─> CurrentPlan salvo via TrainingRepository
```

## Entrada (reconciliação de campos)

A lib lê: `age`, `size`, `housingType`, `energyLevel`, `personalityTraits`, `behaviorIssues`, `goals`.
Na implementação: confirmar que esses nomes batem com o que o onboarding salva em `DogProfile`; se divergir, adicionar um **adaptador de entrada** (mapeamento) em vez de espalhar renomeações. Incluir uma checagem de que `generateDogTagsFromOnboarding` retorna tags **não-vazias** para um perfil válido (guarda contra silenciosamente cair no fallback).

## Política de geração

**Passo 1 — Pontuar:** `recommendTrainingsForDog(54 treinos, perfil, { masteredIds: knownCommands })` → `score` + `matchedTags` + `reason` por treino.

**Passo 2 — Selecionar** (origem da personalização por cão):
- Remove treinos já dominados (`knownCommands`).
- Remove por nível: cão iniciante não recebe treino `avancado` (corte por `levelTag` acima do nível do cão).
- Remove irrelevante: `score ≤ 0` que não casa com nenhum problema/objetivo/perfil **e** não é fundamento → fora.
- **Núcleo garantido:** os fundamentos (b1 "conexão/foco", b2 "obediência base") **sempre entram**, mesmo para um cão sem problemas — todo plano começa coerente.

**Passo 3 — Ordenar** (sequência priorizada, segura pedagogicamente):
- Ordenação **topológica por score**: entre os treinos cujos `prerequisites` já estão satisfeitos, escolhe sempre o de maior `score` primeiro. Um treino nunca aparece antes do seu pré-requisito.
- Efeito: objetivo + problema do cão vêm na frente, sem quebrar a progressão.

**Passo 4 — Dose:** no modelo de sequência, "dose" = ênfase (não repetição literal). Treinos `priority: 'alta'` ficam front-loaded e marcados como prioritários. *(Reforço/repetição de treino-chave mais adiante = opcional/stretch; não altera o modelo nesta fase.)*

**Tamanho do plano:** varia por cão (consequência da seleção); nunca vazio (núcleo garante mínimo), nunca infla (cortes de nível/relevância seguram o teto).

## Saída

- `CurrentPlan` no modelo atual: `tasks: TrainingTask[]`, `currentTaskIndex: 0`. **UI do Plano/Treino não muda.**
- Cada template → `TrainingTask` (título, módulo, duração, passos).
- **Inteligência visível:** anexar a cada task o `reason` gerado pelo motor ("Recomendado porque combina com *puxar a guia, passeio tranquilo*…") + `priority`. Se `TrainingTask` não tiver campo, adicionar `reason?: string` / `priority?: 'alta'|'normal'|'baixa'` (opcionais, não quebram nada existente).

## Robustez / fallback

- Anamnese pobre ou tags vazias → cai no **núcleo de fundamentos + progressão padrão** ordenada. Nunca retorna vazio, nunca lança.
- `getCurrentPlan` já reconcilia `knownCommands` na leitura (rede de segurança); como a geração já remove dominados, os dois ficam coerentes.

## Testes (lib pura, determinística)

- `generateDogTagsFromOnboarding(perfil)` → conjunto de tags esperado (inclui a tag de nível corrigida).
- `scoreTrainingForDog(treino etiquetado, tags do cão)` → score esperado, incluindo penalidades (acima-do-nível, dominado).
- 3 personas end-to-end via `generatePlan`:
  - (a) puxa-guia, iniciante, apartamento;
  - (b) ansiedade de separação;
  - (c) filhote sem problemas.
  - Verificar para cada: **exclui dominados e acima-do-nível**, **front-loada o treino do problema**, **respeita pré-requisitos**, **núcleo presente**, **plano não-vazio**.

## Fora de escopo (fases futuras)

- Adaptação do plano por check-ins / feedback de dificuldade (Fase "Semanal").
- Religar HealthCare ao fluxo (não necessário para o plano; relevante para nutrição/lembretes).
- Repetição/reforço literal de treinos-chave.
- Estrutura por fases/semanas ou trilhas por objetivo.
