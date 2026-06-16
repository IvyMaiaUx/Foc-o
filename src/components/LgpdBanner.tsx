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
        bottom: '12px',
        left: '12px',
        right: '12px',
        maxWidth: '560px',
        margin: '0 auto',
        zIndex: 9999,
        padding: '12px 14px',
        background: '#0a2e22',
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
