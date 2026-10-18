// Genera juegos/jugar/index.html (un solo archivo autónomo) a partir de juegos/src/jugar/.
//   npm run build                          → versión VENDIBLE: sin "Modo revisión" ni código de prueba
//   npm run build:dev                      → con Modo revisión (desbloquea todos los niveles) y ganchos de prueba
//   npm run build:marca -- --cliente=foo   → versión de marca blanca en dist/marca/foo/ (usa config/marca.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => { const a = process.argv.find(x => x === '--' + n || x.startsWith('--' + n + '=')); return a ? (a.includes('=') ? a.split('=')[1] : true) : null; };
const dev = !!arg('dev'), cliente = arg('cliente'), api = arg('api'), out = arg('out');
const leer = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');

const cfg = JSON.parse(leer('config', 'marca.json'));
let marca = { ...cfg.verano };
if (cliente) {
  const c = cfg.clientes && cfg.clientes[cliente];
  if (!c) { console.error(`No existe el cliente "${cliente}" en config/marca.json. Disponibles: ${Object.keys(cfg.clientes || {}).join(', ') || '(ninguno)'}`); process.exit(1); }
  marca = { ...marca, ...c, colores: { ...marca.colores, ...(c.colores || {}) }, portada: { ...marca.portada, ...(c.portada || {}) }, contacto: { ...marca.contacto, ...(c.contacto || {}) } };
}
// El logo (PNG cuadrado) se incrusta como data URI dentro de la app.
let logoPath = null;
if (marca.logo) {
  logoPath = path.resolve(RAIZ, 'config', marca.logo);
  if (!fs.existsSync(logoPath)) { console.error('No se encuentra el logo: ' + logoPath); process.exit(1); }
  marca.logo = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
}
if (marca.juegos !== 'todos' && !Array.isArray(marca.juegos)) { console.error('"juegos" tiene que ser "todos" o una lista de ids.'); process.exit(1); }

const orden = (dir, filtro) => fs.readdirSync(path.join(RAIZ, 'src', 'jugar', dir)).filter(filtro).sort();
const libs = orden('lib', f => f.endsWith('.js')).map(f => leer('src', 'jugar', 'lib', f));
const games = orden('games', f => f.endsWith('.js')).map(f => leer('src', 'jugar', 'games', f));
const core = leer('src', 'jugar', 'core.js');
const pub = (fs.existsSync(path.join(RAIZ, 'config', 'firma-publica.txt')) ? leer('config', 'firma-publica.txt') : '').trim();
const publica = arg('pub') && arg('pub') !== true ? arg('pub') : pub;

if (!dev && !publica) console.warn('ADVERTENCIA: falta la clave pública de firma (config/firma-publica.txt o --pub=...). Sin ella la app no puede verificar licencias y queda bloqueada. Ver README.');
let js = [...libs, core, ...games, 'VEJ.arrancar();'].join('\n;\n');
js = js.replace(/\/\*@MARCA\*\/[\s\S]*?\/\*@\/MARCA\*\//, () => JSON.stringify(marca))
  .replace(/\/\*@API\*\/[\s\S]*?\/\*@\/API\*\//, (m) => api && api !== true ? JSON.stringify(api) : m.replace(/\/\*@\/?API\*\//g, ''))
  .replace(/\/\*@PUBKEY\*\/[\s\S]*?\/\*@\/PUBKEY\*\//, () => JSON.stringify(publica));
if (!dev) js = js.replace(/\/\*DEV:INI\*\/[\s\S]*?\/\*DEV:FIN\*\//g, '');
js = js.replace(/<\/script/gi, '<\\/script');

let html = leer('src', 'jugar', 'shell.html')
  .replace('/*@CSS*/', () => leer('src', 'jugar', 'styles.css'))
  .replace('/*@JS*/', () => js)
  .replace(/\/\*@NOMBRE\*\//g, () => marca.nombre.replace(/[<>&"]/g, ''))
  .replace('/*@COLOR_TEMA*/', marca.themeColor || '#0B5FA5');

// Control de calidad: el build vendible no puede llevar código de prueba.
if (!dev) {
  const prohibido = [/DEV:INI|DEV:FIN/, /modo[- ]revisi[oó]n/i, /vej-revision/, /VEJ\.test\b/];
  for (const re of prohibido) if (re.test(html)) { console.error('El build de producción todavía contiene código de prueba: ' + re); process.exit(1); }
}
if (/\/\*@[A-Z_\/]+\*\//.test(html)) { console.error('Quedaron marcadores sin reemplazar en el HTML.'); process.exit(1); }

const salida = out && out !== true ? path.resolve(out) : cliente ? path.join(RAIZ, '..', 'dist', 'marca', cliente) : path.join(RAIZ, '..');
const completo = !!cliente || (out && out !== true);   // carpeta aparte: lleva también sw, manifest, íconos y tipografías
const dst = (...p) => path.join(salida, ...p);
fs.mkdirSync(dst('juegos', 'jugar'), { recursive: true });
fs.writeFileSync(dst('juegos', 'jugar', 'index.html'), html);
if (completo) {   // la marca blanca (o un build de prueba) lleva también su manifest, service worker, íconos y tipografías
  for (const f of ['sw.js']) fs.copyFileSync(path.join(RAIZ, f), dst('juegos', f));
  fs.cpSync(path.join(RAIZ, 'fonts'), dst('juegos', 'fonts'), { recursive: true });
  fs.cpSync(path.join(RAIZ, 'icons'), dst('juegos', 'icons'), { recursive: true });
  if (logoPath) for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) fs.copyFileSync(logoPath, dst('juegos', 'icons', f));
  const man = JSON.parse(leer('manifest.webmanifest'));
  if (cliente) Object.assign(man, { name: marca.nombre, short_name: marca.nombreCorto || marca.nombre, background_color: marca.themeColor, theme_color: marca.themeColor });
  fs.writeFileSync(dst('juegos', 'manifest.webmanifest'), JSON.stringify(man, null, 2));
}
console.log(`OK ${dev ? '(desarrollo, con Modo revisión)' : '(producción)'}${cliente ? ' cliente=' + cliente : ''} → ${path.relative(process.cwd(), dst('juegos', 'jugar', 'index.html'))} (${(html.length / 1024).toFixed(0)} KB)`);
