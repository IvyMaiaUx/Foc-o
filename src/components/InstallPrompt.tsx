import { useState, useEffect, type CSSProperties } from 'react';
import { Download, X, Share } from 'lucide-react';

const DISMISS_KEY = 'focao_install_dismissed';

// Tipo mínimo do evento beforeinstallprompt (não está no lib.dom padrão).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// iOS (iPhone/iPad, incluindo iPadOS que se reporta como MacIntel touch).
function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Só o Safari do iOS consegue "Adicionar à Tela de Início" (Chrome/Firefox no iOS não têm).
function isIOSSafari(): boolean {
  return isIOS() && !/crios|fxios|edgios|opios/i.test(navigator.userAgent);
}

// Safari de desktop (macOS). Safari 17+ permite "Adicionar ao Dock".
function isMacSafari(): boolean {
  const ua = navigator.userAgent;
  return (
    !isIOS() &&
    /Macintosh/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|Brave/.test(ua)
  );
}

function consentGiven(): boolean {
  try {
    return !!localStorage.getItem('lgpd_consent');
  } catch {
    return true;
  }
}

type Mode = 'none' | 'android' | 'ios' | 'mac-safari';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode>('none');

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    // Safari (sem evento programável) → mostra a instrução manual, após consentimento.
    if (isIOSSafari()) {
      if (consentGiven()) setMode('ios');
      return;
    }
    if (isMacSafari()) {
      if (consentGiven()) setMode('mac-safari');
      return;
    }

    // Chromium (Chrome/Edge/Brave/Opera/Samsung), Android e desktop:
    // captura o prompt nativo pra disparar no nosso botão. Firefox nunca dispara → fica none.
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      if (consentGiven()) setMode('android');
    };
    const onInstalled = () => {
      setMode('none');
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* usuário cancelou ou erro */
    }
    setDeferred(null);
    setMode('none');
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setMode('none');
  }

  if (mode === 'none') return null;

  const wrapStyle: CSSProperties = {
    position: 'fixed',
    left: '12px',
    right: '12px',
    bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
    maxWidth: '480px',
    margin: '0 auto',
    zIndex: 9998,
    padding: '12px 14px',
    background: '#0a2e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const icon = (
    <img src="/icon-192.png" alt="" width={40} height={40} style={{ borderRadius: '10px', flex: 'none' }} />
  );
  const dismissBtn = (
    <button
      onClick={dismiss}
      aria-label="Dispensar"
      style={{
        flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '8px', border: 'none',
        background: 'transparent', color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
      }}
    >
      <X size={16} />
    </button>
  );

  // Banner com instrução manual (Safari iOS / macOS).
  if (mode === 'ios' || mode === 'mac-safari') {
    return (
      <div role="dialog" aria-label="Instalar aplicativo" style={wrapStyle}>
        {icon}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>Instalar o Focão</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', lineHeight: 1.4, color: 'rgba(255,255,255,0.7)' }}>
            {mode === 'ios' ? (
              <>
                Toque em{' '}
                <Share size={13} style={{ display: 'inline', verticalAlign: '-2px', margin: '0 1px' }} />{' '}
                e depois em <strong style={{ color: '#fff' }}>"Adicionar à Tela de Início"</strong>.
              </>
            ) : (
              <>
                No menu <strong style={{ color: '#fff' }}>Arquivo</strong> do Safari, escolha{' '}
                <strong style={{ color: '#fff' }}>"Adicionar ao Dock"</strong>.
              </>
            )}
          </p>
        </div>
        {dismissBtn}
      </div>
    );
  }

  // Chromium: botão de instalar (prompt nativo de 1 toque).
  return (
    <div role="dialog" aria-label="Instalar aplicativo" style={wrapStyle}>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>Instalar o Focão</p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', lineHeight: 1.35, color: 'rgba(255,255,255,0.65)' }}>
          Acesso rápido direto na tela inicial.
        </p>
      </div>
      <button
        onClick={install}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          borderRadius: '8px', border: 'none', background: '#055A43', color: '#fff',
          fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <Download size={15} />
        Instalar
      </button>
      {dismissBtn}
    </div>
  );
}
