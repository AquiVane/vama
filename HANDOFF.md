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
- Los archivos pagos (kit v2) se suben desde el panel admin de training a `academy-plata-en-orden` (`Plata-en-Orden-con-ejemplos.xlsx`, `Plata-en-Orden-en-blanco.xlsx`, `Ordena-tu-plata-en-7-dias.pdf`, `Tutorial-Plata-en-Orden.mp4`) y a `academy-plata-en-orden-fondo90` (`Fondo-de-emergencia-en-90-dias.pdf`), con NOMBRES EXACTOS.
- `/cursos/` hoy es un área por módulos con recursos descargables. El kit pide "estilo curso" con la guía de 7 días como lecciones: falta pasar el texto de la guía al Worker (no puede ir al repo público).
- Instrucción de la planilla en Sheets: como solo hay xlsx, el acceso explica "subir a Drive y guardar como Hojas de cálculo de Google". Si se publica un Google Sheet maestro, cambiarla por "Archivo › Hacer una copia".
- DNS (Vaneh): zona `vamatienda.com.ar` en Cloudflare, CNAME `academy` → `aquivane.github.io` (proxy gris), SPF/DKIM de Brevo para `hola@vamatienda.com.ar`.
