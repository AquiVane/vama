/* Simón dice — repetí la secuencia de colores. Cada ronda suma un color. */
(function () {
  var U = VEJ.util, h = U.h, TONOS = [329.6, 415.3, 261.6, 220], COLORES = ['var(--azul)', 'var(--sol)', 'var(--coral)', 'var(--verde)'], NOM = ['Azul', 'Amarillo', 'Rojo', 'Verde'];
  VEJ.juego({
    id: 'simon', nombre: 'Simón dice', desc: 'Repetí la secuencia de colores sin equivocarte.', tipo: 'mesa',
    montar: function (el, ctx) {
      var audio = null, seq = [], paso = 0, turno = 'espera', mejor = +(U.lsGet('vej-simon-mejor') || 0), sonido = U.lsGet('vej-sonido') !== '0', tms = [];
      function tono(i, dur) { if (!sonido) return; try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); var o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = TONOS[i]; g.gain.value = .18; o.connect(g); g.connect(audio.destination); o.start(); setTimeout(function () { try { o.stop(); } catch (e) { } }, dur || 300); } catch (e) { } }
      var pads = [], msj = h('div', { role: 'status', 'aria-live': 'polite', class: 'centro', style: 'font-weight:700;min-height:28px' }), ronda = h('span', null, 'Ronda: 0'), rec = h('span', null, 'Mejor: ' + mejor);
      var tab = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(100%,420px)' });
      for (var i = 0; i < 4; i++) (function (i) { var b = h('button', { type: 'button', 'aria-label': NOM[i], style: 'aspect-ratio:1;min-height:110px;border:0;border-radius:28px;background:' + COLORES[i] + ';opacity:.55;transition:opacity .1s,transform .1s;box-shadow:0 6px 0 rgba(14,34,51,.25)', onclick: function () { tocar(i); } }); pads.push(b); tab.appendChild(b); })(i);
      function encender(i, dur) { pads[i].style.opacity = '1'; pads[i].style.transform = 'scale(.96)'; tono(i, dur); var t = setTimeout(function () { pads[i].style.opacity = '.55'; pads[i].style.transform = ''; }, dur || 300); tms.push(t); }
      ctx.limpiar(function () { tms.forEach(clearTimeout); try { audio && audio.close(); } catch (e) { } });
      function reproducir() {
        turno = 'espera'; msj.textContent = 'Mirá la secuencia…'; var vel = Math.max(250, 600 - seq.length * 25);
        seq.forEach(function (c, k) { tms.push(setTimeout(function () { encender(c, vel * .7); }, 700 + k * vel)); });
        tms.push(setTimeout(function () { turno = 'jugador'; paso = 0; msj.textContent = 'Tu turno'; }, 700 + seq.length * vel));
      }
      function siguiente() { seq.push(Math.floor(Math.random() * 4)); ronda.textContent = 'Ronda: ' + seq.length; reproducir(); }
      function tocar(i) {
        if (turno !== 'jugador') return; encender(i, 220);
        if (i !== seq[paso]) { turno = 'fin'; var logro = seq.length - 1; if (logro > mejor) { mejor = logro; U.lsSet('vej-simon-mejor', String(mejor)); rec.textContent = 'Mejor: ' + mejor; } msj.innerHTML = ''; msj.appendChild(h('div', { class: 'msg mal' }, 'Te equivocaste. Llegaste a la ronda ' + Math.max(logro, 0) + '.')); empezar.hidden = false; empezar.textContent = 'Jugar de nuevo'; return; }
        paso++; if (paso === seq.length) { turno = 'espera'; msj.textContent = '¡Bien!'; tms.push(setTimeout(siguiente, 900)); }
      }
      var empezar = h('button', { class: 'btn grande sol', type: 'button', onclick: function () { seq = []; empezar.hidden = true; msj.textContent = ''; siguiente(); } }, 'Empezar');
      var son = h('button', { class: 'btn chico linea', type: 'button', style: 'color:var(--fg)', 'aria-pressed': String(sonido), onclick: function () { sonido = !sonido; U.lsSet('vej-sonido', sonido ? '1' : '0'); son.textContent = 'Sonido: ' + (sonido ? 'sí' : 'no'); son.setAttribute('aria-pressed', String(sonido)); } }, 'Sonido: ' + (sonido ? 'sí' : 'no'));
      el.appendChild(h('div', { class: 'estado' }, ronda, rec)); el.appendChild(msj); el.appendChild(tab); el.appendChild(empezar); el.appendChild(son);
    }
  });
})();
