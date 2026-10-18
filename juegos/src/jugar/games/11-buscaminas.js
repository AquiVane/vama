/* Buscaminas — tres dificultades. Tocá para destapar; con el botón “Bandera” marcás dónde creés que hay una mina. */
(function () {
  var U = VEJ.util, h = U.h, NIV = { 'Fácil': { f: 8, c: 8, m: 9 }, 'Medio': { f: 10, c: 10, m: 18 }, 'Difícil': { f: 12, c: 10, m: 28 } };
  var MINA = '<svg viewBox="0 0 24 24" width="70%" height="70%" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="#fff"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>', BANDERA = '<svg viewBox="0 0 24 24" width="70%" height="70%" aria-hidden="true"><path d="M6 3v18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M7 4l12 4.5L7 13z" fill="#FFC93C"/></svg>';
  var COL = ['', '#0B5FA5', '#0C7F6D', '#D93A32', '#4B2E83', '#8A4B08', '#0B7285', '#0E2233', '#555'];
  VEJ.juego({
    id: 'buscaminas', nombre: 'Buscaminas', desc: 'Destapá sin pisar una mina.', tipo: 'mesa',
    montar: function (el, ctx) {
      var dif = 'Fácil';
      function menu() {
        el.innerHTML = '';
        var sel = h('div', { class: 'sel', role: 'group', 'aria-label': 'Dificultad' }); function p() { sel.innerHTML = ''; Object.keys(NIV).forEach(function (k) { sel.appendChild(h('button', { type: 'button', 'aria-pressed': String(k === dif), onclick: function () { dif = k; p(); } }, k + ' (' + NIV[k].m + ' minas)')); }); } p();
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('p', null, 'Los números dicen cuántas minas hay alrededor. Usá la lógica para destapar todo lo que no es mina.'), sel, h('button', { class: 'btn grande sol', type: 'button', onclick: partida }, 'Empezar')));
      }
      function partida() {
        var cfg = NIV[dif], F = cfg.f, C = cfg.c, mina = [], abierta = [], bandera = [], primera = true, fin = false, banderas = 0, modo = 'abrir', t0 = 0, seg = 0, timer = null;
        for (var i = 0; i < F * C; i++) { mina.push(false); abierta.push(false); bandera.push(false); }
        el.innerHTML = '';
        var tab = h('div', { 'data-tablero': '1', role: 'grid', 'aria-label': 'Tablero de buscaminas', style: 'display:grid;grid-template-columns:repeat(' + C + ',1fr);gap:3px;width:min(100%,' + (C * 52) + 'px)' }), celdas = [], msj = h('div', { role: 'status' });
        var info = h('span', null, 'Minas: ' + cfg.m), tiempoEl = h('span', null, '0:00');
        function vec(i) { var r = (i / C) | 0, c = i % C, o = []; for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { if (!a && !b) continue; var rr = r + a, cc = c + b; if (rr >= 0 && cc >= 0 && rr < F && cc < C) o.push(rr * C + cc); } return o; }
        function cuenta(i) { return vec(i).filter(function (j) { return mina[j]; }).length; }
        function ver(i) {
          var b = celdas[i];
          if (abierta[i]) { var n = cuenta(i); b.style.background = mina[i] ? 'var(--coral)' : 'var(--card)'; b.style.border = '2px solid var(--line)'; if (mina[i]) b.innerHTML = MINA; else b.textContent = n || ''; b.style.color = mina[i] ? '#fff' : COL[n]; b.setAttribute('aria-label', mina[i] ? 'Mina' : n + ' minas alrededor'); }
          else { b.style.background = 'var(--azul)'; b.style.border = '2px solid var(--azul)'; b.style.color = '#fff'; if (bandera[i]) b.innerHTML = BANDERA; else b.textContent = ''; b.setAttribute('aria-label', bandera[i] ? 'Bandera' : 'Sin destapar'); }
        }
        function repartir(evitar) { var libres = []; for (var i = 0; i < F * C; i++) if (i !== evitar && vec(evitar).indexOf(i) < 0) libres.push(i); U.mezclar(libres).slice(0, cfg.m).forEach(function (i) { mina[i] = true; }); }
        function abrir(i) {
          if (fin || bandera[i] || abierta[i]) return;
          if (primera) { primera = false; repartir(i); t0 = Date.now(); timer = setInterval(function () { seg = Math.floor((Date.now() - t0) / 1000); tiempoEl.textContent = U.tiempo(seg); }, 1000); ctx.limpiar(function () { clearInterval(timer); }); }
          var cola = [i];
          while (cola.length) { var x = cola.pop(); if (abierta[x] || bandera[x]) continue; abierta[x] = true; ver(x); if (mina[x]) return perder(); if (cuenta(x) === 0) vec(x).forEach(function (y) { if (!abierta[y]) cola.push(y); }); }
          if (abierta.filter(Boolean).length === F * C - cfg.m) ganar();
        }
        function perder() { fin = true; clearInterval(timer); mina.forEach(function (m, i) { if (m) { abierta[i] = true; ver(i); } }); msj.innerHTML = ''; msj.appendChild(h('div', { class: 'msg mal' }, 'Pisaste una mina.')); msj.appendChild(h('div', { class: 'fila', style: 'margin-top:12px' }, h('button', { class: 'btn grande sol', type: 'button', onclick: partida }, 'Reintentar'), h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: menu }, 'Cambiar dificultad'))); }
        function ganar() { fin = true; clearInterval(timer); msj.innerHTML = ''; msj.appendChild(h('div', { class: 'msg ok' }, '¡Ganaste en ' + U.tiempo(seg) + '!')); msj.appendChild(h('div', { class: 'fila', style: 'margin-top:12px' }, h('button', { class: 'btn grande sol', type: 'button', onclick: partida }, 'Jugar otra'), h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: menu }, 'Cambiar dificultad'))); }
        function bandear(i) { if (fin || abierta[i]) return; bandera[i] = !bandera[i]; banderas += bandera[i] ? 1 : -1; info.textContent = 'Minas: ' + (cfg.m - banderas); ver(i); }
        for (var k = 0; k < F * C; k++) (function (k) {
          var b = h('button', { type: 'button', role: 'gridcell', style: 'aspect-ratio:1;min-width:0;padding:0;border-radius:8px;font:800 clamp(15px,4.6vw,22px) Bricolage Grotesque,sans-serif', onclick: function () { if (modo === 'bandera') bandear(k); else abrir(k); } });
          var largo = null; b.addEventListener('pointerdown', function () { largo = setTimeout(function () { largo = 'hecho'; bandear(k); }, 450); });
          b.addEventListener('pointerup', function (e) { if (largo === 'hecho') { e.preventDefault(); b.dataset.noclick = '1'; } else clearTimeout(largo); });
          b.addEventListener('click', function (e) { if (b.dataset.noclick) { e.stopImmediatePropagation(); delete b.dataset.noclick; } }, true);
          b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
          celdas.push(b); tab.appendChild(b);
        })(k);
        celdas.forEach(function (_, i) { ver(i); });
        var selModo = h('div', { class: 'sel', role: 'group', 'aria-label': 'Acción al tocar' }); function pm() { selModo.innerHTML = ''; [['abrir', 'Destapar'], ['bandera', 'Bandera']].forEach(function (o) { selModo.appendChild(h('button', { type: 'button', 'aria-pressed': String(modo === o[0]), onclick: function () { modo = o[0]; pm(); } }, o[1])); }); } pm();
        el.appendChild(h('div', { class: 'estado' }, info, tiempoEl)); el.appendChild(selModo); el.appendChild(tab); el.appendChild(msj);
        el.appendChild(h('p', { class: 'centro', style: 'font-size:16px;color:var(--muted)' }, 'Mantené apretada una casilla para ponerle bandera.'));
      }
      menu();
    }
  });
})();
