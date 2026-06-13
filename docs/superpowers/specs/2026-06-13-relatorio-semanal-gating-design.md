# Relatório Semanal — Gating + LockedReportState — Design

**Data:** 2026-06-13
**Status:** Aprovado (seguir direto para plano + implementação + deploy)
**Escopo:** Apenas o **relatório SEMANAL**. O mensal (hoje um stub) é fase futura.

## Problema

O relatório semanal in-app é renderizado mesmo com dados insuficientes (ex.: 1 dia ativo), gerando análises distorcidas. Hoje só existe um gate brando (`maturityLevel`) baseado no total de registros. Queremos travas claras (thresholds) e, quando não atingidas, um estado bloqueado gamificado que mostra o que falta.

## Decisões (travadas com o usuário)

1. **Tema:** claro (consistente com o app: #FAFAFA, verde #055A43). **Não** dark.
2. **Escopo:** apenas o relatório semanal.
3. **Thresholds (semanal):** mínimo de **3 dias ativos distintos**, **3 check-ins comportamentais**, **2 treinos concluídos**.
4. **"Dia ativo":** qualquer dia com **pelo menos um** registro — check-in OU treino.
5. **Arquitetura:** Abordagem A — helper puro de gate + componente `LockedReportState` + decisão de render no `RelatorioSemanal`.
6. **Gating é client-side:** o relatório semanal é computado no navegador (`WeeklyReportMotor`); não há back-end gerando o relatório. A tela já busca os check-ins e treinos da semana, então o gate é calculado a partir desses dados (sem query nova). O gate de servidor que existe (envio WhatsApp, ≥3 check-ins) permanece como está.

## Arquitetura

### Componentes

- **`src/lib/weeklyReportGate.ts`** (NOVO, puro/testável)
  - `evaluateWeeklyReportGate(checkins: any[], trainingLogs: any[]): WeeklyReportGateResult`
  - Tipos:
    ```ts
    interface ReportRequirement {
      key: 'activeDays' | 'checkins' | 'trainings';
      label: string;
      current: number;
      target: number;
      met: boolean;
    }
    interface WeeklyReportGateResult {
      unlocked: boolean;
      overallPct: number; // 0-100
      requirements: ReportRequirement[];
    }
    ```
  - `checkins` = quantidade de check-ins da semana (`checkins.length`).
  - `trainings` = quantidade de treinos concluídos da semana (`trainingLogs.length`).
  - `activeDays` = nº de datas distintas com registro: união das datas dos check-ins (`checkin.date`, string `YYYY-MM-DD`) com as datas dos treinos (`toLocalDateKey(log.completedAt)`).
  - Targets: `activeDays >= 3`, `checkins >= 3`, `trainings >= 2`.
  - `overallPct = Math.round((min(activeDays/3,1) + min(checkins/3,1) + min(trainings/2,1)) / 3 * 100)`.
  - `unlocked` = os três `met`.

- **`src/components/reports/LockedReportState.tsx`** (NOVO, apresentacional, tema claro)
  - Props: `{ result: WeeklyReportGateResult; dogName: string; onCheckin: () => void; onTrain: () => void; }` (ou recebe `navigate`; decidir na implementação — manter desacoplado).
  - Cabeçalho: "Construindo a semana de {dogName}" + subtítulo curto.
  - **Donut**: progresso circular em **SVG** (sem lib externa), traço verde sobre trilha clara, `overallPct` no centro.
  - **Checklist**: 3 linhas, ícone `CheckCircle2` (verde) se `met`, `Circle` (vazio/cinza) se não; label + `current/target`.
  - **CTA inteligente**: se o requisito `trainings` não atingido → "Fazer treino de hoje" (`/treino`); senão → "Registrar check-in de hoje" (`/checkin`).
  - Entrada suave com `motion` (já usado no app). Sem dependência nova.

- **`src/pages/RelatorioSemanal.tsx`** (MODIFICAR)
  - Computa `evaluateWeeklyReportGate(checkins, trainingLogs)` a partir dos dados já buscados para a janela de 7 dias.
  - Se `!unlocked` → renderiza `<LockedReportState .../>` no lugar do relatório.
  - Se `unlocked` → renderiza o relatório como hoje.
  - Substitui o gate brando `maturityLevel`/empty-state atual para o caso de dados insuficientes.

## Casos de borda

- **Zero dados:** `overallPct = 0`, três pendentes, CTA → check-in.
- **Check-in + treino no mesmo dia:** conta como 1 dia ativo (Set de datas).
- **Já desbloqueado:** locked state não aparece; relatório normal.
- **Cap de `getTrainingLogs` (20):** irrelevante na janela de 7 dias.

## Testes

Helper puro (`weeklyReportGate.test.ts`), determinístico:
- 3 dias / 3 check-ins / 2 treinos → `unlocked: true`, todos `met`.
- Faltando 1 treino → `unlocked: false`, `trainings.met: false`.
- `overallPct` correto (ex.: 2 dias, 3 check-ins, 1 treino → 72%).
- Dia ativo: check-in e treino no mesmo dia → `activeDays = 1`; em dias diferentes → 2.
- Zero registros → `unlocked: false`, `overallPct: 0`.

`LockedReportState` (apresentacional) → verificação visual, sem teste unitário.

## Fora de escopo (fases futuras)

- Relatório **mensal** (construir o relatório real + gating 10/12/8).
- Alinhar o gate de envio do WhatsApp aos 3 requisitos (hoje só ≥3 check-ins).
- Back-end gerando/contando o relatório (continua client-side).
