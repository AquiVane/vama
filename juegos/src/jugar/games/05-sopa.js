/* Sopa de letras — 200 niveles. Se arrastra el dedo sobre la palabra (o se toca la primera y la última letra). */
(function () {
  var U = VEJ.util, h = U.h, L = VEJ.lib;
  var COLORES = ['#0B5FA5', '#D93A32', '#0C7F6D', '#B7791F', '#7B3FA0', '#0B7285'];
  VEJ.juego({
    id: 'sopa-de-letras', nombre: 'Sopa de letras', desc: '200 sopas para encontrar palabras.', tipo: 'niveles', niveles: 200,
    montar: function (el, ctx) {
      var s = L.sopa(ctx.nivel), n = s.n, hallo = {}, celdasHalladas = {}, inicio = -1, fin = -1, tapInicio = -1, t0 = Date.now(), cant = 0;
      var tab = h('div', { 'data-tablero': '1', role: 'grid', 'aria-label': 'Sopa de letras', style: 'display:grid;grid-template-columns:repeat(' + n + ',1fr);width:min(100%,520px);aspect-ratio:1;background:var(--card);border:3px solid var(--azul);border-radius:12px;touch-action:none;user-select:none' });
      var celdas = [];
      for (var i = 0; i < n * n; i++) { var c = h('div', { role: 'gridcell', style: 'display:flex;align-items:center;justify-content:center;font:800 clamp(14px,4.4vw,24px) Bricolage Grotesque,sans-serif;border-radius:8px;margin:1px' }, s.grid[i]); celdas.push(c); tab.appendChild(c); }
      var lista = h('ul', { style: 'list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px;justify-content:center' });
      var items = s.palabras.map(function (p) { var li = h('li', { class: 'chip', style: 'min-height:44px' }, p.w); lista.appendChild(li); return li; });
      function linea(a, b) { // celdas en línea recta de a hacia b (forzado a 8 direcciones)
        var ar = (a / n) | 0, ac = a % n, br = (b / n) | 0, bc = b % n, dr = br - ar, dc = bc - ac;
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) { if (Math.abs(dr) > Math.abs(dc)) dc = 0; else dr = 0; }
        var len = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc), o = [];
        for (var k = 0; k <= len; k++) o.push((ar + sr * k) * n + ac + sc * k); return o;
      }
      function pintar(sel) {
        celdas.forEach(function (c, i) { var col = celdasHalladas[i]; c.style.background = col || 'transparent'; c.style.color = col ? '#fff' : 'var(--fg)'; });
        (sel || []).forEach(function (i) { celdas[i].style.background = 'var(--sol)'; celdas[i].style.color = '#0E2233'; });
      }
      function intentar(a, b) {
        var p = L.sopaCheck(s, a, b); if (!p || hallo[p.w]) { pintar(); return false; }
        hallo[p.w] = 1; cant++; var col = COLORES[cant % COLORES.length];
        for (var k = 0; k < p.w.length; k++) celdasHalladas[(p.r + p.dr * k) * n + p.c + p.dc * k] = col;
        var li = items[s.palabras.indexOf(p)]; li.style.textDecoration = 'line-through'; li.style.background = col; li.style.color = '#fff'; li.style.borderColor = col;
        pintar();
        if (cant === s.palabras.length) { var seg = (Date.now() - t0) / 1000; setTimeout(function () { ctx.ganar(seg <= s.palabras.length * 14 ? 3 : seg <= s.palabras.length * 30 ? 2 : 1); }, 350); }
        return true;
      }
      function celdaEn(e) { var r = tab.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * n), y = Math.floor((e.clientY - r.top) / r.height * n); if (x < 0 || y < 0 || x >= n || y >= n) return -1; return y * n + x; }
      var movio = false;
      tab.addEventListener('pointerdown', function (e) { inicio = celdaEn(e); fin = inicio; movio = false; try { tab.setPointerCapture(e.pointerId); } catch (x) { } pintar([inicio].concat(tapInicio >= 0 ? [tapInicio] : [])); });
      tab.addEventListener('pointermove', function (e) { if (inicio < 0) return; var c = celdaEn(e); if (c < 0 || c === fin) return; fin = c; if (c !== inicio) movio = true; pintar(linea(inicio, fin)); });
      tab.addEventListener('pointerup', function () {
        if (inicio < 0) return;
        if (movio) { var l = linea(inicio, fin); intentar(l[0], l[l.length - 1]); tapInicio = -1; }
        else if (tapInicio >= 0 && tapInicio !== inicio) { var l2 = linea(tapInicio, inicio); intentar(l2[0], l2[l2.length - 1]); tapInicio = -1; }
        else { tapInicio = inicio; pintar([inicio]); }
        inicio = -1;
      });
      el.appendChild(h('div', { class: 'estado' }, h('span', null, 'Palabras: ' + s.palabras.length)));
      el.appendChild(tab); el.appendChild(lista);
      el.appendChild(h('p', { class: 'centro', style: 'font-size:16px;color:var(--muted)' }, 'Arrastrá sobre la palabra, o tocá la primera y la última letra.' + (ctx.nivel > 40 ? ' Pueden estar en diagonal.' : '') + (ctx.nivel > 100 ? ' Y también al revés.' : '')));
      pintar();
    }
  });
})();
