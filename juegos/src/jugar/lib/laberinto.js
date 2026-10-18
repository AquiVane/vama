/* Laberinto: 200 niveles con semilla. Construido con "backtracker" iterativo → siempre tiene solución única entre entrada y salida. */
(function (g) {
  var L = g.VEJL = g.VEJL || {};
  var N = 1, E = 2, S = 4, O = 8, DX = { 1: 0, 2: 1, 4: 0, 8: -1 }, DY = { 1: -1, 2: 0, 4: 1, 8: 0 }, OPUESTO = { 1: 4, 2: 8, 4: 1, 8: 2 };
  L.laberintoTam = function (nivel) { return 5 + Math.floor((nivel - 1) / 12); };   // 5x5 … 21x21
  L.laberinto = function (nivel) {
    var n = L.laberintoTam(nivel), r = L.rng(nivel * 104729 + 7), celdas = new Array(n * n).fill(0), vis = new Array(n * n).fill(false), pila = [0];
    vis[0] = true;
    while (pila.length) {
      var cur = pila[pila.length - 1], x = cur % n, y = (cur / n) | 0, vec = [];
      [N, E, S, O].forEach(function (d) { var nx = x + DX[d], ny = y + DY[d]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && !vis[ny * n + nx]) vec.push(d); });
      if (!vec.length) { pila.pop(); continue; }
      var d = vec[Math.floor(r() * vec.length)], nx2 = x + DX[d], ny2 = y + DY[d], ni = ny2 * n + nx2;
      celdas[cur] |= d; celdas[ni] |= OPUESTO[d]; vis[ni] = true; pila.push(ni);
    }
    return { n: n, celdas: celdas, inicio: 0, fin: n * n - 1 };
  };
  L.laberintoDirs = { N: N, E: E, S: S, O: O, DX: DX, DY: DY };
  // Camino más corto (cantidad de pasos) — para las estrellas y para los tests
  L.laberintoCamino = function (m) {
    var n = m.n, dist = new Array(n * n).fill(-1), cola = [m.inicio]; dist[m.inicio] = 0;
    while (cola.length) {
      var c = cola.shift(); if (c === m.fin) return dist[c];
      [N, E, S, O].forEach(function (d) { if (m.celdas[c] & d) { var nx = (c % n) + DX[d], ny = ((c / n) | 0) + DY[d], ni = ny * n + nx; if (dist[ni] < 0) { dist[ni] = dist[c] + 1; cola.push(ni); } } });
    }
    return -1;
  };
})(typeof window !== 'undefined' ? window : globalThis);
