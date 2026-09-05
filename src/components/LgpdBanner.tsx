import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'lgpd_consent';

/**
 * Evento que reabre o banner. Quem quiser oferecer "Preferências de cookies"
 * — o rodapé, a tela de Perfil — dispara isto em vez de duplicar a lógica.
 */
export const EVENTO_PREFERENCIAS = 'focao:preferencias-cookies';

export function abrirPreferenciasCookies() {
  window.dispatchEvent(new CustomEvent(EVENTO_PREFERENCIAS));
}

declare global {
  interface Window {
    __loadFocaoTrackers?: () => void;
  }
}

function lerConsentimento(): { marketing?: unknown } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = lerConsentimento();
    // Mostra se nunca respondeu OU se o consentimento é do formato antigo (sem o campo marketing).
    if (!consent || typeof consent.marketing !== 'boolean') setVisible(true);
  }, []);

  // Reabertura sob demanda: a LGPD exige que revogar seja tão fácil quanto consentir.
  useEffect(() => {
    const reabrir = () => setVisible(true);
    window.addEventListener(EVENTO_PREFERENCIAS, reabrir);
    return () => window.removeEventListener(EVENTO_PREFERENCIAS, reabrir);
  }, []);

  function save(marketing: boolean) {
    const anterior = lerConsentimento();
    const revogou = anterior?.marketing === true && !marketing;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accepted: true,
      marketing,
      date: new Date().toISOString(),
    }));
    setVisible(false);

    // Só dispara os trackers de marketing se o usuário consentiu.
    if (marketing && typeof window !== 'undefined' && window.__loadFocaoTrackers) {
      window.__loadFocaoTrackers();
      return;
    }
    // Revogação depois de ter aceitado: os scripts já estão na página e não têm
    // como ser desligados em memória, então recarregamos para que não subam de novo.
    if (revogou) window.location.reload();
  }

  // O banner é `position: fixed` e flutua sobre a página. Medido em tela de
  // celular (390px), ele cobria o botão "entrar" da tela de boas-vindas: banner
  // em 559-621px, botão em 549-605px. Quem já era assinante não conseguia tocar
  // no botão sem antes despachar o banner.
  //
  // Em vez de empurrar o layout de todas as telas, ele publica a própria altura
  // em `--rodape-flutuante-h` e cada tela que precisa reserva o espaço. Fica 0 assim
  // que o banner sai, e telas que não usam a variável seguem como estavam.
  useEffect(() => {
    const raiz = document.documentElement;
    if (!visible) {
      raiz.style.removeProperty('--rodape-flutuante-h');
      return;
    }
    const medir = () => {
      const caixa = caixaRef.current;
      if (!caixa) return;
      // Mede quanto o banner ocupa CONTADO A PARTIR DO RODAPÉ, em vez de somar
      // altura + uma folga chutada: assim continua correto se o afastamento de
      // baixo mudar, inclusive o que vem da área segura do aparelho.
      const ocupado = window.innerHeight - caixa.getBoundingClientRect().top;
      if (ocupado > 0) raiz.style.setProperty('--rodape-flutuante-h', `${Math.ceil(ocupado + 12)}px`);
    };
    medir();
    // O banner quebra em mais linhas quando a tela é estreita, então a altura
    // muda ao girar o aparelho.
    window.addEventListener('resize', medir);
    return () => {
      window.removeEventListener('resize', medir);
      raiz.style.removeProperty('--rodape-flutuante-h');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={caixaRef}
      role="dialog"
      aria-label="Aviso de privacidade"
      aria-live="polite"
      style={{
        position: 'fixed',
        // No Chrome do iOS a barra de ferramentas fica por cima do rodape da
        // pagina: com 12px o banner ficava embaixo dela e o botao "Aceitar" nao
        // dava pra tocar. `env(safe-area-inset-bottom)` cobre o indicador de
        // home, e a folga extra tira o banner de debaixo da barra do navegador.
        bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        left: '12px',
        right: '12px',
        maxWidth: '560px',
        margin: '0 auto',
        zIndex: 9999,
        padding: '12px 14px',
        background: 'rgba(10, 46, 34, 0.82)',
        // O desfoque é o que mantém o texto legível com o fundo translúcido:
        // sem ele, conteúdo claro passando atrás encavala com o texto branco.
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <p style={{
        margin: 0,
        flex: '1 1 220px',
        fontSize: '12.5px',
        lineHeight: 1.45,
        color: 'rgba(255,255,255,0.75)',
      }}>
        Cookies essenciais e, com seu consentimento, de <strong>marketing</strong> (Meta) para medir anúncios.{' '}
        <Link to="/privacidade" style={{ color: '#6ee7b7', textDecoration: 'underline' }}>
          Política
        </Link>
        .
      </p>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => save(false)}
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Recusar
        </button>
        <button
          onClick={() => save(true)}
          style={{
            padding: '7px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#055A43',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
