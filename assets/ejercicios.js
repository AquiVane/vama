// Ejercicios completables del curso "Tus dólares, bien puestos" (checklist, calculadora, reparto, plan del mes).
// El contenido (textos y campos) viene del Worker con la compra; acá solo se dibujan y se calculan.
window.VAMA_EJ = (function () {
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Números en formato argentino: "1.500.000", "1500,50", "12.5"
  function num(t) {
    t = String(t == null ? '' : t).trim().replace(/[$%\s]/g, '');
    if (!t) return NaN;
    if (t.indexOf(',') > -1) t = t.replace(/\./g, '').replace(',', '.');
    else { var d = t.split('.'); if (d.length > 2) t = d.join(''); else if (d.length === 2 && d[1].length === 3) t = d.join(''); }
    return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN;
  }
  function ars(n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); }
  function pct(n, d) { return n.toLocaleString('es-AR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }) + '%'; }

  // Cálculo de "¿Le ganás a la inflación?" (fórmulas del libro)
  function calcInflacion(v) {
    var m = v.monto, tna = v.tna, dias = v.dias, inf = v.inflacion;
    var r = { interes: m * tna / 100 * dias / 365, rend_periodo_pct: tna * dias / 365 };
    r.real_pct = ((1 + tna / 100 * dias / 365) / (1 + inf / 100) - 1) * 100;
    r.tea_pct = (Math.pow(1 + tna / 100 * dias / 365, 365 / dias) - 1) * 100;
    return r;
  }
  function veredicto(real, m) { return real > 0.1 ? m.gana : (real >= -0.1 ? m.empata : m.pierde); }

  var LABELS = { mes: 'Mes', sobrante: 'Lo que te sobra este mes ($)', fondo_actual: 'Tu fondo de emergencia hoy ($)', fondo_meta: 'Meta de tu fondo ($)', 'deudas_caras (si/no)': '¿Tenés deudas caras?',
    caja1_para_que: 'Caja 1 · ¿para qué?', caja1_monto: 'Caja 1 · monto ($)', caja1_donde: 'Caja 1 · ¿dónde?', caja2_para_que: 'Caja 2 · ¿para qué?', caja2_monto: 'Caja 2 · monto ($)', caja2_donde: 'Caja 2 · ¿dónde?',
    caja3_para_que: 'Caja 3 · ¿para qué?', caja3_monto: 'Caja 3 · monto ($)', caja3_donde: 'Caja 3 · ¿dónde?', tasa_tna: 'Tasa que te pagan (TNA %)', inflacion_mes: 'Inflación del mes (%)', proxima_revision: 'Próxima revisión', algo_para_aprender: '¿Algo para aprender?' };

  function inp(id, label, val, extra) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" value="' + esc(val == null ? '' : val) + '"' + (extra || '') + '></div>';
  }

  // render(contenedor, ejercicio, n, guardado, guardar(datos, mes))  guardado = { datos } o { porMes: { 'YYYY-MM': datos } }
  function render(box, ej, n, guardado, guardar) {
    var id = 'ej' + n + '-', h = '<div class="ej"><h3>' + esc(ej.titulo) + '</h3>', d = (guardado && guardado.datos) || {};
    var status = function () { return box.querySelector('.ej-msg'); };
    if (ej.tipo === 'checklist') {
      h += ej.items.map(function (t, i) { return '<label class="ej-chk"><input type="checkbox" data-i="' + i + '"' + (d['i' + i] ? ' checked' : '') + '> <span>' + esc(t) + '</span></label>'; }).join('') + '<p class="ej-msg msg okk" hidden></p></div>';
      box.innerHTML = h;
      var upd = function (guardarTambien) {
        var c = box.querySelectorAll('input[type=checkbox]'), todos = true, datos = {};
        c.forEach(function (x, i) { datos['i' + i] = x.checked; if (!x.checked) todos = false; });
        var m = status(); m.hidden = false; m.textContent = todos ? ej.resultado.todos : ej.resultado.faltan;
        if (guardarTambien) guardar(datos);
      };
      box.querySelectorAll('input[type=checkbox]').forEach(function (x) { x.addEventListener('change', function () { upd(true); }); });
      upd(false); return;
    }
    if (ej.tipo === 'calculadora') {
      h += ej.campos.map(function (c) { return inp(id + c.id, c.label, d[c.id] != null ? d[c.id] : '', ' placeholder="Ej: ' + esc(c.ejemplo) + '"'); }).join('') +
        '<button type="button" class="cta" id="' + id + 'go">Calcular</button><div class="ej-out" id="' + id + 'out"></div><p class="ej-msg msg okk" hidden></p></div>';
      box.innerHTML = h;
      box.querySelector('#' + id + 'go').addEventListener('click', function () {
        var v = {}, ok = true;
        ej.campos.forEach(function (c) { v[c.id] = num(box.querySelector('#' + id + c.id).value); if (!(v[c.id] >= 0) || isNaN(v[c.id])) ok = false; });
        var m = status();
        if (!ok || !(v.dias > 0)) { m.hidden = false; m.className = 'ej-msg msg err'; m.textContent = 'Completá todos los campos con números.'; return; }
        var r = calcInflacion(v);
        box.querySelector('#' + id + 'out').innerHTML = '<div class="row2" style="margin:12px 0"><div class="card"><small>Interés ganado</small><br><b>' + ars(r.interes) + '</b></div><div class="card"><small>Rendimiento del período</small><br><b>' + pct(r.rend_periodo_pct) + '</b></div><div class="card"><small>Resultado real vs inflación</small><br><b>' + pct(r.real_pct, 2) + '</b></div><div class="card"><small>TEA</small><br><b>' + pct(r.tea_pct, 2) + '</b></div></div>';
        m.hidden = false; m.className = 'ej-msg msg okk'; m.textContent = veredicto(r.real_pct, ej.mensajes);
        var datos = {}; ej.campos.forEach(function (c) { datos[c.id] = box.querySelector('#' + id + c.id).value; }); guardar(datos);
      }); return;
    }
    if (ej.tipo === 'reparto') {
      h += ej.campos.map(function (c) { return inp(id + c.id, c.label, d[c.id] != null ? d[c.id] : ''); }).join('') + '<p class="ej-msg msg okk" hidden></p></div>';
      box.innerHTML = h;
      var calc = function (guardarTambien) {
        var g = function (k) { var x = num(box.querySelector('#' + id + k).value); return isNaN(x) ? 0 : x; };
        var ah = g('ahorro'), suma = g('caja1') + g('caja2') + g('caja3'), m = status(), dif = ah - suma;
        m.hidden = false;
        if (ah <= 0) { m.className = 'ej-msg msg warn'; m.textContent = 'Poné cuánto ahorrás por mes para repartirlo.'; }
        else if (Math.abs(dif) < 0.5) { m.className = 'ej-msg msg okk'; m.textContent = '¡Listo! Repartiste todo tu ahorro.'; }
        else if (dif > 0) { m.className = 'ej-msg msg warn'; m.textContent = 'Te faltan ' + ars(dif) + ' por asignar.'; }
        else { m.className = 'ej-msg msg err'; m.textContent = 'Te pasaste ' + ars(-dif) + ' de tu ahorro.'; }
        if (guardarTambien) { var datos = {}; ej.campos.forEach(function (c) { datos[c.id] = box.querySelector('#' + id + c.id).value; }); guardar(datos); }
      };
      box.querySelectorAll('input').forEach(function (x) { x.addEventListener('input', function () { calc(false); }); x.addEventListener('change', function () { calc(true); }); });
      calc(false); return;
    }
    if (ej.tipo === 'formulario_mensual') {
      var hoy = new Date(), mes0 = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0');
      var mesActual = mes0, porMes = (guardado && guardado.porMes) || {};
      var pintar = function () {
        var dm = porMes[mesActual] || {};
        var campos = ej.campos.filter(function (c) { return c !== 'mes'; });
        box.innerHTML = '<div class="ej"><h3>' + esc(ej.titulo) + '</h3><div class="field"><label for="' + id + 'mes">Mes</label><input id="' + id + 'mes" type="month" value="' + mesActual + '"></div>' +
          campos.map(function (c) {
            var k = c.split(' ')[0];
            if (c.indexOf('deudas_caras') === 0) return '<div class="field"><label for="' + id + k + '">' + esc(LABELS[c]) + '</label><select id="' + id + k + '"><option value="">Elegí</option><option' + (dm[k] === 'Sí' ? ' selected' : '') + '>Sí</option><option' + (dm[k] === 'No' ? ' selected' : '') + '>No</option></select></div>';
            var esFecha = k === 'proxima_revision';
            return '<div class="field"><label for="' + id + k + '">' + esc(LABELS[c] || c) + '</label><input id="' + id + k + '" type="' + (esFecha ? 'date' : 'text') + '"' + (esFecha ? '' : ' inputmode="' + (/monto|sobrante|fondo|tasa|inflacion/.test(k) ? 'decimal' : 'text') + '"') + ' value="' + esc(dm[k] || '') + '"></div>';
          }).join('') + '<button type="button" class="cta" id="' + id + 'save">Guardar mi plan</button><p class="ej-msg msg okk" hidden></p></div>';
        var cmp = function () {
          var tna = num((box.querySelector('#' + id + 'tasa_tna') || {}).value), inf = num((box.querySelector('#' + id + 'inflacion_mes') || {}).value), m = status();
          if (isNaN(tna) || isNaN(inf)) { m.hidden = true; return; }
          var tm = tna / 12; m.hidden = false; m.className = 'ej-msg msg okk';
          m.textContent = 'Tu tasa mensual es ' + pct(tm) + ' (TNA ÷ 12). ' + (tm > inf + 0.05 ? 'Le gana a la inflación del mes.' : (tm >= inf - 0.05 ? 'Empata con la inflación del mes.' : 'Pierde contra la inflación del mes.'));
        };
        box.querySelector('#' + id + 'mes').addEventListener('change', function () { mesActual = this.value || mes0; pintar(); });
        box.querySelectorAll('input,select').forEach(function (x) { x.addEventListener('input', cmp); });
        box.querySelector('#' + id + 'save').addEventListener('click', function () {
          var datos = {}; campos.forEach(function (c) { var k = c.split(' ')[0]; datos[k] = box.querySelector('#' + id + k).value; });
          porMes[mesActual] = datos; guardar(datos, mesActual);
          var m = status(); m.hidden = false; m.className = 'ej-msg msg okk'; m.textContent = 'Guardado.';
        });
        cmp();
      };
      pintar(); return;
    }
    box.innerHTML = '';
  }
  return { render: render, num: num, calcInflacion: calcInflacion, veredicto: veredicto };
})();
