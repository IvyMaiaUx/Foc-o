/*
 * Gate de consentimento LGPD para as landing pages estáticas do funil.
 * Substitui o carregamento direto do pixel próprio (FCT): só dispara após o aceite.
 * Usa a MESMA chave (lgpd_consent) do app React, então o consentimento é unificado
 * em todo o focao.web.app.
 */
(function () {
  var KEY = 'lgpd_consent';

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  function loadPixel() {
    if (window.__fctPixelLoaded) return;
    window.__fctPixelLoaded = true;
    var s = document.createElement('script');
    s.src = 'https://track-up.vercel.app/pixel.js';
    s.setAttribute('data-pixel', 'FCT-6A28F5');
    s.setAttribute('data-endpoint', 'https://track-up.vercel.app/api/track');
    s.async = true;
    document.head.appendChild(s);
  }

  function save(marketing) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        accepted: true,
        marketing: marketing,
        date: new Date().toISOString(),
      }));
    } catch (e) {}
    var el = document.getElementById('focao-lgpd-banner');
    if (el) el.parentNode.removeChild(el);
    if (marketing) loadPixel();
  }

  function showBanner() {
    if (document.getElementById('focao-lgpd-banner')) return;
    var wrap = document.createElement('div');
    wrap.id = 'focao-lgpd-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Aviso de privacidade');
    wrap.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;max-width:560px;margin:0 auto;z-index:99999;padding:12px 14px;background:#0a2e22;border:1px solid rgba(255,255,255,0.08);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.25);display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-family:-apple-system,Segoe UI,Roboto,sans-serif';
    wrap.innerHTML =
      '<p style="margin:0;flex:1 1 220px;font-size:12.5px;line-height:1.45;color:rgba(255,255,255,0.75)">' +
        'Cookies essenciais e, com seu consentimento, de <strong>marketing</strong> para medir anúncios. ' +
        '<a href="/privacidade" style="color:#6ee7b7;text-decoration:underline">Política</a>.' +
      '</p>' +
      '<div style="display:flex;gap:8px">' +
        '<button id="focao-lgpd-reject" style="padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.8);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap">Recusar</button>' +
        '<button id="focao-lgpd-accept" style="padding:7px 16px;border-radius:8px;border:none;background:#055A43;color:#fff;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap">Aceitar</button>' +
      '</div>';
    document.body.appendChild(wrap);
    document.getElementById('focao-lgpd-accept').addEventListener('click', function () { save(true); });
    document.getElementById('focao-lgpd-reject').addEventListener('click', function () { save(false); });
  }

  var c = getConsent();
  if (c && typeof c.marketing === 'boolean') {
    if (c.marketing) loadPixel();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
