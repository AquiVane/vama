# HANDOFF — vama (frontend de VAMA Academy)

Actualizado: 2026-09-29.

## [18/10] Pendientes MANUALES de Vaneh para dominio y mail de VAMA (Verano en Juego) -- anotados al cierre del día
Los hace Vaneh (no se pueden hacer desde el código). Hacen falta antes de que Verano en Juego mande su primer mail real:
1. **Agregar el subdominio** `apps.vamatienda.com.ar` (todavía no está dado de alta) y apuntarlo a donde se publica `juegos/` (rutas absolutas `/juegos/...`).
2. **Abrir la cuenta de Brevo de VAMA** (`vamatienda.com.ar`): todavía no existe. Cargar ahí el dominio y hacer la **verificación del dominio** (registros DNS que pide Brevo: SPF/DKIM/DMARC).
3. **Crear el mail `hola@vamatienda.com.ar` en Zoho** (plan gratis) para tener la casilla abierta. Es el remitente de los mails de activación (`MAIL_FROM_EMAIL`) y el contacto de soporte; tiene que estar verificado en Brevo.
4. Con la cuenta de Brevo de VAMA: generar su API key y cargarla como secret `BREVO_API_KEY` del Worker `verano-en-juego` (hoy los otros Workers usan la cuenta de COSMART; este mail sale desde el dominio de VAMA).
Detalle técnico y resto de pasos (D1, claves de firma, secrets, deploy, webhook de MP): `workers/verano-en-juego/README.md` en `AquiVane/cosmart-workers`.

## Verano en Juego (`juegos/`) — 18/10/2026, rama `claude/great-einstein-odu0bs`, SIN PUBLICAR
App de 17 juegos offline (pago único ARS 3.500 / USD 2,28), pedida por Vaneh. Carpeta `juegos/` (ver `juegos/README.md`): landing, categoría, checkout (Brick MP + PayPal), "Ya la compré", gracias y la app en `juegos/jugar/index.html` (un solo archivo, **generado** por `npm run build` desde `juegos/src/jugar/`; el que se commitea es SIEMPRE el de producción, sin "Modo revisión").
- Backend en `cosmart-workers` (`workers/verano-en-juego` + producto en `mp-productos-ganadores`). Licencia firmada Ed25519, un dispositivo, latido, recuperar con cooldown 180 d.
- **Excepción a "sin build"**: solo `juegos/` usa Node para generar `jugar/index.html` y la marca blanca (`npm run build:marca -- --cliente=x`). El resto del repo sigue sin build.
- Falta (manual): clave pública de firma en `juegos/config/firma-publica.txt` + `npm run build`; deploy del backend; decidir dónde se sirve (`apps.vamatienda.com.ar/juegos/`, rutas absolutas `/juegos/...`).
- Tests: `cd juegos && npm test` y `npm run test:e2e` (47 pruebas, Chromium 390 px contra el Worker real con D1 simulada).

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

## App Plata en Orden, Pro y upsell (kit v2 + v3) — en la rama, NO publicado (30/09)
- **`/app/`** (PWA): login con el MISMO usuario y contraseña de `/cursos` (`POST /auth/login`, misma sesión y `localStorage.vama_token`; solo entran compradores de la planilla, `GET /api/app/me`). En `/cursos` hay una tarjeta "Descargar la app" que lleva a `/app/`. Recursos con descarga real con sesión; Excel importable una vez (SheetJS); Google Sheets bidireccional (GIS `drive.file` + Picker + Sheets API) que queda **oculto hasta cargar `GCFG`** en `app/index.html` (clientId, apiKey, appId de un proyecto de Google Cloud; son públicos). El service worker solo cachea archivos del mismo origen.
- **Pro** (pestaña Pro): sin suscripción muestra la oferta (precio del primer mes $1.900 / USD 1,49 si compró el libro y nunca tuvo Pro; si no $3.900 / USD 2,99). Pago embebido: Card Payment Brick de MP (`POST /api/pro/mp`) o PayPal Subscriptions (`/api/pro/paypal-plan` + `/api/pro/paypal`). Con Pro: Mis cuotas (suman solas a "Tarjeta - cuotas" en Mi mes), Mis dólares (cotización de dolarapi.com), Simulador (educativo, todo con datos de la persona), Metas, Mi cuenta (Dar de baja con doble toque), y sincronización entre dispositivos (`GET/PUT /api/app/datos`, mezcla por id, `S.del` evita que resuciten borrados).
- **Upsell** en `/plata-en-orden/gracias/?nombre=&email=` (checkout redirige ahí): combo $19.900 (lista $39.900) / USD 14,90 y downsell solo libro $12.900 / USD 9,90. Pago embebido (Brick + PayPal). El servidor decide el precio y solo lo vende a quien compró Plata en Orden hace menos de 72 h y todavía no tiene el libro. El combo da el libro + **3 meses de Pro sin renovación automática** (para seguir hay que activar la suscripción en Mi cuenta: arranca al terminar la prueba).
- **/cursos**: curso "Tus dólares, bien puestos" en 8 lecciones (contenido en el Worker) con 4 ejercicios completables (`assets/ejercicios.js`: checklist, calculadora de inflación, reparto en 3 cajas, plan del mes por mes) que se guardan por cuenta.
- Las páginas v2 (home/categoría/tienda/landing con "app para el celu") están en la rama y NO en `main`: salen junto con la app. En `main` solo el logo/favicons.
- **Para publicar**: (1) secrets `MP_ACCESS_TOKEN`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` en `cosmart-training-core` (workflow "Set Worker Secret", los mismos valores que ya usan el hub y training) o Pro devuelve 501; (2) `GCFG` de Google (opcional, activa la conexión con Sheets); (3) deploy de `cosmart-training-core` y `mp-productos-ganadores`; (4) merge a `main`.
