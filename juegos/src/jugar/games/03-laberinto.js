/* Laberinto — 200 niveles. Se mueve deslizando el dedo (corre por el pasillo hasta una bifurcación), con los botones o con el teclado. */
(function () {
  var U = VEJ.util, h = U.h, L = VEJ.lib;
  VEJ.juego({
    id: 'laberinto', nombre: 'Laberinto', desc: '200 laberintos, cada vez más enredados.', tipo: 'niveles', niveles: 200,
    montar: function (el, ctx) {
      var m = L.laberinto(ctx.nivel), n = m.n, D = L.laberintoDirs, mejor = L.laberintoCamino(m), pos = m.inicio, pasos = 0, visitadas = {}; visitadas[pos] = 1;
      var lado = Math.min(window.innerWidth - 32, window.innerHeight - 300, 520); lado = Math.max(lado, 220);
      var cv = h('canvas', { width: 800, height: 800, role: 'img', 'aria-label': 'Laberinto de ' + n + ' por ' + n + '. Llegá a la salida, abajo a la derecha.', style: 'width:' + lado + 'px;height:' + lado + 'px;background:var(--card);border:3px solid var(--azul);border-radius:12px' });
      var g = cv.getContext('2d'), cel = 800 / n, pasosEl = h('span', null, 'Pasos: 0');
      function color(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#0B5FA5'; }
      function dibujar() {
        cv.setAttribute('data-pos', pos); g.clearRect(0, 0, 800, 800);
        var azul = color('--azul'), sol = color('--sol'), coral = color('--coral'), verde = color('--verde'), fg = color('--fg') || '#0E2233';
        g.fillStyle = verde; g.globalAlpha = .25; g.fillRect((n - 1) * cel, (n - 1) * cel, cel, cel); g.globalAlpha = 1;
        g.fillStyle = sol; g.globalAlpha = .35; for (var k in visitadas) { g.fillRect((k % n) * cel + cel * .3, ((k / n) | 0) * cel + cel * .3, cel * .4, cel * .4); } g.globalAlpha = 1;
        g.strokeStyle = fg; g.lineWidth = Math.max(3, 14 - n * .45); g.lineCap = 'round'; g.beginPath();
        for (var i = 0; i < n * n; i++) {
          var x = (i % n) * cel, y = ((i / n) | 0) * cel, c = m.celdas[i];
          if (!(c & D.N)) { g.moveTo(x, y); g.lineTo(x + cel, y); } if (!(c & D.O)) { g.moveTo(x, y); g.lineTo(x, y + cel); }
          if (i % n === n - 1 && !(c & D.E)) { g.moveTo(x + cel, y); g.lineTo(x + cel, y + cel); } if (((i / n) | 0) === n - 1 && !(c & D.S)) { g.moveTo(x, y + cel); g.lineTo(x + cel, y + cel); }
        }
        g.stroke();
        g.fillStyle = coral; g.beginPath(); g.arc((pos % n) * cel + cel / 2, ((pos / n) | 0) * cel + cel / 2, cel * .32, 0, 7); g.fill();
        g.fillStyle = verde; g.font = '800 ' + Math.round(cel * .55) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('S', (n - .5) * cel, (n - .5) * cel);
      }
      function abiertas(c) { var o = 0, v = m.celdas[c]; [D.N, D.E, D.S, D.O].forEach(function (d) { if (v & d) o++; }); return o; }
      function mover(d) {
        var moved = false;
        for (var guard = 0; guard < 400; guard++) {
          if (!(m.celdas[pos] & d)) break;
          pos = (((pos / n) | 0) + D.DY[d]) * n + (pos % n) + D.DX[d]; pasos++; moved = true; visitadas[pos] = 1;
          if (pos === m.fin) break;
          if (abiertas(pos) !== 2) break;   // bifurcación o callejón: frena
          var opuesto = { 1: 4, 2: 8, 4: 1, 8: 2 }[d], siguiente = null;
          [D.N, D.E, D.S, D.O].forEach(function (x) { if ((m.celdas[pos] & x) && x !== opuesto) siguiente = x; });
          if (!siguiente) break; d = siguiente;
        }
        if (!moved) return;
        pasosEl.textContent = 'Pasos: ' + pasos; dibujar();
        if (pos === m.fin) setTimeout(function () { ctx.ganar(pasos <= mejor * 1.25 ? 3 : pasos <= mejor * 2 ? 2 : 1); }, 250);
      }
      // deslizar con el dedo
      var ini = null;
      cv.addEventListener('pointerdown', function (e) { ini = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (x) { } });
      cv.addEventListener('pointerup', function (e) {
        if (!ini) return; var dx = e.clientX - ini.x, dy = e.clientY - ini.y; ini = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) { // toque: hacia donde se tocó respecto del jugador
          var r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * n - ((pos % n) + .5), py = (e.clientY - r.top) / r.height * n - (((pos / n) | 0) + .5); dx = px; dy = py;
        }
        mover(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? D.E : D.O) : (dy > 0 ? D.S : D.N));
      });
      function tecla(e) { var d = { ArrowUp: D.N, ArrowRight: D.E, ArrowDown: D.S, ArrowLeft: D.O }[e.key]; if (d) { e.preventDefault(); mover(d); } }
      document.addEventListener('keydown', tecla); ctx.limpiar(function () { document.removeEventListener('keydown', tecla); });
      function flecha(txt, d, rot) { return h('button', { class: 'btn', type: 'button', 'aria-label': txt, style: 'min-height:56px;min-width:56px;padding:0', onclick: function () { mover(d); }, html: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" style="transform:rotate(' + rot + 'deg)"><path d="M12 5l7 8h-4v6h-6v-6H5z" fill="#fff"/></svg>' }); }
      el.appendChild(h('div', { class: 'estado' }, pasosEl, h('span', null, 'Tamaño: ' + n + '×' + n)));
      el.appendChild(cv);
      el.appendChild(h('p', { class: 'centro', style: 'font-size:16px' }, 'Deslizá el dedo o usá las flechas. Salida: abajo a la derecha (S).'));
      el.appendChild(h('div', { style: 'display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center' }, h('span'), flecha('Arriba', D.N, 0), h('span'), flecha('Izquierda', D.O, -90), flecha('Abajo', D.S, 180), flecha('Derecha', D.E, 90)));
      dibujar();
    }
  });
})();
