import React from 'react';
import { motion } from 'motion/react';
import { Hammer, Sparkles, Sprout } from 'lucide-react';

export function Manutencao() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#055A43]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-12 -right-24 w-80 h-80 bg-[#055A43]/5 rounded-full blur-3xl" />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-sm">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-24 h-24 mb-8 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative border border-[#055A43]/5"
        >
          <Hammer className="w-10 h-10 text-[#055A43]" strokeWidth={1.5} />
          <div className="absolute -top-2 -right-2 bg-[#F9F9F8] rounded-full p-1.5 shadow-sm border border-gray-100">
             <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="font-serif text-[34px] text-[#055A43] tracking-tight leading-[1.1] mb-5"
        >
          Estamos em <br /> manutenção
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-[#5C615D] text-[15px] leading-relaxed mb-10 font-light"
        >
          O Focão está passando por melhorias para oferecer uma experiência ainda mais premium para você e seu cão.
        </motion.p>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
           className="px-6 py-3 bg-white rounded-full flex items-center gap-2 border border-[#055A43]/10 shadow-sm"
        >
          <Sprout className="w-4 h-4 text-[#055A43]" />
          <span className="text-[#055A43] text-sm font-medium tracking-wide">Voltamos em breve</span>
        </motion.div>
      </div>
    </div>
  );
}
