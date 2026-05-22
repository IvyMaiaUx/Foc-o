import React from 'react';
import { ArrowLeft, PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  step?: string;
  topImage?: string;
}

export function AuthLayout({ children, showBackButton = true, title, subtitle, step, topImage }: AuthLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative selection:bg-[#055A43]/20">
      {topImage && (
        <div className="absolute top-0 left-0 right-0 h-[30vh] md:h-[40vh] w-full overflow-hidden pointer-events-none">
          <img 
            src={topImage} 
            alt="Fundo" 
            className="w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
        </div>
      )}

      <header className="px-6 py-5 flex items-center justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="w-12 flex items-center justify-start">
          {showBackButton && (
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full text-[#055A43] hover:bg-[#055A43]/5 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-[#055A43]" strokeWidth={2} />
          <span className="font-serif text-[#055A43] text-xl font-bold tracking-wide">Focão</span>
        </div>

        <div className="w-12" />
      </header>

      <main className="flex-1 px-6 pb-12 pt-8 flex flex-col mx-auto w-full max-w-md relative z-10">
        {(step || title || subtitle) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-3 mb-10 text-center items-center"
          >
            {step && (
              <span className="text-[#055A43] text-[11px] font-bold tracking-[0.2em] uppercase bg-[#055A43]/5 px-3 py-1 rounded-full">
                {step}
              </span>
            )}
            {title && (
              <h1 className="font-serif text-[32px] text-[#055A43] tracking-tight leading-[1.15]">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[#5C615D] text-[15px] leading-relaxed max-w-[280px]">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
