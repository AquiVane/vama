/* Juegos de mesa (sin niveles): Impostor, Tutti frutti, Mímica, ¿Quién es más probable?, Desafíos de verano */
(function () {
  var U = VEJ.util, h = U.h, mezclar = U.mezclar, azar = U.azar, tiempo = U.tiempo;

  // ── componentes comunes ──
  function selector(opciones, valor, alCambiar, etiqueta) {
    var caja = h('div', { class: 'sel', role: 'group', 'aria-label': etiqueta });
    function pintar() { caja.innerHTML = ''; opciones.forEach(function (o) { caja.appendChild(h('button', { type: 'button', 'aria-pressed': String(o.v === valor), onclick: function () { valor = o.v; alCambiar(valor); pintar(); } }, o.t)); }); }
    pintar(); return caja;
  }
  function contador(el, desde, alTerminar, ctx) {
    // Cuenta regresiva grande (para turnos con tiempo). Devuelve {parar, tiempo}
    var seg = desde, vista = h('div', { class: 'gran', style: 'font-size:clamp(56px,20vw,110px)', 'aria-live': 'off' }, tiempo(seg)), id;
    el.appendChild(vista);
    id = setInterval(function () { seg--; vista.textContent = tiempo(Math.max(seg, 0)); if (seg <= 0) { clearInterval(id); alTerminar(); } }, 1000);
    ctx.limpiar(function () { clearInterval(id); });
    return { parar: function () { clearInterval(id); }, restante: function () { return seg; } };
  }
  function vibrar(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }

  /* ───────── 1. IMPOSTOR ───────── */
  var PALABRAS = {
    'Verano': ['Pileta', 'Protector solar', 'Helado', 'Reposera', 'Sombrilla', 'Ojotas', 'Mate', 'Carpa', 'Choclo', 'Ventilador', 'Piel de sol', 'Arena', 'Cucha', 'Ensalada de frutas', 'Fogón', 'Heladera', 'Siesta', 'Colectivo', 'Balde', 'Salvavidas'],
    'Comidas': ['Asado', 'Milanesa', 'Empanada', 'Pizza', 'Ñoquis', 'Locro', 'Alfajor', 'Dulce de leche', 'Provoleta', 'Choripán', 'Fideos', 'Flan', 'Tarta', 'Sándwich de miga', 'Torta frita'],
    'Lugares': ['Playa', 'Cine', 'Escuela', 'Hospital', 'Aeropuerto', 'Supermercado', 'Estadio', 'Biblioteca', 'Terminal de micros', 'Camping', 'Plaza', 'Banco', 'Museo', 'Peluquería', 'Casino'],
    'Animales': ['Perro', 'Gato', 'Caballo', 'Pingüino', 'Delfín', 'Zorro', 'Loro', 'Tortuga', 'Carpincho', 'Jirafa', 'Cangrejo', 'Hormiga', 'Mono', 'Pulpo', 'Murciélago']
  };
  VEJ.juego({
    id: 'impostor', nombre: 'Impostor', desc: 'Uno no sabe la palabra. ¿Quién es?', tipo: 'mesa',
    montar: function (el, ctx) {
      var cfg = { jugadores: 5, cat: 'Verano', impostores: 1 };
      function config() {
        el.innerHTML = '';
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' },
          h('p', null, 'Todos reciben la misma palabra menos el impostor. Pasen el celu de a uno: cada jugador mira en secreto y lo vuelve a pasar.'),
          h('label', null, 'Jugadores'), selector([3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (n) { return { v: n, t: String(n) }; }), cfg.jugadores, function (v) { cfg.jugadores = v; if (cfg.impostores >= v) cfg.impostores = 1; }, 'Cantidad de jugadores'),
          h('label', null, 'Categoría'), selector(Object.keys(PALABRAS).map(function (k) { return { v: k, t: k }; }), cfg.cat, function (v) { cfg.cat = v; }, 'Categoría'),
          h('label', null, 'Impostores'), selector([1, 2].map(function (n) { return { v: n, t: String(n) }; }), cfg.impostores, function (v) { cfg.impostores = v; }, 'Cantidad de impostores'),
          h('button', { class: 'btn grande sol', type: 'button', onclick: empezar }, 'Empezar')));
      }
      function empezar() {
        var n = cfg.jugadores, imp = Math.min(cfg.impostores, Math.max(1, Math.floor((n - 1) / 2))), palabra = azar(PALABRAS[cfg.cat]);
        var roles = mezclar(Array.apply(null, Array(n)).map(function (_, i) { return i < imp ? 'imp' : 'ok'; })), turno = 0;
        function pasar() {
          el.innerHTML = '';
          if (turno >= n) return discusion();
          el.appendChild(h('div', { class: 'tarjeta centro', style: 'width:100%' }, h('h3', { style: 'font-size:30px' }, 'Jugador ' + (turno + 1) + ' de ' + n),
            h('p', null, 'Tocá para ver tu palabra. Que nadie más mire.'),
            h('button', { class: 'btn grande', type: 'button', onclick: ver }, 'Ver mi palabra')));
        }
        function ver() {
          el.innerHTML = '';
          var rol = roles[turno];
          el.appendChild(h('div', { class: 'tarjeta centro oscuro', style: 'width:100%;background:' + (rol === 'imp' ? 'var(--coral)' : 'var(--azul)') },
            h('p', null, rol === 'imp' ? 'Sos el' : 'La palabra es'),
            h('div', { class: 'gran', style: 'font-size:clamp(40px,13vw,72px);word-break:break-word' }, rol === 'imp' ? 'IMPOSTOR' : palabra),
            h('p', null, rol === 'imp' ? 'Disimulá y tratá de adivinar la palabra.' : 'No la digas. Da pistas sin ser obvio.'),
            h('button', { class: 'btn grande sol', type: 'button', onclick: function () { turno++; pasar(); } }, 'Ya la vi, pasar el celu')));
        }
        function discusion() {
          el.appendChild(h('div', { class: 'tarjeta centro', style: 'width:100%' }, h('h3', { style: 'font-size:30px' }, 'A debatir'),
            h('p', null, 'Cada uno dice una palabra relacionada, una por vuelta. Después votan al impostor.'),
            h('div', { id: 'tiempo' }),
            h('button', { class: 'btn grande coral', type: 'button', onclick: revelar }, 'Revelar al impostor')));
          contador(el.querySelector('#tiempo'), 180, function () { vibrar(400); }, ctx);
        }
        function revelar() {
          var quienes = []; roles.forEach(function (r, i) { if (r === 'imp') quienes.push('Jugador ' + (i + 1)); });
          el.innerHTML = '';
          el.appendChild(h('div', { class: 'tarjeta centro', style: 'width:100%' }, h('p', null, 'La palabra era'), h('div', { class: 'gran', style: 'font-size:clamp(36px,12vw,64px)' }, palabra),
            h('p', null, (quienes.length > 1 ? 'Los impostores eran: ' : 'El impostor era: ') + quienes.join(' y ')),
            h('button', { class: 'btn grande sol', type: 'button', onclick: empezar }, 'Otra ronda'), h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: config }, 'Cambiar ajustes')));
        }
        pasar();
      }
      config();
    }
  });

  /* ───────── 2. TUTTI FRUTTI ───────── */
  var CATS = ['Nombre', 'Apellido', 'Animal', 'Fruta o verdura', 'País o ciudad', 'Color', 'Objeto', 'Comida', 'Profesión', 'Cosa de la playa', 'Marca', 'Película o serie', 'Deporte', 'Parte del cuerpo', 'Canción'];
  VEJ.juego({
    id: 'tutti-frutti', nombre: 'Tutti frutti', desc: 'Una letra, todas las categorías, a escribir rápido.', tipo: 'mesa',
    montar: function (el, ctx) {
      var LETRAS = 'ABCDEFGHIJLMNOPRSTUV'.split(''), usadas = [], cfg = { tiempo: 90, cats: 6 };
      function config() {
        el.innerHTML = '';
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' },
          h('p', null, 'Con papel y lápiz: salta una letra y cada uno completa las categorías con palabras que empiecen con ella. Gana el que más tiene.'),
          h('label', null, 'Categorías por ronda'), selector([5, 6, 8, 10].map(function (n) { return { v: n, t: String(n) }; }), cfg.cats, function (v) { cfg.cats = v; }, 'Categorías'),
          h('label', null, 'Tiempo'), selector([{ v: 60, t: '1 min' }, { v: 90, t: '1:30' }, { v: 120, t: '2 min' }, { v: 0, t: 'Sin tiempo' }], cfg.tiempo, function (v) { cfg.tiempo = v; }, 'Tiempo'),
          h('button', { class: 'btn grande sol', type: 'button', onclick: ronda }, 'Sacar letra')));
      }
      function ronda() {
        if (usadas.length >= LETRAS.length) usadas = [];
        var l = azar(LETRAS.filter(function (x) { return usadas.indexOf(x) < 0; })); usadas.push(l);
        var cats = mezclar(CATS).slice(0, cfg.cats); el.innerHTML = '';
        var terminado = false;
        el.appendChild(h('div', { class: 'tarjeta centro oscuro', style: 'width:100%;background:var(--azul)' }, h('p', null, 'La letra es'), h('div', { class: 'gran', style: 'font-size:clamp(100px,38vw,200px)' }, l)));
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('h3', { style: 'font-size:22px' }, 'Categorías'), h('ol', { style: 'margin:0;padding-left:1.3em;font-size:20px;display:flex;flex-direction:column;gap:4px' }, cats.map(function (c) { return h('li', null, c); }))));
        var barra = h('div', { class: 'centro', style: 'width:100%' });
        el.appendChild(barra);
        if (cfg.tiempo) contador(barra, cfg.tiempo, function () { if (!terminado) { terminado = true; vibrar(500); alert_basta('¡Tiempo!'); } }, ctx);
        el.appendChild(h('div', { class: 'fila', style: 'width:100%' },
          h('button', { class: 'btn grande coral', type: 'button', onclick: function () { terminado = true; alert_basta('¡Basta para todos!'); } }, '¡Basta!'),
          h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: ronda }, 'Otra letra')));
        function alert_basta(t) { barra.innerHTML = ''; barra.appendChild(h('div', { class: 'msg info' }, t + ' Dejen de escribir y comparen respuestas.')); }
      }
      config();
    }
  });

  /* ───────── 3. MÍMICA ───────── */
  var MIMICA = {
    'Fácil': ['Dormir', 'Nadar', 'Cocinar', 'Cepillarse los dientes', 'Manejar', 'Bailar', 'Llorar de risa', 'Tomar mate', 'Hablar por teléfono', 'Sacar una foto', 'Jugar al fútbol', 'Pescar', 'Pasear al perro', 'Tocar la guitarra', 'Comer un helado'],
    'Medio': ['Un pingüino', 'Armar una carpa', 'Cebar mate', 'Policía de tránsito', 'Surfear', 'Hacer un asado', 'Un mozo con bandeja', 'Esquiar', 'Abrir un paraguas con viento', 'Una película de terror', 'Bañar a un gato', 'Hacer surf de remo', 'Un astronauta', 'Peluquero', 'Pasar la aspiradora'],
    'Difícil': ['Perder el micro', 'Quedarse sin batería', 'Un abuelo con el control remoto', 'Cantar en el karaoke', 'Escapar de una abeja', 'Una ola gigante', 'Encontrar una cucaracha', 'Armar un mueble sin manual', 'Reír con la boca llena', 'Un robot sin batería', 'Dar la bienvenida a los invitados', 'Perderse en el shopping']
  };
  VEJ.juego({
    id: 'mimica', nombre: 'Mímica', desc: 'Actuá sin hablar y que los demás adivinen.', tipo: 'mesa',
    montar: function (el, ctx) {
      var cfg = { dif: 'Fácil', tiempo: 60 }, aciertos = 0, mazo = [];
      function config() {
        el.innerHTML = '';
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('p', null, 'Uno actúa sin hablar, el resto adivina. Cuando aciertan, tocá “Acertaron”. Si es muy difícil, “Pasar”.'),
          h('label', null, 'Dificultad'), selector(Object.keys(MIMICA).map(function (k) { return { v: k, t: k }; }), cfg.dif, function (v) { cfg.dif = v; }, 'Dificultad'),
          h('label', null, 'Tiempo por turno'), selector([{ v: 45, t: '45 s' }, { v: 60, t: '1 min' }, { v: 90, t: '1:30' }], cfg.tiempo, function (v) { cfg.tiempo = v; }, 'Tiempo'),
          h('button', { class: 'btn grande sol', type: 'button', onclick: preparar }, 'Armar turno')));
      }
      function preparar() {
        el.innerHTML = ''; aciertos = 0; mazo = mezclar(MIMICA[cfg.dif]);
        el.appendChild(h('div', { class: 'tarjeta centro', style: 'width:100%' }, h('h3', { style: 'font-size:28px' }, 'Pasale el celu al que va a actuar'), h('p', null, 'Los demás no miren la pantalla.'),
          h('button', { class: 'btn grande', type: 'button', onclick: turno }, 'Listo, empezar')));
      }
      function turno() {
        el.innerHTML = ''; var fin = false;
        var palabra = h('div', { class: 'gran', style: 'font-size:clamp(34px,11vw,60px);min-height:2.4em;display:flex;align-items:center;justify-content:center;word-break:break-word' });
        var marcador = h('span', null, 'Aciertos: 0'), zonaT = h('div', { class: 'centro' });
        function sig() { if (!mazo.length) mazo = mezclar(MIMICA[cfg.dif]); palabra.textContent = mazo.pop(); }
        el.appendChild(h('div', { class: 'estado' }, marcador));
        el.appendChild(zonaT);
        el.appendChild(h('div', { class: 'tarjeta centro oscuro', style: 'width:100%;background:var(--azul)' }, palabra));
        var bs = h('div', { class: 'fila', style: 'width:100%' },
          h('button', { class: 'btn grande verde', type: 'button', onclick: function () { if (fin) return; aciertos++; marcador.textContent = 'Aciertos: ' + aciertos; sig(); } }, 'Acertaron'),
          h('button', { class: 'btn grande linea', type: 'button', style: 'color:var(--fg)', onclick: function () { if (!fin) sig(); } }, 'Pasar'));
        el.appendChild(bs); sig();
        contador(zonaT, cfg.tiempo, function () { fin = true; vibrar(500); el.innerHTML = ''; el.appendChild(h('div', { class: 'tarjeta centro', style: 'width:100%' }, h('h3', { style: 'font-size:30px' }, '¡Se acabó el tiempo!'), h('div', { class: 'gran', style: 'font-size:72px' }, String(aciertos)), h('p', null, aciertos === 1 ? 'palabra acertada' : 'palabras acertadas'),
          h('button', { class: 'btn grande sol', type: 'button', onclick: preparar }, 'Siguiente turno'), h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: config }, 'Cambiar ajustes'))); }, ctx);
      }
      config();
    }
  });

  /* ───────── 4. ¿QUIÉN ES MÁS PROBABLE? ───────── */
  var PROBABLE = [
    '¿Quién es más probable que se quede dormido en la playa?', '¿Quién es más probable que pierda las llaves en las vacaciones?', '¿Quién es más probable que le pida una foto a un famoso?', '¿Quién es más probable que se meta al agua con ropa?',
    '¿Quién es más probable que llegue tarde al micro?', '¿Quién es más probable que se enamore de un compañero de viaje?', '¿Quién es más probable que se quede sin batería en el peor momento?', '¿Quién es más probable que gane un concurso de baile?',
    '¿Quién es más probable que se pierda con el mapa en la mano?', '¿Quién es más probable que coma el último pedazo sin preguntar?', '¿Quién es más probable que se queme la espalda por no ponerse protector?', '¿Quién es más probable que se haga amigo de todos en el camping?',
    '¿Quién es más probable que cuente el mismo chiste cinco veces?', '¿Quién es más probable que se ría en un momento serio?', '¿Quién es más probable que se olvide del cumpleaños de alguien?', '¿Quién es más probable que le dé miedo una gaviota?',
    '¿Quién es más probable que organice todo el viaje?', '¿Quién es más probable que se quede dormido en el cine?', '¿Quién es más probable que invente una excusa para no cocinar?', '¿Quién es más probable que termine cantando en el karaoke?',
    '¿Quién es más probable que se cuele en una fila?', '¿Quién es más probable que haga un asado perfecto?', '¿Quién es más probable que vuelva con arena hasta en la mochila?', '¿Quién es más probable que se gaste todo el dinero en souvenirs?',
    '¿Quién es más probable que le cante a alguien en la calle?', '¿Quién es más probable que sea el último en dormirse?', '¿Quién es más probable que llore viendo una película?', '¿Quién es más probable que sobreviva en una isla desierta?'
  ];
  VEJ.juego({
    id: 'quien-es-mas-probable', nombre: '¿Quién es más probable?', desc: 'Señalen al que se la merece.', tipo: 'mesa',
    montar: function (el, ctx) {
      var mazo = mezclar(PROBABLE), n = 0;
      function carta() {
        el.innerHTML = ''; if (!mazo.length) mazo = mezclar(PROBABLE); n++;
        var txt = mazo.pop();
        el.appendChild(h('div', { class: 'tarjeta centro oscuro', style: 'width:100%;background:var(--coral);min-height:240px;justify-content:center' }, h('p', { style: 'font-size:14px;letter-spacing:.1em;font-weight:700' }, 'PREGUNTA ' + n), h('p', { class: 'gran', style: 'font-size:clamp(26px,8vw,40px);line-height:1.1' }, txt)));
        el.appendChild(h('p', { class: 'centro' }, 'A la cuenta de tres, todos señalan a la vez.'));
        el.appendChild(h('div', { class: 'fila', style: 'width:100%' }, h('button', { class: 'btn grande sol', type: 'button', onclick: cuenta }, 'A la una, a las dos…'), h('button', { class: 'btn grande', type: 'button', onclick: carta }, 'Otra pregunta')));
      }
      function cuenta() {
        var ov = h('div', { class: 'superpuesto', role: 'dialog', 'aria-label': 'Cuenta regresiva' }), c = 3, num = h('div', { class: 'gran cuenta', style: 'color:#fff' }, '3');
        ov.appendChild(h('div', { class: 'centro' }, num)); document.body.appendChild(ov);
        var id = setInterval(function () { c--; if (c > 0) num.textContent = c; else if (c === 0) { num.textContent = '¡Señalen!'; num.style.fontSize = 'clamp(48px,16vw,100px)'; vibrar(300); } else { clearInterval(id); ov.remove(); } }, 900);
        ctx.limpiar(function () { clearInterval(id); ov.remove(); });
      }
      carta();
    }
  });

  /* ───────── 5. DESAFÍOS DE VERANO ───────── */
  var RETOS = {
    'Pileta': ['Aguantá la respiración bajo el agua lo más que puedas. El que menos aguanta, paga un helado.', 'Hacé la mejor entrada al agua. Que el resto le ponga puntaje de 1 a 10.', 'Nadá un largo sin usar las piernas.', 'Hacé una coreografía de nado sincronizado entre dos.', 'Tirate de panza. El grupo puntúa.', 'Mantené una pelota en el aire sin salir del agua, un minuto.'],
    'Playa': ['Hacé un castillo de arena con los ojos cerrados. Los demás lo juzgan.', 'Encontrá tres cosas de tres colores distintos en 2 minutos.', 'Escribí un mensaje en la arena sin usar las manos.', 'Corré hasta el agua y volvé caminando hacia atrás.', 'Entrá al mar contando un chiste a los gritos.', 'Hacé una escultura de arena de alguien del grupo.'],
    'Mesa': ['Hablá 30 segundos sin decir “sí” ni “no”.', 'Imitá a alguien del grupo hasta que lo adivinen.', 'Contá una anécdota de verano en 20 segundos exactos.', 'Inventá un eslogan para el vaso que tenés enfrente.', 'Hacé reír a alguien sin tocarlo ni hablar.', 'Describí tu verano ideal usando solo tres palabras por frase.', 'Cantá el estribillo de una canción cambiando todas las vocales por “a”.']
  };
  VEJ.juego({
    id: 'desafios', nombre: 'Desafíos de verano', desc: 'Retos para la pileta, la playa o la mesa.', tipo: 'mesa',
    montar: function (el, ctx) {
      var lugar = 'Mesa', mazos = {};
      function pantalla() {
        el.innerHTML = '';
        el.appendChild(h('div', { class: 'tarjeta', style: 'width:100%' }, h('label', null, '¿Dónde están?'), selector(Object.keys(RETOS).map(function (k) { return { v: k, t: k }; }), lugar, function (v) { lugar = v; }, 'Lugar'), h('button', { class: 'btn grande sol', type: 'button', onclick: sacar }, 'Sacar un desafío')));
      }
      function sacar() {
        if (!mazos[lugar] || !mazos[lugar].length) mazos[lugar] = mezclar(RETOS[lugar]);
        var r = mazos[lugar].pop(); el.innerHTML = '';
        el.appendChild(h('div', { class: 'tarjeta centro oscuro', style: 'width:100%;background:var(--verde);min-height:220px;justify-content:center' }, h('p', { style: 'font-size:14px;letter-spacing:.1em;font-weight:700' }, lugar.toUpperCase()), h('p', { class: 'gran', style: 'font-size:clamp(24px,7vw,34px);line-height:1.15' }, r)));
        var t = h('div', { class: 'centro', style: 'width:100%' }); el.appendChild(t);
        el.appendChild(h('div', { class: 'fila', style: 'width:100%' }, h('button', { class: 'btn grande', type: 'button', onclick: function () { t.innerHTML = ''; contador(t, 30, function () { vibrar(400); }, ctx); } }, 'Cronómetro 30 s'), h('button', { class: 'btn grande sol', type: 'button', onclick: sacar }, 'Otro desafío')));
        el.appendChild(h('button', { class: 'btn linea', type: 'button', style: 'color:var(--fg)', onclick: pantalla }, 'Cambiar de lugar'));
      }
      pantalla();
    }
  });
})();
