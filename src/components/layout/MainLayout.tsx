import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, CheckCircle2, TrendingUp, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReminders } from '@/src/hooks/useReminders';
import { useAuth } from '@/src/contexts/AuthContext';
import { SupportRepository } from '@/src/repositories/SupportRepository';
import { haptics } from '@/src/lib/haptics';

export function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();
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
    { path: '/plano', icon: ClipboardList, label: 'Plano' },
    { path: '/checkin', icon: CheckCircle2, label: 'Check-in' },
    { path: '/evolucao', icon: TrendingUp, label: 'Evolução' },
    { path: '/perfil', icon: User, label: 'Perfil', hasBadge: hasUnreadSupport },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col relative pb-24">
      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col w-full"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[1.5rem] shadow-[0_-4px_24px_rgba(5,90,67,0.08)] px-5 py-2 pb-safe z-50">
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
                  "relative flex flex-col items-center justify-center px-1 py-2 rounded-[1rem] w-[64px] min-h-[58px] transition-all duration-300 ease-out",
                  isActive ? "bg-[#055A43] text-white shadow-md shadow-[#055A43]/20" : "text-[#7B827D] hover:bg-[#FAFAFA] active:scale-95"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-[22px] h-[22px] mb-1", isActive ? "text-white" : "")} strokeWidth={isActive ? 2.5 : 2} />
                  {item.hasBadge && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-[9px] font-bold tracking-[0.05em] uppercase text-center leading-tight">
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
