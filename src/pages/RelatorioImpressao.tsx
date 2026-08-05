import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Dumbbell,
  FileText,
  Printer,
  Sparkles,
  Target,
} from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { WeeklyReportMotor, WeeklyActivity } from '@/src/motors/WeeklyReportMotor';
import { CheckinInsightsMotor, CheckinInsights } from '@/src/motors/CheckinInsightsMotor';
import { EvolutionInsightsMotor, EvolutionInsights } from '@/src/motors/EvolutionInsightsMotor';
import { CustomEventRepository } from '@/src/repositories/CustomEventRepository';
import { WeeklyReportOverride, WeeklyReportOverrideRepository } from '@/src/repositories/WeeklyReportOverrideRepository';
import { goalLabel, trainingLevelLabel, foodTypeLabel, sessionFeedbackLabel } from '@/src/lib/goalLabels';
import { behaviorTrendHeadline, BehaviorTrend } from '@/src/lib/trendGuards';

const DAY_MS = 24 * 60 * 60 * 1000;

function formatPeriod() {
  const end = new Date();
  const start = new Date(end.getTime() - 6 * DAY_MS);
  return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
}

function sessionDate(session: any) {
  return new Date(session.completedAt || session.date || Date.now()).toLocaleDateString('pt-BR');
}

function checkinTimestamp(date?: string): number {
  return date ? new Date(`${date}T00:00:00`).getTime() : 0;
}

// sessionFeedbackLabel e foodTypeLabel foram extraídos para src/lib/goalLabels.ts
// (fonte única + property tests). 'failed' nunca vira "Concluído".

// trainingLevelLabel foi extraído para src/lib/goalLabels.ts (fonte única + teste de CI).

// goalLabel foi extraído para src/lib/goalLabels.ts (fonte única + teste de CI).

export function RelatorioImpressao() {
  const navigate = useNavigate();
  const [dog, setDog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyActivity | null>(null);
  const [checkinInsights, setCheckinInsights] = useState<CheckinInsights | null>(null);
  const [evolutionInsights, setEvolutionInsights] = useState<EvolutionInsights | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [adminReport, setAdminReport] = useState<WeeklyReportOverride | null>(null);
  const [generating, setGenerating] = useState(false);
  const [behaviorTrend, setBehaviorTrend] = useState<BehaviorTrend | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const [stats, dogProfile, checkins, logs, override] = await Promise.all([
          EvolutionRepository.getSummary(user.uid),
          DogRepository.getDogProfile(user.uid),
          CheckinRepository.getRecentCheckins(user.uid, 14),
          TrainingRepository.getTrainingLogs(user.uid),
          WeeklyReportOverrideRepository.get(user.uid),
        ]);

        setDog(dogProfile);
        setAdminReport(override);
        setRecentSessions(logs.slice(0, 10));

        // Conclusão comportamental a partir dos check-ins (recente × início), com a
        // Guarda 1 (densidade) dentro. Usa os 14 check-ins, não só a semana.
        setBehaviorTrend(
          behaviorTrendHeadline(
            checkins,
            dogProfile?.name || 'seu cão',
            dogProfile?.gender === 'female' ? 'a' : 'o'
          )
        );

        const now = Date.now();
        const sevenDaysAgo = now - 7 * DAY_MS;
        const fourteenDaysAgo = now - 14 * DAY_MS;
        const recentLogs = logs.filter((log) => log.completedAt && log.completedAt >= sevenDaysAgo);
        const previousLogs = logs.filter((log) => log.completedAt && log.completedAt >= fourteenDaysAgo && log.completedAt < sevenDaysAgo);
        const weeklyCheckins = checkins.filter((checkin) => checkinTimestamp(checkin.date) >= sevenDaysAgo);
        const previousCheckins = checkins.filter((checkin) => {
          const timestamp = checkinTimestamp(checkin.date);
          return timestamp >= fourteenDaysAgo && timestamp < sevenDaysAgo;
        });

        setReport(WeeklyReportMotor.generateReport(stats, weeklyCheckins, recentLogs, previousCheckins, previousLogs));
        setEvolutionInsights(EvolutionInsightsMotor.generateInsights(stats, weeklyCheckins, recentLogs));

        const [events, ...completionResults] = await Promise.all([
          CustomEventRepository.getEvents(user.uid),
          ...weeklyCheckins.map(async (checkin) => {
            if (!checkin.date) return { date: '', data: {} };
            return {
              date: checkin.date,
              data: await CustomEventRepository.getCompletions(user.uid, checkin.date),
            };
          }),
        ]);

        const completionsHistory: Record<string, Record<string, boolean>> = {};
        completionResults.forEach(({ date, data }) => {
          if (date) completionsHistory[date] = data;
        });

        setCheckinInsights(CheckinInsightsMotor.analyze(weeklyCheckins, logs, events, completionsHistory));
      } catch (error) {
        console.error('Error loading print report data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Gera o PDF no próprio app: window.print() não funciona no iOS/PWA.
  // As libs são carregadas sob demanda (dynamic import) só ao clicar.
  const handleSavePdf = async () => {
    const el = document.querySelector('.report-sheet') as HTMLElement | null;
    if (!el || generating) return;
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }
      const safeName = (dog?.name || 'focao')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      pdf.save(`relatorio-${safeName || 'focao'}.pdf`);
    } catch (error) {
      console.error('Falha ao gerar o PDF', error);
      // Fallback: impressão nativa (funciona no desktop).
      try { window.print(); } catch {}
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#055A43]/20 border-t-[#055A43]" />
      </div>
    );
  }

  if (!dog || !report) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="mb-4 text-gray-500">Ainda não há dados suficientes para gerar o relatório.</p>
        <button onClick={() => navigate(-1)} className="font-bold text-[#055A43]">Voltar</button>
      </div>
    );
  }

  const hasEnoughData = report.totalCheckins >= 3 && report.activeDays >= 3;
  const smartReading = evolutionInsights?.smartReading;
  const hasEditorialNote = Boolean(adminReport && (adminReport.title || adminReport.summary || adminReport.recommendation));
  const recommendation = adminReport?.recommendation || smartReading?.recommendation || report.nextWeekSuggestion;
  // executiveTitle removido: a manchete virou a leitura "Ao longo do tempo" (datada).
  const executiveBody = hasEnoughData
    ? smartReading?.body || 'Os registros desta semana já permitem acompanhar a rotina e orientar os próximos exercícios com mais precisão.'
    : `Ainda faltam registros para interpretar a evolução de ${dog.name} com segurança. Com check-ins em pelo menos três dias da semana, o Focão consegue transformar a rotina em recomendações mais precisas.`;
  const objectives = [
    report.totalCheckins < 3 ? 'Registrar check-ins em pelo menos três dias da semana.' : 'Manter a frequência de check-ins para preservar a qualidade da leitura.',
    report.totalTrainings === 0 ? 'Concluir ao menos um treino guiado durante a semana.' : 'Repetir os exercícios atuais em sessões curtas e consistentes.',
    recommendation || 'Observar pequenas mudanças na rotina e registrar o que funcionou melhor.',
  ];
  const personality = Array.isArray(dog.personality) && dog.personality.length > 0 ? dog.personality.join(', ') : 'Não informado';
  const goals = (Array.isArray(dog.goals) ? dog.goals.map(goalLabel).filter(Boolean) : []).join(', ') || 'Acompanhar a evolução da rotina';
  const routineParts = [
    typeof dog.walkFrequency === 'number' ? `${dog.walkFrequency} ${dog.walkFrequency === 1 ? 'passeio' : 'passeios'} por dia` : '',
    dog.walkDurationMinutes ? `${dog.walkDurationMinutes} min por passeio` : '',
    dog.housingType === 'apartment' ? 'Apartamento' : dog.housingType === 'house' ? 'Casa' : '',
  ].filter(Boolean);
  const nutrition = dog.nutrition;
  // Índice 0-100 removido: era precisão falsa (número sem composição visível ao tutor).

  return (
    <div className="min-h-screen bg-[#F7F6F2] print:bg-white text-[#17221E] font-sans selection:bg-[#055A43]/20">
      <div className="print:hidden sticky top-0 z-50 mx-auto flex max-w-4xl items-center justify-between border-b border-[#E5E1D7] bg-white px-6 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-[#6B7A6E] transition-colors hover:text-[#055A43]">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>
        <button onClick={handleSavePdf} disabled={generating} className="flex items-center gap-2 rounded-lg bg-[#055A43] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#044C38] disabled:opacity-60 disabled:cursor-default">
          {generating ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Gerando…</>
          ) : (
            <><Printer className="h-4 w-4" /> Salvar PDF</>
          )}
        </button>
      </div>

      <article className="report-sheet mx-auto my-10 max-w-4xl rounded-xl border border-[#E5E1D7] bg-white px-8 py-10 md:px-12 md:py-14 print:my-0 print:rounded-none print:border-0 print:p-0">
        <header className="mb-10 border-b border-[#D8C3A5] pb-8">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#055A43]">Focão · acompanhamento contínuo</p>
              <h1 className="max-w-xl font-serif text-4xl font-semibold leading-[1.08] text-[#102019] md:text-[2.75rem]">Relatório semanal de {dog.name}</h1>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl font-semibold tracking-[0.16em] text-[#055A43]">FOCÃO</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8A918D]">Evolução acompanhada</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-[11px] font-medium text-[#6D7773]">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Período analisado: {formatPeriod()}</span>
            <span>Emitido em {new Date().toLocaleDateString('pt-BR')}</span>
            <span>{dog.breed || 'SRD'} · {dog.age || 'idade não informada'}{dog.weight ? ` · ${dog.weight} kg` : ''}</span>
          </div>
        </header>

        {/* AO LONGO DO TEMPO — a primeira conclusão real do app. Datada e separada da semana:
            direção + dado cru (sem %), pra o tutor conferir a leitura contra os próprios registros. */}
        <section className="mb-6 rounded-lg border border-[#D8C3A5] bg-[#F8F3EB] p-7">
          <div className="mb-4 flex items-center gap-2 text-[#7C684E]">
            <Sparkles className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ao longo do tempo</p>
          </div>
          {behaviorTrend?.kind === 'trend' ? (
            <>
              <h2 className="mt-1 max-w-2xl font-serif text-2xl font-semibold leading-tight text-[#17221E]">{behaviorTrend.headline}</h2>
              {behaviorTrend.support && (
                <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#58635F]">{behaviorTrend.support}</p>
              )}
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A918D]">{behaviorTrend.window}</p>
            </>
          ) : (
            <p className="mt-1 max-w-2xl font-serif text-xl font-semibold leading-tight text-[#17221E]">{behaviorTrend?.text || 'Ainda não há registros suficientes para uma leitura ao longo do tempo.'}</p>
          )}
        </section>

        {/* ESTA SEMANA — janela curta de 7 dias, explicitamente distinta da leitura acima. */}
        <section className="mb-8 rounded-lg border border-[#E6E4DD] px-6 py-5">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#89918D]">Esta semana</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-[#055A43]">{report.activeDays} <span className="text-base font-medium text-[#8A918D]">de 7 dias com registro</span></p>
          <p className="mt-1 text-[11px] text-[#8A918D]">{report.totalTrainings} {report.totalTrainings === 1 ? 'treino' : 'treinos'} · {report.totalCheckins} {report.totalCheckins === 1 ? 'check-in' : 'check-ins'}</p>
          {executiveBody && <p className="mt-3 max-w-3xl text-[13px] leading-5 text-[#58635F]">{executiveBody}</p>}
        </section>

        <section className="page-break-inside-avoid mb-9 rounded-lg border border-[#E6E4DD] p-6">
          <div className="mb-3 flex items-center gap-2 text-[#055A43]">
            <Activity className="h-4 w-4" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">Comparação entre semanas</h2>
          </div>
          <p className="font-serif text-xl font-semibold text-[#17221E]">{report.comparison.headline}</p>
          <p className="mt-2 text-sm leading-6 text-[#58635F]">{report.comparison.detail}</p>
          {report.comparison.hasPreviousWeekData && (
            <div className="mt-4 grid grid-cols-3 divide-x divide-[#E6E4DD] rounded-lg border border-[#E6E4DD]">
              <div className="px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#89918D]">Dias ativos</p><p className="mt-1 text-sm font-semibold text-[#055A43]">{report.comparison.currentActiveDays} <span className="font-medium text-[#8A918D]">vs. {report.comparison.previousActiveDays}</span></p></div>
              <div className="px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#89918D]">Treinos</p><p className="mt-1 text-sm font-semibold text-[#055A43]">{report.comparison.currentTrainings} <span className="font-medium text-[#8A918D]">vs. {report.comparison.previousTrainings}</span></p></div>
              <div className="px-3 py-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#89918D]">Check-ins</p><p className="mt-1 text-sm font-semibold text-[#055A43]">{report.comparison.currentCheckins} <span className="font-medium text-[#8A918D]">vs. {report.comparison.previousCheckins}</span></p></div>
            </div>
          )}
          {report.recurringPattern && (
            <div className="mt-4 border-l-2 border-[#D8C3A5] pl-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8B7357]">Padrão recorrente</p>
              <p className="mt-1 text-xs leading-5 text-[#69736F]">{report.recurringPattern}</p>
            </div>
          )}
        </section>

        <section className="page-break-inside-avoid mb-9 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-[#E6E4DD] p-5">
            <div className="mb-4 flex items-center gap-2 text-[#055A43]">
              <Activity className="h-4 w-4" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">Contexto de {dog.name}</h2>
            </div>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-4 border-b border-[#EEECE6] pb-2"><dt className="text-[#89918D]">Perfil comportamental</dt><dd className="text-right font-semibold text-[#394641]">{personality}</dd></div>
              <div className="flex justify-between gap-4 border-b border-[#EEECE6] pb-2"><dt className="text-[#89918D]">Nível de treino</dt><dd className="text-right font-semibold text-[#394641]">{trainingLevelLabel(dog.trainingBase)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#89918D]">Objetivo atual</dt><dd className="max-w-[65%] text-right font-semibold text-[#394641]">{goals}</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-[#E6E4DD] p-5">
            <div className="mb-4 flex items-center gap-2 text-[#055A43]">
              <Calendar className="h-4 w-4" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">Nutrição e rotina</h2>
            </div>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-4 border-b border-[#EEECE6] pb-2"><dt className="text-[#89918D]">Alimentação</dt><dd className="text-right font-semibold text-[#394641]">{foodTypeLabel(nutrition?.foodType) ?? 'Não cadastrada (impede calcular a porção)'}</dd></div>
              {nutrition?.foodBrand && <div className="flex justify-between gap-4 border-b border-[#EEECE6] pb-2"><dt className="text-[#89918D]">Marca / linha</dt><dd className="text-right font-semibold text-[#394641]">{nutrition.foodBrand}{nutrition.foodLine ? ` · ${nutrition.foodLine}` : ''}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-[#89918D]">Rotina cadastrada</dt><dd className="max-w-[65%] text-right font-semibold text-[#394641]">{routineParts.length > 0 ? routineParts.join(' · ') : 'Ainda não informada'}</dd></div>
            </dl>
          </div>
        </section>

        {hasEditorialNote && (
          <section className="page-break-inside-avoid mb-9 border-l-2 border-[#D8C3A5] pl-6">
            <div className="mb-2 flex items-center gap-2 text-[#8B7357]">
              <FileText className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em]">Orientação da equipe Focão</p>
            </div>
            {adminReport?.title && <h2 className="font-serif text-xl font-semibold text-[#17221E]">{adminReport.title}</h2>}
            {adminReport?.summary && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#58635F]">{adminReport.summary}</p>}
          </section>
        )}

        {hasEnoughData ? (
          <section className="mb-9 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-lg border-l-2 border-[#178A5B] bg-[#F8FBF9] p-6">
              <div className="mb-3 flex items-center gap-2 text-[#055A43]">
                <CheckCircle2 className="h-4 w-4" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">O que evoluiu</h2>
              </div>
              <p className="text-sm leading-6 text-[#58635F]">{checkinInsights?.hasEnoughData ? checkinInsights.insightText : report.mainImprovement || 'A frequência de registros já permite acompanhar a evolução com mais clareza.'}</p>
              {smartReading?.evidence?.length ? (
                <ul className="mt-4 space-y-2">
                  {smartReading.evidence.slice(0, 3).map((evidence) => (
                    <li key={evidence} className="flex gap-2 text-xs leading-5 text-[#69736F]">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#055A43]" /> {evidence}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="rounded-lg border-l-2 border-[#D97706] bg-[#FFFBF5] p-6">
              <div className="mb-3 flex items-center gap-2 text-[#9A743F]">
                <AlertTriangle className="h-4 w-4" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">Ponto de atenção</h2>
              </div>
              <p className="text-sm leading-6 text-[#58635F]">{smartReading?.attention || report.attentionPoint || 'Nenhum ponto crítico foi identificado nos registros desta semana.'}</p>
            </div>
          </section>
        ) : (
          <section className="mb-9 rounded-lg border border-[#E6E4DD] p-6">
            <div className="mb-3 flex items-center gap-2 text-[#055A43]">
              <Activity className="h-4 w-4" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">Como construir uma leitura mais precisa</h2>
            </div>
            <p className="text-sm leading-6 text-[#58635F]">O relatório amadurece junto com o histórico. Pequenos registros ao longo da semana já são suficientes para revelar padrões úteis.</p>
            <ul className="mt-4 grid gap-2 text-xs text-[#69736F] md:grid-cols-2">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#055A43]" /> 3 check-ins comportamentais</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#055A43]" /> Registros em pelo menos 3 dias</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#055A43]" /> 1 treino guiado concluído</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#055A43]" /> Observações sobre a rotina</li>
            </ul>
          </section>
        )}

        <section className="page-break-inside-avoid mb-9 border-t-2 border-[#055A43] pt-6">
          <div className="mb-3 flex items-center gap-2 text-[#055A43]">
            <Target className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Próxima semana</p>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#17221E]">Foco recomendado para {dog.name}</h2>
          <ul className="mt-4 space-y-2.5">
            {objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5 text-sm leading-5 text-[#58635F]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#055A43]" /> {objective}
              </li>
            ))}
          </ul>
        </section>

        {recentSessions.length > 0 && (
          <section className="page-break-inside-avoid mb-9 rounded-lg border border-[#E6E4DD] p-6">
            <div className="mb-4 flex items-center gap-2 text-[#055A43]">
              <Dumbbell className="h-4 w-4" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.18em]">Treinos recentes</h2>
            </div>
            <div className="space-y-3">
              {recentSessions.slice(0, 6).map((session, index) => (
                <div key={`${session.moduleTitle}-${index}`} className="flex items-start justify-between gap-4 border-b border-[#EEECE6] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-[#25312D]">{session.moduleTitle}</p>
                    <p className="mt-1 text-[11px] text-[#8A918D]">{sessionDate(session)} · {Math.max(1, Math.round((session.durationSeconds || 0) / 60))} min</p>
                  </div>
                  <span className="rounded-full bg-[#F2F5F3] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#527064]">{sessionFeedbackLabel(session.feedback)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {dog.health?.vaccines?.length > 0 && (
          <section className="page-break-inside-avoid mb-9 border-t border-[#E6E4DD] pt-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#89918D]">Lembretes de saúde cadastrados</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {dog.health.vaccines.slice(0, 4).map((vaccine: any, index: number) => (
                <p key={`${vaccine.name || vaccine.vaccineName}-${index}`} className="text-xs text-[#69736F]">
                  <strong className="text-[#33413C]">{vaccine.name || vaccine.vaccineName}</strong>
                  {(vaccine.nextDue || vaccine.nextDose) ? ` · próxima dose: ${vaccine.nextDue || vaccine.nextDose}` : ''}
                </p>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 border-t border-[#E6E4DD] pt-6 text-[10px] leading-4 text-[#8A918D]">
          <p>© {new Date().getFullYear()} Focão · acompanhamento contínuo da evolução do seu cão.</p>
          <p className="mt-1">Este resumo reflete os registros informados pelo tutor e não substitui avaliação veterinária ou comportamental presencial.</p>
        </footer>
      </article>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:my-0 { margin: 0 !important; }
          .page-break-inside-avoid { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
}
