/* Número secreto — adiviná con pistas de “más” y “menos”. */
(function () {
  var U = VEJ.util, h = U.h, RANGOS = { 'Fácil (1 a 50)': 50, 'Medio (1 a 100)': 100, 'Difícil (1 a 1000)': 1000 };
  VEJ.juego({
    id: 'numero-secreto', nombre: 'Número secreto', desc: 'Adiviná con pistas de “más” y “menos”.', tipo: 'mesa',
    montar: function (el, ctx) {
      var rango = 'Medio (1 a 100)';
      function menu() {
        el.innerHTML = ''; var sel = h('div', { class: 'sel', role: 'group', 'aria-label': 'Rango' });
        function p() { sel.innerHTML = ''; Object.keys(RANGOS).forEach(function (k) { sel.appendChild(h('button', { type: 'button', 'aria-pressed': String(k === rango), onclick: function () { rango = k; p(); } }, k)); }); } p();
        var rec = U.jget('vej-numero-mejor', {});
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('p', null, 'Pensé un número. Probá y te digo si es más alto o más bajo. Ganás con la menor cantidad de intentos posible.'), sel, rec[RANGOS[rango]] ? h('p', { style: 'font-weight:700' }, 'Tu mejor marca en este rango: ' + rec[RANGOS[rango]] + ' intentos') : null, h('button', { class: 'btn grande sol', type: 'button', onclick: partida }, 'Empezar')));
      }
      function partida() {
        var max = RANGOS[rango], secreto = 1 + Math.floor(Math.random() * max), intentos = 0, bajo = 1, alto = max, hist = [];
        el.innerHTML = '';
        var inp = h('input', { type: 'number', inputmode: 'numeric', min: 1, max: max, id: 'num', 'aria-label': 'Tu número', placeholder: '¿Qué número es?', style: 'text-align:center;font-size:28px;font-weight:800' }), msj = h('div', { role: 'status', 'aria-live': 'polite' }), lista = h('div', { class: 'sel', style: 'justify-content:center' }), rangoEl = h('span', null, 'Entre ' + bajo + ' y ' + alto), cant = h('span', null, 'Intentos: 0');
        function probar() {
          var v = parseInt(inp.value, 10); msj.innerHTML = '';
          if (!(v >= 1 && v <= max)) { msj.appendChild(h('div', { class: 'msg mal' }, 'Poné un número entre 1 y ' + max + '.')); return; }
          intentos++; cant.textContent = 'Intentos: ' + intentos; inp.value = '';
          if (v === secreto) {
            var rec = U.jget('vej-numero-mejor', {}); if (!rec[max] || intentos < rec[max]) { rec[max] = intentos; U.lsSet('vej-numero-mejor', JSON.stringify(rec)); }
            msj.appendChild(h('div', { class: 'msg ok' }, '¡Era ' + secreto + '! Lo adivinaste en ' + intentos + (intentos === 1 ? ' intento.' : ' intentos.')));
            msj.appendChild(h('div', { class: 'fila', style: 'margin-top:12px' }, h('button', { class: 'btn grande sol', type: 'button', onclick: partida }, 'Jugar otra vez'), h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: menu }, 'Cambiar rango'))); inp.disabled = true; go.disabled = true; return;
          }
          var mas = v < secreto; if (mas) bajo = Math.max(bajo, v + 1); else alto = Math.min(alto, v - 1);
          rangoEl.textContent = 'Entre ' + bajo + ' y ' + alto; lista.appendChild(h('span', { class: 'chip', style: 'background:' + (mas ? 'var(--azul)' : 'var(--coral)') + ';color:#fff;border-color:transparent' }, v + (mas ? ' · más alto' : ' · más bajo')));
          msj.appendChild(h('div', { class: 'msg ' + (mas ? 'info' : 'mal') }, mas ? 'Más alto.' : 'Más bajo.')); inp.focus();
        }
        var go = h('button', { class: 'btn grande', type: 'button', onclick: probar }, 'Probar');
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') probar(); });
        el.appendChild(h('div', { class: 'estado' }, rangoEl, cant)); el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, inp, go)); el.appendChild(msj); el.appendChild(lista);
      }
      menu();
    }
  });
})();
