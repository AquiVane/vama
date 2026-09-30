# HANDOFF — vama (frontend de VAMA Academy)

Actualizado: 2026-09-29.

## Qué es
Frontend estático de `academy.vamatienda.com.ar` (GitHub Pages, `main`, raíz, CNAME en este repo). Primer producto: **Plata en Orden** ($14.900 ARS / USD 10.90) con bump **Plan de 90 días para tu fondo de emergencia** ($6.900 / USD 4.90). Backend = `cosmart-workers` (`cosmart-training-core` + `mp-productos-ganadores`). Training (`training.cosmart.com.ar`) no se toca.

## Páginas (kit v2, diseño aprobado por Vaneh: no se rediseña)
- `/` home genérica (newsletter → `POST /api/newsletter`) · `/categoria/finanzas-personales/` · `/tienda/plata-en-orden/` (página de producto) · `/plata-en-orden/` (landing de anuncios; form → `POST /api/lead` → checkout)
- `/plata-en-orden/checkout/` Payment Brick de MP embebido (tarjeta, débito y dinero en cuenta) + PayPal + bump; pide nombre + email si no hay lead. Precios y timer SIEMPRE del servidor (`POST /api/oferta`).
- `/plata-en-orden/gracias/` · `/registro/?token&email` · `/reset-password/?token`
- `/cursos/` área de alumnos (login + módulos con descargas con sesión, `/academy/archivos` y `/academy/archivo/:curso/:id`). `/plata-en-orden/acceso/` redirige a `/cursos/`.
- `assets/vama.js` (config pública, pixel, vid, oferta, helpers) y `assets/vama.css`.

## Oferta de lanzamiento REAL (obligatoria en todo producto)
7 días desde la primera visita del visitante (landing, tienda o checkout). El servidor guarda la fecha por visitante (`vid`, localStorage+cookie) y por email (en cuanto hay lead), así borrar el navegador no reinicia el timer. El checkout cobra lo que dice el servidor: `mp-productos-ganadores` pisa los montos (`/internal/precio` del core) y PayPal exige el monto vigente. Vencida = precio de lista ($29.900 / $12.900, USD 21,90 / 9,90). Nunca reiniciar el timer.

## Pendientes / decisiones
- `PIXEL_ID` vacío en `assets/vama.js`: falta el ID del Pixel de Meta (sin él no se carga el pixel; PageView/Lead/InitiateCheckout ya están cableados). Purchase sale por CAPI desde el webhook de MP.
- Los archivos pagos (kit v2) YA ESTÁN subidos a R2 (29/09). Para reemplazarlos, subir desde el panel admin de training a `academy-plata-en-orden` (`Plata-en-Orden-con-ejemplos.xlsx`, `Plata-en-Orden-en-blanco.xlsx`, `Ordena-tu-plata-en-7-dias.pdf`, `Tutorial-Plata-en-Orden.mp4`) y a `academy-plata-en-orden-fondo90` (`Fondo-de-emergencia-en-90-dias.pdf`), con NOMBRES EXACTOS.
- `/cursos/` es un área estilo curso: módulos con recursos descargables y la guía de 7 días como LECCIONES (texto servido por el Worker con sesión, progreso por cuenta; el PDF sigue como descarga).
- Instrucción de la planilla en Sheets: como solo hay xlsx, el acceso explica "subir a Drive y guardar como Hojas de cálculo de Google". Si se publica un Google Sheet maestro, cambiarla por "Archivo › Hacer una copia".
- DNS (Vaneh): zona `vamatienda.com.ar` en Cloudflare, CNAME `academy` → `aquivane.github.io` (proxy gris), SPF/DKIM de Brevo para `hola@vamatienda.com.ar`.

## App Plata en Orden (kit v3, PWA en `/app/`) — en la rama, NO publicada (30/09)
- `app/` = el diseño aprobado del kit + integración real: login por link al email (`POST /api/app/login` → mail → `?t=` → `POST /api/app/sesion`; sesión de 30 días en KV SESSIONS, la misma que usa `/cursos`), recursos con descarga real con sesión, conexión con Google Sheets (GIS `drive.file` + Picker + Sheets API: escribe Gastos A–F y H, lee Gastos/Ingresos/Empezá acá; ingreso real por mes), import de Excel (SheetJS desde cdnjs). El service worker solo cachea archivos del mismo origen (no la API ni descargas pagas). La pestaña Pro está oculta hasta construir Pro.
- **Falta para publicarla**: (1) valores de Google Cloud en `GCFG` (`app/index.html`: `clientId`, `apiKey`, `appId`; sin ellos la tarjeta de planilla queda oculta), (2) link "Hacer una copia" de la planilla maestra en `LINK_COPIA_SHEETS` (sin él, esa fila no se muestra), (3) aprobar los textos nuevos (mail del link + 3 mensajes de la app), (4) Pro (suscripciones MP/PayPal) y upsell: no construidos.
- Las páginas v2 (home/categoría/tienda/landing con "app para el celu") están en la rama y NO en `main`: prometen la app; salen juntas cuando la app esté lista. En `main` quedó solo el logo/favicons.
