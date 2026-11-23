/* =========================================================
   RUTAS DE ENCANTO — Restaurantes
   Muestra cada restaurante con su foto, menú, contacto y características.
   Los datos vienen de php/restaurantes.php (MySQL).
   ========================================================= */
(function () {
  const API = 'php/restaurantes.php';

  const lista = document.getElementById('lista-restaurantes');
  const filtros = document.getElementById('filtros-rest');
  const contador = document.getElementById('contador-rest');
  if (!lista) return;

  // Ícono y texto de cada característica (para agregar una nueva, ponla aquí)
  const CARACTERISTICAS = {
    'wifi':            ['📶', 'Wi-Fi'],
    'estacionamiento': ['🅿️', 'Estacionamiento'],
    'pet-friendly':    ['🐾', 'Pet-friendly'],
    'terraza':         ['🌳', 'Terraza'],
    'accesible':       ['♿', 'Accesible'],
    'tarjeta':         ['💳', 'Acepta tarjeta'],
    'vegetariano':     ['🥗', 'Opción vegetariana'],
    'para-llevar':     ['🥡', 'Para llevar'],
    'familiar':        ['👨‍👩‍👧', 'Familiar'],
    'musica':          ['🎶', 'Música en vivo'],
    'reservaciones':   ['📅', 'Reservaciones']
  };

  let todos = [];
  let pueblo = 'todos';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  const foto = (r, clase = 'foto') => r.foto
    ? `<div class="${clase}"><img src="${esc(r.foto)}" alt="${esc(r.nombre)}" onerror="fotoVacia(this)"></div>`
    : `<div class="${clase} sin-foto" data-ruta="Foto próximamente"></div>`;

  const chips = lista_ => lista_.map(c => {
    const [icono, texto] = CARACTERISTICAS[c] || ['•', c];
    return `<span class="etiqueta"><span aria-hidden="true">${icono}</span> ${esc(texto)}</span>`;
  }).join('');

  function estado(icono, titulo, detalle = '') {
    return `<div class="estado-rest"><div aria-hidden="true">${icono}</div><h3>${titulo}</h3>${detalle ? `<p>${detalle}</p>` : ''}</div>`;
  }

  async function pedir(url) {
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    const datos = await resp.json();
    if (!datos.ok) throw new Error(datos.error);
    return datos;
  }

  /* ---------- 1. Cargar la lista ---------- */
  async function cargar() {
    lista.innerHTML = estado('⏳', 'Cargando restaurantes…');
    try {
      const datos = await pedir(API);
      todos = datos.restaurantes;
      pintarFiltros(datos.pueblos);
      pintar();
    } catch (e) {
      contador.textContent = '';
      lista.innerHTML = estado('⚠️', 'No se pudieron cargar los restaurantes',
        'Abre la página desde XAMPP (http://localhost/…) con Apache y MySQL encendidos.');
    }
  }

  /* ---------- 2. Filtro por pueblo ---------- */
  function pintarFiltros(pueblos) {
    filtros.querySelectorAll('.chip').forEach(c => c.remove());
    ['todos', ...pueblos].forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (p === pueblo ? ' activo' : '');
      b.textContent = p === 'todos' ? 'Todos los pueblos' : p;
      b.setAttribute('aria-pressed', String(p === pueblo));
      b.addEventListener('click', () => {
        pueblo = p;
        filtros.querySelectorAll('.chip').forEach(x => {
          x.classList.toggle('activo', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
        pintar();
      });
      filtros.insertBefore(b, contador);
    });
  }

  /* ---------- 3. Tarjetas ---------- */
  function pintar() {
    const visibles = todos.filter(r => pueblo === 'todos' || r.pueblo === pueblo);
    contador.textContent = `${visibles.length} restaurante${visibles.length === 1 ? '' : 's'}`;

    if (!visibles.length) {
      lista.innerHTML = estado('🍽️', 'Todavía no hay restaurantes aquí', 'Pronto agregaremos más lugares.');
      return;
    }

    lista.innerHTML = visibles.map(r => `
      <article class="card">
        ${foto(r)}
        <div class="card-cuerpo">
          <h3>${esc(r.nombre)}</h3>
          <p class="ubicacion">${PIN} ${esc(r.pueblo)}, Hidalgo</p>
          ${r.descripcion ? `<p class="card-desc">${esc(r.descripcion)}</p>` : ''}
          ${r.caracteristicas.length ? `<div class="etiquetas">${chips(r.caracteristicas)}</div>` : ''}
          <button class="btn btn-bloque rest-ver" type="button" data-ver="${r.id}">Ver menú y contacto</button>
        </div>
      </article>`).join('');
  }

  /* ---------- 4. Ventana: menú, contacto y características ---------- */
  async function verRestaurante(id) {
    AlbaModal.abrir(estado('⏳', 'Cargando menú…'));
    let r;
    try {
      r = (await pedir(`${API}?id=${encodeURIComponent(id)}`)).restaurante;
    } catch (e) {
      AlbaModal.abrir(estado('⚠️', 'No se pudo cargar el restaurante', esc(e.message)));
      return;
    }

    const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${r.nombre}, ${r.direccion || r.pueblo}, Hidalgo`);
    const contactos = [
      r.telefono && `<a class="rest-contacto" href="tel:${esc(r.telefono.replace(/\s/g, ''))}"><span aria-hidden="true">📞</span> Llamar<small>${esc(r.telefono)}</small></a>`,
      r.whatsapp && `<a class="rest-contacto" href="https://wa.me/${esc(r.whatsapp)}" target="_blank" rel="noopener"><span aria-hidden="true">💬</span> WhatsApp</a>`,
      r.correo && `<a class="rest-contacto" href="mailto:${esc(r.correo)}"><span aria-hidden="true">✉️</span> Correo<small>${esc(r.correo)}</small></a>`,
      r.facebook && `<a class="rest-contacto" href="${esc(r.facebook)}" target="_blank" rel="noopener"><span aria-hidden="true">📘</span> Facebook</a>`,
      r.instagram && `<a class="rest-contacto" href="${esc(r.instagram)}" target="_blank" rel="noopener"><span aria-hidden="true">📸</span> Instagram</a>`,
      `<a class="rest-contacto" href="${mapa}" target="_blank" rel="noopener"><span aria-hidden="true">🗺️</span> Cómo llegar</a>`
    ].filter(Boolean).join('');

    const menu = r.menu.length
      ? r.menu.map(s => `
          <div class="rest-menu-seccion">
            <h4>${esc(s.seccion)}</h4>
            <ul>
              ${s.platillos.map(p => `
                <li>
                  <div><strong>${esc(p.platillo)}</strong>${p.descripcion ? `<small>${esc(p.descripcion)}</small>` : ''}</div>
                  ${p.precio !== null ? `<span class="rest-precio">${dinero(p.precio)}</span>` : ''}
                </li>`).join('')}
            </ul>
          </div>`).join('')
      : '<p class="card-desc">Este restaurante todavía no tiene su menú en línea.</p>';

    AlbaModal.abrir(`
      ${foto(r, 'foto modal-foto')}
      <h3>${esc(r.nombre)}</h3>
      <p class="modal-sub">${PIN} ${esc(r.pueblo)}, Hidalgo</p>
      ${r.descripcion ? `<p>${esc(r.descripcion)}</p>` : ''}

      ${r.caracteristicas.length ? `
        <h4 class="rest-subtitulo">Características</h4>
        <div class="etiquetas">${chips(r.caracteristicas)}</div>` : ''}

      <h4 class="rest-subtitulo">🍽️ Menú</h4>
      <div class="rest-menu">${menu}</div>

      <h4 class="rest-subtitulo">Contacto</h4>
      <ul class="info-lista">
        ${r.direccion ? `<li>📍 ${esc(r.direccion)}</li>` : ''}
        ${r.horario ? `<li>🕒 ${esc(r.horario)}</li>` : ''}
      </ul>
      <div class="rest-contactos">${contactos}</div>`);
  }

  lista.addEventListener('click', e => {
    const b = e.target.closest('[data-ver]');
    if (b) verRestaurante(b.dataset.ver);
  });

  cargar();
})();