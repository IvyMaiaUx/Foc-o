import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, CheckCircle2, Clock, Loader2, ReceiptText } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { RefundRepository, formatCurrency } from '@/src/repositories/RefundRepository';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { hapticLightTap } from '@/src/lib/haptic';
import type { BillingCharge } from '@/src/types';

function formatDate(ts?: number) {
  if (!ts) return '--/--/----';
  return new Date(ts).toLocaleDateString('pt-BR');
}

function formatDateTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const INELIGIBLE_LABEL: Record<string, string> = {
  not_paid: 'Cobrança não paga',
  already_refunded: 'Já reembolsada',
  window_expired: 'Fora do prazo de solicitação',
  has_request: 'Já tem uma solicitação',
};

function chargeLabel(charge: BillingCharge) {
  const card = charge.cardLast4 ? ` · ${charge.cardBrand || 'cartão'} ••••${charge.cardLast4}` : '';
  return `${formatDate(charge.createdAt)}${card}`;
}

export function SolicitarReembolso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [charges, setCharges] = useState<BillingCharge[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [windowDays, setWindowDays] = useState(7);

  const [selectedChargeId, setSelectedChargeId] = useState(searchParams.get('cobranca') || '');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState<{ protocol: string; amount: number; currency: string; createdAt: number } | null>(null);

  const selectedCharge = useMemo(
    () => charges.find((charge) => charge.chargeId === selectedChargeId) || null,
    [charges, selectedChargeId],
  );

  useEffect(() => {
    AnalyticsRepository.logEvent('refund_page_viewed');
    let mounted = true;

    RefundRepository.getCharges()
      .then((data) => {
        if (!mounted) return;
        setCharges(data.charges || []);
        setReasons(data.reasons || {});
        setWindowDays(data.refundWindowDays || 7);
      })
      .catch((error: Error) => {
        if (mounted) setLoadError(error.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectCharge = (chargeId: string) => {
    hapticLightTap();
    if (!selectedChargeId) AnalyticsRepository.logEvent('refund_request_started');
    setSelectedChargeId(chargeId);
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!selectedCharge || !reason || !confirmed || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await RefundRepository.createRequest({
        chargeId: selectedCharge.chargeId,
        reason,
        description: description.trim(),
      });
      setReceipt({
        protocol: result.protocol,
        amount: result.amount,
        currency: result.currency,
        createdAt: result.createdAt,
      });
    } catch (error: any) {
      setSubmitError(error?.message || 'Não conseguimos registrar sua solicitação. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleCharges = charges.filter((charge) => charge.eligible);

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

          <p className="relative z-10 text-[13px] font-medium text-white/55 mb-1.5">Assinatura e pagamentos</p>
          <h1 className="relative z-10 font-serif font-semibold text-[32px] text-white tracking-tight leading-[1.15]">
            {receipt ? 'Solicitação registrada' : 'Solicitar reembolso'}
          </h1>
        </motion.div>

        <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] flex flex-col gap-5 pt-7 px-6 pb-32">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 text-[#055A43] animate-spin" />
            </div>
          ) : receipt ? (
            /* ---------- Confirmação ---------- */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5 flex flex-col gap-5"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                <p className="font-serif text-[20px] text-[#055A43]">Recebemos sua solicitação</p>
                <p className="text-[13px] text-[#506352] leading-relaxed">
                  Ela foi registrada e entrou na fila de análise. Isso ainda <span className="font-semibold">não</span> significa
                  que o reembolso foi aprovado — avisamos por e-mail quando a análise terminar.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/10 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#055A43]/60">Protocolo</span>
                  <span className="text-[15px] font-semibold text-[#055A43] tracking-wide">{receipt.protocol}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[#6B7A6E]">Cobrança analisada</span>
                  <span className="text-[13px] font-medium text-[#3A3F3B]">
                    {selectedCharge ? chargeLabel(selectedCharge) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[#6B7A6E]">Valor</span>
                  <span className="text-[13px] font-medium text-[#3A3F3B]">
                    {formatCurrency(receipt.amount, receipt.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[#6B7A6E]">Status atual</span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> Solicitado
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[#6B7A6E]">Data do pedido</span>
                  <span className="text-[13px] font-medium text-[#3A3F3B]">{formatDateTime(receipt.createdAt)}</span>
                </div>
              </div>

              <Button onClick={() => navigate(`/reembolso/${receipt.protocol}`)} className="w-full">
                Acompanhar status
              </Button>
            </motion.div>
          ) : loadError ? (
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5 text-center">
              <AlertCircle className="w-7 h-7 text-amber-600 mx-auto mb-2" />
              <p className="text-[14px] text-[#506352] leading-relaxed">{loadError}</p>
            </div>
          ) : (
            <>
              {/* ---------- 1. Cobrança ---------- */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#055A43]/60 mb-1">Passo 1</p>
                <p className="text-[15px] font-semibold text-[#3A3F3B] mb-4">Qual cobrança você quer que a gente analise?</p>

                {charges.length === 0 ? (
                  <p className="text-[13px] text-[#6B7A6E] leading-relaxed">
                    Não encontramos cobranças nesta conta.
                  </p>
                ) : eligibleCharges.length === 0 ? (
                  <p className="text-[13px] text-[#6B7A6E] leading-relaxed">
                    Nenhuma cobrança está dentro do prazo de {windowDays} dias para pedido de reembolso. Se precisar de
                    ajuda com uma cobrança antiga, fale com o suporte.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {charges.map((charge) => (
                      <SelectCard
                        key={charge.chargeId}
                        title={formatCurrency(charge.amount, charge.currency)}
                        description={
                          charge.eligible
                            ? chargeLabel(charge)
                            : `${chargeLabel(charge)} · ${INELIGIBLE_LABEL[charge.ineligibleReason || ''] || 'Indisponível'}`
                        }
                        selected={selectedChargeId === charge.chargeId}
                        disabled={!charge.eligible}
                        onClick={() => handleSelectCharge(charge.chargeId)}
                        className={charge.eligible ? '' : 'opacity-50'}
                      />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* ---------- 2. Motivo ---------- */}
              {selectedCharge && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#055A43]/60 mb-1">Passo 2</p>
                  <p className="text-[15px] font-semibold text-[#3A3F3B] mb-4">Por que você quer o reembolso?</p>

                  <div className="flex flex-col gap-2.5">
                    {Object.entries(reasons).map(([key, label]) => (
                      <SelectCard
                        key={key}
                        title={label}
                        selected={reason === key}
                        onClick={() => { hapticLightTap(); setReason(key); }}
                      />
                    ))}
                  </div>

                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#055A43]/60 mt-5 mb-1.5 block">
                    Quer detalhar? (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
                    placeholder="Conte o que aconteceu. Isso ajuda nossa equipe a analisar mais rápido."
                    rows={4}
                    className="w-full bg-[#F7F5EF] border border-[#055A43]/10 rounded-xl p-3 text-[14px] text-[#3A3F3B] focus:outline-none focus:border-[#055A43] transition-colors resize-none"
                  />
                </motion.div>
              )}

              {/* ---------- 3. Confirmação ---------- */}
              {selectedCharge && reason && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5 flex flex-col gap-4"
                >
                  <div className="flex items-start gap-3">
                    <ReceiptText className="w-5 h-5 text-[#055A43] shrink-0 mt-0.5" />
                    <div className="text-[13px] text-[#506352] leading-relaxed">
                      Você está pedindo a análise da cobrança de{' '}
                      <span className="font-semibold text-[#3A3F3B]">
                        {formatCurrency(selectedCharge.amount, selectedCharge.currency)}
                      </span>{' '}
                      feita em <span className="font-semibold text-[#3A3F3B]">{formatDate(selectedCharge.createdAt)}</span>.
                      Isso não cancela a renovação da assinatura — são ações diferentes.
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#055A43]"
                    />
                    <span className="text-[13px] text-[#506352] leading-relaxed">
                      Confirmo que quero enviar esta solicitação e entendo que ela passa por análise manual antes de
                      qualquer estorno.
                    </span>
                  </label>

                  {submitError && <p className="text-red-500 text-[12px] font-medium">{submitError}</p>}

                  <Button
                    onClick={handleSubmit}
                    disabled={!confirmed || submitting}
                    isLoading={submitting}
                    className="w-full"
                  >
                    Enviar solicitação
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
