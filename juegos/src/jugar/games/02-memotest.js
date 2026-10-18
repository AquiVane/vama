/* Memotest — 150 niveles. Las parejas son símbolos geométricos (forma × color de la marca). */
(function () {
  var U = VEJ.util, h = U.h, L = VEJ.lib;
  var COL = ['#0B5FA5', '#FFC93C', '#D93A32', '#0C7F6D'], FORMAS = [
    function (c) { return '<circle cx="50" cy="50" r="30" fill="' + c + '"/>'; },
    function (c) { return '<rect x="22" y="22" width="56" height="56" rx="8" fill="' + c + '"/>'; },
    function (c) { return '<path d="M50 18 L84 78 L16 78 Z" fill="' + c + '"/>'; },
    function (c) { return '<path d="M50 14l10.6 24.4 26.4 2.4-20 17.6 6 26L50 70.4 27 84.4l6-26-20-17.6 26.4-2.4z" fill="' + c + '"/>'; },
    function (c) { return '<path d="M50 14 L84 50 L50 86 L16 50 Z" fill="' + c + '"/>'; },
    function (c) { return '<path d="M38 16h24v22h22v24H62v22H38V62H16V38h22z" fill="' + c + '"/>'; }
  ];
  function simbolo(i) { return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' + FORMAS[i % 6](COL[((i / 6) | 0) % 4]) + '</svg>'; }
  var NOMBRES = ['círculo', 'cuadrado', 'triángulo', 'estrella', 'rombo', 'cruz'], COLN = ['azul', 'amarillo', 'rojo', 'verde'];
  var nombre = function (i) { return NOMBRES[i % 6] + ' ' + COLN[((i / 6) | 0) % 4]; };

  VEJ.juego({
    id: 'memotest', nombre: 'Memotest', desc: '150 niveles para entrenar la memoria.', tipo: 'niveles', niveles: 150,
    montar: function (el, ctx) {
      var n = ctx.nivel, pares = Math.min(18, 3 + Math.floor((n - 1) / 10)), cartas = pares * 2;
      var cols = cartas <= 12 ? 3 : cartas <= 16 ? 4 : cartas <= 20 ? 5 : 6;
      var r = U.rng(n * 31337 + 5), simb = U.mezclar(Array.apply(null, Array(24)).map(function (_, i) { return i; }), r).slice(0, pares);
      var mazo = U.mezclar(simb.concat(simb), r), abiertas = [], encontradas = 0, movs = 0, bloqueado = false, demora = n > 75 ? 550 : 800;
      var estadoMov = h('span', null, 'Movimientos: 0'), estadoPar = h('span', null, 'Parejas: 0 de ' + pares);
      var tab = h('div', { class: 'tablero', style: 'grid-template-columns:repeat(' + cols + ',1fr);gap:8px;max-width:min(100%,' + (cols * 110) + 'px)' });
      var botones = mazo.map(function (s, i) {
        var b = h('button', { type: 'button', class: 'carta', 'aria-label': 'Carta ' + (i + 1) + ', boca abajo', style: 'aspect-ratio:1;border:0;border-radius:16px;background:var(--azul);color:#fff;padding:0;min-height:56px;display:flex;align-items:center;justify-content:center;font:800 24px Bricolage Grotesque,sans-serif;box-shadow:0 4px 0 rgba(14,34,51,.25)', onclick: function () { voltear(i); } }, '?');
        return b;
      });
      botones.forEach(function (b) { tab.appendChild(b); });
      function mostrar(i) { var b = botones[i]; b.innerHTML = simbolo(mazo[i]); b.style.background = '#fff'; b.style.padding = '10%'; b.setAttribute('aria-label', 'Carta ' + (i + 1) + ': ' + nombre(mazo[i])); }
      function ocultar(i) { var b = botones[i]; b.textContent = '?'; b.style.background = 'var(--azul)'; b.style.padding = '0'; b.setAttribute('aria-label', 'Carta ' + (i + 1) + ', boca abajo'); }
      function voltear(i) {
        if (bloqueado || abiertas.indexOf(i) >= 0 || botones[i].dataset.ok) return;
        mostrar(i); abiertas.push(i);
        if (abiertas.length < 2) return;
        movs++; estadoMov.textContent = 'Movimientos: ' + movs;
        var a = abiertas[0], b = abiertas[1]; abiertas = [];
        if (mazo[a] === mazo[b]) {
          botones[a].dataset.ok = botones[b].dataset.ok = '1'; botones[a].style.outline = botones[b].style.outline = '4px solid var(--verde)'; encontradas++; estadoPar.textContent = 'Parejas: ' + encontradas + ' de ' + pares;
          if (encontradas === pares) setTimeout(function () { ctx.ganar(movs <= pares * 1.6 ? 3 : movs <= pares * 2.5 ? 2 : 1); }, 500);
        } else {
          bloqueado = true; var t = setTimeout(function () { ocultar(a); ocultar(b); bloqueado = false; }, demora); ctx.limpiar(function () { clearTimeout(t); });
        }
      }
      el.appendChild(h('div', { class: 'estado' }, estadoMov, estadoPar));
      el.appendChild(tab);
      el.appendChild(h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: ctx.reiniciar }, 'Reiniciar nivel'));
    }
  });
})();
