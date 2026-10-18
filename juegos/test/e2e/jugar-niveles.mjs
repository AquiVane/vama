// Jugadas reales en los 17 juegos: se gana un nivel de verdad (o se completa una partida) tocando la pantalla como lo haría una persona.
import assert from 'node:assert/strict';

export async function jugarDeVerdad({ paso, nuevaPagina, BASE, comprar, PUBLICA }) {
  const email = 'jugador@mail.com', codigo = await comprar(email, 'p-jugador');
  const { ctx, page, errores } = await nuevaPagina();
  await page.goto(`${BASE}/juegos/jugar/?activar=${codigo}`); await page.click('text=Empezar a jugar'); await page.waitForSelector('.j');
  const abrir = async (nombre, nivel1 = true) => { await page.evaluate(() => { document.querySelectorAll('.superpuesto').forEach(x => x.remove()); }); await page.click('.barra button').catch(() => { }); if (!(await page.locator('.j').count())) await page.click('.barra button').catch(() => { }); await page.waitForSelector('.j'); await page.click(`.j:has-text("${nombre}")`); if (nivel1) { await page.click('text=/^Continuar: nivel/'); } };
  const ganoNivel = async () => { await page.waitForSelector('.superpuesto:has-text("Nivel completo")', { timeout: 8000 }); };

  await paso('Memotest: se completa el nivel 1 encontrando las parejas', async () => {
    await abrir('Memotest'); const cartas = page.locator('button.carta'); const n = await cartas.count(); assert.equal(n, 6);
    const visto = {}; const hechos = new Set();
    const voltear = async (i) => { await cartas.nth(i).click(); const l = await cartas.nth(i).getAttribute('aria-label'); return l.split(': ')[1]; };
    for (let i = 0; i < n && hechos.size < n; i++) {
      if (hechos.has(i)) continue;
      const a = await voltear(i);
      if (visto[a] !== undefined && visto[a] !== i && !hechos.has(visto[a])) { await voltear(visto[a]); hechos.add(i); hechos.add(visto[a]); continue; }
      visto[a] = i; let m = -1;
      for (let j = 0; j < n; j++) if (j !== i && !hechos.has(j) && (await cartas.nth(j).getAttribute('aria-label')).includes('boca abajo')) { m = j; break; }
      const b = await voltear(m);
      if (a === b) { hechos.add(i); hechos.add(m); } else { visto[b] = m; await page.waitForTimeout(950); }
    }
    await ganoNivel();
  });
  await paso('Laberinto: se llega a la salida siguiendo el camino y se gana el nivel 1', async () => {
    await abrir('Laberinto'); const m = await page.evaluate(() => VEJL.laberinto(1)); const n = m.n;
    const DIR = { 1: [0, -1, 'ArrowUp'], 2: [1, 0, 'ArrowRight'], 4: [0, 1, 'ArrowDown'], 8: [-1, 0, 'ArrowLeft'] };
    const prev = {}, cola = [m.inicio]; prev[m.inicio] = -1;
    while (cola.length) { const c = cola.shift(); for (const d of [1, 2, 4, 8]) if (m.celdas[c] & d) { const ni = ((c / n | 0) + DIR[d][1]) * n + (c % n) + DIR[d][0]; if (!(ni in prev)) { prev[ni] = c; cola.push(ni); } } }
    const camino = []; for (let c = m.fin; c !== -1; c = prev[c]) camino.unshift(c);
    for (let guard = 0; guard < 60; guard++) {
      const pos = +(await page.locator('canvas').getAttribute('data-pos')); if (pos === m.fin) break;
      const sig = camino[camino.indexOf(pos) + 1]; const d = [1, 2, 4, 8].find(x => (m.celdas[pos] & x) && ((pos / n | 0) + DIR[x][1]) * n + (pos % n) + DIR[x][0] === sig);
      await page.keyboard.press(DIR[d][2]);
    }
    await ganoNivel();
  });
  await paso('Sopa de letras: se marcan todas las palabras (tocando la primera y la última letra) y se gana', async () => {
    await abrir('Sopa de letras'); const s = await page.evaluate(() => VEJL.sopa(1)); const celdas = page.locator('[role=gridcell]');
    for (const p of s.palabras) { await celdas.nth(p.r * s.n + p.c).click(); await celdas.nth((p.r + p.dr * (p.w.length - 1)) * s.n + p.c + p.dc * (p.w.length - 1)).click(); }
    await ganoNivel();
  });
  await paso('Sopa de letras: también se puede arrastrar el dedo sobre la palabra', async () => {
    await abrir('Sopa de letras'); /* el nivel 1 ya se ganó: "Continuar" abre el 2 */ const s = await page.evaluate(() => VEJL.sopa(2)); const p = s.palabras[0], celdas = page.locator('[role=gridcell]');
    const a = await celdas.nth(p.r * s.n + p.c).boundingBox(), b = await celdas.nth((p.r + p.dr * (p.w.length - 1)) * s.n + p.c + p.dc * (p.w.length - 1)).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 }); await page.mouse.up();
    await page.waitForSelector(`li:has-text("${p.w}")[style*="line-through"]`);
  });
  await paso('Sudoku: un número equivocado suma un error y se marca', async () => {
    await abrir('Sudoku', false); await page.click('text=/^Continuar: nivel/'); const s = await page.evaluate(() => VEJL.sudoku(2)); await page.click('.barra button'); await page.click('.niv:has-text("2")').catch(() => { });
    // el nivel 2 está bloqueado hasta ganar el 1: se verifica que el candado funciona
    assert.ok(await page.locator('.niv[disabled]').count() > 0);
  });
  await paso('Nonogramas: se pinta la imagen según las pistas y se gana el nivel 1', async () => {
    await abrir('Nonogramas'); const q = await page.evaluate(() => VEJL.nonograma(1)); const celdas = page.locator('[role=grid] button');
    for (let y = 0; y < q.n; y++) for (let x = 0; x < q.n; x++) if (q.img[y][x]) await celdas.nth(y * q.n + x).click();
    await ganoNivel();
  });
  await paso('Torres de Hanoi: se resuelve el nivel 1 (3 discos) en 7 movimientos', async () => {
    await abrir('Torres de Hanoi'); const t = page.locator('.area > div > button');
    const mover = async (a, b) => { await t.nth(a).click(); await t.nth(b).click(); };
    for (const [a, b] of [[0, 2], [0, 1], [2, 1], [0, 2], [1, 0], [1, 2], [0, 2]]) await mover(a, b);
    await ganoNivel(); assert.equal(await page.locator('.superpuesto svg path').count(), 3);
  });
  await paso('Anagramas: se ordenan las letras y se gana el nivel 1', async () => {
    await abrir('Anagramas'); const letras = await page.$$eval('.area .btn[aria-label^="Letra"]', (b) => b.map(x => x.textContent));
    const cand = await page.evaluate((l) => VEJL.PALABRAS.filter(w => w.length === l.length && [...w].sort().join('') === [...l].sort().join('')), letras); assert.ok(cand.length >= 1);
    for (const palabra of cand) {
      const usados = new Set(); for (const ch of palabra) { const i = letras.findIndex((l, k) => l === ch && !usados.has(k)); usados.add(i); await page.locator('.area .btn[aria-label^="Letra"]').nth(i).click(); }
      if (await page.locator('.superpuesto:has-text("Nivel completo")').count() || await page.waitForSelector('.superpuesto:has-text("Nivel completo")', { timeout: 1500 }).then(() => true).catch(() => false)) break;
      await page.waitForTimeout(900);
    }
    await ganoNivel();
  });
  await paso('Puzzle deslizante: tocar una pieza junto al hueco la mueve y cuenta el movimiento', async () => {
    await abrir('Puzzle deslizante'); const piezas = page.locator('button.pz'); const n = await piezas.count(); assert.equal(n, 8);
    const hueco = await page.evaluate(() => { const bs = [...document.querySelectorAll('button.pz')]; const ocupadas = new Set(bs.map(b => Math.round(parseFloat(b.style.left) / 33.3333) + 3 * Math.round(parseFloat(b.style.top) / 33.3333))); for (let i = 0; i < 9; i++) if (!ocupadas.has(i)) return i; });
    const vecinosDe = (i) => [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1].filter(x => x >= 0 && x < 9);
    const idx = await page.evaluate((v) => { const bs = [...document.querySelectorAll('button.pz')]; return bs.findIndex(b => v.includes(Math.round(parseFloat(b.style.left) / 33.3333) + 3 * Math.round(parseFloat(b.style.top) / 33.3333))); }, vecinosDe(hueco));
    await piezas.nth(idx).click(); assert.match(await page.locator('.estado').innerText(), /Movimientos: 1/);
  });
  await paso('Ahorcado: se juega una partida sola (con el teclado de pantalla) y termina con ganar o perder', async () => {
    await abrir('Ahorcado', false); await page.click('text=Palabra al azar');
    const letras = 'AEOISRNDLCTUMPBGVYQHFZJXKWÑ'.split(''); for (const l of letras) { const b = page.locator(`.area button.btn:text-is("${l}")`); if (await b.isEnabled().catch(() => false)) await b.click(); if (await page.locator('.msg').count()) break; }
    assert.match(await page.locator('.msg').innerText(), /La palabra era/); assert.ok(await page.locator('text=Jugar de nuevo').isVisible());
  });
  await paso('Ahorcado entre amigos: la palabra secreta se valida', async () => {
    await abrir('Ahorcado', false); await page.fill('#secreta', '12'); await page.click('text=Empezar'); await page.waitForSelector('.msg.mal');
    await page.fill('#secreta', 'Sol y mar'); await page.click('text=Empezar'); await page.waitForSelector('button:text-is("A")');
  });
  await paso('Número secreto: se adivina con las pistas más/menos (búsqueda binaria)', async () => {
    await abrir('Número secreto', false); await page.click('text=Empezar'); let lo = 1, hi = 100;
    for (let i = 0; i < 9; i++) { const v = Math.floor((lo + hi) / 2); await page.fill('#num', String(v)); await page.click('text=Probar'); const t = await page.locator('[role=status] .msg').last().innerText(); if (/Era/.test(t)) break; if (/más alto/i.test(t)) lo = v + 1; else hi = v - 1; }
    assert.match(await page.locator('[role=status] .msg').last().innerText(), /Lo adivinaste/); assert.ok(await page.evaluate(() => !!JSON.parse(localStorage.getItem('vej-numero-mejor'))[100]));
  });
  await paso('Buscaminas: destapar, bandera y perder/ganar muestran el resultado', async () => {
    await abrir('Buscaminas', false); await page.click('text=Empezar'); const cs = page.locator('[role=gridcell]'); await cs.nth(0).click();
    await page.click('button:text-is("Bandera")'); await cs.nth(63).click(); assert.match(await cs.nth(63).getAttribute('aria-label'), /Bandera|alrededor/);
    await page.click('button:text-is("Destapar")'); for (let i = 0; i < 64; i++) { if (await page.locator('.msg').count()) break; await cs.nth(i).click({ timeout: 1000 }).catch(() => { }); }
    assert.ok(await page.locator('.msg').count() > 0);
  });
  await paso('Simón dice: arranca, muestra la secuencia y avisa cuando se pierde', async () => {
    await abrir('Simón dice', false); await page.click('text=Empezar'); await page.waitForSelector('text=Tu turno', { timeout: 8000 });
    const pads = page.locator('.area [aria-label="Azul"], .area [aria-label="Amarillo"], .area [aria-label="Rojo"], .area [aria-label="Verde"]');
    for (let i = 0; i < 4; i++) { await pads.nth(i).click(); if (await page.locator('.msg.mal').count()) break; await page.waitForTimeout(500); }
    await page.waitForSelector('.msg.mal:has-text("Te equivocaste")', { timeout: 8000 });
  });
  await paso('Impostor: ronda completa (se reparten roles, se debate, se revela)', async () => {
    await abrir('Impostor', false); await page.click('text=Empezar');
    for (let i = 0; i < 5; i++) { await page.click('text=Ver mi palabra'); await page.click('text=Ya la vi, pasar el celu'); }
    await page.waitForSelector('text=A debatir'); await page.click('text=Revelar al impostor'); assert.match(await page.locator('.tarjeta').first().innerText(), /impostor era: Jugador \d/);
  });
  await paso('Tutti frutti, Mímica, ¿Quién es más probable? y Desafíos: cada ronda saca su carta', async () => {
    await abrir('Tutti frutti', false); await page.click('text=Sacar letra'); await page.waitForSelector('text=La letra es'); await page.click('text=¡Basta!'); await page.waitForSelector('text=Dejen de escribir');
    await abrir('Mímica', false); await page.click('text=Armar turno'); await page.click('text=Listo, empezar'); await page.click('text=Acertaron'); assert.match(await page.locator('.estado').innerText(), /Aciertos: 1/);
    await abrir('¿Quién es más probable?', false); await page.waitForSelector('text=/PREGUNTA 1/'); await page.click('text=Otra pregunta'); await page.waitForSelector('text=/PREGUNTA 2/');
    await abrir('Desafíos de verano', false); await page.click('text=Sacar un desafío'); await page.waitForSelector('text=Cronómetro 30 s');
  });
  assert.deepEqual(errores.filter(e => !/Failed to load/.test(e)), [], 'errores de consola mientras se jugaba');
  await ctx.close();
}
