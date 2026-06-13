# Recalcular Plano para Usuários Antigos (Opt-in) — Design

**Data:** 2026-06-13
**Status:** Aprovado (aguardando revisão do spec → plano de implementação)
**Escopo:** Fase 2. Depende da Fase 1 (plano inteligente / `IntelligentPlanMotor`, já implementada e no ar).

## Problema

O `IntelligentPlanMotor` só roda no fim do onboarding. Usuários antigos já têm um `CurrentPlan` salvo (gerado pelo motor antigo) e **não** recebem o plano inteligente. Além disso, eles nunca passaram pela tela **Personality** (energia/temperamento/recompensa), porque ela estava órfã — então a anamnese deles está incompleta.

## Objetivo

Permitir que o usuário antigo, **por opção própria**, complete a anamnese faltante (Personality) e recalcule seu plano com o motor inteligente — **sem perder o progresso** e **sem surpresa** (nada automático).

## Decisões (travadas com o usuário)

1. **Progresso:** preservar os treinos já concluídos — eles entram como excluídos na geração, então o novo plano traz só o que falta (não refaz do zero).
2. **Coleta:** pedir apenas a tela **Personality** que falta, depois regenerar (não reabrir a anamnese inteira).
3. **Entrada:** botão "Recalcular meu plano" no **Perfil** (opt-in permanente para elegíveis) + um **banner suave e dispensável na Home** (descoberta), só para elegíveis.
4. **Arquitetura:** Abordagem A — reusar a tela `Personality` em "modo atualização" + um serviço de regeração isolado.

## Arquitetura

### Componentes

- **`src/services/PlanRegenerationService.ts`** (NOVO)
  - `regenerate(userId: string, personalityAnswers): Promise<CurrentPlan>`.
  - Carrega `DogProfile` (`DogRepository.getDogProfile`) + logs de treino (`TrainingRepository.getTrainingLogs`).
  - Mescla `personalityAnswers` (`energyLevel`, `personalityTraits`, `rewardPreference`) no perfil e persiste esses campos (anamnese completa).
  - Deriva os `trainingId` concluídos do histórico.
  - Chama `IntelligentPlanMotor.generatePlan(perfilMesclado, concluídos)`.
  - Salva via `TrainingRepository.saveCurrentPlan` com o plano carimbado `engine: 'intelligent'`.
  - Não-destrutivo: atualiza só os campos de Personality + o plano.

- **`src/motors/IntelligentPlanMotor.ts`** (modificação pequena)
  - `generatePlan(dogProfile, completedTrainingIds?: string[])`: une `completedTrainingIds` ao conjunto de dominados para exclusão. Hoje só exclui via `knownCommands`.
  - Carimba o plano com `engine: 'intelligent'`.

- **`src/types/index.ts`** (modificação)
  - `CurrentPlan` ganha `engine?: 'intelligent'` (marcador para distinguir plano novo do antigo).

- **Helper `isPlanUpgradeEligible(profile, plan)`** (local a definir na implementação)
  - `true` quando o usuário concluiu onboarding, tem plano e o plano **não** está carimbado `engine: 'intelligent'`.

- **`src/pages/onboarding/Personality.tsx`** (modificação)
  - "Modo atualização": quando `location.state.mode === 'updatePlan'`, pré-preenche os valores existentes e, ao concluir, dispara a confirmação + regeração em vez de navegar para `/onboarding/behavior`.

- **`src/pages/Perfil.tsx`** (modificação)
  - Botão "Recalcular meu plano" (visível para elegíveis) → `navigate('/onboarding/personality', { state: { mode: 'updatePlan', dogData: perfilAtual } })`.

- **`src/pages/Home.tsx`** (modificação)
  - Banner suave e dispensável (flag em `localStorage`), só para elegíveis, no padrão do banner de WhatsApp existente → mesma navegação.

### Fluxo

1. Usuário toca o botão (Perfil) ou o banner (Home) → vai para `/onboarding/personality` em `mode: 'updatePlan'`, com o perfil atual.
2. Personality pré-preenche (se houver) e o usuário preenche/edita energia/temperamento/recompensa.
3. Ao concluir → **confirmação**: "Vamos gerar um novo plano com base no seu perfil. Seus treinos já concluídos serão mantidos." → confirma.
4. `PlanRegenerationService.regenerate(userId, respostas)` executa (ver Componentes).
5. Navega para o **Plano** com o novo plano + toast de sucesso.
6. Em erro (rede/permissão) → mensagem clara; o plano antigo **permanece intacto** (só substitui no sucesso).

## Preservação de progresso e casos de borda

- Os `trainingId` concluídos entram como excluídos → o novo plano traz só o que falta; `currentTaskIndex: 0` aponta para o próximo treino não-feito (continua de onde parou).
- **Concluiu quase tudo:** o fallback de núcleo do motor garante plano não-vazio; se concluiu tudo o que é relevante, mostrar um estado "você já dominou seu plano atual" em vez de um plano pobre.
- **Erro/cancelamento:** substituição só no sucesso da escrita.
- **Não-destrutivo:** o resto do perfil permanece intacto.

## Testes

Serviço com repositórios mockados (determinístico):
- `regenerate` exclui os concluídos do novo plano;
- mescla as respostas de Personality no perfil;
- carimba o plano como `engine: 'intelligent'`;
- `isPlanUpgradeEligible`: `true` para plano sem carimbo, `false` para carimbado;
- modificação do motor: `generatePlan(perfil, concluídos)` exclui os ids passados.

## Fora de escopo (fases futuras)

- Adaptação contínua do plano por check-ins/feedback (fase "Semanal").
- Religar HealthCare ao fluxo.
- Recálculo automático/agendado (mantemos opt-in explícito).
- Reforço/repetição de treinos difíceis.
