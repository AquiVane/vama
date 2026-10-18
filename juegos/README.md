# Verano en Juego — front (landing, checkout y app de 17 juegos)

PWA de 17 juegos que funcionan sin internet. Pago único. La licencia se activa en UN dispositivo y después se verifica sin conexión.
El backend (licencias, activación, métricas, cobros) está en `AquiVane/cosmart-workers`: `workers/verano-en-juego` + `workers/mp-productos-ganadores`.

## Qué hay acá

| Ruta publicada | Archivo | Para qué |
|---|---|---|
| `/juegos/` | `index.html` | Categoría (lista de apps; por ahora solo Verano en Juego) |
| `/juegos/verano-en-juego/` | `verano-en-juego/index.html` | Landing de venta (todos los CTA dicen “Descargar”) |
| `/juegos/verano-en-juego/checkout/` | `verano-en-juego/checkout/` + `assets/checkout.js` | Mercado Pago (Brick) y PayPal (botones del SDK) |
| `/juegos/verano-en-juego/ya-la-compre/` | `verano-en-juego/ya-la-compre/` | Pedir un link nuevo con el mail de la compra |
| `/juegos/verano-en-juego/gracias/` | `verano-en-juego/gracias/` | Confirmación post-pago |
| `/juegos/jugar/` | `jugar/index.html` | **La app** (un solo archivo HTML autónomo, generado por el build) |
| `/juegos/sw.js`, `manifest.webmanifest`, `icons/`, `fonts/` | | PWA y uso sin internet |

Todo es HTML/CSS/JS plano. Solo se necesita Node para generar `jugar/index.html` y correr los tests.

## El archivo de la app se GENERA (no se edita a mano)

El código fuente está en `src/jugar/` (`core.js`, `styles.css`, `lib/` con los generadores de niveles, `games/` con un archivo por juego).
`scripts/build.mjs` lo junta todo en `jugar/index.html`.

```bash
cd juegos
npm run build                              # versión VENDIBLE → jugar/index.html (sin “Modo revisión” ni código de prueba)
npm run build:dev                          # versión de desarrollo (con “Modo revisión”, que desbloquea todos los niveles)
npm run build:marca -- --cliente=ejemplo   # marca blanca → dist/marca/ejemplo/
```

Regla: **el `jugar/index.html` que se commitea y se publica es SIEMPRE el de producción** (`npm run build`). Un test lo verifica.
Si cambiás algo en `src/`, corré `npm run build` y commiteá también `jugar/index.html`.

### La clave pública de firma
Las licencias están firmadas con Ed25519. La app trae adentro la clave **pública** (no es secreta) y verifica la firma sin internet.
1. Generá el par con `cd workers/verano-en-juego && npm run keys` (repo `cosmart-workers`).
2. La **privada** va SOLO a `wrangler secret put SIGN_PRIVATE_KEY` (nunca al repo).
3. La **pública** va en `juegos/config/firma-publica.txt` (una línea) → `npm run build` → commit.
Sin ese archivo el build avisa y la app queda bloqueada (no puede verificar licencias).

### Cambiar la URL del Worker
Por defecto la app habla con `https://verano-en-juego.conglomeradocosmart.workers.dev`. Para otra URL: `npm run build -- --api=https://otra.url`.
(Y la misma en `assets/verano.js`, constante `API`.)

## Marca blanca (`config/marca.json`)
Cada cliente pisa lo que cambia: nombre, colores, logo (PNG cuadrado 512 px), textos de portada, juegos incluidos, link de contacto y URLs de compra/recuperación.
`npm run build:marca -- --cliente=nombre` genera en `dist/marca/nombre/juegos/` la app + manifest + service worker + íconos + tipografías, lista para publicar.
Hay un cliente de ejemplo (`ejemplo`). La licencia y el cobro de cada cliente se resuelven aparte (se vende a mano).

## Cómo funciona la licencia (resumen)
1. Compra aprobada → el Worker crea la licencia y manda por mail un link `…/juegos/jugar/?activar=VERANO-XXXX-XXXX` (y el código escrito, por si el link falla).
2. Al abrir el link la app genera un ID de dispositivo, el servidor lo registra como el activo y devuelve un token firmado. Se guarda en `localStorage` (`vej-licencia`).
3. Cada vez que abre con internet, la app avisa que sigue viva (latido). Sin internet no pasa nada: la firma se verifica localmente.
4. Si la licencia se pasó a otro dispositivo, en el próximo latido muestra “Esta app se activó en otro dispositivo”.
5. Cambio de celu: “Ya la compré” → mail con link nuevo. Máximo una reactivación gratis cada 180 días, y se rechaza si el dispositivo activo dio señal en los últimos 14 días (constantes en `workers/verano-en-juego/config/politica.js`).
6. iPhone: instalar en pantalla de inicio crea un almacenamiento nuevo. Por eso, durante las primeras 24 h el mismo link/código permite pasar de Safari a la app instalada.

Claves de `localStorage`: `vej-licencia`, `vej-device`, `vej-verificada`, `vej-revocada`, `vej-anon`, `vej-prog-<juego>` (avances), `vej-sonido`, `vej-simon-mejor`, `vej-numero-mejor`.
Los avances nunca se borran al actualizar la app.

## Service worker (`sw.js`)
- Guarda la app y las tipografías para jugar sin internet (primero lo guardado, se actualiza en segundo plano).
- **Nunca toca `/api/*`** ni pedidos a otros dominios.
- Para publicar una versión nueva: subir `VERSION` en `sw.js`. La versión nueva entra en la próxima apertura, nunca a mitad de una partida.

## Tests
```bash
cd juegos && npm i
npm test            # generadores de niveles (Sudoku de solución única, laberintos con salida, sopas, nonogramas) y build (vendible / marca blanca / SW)
npm run test:e2e    # Chromium en celu (390 px) contra el Worker REAL + D1 simulada: 47 pruebas
```
`test:e2e` necesita `cosmart-workers` clonado al lado de este repo (o `WORKER_DIR=/ruta/workers/verano-en-juego`) y Chromium
(`CHROMIUM=/ruta/al/chromium` si no está en `/opt/pw-browsers/chromium`).
Cubre: páginas del sitio en 390 y 1280 px (sin scroll horizontal, botones ≥48 px, ningún link sin destino), checkout MP y PayPal con el SDK simulado,
activación, corte de conexión + recarga con avances conservados, dispositivo revocado, y un nivel/partida real de cada uno de los 17 juegos.
La compra con tarjeta real de prueba de Mercado Pago no se automatiza (necesita credenciales de sandbox): ver “Pasos manuales”.

## Pasos manuales (Vaneh)
Ver el README de `workers/verano-en-juego` en `cosmart-workers` (secrets, base D1, deploy, webhook de Mercado Pago, dominio).
