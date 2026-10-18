/* Sudoku: 200 niveles con solución ÚNICA garantizada (se verifica con un resolvedor al quitar cada pista). */
(function (g) {
  var L = g.VEJL = g.VEJL || {};
  var BITS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256];
  function posibles(grid, i) { // máscara de dígitos posibles en la celda i
    var r = (i / 9) | 0, c = i % 9, m = 0, k;
    for (k = 0; k < 9; k++) { m |= BITS[grid[r * 9 + k]] | BITS[grid[k * 9 + c]]; }
    var br = r - r % 3, bc = c - c % 3;
    for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) m |= BITS[grid[(br + a) * 9 + bc + b]];
    return 511 & ~m;
  }
  function bitsA(m) { var o = []; for (var d = 1; d <= 9; d++) if (m & (1 << (d - 1))) o.push(d); return o; }
  // Cuenta soluciones (hasta `limite`) y devuelve la primera encontrada en sol[]
  function resolver(grid, limite, sol) {
    var n = 0;
    (function bt() {
      if (n >= limite) return;
      var mejor = -1, mm = 0, mc = 10;
      for (var i = 0; i < 81; i++) if (!grid[i]) { var m = posibles(grid, i), c = bitsA(m).length; if (c < mc) { mc = c; mejor = i; mm = m; if (c <= 1) break; } }
      if (mejor < 0) { n++; if (sol && n === 1) for (var k = 0; k < 81; k++) sol[k] = grid[k]; return; }
      if (mc === 0) return;
      var ds = bitsA(mm);
      for (var j = 0; j < ds.length && n < limite; j++) { grid[mejor] = ds[j]; bt(); }
      grid[mejor] = 0;
    })();
    return n;
  }
  function solucionBase(r) {
    var nums = L.mezclar([1, 2, 3, 4, 5, 6, 7, 8, 9], r), filas = [], cols = [], i;
    var bandas = L.mezclar([0, 1, 2], r), pilas = L.mezclar([0, 1, 2], r);
    bandas.forEach(function (b) { L.mezclar([0, 1, 2], r).forEach(function (f) { filas.push(b * 3 + f); }); });
    pilas.forEach(function (s) { L.mezclar([0, 1, 2], r).forEach(function (c) { cols.push(s * 3 + c); }); });
    var out = new Array(81);
    for (var rr = 0; rr < 9; rr++) for (var cc = 0; cc < 9; cc++) out[rr * 9 + cc] = nums[(3 * (filas[rr] % 3) + ((filas[rr] / 3) | 0) + cols[cc]) % 9];
    return out;
  }
  // nivel 1..200 → 5 tiers de 40: pistas objetivo 46 → 24
  L.sudokuPistas = function (nivel) { var tier = Math.min(4, ((nivel - 1) / 40) | 0), dentro = (nivel - 1) % 40; return [46, 40, 34, 30, 26][tier] - Math.round(dentro / 40 * 4); };
  L.sudoku = function (nivel) {
    var r = L.rng(nivel * 7919 + 13), sol = solucionBase(r), puz = sol.slice(), objetivo = L.sudokuPistas(nivel), pistas = 81;
    var orden = L.mezclar(Array.apply(null, Array(81)).map(function (_, i) { return i; }), r);
    for (var k = 0; k < orden.length && pistas > objetivo; k++) {
      var i = orden[k], v = puz[i]; puz[i] = 0;
      if (resolver(puz.slice(), 2) !== 1) puz[i] = v; else pistas--;
    }
    return { puzzle: puz, solucion: sol, pistas: pistas };
  };
  L.sudokuResolver = resolver;
  L.sudokuPosibles = function (grid, i) { return bitsA(posibles(grid, i)); };
})(typeof window !== 'undefined' ? window : globalThis);
