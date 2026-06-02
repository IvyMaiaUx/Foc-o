import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'lgpd_consent';

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accepted: true,
      date: new Date().toISOString(),
    }));
    setVisible(false);
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
        Usamos cookies e dados necessários para personalizar o treino do seu cão e manter sua conta segura.
        Ao continuar, você concorda com nossa{' '}
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
          onClick={accept}
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
          Entendi e aceito
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
