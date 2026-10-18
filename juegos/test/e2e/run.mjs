// Pruebas de punta a punta en un navegador real (Chromium, celular de 390 px).
// Usa el Worker REAL de licencias (con una base D1 simulada) y la app construida. Requiere tener clonado cosmart-workers al lado de este repo,
// o apuntar WORKER_DIR=/ruta/a/cosmart-workers/workers/verano-en-juego.
// Uso:  cd juegos && npm i && npm run test:e2e
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { jugarDeVerdad } from './jugar-niveles.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url)), JUEGOS = path.resolve(AQUI, '../..');
const WORKER_DIR = process.env.WORKER_DIR || path.resolve(JUEGOS, '../../cosmart-workers/workers/verano-en-juego');
const TMP = path.join(JUEGOS, '.e2e-tmp'), SITIO = path.join(TMP, 'site'), DEVSITIO = path.join(TMP, 'dev');
const PUERTO = 8791, PUERTO_API = 8792, BASE = `http://localhost:${PUERTO}`, API = `http://localhost:${PUERTO_API}`;
const imp = (f) => import(pathToFileURL(path.join(WORKER_DIR, f)).href);
const { crearEntorno, mockFetch } = await imp('test/helpers.js');
const worker = (await imp('src/index.js')).default;
const { verificarLicencia } = await imp('src/lib/crypto.js');

// ── mundo: Worker + D1 + mails capturados ──
const { env, publica } = await crearEntorno({ ALLOWED_ORIGINS: BASE, APP_URL: `${BASE}/juegos/jugar/`, SITE_URL: `${BASE}/juegos/verano-en-juego/` });
const fetchSimulado = globalThis.fetch; const correo = mockFetch();   // fetchSimulado = el fetch real, para hablar con nuestros servidores locales
const apiSrv = http.createServer(async (q, r) => {
  const chunks = []; for await (const c of q) chunks.push(c);
  const res = await worker.fetch(new Request(API + q.url, { method: q.method, headers: q.headers, body: ['GET', 'HEAD'].includes(q.method) ? undefined : Buffer.concat(chunks) }), env);
  r.writeHead(res.status, Object.fromEntries(res.headers)); r.end(Buffer.from(await res.arrayBuffer()));
}).listen(PUERTO_API);

// ── sitio estático: la app construida + la landing/checkout ──
fs.rmSync(TMP, { recursive: true, force: true });
const build = (...a) => execFileSync(process.execPath, [path.join(JUEGOS, 'scripts/build.mjs'), ...a], { stdio: 'pipe' }).toString();
console.log(build(`--out=${SITIO}`, `--api=${API}`, `--pub=${publica}`).trim());
console.log(build('--dev', `--out=${DEVSITIO}`, `--api=${API}`, `--pub=${publica}`).trim());
for (const raiz of [SITIO, DEVSITIO]) { fs.cpSync(path.join(JUEGOS, 'verano-en-juego'), path.join(raiz, 'juegos/verano-en-juego'), { recursive: true }); fs.cpSync(path.join(JUEGOS, 'assets'), path.join(raiz, 'juegos/assets'), { recursive: true }); fs.copyFileSync(path.join(JUEGOS, 'index.html'), path.join(raiz, 'juegos/index.html')); }
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
let rootActual = SITIO;
const webSrv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p === '/juegos/api/ping') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ t: Date.now() })); }
  let f = path.join(rootActual, p); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end('no'); }
  r.writeHead(200, { 'content-type': (TIPOS[path.extname(f)] || 'application/octet-stream') + (path.extname(f) === '.png' || path.extname(f) === '.woff2' || path.extname(f) === '.webp' ? '' : '; charset=utf-8') }); r.end(fs.readFileSync(f));
}).listen(PUERTO);

// ── mini runner ──
const resultados = []; let fallos = 0;
async function paso(nombre, fn) { try { await fn(); resultados.push(['ok', nombre]); console.log('  ok   ' + nombre); } catch (e) { fallos++; resultados.push(['FALLA', nombre]); console.log('  FALLA ' + nombre + '\n         ' + String(e.message || e).split('\n').slice(0, 6).join('\n         ')); } }
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const movil = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, serviceWorkers: 'allow' };
async function nuevaPagina(opts = movil) {
  const ctx = await browser.newContext(opts), page = await ctx.newPage(), errores = [];
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push('console: ' + m.text()); });
  return { ctx, page, errores };
}
const dev = (c = 'a') => c.repeat(24);
const llamarApi = async (ruta, body) => { const r = await fetchSimulado(API + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '8.8.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250) }, body: JSON.stringify(body) }); return { status: r.status, json: await r.json() }; };
async function comprar(email, pid) {
  const r = await fetchSimulado(API + '/internal/compra', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': env.INTERNAL_SECRET }, body: JSON.stringify({ email, nombre: 'Ana Pérez', payment_id: pid, proveedor: 'mercadopago', monto: 3500, moneda: 'ARS' }) });
  assert.equal(r.status, 200); const m = correo.mails.filter(x => x.to === email).at(-1); return /VERANO-[A-Z2-9]{4}-[A-Z2-9]{4}/.exec(m.texto)[0];
}
// Revisa overflow horizontal y botones/links tocables (≥48 px) en la página actual; los tableros de juego están exceptuados.
async function revisarUI(page, que) {
  const r = await page.evaluate(() => {
    const chicos = [...document.querySelectorAll('a,button,input:not([type=checkbox]),select')].filter(e => e.offsetParent && !e.closest('[data-tablero]') && !e.closest('[hidden]') && e.getBoundingClientRect().height < 47.5 && e.getBoundingClientRect().height > 0).map(e => (e.textContent || e.getAttribute('aria-label') || e.id || e.tagName).trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px');
    const sinDestino = [...document.querySelectorAll('a')].filter(a => a.offsetParent && (!a.getAttribute('href') || a.getAttribute('href') === '#')).map(a => a.textContent.trim());
    return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, chicos, sinDestino };
  });
  assert.ok(r.sw <= r.cw, `${que}: scroll horizontal (${r.sw} > ${r.cw})`);
  assert.deepEqual(r.chicos, [], `${que}: botones de menos de 48 px`);
  assert.deepEqual(r.sinDestino, [], `${que}: links sin destino`);
}

console.log('\nLanding, checkout y páginas del sitio');
for (const [nombre, w] of [['390 px', 390], ['1280 px', 1280]]) {
  await paso(`Páginas del sitio en ${nombre}: sin scroll horizontal, botones ≥48 px y links con destino`, async () => {
    const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: 900 }, isMobile: w < 600, hasTouch: w < 600 });
    await page.route(/fonts\.(googleapis|gstatic)|sdk\.mercadopago|paypal\.com|workers\.dev/, (r) => r.abort());
    for (const u of ['/juegos/', '/juegos/verano-en-juego/', '/juegos/verano-en-juego/checkout/', '/juegos/verano-en-juego/ya-la-compre/', '/juegos/verano-en-juego/gracias/']) { await page.goto(BASE + u); await revisarUI(page, u); }
    await ctx.close();
  });
}
await paso('Landing: pestañas iPhone/Android funcionan con mouse y teclado; los botones llevan al checkout y a "Ya la compré"', async () => {
  const { ctx, page } = await nuevaPagina(); await page.route(/fonts\.(googleapis|gstatic)|workers\.dev/, (r) => r.abort());
  await page.goto(BASE + '/juegos/verano-en-juego/');
  await page.setViewportSize({ width: 390, height: 844 });
  const iph = page.locator('#tab-iphone'), and = page.locator('#tab-android');
  await and.click(); assert.equal(await and.getAttribute('aria-selected'), 'true'); assert.ok(await page.locator('#t-android').isVisible()); assert.ok(!(await page.locator('#t-iphone').isVisible()));
  await iph.focus(); await page.keyboard.press('ArrowRight'); assert.equal(await and.getAttribute('aria-selected'), 'true');
  await page.keyboard.press('ArrowLeft'); assert.equal(await iph.getAttribute('aria-selected'), 'true');
  const hrefs = await page.$$eval('a.btn', (as) => as.map(a => a.getAttribute('href')));
  assert.ok(hrefs.includes('/juegos/verano-en-juego/checkout/') && hrefs.includes('/juegos/verano-en-juego/ya-la-compre/'));
  await page.click('section.dark a.btn-sun.btn-lg'); await page.waitForURL('**/checkout/'); await ctx.close();
});
await paso('Checkout con Mercado Pago (simulado): valida datos, cobra con el precio del servidor y lleva a "gracias"', async () => {
  const { ctx, page, errores } = await nuevaPagina(); const pedidos = [];
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await page.route('https://sdk.mercadopago.com/js/v2', (r) => r.fulfill({ contentType: 'application/javascript', body: `window.MercadoPago=function(){this.bricks=function(){return{create:async function(t,id,cfg){document.getElementById(id).innerHTML='<div id="brick-falso">Formulario de tarjeta (simulado)</div>';cfg.callbacks.onReady&&cfg.callbacks.onReady();return{unmount:async function(){},getFormData:async function(){return{formData:{token:'tok_1',transaction_amount:3500,payer:{email:'pagador@mail.com'}}}}}}}}}` }));
  await page.route('**/mp-productos-ganadores**/preference', async (r) => { if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors }); pedidos.push(['preference', r.request().postDataJSON()]); r.fulfill({ contentType: 'application/json', headers: cors, body: '{"preference_id":"pref_1"}' }); });
  await page.route('**/mp-productos-ganadores**/pay', async (r) => { if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors }); pedidos.push(['pay', r.request().postDataJSON()]); r.fulfill({ contentType: 'application/json', headers: cors, body: '{"status":"approved","payment_id":9001}' }); });
  await page.route('**/api/eventos', (r) => r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto(BASE + '/juegos/verano-en-juego/checkout/');
  await page.click('#pagar'); await page.waitForSelector('#err-datos:not([hidden])');                      // sin datos: error claro
  await page.fill('#nombre', 'Ana Pérez'); await page.fill('#email', 'ana@mail.com');
  await page.waitForSelector('#brick-falso');
  await page.click('#pagar'); await page.waitForSelector('#err-acepto:not([hidden])');                      // sin aceptar términos: error claro
  assert.equal(pedidos.filter(p => p[0] === 'pay').length, 0, 'no se cobra sin aceptar');
  await page.check('#acepto'); await page.click('#pagar'); await page.waitForURL(/\/gracias\/\?email=ana%40mail\.com/);
  const pay = pedidos.find(p => p[0] === 'pay')[1]; assert.equal(pay.producto, 'verano-en-juego'); assert.equal(pay.lead_email, 'ana@mail.com'); assert.equal(pay.lead_nombre, 'Ana Pérez');
  assert.match(await page.locator('#ok').innerText(), /ana@mail\.com/); await revisarUI(page, 'gracias'); assert.deepEqual(errores, []); await ctx.close();
});
await paso('Checkout con PayPal (simulado): el botón dispara la verificación en el servidor y lleva a "gracias"', async () => {
  const { ctx, page } = await nuevaPagina(); let body = null; const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  await page.route(/fonts\.(googleapis|gstatic)|sdk\.mercadopago/, (r) => r.abort());
  await page.route(/paypal\.com\/sdk\/js/, (r) => r.fulfill({ contentType: 'application/javascript', body: `window.paypal={Buttons:function(cfg){return{render:function(sel){var b=document.createElement('button');b.id='pp-falso';b.textContent='PayPal simulado';b.style.minHeight='60px';b.onclick=async function(){try{await cfg.onClick({},{resolve:function(){return Promise.resolve()},reject:function(){return Promise.reject(new Error('rechazado'))}})}catch(e){return}var id=await cfg.createOrder({}, {order:{create:async function(){return'ORDER12345678'}}});await cfg.onApprove({orderID:id},{order:{capture:async function(){return{}}}})};document.querySelector(sel).appendChild(b)}}}}` }));
  await page.route('**/api/pago/paypal', async (r) => { if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors }); body = r.request().postDataJSON(); r.fulfill({ contentType: 'application/json', headers: cors, body: '{"ok":true}' }); });
  await page.route('**/api/eventos', (r) => r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto(BASE + '/juegos/verano-en-juego/checkout/'); await page.fill('#nombre', 'Pau'); await page.fill('#email', 'pau@mail.com'); await page.click('#tab-pp');
  await page.waitForSelector('#pp-falso'); assert.ok(!(await page.locator('#pagar').isVisible()));
  await page.click('#pp-falso'); await page.waitForSelector('#err-acepto:not([hidden])'); assert.equal(body, null);        // sin aceptar términos no avanza
  await page.check('#acepto'); await page.click('#pp-falso'); await page.waitForURL(/\/gracias\//);
  assert.equal(body.orderID, 'ORDER12345678'); assert.equal(body.email, 'pau@mail.com'); await ctx.close();
});
await paso('"Ya la compré": respuesta neutra y mail de link nuevo', async () => {
  await comprar('lola@mail.com', 'p-lola'); const antes = correo.mails.length;
  const { ctx, page } = await nuevaPagina(); await page.route(/fonts\.(googleapis|gstatic)|workers\.dev/, (r) => r.abort());
  await page.route(API + '/**', (r) => r.continue());
  await page.addInitScript(`window.__api = '${API}'`);
  await page.goto(BASE + '/juegos/verano-en-juego/ya-la-compre/');
  await page.evaluate((a) => { VEJ.cfg.API = a; }, API);
  await page.fill('#email', 'no-es-un-mail'); await page.click('#enviar'); await page.waitForSelector('#err:not([hidden])');
  await page.fill('#email', 'lola@mail.com'); await page.click('#enviar'); await page.waitForSelector('#estado .msg.ok');
  assert.match(await page.locator('#estado .msg').innerText(), /Si ese email tiene una compra/); assert.equal(correo.mails.length, antes + 1);
  await page.fill('#email', 'desconocida@mail.com'); await page.click('#enviar'); await page.waitForTimeout(400);
  assert.match(await page.locator('#estado .msg').innerText(), /Si ese email tiene una compra/); await ctx.close();
});

console.log('\nLa app: activación, uso sin internet y avances');
const compra = { email: 'ana2@mail.com', codigo: null };
let paginaOffline = null;
await paso('Sin licencia no se ve ningún juego: aparece la pantalla de activación; un código inventado da error claro', async () => {
  const { ctx, page, errores } = await nuevaPagina(); await page.goto(BASE + '/juegos/jugar/');
  await page.waitForSelector('#codigo'); assert.equal(await page.locator('.j').count(), 0); assert.match(await page.locator('h1').innerText(), /Activá tu app/);
  await revisarUI(page, 'bloqueo'); await page.fill('#codigo', 'hola'); await page.click('text=Activar'); await page.waitForSelector('#estado .msg.mal');
  await page.fill('#codigo', 'VERANOAAAABBBB'); await page.click('text=Activar'); await page.waitForSelector('#estado .msg.mal:has-text("No encontramos")'); assert.deepEqual(errores, []); await ctx.close();
});
await paso('Activar con el link del mail → bienvenida → los 17 juegos; la licencia verifica firmada y queda guardada', async () => {
  compra.codigo = await comprar(compra.email, 'p-ana2');
  const { ctx, page, errores } = await nuevaPagina(); paginaOffline = { ctx, page, errores };
  await page.goto(`${BASE}/juegos/jugar/?activar=${compra.codigo}`);
  await page.waitForSelector('text=Tu app está activada'); await revisarUI(page, 'bienvenida');
  await page.click('text=Empezar a jugar'); await page.waitForSelector('.j'); assert.equal(await page.locator('.j').count(), 17);
  const tok = await page.evaluate(() => localStorage.getItem('vej-licencia')); assert.ok(tok.startsWith('v1.'));
  const p = await verificarLicencia(publica, tok); assert.equal(p.prod, 'verano-en-juego'); assert.equal(p.dev, await page.evaluate(() => localStorage.getItem('vej-device')));
  await revisarUI(page, 'inicio'); assert.deepEqual(errores, []);
});
await paso('El mismo código en OTRO celu pasada la ventana de instalación se rechaza (un solo dispositivo)', async () => {
  const desde = Date.now; const { setReloj } = await imp('src/lib/reloj.js'); setReloj(() => desde() + 30 * 3600 * 1000);
  const r = await llamarApi('/api/license/activate', { codigo: compra.codigo, device_id: dev('z') }); setReloj(null);
  assert.equal(r.status, 409); assert.match(r.json.error, /otro dispositivo/);
});
await paso('Se juega, se guardan los avances (Sudoku nivel 1 completo) y queda 1 estrella o más', async () => {
  const { page } = paginaOffline; await page.click('.j:has-text("Sudoku")'); await page.click('text=Continuar: nivel 1'); await page.waitForSelector('[role=grid]');
  const sol = await page.evaluate(() => { const s = VEJL.sudoku(1); return { s: s.solucion, p: s.puzzle }; });
  for (let i = 0; i < 81; i++) if (!sol.p[i]) { await page.locator('[role=gridcell]').nth(i).click(); await page.locator('button.btn', { hasText: new RegExp('^' + sol.s[i] + '$') }).first().click(); }
  await page.waitForSelector('.superpuesto:has-text("Nivel completo")');
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('vej-prog-sudoku')).hechos['1'] >= 1));
  await page.click('text=Ver niveles'); assert.ok(await page.locator('text=Continuar: nivel 2').isVisible());
});
await paso('SIN INTERNET: se corta la conexión, se recarga y sigue todo desbloqueado y con los avances', async () => {
  const { ctx, page, errores } = paginaOffline;
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true)); await page.waitForFunction(async () => !!(await caches.match('/juegos/jugar/')));
  await page.reload(); await page.waitForSelector('.j');                                          // una recarga ya controlada por el service worker
  await ctx.setOffline(true); await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.j'); assert.equal(await page.locator('.j').count(), 17);
  assert.ok(await page.locator('.j:has-text("Sudoku") .prog:has-text("1 de 200")').isVisible());     // avance conservado
  await page.click('.j:has-text("Sudoku")'); assert.ok(await page.locator('text=Continuar: nivel 2').isVisible());
  await page.click('text=Inicio'); await page.click('.j:has-text("Memotest")'); await page.click('text=Continuar: nivel 1'); await page.waitForSelector('.tablero');   // un juego distinto también anda sin red
  assert.equal(await page.evaluate(() => !!localStorage.getItem('vej-licencia')), true); assert.deepEqual(errores, []);
});
await paso('El service worker no guarda /api/* (ni un pedido a esa ruta queda en la caché)', async () => {
  const { ctx, page } = paginaOffline; await ctx.setOffline(false);
  await page.evaluate(() => fetch('/juegos/api/ping').then(r => r.json())); await page.evaluate(() => fetch('/juegos/jugar/api/ping').catch(() => 0));
  const urls = await page.evaluate(async () => { const o = []; for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) o.push(r.url); return o; });
  assert.ok(urls.length >= 5, 'la app sí se guardó'); assert.deepEqual(urls.filter(u => u.includes('/api/')), []);
});
await paso('Dispositivo revocado: si la licencia se reactivó en otro celu, al abrir con internet muestra "se activó en otro dispositivo"', async () => {
  const { page } = paginaOffline; const D = 86400;
  await env.DB.prepare('UPDATE licencias SET last_seen = last_seen - ? WHERE email=?').bind(20 * D, compra.email).run();     // sin señal hace 20 días
  await env.DB.prepare('DELETE FROM rate_limit').run();
  const rec = await llamarApi('/api/license/recover', { email: compra.email }); assert.equal(rec.status, 200);
  const codigo = /VERANO-[A-Z2-9]{4}-[A-Z2-9]{4}/.exec(correo.mails.at(-1).texto)[0];
  const act = await llamarApi('/api/license/activate', { codigo, device_id: dev('n') }); assert.equal(act.json.tipo, 'reactivacion');
  await page.reload(); await page.waitForSelector('h1:has-text("se activó en otro dispositivo")');
  assert.equal(await page.locator('.j').count(), 0); assert.equal(await page.evaluate(() => localStorage.getItem('vej-licencia')), null);
  assert.ok(await page.locator('a:has-text("Ya la compré")').isVisible()); await revisarUI(page, 'otro-dispositivo');
  await paginaOffline.ctx.close();
});

console.log('\nLos 17 juegos en celu (390 px)');
{
  const email = 'juegos@mail.com', codigo = await comprar(email, 'p-juegos');
  const { ctx, page, errores } = await nuevaPagina(); await page.goto(`${BASE}/juegos/jugar/?activar=${codigo}`); await page.click('text=Empezar a jugar'); await page.waitForSelector('.j');
  const nombres = await page.$$eval('.j h3', (h) => h.map(x => x.textContent));
  assert.equal(nombres.length, 17);
  for (const [i, nombre] of nombres.entries()) await paso(`${String(i + 1).padStart(2, '0')} ${nombre}: abre, no hay scroll horizontal ni errores y se puede volver`, async () => {
    await page.click(`.j:nth-child(${i + 1})`);
    if (await page.locator('text=/^Continuar: nivel/').count()) await page.click('text=/^Continuar: nivel/');
    await page.waitForTimeout(250); await revisarUI(page, nombre);
    await page.click('.barra button'); await page.waitForTimeout(100);
    if (!(await page.locator('.j').count())) await page.click('.barra button');    // desde un nivel vuelve a la lista de niveles; de ahí al inicio
    await page.waitForSelector('.j');
  });
  assert.deepEqual(errores, [], 'errores de consola'); await ctx.close();
}

console.log('\nJugando de verdad (se gana un nivel / se completa una partida en cada juego)');
await jugarDeVerdad({ paso, nuevaPagina, BASE, comprar, PUBLICA: publica });

console.log('\nVersión vendible');
await paso('El build de producción no trae "Modo revisión" ni código de prueba; el de desarrollo sí y desbloquea todos los niveles', async () => {
  const prod = fs.readFileSync(path.join(SITIO, 'juegos/jugar/index.html'), 'utf8'), desa = fs.readFileSync(path.join(DEVSITIO, 'juegos/jugar/index.html'), 'utf8');
  for (const re of [/Modo revisi[oó]n/i, /vej-revision/, /VEJ\.test/, /DEV:INI/]) assert.ok(!re.test(prod), 'producción contiene ' + re);
  assert.ok(/Modo revisi[oó]n/.test(desa));
  const repo = fs.readFileSync(path.join(JUEGOS, 'jugar/index.html'), 'utf8'); assert.ok(!/Modo revisi[oó]n|vej-revision/.test(repo), 'el archivo del repo (que se publica) tiene que ser el de producción');
  rootActual = DEVSITIO; const { ctx, page } = await nuevaPagina(); const codigo = await comprar('dev@mail.com', 'p-dev');
  await page.goto(`${BASE}/juegos/jugar/?activar=${codigo}`); await page.click('text=Empezar a jugar'); await page.waitForSelector('#modo-revision');
  await page.check('#modo-revision'); await page.click('.j:has-text("Sudoku")'); assert.equal(await page.locator('.niv[disabled]').count(), 0); await ctx.close(); rootActual = SITIO;
});

await browser.close(); apiSrv.close(); webSrv.close(); correo.restaurar();
console.log(`\n${resultados.length - fallos} de ${resultados.length} pruebas OK` + (fallos ? `, ${fallos} FALLARON` : ''));
process.exit(fallos ? 1 : 0);
