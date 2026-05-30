import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Printer, Activity, Dumbbell, Shield, Sparkles, FileText, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { WeeklyReportMotor, WeeklyActivity } from '@/src/motors/WeeklyReportMotor';
import { useAuth } from '@/src/contexts/AuthContext';
import { CheckinInsightsMotor, CheckinInsights } from '@/src/motors/CheckinInsightsMotor';
import { EvolutionInsightsMotor, EvolutionInsights } from '@/src/motors/EvolutionInsightsMotor';
import { CustomEventRepository } from '@/src/repositories/CustomEventRepository';

export function RelatorioImpressao() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [dog, setDog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyActivity | null>(null);
  const [checkinInsights, setCheckinInsights] = useState<CheckinInsights | null>(null);
  const [evolutionInsights, setEvolutionInsights] = useState<EvolutionInsights | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const stats = await EvolutionRepository.getSummary(user.uid);
          const dogProfile = await DogRepository.getDogProfile(user.uid);
          setDog(dogProfile);

          // Get last 7 days data for weekly calculations
          const checkins = await CheckinRepository.getRecentCheckins(user.uid, 14);
          setRecentCheckins(checkins);
          
          const logs = await TrainingRepository.getTrainingLogs(user.uid);
          setRecentSessions(logs.slice(0, 10));

          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentLogs = logs.filter(log => log.completedAt && log.completedAt >= sevenDaysAgo);

          const generatedReport = WeeklyReportMotor.generateReport(stats, checkins.slice(0, 7), recentLogs);
          setReport(generatedReport);
          setEvolutionInsights(EvolutionInsightsMotor.generateInsights(stats, checkins.slice(0, 7), recentLogs));

          // Fetch custom events for routine patterns
          const [events, ...compsResults] = await Promise.all([
            CustomEventRepository.getEvents(user.uid),
            ...checkins.slice(0, 7).map(async (c) => {
              if (!c.date) return { date: '', data: {} };
              const comps = await CustomEventRepository.getCompletions(user.uid, c.date);
              return { date: c.date, data: comps };
            })
          ]);

          const completionsHistory: Record<string, Record<string, boolean>> = {};
          compsResults.forEach(r => {
            if (r.date) {
              completionsHistory[r.date] = r.data;
            }
          });

          const insights = CheckinInsightsMotor.analyze(checkins.slice(0, 7), logs, events, completionsHistory);
          setCheckinInsights(insights);
        }
      } catch (err) {
        console.error("Error loading print report data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#055A43]/20 border-t-[#055A43] rounded-full animate-spin" />
      </div>
    );
  }

  if (!dog || !report) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-4">Dados insuficientes para gerar o relatório.</p>
        <button onClick={() => navigate(-1)} className="text-[#055A43] font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white text-gray-800 font-sans selection:bg-[#055A43]/20">
      
      {/* Printable Actions Bar */}
      <div className="print:hidden max-w-4xl mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-[#5C615D] hover:text-[#055A43] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Pronto para impressão / PDF</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#055A43] hover:bg-[#044c38] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Main A4 Document */}
      <div className="max-w-4xl mx-auto my-6 print:my-0 p-8 print:p-0 bg-white border print:border-0 border-gray-200 rounded-2xl print:rounded-none shadow-sm print:shadow-none min-h-[297mm] flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="border-b-2 border-[#055A43] pb-6 mb-6 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black tracking-[0.25em] text-[#055A43] uppercase block mb-1">
                FOCÃO — ADESBRAMENTO E BEM-ESTAR ANIMAL
              </span>
              <h1 className="font-serif text-3xl text-gray-900 font-bold leading-tight tracking-tight">
                Relatório de Acompanhamento Comportamental
              </h1>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Gerado em: {new Date().toLocaleDateString('pt-BR')} · Documento de Autoridade Técnica
              </p>
            </div>
            <div className="text-right">
              <span className="font-serif text-2xl font-black tracking-widest text-[#055A43]">FOCÃO</span>
              <div className="text-[9px] text-gray-400 font-semibold tracking-wider mt-0.5">PLATAFORMA PREMIUM</div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#055A43]/[0.02] border border-[#055A43]/10 p-5 rounded-2xl">
              <h2 className="text-xs font-black tracking-wider text-[#055A43] uppercase mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Dados do Cão
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-500">Nome:</span>
                  <span className="font-bold text-gray-900">{dog.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-500">Raça:</span>
                  <span className="font-medium">{dog.breed || 'SRD'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-500">Idade / Peso:</span>
                  <span className="font-medium">{dog.age || '—'} · {dog.weight ? `${dog.weight} kg` : '—'}</span>
                </div>
                {dog.personality && dog.personality.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Perfil e Temperamento:</span>
                    <div className="flex flex-wrap gap-1">
                      {dog.personality.map((p: string) => (
                        <span key={p} className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-0.5 rounded-full font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#055A43]/[0.02] border border-[#055A43]/10 p-5 rounded-2xl">
              <h2 className="text-xs font-black tracking-wider text-[#055A43] uppercase mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Nutrição e Rotina
              </h2>
              <div className="space-y-2 text-sm">
                {dog.nutrition ? (
                  <>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                      <span className="text-gray-500">Alimentação:</span>
                      <span className="font-bold text-gray-900">
                        {dog.nutrition.foodType === 'dry' ? 'Ração Seca' :
                         dog.nutrition.foodType === 'wet' ? 'Alimento Úmido' :
                         dog.nutrition.foodType === 'natural' ? 'Alimentação Natural' : 'Mista'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                      <span className="text-gray-500">Marca / Linha:</span>
                      <span className="font-medium truncate max-w-[180px]">{dog.nutrition.foodBrand || '—'} {dog.nutrition.foodLine ? `(${dog.nutrition.foodLine})` : ''}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                      <span className="text-gray-500">Frequência:</span>
                      <span className="font-medium">{dog.nutrition.mealsPerDay ? `${dog.nutrition.mealsPerDay} refeições/dia` : '—'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 py-4">Informações nutricionais não cadastradas.</p>
                )}
                <div className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-500">Rotina diária:</span>
                  <span className="font-medium">{dog.walkFrequency ? `${dog.walkFrequency} passeio(s)/dia` : 'Passeios ocasionais'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Evolution Summary & Vaccines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 p-4 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Streak Consistente</span>
              <div className="text-2xl font-serif text-[#055A43] font-bold mt-1">{report.streak} dias</div>
            </div>
            <div className="border border-gray-200 p-4 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dias Ativos (Semana)</span>
              <div className="text-2xl font-serif text-[#055A43] font-bold mt-1">{report.activeDays} de 7</div>
            </div>
            <div className="border border-gray-200 p-4 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Treinos Realizados</span>
              <div className="text-2xl font-serif text-[#055A43] font-bold mt-1">{report.totalTrainings} concluídos</div>
            </div>
          </div>

          {/* Smart insights */}
          {evolutionInsights?.smartReading && (
            <div className="border border-[#055A43]/15 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#055A43]" />
                <span className="text-[10px] font-black tracking-wider text-[#055A43] uppercase">Análise do Desenvolvimento do Cão</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">{evolutionInsights.smartReading.headline}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{evolutionInsights.smartReading.body}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {evolutionInsights.smartReading.evidence.map((ev, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs text-gray-700 font-medium">
                    • {ev}
                  </div>
                ))}
              </div>

              <div className="bg-[#055A43]/[0.03] border-l-4 border-[#055A43] p-4 rounded-r-xl">
                <p className="text-xs font-semibold text-[#055A43] leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-[9px] mr-2">Recomendação:</span>
                  {evolutionInsights.smartReading.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Behavior and attention points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-200 p-5 rounded-2xl">
              <h3 className="text-xs font-black tracking-wider text-gray-900 uppercase mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Padrões de Rotina & Pontos Positivos
              </h3>
              {checkinInsights?.hasEnoughData ? (
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{checkinInsights.insightText}</p>
              ) : (
                <p className="text-sm text-gray-400">Dados de comportamento insuficientes nesta semana.</p>
              )}
              {report.mainImprovement && (
                <div className="mt-3 bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-800 font-medium">
                  <strong>Destaque da semana:</strong> {report.mainImprovement}
                </div>
              )}
            </div>

            <div className="border border-gray-200 p-5 rounded-2xl">
              <h3 className="text-xs font-black tracking-wider text-gray-900 uppercase mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Pontos de Atenção & Alinhamento
              </h3>
              {report.attentionPoint ? (
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{report.attentionPoint}</p>
              ) : (
                <p className="text-sm text-gray-500">Nenhum desvio crítico de comportamento registrado.</p>
              )}
              {report.nextWeekSuggestion && (
                <div className="mt-3 bg-amber-50/50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800 font-medium">
                  <strong>Sugestão técnica:</strong> {report.nextWeekSuggestion}
                </div>
              )}
            </div>
          </div>

          {/* Vaccines detailed list */}
          {dog.health?.vaccines && dog.health.vaccines.length > 0 && (
            <div className="border border-gray-200 p-5 rounded-2xl mb-6">
              <h3 className="text-xs font-black tracking-wider text-gray-900 uppercase mb-3">Histórico de Imunização (Vacinas)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dog.health.vaccines.map((v: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                    <div>
                      <span className="font-bold text-gray-900">{v.name || v.vaccineName}</span>
                      <span className="text-gray-400 block">Dose recente: {v.date || v.lastDoseDate || '—'}</span>
                    </div>
                    {v.nextDue && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-0.5 rounded-full font-semibold">
                        Próxima: {v.nextDue || v.nextDose}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Activity Logs Section */}
          <div className="page-break-before-always border border-gray-200 p-5 rounded-2xl">
            <h3 className="text-xs font-black tracking-wider text-gray-900 uppercase mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-indigo-500" /> Registro Recente de Treinamentos
            </h3>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-gray-100 pb-2.5 last:border-none">
                    <div>
                      <span className="font-bold text-gray-800 block text-sm">{session.moduleTitle}</span>
                      <span className="text-gray-400">
                        Realizado em: {new Date(session.completedAt || session.date || Date.now()).toLocaleDateString('pt-BR')} · Duração: {Math.round(session.durationSeconds / 60)} min
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider ${
                      session.feedback === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      session.feedback === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      session.feedback === 'hard' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {session.feedback === 'easy' ? 'Fácil' :
                       session.feedback === 'medium' ? 'Médio' :
                       session.feedback === 'hard' ? 'Difícil' : 'Incompleto'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">Nenhum treino registrado recentemente.</p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 mt-8 text-center text-[10px] text-gray-400">
          <p>© {new Date().getFullYear()} Focão App · Relatório gerado digitalmente. Indicado para suporte clínico e de conduta.</p>
          <p className="mt-1">A precisão deste relatório reflete os dados imputados pelo tutor de forma fidedigna na plataforma.</p>
        </div>
      </div>
      
      {/* CSS print overrides */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:my-0 {
            margin: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .page-break-before-always {
            page-break-before: always !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
}
