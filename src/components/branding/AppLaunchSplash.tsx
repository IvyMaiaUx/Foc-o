import { motion, AnimatePresence } from 'motion/react';
import { Wordmark } from './Wordmark';

interface AppLaunchSplashProps {
  visible: boolean;
}

export function AppLaunchSplash({ visible }: AppLaunchSplashProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="app-launch-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
          className="pointer-events-none fixed inset-0 z-[100] overflow-hidden bg-[#041411]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(31,156,118,0.24),transparent_32%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(8,38,30,0.96),transparent_58%)]" />
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-screen"
            style={{
              backgroundImage:
                'linear-gradient(rgba(224,231,228,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(224,231,228,0.04) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="relative flex h-full items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -10 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.28, 0.7, 0.36], scale: [0.88, 1.06, 1] }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8BD0B5]/25"
              />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#9DE5C9] shadow-[0_0_18px_rgba(157,229,201,0.9)]" />
                <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#2F6B4F] shadow-[0_0_16px_rgba(47,107,79,0.8)]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, letterSpacing: '0.34em' }}
                animate={{ opacity: 1, letterSpacing: '0.22em' }}
                transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
              >
                <Wordmark tone="light" width={168} underline />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.28 }}
                className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A8BDB4]"
              >
                Rotina, treino e evolução
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
