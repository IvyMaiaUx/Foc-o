import { useEffect } from 'react';

/**
 * Rascunho do onboarding persistido em localStorage.
 *
 * Problema que resolve: os passos do onboarding passavam os dados só via
 * `navigate(state)`. Um refresh/voltar no meio do fluxo zerava `location.state`
 * e o usuário perdia TODAS as respostas anteriores.
 *
 * Estratégia: cada passo, ao receber o estado acumulado do passo anterior, grava
 * um rascunho. Se o passo for recarregado (sem `location.state`), restauramos do
 * rascunho. O rascunho é limpo ao INICIAR um fluxo novo (Intro) e ao CONCLUIR
 * (Analyzing), evitando poluir uma futura sessão.
 */
const KEY = 'focao_onboarding_draft';

export function loadOnboardingDraft(): any {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveOnboardingDraft(data: any): void {
  try {
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  } catch {
    /* localStorage indisponível (modo privado etc.) — degrada silenciosamente */
  }
}

export function clearOnboardingDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/**
 * Retorna o estado do passo: usa o `location.state` quando existe (e o persiste),
 * senão cai no rascunho salvo. Uso: `const stateData = useOnboardingState(location.state);`
 */
export function useOnboardingState(incoming: any): any {
  const hasIncoming = !!incoming && typeof incoming === 'object' && Object.keys(incoming).length > 0;
  useEffect(() => {
    if (hasIncoming) saveOnboardingDraft(incoming);
  }, [hasIncoming, incoming]);
  return hasIncoming ? incoming : loadOnboardingDraft();
}
