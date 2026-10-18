/* Anagramas — 100 niveles: ordená las letras y descubrí la palabra (cada vez más largas). */
(function () {
  var U = VEJ.util, h = U.h, L = VEJ.lib;
  var POOL = L.PALABRAS.concat('ESCALERA TELEFONO VENTANA CUADERNO LAPICERA CAMPERA ZAPATILLA PELOTA BICICLETA GUITARRA MARTILLO ESPEJO CORTINA ALMOHADA REFRIGERADOR COMPUTADORA TELEVISOR CHOCOLATE MERMELADA'.split(' '))
    .filter(function (w, i, a) { return a.indexOf(w) === i && w.length >= 4 && w.length <= 11; }).sort(function (a, b) { return a.length - b.length || (a < b ? -1 : 1); });
  VEJ.juego({
    id: 'anagramas', nombre: 'Anagramas', desc: 'Ordená las letras y descubrí la palabra.', tipo: 'niveles', niveles: 100,
    montar: function (el, ctx) {
      var n = ctx.nivel, largo = Math.min(10, 4 + Math.floor((n - 1) / 17)), cand = POOL.filter(function (w) { return w.length === largo; });
      var r = U.rng(n * 977 + 3), palabra = cand[Math.floor(r() * cand.length)], letras, intentos = 0;
      do { letras = U.mezclar(palabra.split(''), r); intentos++; } while (letras.join('') === palabra && intentos < 20);
      var usado = letras.map(function () { return false; }), respuesta = [], pistas = 0, fallos = 0;
      var slots = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:56px', 'aria-live': 'polite' }), banco = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center' }), msj = h('div', { role: 'status' });
      function pintar() {
        slots.innerHTML = ''; banco.innerHTML = '';
        for (var i = 0; i < largo; i++) slots.appendChild(h('span', { class: 'gran', style: 'width:' + Math.min(44, 300 / largo) + 'px;height:56px;border-bottom:4px solid var(--azul);display:flex;align-items:center;justify-content:center;font-size:28px' }, respuesta[i] != null ? letras[respuesta[i]] : ''));
        letras.forEach(function (l, i) { banco.appendChild(h('button', { class: 'btn', type: 'button', disabled: usado[i], style: 'min-width:52px;min-height:56px;padding:0;font-size:24px;' + (usado[i] ? 'opacity:.25' : ''), 'aria-label': 'Letra ' + l, onclick: function () { poner(i); } }, l)); });
      }
      function poner(i) {
        if (usado[i] || respuesta.length >= largo) return; usado[i] = true; respuesta.push(i); pintar();
        if (respuesta.length === largo) {
          var intento = respuesta.map(function (k) { return letras[k]; }).join('');
          if (intento === palabra) { msj.innerHTML = ''; setTimeout(function () { ctx.ganar(pistas === 0 && fallos === 0 ? 3 : pistas + fallos <= 2 ? 2 : 1); }, 300); }
          else { fallos++; msj.innerHTML = ''; msj.appendChild(h('div', { class: 'msg mal centro' }, 'Esa no es. Probá otra vez.')); setTimeout(function () { respuesta = []; usado = letras.map(function () { return false; }); pintar(); }, 700); }
        }
      }
      function borrar() { if (!respuesta.length) return; usado[respuesta.pop()] = false; msj.innerHTML = ''; pintar(); }
      function pista() {
        if (pistas >= 2) return; pistas++;
        respuesta = []; usado = letras.map(function () { return false; });
        for (var k = 0; k < pistas; k++) { var idx = letras.findIndex(function (l, j) { return l === palabra[k] && !usado[j]; }); usado[idx] = true; respuesta.push(idx); }
        pistaBtn.textContent = 'Pista (' + (2 - pistas) + ')'; pintar();
      }
      var pistaBtn = h('button', { class: 'btn sol', type: 'button', onclick: pista }, 'Pista (2)');
      el.appendChild(h('p', { class: 'centro' }, 'Ordená las letras para formar una palabra de ' + largo + ' letras.'));
      el.appendChild(slots); el.appendChild(msj); el.appendChild(banco);
      el.appendChild(h('div', { class: 'fila', style: 'width:100%;max-width:420px' }, h('button', { class: 'btn coral', type: 'button', onclick: borrar }, 'Borrar'), pistaBtn));
      pintar();
    }
  });
})();
