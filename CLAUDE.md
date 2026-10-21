# Instrucciones para Claude Code en este repo

Este repo (`AquiVane/vama`) es el frontend estático de **VAMA Academy** (`academy.vamatienda.com.ar`), publicado con GitHub Pages (branch `main`, raíz). Trabajás para Vaneh (COSMART).

## Al empezar cualquier sesión

Leé **`HANDOFF.md`** (raíz de este repo) ANTES de tocar código. El backend vive en `AquiVane/cosmart-workers` (worker `cosmart-training-core` + `mp-productos-ganadores`): revisá también su `HANDOFF.md` si la tarea cruza con pagos, usuarios, emails o archivos.

## Reglas duras

- Vaneh se comunica **solo en español** — nunca respondas en inglés.
- **Nunca hagas cambios no pedidos.** Si algo te parece mejorable, preguntá antes.
- **Repo PÚBLICO: jamás subir claves, tokens ni los archivos pagos** (xlsx, PDFs, video). Los archivos van al Worker (R2, detrás del login). Solo se admiten valores públicos por diseño (public key de MP, client-id de PayPal, ID del Pixel).
- **Nunca sacar a la persona del checkout para pagar** (ni Mercado Pago hosteado): el pago va embebido (Brick + PayPal). Única excepción (Vaneh, 20/10/2026): si ella elige "Mercado Pago" o "Mercado Crédito" dentro del Brick, sale a la pantalla de MP y vuelve por `back_urls`.
- **Nunca un desvío/lead magnet en una página de producto**: todo lleva a la compra.
- Todo se optimiza para **mobile primero**; probá sin scroll horizontal y con todos los botones funcionando.
- Las páginas nuevas se muestran primero en preview (artifact) para que Vaneh las corrija.
- Sin build: HTML/CSS/JS plano. Validá el JS inline con `node --check` antes de commitear.
- **Marcas propias (regla de Vaneh, 17/10/2026):** toda app, ebook o recurso nuevo que NO sea de COSMART ni de VAMA y tenga branding propio debe tener su propio AI Operating System, armado con la misma estructura del de COSMART pero con contenido propio. Antes de escribir o diseñar cualquier cosa para esa marca, leé su Operating System. Los documentos viven en repos PRIVADOS: **este repo es público, nunca copiar acá un Operating System** (es contenido sensible); pedírselo a Vaneh o leerlo desde el repo privado. Nunca se mezcla con el de COSMART ni con el de otra marca.

- **Checkout: el pago carga apenas abre la página (regla de Vaneh, 21/10/2026).** El Brick de Mercado Pago y los botones de PayPal se arman al cargar la página, nunca al hacer scroll ni después de escribir el email/nombre: al llegar abajo ya tienen que estar listos. El email/nombre se validan recién al pagar (en `onSubmit` / `onClick`), y escribir datos NO vuelve a armar el Brick. Pedir SDK y preferencia en paralelo lo antes posible (ver `habitos/index.html` de BienSmart y `js/checkout-robusto.js`).

- **Los links abren en otra pestaña (regla de Vaneh, 21/10/2026):** TODOS los links (existentes y nuevos) llevan `target="_blank" rel="noopener"`, para que la persona no pierda la página donde estaba. Solo se exceptúan anclas internas (`#`), `mailto:` y `tel:`. Las navegaciones por JS del flujo de pago (`location.href` tras pagar) no se tocan: el navegador bloquea las pestañas abiertas sin un clic.
