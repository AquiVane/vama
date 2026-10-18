/* Sudoku — 200 niveles (5 tramos de dificultad), cada tablero con solución única. */
(function () {
  var U = VEJ.util, h = U.h, L = VEJ.lib;
  VEJ.juego({
    id: 'sudoku', nombre: 'Sudoku', desc: '200 niveles, del fácil al experto.', tipo: 'niveles', niveles: 200,
    montar: function (el, ctx) {
      var s = L.sudoku(ctx.nivel), val = s.puzzle.slice(), fija = s.puzzle.map(Boolean), sel = -1, errores = 0, pistas = 0, hecho = false;
      var celdas = [], tab = h('div', { 'data-tablero': '1', role: 'grid', 'aria-label': 'Tablero de Sudoku', style: 'display:grid;grid-template-columns:repeat(9,1fr);width:min(100%,460px);aspect-ratio:1;border:3px solid var(--fg);border-radius:8px;overflow:hidden;background:var(--card)' });
      var infoErr = h('span', null, 'Errores: 0');
      function conflicto(i) {
        var v = val[i]; if (!v) return false; var r = (i / 9) | 0, c = i % 9, br = r - r % 3, bc = c - c % 3;
        for (var k = 0; k < 9; k++) { if (k !== c && val[r * 9 + k] === v) return true; if (k !== r && val[k * 9 + c] === v) return true; }
        for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) { var j = (br + a) * 9 + bc + b; if (j !== i && val[j] === v) return true; }
        return false;
      }
      function pintar() {
        celdas.forEach(function (b, i) {
          var r = (i / 9) | 0, c = i % 9, v = val[i], igual = sel >= 0 && val[sel] && v === val[sel], misma = sel >= 0 && ((r === ((sel / 9) | 0)) || (c === sel % 9) || ((r / 3 | 0) === ((sel / 9 | 0) / 3 | 0) && (c / 3 | 0) === ((sel % 9) / 3 | 0)));
          b.textContent = v || '';
          b.style.background = i === sel ? 'var(--sol)' : igual ? 'rgba(11,95,165,.35)' : misma ? 'rgba(11,95,165,.12)' : 'transparent';
          b.style.color = i === sel ? '#0E2233' : conflicto(i) ? 'var(--coral)' : fija[i] ? 'var(--fg)' : 'var(--azul)';
          b.style.fontWeight = fija[i] ? '800' : '600';
          b.setAttribute('aria-label', 'Fila ' + (r + 1) + ', columna ' + (c + 1) + (v ? ', ' + v : ', vacía') + (fija[i] ? ', dato inicial' : ''));
        });
        infoErr.textContent = 'Errores: ' + errores;
      }
      for (var i = 0; i < 81; i++) (function (i) {
        var r = (i / 9) | 0, c = i % 9;
        var b = h('button', { type: 'button', role: 'gridcell', style: 'border:0;padding:0;font:inherit;font-size:clamp(18px,5.4vw,26px);border-right:' + (c % 3 === 2 && c < 8 ? '3px solid var(--fg)' : '1px solid var(--line)') + ';border-bottom:' + (r % 3 === 2 && r < 8 ? '3px solid var(--fg)' : '1px solid var(--line)') + ';aspect-ratio:1;min-width:0', onclick: function () { sel = i; pintar(); } });
        celdas.push(b); tab.appendChild(b);
      })(i);
      function poner(d) {
        if (hecho || sel < 0 || fija[sel]) return;
        if (d && d !== s.solucion[sel]) errores++;
        val[sel] = d; pintar(); comprobar();
      }
      function comprobar() {
        if (val.every(function (v, i) { return v === s.solucion[i]; })) { hecho = true; setTimeout(function () { ctx.ganar(errores === 0 && pistas === 0 ? 3 : errores <= 3 ? 2 : 1); }, 350); }
      }
      function pista() { if (hecho || pistas >= 3) return; var vacias = []; val.forEach(function (v, i) { if (v !== s.solucion[i]) vacias.push(i); }); if (!vacias.length) return; sel = sel >= 0 && vacias.indexOf(sel) >= 0 ? sel : vacias[0]; val[sel] = s.solucion[sel]; fija[sel] = true; pistas++; pistaBtn.textContent = 'Pista (' + (3 - pistas) + ')'; pintar(); comprobar(); }
      function tecla(e) { if (/^[1-9]$/.test(e.key)) poner(+e.key); else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') poner(0); else if (sel >= 0 && /^Arrow/.test(e.key)) { e.preventDefault(); var d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key]; var n = sel + d; if (n >= 0 && n < 81 && !(Math.abs(d) === 1 && ((n / 9) | 0) !== ((sel / 9) | 0))) { sel = n; pintar(); } } }
      document.addEventListener('keydown', tecla); ctx.limpiar(function () { document.removeEventListener('keydown', tecla); });
      var pad = h('div', { style: 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px;width:min(100%,460px)' });
      for (var d = 1; d <= 9; d++) (function (d) { pad.appendChild(h('button', { class: 'btn', type: 'button', style: 'min-height:56px;padding:0;font-size:24px', onclick: function () { poner(d); } }, String(d))); })(d);
      pad.appendChild(h('button', { class: 'btn coral', type: 'button', style: 'min-height:56px;padding:0;font-size:16px', 'aria-label': 'Borrar', onclick: function () { poner(0); } }, 'Borrar'));
      var pistaBtn = h('button', { class: 'btn sol', type: 'button', style: 'min-height:48px', onclick: pista }, 'Pista (3)');
      el.appendChild(h('div', { class: 'estado' }, infoErr, h('span', null, 'Dificultad: ' + ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Experto'][Math.min(4, ((ctx.nivel - 1) / 40) | 0)])));
      el.appendChild(tab); el.appendChild(pad); el.appendChild(pistaBtn);
      sel = val.findIndex(function (v) { return !v; }); pintar();
    }
  });
})();
