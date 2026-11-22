/* =========================================================
   ALBA GUÍA — Reservación de hospedaje con código QR (IoT)
   Al reservar se genera un QR con los datos del huésped.
   El dueño lo escanea en verificar.php.
   ========================================================= */
(function () {
  const SECRETO = 'rutas-de-encanto-2026';   // debe ser IGUAL en verificar.php

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = n => '$' + Number(n).toLocaleString('es-MX');
  const fecha = s => new Date(s + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const tarifasViaje = {
    1: { economico: 220, medio: 450, premium: 850, guia: 700 },
    2: { economico: 220, medio: 450, premium: 850, guia: 700 },
    3: { economico: 200, medio: 400, premium: 800, guia: 600 },
    4: { economico: 200, medio: 400, premium: 800, guia: 650 },
    5: { economico: 180, medio: 350, premium: 700, guia: 600 },
    6: { economico: 200, medio: 400, premium: 800, guia: 750 }
  };
  const hotelesCotizador = {
    1: { nombre: 'Cabañas Bosque de Huasca', lugar: 'Huasca de Ocampo, Hidalgo' },
    2: { nombre: 'Hotel Mina Vieja', lugar: 'Mineral del Chico, Hidalgo' },
    3: { nombre: 'Posada Real Minera', lugar: 'Real del Monte, Hidalgo' },
    4: { nombre: 'Hotel Tecozautla', lugar: 'Tecozautla, Hidalgo' },
    5: { nombre: 'Hotel Santa Bárbara', lugar: 'Huichapan, Hidalgo' },
    6: { nombre: 'Hotel Bugambilia', lugar: 'Zimapán, Hidalgo' }
  };
  const paginaVolver = window.location.pathname.endsWith('/planificar.html')
    ? 'planificar.html'
    : 'hospedaje.html';

  function hotelDelCotizador(id) {
    const hotel = hotelesCotizador[id];
    const precio = window.RDE_PRECIOS_HOTELES && window.RDE_PRECIOS_HOTELES[id];
    return hotel && precio ? { id: String(id), ...hotel, precio } : null;
  }

  function hotelDeTarjeta(card) {
    const ubicacion = card.querySelector('.ubicacion');
    const precio = card.querySelector('.precio strong');
    return {
      id: card.dataset.hotelId,
      nombre: card.querySelector('h3').textContent.trim(),
      lugar: ubicacion ? ubicacion.textContent.trim() : '',
      precio: precio ? parseInt(precio.textContent.replace(/\D/g, ''), 10) : 0
    };
  }

  // "Firma" para detectar si alguien modifica los datos del QR
  function firmar(d) {
    const texto = [d.folio, d.hotel, d.nombre, d.telefono, d.llegada, d.salida, d.huespedes, d.total, d.necesidades, SECRETO].join('|');
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
    return h.toString(16).toUpperCase();
  }

  // Dibuja el código QR en un canvas (con margen blanco para que se escanee bien)
  function dibujarQR(texto, escala = 6) {
    const qr = qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount(), margen = 4;
    const c = document.createElement('canvas');
    c.width = c.height = (n + margen * 2) * escala;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#2F3A22';
    for (let f = 0; f < n; f++)
      for (let k = 0; k < n; k++)
        if (qr.isDark(f, k)) ctx.fillRect((k + margen) * escala, (f + margen) * escala, escala, escala);
    return c;
  }

  // Conecta todos los botones "Reservar" de las tarjetas
  document.querySelectorAll('.card[data-hotel-id]').forEach(card => {
    const btn = [...card.querySelectorAll('.btn')].find(b => /reservar/i.test(b.textContent));
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      abrirReserva(hotelDeTarjeta(card));
    });
  });

  function abrirReserva(h, pre = {}) {
    const huespedes = [1, 2, 3, 4, 5, 6].includes(Number(pre.huespedes)) ? Number(pre.huespedes) : 2;
    const llegada = /^\d{4}-\d{2}-\d{2}$/.test(pre.llegada || '') ? pre.llegada : '';
    const salida = /^\d{4}-\d{2}-\d{2}$/.test(pre.salida || '') ? pre.salida : '';
    AlbaModal.abrir(`
      <h3>Reservar en ${esc(h.nombre)}</h3>
      <p class="modal-sub">📍 ${esc(h.lugar)} · desde ${dinero(h.precio)} / noche</p>
      <form id="form-reserva" class="form-grid">
        <input type="hidden" name="hotel_id" value="${esc(h.id)}">
        <div class="campo"><label for="r-llegada">Llegada</label>
          <input id="r-llegada" type="date" name="llegada" value="${llegada}" required></div>
        <div class="campo"><label for="r-salida">Salida</label>
          <input id="r-salida" type="date" name="salida" value="${salida}" required></div>
        <div class="campo"><label for="r-huespedes">Huéspedes</label>
          <select id="r-huespedes" name="huespedes">${[1, 2, 3, 4, 5, 6].map(n => `<option ${n === huespedes ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="campo"><label for="r-tel">Teléfono</label>
          <input id="r-tel" type="tel" name="telefono" placeholder="771 123 4567" autocomplete="tel" required></div>
        <div class="campo completo"><label for="r-necesidades">¿Necesitas alguna adaptación? (opcional)</label>
          <select id="r-necesidades" name="necesidades">
            <option value="">Ninguna</option>
            <option>Habitación en planta baja / silla de ruedas</option>
            <option>Comunicación por texto o Lengua de Señas</option>
            <option>Apoyo por baja visión</option>
            <option>Instrucciones sencillas / acompañamiento</option>
          </select></div>
        <div class="resumen completo" id="resumen" aria-live="polite"></div>
        <button class="btn btn-bloque completo" type="submit">Confirmar y generar mi QR</button>
      </form>`);

    const form = document.getElementById('form-reserva');
    const resumen = document.getElementById('resumen');
    const validarFechas = configurarFechas(form.elements.llegada, form.elements.salida);
    const noches = () => Math.round((new Date(form.salida.value) - new Date(form.llegada.value)) / 86400000);
    function calcular() {
      const n = noches();
      resumen.textContent = n > 0
        ? `🧾 ${n} noche${n > 1 ? 's' : ''} × ${dinero(h.precio)} = ${dinero(n * h.precio)}`
        : 'Elige tus fechas para ver el total.';
    }
    form.addEventListener('input', calcular);
    calcular();

    function pedirSesion() {
      try {
        sessionStorage.setItem('rde_borrador', JSON.stringify({
          hotel_id: Number(h.id),
          llegada: form.elements.llegada.value,
          salida: form.elements.salida.value,
          huespedes: Number(form.elements.huespedes.value)
        }));
      } catch (error) {
        resumen.textContent = 'No se pudo guardar tu selección en esta pestaña. Inténtalo de nuevo.';
        return;
      }
      resumen.innerHTML = `
        <strong>Para reservar necesitas una cuenta. Tu selección se guardará</strong>
        <div class="dos-botones">
          <a class="btn" href="php/login.php?volver=${paginaVolver}">Iniciar sesión</a>
          <a class="btn-secundario" href="php/registro.php?volver=${paginaVolver}">Crear cuenta</a>
        </div>`;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errorFecha = validarFechas();
      if (errorFecha) { resumen.textContent = '⚠️ ' + errorFecha; return; }
      const n = noches();
      const datos = new FormData();
      ['hotel_id', 'llegada', 'salida', 'huespedes', 'telefono'].forEach(campo => {
        datos.append(campo, form.elements[campo].value);
      });
      try {
        const sesion = await window.RDE_SESION;
        if (!sesion.logueado) { pedirSesion(); return; }
        const respuesta = await fetch('php/reservar.php', {
          method: 'POST',
          body: datos,
          credentials: 'same-origin'
        });
        const resultado = await respuesta.json();
        if (respuesta.status === 401) {
          pedirSesion();
          return;
        }
        if (respuesta.status === 422) {
          resumen.textContent = '';
          const lista = document.createElement('ul');
          (resultado.errores || []).forEach(mensaje => {
            const item = document.createElement('li');
            item.textContent = mensaje;
            lista.append(item);
          });
          resumen.append(lista);
          return;
        }
        if (respuesta.status !== 201) {
          resumen.textContent = resultado.error || 'No se pudo completar la reservación.';
          return;
        }
        sessionStorage.removeItem('rde_borrador');
        const d = {
          app: 'AlbaGuia',
          folio: 'RDE-' + resultado.reservacion_id,
          hotel: h.nombre,
          lugar: h.lugar,
          nombre: resultado.nombre,
          telefono: form.elements.telefono.value.trim(),
          llegada: form.elements.llegada.value,
          salida: form.elements.salida.value,
          huespedes: Number(form.elements.huespedes.value),
          noches: n,
          total: n * h.precio,
          necesidades: form.elements.necesidades.value
        };
        d.firma = firmar(d);
        mostrarQR(d);
      } catch (error) {
        resumen.textContent = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
      }
    });
  }

  window.RDE_SESION.then(sesion => {
    if (!sesion.logueado) return;
    let borrador;
    try { borrador = JSON.parse(sessionStorage.getItem('rde_borrador') || 'null'); }
    catch (error) { sessionStorage.removeItem('rde_borrador'); return; }
    if (!borrador) return;
    const card = [...document.querySelectorAll('.card[data-hotel-id]')]
      .find(item => item.dataset.hotelId === String(borrador.hotel_id));
    const huespedes = Number(borrador.huespedes);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(borrador.llegada || '') ||
        !/^\d{4}-\d{2}-\d{2}$/.test(borrador.salida || '') ||
        ![1, 2, 3, 4, 5, 6].includes(huespedes)) return;
    const hotel = card ? hotelDeTarjeta(card) : hotelDelCotizador(borrador.hotel_id);
    if (!hotel) return;
    abrirReserva(hotel, borrador);
    sessionStorage.removeItem('rde_borrador');
  });

  const cotizador = document.getElementById('cotizador-viaje');
  if (cotizador) {
    const campoLlegada = cotizador.elements.llegada;
    const campoResumen = document.getElementById('cotizador-resumen');
    const botonReservar = document.getElementById('cotizador-reservar');
    if (!campoLlegada || !campoResumen || !botonReservar) return;
    const formatoISO = date => [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
    const hoyDate = new Date();
    hoyDate.setMinutes(hoyDate.getMinutes() - hoyDate.getTimezoneOffset());
    campoLlegada.min = formatoISO(hoyDate);
    campoLlegada.value = formatoISO(hoyDate);

    cotizador.addEventListener('submit', evento => evento.preventDefault());

    function cotizar() {
      const hotelId = Number(cotizador.elements.hotel_id.value);
      const dias = Number(cotizador.elements.dias.value);
      const huespedes = Number(cotizador.elements.huespedes.value);
      const nivel = cotizador.elements.nivel.value;
      const tarifa = tarifasViaje[hotelId];
      const precioNoche = window.RDE_PRECIOS_HOTELES[hotelId];
      if (!tarifa || !precioNoche || !Number.isInteger(dias) || dias < 2 ||
          !campoLlegada.value || campoLlegada.value < formatoISO(hoyDate)) {
        campoResumen.textContent = 'Elige el destino, la duración y la fecha de llegada para calcular el presupuesto.';
        return null;
      }
      const noches = dias - 1;
      const costoHospedaje = noches * precioNoche;
      const costoComida = dias * huespedes * tarifa[nivel];
      const costoGuia = cotizador.elements.guia.value === 'si' ? tarifa.guia : 0;
      const total = costoHospedaje + costoComida + costoGuia;
      campoResumen.textContent = '';
      const lista = document.createElement('ul');
      lista.className = 'info-lista';
      [
        `Hospedaje (${noches} noches × ${dinero(precioNoche)}): ${dinero(costoHospedaje)}`,
        `Alimentación (${dias} días × ${huespedes} personas × ${dinero(tarifa[nivel])}): ${dinero(costoComida)}`,
        `Guía opcional: ${dinero(costoGuia)}`,
        `Presupuesto estimado: ${dinero(total)}`
      ].forEach((linea, index) => {
        const item = document.createElement('li');
        if (index === 3) item.className = 'card-tipo';
        item.textContent = linea;
        lista.append(item);
      });
      campoResumen.append(lista);
      return { hotelId, dias, huespedes, noches };
    }

    cotizador.addEventListener('input', cotizar);
    cotizador.addEventListener('change', cotizar);
    botonReservar.addEventListener('click', () => {
      const cotizacion = cotizar();
      if (!cotizacion) return;
      const card = [...document.querySelectorAll('.card[data-hotel-id]')]
        .find(item => item.dataset.hotelId === String(cotizacion.hotelId));
      const fechaSalida = new Date(campoLlegada.value + 'T00:00:00');
      fechaSalida.setDate(fechaSalida.getDate() + cotizacion.noches);
      const hotel = card ? hotelDeTarjeta(card) : hotelDelCotizador(cotizacion.hotelId);
      if (!hotel) return;
      abrirReserva(hotel, {
        llegada: campoLlegada.value,
        salida: formatoISO(fechaSalida),
        huespedes: cotizacion.huespedes
      });
    });
    cotizar();
  }

  function mostrarQR(d) {
    document.getElementById('modal-contenido').innerHTML = `
      <div class="centrado">
        <div class="exito-icono" aria-hidden="true">✅</div>
        <h3>¡Reservación lista, ${esc(d.nombre.split(' ')[0])}!</h3>
        <p class="modal-sub">Presenta este código QR al llegar. El encargado lo escaneará para verificar tus datos.</p>
        <div class="qr-caja" id="qr" role="img" aria-label="Código QR de la reservación ${d.folio}"></div>
        <p class="qr-folio">Folio: <strong>${d.folio}</strong></p>
      </div>
      <ul class="info-lista">
        <li>🏡 ${esc(d.hotel)}</li>
        <li>📅 ${fecha(d.llegada)} → ${fecha(d.salida)} (${d.noches} noche${d.noches > 1 ? 's' : ''})</li>
        <li>👥 ${d.huespedes} huésped${d.huespedes > 1 ? 'es' : ''}</li>
        <li>💲 Total: ${dinero(d.total)}</li>
        ${d.necesidades ? `<li>♿ ${esc(d.necesidades)}</li>` : ''}
      </ul>
      <div class="dos-botones">
        <button class="btn" id="qr-descargar">⬇️ Descargar QR</button>
        <button class="btn-secundario" onclick="window.print()">🖨️ Imprimir</button>
      </div>`;

    // Los acentos y la ñ se guardan como \u00e1, etc. para que cualquier lector los entienda
    const textoQR = JSON.stringify(d).replace(/[\u0080-\uffff]/g,
      c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
    const lienzo = dibujarQR(textoQR);
    document.getElementById('qr').append(lienzo);

    document.getElementById('qr-descargar').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = lienzo.toDataURL('image/png');
      a.download = `reservacion-${d.folio}.png`;
      a.click();
    });

    try {
      const lista = JSON.parse(localStorage.getItem('albaGuia_reservas')) || [];
      lista.push(d);
      localStorage.setItem('albaGuia_reservas', JSON.stringify(lista));
    } catch (e) {}

    AlbaAviso(`✅ Reservación ${d.folio} confirmada`);
  }
})();