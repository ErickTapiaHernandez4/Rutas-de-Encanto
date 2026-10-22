/* =========================================================
   ALBA GUÍA — Reservación de hospedaje con código QR (IoT)
   Al reservar se genera un QR con los datos del huésped.
   El dueño lo escanea en verificar.html.
   ========================================================= */
(function () {
  const SECRETO = 'alba-guia-2026';   // debe ser IGUAL en verificar.html

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = n => '$' + Number(n).toLocaleString('es-MX');
  const fecha = s => new Date(s + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const hoyFecha = new Date();
  hoyFecha.setMinutes(hoyFecha.getMinutes() - hoyFecha.getTimezoneOffset());
  const hoy = hoyFecha.toISOString().slice(0, 10);

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
  document.querySelectorAll('.card').forEach(card => {
    const btn = [...card.querySelectorAll('.btn')].find(b => /reservar/i.test(b.textContent));
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const ub = card.querySelector('.ubicacion');
      const pr = card.querySelector('.precio strong');
      abrirReserva({
        nombre: card.querySelector('h3').textContent.trim(),
        lugar: ub ? ub.textContent.trim() : '',
        precio: pr ? parseInt(pr.textContent.replace(/\D/g, ''), 10) : 0
      });
    });
  });

  function abrirReserva(h) {
    AlbaModal.abrir(`
      <h3>Reservar en ${esc(h.nombre)}</h3>
      <p class="modal-sub">📍 ${esc(h.lugar)} · desde ${dinero(h.precio)} / noche</p>
      <form id="form-reserva" class="form-grid">
        <div class="campo"><label for="r-llegada">Llegada</label>
          <input id="r-llegada" type="date" name="llegada" min="${hoy}" required></div>
        <div class="campo"><label for="r-salida">Salida</label>
          <input id="r-salida" type="date" name="salida" min="${hoy}" required></div>
        <div class="campo"><label for="r-huespedes">Huéspedes</label>
          <select id="r-huespedes" name="huespedes">
            <option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option>
          </select></div>
        <div class="campo"><label for="r-tel">Teléfono</label>
          <input id="r-tel" type="tel" name="telefono" placeholder="771 123 4567" autocomplete="tel" required></div>
        <div class="campo completo"><label for="r-nombre">Nombre completo</label>
          <input id="r-nombre" name="nombre" autocomplete="name" placeholder="Como aparece en tu identificación" required></div>
        <div class="campo completo"><label for="r-necesidades">¿Necesitas alguna adaptación? (opcional)</label>
          <select id="r-necesidades" name="necesidades">
            <option value="">Ninguna</option>
            <option>Habitación en planta baja / silla de ruedas</option>
            <option>Comunicación por texto o Lengua de Señas</option>
            <option>Apoyo por baja visión</option>
            <option>Instrucciones sencillas / acompañamiento</option>
          </select></div>
        <p class="resumen completo" id="resumen" aria-live="polite"></p>
        <button class="btn btn-bloque completo" type="submit">Confirmar y generar mi QR</button>
      </form>`);

    const form = document.getElementById('form-reserva');
    const resumen = document.getElementById('resumen');
    const noches = () => Math.round((new Date(form.salida.value) - new Date(form.llegada.value)) / 86400000);
    function calcular() {
      const n = noches();
      resumen.textContent = n > 0
        ? `🧾 ${n} noche${n > 1 ? 's' : ''} × ${dinero(h.precio)} = ${dinero(n * h.precio)}`
        : 'Elige tus fechas para ver el total.';
    }
    form.addEventListener('input', calcular);
    calcular();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const n = noches();
      if (!(n > 0)) { resumen.textContent = '⚠️ La salida debe ser después de la llegada.'; return; }
      const d = {
        app: 'AlbaGuia',
        folio: 'AG-' + Date.now().toString(36).toUpperCase().slice(-6),
        hotel: h.nombre,
        lugar: h.lugar,
        nombre: form.nombre.value.trim(),
        telefono: form.telefono.value.trim(),
        llegada: form.llegada.value,
        salida: form.salida.value,
        huespedes: Number(form.huespedes.value),
        noches: n,
        total: n * h.precio,
        necesidades: form.necesidades.value
      };
      d.firma = firmar(d);
      mostrarQR(d);
    });
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
        <button class="btn btn-borde" onclick="window.print()">🖨️ Imprimir</button>
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