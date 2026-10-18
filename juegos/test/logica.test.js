// Lógica pura de los generadores de niveles (se carga el mismo archivo que va dentro de la app).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = { globalThis: null }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['rng', 'sudoku', 'laberinto', 'sopa', 'nonograma']) vm.runInContext(fs.readFileSync(new URL(`../src/jugar/lib/${f}.js`, import.meta.url), 'utf8'), ctx);
const L = ctx.VEJL;

test('Sudoku: la solución es válida y cada nivel tiene solución ÚNICA (muestra de niveles de todos los tiers)', () => {
  for (const n of [1, 2, 40, 41, 80, 81, 120, 121, 160, 161, 199, 200]) {
    const s = L.sudoku(n);
    for (let i = 0; i < 9; i++) {   // filas, columnas y bloques con 1..9
      const f = new Set(), c = new Set(), b = new Set();
      for (let k = 0; k < 9; k++) { f.add(s.solucion[i * 9 + k]); c.add(s.solucion[k * 9 + i]); b.add(s.solucion[((i / 3 | 0) * 3 + (k / 3 | 0)) * 9 + (i % 3) * 3 + (k % 3)]); }
      assert.equal(f.size, 9); assert.equal(c.size, 9); assert.equal(b.size, 9);
    }
    s.puzzle.forEach((v, i) => { if (v) assert.equal(v, s.solucion[i]); });           // las pistas coinciden con la solución
    assert.equal(L.sudokuResolver(s.puzzle.slice(), 2), 1, 'nivel ' + n + ' debe tener una sola solución');
    assert.ok(s.pistas <= L.sudokuPistas(n) + 4, `nivel ${n}: pistas ${s.pistas}`);
  }
  assert.deepEqual(L.sudoku(37).puzzle, L.sudoku(37).puzzle);                          // mismo nivel = mismo tablero
  assert.ok(L.sudokuPistas(1) > L.sudokuPistas(200));                                  // dificultad creciente
});

test('Laberinto: todos los niveles tienen camino de la entrada a la salida', () => {
  for (let n = 1; n <= 200; n += 7) { const m = L.laberinto(n); assert.equal(m.n, L.laberintoTam(n)); assert.ok(L.laberintoCamino(m) >= 2 * (m.n - 1), 'nivel ' + n); }
  assert.equal(L.laberintoTam(1), 5); assert.equal(L.laberintoTam(200), 21);
});

test('Sopa de letras: las palabras están exactamente donde dice la lista y se pueden detectar', () => {
  for (let n = 1; n <= 200; n += 9) {
    const s = L.sopa(n), tam = s.n;
    assert.ok(s.palabras.length >= 4);
    for (const p of s.palabras) {
      let w = ''; for (let i = 0; i < p.w.length; i++) w += s.grid[(p.r + p.dr * i) * tam + p.c + p.dc * i];
      assert.equal(w, p.w);
      const a = p.r * tam + p.c, b = (p.r + p.dr * (p.w.length - 1)) * tam + p.c + p.dc * (p.w.length - 1);
      assert.equal(L.sopaCheck(s, a, b), p); assert.equal(L.sopaCheck(s, b, a), p);   // también al revés
    }
    assert.equal(s.grid.filter(c => !c).length, 0);
  }
});

test('Nonogramas: las pistas salen de la imagen y la imagen las cumple; un tablero vacío no', () => {
  for (let n = 1; n <= L.NONO_NIVELES; n += 4) {
    const q = L.nonograma(n); assert.ok(L.nonoCumple(q, q.img), 'nivel ' + n);
    assert.equal(L.nonoCumple(q, q.img.map(f => f.map(() => 0))), false);
    assert.ok(q.filas.every(f => f.length >= 1) && q.cols.every(c => c.length >= 1));
  }
});
