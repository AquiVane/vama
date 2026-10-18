// El build: versión vendible, marca blanca y banderas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const J = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), TMP = path.join(J, '.e2e-tmp', 'build-test');
const build = (...a) => spawnSync(process.execPath, [path.join(J, 'scripts/build.mjs'), ...a], { encoding: 'utf8' });
fs.rmSync(TMP, { recursive: true, force: true });

test('producción: sin Modo revisión ni código de prueba; desarrollo: con ambos', () => {
  assert.equal(build(`--out=${TMP}/prod`, '--pub=AAAA').status, 0);
  assert.equal(build('--dev', `--out=${TMP}/dev`, '--pub=AAAA').status, 0);
  const prod = fs.readFileSync(`${TMP}/prod/juegos/jugar/index.html`, 'utf8'), dev = fs.readFileSync(`${TMP}/dev/juegos/jugar/index.html`, 'utf8');
  for (const re of [/Modo revisi[oó]n/i, /vej-revision/, /VEJ\.test/, /DEV:(INI|FIN)/]) assert.ok(!re.test(prod), 'producción contiene ' + re);
  assert.ok(/Modo revisi[oó]n/.test(dev) && /vej-revision/.test(dev));
  assert.ok(prod.includes('"AAAA"'), 'la clave pública se incrusta');
});

test('el archivo que se publica en el repo (juegos/jugar/index.html) es la versión de producción', () => {
  const repo = fs.readFileSync(path.join(J, 'jugar/index.html'), 'utf8');
  assert.ok(!/Modo revisi[oó]n|vej-revision|VEJ\.test/.test(repo));
  assert.ok(repo.includes('Verano en Juego') && !/\/\*@/.test(repo));
});

test('marca blanca: aplica nombre, colores, textos de portada, juegos incluidos y contacto del cliente', () => {
  const r = build('--cliente=ejemplo', `--out=${TMP}/marca`, '--pub=AAAA'); assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(`${TMP}/marca/juegos/jugar/index.html`, 'utf8');
  assert.ok(html.includes('<title>Club de Juegos Sol</title>') && html.includes('#1F4E79') && html.includes('Los juegos favoritos de nuestros socios.') && html.includes('https://example.com/contacto'));
  assert.ok(html.includes('"juegos":["impostor","tutti-frutti","mimica","sudoku","memotest","simon"]'));
  const man = JSON.parse(fs.readFileSync(`${TMP}/marca/juegos/manifest.webmanifest`, 'utf8')); assert.equal(man.name, 'Club de Juegos Sol'); assert.equal(man.theme_color, '#1F4E79');
  assert.ok(fs.existsSync(`${TMP}/marca/juegos/sw.js`) && fs.existsSync(`${TMP}/marca/juegos/icons/icon-512.png`));
});

test('cliente inexistente: error claro, sin generar nada', () => {
  const r = build('--cliente=no-existe', `--out=${TMP}/x`); assert.notEqual(r.status, 0); assert.match(r.stderr, /No existe el cliente "no-existe".*ejemplo/); assert.ok(!fs.existsSync(`${TMP}/x`));
});

test('el service worker nunca cachea /api/* y solo maneja la app', () => {
  const sw = fs.readFileSync(path.join(J, 'sw.js'), 'utf8');
  assert.match(sw, /pathname\.includes\('\/api\/'\)\) return;/); assert.match(sw, /url\.origin !== self\.location\.origin\) return;/);
});
