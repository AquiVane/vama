# Instrucciones para Claude Code en este repo

Este repo (`AquiVane/vama`) es el frontend estático de **VAMA Academy** (`academy.vamatienda.com.ar`), publicado con GitHub Pages (branch `main`, raíz). Trabajás para Vaneh (COSMART).

## Al empezar cualquier sesión

Leé **`HANDOFF.md`** (raíz de este repo) ANTES de tocar código. El backend vive en `AquiVane/cosmart-workers` (worker `cosmart-training-core` + `mp-productos-ganadores`): revisá también su `HANDOFF.md` si la tarea cruza con pagos, usuarios, emails o archivos.

## Reglas duras

- Vaneh se comunica **solo en español** — nunca respondas en inglés.
- **Nunca hagas cambios no pedidos.** Si algo te parece mejorable, preguntá antes.
- **Repo PÚBLICO: jamás subir claves, tokens ni los archivos pagos** (xlsx, PDFs, video). Los archivos van al Worker (R2, detrás del login). Solo se admiten valores públicos por diseño (public key de MP, client-id de PayPal, ID del Pixel).
- **Nunca sacar a la persona del checkout para pagar** (ni Mercado Pago hosteado): el pago va embebido (Brick + PayPal).
- **Nunca un desvío/lead magnet en una página de producto**: todo lleva a la compra.
- Todo se optimiza para **mobile primero**; probá sin scroll horizontal y con todos los botones funcionando.
- Las páginas nuevas se muestran primero en preview (artifact) para que Vaneh las corrija.
- Sin build: HTML/CSS/JS plano. Validá el JS inline con `node --check` antes de commitear.
