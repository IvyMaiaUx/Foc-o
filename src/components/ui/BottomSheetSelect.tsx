import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Check } from 'lucide-react';

interface BottomSheetSelectProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  value: string;
  onSelect: (val: string) => void;
  title: string;
  placeholder?: string;
}

export function BottomSheetSelect({
  isOpen,
  onClose,
  options,
  value,
  onSelect,
  title,
  placeholder = "Buscar..."
}: BottomSheetSelectProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-[60] h-[80vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#055A43]/5 shrink-0">
              <h3 className="text-xl font-serif text-[#055A43]">{title}</h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#FAFAFA] flex items-center justify-center text-[#5C615D] active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A4A1]" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl pl-11 pr-4 text-[#055A43] placeholder-[#A0A4A1] focus:outline-none focus:border-[#055A43]/30 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-safe">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-[#5C615D]">
                  Nenhum resultado encontrado para "{search}"
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onSelect(opt);
                        onClose();
                      }}
                      className="flex items-center justify-between p-4 px-6 active:bg-[#FAFAFA] transition-colors text-left"
                    >
                      <span className={`text-base ${value === opt ? 'font-medium text-[#055A43]' : 'text-[#506352]'}`}>
                        {opt}
                      </span>
                      {value === opt && (
                        <Check className="w-5 h-5 text-[#055A43]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
