import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, CheckCircle2, Sparkles, TrendingUp, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReminders } from '@/src/hooks/useReminders';
import { useAuth } from '@/src/contexts/AuthContext';
import { SupportRepository } from '@/src/repositories/SupportRepository';
import { haptics } from '@/src/lib/haptics';
import { isBetaEnvironment } from '@/src/lib/beta';

export function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isBeta = isBetaEnvironment();
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  useReminders();

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = SupportRepository.subscribeToThread(user.uid, (thread) => {
      // The admin sets unreadUser to true when they reply
      if (thread && thread.unreadUser) {
        setHasUnreadSupport(true);
      } else {
        setHasUnreadSupport(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    isBeta
      ? { path: '/beta', icon: Sparkles, label: 'Beta' }
      : { path: '/plano', icon: ClipboardList, label: 'Plano' },
    { path: '/checkin', icon: CheckCircle2, label: 'Check-in' },
    { path: '/evolucao', icon: TrendingUp, label: 'Evolução' },
    { path: '/perfil', icon: User, label: 'Perfil', hasBadge: hasUnreadSupport },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col relative">
      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col w-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FFFEFB] border-t border-[#E4E1D6] px-5 py-2 pb-safe z-50 isolate">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={haptics.light}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-[1rem] w-[64px] min-h-[58px] transition-all duration-300 ease-out",
                  isActive ? "bg-[#EAF0E8] text-[#055A43]" : "text-[#8A9589] hover:bg-[#F7F5EF] active:scale-95"
                )}
              >
                <div className="relative">
                  <Icon className="w-[21px] h-[21px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.hasBadge && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-[#FFFEFB]" />
                  )}
                </div>
                <span className={cn("text-[9px] tracking-[0.03em] text-center leading-tight", isActive ? "font-bold" : "font-medium")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
