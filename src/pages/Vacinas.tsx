import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Syringe, Calendar, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { VaccineRepository, VaccineData } from '@/src/repositories/VaccineRepository';
import { NotificationRepository } from '@/src/repositories/NotificationRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumGate } from '@/src/components/ui/PremiumGate';
import { parseLocalDateKey } from '@/src/lib/dateKeys';

export function Vacinas() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  
  const [vaccines, setVaccines] = useState<VaccineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    dateApplied: '',
    nextDose: '',
    notes: ''
  });

  useEffect(() => {
    if (isPremium) {
      loadVaccines();
    } else {
      setLoading(false);
    }
  }, [isPremium]);

  if (!isPremium) return <PremiumGate featureName="Controle de Vacinas" />;

  const loadVaccines = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const data = await VaccineRepository.getVaccines(user.uid);
      setVaccines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setIsSaving(true);
    try {
      await VaccineRepository.saveVaccine(user.uid, formData);
      
      if (formData.nextDose) {
        const dog = await DogRepository.getDogProfile(user.uid);
        const dogName = dog?.name || 'Seu cão';
        await NotificationRepository.scheduleVaccineReminders(user.uid, dogName, formData.name, formData.nextDose);
      }
      
      setShowAddForm(false);
      setFormData({ name: '', dateApplied: '', nextDose: '', notes: '' });
      await loadVaccines();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Upcoming vaccines (next 6 months)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // comparar por DIA local (dose de hoje conta como próxima)
  const upcoming = vaccines.filter(v => v.nextDose && parseLocalDateKey(v.nextDose) >= today).sort((a,b) => parseLocalDateKey(a.nextDose!).getTime() - parseLocalDateKey(b.nextDose!).getTime());
  const history = vaccines.filter(v => !upcoming.some(u => u.id === v.id)).sort((a, b) => parseLocalDateKey(b.dateApplied).getTime() - parseLocalDateKey(a.dateApplied).getTime());
  const hasUrgentDose = upcoming.length > 0 && parseLocalDateKey(upcoming[0].nextDose!).getTime() - today.getTime() < 30*24*60*60*1000;

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col relative">
      {/* Green header zone — full-bleed hero: title + status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-[#055A43] px-6 pt-16 pb-9"
      >
        {/* Decorative ghost circles */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute right-10 bottom-4 w-24 h-24 rounded-full bg-white/[0.04] pointer-events-none" />

        <header className="relative z-10 flex items-center gap-4 mb-7">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all active:scale-[0.98]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-1">
              Módulo de Saúde
            </p>
            <h1 className="font-serif font-semibold text-[28px] text-white tracking-tight leading-none">
              Vacinas
            </h1>
          </div>
        </header>

        {/* Status hero card, nested inside the green zone */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`relative z-10 rounded-[20px] p-5 border border-white/10 overflow-hidden ${hasUrgentDose ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-black/15'}`}
          >
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="pt-1">
                <h2 className="font-serif text-[20px] text-white tracking-tight leading-tight mb-1">
                  {hasUrgentDose ? 'Atenção às Doses' : 'Proteção em dia'}
                </h2>
                <p className="text-white/70 font-light text-[13px] leading-relaxed">
                  {hasUrgentDose ? 'Há vacinas que vencem este mês.' : 'Não há doses críticas pendentes.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* White drawer — resto do conteúdo, sobrepõe a zona verde */}
      <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] flex-1 px-6 pt-7 pb-32 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-10"><div className="w-8 h-8 rounded-full border-2 border-[#055A43]/30 border-t-[#055A43] animate-spin" /></div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {upcoming.length > 0 && (
              <>
                <h3 className="font-medium text-[#055A43] text-sm tracking-widest uppercase mb-4 px-2">Próximas doses</h3>
                {upcoming.map(item => {
                  const monthsDiff = Math.max(0, Math.round((parseLocalDateKey(item.nextDose!).getTime() - today.getTime()) / (1000*60*60*24*30)));
                  return (
                    <div key={item.id} className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] mb-4 flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                         <Calendar className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-[#506352] text-[15px]">{item.name}</p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase mt-1">
                          Em {monthsDiff} meses ({parseLocalDateKey(item.nextDose!).toLocaleDateString()})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <h3 className="font-medium text-[#055A43] text-sm tracking-widest uppercase mb-4 px-2 mt-8">Histórico</h3>
                        {/* History */}
            <div className="flex flex-col gap-3">
               {history.length === 0 ? (
                 <p className="text-[#6B7A6E] text-sm px-2">Registre a primeira dose para começar o histórico do seu cão.</p>
               ) : history.map(item => (
                 <div key={item.id} className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col gap-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center">
                          <Syringe className="w-4 h-4 text-[#055A43]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#506352] text-sm mb-0.5">{item.name}</p>
                          <p className="text-[11px] text-[#6B7A6E] font-light">Aplicada em {new Date(item.dateApplied).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#055A43]/50" />
                    </div>
                    {item.notes && (
                      <div className="ml-14 bg-[#F7F5EF] rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-[#6B7A6E] italic">{item.notes}</p>
                      </div>
                    )}
                 </div>
               ))}
            </div>

          </motion.div>
        )}
      </main>
      
      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 bg-gradient-to-t from-[#F7F5EF] via-[#F7F5EF] to-transparent z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-[#C2703E] text-white h-14 rounded-2xl font-semibold text-base shadow-[0_8px_30px_rgba(45,74,58,0.08)] active:scale-[0.98] transition-transform"
        >
          Registrar nova dose
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <header className="px-6 pt-16 flex items-center justify-between">
              <button 
                onClick={() => setShowAddForm(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#6B7A6E]"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="font-serif text-[20px] text-[#055A43]">Nova vacina</h1>
              <div className="w-10" />
            </header>
            
            <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
               <div className="flex flex-col gap-2 w-full">
                  <label className="block text-[#6B7A6E] text-xs font-bold uppercase tracking-widest mb-1 ml-1">Nome da vacina</label>
                  <button
                    type="button"
                    onClick={() => setIsVaccineModalOpen(true)}
                    className="w-full text-left text-[15px] font-normal h-14 bg-[#F7F5EF] border border-gray-100 rounded-2xl p-4 text-[#055A43] focus:outline-none focus:border-[#055A43]/30 transition-all relative flex items-center"
                  >
                    {formData.name || <span className="text-[#A0A4A1]">Selecione a vacina</span>}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
               </div>
               <div>
                  <label className="block text-[#6B7A6E] text-xs font-bold uppercase tracking-widest mb-2 ml-1">Data de aplicação</label>
                  <input type="date" value={formData.dateApplied} onChange={e => setFormData(f => ({ ...f, dateApplied: e.target.value }))} className="w-full bg-[#F7F5EF] border border-gray-100 rounded-2xl p-4 text-[15px] focus:outline-none focus:border-[#055A43]/30" />
               </div>
               <div>
                  <label className="block text-[#6B7A6E] text-xs font-bold uppercase tracking-widest mb-2 ml-1">Próxima Dose (opcional)</label>
                  <input type="date" value={formData.nextDose} onChange={e => setFormData(f => ({ ...f, nextDose: e.target.value }))} className="w-full bg-[#F7F5EF] border border-gray-100 rounded-2xl p-4 text-[15px] focus:outline-none focus:border-[#055A43]/30" />
               </div>
               <div>
                  <label className="block text-[#6B7A6E] text-xs font-bold uppercase tracking-widest mb-2 ml-1">Anotações / Lote (opcional)</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} 
                    className="w-full bg-[#F7F5EF] border border-gray-100 rounded-2xl p-4 text-[15px] focus:outline-none focus:border-[#055A43]/30 min-h-[100px] resize-none"
                    placeholder="Ex: Fabricante, reações..."
                  />
               </div>

               <button
                  disabled={!formData.name || !formData.dateApplied || isSaving}
                  onClick={handleSave}
                  className="w-full mt-auto bg-[#055A43] text-white h-14 rounded-2xl font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center disabled:opacity-50 mb-8 pb-safe"
                >
                  {isSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar registro'}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheetSelect 
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        options={['V8 (Polivalente)', 'V10 (Polivalente)', 'V11 / V12', 'Antirrábica', 'Giárdia', 'Gripe Canina / Tosse dos Canis', 'Leishmaniose', 'Lyme (Borreliose)', 'Coronavirose', 'Outra']}
        value={formData.name}
        onSelect={(val) => setFormData(prev => ({ ...prev, name: val }))}
        title="Selecione a vacina"
        placeholder="Buscar vacina..."
      />
    </div>
  );
}
