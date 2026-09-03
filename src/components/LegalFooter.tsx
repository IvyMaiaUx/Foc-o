import { Link, useLocation } from 'react-router-dom';
import { LEGAL_URLS } from '../config/legal';
import { abrirPreferenciasCookies } from './LgpdBanner';

/**
 * Rotas públicas que recebem o rodapé automaticamente.
 *
 * O produto logado fica de fora de propósito: ele tem barra de navegação fixa
 * no rodapé do celular, e o acesso aos documentos e às preferências vive em
 * `Perfil → Privacidade & LGPD`.
 */
const ROTAS_PUBLICAS = [
  '/welcome',
  '/ebook',
  '/ebook-comportamento-e-rotina',
  '/ebook-fim-da-culpa',
  '/presell',
  '/rotina-cachorro',
  '/register',
  '/login',
  '/beta',
];

/**
 * Rodapé com os documentos legais e o acesso permanente às preferências de cookies.
 *
 * Existe porque o banner some depois da primeira resposta: sem um ponto fixo, o
 * usuário perde o caminho tanto para os documentos quanto para mudar de ideia
 * sobre o consentimento — e a Política de Cookies promete os dois por escrito.
 */
export function LegalFooter({ className = '' }: { className?: string }) {
  const link =
    'text-[#055A43]/80 underline underline-offset-2 hover:text-[#055A43] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#055A43]';

  return (
    <footer className={`px-6 pb-10 pt-8 ${className}`}>
      <nav
        aria-label="Documentos legais"
        className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12.5px]"
      >
        <Link to={LEGAL_URLS.privacidade} className={link}>Política de Privacidade</Link>
        <span aria-hidden="true" className="text-black/20">·</span>
        <Link to={LEGAL_URLS.termos} className={link}>Termos de Uso</Link>
        <span aria-hidden="true" className="text-black/20">·</span>
        <Link to={LEGAL_URLS.cookies} className={link}>Cookies</Link>
        <span aria-hidden="true" className="text-black/20">·</span>
        <button type="button" onClick={abrirPreferenciasCookies} className={link}>
          Preferências de cookies
        </button>
      </nav>
    </footer>
  );
}

/** Monta o rodapé sozinho nas rotas públicas. Usado uma vez, no App. */
export function LegalFooterPublico() {
  const { pathname } = useLocation();
  if (!ROTAS_PUBLICAS.includes(pathname)) return null;
  return <LegalFooter className="bg-[#F7F5EF] border-t border-black/[0.06]" />;
}
