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

  // ── Visitante + oferta de lanzamiento ──
  // El servidor guarda la fecha de primera visita (7 días de precio de
  // lanzamiento) y es quien decide el precio que se cobra. Acá solo se muestra.
  function vid() {
    var v = store('vama_vid');
    if (!v || !/^[a-zA-Z0-9-]{16,64}$/.test(v)) {
      v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
      store('vama_vid', v);
    }
    try { document.cookie = 'vama_vid=' + v + ';max-age=31536000;path=/;SameSite=Lax'; } catch (e) {}
    return v;
  }
  function leadGuardado() { try { return JSON.parse(store('vama_lead') || '{}'); } catch (e) { return {}; } }

  var ofertaP = {};
  function oferta(producto) {
    if (!ofertaP[producto]) {
      ofertaP[producto] = api('/api/oferta', { method: 'POST', body: { producto: producto, vid: vid(), email: leadGuardado().email || '' } })
        .then(function (r) { return r.ok && r.data && r.data.ok ? r.data : null; })
        .catch(function () { return null; });
    }
    return ofertaP[producto];
  }

  // Aviso cuando la oferta venció: así el precio de lista no parece un aumento de la nada.
  var LISTA = { 'plata-en-orden': { ars: '$29.900', usd: 'USD 21,90' } };
  function avisoVencida(producto) {
    var l = LISTA[producto];
    if (!l || document.getElementById('aviso-oferta')) return;
    var st = document.createElement('style');
    st.textContent = '.aviso-oferta{background:#1E3A34;color:#fff;text-align:center;padding:10px 16px;font:600 14px/1.4 "DM Sans",system-ui,sans-serif;border-bottom:2px solid #7FE0A8}.aviso-oferta b{color:#7FE0A8;white-space:nowrap}';
    document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'aviso-oferta'; d.className = 'aviso-oferta'; d.setAttribute('role', 'status');
    d.innerHTML = 'La oferta de lanzamiento terminó · precio actual <b>' + l.ars + '</b> <b>(' + l.usd + ')</b>';
    document.body.insertBefore(d, document.body.firstChild);
  }

  // Timer de la oferta: muestra la cuenta regresiva y, al vencer, pasa a precio de lista.
  function ofertaInit(producto) {
    var K = 'vama_oferta_' + producto, D = 7 * 864e5, off = 0, fin = 0, vencida = false;
    var t0 = parseInt(store(K), 10);
    fin = (t0 && t0 <= Date.now() ? t0 : Date.now()) + D;
    function p(n) { return (n < 10 ? '0' : '') + n; }
    function vencer() {
      if (vencida) return; vencida = true;
      document.documentElement.classList.add('oferta-vencida');
      document.querySelectorAll('[data-lista]').forEach(function (e) { e.textContent = e.getAttribute('data-lista'); });
      avisoVencida(producto);
    }
    function tick() {
      var r = fin - (Date.now() + off);
      if (r <= 0) return vencer();
      var d = Math.floor(r / 864e5), h = Math.floor(r % 864e5 / 36e5), m = Math.floor(r % 36e5 / 6e4), s = Math.floor(r % 6e4 / 1e3);
      document.querySelectorAll('[data-timer]').forEach(function (e) { e.textContent = p(d) + 'd : ' + p(h) + 'h : ' + p(m) + 'm : ' + p(s) + 's'; });
      document.querySelectorAll('[data-timer-corto]').forEach(function (e) { e.textContent = d + 'd ' + h + 'h ' + p(m) + 'm'; });
      setTimeout(tick, 1000);
    }
    var estado = oferta(producto).then(function (o) {
      if (!o) return null;
      off = o.ahora - Date.now();          // corrige el reloj del dispositivo
      fin = o.vence; store(K, String(o.inicio));
      if (!o.activa) vencer();
      return o;
    });
    tick();
    return estado;
  }

  return { vid: vid, oferta: oferta, ofertaInit: ofertaInit, leadGuardado: leadGuardado, cfg: cfg, cookie: cookie, store: store, money: money, emailOk: emailOk, track: track, api: api };
})();
