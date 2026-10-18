/* Ahorcado — solo (palabra al azar) o entre amigos (palabra secreta que escribe uno de ustedes). */
(function () {
  var U = VEJ.util, h = U.h;
  var BANCO = { 'Verano': ['SOMBRILLA', 'PROTECTOR', 'HELADO', 'MOCHILA', 'VACACIONES', 'REPOSERA', 'CARPA', 'FOGON', 'PILETA', 'CARACOL', 'ATARDECER', 'BROCHETA'], 'Animales': ['ELEFANTE', 'MURCIELAGO', 'CARPINCHO', 'TORTUGA', 'PINGUINO', 'CANGREJO', 'MARIPOSA', 'JIRAFA', 'DELFIN', 'GAVIOTA'], 'Comidas': ['MILANESA', 'EMPANADA', 'ALFAJOR', 'CHORIPAN', 'PROVOLETA', 'ENSALADA', 'FIDEOS', 'BUDIN', 'PANQUEQUE', 'LASAÑA'], 'Países': ['ARGENTINA', 'URUGUAY', 'BRASIL', 'PARAGUAY', 'CHILE', 'ESPAÑA', 'MEXICO', 'JAPON', 'ITALIA', 'CANADA'] };
  var TECLAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  var sinTilde = function (s) { return s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, function (m) { return m; }).replace(/Ñ/g, 'Ñ').replace(/[̀-ͯ]/g, ''); };
  function dibujo(err) {
    var partes = ['<line x1="20" y1="170" x2="120" y2="170"/><line x1="40" y1="170" x2="40" y2="20"/><line x1="40" y1="20" x2="110" y2="20"/><line x1="110" y1="20" x2="110" y2="40"/>', '<circle cx="110" cy="52" r="12"/>', '<line x1="110" y1="64" x2="110" y2="110"/>', '<line x1="110" y1="74" x2="92" y2="94"/>', '<line x1="110" y1="74" x2="128" y2="94"/>', '<line x1="110" y1="110" x2="95" y2="140"/>', '<line x1="110" y1="110" x2="125" y2="140"/>'];
    return '<svg viewBox="0 0 160 180" width="170" height="190" role="img" aria-label="Errores: ' + err + ' de 6" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">' + partes.slice(0, err + 1).join('') + '</svg>';
  }
  VEJ.juego({
    id: 'ahorcado', nombre: 'Ahorcado', desc: 'Solo o entre amigos, con tu palabra secreta.', tipo: 'mesa',
    montar: function (el, ctx) {
      function menu() {
        el.innerHTML = '';
        var cat = 'Verano';
        var catSel = h('div', { class: 'sel', role: 'group', 'aria-label': 'Categoría' });
        function pintarCat() { catSel.innerHTML = ''; Object.keys(BANCO).forEach(function (k) { catSel.appendChild(h('button', { type: 'button', 'aria-pressed': String(k === cat), onclick: function () { cat = k; pintarCat(); } }, k)); }); }
        pintarCat();
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('h3', { style: 'font-size:24px' }, 'Jugar solo'), catSel, h('button', { class: 'btn grande sol', type: 'button', onclick: function () { partida(U.azar(BANCO[cat])); } }, 'Palabra al azar')));
        var inp = h('input', { type: 'text', id: 'secreta', placeholder: 'Escribí la palabra secreta', autocomplete: 'off', autocapitalize: 'characters', maxlength: 20, 'aria-label': 'Palabra secreta', style: 'text-transform:uppercase' }), er = h('div');
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('h3', { style: 'font-size:24px' }, 'Entre amigos'), h('p', null, 'Uno escribe una palabra en secreto y le pasa el celu al que adivina.'), inp, er,
          h('button', { class: 'btn grande', type: 'button', onclick: function () { var w = sinTilde(inp.value.trim()); if (!/^[A-ZÑ ]{2,20}$/.test(w) || !/[A-ZÑ]/.test(w)) { er.innerHTML = ''; er.appendChild(h('div', { class: 'msg mal' }, 'Usá entre 2 y 20 letras, sin números.')); return; } partida(w); } }, 'Empezar')));
      }
      function partida(palabra) {
        palabra = sinTilde(palabra); var usadas = {}, err = 0, fin = false;
        el.innerHTML = '';
        var dib = h('div', { class: 'centro', html: dibujo(0), style: 'color:var(--fg)' }), pal = h('div', { class: 'gran centro', style: 'font-size:clamp(28px,9vw,44px);letter-spacing:.12em;word-break:break-word;min-height:1.2em', 'aria-live': 'polite' }), msj = h('div', { role: 'status' });
        var teclado = h('div', { style: 'display:grid;grid-template-columns:repeat(7,1fr);gap:6px;width:100%' });
        var bt = {};
        TECLAS.forEach(function (l) { bt[l] = h('button', { class: 'btn', type: 'button', style: 'min-height:52px;padding:0;font-size:20px', onclick: function () { jugarLetra(l); } }, l); teclado.appendChild(bt[l]); });
        function ver() { var s = ''; for (var i = 0; i < palabra.length; i++) { var c = palabra[i]; s += c === ' ' ? '  ' : (usadas[c] || fin ? c : '_') + ' '; } pal.textContent = s.trim(); }
        function terminar(gano) {
          fin = true; ver(); Object.keys(bt).forEach(function (k) { bt[k].disabled = true; }); msj.innerHTML = '';
          msj.appendChild(h('div', { class: 'msg ' + (gano ? 'ok' : 'mal') }, gano ? '¡Ganaste! La palabra era ' + palabra + '.' : 'Perdiste. La palabra era ' + palabra + '.'));
          msj.appendChild(h('div', { class: 'fila', style: 'margin-top:12px' }, h('button', { class: 'btn grande sol', type: 'button', onclick: menu }, 'Jugar de nuevo')));
        }
        function jugarLetra(l) {
          if (fin || usadas[l]) return; usadas[l] = 1;
          if (palabra.indexOf(l) >= 0) { bt[l].style.background = 'var(--verde)'; } else { err++; bt[l].style.background = 'var(--coral)'; dib.innerHTML = dibujo(err); }
          bt[l].disabled = true; ver();
          var completa = palabra.split('').every(function (c) { return c === ' ' || usadas[c]; });
          if (completa) terminar(true); else if (err >= 6) terminar(false);
        }
        function tecla(e) { var k = e.key.length === 1 ? sinTilde(e.key) : ''; if (/^[A-ZÑ]$/.test(k)) jugarLetra(k); }
        document.addEventListener('keydown', tecla); ctx.limpiar(function () { document.removeEventListener('keydown', tecla); });
        el.appendChild(dib); el.appendChild(pal); el.appendChild(msj); el.appendChild(teclado); ver();
      }
      menu();
    }
  });
})();
