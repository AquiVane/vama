/* Nonogramas: 60 niveles (5x5 → 12x12). La imagen sale de una semilla con simetría (parece una figura); se acepta cualquier tablero que cumpla las pistas. */
(function (g) {
  var L = g.VEJL = g.VEJL || {};
  L.NONO_NIVELES = 60;
  L.nonoTam = function (nivel) { return 5 + Math.floor((nivel - 1) / 9); };  // 5…11
  function pistas(linea) { var o = [], c = 0; for (var i = 0; i < linea.length; i++) { if (linea[i]) c++; else if (c) { o.push(c); c = 0; } } if (c) o.push(c); return o.length ? o : [0]; }
  L.nonoPistas = pistas;
  L.nonograma = function (nivel) {
    var n = L.nonoTam(nivel), r = L.rng(nivel * 2654435761 % 4294967296 + 11), densidad = 0.5 + (nivel % 3) * 0.05, img;
    for (var intento = 0; intento < 100; intento++) {
      img = []; for (var y = 0; y < n; y++) { img.push([]); }
      for (y = 0; y < n; y++) for (var x = 0; x < Math.ceil(n / 2); x++) { var v = r() < densidad ? 1 : 0; img[y][x] = v; img[y][n - 1 - x] = v; }
      var filasOk = img.every(function (f) { return f.some(Boolean); }), colsOk = true;
      for (x = 0; x < n; x++) if (!img.some(function (f) { return f[x]; })) colsOk = false;
      if (filasOk && colsOk) break;
    }
    var filas = img.map(pistas), cols = []; for (var c = 0; c < n; c++) cols.push(pistas(img.map(function (f) { return f[c]; })));
    return { n: n, img: img, filas: filas, cols: cols };
  };
  // ¿el tablero del jugador (matriz 0/1) cumple todas las pistas?
  L.nonoCumple = function (nono, tab) {
    var n = nono.n, eq = function (a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); };
    for (var y = 0; y < n; y++) if (!eq(pistas(tab[y]), nono.filas[y])) return false;
    for (var x = 0; x < n; x++) if (!eq(pistas(tab.map(function (f) { return f[x]; })), nono.cols[x])) return false;
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
