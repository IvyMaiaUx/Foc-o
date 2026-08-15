import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, CheckCircle2, Sparkles, TrendingUp, User, Play, MessageCircle, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReminders } from '@/src/hooks/useReminders';
import { useAuth } from '@/src/contexts/AuthContext';
import { SupportRepository } from '@/src/repositories/SupportRepository';
import { haptics } from '@/src/lib/haptics';
import { isBetaEnvironment } from '@/src/lib/beta';

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBeta = isBetaEnvironment();
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  useReminders();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = SupportRepository.subscribeToThread(user.uid, (thread) => setHasUnreadSupport(Boolean(thread?.unreadUser)));
    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { path: '/inicio', icon: Home, label: 'Hoje', description: 'Seu próximo passo' },
    isBeta
      ? { path: '/beta', icon: Sparkles, label: 'Beta', description: 'Dê seu feedback' }
      : { path: '/plano', icon: ClipboardList, label: 'Plano', description: 'Jornada do seu cão' },
    { path: '/checkin', icon: CheckCircle2, label: 'Check-in', description: 'Registrar o dia' },
    { path: '/evolucao', icon: TrendingUp, label: 'Evolução', description: 'Ver progresso' },
    { path: '/perfil', icon: User, label: 'Perfil', description: 'Você e seu cão', hasBadge: hasUnreadSupport },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans text-[#2E3830]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[284px] flex-col border-r border-[#E4E1D6] bg-[#FFFEFB] px-5 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#055A43] font-serif text-xl font-bold text-white shadow-[0_8px_18px_rgba(5,90,67,0.2)]">F</div>
          <div>
            <p className="font-serif text-xl font-bold leading-none text-[#055A43]">Focão</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9589]">Rotina com clareza</p>
          </div>
        </div>

        <button onClick={() => { haptics.light(); navigate('/treino'); }} className="group mt-9 rounded-3xl bg-[#055A43] p-4 text-left text-white shadow-[0_10px_26px_rgba(5,90,67,0.18)] transition hover:-translate-y-0.5 hover:bg-[#064e3a] active:scale-[0.99]">
          <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Ação principal</span><Play className="h-4 w-4 fill-current text-[#E8D7A8]" /></div>
          <p className="mt-3 font-serif text-xl font-semibold leading-tight">Abrir treino de hoje</p>
          <span className="mt-4 flex items-center gap-1 text-xs font-bold text-white/70">Continuar jornada <ChevronRight className="h-3.5 w-3.5" /></span>
        </button>

        <nav className="mt-8 space-y-1.5" aria-label="Navegação principal">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return <NavLink key={item.path} to={item.path} onClick={haptics.light} className={cn('group flex items-center gap-3 rounded-2xl px-3 py-3 transition', active ? 'bg-[#EAF0E8] text-[#055A43]' : 'text-[#6B7A6E] hover:bg-[#F7F5EF] hover:text-[#055A43]')}>
              <span className={cn('relative grid h-9 w-9 place-items-center rounded-xl transition', active ? 'bg-white shadow-sm' : 'bg-transparent group-hover:bg-white')}><Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.8} />{item.hasBadge && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[#FFFEFB] bg-[#C2703E]" />}</span>
              <span className="min-w-0"><span className="block text-sm font-bold leading-tight">{item.label}</span><span className="mt-0.5 block text-xs text-[#8A9589]">{item.description}</span></span>
            </NavLink>;
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-[#E4E1D6] bg-[#F7F5EF] p-4">
          <div className="flex items-center gap-2 text-[#055A43]"><MessageCircle className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[0.13em]">Precisa de apoio?</span></div>
          <p className="mt-2 text-xs leading-5 text-[#6B7A6E]">Tem uma dúvida sobre a rotina ou o plano do seu cão?</p>
          <button onClick={() => navigate('/suporte')} className="mt-3 text-xs font-bold text-[#055A43] underline underline-offset-4">Falar com o Focão</button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[284px]">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="min-h-screen pb-24 lg:pb-0">
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E4E1D6] bg-[#FFFEFB]/95 px-3 pb-safe pt-2 backdrop-blur lg:hidden" aria-label="Navegação mobile">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return <NavLink key={item.path} to={item.path} onClick={haptics.light} className={cn('relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95', active ? 'bg-[#EAF0E8] text-[#055A43]' : 'text-[#8A9589]')}><span className="relative"><Icon className="h-5 w-5" strokeWidth={active ? 2.35 : 1.8} />{item.hasBadge && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#FFFEFB] bg-[#C2703E]" />}</span><span className={cn('text-[9px] leading-none', active ? 'font-black' : 'font-medium')}>{item.label}</span></NavLink>;
          })}
        </div>
      </nav>
    </div>
  );
}
