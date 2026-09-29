// Config y helpers compartidos de VAMA Academy (frontend estático).
// Este repo es PÚBLICO: acá solo van valores públicos por diseño (public key de
// Mercado Pago, client-id de PayPal, ID del Pixel). Nunca claves secretas ni
// los archivos pagos -- esos viven en el Worker, detrás del login.
window.VAMA = (function () {
  var cfg = {
    CORE: 'https://cosmart-training-core.conglomeradocosmart.workers.dev',
    MP_WORKER: 'https://mp-productos-ganadores.conglomeradocosmart.workers.dev',
    MP_PUBLIC_KEY: 'APP_USR-057d290b-5af9-4b00-8a08-6753dc47aec4',
    PAYPAL_CLIENT_ID: 'AYuQX3JJShvSkgNn0C195h3GEHGiKNtx44X3wd_5PEoBI1iinpysmDzNRqdZ7blNuZvFWIwcwhc9qiOP',
    // ID del Pixel de Meta (Events Manager). Vacío = el pixel no se carga.
    PIXEL_ID: '',
    PRECIO: 14900, PRECIO_BUMP: 6900, USD: 10.90, USD_BUMP: 4.90,
  };

  function cookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function money(n) { return '$' + Number(n).toLocaleString('es-AR'); }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || ''); }

  // ── Pixel de Meta ──
  (function (f, b, e, v, n, t, s) {
    if (!cfg.PIXEL_ID || f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    f.fbq('init', cfg.PIXEL_ID);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  function track(ev, data) { try { if (window.fbq) window.fbq('track', ev, data || {}); } catch (e) {} }
  track('PageView');

  // ── API ──
  function api(path, opts) {
    opts = opts || {};
    var h = { 'Content-Type': 'application/json' };
    var t = store('vama_token');
    if (opts.auth && t) h.Authorization = 'Bearer ' + t;
    return fetch(cfg.CORE + path, { method: opts.method || 'GET', headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, data: j }; }); });
  }

  return { cfg: cfg, cookie: cookie, store: store, money: money, emailOk: emailOk, track: track, api: api };
})();
