/* Torres de Hanoi — 8 niveles (de 3 a 10 discos). Se toca la torre de origen y después la de destino. */
(function () {
  var U = VEJ.util, h = U.h, COL = ['#0B5FA5', '#FFC93C', '#D93A32', '#0C7F6D'];
  VEJ.juego({
    id: 'hanoi', nombre: 'Torres de Hanoi', desc: 'Pasá los discos con la menor cantidad de movimientos.', tipo: 'niveles', niveles: 8,
    montar: function (el, ctx) {
      var n = ctx.nivel + 2, minimo = Math.pow(2, n) - 1, torres = [[], [], []], sel = -1, movs = 0;
      for (var d = n; d >= 1; d--) torres[0].push(d);
      var cont = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:520px' }), info = h('span', null, 'Movimientos: 0'), msj = h('div', { role: 'status', class: 'centro', style: 'min-height:28px' });
      var altoDisco = Math.max(16, Math.min(30, 230 / n));
      function pintar() {
        cont.innerHTML = '';
        torres.forEach(function (t, i) {
          var col = h('button', { type: 'button', 'aria-label': 'Torre ' + (i + 1) + (t.length ? ', disco de arriba ' + t[t.length - 1] : ', vacía') + (sel === i ? ', seleccionada' : ''), style: 'min-height:' + (altoDisco * n + 40) + 'px;border:3px solid ' + (sel === i ? 'var(--sol)' : 'var(--line)') + ';background:' + (sel === i ? 'rgba(255,201,60,.18)' : 'var(--card)') + ';border-radius:18px;display:flex;flex-direction:column-reverse;align-items:center;gap:3px;padding:8px 4px;position:relative;overflow:hidden', onclick: function () { tocar(i); } });
          col.appendChild(h('span', { style: 'position:absolute;bottom:0;top:12px;width:8px;background:var(--line);border-radius:4px;z-index:0', 'aria-hidden': 'true' }));
          t.forEach(function (disco) { col.appendChild(h('span', { 'aria-hidden': 'true', style: 'z-index:1;height:' + altoDisco + 'px;width:' + (28 + disco * (68 / n)) + '%;max-width:96%;background:' + COL[disco % 4] + ';border-radius:10px;box-shadow:0 2px 0 rgba(14,34,51,.3)' })); });
          cont.appendChild(col);
        });
        info.textContent = 'Movimientos: ' + movs;
      }
      function tocar(i) {
        if (torres[2].length === n) return;
        if (sel < 0) { if (torres[i].length) { sel = i; pintar(); } return; }
        if (sel === i) { sel = -1; pintar(); return; }
        var o = torres[sel], d = torres[i], disco = o[o.length - 1];
        if (d.length && d[d.length - 1] < disco) { msj.textContent = 'Un disco grande no puede ir sobre uno más chico.'; sel = -1; pintar(); return; }
        msj.textContent = ''; d.push(o.pop()); sel = -1; movs++; pintar();
        if (torres[2].length === n) setTimeout(function () { ctx.ganar(movs <= minimo ? 3 : movs <= minimo * 1.5 ? 2 : 1); }, 400);
      }
      el.appendChild(h('div', { class: 'estado' }, info, h('span', null, 'Discos: ' + n), h('span', null, 'Mínimo: ' + minimo)));
      el.appendChild(h('p', { class: 'centro' }, 'Llevá todos los discos a la torre de la derecha. Tocá una torre y después la de destino.'));
      el.appendChild(cont); el.appendChild(msj);
      el.appendChild(h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: ctx.reiniciar }, 'Reiniciar'));
      pintar();
    }
  });
})();
