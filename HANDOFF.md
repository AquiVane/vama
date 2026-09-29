# HANDOFF — vama (frontend de VAMA Academy)

Actualizado: 2026-09-29.

## Qué es
Frontend estático de `academy.vamatienda.com.ar` (GitHub Pages, `main`, raíz, CNAME en este repo). Primer producto: **Plata en Orden** ($14.900 ARS / USD 10.90) con bump **Plan de 90 días para tu fondo de emergencia** ($6.900 / USD 4.90). Backend = `cosmart-workers` (`cosmart-training-core` + `mp-productos-ganadores`). Training (`training.cosmart.com.ar`) no se toca.

## Páginas
- `/` catálogo · `/plata-en-orden/` landing (form nombre+email → `POST /api/lead` → checkout)
- `/plata-en-orden/checkout/` Brick de MP embebido + PayPal + bump (carrito `items` → `mp-productos-ganadores/pay`)
- `/plata-en-orden/gracias/` · `/registro/?token&email` · `/reset-password/?token`
- `/plata-en-orden/acceso/` login + área de alumnos (descarga con sesión vía `/academy/archivos` y `/academy/archivo/:curso/:id`)
- `assets/vama.js` (config pública, pixel, helpers) y `assets/vama.css`.

## Pendientes / decisiones
- `PIXEL_ID` vacío en `assets/vama.js`: falta el ID del Pixel de Meta (sin él no se carga el pixel; PageView/Lead/InitiateCheckout ya están cableados). Purchase sale por CAPI desde el webhook de MP.
- Los archivos pagos se suben desde el panel admin de training a las carpetas `academy-plata-en-orden` y `academy-plata-en-orden-fondo90` con estos NOMBRES EXACTOS: `Plata-en-Orden.xlsx`, `Ordena-tu-plata-en-7-dias.pdf`, `Tutorial-Plata-en-Orden.mp4`, `Fondo-de-emergencia-en-90-dias.pdf`.
- Checkout: solo tarjeta (Brick) + PayPal. "Dinero en cuenta" de MP no se incluyó porque implica salir del checkout.
- Instrucción de la planilla en Sheets: como solo hay xlsx, el acceso explica "subir a Drive y guardar como Hojas de cálculo de Google". Si se publica un Google Sheet maestro, cambiarla por "Archivo › Hacer una copia".
- DNS (Vaneh): zona `vamatienda.com.ar` en Cloudflare, CNAME `academy` → `aquivane.github.io` (proxy gris), SPF/DKIM de Brevo para `hola@vamatienda.com.ar`.
