/* Sopa de letras: 200 niveles con semilla. Las palabras se colocan con su posición exacta, así el juego (y los tests) saben dónde están. */
(function (g) {
  var L = g.VEJL = g.VEJL || {};
  L.PALABRAS = ('PLAYA SOL MAR ARENA OLA PILETA HELADO SOMBRILLA REPOSERA OJOTAS CARPA MATE FOGON ASADO CHOCLO VERANO SIESTA BALDE CAMINO VIAJE MOCHILA RUTA AUTO MICRO TREN AVION HOTEL CABANA CAMPING LAGO RIO SIERRA MONTANA BOSQUE NUBE VIENTO TORMENTA ESTRELLA LUNA FOTO MAPA BRUJULA FRUTA SANDIA DURAZNO CEREZA BANANA MELON LIMON NARANJA COCO FRUTILLA GELATINA JUGO LIMONADA HELADERA VENTILADOR TOALLA BIKINI REMERA GORRA ANTEOJOS CREMA PROTECTOR CANGREJO CARACOL PEZ DELFIN GAVIOTA TORTUGA MEDUSA PULPO BARCO REMO VELA ANCLA FAROL MUELLE ISLA COSTA DUNA BAHIA PUERTO CORAL ALGA PERLA CONCHA SURF BUCEO NADAR SALTAR CORRER JUGAR BAILAR CANTAR REIR AMIGOS FAMILIA FIESTA PICNIC PARRILLA CARBON BRASAS CHORIZO ENSALADA TOMATE PEPINO CEBOLLA PAPA MORRON ZAPALLO MANZANA PERA UVA KIWI ANANA PAPAYA MANGO ARBOL HAMACA TERRAZA PATIO JARDIN FLOR ABEJA MARIPOSA GRILLO LUCIERNAGA AMANECER ATARDECER VERDE AZUL ROJO AMARILLO NARANJA').split(' ')
    .filter(function (w, i, a) { return a.indexOf(w) === i; });
  var DIRS_FACIL = [[0, 1], [1, 0]], DIRS_MEDIO = [[0, 1], [1, 0], [1, 1]], DIRS_TODAS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  L.sopaConfig = function (nivel) {
    var tam = Math.min(12, 6 + Math.floor((nivel - 1) / 35)), cant = Math.min(10, 4 + Math.floor((nivel - 1) / 28));
    var dirs = nivel <= 40 ? DIRS_FACIL : nivel <= 100 ? DIRS_MEDIO : DIRS_TODAS, maxLen = Math.min(tam, 5 + Math.floor((nivel - 1) / 40));
    return { tam: tam, cant: cant, dirs: dirs, maxLen: maxLen };
  };
  L.sopa = function (nivel) {
    var cfg = L.sopaConfig(nivel), r = L.rng(nivel * 15485863 + 3), n = cfg.tam;
    for (var intento = 0; intento < 60; intento++) {
      var grid = new Array(n * n).fill(''), colocadas = [], cand = L.mezclar(L.PALABRAS.filter(function (w) { return w.length <= cfg.maxLen && w.length >= 3; }), r);
      for (var k = 0; k < cand.length && colocadas.length < cfg.cant; k++) {
        var w = cand[k], ok = false;
        for (var t = 0; t < 40 && !ok; t++) {
          var d = cfg.dirs[Math.floor(r() * cfg.dirs.length)], row = Math.floor(r() * n), col = Math.floor(r() * n), er = row + d[0] * (w.length - 1), ec = col + d[1] * (w.length - 1);
          if (er < 0 || ec < 0 || er >= n || ec >= n) continue;
          var libre = true; for (var i = 0; i < w.length; i++) { var c = grid[(row + d[0] * i) * n + col + d[1] * i]; if (c && c !== w[i]) { libre = false; break; } }
          if (!libre) continue;
          for (var j = 0; j < w.length; j++) grid[(row + d[0] * j) * n + col + d[1] * j] = w[j];
          colocadas.push({ w: w, r: row, c: col, dr: d[0], dc: d[1] }); ok = true;
        }
      }
      if (colocadas.length >= Math.min(cfg.cant, 4)) {
        var ABC = 'ABCDEFGHIJLMNOPRSTUV'; for (var q = 0; q < grid.length; q++) if (!grid[q]) grid[q] = ABC[Math.floor(r() * ABC.length)];
        return { n: n, grid: grid, palabras: colocadas };
      }
    }
    throw new Error('No se pudo generar la sopa ' + nivel);
  };
  // ¿la selección (celda inicio → celda fin) es una palabra de la lista? Acepta también al revés.
  L.sopaCheck = function (s, a, b) {
    var n = s.n, ar = (a / n) | 0, ac = a % n, br = (b / n) | 0, bc = b % n;
    for (var i = 0; i < s.palabras.length; i++) {
      var p = s.palabras[i], fr = p.r + p.dr * (p.w.length - 1), fc = p.c + p.dc * (p.w.length - 1);
      if ((ar === p.r && ac === p.c && br === fr && bc === fc) || (br === p.r && bc === p.c && ar === fr && ac === fc)) return p;
    }
    return null;
  };
})(typeof window !== 'undefined' ? window : globalThis);
