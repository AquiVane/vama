/* Nonogramas — 60 niveles. Las pistas de cada fila y columna dicen cuántas casillas seguidas van pintadas. */
(function () {
  var U = VEJ.util, h = U.h, L = VEJ.lib;
  VEJ.juego({
    id: 'nonogramas', nombre: 'Nonogramas', desc: 'Pintá casillas con las pistas y aparece un dibujo.', tipo: 'niveles', niveles: L.NONO_NIVELES,
    montar: function (el, ctx) {
      var q = L.nonograma(ctx.nivel), n = q.n, tab = []; for (var y = 0; y < n; y++) tab.push(new Array(n).fill(0));   // 0 vacío, 1 pintado, 2 marcado con X
      var modo = 1, hecho = false, maxF = Math.max.apply(null, q.filas.map(function (f) { return f.length; })), maxC = Math.max.apply(null, q.cols.map(function (c) { return c.length; }));
      var celdaPx = Math.floor(Math.min(46, (Math.min(window.innerWidth - 32, 520) - maxF * 18) / n)); celdaPx = Math.max(celdaPx, 22);
      var grid = h('div', { 'data-tablero': '1', role: 'grid', 'aria-label': 'Nonograma de ' + n + ' por ' + n, style: 'display:grid;grid-template-columns:auto repeat(' + n + ',' + celdaPx + 'px);gap:2px;align-items:center;justify-items:center;touch-action:none' }), botones = [];
      grid.appendChild(h('div'));
      for (var c = 0; c < n; c++) grid.appendChild(h('div', { style: 'display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font:700 ' + Math.max(11, celdaPx * .42) + 'px Figtree,sans-serif;line-height:1.1;min-height:' + (maxC * 15) + 'px;padding-bottom:2px', 'aria-label': 'Columna ' + (c + 1) + ': ' + q.cols[c].join(' ') }, q.cols[c].map(function (v) { return h('span', null, String(v)); })));
      for (var f = 0; f < n; f++) {
        grid.appendChild(h('div', { style: 'display:flex;gap:4px;justify-content:flex-end;padding-right:4px;font:700 ' + Math.max(11, celdaPx * .42) + 'px Figtree,sans-serif', 'aria-label': 'Fila ' + (f + 1) + ': ' + q.filas[f].join(' ') }, q.filas[f].map(function (v) { return h('span', null, String(v)); })));
        botones.push([]);
        for (var c2 = 0; c2 < n; c2++) { var b = h('button', { type: 'button', style: 'width:' + celdaPx + 'px;height:' + celdaPx + 'px;padding:0;border:2px solid var(--line);border-radius:6px;background:var(--card);font:800 ' + celdaPx * .6 + 'px sans-serif', 'aria-label': 'Fila ' + (f + 1) + ', columna ' + (c2 + 1) + ', vacía' }); botones[f].push(b); grid.appendChild(b); }
      }
      function ver(y, x) { var v = tab[y][x], b = botones[y][x]; b.style.background = v === 1 ? 'var(--azul)' : 'var(--card)'; b.style.borderColor = v === 1 ? 'var(--azul)' : 'var(--line)'; b.textContent = v === 2 ? '×' : ''; b.style.color = 'var(--coral)'; b.setAttribute('aria-label', 'Fila ' + (y + 1) + ', columna ' + (x + 1) + (v === 1 ? ', pintada' : v === 2 ? ', marcada' : ', vacía')); }
      function poner(y, x, v) { if (hecho || tab[y][x] === v) return; tab[y][x] = v; ver(y, x); if (L.nonoCumple(q, tab.map(function (f) { return f.map(function (z) { return z === 1 ? 1 : 0; }); }))) { hecho = true; setTimeout(function () { ctx.ganar(3); }, 400); } }
      var arrastrando = null;
      botones.forEach(function (fila, y) { fila.forEach(function (b, x) {
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); try { b.releasePointerCapture(e.pointerId); } catch (x) { } var nuevo = tab[y][x] === modo ? 0 : modo; arrastrando = nuevo; poner(y, x, nuevo); });
        b.addEventListener('pointerenter', function () { if (arrastrando !== null) poner(y, x, arrastrando); });
      }); });
      var fin = function () { arrastrando = null; }; document.addEventListener('pointerup', fin); ctx.limpiar(function () { document.removeEventListener('pointerup', fin); });
      var selModo = h('div', { class: 'sel', role: 'group', 'aria-label': 'Modo' }), pint = function () { selModo.innerHTML = ''; [[1, 'Pintar'], [2, 'Marcar ×']].forEach(function (o) { selModo.appendChild(h('button', { type: 'button', 'aria-pressed': String(modo === o[0]), onclick: function () { modo = o[0]; pint(); } }, o[1])); }); }; pint();
      el.appendChild(h('div', { class: 'estado' }, h('span', null, n + '×' + n)));
      el.appendChild(selModo);
      el.appendChild(h('div', { style: 'max-width:100%;overflow-x:auto;padding:4px' }, grid));
      el.appendChild(h('p', { class: 'centro', style: 'font-size:16px;color:var(--muted)' }, 'Tocá o arrastrá para pintar. Con “Marcar ×” señalás las casillas que seguro están vacías.'));
      el.appendChild(h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: ctx.reiniciar }, 'Reiniciar'));
    }
  });
})();
