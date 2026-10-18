/* Puzzle deslizante — 30 niveles (3×3, 4×4 y 5×5) con una imagen de playa dibujada en el momento. */
(function () {
  var U = VEJ.util, h = U.h;
  var imagen = null;
  function dibujar() {
    if (imagen) return imagen;
    var cv = document.createElement('canvas'); cv.width = cv.height = 600; var g = cv.getContext('2d');
    var c = VEJ.marca.colores || {}, azul = c.azul || '#0B5FA5', sol = c.amarillo || '#FFC93C', coral = c.coral || '#D93A32', verde = c.verde || '#0C7F6D';
    var cielo = g.createLinearGradient(0, 0, 0, 360); cielo.addColorStop(0, '#8FD3F4'); cielo.addColorStop(1, '#F4FAFC'); g.fillStyle = cielo; g.fillRect(0, 0, 600, 600);
    g.fillStyle = sol; g.beginPath(); g.arc(470, 120, 70, 0, 7); g.fill();
    g.strokeStyle = sol; g.lineWidth = 8; g.lineCap = 'round'; for (var a = 0; a < 12; a++) { var an = a * Math.PI / 6; g.beginPath(); g.moveTo(470 + Math.cos(an) * 92, 120 + Math.sin(an) * 92); g.lineTo(470 + Math.cos(an) * 120, 120 + Math.sin(an) * 120); g.stroke(); }
    g.fillStyle = azul; g.fillRect(0, 300, 600, 130);
    g.strokeStyle = '#fff'; g.lineWidth = 6; for (var w = 0; w < 4; w++) { g.beginPath(); for (var x = 0; x <= 600; x += 10) g.lineTo(x, 330 + w * 28 + Math.sin(x / 28 + w) * 7); g.stroke(); }
    g.fillStyle = '#F2D49B'; g.fillRect(0, 430, 600, 170);
    g.fillStyle = '#0E2233'; g.fillRect(148, 270, 10, 230);
    g.fillStyle = coral; g.beginPath(); g.moveTo(60, 290); g.quadraticCurveTo(153, 140, 246, 290); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(106, 290); g.quadraticCurveTo(124, 190, 153, 175); g.quadraticCurveTo(140, 230, 153, 290); g.closePath(); g.fill();
    g.fillStyle = verde; g.beginPath(); g.moveTo(400, 560); g.quadraticCurveTo(440, 460, 520, 470); g.quadraticCurveTo(470, 500, 460, 560); g.closePath(); g.fill();
    g.fillStyle = sol; g.fillRect(300, 480, 130, 22); g.fillStyle = coral; g.fillRect(300, 502, 130, 22);
    g.fillStyle = azul; g.beginPath(); g.arc(240, 540, 26, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(240, 540, 12, 0, 7); g.fill();
    imagen = cv.toDataURL('image/png'); return imagen;
  }
  VEJ.juego({
    id: 'puzzle', nombre: 'Puzzle deslizante', desc: 'Deslizá las piezas hasta armar la imagen.', tipo: 'niveles', niveles: 30,
    montar: function (el, ctx) {
      var k = ctx.nivel <= 10 ? 3 : ctx.nivel <= 20 ? 4 : 5, total = k * k, r = U.rng(ctx.nivel * 6007 + 1);
      var orden = []; for (var i = 0; i < total; i++) orden.push(i);               // orden[posicion] = pieza (total-1 = hueco)
      var vacio = total - 1, previo = -1, mezcla = 25 + ctx.nivel * 6 + k * 10;
      for (var m = 0; m < mezcla; m++) {                                         // se mezcla con movimientos legales: siempre tiene solución
        var vec = vecinos(vacio).filter(function (x) { return x !== previo; }), q = vec[Math.floor(r() * vec.length)];
        orden[vacio] = orden[q]; orden[q] = total - 1; previo = vacio; vacio = q;
      }
      if (orden.every(function (v, i) { return v === i; })) { orden[vacio] = orden[vacio - 1]; orden[vacio - 1] = total - 1; vacio--; }
      var movs = 0, hecho = false, tab = h('div', { 'data-tablero': '1', role: 'grid', 'aria-label': 'Puzzle de ' + k + ' por ' + k, style: 'position:relative;width:min(100%,460px);aspect-ratio:1;border:3px solid var(--azul);border-radius:12px;overflow:hidden;background:var(--card)' }), info = h('span', null, 'Movimientos: 0'), piezas = [];
      function vecinos(i) { var r0 = (i / k) | 0, c = i % k, o = []; if (r0 > 0) o.push(i - k); if (r0 < k - 1) o.push(i + k); if (c > 0) o.push(i - 1); if (c < k - 1) o.push(i + 1); return o; }
      var src = dibujar();
      for (var p = 0; p < total - 1; p++) piezas.push(h('button', { type: 'button', class: 'pz', style: 'position:absolute;border:1px solid rgba(255,255,255,.7);padding:0;background:url(' + src + ') ' + ((p % k) * 100 / (k - 1)) + '% ' + (((p / k) | 0) * 100 / (k - 1)) + '% / ' + (k * 100) + '% ' + (k * 100) + '%;width:' + (100 / k) + '%;height:' + (100 / k) + '%;transition:left .12s,top .12s;border-radius:6px', 'aria-label': 'Pieza ' + (p + 1), onclick: (function (p) { return function () { tocar(p); }; })(p) }, h('span', { style: 'position:absolute;left:4px;top:2px;font:800 13px sans-serif;color:#fff;text-shadow:0 1px 2px #000;pointer-events:none' }, String(p + 1))));
      piezas.forEach(function (b) { tab.appendChild(b); });
      function pos() { orden.forEach(function (pz, i) { if (pz === total - 1) return; var b = piezas[pz]; b.style.left = (i % k) * 100 / k + '%'; b.style.top = ((i / k) | 0) * 100 / k + '%'; }); info.textContent = 'Movimientos: ' + movs; }
      function tocar(pz) {
        if (hecho) return; var i = orden.indexOf(pz), v = orden.indexOf(total - 1);
        if (vecinos(i).indexOf(v) < 0) return;
        orden[v] = pz; orden[i] = total - 1; movs++; pos();
        if (orden.every(function (x, j) { return x === j; })) { hecho = true; setTimeout(function () { ctx.ganar(movs <= mezcla ? 3 : movs <= mezcla * 2 ? 2 : 1); }, 350); }
      }
      el.appendChild(h('div', { class: 'estado' }, info, h('span', null, k + '×' + k)));
      el.appendChild(tab);
      el.appendChild(h('p', { class: 'centro', style: 'font-size:16px' }, 'Tocá una pieza pegada al hueco para deslizarla.'));
      el.appendChild(h('div', { class: 'fila', style: 'width:100%;max-width:460px;align-items:center' }, h('img', { src: src, alt: 'Imagen terminada de referencia', width: 96, height: 96, style: 'border-radius:12px;flex:none;width:96px;height:96px' }), h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: ctx.reiniciar }, 'Reiniciar')));
      pos();
    }
  });
})();
