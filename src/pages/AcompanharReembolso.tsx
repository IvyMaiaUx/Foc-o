import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import {
  REFUND_NEXT_STEP,
  REFUND_STATUS_LABEL,
  RefundRepository,
  formatCurrency,
} from '@/src/repositories/RefundRepository';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { hapticLightTap } from '@/src/lib/haptic';
import type { RefundEventView, RefundRequestView, RefundStatus } from '@/src/types';

const CANCELABLE: RefundStatus[] = ['requested', 'under_review', 'needs_information'];
const NEGATIVE: RefundStatus[] = ['rejected', 'failed', 'canceled'];

function formatDateTime(ts?: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDate(ts?: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('pt-BR');
}

function statusTone(status: RefundStatus) {
  if (status === 'refunded') return 'bg-emerald-100/70 text-emerald-800';
  if (NEGATIVE.includes(status)) return 'bg-red-100/70 text-red-800';
  return 'bg-amber-100/70 text-amber-800';
}

const TimelineItem: React.FC<{ event: RefundEventView; isLast: boolean; isCurrent: boolean }> = ({ event, isLast, isCurrent }) => {
  return (
    <li className="relative pl-7 pb-5 last:pb-0">
      {!isLast && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-[#055A43]/15" />}
      <span
        className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
          isCurrent ? 'bg-[#055A43] border-[#055A43]' : 'bg-white border-[#055A43]/30'
        }`}
      />
      <p className={`text-[14px] font-semibold ${isCurrent ? 'text-[#055A43]' : 'text-[#3A3F3B]'}`}>
        {REFUND_STATUS_LABEL[event.toStatus] || event.toStatus}
      </p>
      <p className="text-[12px] text-[#6B7A6E] mt-0.5">{formatDateTime(event.createdAt)}</p>
      {event.note && <p className="text-[13px] text-[#506352] leading-relaxed mt-1.5">{event.note}</p>}
    </li>
  );
};

export function AcompanharReembolso() {
  const navigate = useNavigate();
  const { protocol = '' } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<RefundRequestView | null>(null);
  const [events, setEvents] = useState<RefundEventView[]>([]);
  const [canceling, setCanceling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await RefundRepository.getRequest(protocol);
      setRequest(data.request);
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err?.message || 'Não conseguimos carregar esta solicitação.');
    } finally {
      setLoading(false);
    }
  }, [protocol]);

  useEffect(() => {
    AnalyticsRepository.logEvent('refund_status_viewed');
    load();
  }, [load]);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await RefundRepository.cancelRequest(protocol);
      await load();
      setConfirmingCancel(false);
    } catch (err: any) {
      setError(err?.message || 'Não conseguimos cancelar a solicitação.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col items-center">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-[#055A43] px-6 pt-16 pb-10"
        >
          <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-7">
            <button
              onClick={() => { hapticLightTap(); navigate('/assinatura'); }}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 active:scale-[0.98] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <p className="relative z-10 text-[13px] font-medium text-white/55 mb-1.5">Protocolo {protocol}</p>
          <h1 className="relative z-10 font-serif font-semibold text-[32px] text-white tracking-tight leading-[1.15]">
            Acompanhar reembolso
          </h1>
        </motion.div>

        <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] flex flex-col gap-5 pt-7 px-6 pb-32">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 text-[#055A43] animate-spin" />
            </div>
          ) : error || !request ? (
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5 text-center">
              <AlertCircle className="w-7 h-7 text-amber-600 mx-auto mb-2" />
              <p className="text-[14px] text-[#506352] leading-relaxed">{error || 'Solicitação não encontrada.'}</p>
              <button
                onClick={() => navigate('/assinatura')}
                className="mt-4 text-[13px] font-semibold text-[#055A43] cursor-pointer"
              >
                Voltar para assinatura
              </button>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#055A43]/60">Status atual</span>
                  <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${statusTone(request.status)}`}>
                    {REFUND_STATUS_LABEL[request.status]}
                  </span>
                </div>

                <p className="text-[13px] text-[#506352] leading-relaxed">{REFUND_NEXT_STEP[request.status]}</p>

                {request.pendingInformation && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/50 text-amber-900 text-[13px] leading-relaxed">
                    <span className="font-semibold">O que precisamos: </span>{request.pendingInformation}
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 text-red-900 text-[13px] leading-relaxed">
                    <span className="font-semibold">Motivo: </span>{request.rejectionReason}
                  </div>
                )}

                <div className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/10 p-4 flex flex-col gap-2.5">
                  {[
                    ['Protocolo', request.protocol],
                    ['Cobrança', `${formatDate(request.chargeCreatedAt)}${request.cardLast4 ? ` · ${request.cardBrand || 'cartão'} ••••${request.cardLast4}` : ''}`],
                    ['Valor', formatCurrency(request.amount, request.currency)],
                    ['Motivo informado', request.reasonLabel || '—'],
                    ['Solicitado em', formatDateTime(request.createdAt)],
                    ['Última atualização', formatDateTime(request.statusUpdatedAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-[#6B7A6E]">{label}</span>
                      <span className="text-[13px] font-medium text-[#3A3F3B] text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#055A43]/60 mb-4">
                  Linha do tempo
                </p>
                <ol className="relative">
                  {events.map((event, index) => (
                    <TimelineItem
                      key={event.id}
                      event={event}
                      isLast={index === events.length - 1}
                      isCurrent={index === events.length - 1}
                    />
                  ))}
                </ol>
              </motion.div>

              {CANCELABLE.includes(request.status) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
                >
                  {confirmingCancel ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-[13px] text-[#506352] leading-relaxed">
                        Cancelar retira sua solicitação da fila de análise. Se mudar de ideia, você pode abrir outra
                        enquanto a cobrança estiver dentro do prazo.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { hapticLightTap(); setConfirmingCancel(false); }}
                          disabled={canceling}
                          className="h-11 px-4 rounded-xl text-[13px] font-semibold text-[#6B7A6E] disabled:opacity-50 cursor-pointer"
                        >
                          Voltar
                        </button>
                        <Button onClick={handleCancel} isLoading={canceling} size="sm" className="flex-1">
                          Cancelar solicitação
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { hapticLightTap(); setConfirmingCancel(true); }}
                      className="w-full text-[13px] font-semibold text-[#6B7A6E] hover:text-[#055A43] transition-colors cursor-pointer"
                    >
                      Cancelar esta solicitação
                    </button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
