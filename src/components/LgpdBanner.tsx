import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'lgpd_consent';

declare global {
  interface Window {
    __loadFocaoTrackers?: () => void;
  }
}

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const consent = raw ? JSON.parse(raw) : null;
      // Mostra se nunca respondeu OU se o consentimento é do formato antigo (sem o campo marketing).
      if (!consent || typeof consent.marketing !== 'boolean') setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(marketing: boolean) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accepted: true,
      marketing,
      date: new Date().toISOString(),
    }));
    setVisible(false);
    // Só dispara os trackers de marketing se o usuário consentiu.
    if (marketing && typeof window !== 'undefined' && window.__loadFocaoTrackers) {
      window.__loadFocaoTrackers();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de privacidade"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '16px 20px',
        background: '#0a2e22',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Texto */}
      <p style={{
        margin: 0,
        fontSize: '13px',
        lineHeight: '1.6',
        color: 'rgba(255,255,255,0.75)',
      }}>
        Usamos cookies <strong>essenciais</strong> para manter sua conta segura (sempre ativos) e,
        com seu consentimento, cookies de <strong>marketing</strong> (Meta/Facebook e nosso pixel)
        para medir e melhorar os anúncios. Você pode recusar os de marketing sem afetar o uso do app.
        Saiba mais na{' '}
        <Link
          to="/privacidade"
          style={{ color: '#6ee7b7', textDecoration: 'underline' }}
        >
          Política de Privacidade
        </Link>
        .
      </p>

      {/* Botões */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => save(true)}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#055A43',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Aceitar todos
        </button>
        <button
          onClick={() => save(false)}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Recusar marketing
        </button>
        <Link
          to="/privacidade"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.65)',
            fontSize: '13px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Saber mais
        </Link>
      </div>
    </div>
  );
}
