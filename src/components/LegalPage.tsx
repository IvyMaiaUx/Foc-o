import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LegalDoc } from './LegalDoc';
import { LegalFooter } from './LegalFooter';

/**
 * Casca compartilhada dos três documentos legais. O texto vem do markdown em
 * src/content/legal/; aqui ficam só a navegação, o respiro e o rodapé.
 */
export function LegalPage({ kicker, markdown }: { kicker: string; markdown: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5EF] font-sans">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <header className="flex flex-col gap-5 px-6 pb-2 pt-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#055A43]/8 bg-white text-[#6B7A6E] shadow-[0_4px_16px_rgba(45,74,58,0.06)] transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#055A43]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#055A43]/70">
            {kicker}
          </p>
        </header>

        <main className="flex-1 px-6 pb-4">
          <LegalDoc markdown={markdown} />
        </main>

        <LegalFooter className="border-t border-black/[0.06]" />
      </div>
    </div>
  );
}
