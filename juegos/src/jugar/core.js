/* Verano en Juego — núcleo de la app: vistas, licencia (verificación offline), progreso y registro de juegos.
   JS vanilla. Este archivo se inlinea en juegos/jugar/index.html por scripts/build.mjs. */
(function () {
  'use strict';
  var MARCA = /*@MARCA*/{}/*@/MARCA*/;
  var CFG = { API: /*@API*/'https://verano-en-juego.conglomeradocosmart.workers.dev'/*@/API*/, PUB: /*@PUBKEY*/''/*@/PUBKEY*/, PRODUCTO: 'verano-en-juego' };
  var VEJ = window.VEJ = { marca: MARCA, cfg: CFG, juegos: [], util: {}, lib: window.VEJL || {} };

  /* ── utilidades ── */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    for (var k in (attrs || {})) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function svg(html, cls) { var s = h('span', { class: cls || '', html: html, 'aria-hidden': 'true' }); return s; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function jget(k, def) { try { var v = JSON.parse(lsGet(k)); return v == null ? def : v; } catch (e) { return def; } }
  // Generador pseudoaleatorio con semilla (mulberry32): mismos niveles siempre
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mezclar(arr, r) { r = r || Math.random; var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function azar(arr, r) { return arr[Math.floor((r || Math.random)() * arr.length)]; }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function tiempo(s) { return Math.floor(s / 60) + ':' + pad2(s % 60); }
  VEJ.util = { h: h, rng: rng, mezclar: mezclar, azar: azar, tiempo: tiempo, svg: svg, lsGet: lsGet, lsSet: lsSet, jget: jget };

  /* ── tema de marca ── */
  (function tema() {
    var c = MARCA.colores || {}, s = document.documentElement.style;
    if (c.azul) s.setProperty('--azul', c.azul); if (c.amarillo) s.setProperty('--sol', c.amarillo);
    if (c.coral) s.setProperty('--coral', c.coral); if (c.verde) s.setProperty('--verde', c.verde);
  })();

  /* ── métricas anónimas (sin datos personales; no bloquean nada si falla) ── */
  function anon() {
    var v = lsGet('vej-anon');
    if (!v) { v = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/-/g, '').slice(0, 24); lsSet('vej-anon', v); }
    return v;
  }
  function evento(tipo, juego) {
    if (!navigator.onLine) return;
    var b = { evento: tipo, anon: anon() }; if (juego) b.juego = juego;
    try { fetch(CFG.API + '/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b), keepalive: true }).catch(function () { }); } catch (e) { }
  }
  VEJ.evento = evento;

  /* ── vistas ── */
  var raiz = document.getElementById('app'), limpiezas = [];
  function limpiar() { while (limpiezas.length) { try { limpiezas.pop()(); } catch (e) { } } }
  VEJ.alSalir = function (fn) { limpiezas.push(fn); };
  function pintar() {
    limpiar(); raiz.innerHTML = '';
    var cen = h('div', { class: 'cen' }); add(cen, Array.prototype.slice.call(arguments));
    raiz.appendChild(h('div', { class: 'pag' }, cen)); window.scrollTo(0, 0); return cen;
  }
  function marcaLogo() {
    if (MARCA.logo) return h('img', { src: MARCA.logo, alt: '', width: 48, height: 48 });
    return svg('<svg viewBox="0 0 64 64" width="48" height="48"><rect width="64" height="64" fill="#F4FAFC"/><circle cx="32" cy="26" r="18" fill="none" stroke="#0B5FA5" stroke-width="3"/><circle cx="32" cy="26" r="12" fill="none" stroke="#0B5FA5" stroke-width="3"/><circle cx="32" cy="26" r="7" fill="#FFC93C"/><rect y="48" width="16" height="16" fill="#FFC93C"/><rect x="16" y="48" width="16" height="16" fill="#0B5FA5"/><rect x="32" y="48" width="16" height="16" fill="#D93A32"/><rect x="48" y="48" width="16" height="16" fill="#0C7F6D"/></svg>', 'logo-svg');
  }
  var franja = function () { return h('div', { class: 'franja', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')); };
  var enlaceTienda = function () { return MARCA.landingUrl || '/juegos/verano-en-juego/'; };

  /* ── licencia ── */
  var enc = new TextEncoder(), dec = new TextDecoder();
  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return b64(s); }
  function deviceId() {
    var d = lsGet('vej-device');
    if (!d || !/^[A-Za-z0-9_-]{16,64}$/.test(d)) {
      var u = new Uint8Array(18); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(u) : u.forEach(function (_, i) { u[i] = Math.floor(Math.random() * 256); });
      d = btoa(String.fromCharCode.apply(null, u)).replace(/\+/g, '-').replace(/\//g, '_'); lsSet('vej-device', d);
    }
    return d;
  }
  // Devuelve el payload si la firma Ed25519 es válida (verificación local, SIN internet), o null.
  // Si el navegador no sabe Ed25519, se confía en un token que el servidor ya validó al activar ('vej-verificada').
  VEJ.verificarToken = function (token, pub) {
    pub = pub || CFG.PUB;
    return new Promise(function (ok) {
      try {
        var p = String(token || '').split('.'); if (p.length !== 3 || p[0] !== 'v1') return ok(null);
        var payload = JSON.parse(dec.decode(b64u(p[1])));
        if (!pub) return ok(null);
        crypto.subtle.importKey('raw', b64(pub), { name: 'Ed25519' }, false, ['verify'])
          .then(function (k) { return crypto.subtle.verify({ name: 'Ed25519' }, k, b64u(p[2]), enc.encode(p[0] + '.' + p[1])); })
          .then(function (v) { ok(v ? payload : null); })
          .catch(function (e) { ok(e && /NotSupported|Algorithm/i.test(e.name + e.message) && lsGet('vej-verificada') === '1' ? payload : null); });
      } catch (e) { ok(null); }
    });
  };
  function licenciaValida() {
    var t = lsGet('vej-licencia'); if (!t) return Promise.resolve(null);
    return VEJ.verificarToken(t).then(function (p) { return p && p.prod === CFG.PRODUCTO && p.dev === deviceId() ? p : null; });
  }
  function api(ruta, body) {
    var ctrl = window.AbortController ? new AbortController() : null, t = ctrl && setTimeout(function () { ctrl.abort(); }, 12000);
    return fetch(CFG.API + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(t); return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); })
      .catch(function () { clearTimeout(t); return { ok: false, _status: 0, error: 'Sin conexión. Activá con internet una sola vez; después funciona sin conexión.' }; });
  }
  function activar(codigo) {
    return api('/api/license/activate', { codigo: codigo, device_id: deviceId() }).then(function (r) {
      if (r.ok && r.token) { lsSet('vej-licencia', r.token); lsSet('vej-verificada', '1'); lsDel('vej-revocada'); }
      return r;
    });
  }
  // Latido silencioso: si no hay internet, no pasa nada.
  function latido() {
    var t = lsGet('vej-licencia'); if (!t || !navigator.onLine) return;
    api('/api/license/check', { token: t, device_id: deviceId() }).then(function (r) {
      if (r && r.ok && r.estado === 'otro_dispositivo') { lsDel('vej-licencia'); lsSet('vej-revocada', '1'); vistaOtro(); }
    });
  }

  function formatoCodigo(v) {
    var s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
    return s.slice(0, 6) + (s.length > 6 ? '-' + s.slice(6, 10) : '') + (s.length > 10 ? '-' + s.slice(10, 14) : '');
  }
  function vistaBloqueo(motivo, codigoPrevio) {
    var inp = h('input', { type: 'text', class: 'codigo', id: 'codigo', placeholder: 'VERANO-XXXX-XXXX', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: 14, 'aria-label': 'Código de activación', value: codigoPrevio || '' });
    var estado = h('div', { id: 'estado', role: 'status' }), btn;
    var ir = function () {
      var v = inp.value.trim(); if (!/^VERANO-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(formatoCodigo(v))) { mostrar('El código tiene la forma VERANO-XXXX-XXXX. Revisalo en tu mail.', 'mal'); inp.focus(); return; }
      btn.disabled = true; btn.textContent = 'Activando…'; estado.innerHTML = '';
      activar(v).then(function (r) { if (r.ok) vistaBienvenida(); else { btn.disabled = false; btn.textContent = 'Activar'; mostrar(r.error || 'No se pudo activar. Intentá de nuevo.', 'mal'); } });
    };
    function mostrar(t, tipo) { estado.innerHTML = ''; estado.appendChild(h('div', { class: 'msg ' + tipo }, t)); }
    inp.addEventListener('input', function () { inp.value = formatoCodigo(inp.value); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ir(); });
    btn = h('button', { class: 'btn grande', type: 'button', onclick: ir }, 'Activar');
    pintar(
      h('div', { class: 'marca' }, marcaLogo(), h('b', null, MARCA.nombre)),
      franja(),
      h('h1', { class: 'disp', style: 'font-size:clamp(32px,9vw,48px);line-height:1' }, motivo === 'otro' ? 'Esta app se activó en otro dispositivo.' : 'Activá tu app'),
      h('p', null, motivo === 'otro' ? 'Si ahora vas a jugar en este celu, pedí un link nuevo con el botón “Ya la compré”.' : 'Ingresá el código que te llegó por mail. Se activa una sola vez y después funciona sin internet.'),
      h('div', { class: 'tarjeta' }, h('label', { for: 'codigo' }, 'Código de activación'), inp, estado, btn),
      h('div', { class: 'fila' },
        h('a', { class: 'btn sol', href: (MARCA.recuperarUrl || '/juegos/verano-en-juego/ya-la-compre/') + (motivo === 'otro' ? '?motivo=otro' : '') }, 'Ya la compré'),
        h('a', { class: 'btn linea', href: enlaceTienda() }, 'Descargar'))
    );
    if (codigoPrevio) inp.value = formatoCodigo(codigoPrevio);
  }
  function vistaOtro() { vistaBloqueo('otro'); }
  function vistaActivando(codigo) {
    pintar(h('div', { class: 'marca' }, marcaLogo(), h('b', null, MARCA.nombre)), franja(), h('h1', { class: 'disp', style: 'font-size:34px' }, 'Activando…'), h('p', null, 'Un momento, estamos activando tu app.'));
    activar(codigo).then(function (r) { if (r.ok) vistaBienvenida(); else { vistaBloqueo(null, codigo); var e = document.getElementById('estado'); if (e) e.appendChild(h('div', { class: 'msg mal' }, r.error || 'No se pudo activar.')); } });
  }

  /* instalación */
  var promptInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptInstalar = e; var b = document.getElementById('btn-instalar'); if (b) b.hidden = false; });
  var esStandalone = function () { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; };
  var esIOS = function () { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); };
  function bloqueInstalar() {
    if (esStandalone()) return null;
    var pasos = esIOS() ? ['Tocá Compartir (el cuadradito con la flecha hacia arriba).', 'Elegí “Agregar a pantalla de inicio”.', 'Abrí el ícono que quedó en tu pantalla.']
      : ['Tocá “Instalar la app”.', 'Confirmá en el cartel que aparece.', 'Abrila desde tu pantalla de inicio.'];
    return h('div', { class: 'tarjeta' }, h('h3', { style: 'font-size:24px' }, 'Instalala en tu celu'),
      h('ol', { style: 'margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px' }, pasos.map(function (p) { return h('li', null, p); })),
      !esIOS() ? h('button', { class: 'btn sol', id: 'btn-instalar', type: 'button', hidden: !promptInstalar, onclick: function () { if (promptInstalar) { promptInstalar.prompt(); promptInstalar = null; } } }, 'Instalar la app') : null);
  }
  function vistaBienvenida() {
    pintar(h('div', { class: 'marca' }, marcaLogo(), h('b', null, MARCA.nombre)), franja(),
      h('h1', { class: 'disp', style: 'font-size:clamp(32px,9vw,48px);line-height:1' }, '¡Listo! Tu app está activada.'),
      h('p', null, 'Ya podés jugar sin internet. Tus avances quedan guardados en este celu.'),
      bloqueInstalar(),
      h('button', { class: 'btn grande sol', type: 'button', onclick: vistaInicio }, 'Empezar a jugar'));
  }

  /* ── progreso y niveles ── */
  function prog(id) { return jget('vej-prog-' + id, { hechos: {} }); }
  function guardarProg(id, p) { lsSet('vej-prog-' + id, JSON.stringify(p)); }
  function maxDesbloqueado(g) {
    var p = prog(g.id), m = 0; for (var k in p.hechos) m = Math.max(m, +k);
    var n = Math.min(m + 1, g.niveles);
    /*DEV:INI*/ if (lsGet('vej-revision') === '1') return g.niveles; /*DEV:FIN*/
    return n;
  }
  VEJ.progreso = { get: prog, max: maxDesbloqueado };
  var COLORES = ['azul', 'sol', 'coral', 'verde'];

  /* ── registro de juegos ── */
  VEJ.juego = function (g) { g.color = g.color || COLORES[VEJ.juegos.length % 4]; VEJ.juegos.push(g); };
  function juegosVisibles() {
    var inc = MARCA.juegos; var l = VEJ.juegos.filter(function (g) { return !inc || inc === 'todos' || inc.indexOf(g.id) >= 0; });
    return l.map(function (g, i) { g.color = COLORES[i % 4]; return g; });
  }

  function vistaInicio() {
    var lista = juegosVisibles(), p = MARCA.portada || {};
    var grid = h('div', { class: 'grid-j' }, lista.map(function (g, i) {
      var sub = g.tipo === 'niveles' ? (function () { var m = maxDesbloqueado(g); var hecho = Object.keys(prog(g.id).hechos).length; return hecho ? hecho + ' de ' + g.niveles + ' niveles' : g.niveles + ' niveles'; })() : null;
      return h('button', { class: 'j ' + g.color, type: 'button', onclick: function () { abrirJuego(g); } },
        h('small', null, pad2(i + 1)), h('div', { style: 'display:flex;flex-direction:column;gap:4px' }, h('h3', null, g.nombre), h('p', null, g.desc), sub ? h('span', { class: 'prog' }, sub) : null));
    }));
    var inst = bloqueInstalar();
    var dev = null; /*DEV:INI*/ dev = h('label', { class: 'chip', style: 'gap:10px' }, h('input', { type: 'checkbox', id: 'modo-revision', checked: lsGet('vej-revision') === '1', style: 'width:24px;height:24px', onchange: function (e) { lsSet('vej-revision', e.target.checked ? '1' : '0'); vistaInicio(); } }), 'Modo revisión (solo desarrollo)'); /*DEV:FIN*/
    pintar(
      h('div', { class: 'marca' }, marcaLogo(), h('b', null, MARCA.nombre)),
      franja(),
      h('div', { class: 'hero' }, h('h1', { class: 'disp' }, p.titulo || MARCA.nombre), p.subtitulo ? h('p', { style: 'margin-top:8px' }, p.subtitulo) : null),
      inst, dev, grid,
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;padding-top:6px' },
        MARCA.contacto && MARCA.contacto.url ? h('a', { class: 'btn linea chico', href: MARCA.contacto.url, style: 'color:var(--fg)' }, MARCA.contacto.texto || 'Contacto') : null,
        h('span', { style: 'font-size:14px;color:var(--muted)' }, 'Funciona sin internet. Tus avances se guardan en este dispositivo.'))
    );
  }

  function barra(titulo, volverTxt, volverFn, extra) {
    return h('div', { class: 'barra' }, h('button', { class: 'btn chico linea', type: 'button', style: 'color:var(--fg)', onclick: volverFn }, volverTxt || 'Volver'), h('h2', null, titulo), extra || null);
  }
  function abrirJuego(g) {
    evento('juego_abierto', g.id);
    if (g.tipo === 'niveles') return vistaNiveles(g);
    jugar(g, 0);
  }
  function vistaNiveles(g, pagina) {
    var p = prog(g.id), maxN = maxDesbloqueado(g), porPag = 50, pags = Math.ceil(g.niveles / porPag);
    pagina = pagina != null ? pagina : Math.floor((maxN - 1) / porPag);
    var tabs = pags > 1 ? h('div', { class: 'pestanas', role: 'group', 'aria-label': 'Tandas de niveles' }, Array.apply(null, Array(pags)).map(function (_, i) {
      return h('button', { type: 'button', 'aria-pressed': i === pagina ? 'true' : 'false', onclick: function () { vistaNiveles(g, i); } }, (i * porPag + 1) + '–' + Math.min((i + 1) * porPag, g.niveles));
    })) : null;
    var celdas = [];
    for (var n = pagina * porPag + 1; n <= Math.min((pagina + 1) * porPag, g.niveles); n++) (function (n) {
      var est = p.hechos[n], bloq = n > maxN;
      celdas.push(h('button', { class: 'niv' + (est ? ' hecho' : (n === maxN ? ' actual' : '')), type: 'button', disabled: bloq, 'aria-label': 'Nivel ' + n + (est ? ', completado' : bloq ? ', bloqueado' : ''), onclick: function () { jugar(g, n); } },
        String(n), est ? h('small', null, '★'.repeat(est)) : null));
    })(n);
    pintar(barra(g.nombre, 'Inicio', vistaInicio),
      h('p', null, 'Completá cada nivel para abrir el siguiente.'),
      h('button', { class: 'btn grande sol', type: 'button', onclick: function () { jugar(g, maxN); } }, 'Continuar: nivel ' + maxN),
      tabs, h('div', { class: 'niveles' }, celdas));
  }
  function estrellasSvg(n) {
    var out = ''; for (var i = 0; i < 3; i++) out += '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" fill="' + (i < n ? '#FFC93C' : 'rgba(255,255,255,.25)') + '"/></svg>';
    return out;
  }
  function jugar(g, nivel) {
    var cuerpo = h('div', { class: 'area' });
    var titulo = g.tipo === 'niveles' ? g.nombre + ' · ' + nivel : g.nombre;
    var salir = g.tipo === 'niveles' ? function () { vistaNiveles(g); } : vistaInicio;
    pintar(barra(titulo, g.tipo === 'niveles' ? 'Niveles' : 'Inicio', salir), cuerpo);
    var ctx = {
      nivel: nivel, volver: salir, limpiar: VEJ.alSalir, rng: rng, evento: evento,
      ganar: function (estrellas) {
        var p = prog(g.id); estrellas = Math.max(1, Math.min(3, estrellas || 3)); p.hechos[nivel] = Math.max(p.hechos[nivel] || 0, estrellas); guardarProg(g.id, p);
        var ultimo = nivel >= g.niveles;
        var ov = h('div', { class: 'superpuesto', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Nivel completo' }, h('div', { class: 'caja' },
          h('h2', { class: 'disp' }, ultimo ? '¡Completaste todos!' : '¡Nivel completo!'), svg(estrellasSvg(estrellas), 'estrellas'),
          !ultimo ? h('button', { class: 'btn grande sol', type: 'button', onclick: function () { jugar(g, nivel + 1); } }, 'Siguiente nivel') : null,
          h('button', { class: 'btn linea', type: 'button', onclick: function () { vistaNiveles(g); } }, 'Ver niveles')));
        document.body.appendChild(ov); VEJ.alSalir(function () { ov.remove(); }); var b = ov.querySelector('button'); if (b) b.focus();
      },
      reiniciar: function () { jugar(g, nivel); }
    };
    g.montar(cuerpo, ctx);
  }
  VEJ.volverInicio = vistaInicio;

  /* ── arranque ── */
  function arrancar() {
    var cod = null; try { cod = new URLSearchParams(location.search).get('activar'); } catch (e) { }
    licenciaValida().then(function (lic) {
      if (lic) { vistaInicio(); latido(); evento('pagina_vista'); return; }
      if (cod) { vistaActivando(cod); return; }
      if (lsGet('vej-revocada') === '1') { vistaOtro(); return; }
      vistaBloqueo();
    });
    if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('/juegos/sw.js', { scope: '/juegos/' }).catch(function () { }); });
  }
  VEJ.arrancar = arrancar;
  window.addEventListener('online', latido);
  /*DEV:INI*/ VEJ.test = { activar: activar, latido: latido, deviceId: deviceId }; /*DEV:FIN*/
})();
