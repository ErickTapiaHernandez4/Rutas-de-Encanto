// ===== Menú en celular =====
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => nav.classList.toggle('abierto'));
}

// ===== Espacios de foto =====
// Si la imagen no existe todavía, se muestra un recuadro
// con el nombre del archivo que debes poner en la carpeta img/
document.querySelectorAll('.foto img').forEach(img => {
  const marcarVacio = () => {
    const caja = img.parentElement;
    caja.dataset.ruta = img.getAttribute('src');
    caja.classList.add('sin-foto');
    img.remove();
  };
  if (img.complete && img.naturalWidth === 0) marcarVacio();
  else img.addEventListener('error', marcarVacio);
});

// ===== Filtros (Hospedaje y Restaurantes) =====
const chips = document.querySelectorAll('.chip');
const tarjetas = document.querySelectorAll('[data-filtros]');
const contador = document.querySelector('.contador');

function actualizarContador() {
  if (!contador) return;
  const visibles = [...tarjetas].filter(t => t.style.display !== 'none').length;
  contador.textContent = `${visibles} resultado${visibles === 1 ? '' : 's'}`;
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('activo'));
    chip.classList.add('activo');
    const filtro = chip.dataset.filtro;
    tarjetas.forEach(t => {
      const lista = t.dataset.filtros.split(' ');
      t.style.display = (filtro === 'todos' || lista.includes(filtro)) ? '' : 'none';
    });
    actualizarContador();
  });
});
actualizarContador();


/* =========================================================
   PÁGINA DE INICIO: slider, explorador, reservas,
   restaurantes y calificación de guías
   ========================================================= */

// Si una foto no existe, muestra el recuadro "Agrega tu foto"
window.fotoVacia = function (img) {
  const caja = img.parentElement;
  caja.dataset.ruta = img.getAttribute('src');
  caja.classList.add('sin-foto');
  img.remove();
};

(function () {
  if (!document.getElementById('explorar')) return; // solo corre en index.html

  /* ======= 1. DATOS: CAMBIA AQUÍ LOS TEXTOS, PRECIOS Y FOTOS ======= */
  const PUEBLOS = {
    huasca: {
      nombre: 'Huasca de Ocampo',
      frase: 'Donde la piedra se convierte en cascada',
      foto: 'img/pueblos/huasca.jpg',
      desc: 'El primer Pueblo Mágico de México. Camina entre los Prismas Basálticos, recorre haciendas antiguas y escucha las leyendas de duendes del bosque.',
      datos: ['🌡️ 12 – 22 °C', '🚗 40 min de Pachuca', '📅 Todo el año'],
      imperdibles: ['Prismas Basálticos', 'Hacienda Santa María Regla', 'Peña del Aire'],
      hotel: {
        nombre: 'Cabañas Bosque de Huasca', foto: 'img/hospedaje/hotel-1.jpg',
        precio: 1450, calif: 4.8, resenas: 23, etiquetas: ['Desayuno incluido', 'Chimenea']
      },
      restaurante: {
        nombre: 'Fonda La Hacienda', foto: 'img/restaurantes/restaurante-1.jpg',
        especialidad: 'Trucha al ajillo y barbacoa de borrego',
        direccion: 'Calle Principal s/n, Huasca de Ocampo',
        distancia: 'A 5 min caminando del centro',
        horario: 'Lunes a domingo · 8:00 – 19:00',
        precio: '$$ (150 – 300 por persona)', telefono: '771 000 0001'
      },
      guia: 'lupita'
    },
    chico: {
      nombre: 'Mineral del Chico',
      frase: 'Un pueblo escondido entre el bosque',
      foto: 'img/pueblos/mineral-del-chico.jpg',
      desc: 'Rodeado por el Parque Nacional El Chico. Ideal para senderismo, escalada y tirolesa entre pinos y enormes peñas de roca.',
      datos: ['🌡️ 8 – 18 °C', '🚗 30 min de Pachuca', '🧥 Lleva chamarra'],
      imperdibles: ['Peña del Cuervo', 'Parque Nacional El Chico', 'Presa El Cedral'],
      hotel: {
        nombre: 'Hotel Mina Vieja', foto: 'img/hospedaje/hotel-2.jpg',
        precio: 1820, calif: 4.6, resenas: 41, etiquetas: ['Vista al bosque', 'Estacionamiento']
      },
      restaurante: {
        nombre: 'Cocina El Pinar', foto: 'img/restaurantes/restaurante-2.jpg',
        especialidad: 'Truchas, quesadillas y café de olla',
        direccion: 'Av. Corona s/n, Mineral del Chico',
        distancia: 'A 3 min de la plaza principal',
        horario: 'Viernes a domingo · 9:00 – 18:00',
        precio: '$ (100 – 200 por persona)', telefono: '771 000 0002'
      },
      guia: 'ismael'
    },
    real: {
      nombre: 'Real del Monte',
      frase: 'La cuna del paste y del fútbol en México',
      foto: 'img/pueblos/real-del-monte.jpg',
      desc: 'Calles empedradas, herencia minera inglesa y el aroma de los pastes recién horneados. Baja a una mina de verdad y visita el Panteón Inglés.',
      datos: ['🌡️ 10 – 20 °C', '🚗 20 min de Pachuca', '📅 Todo el año'],
      imperdibles: ['Mina de Acosta', 'Panteón Inglés', 'Museo del Paste'],
      hotel: {
        nombre: 'Posada Real Minera', foto: 'img/hospedaje/hotel-3.jpg',
        precio: 2100, calif: 4.9, resenas: 12, etiquetas: ['Centro histórico', 'Wi-Fi gratis']
      },
      restaurante: {
        nombre: 'Pastes El Portal', foto: 'img/restaurantes/restaurante-3.jpg',
        especialidad: 'Pastes tradicionales, de mole y dulces',
        direccion: 'Plaza Principal, Real del Monte',
        distancia: 'En el centro, frente a la plaza',
        horario: 'Todos los días · 9:00 – 20:00',
        precio: '$ (30 – 60 por paste)', telefono: '771 000 0003'
      },
      guia: 'carlos'
    }
  };

  const GUIAS = {
    lupita: {
      nombre: 'Lupita Mendoza', foto: 'img/guias/guia-1.jpg', pueblo: 'Huasca de Ocampo',
      idiomas: 'Español • English • Hñähñu', experiencia: '8 años',
      especialidades: ['Gastronomía local', 'Haciendas', 'Leyendas'],
      whatsapp: '527710000001',
      base: { promedio: 4.9, total: 32 },
      comentarios: [{ nombre: 'Andrea', estrellas: 5, texto: 'Súper amable, conoce cada rincón de Huasca.' }]
    },
    carlos: {
      nombre: 'Carlos Reyes', foto: 'img/guias/guia-2.jpg', pueblo: 'Real del Monte',
      idiomas: 'Español • English', experiencia: '12 años',
      especialidades: ['Historia minera', 'Mina de Acosta', 'Pastes'],
      whatsapp: '527710000002',
      base: { promedio: 4.8, total: 27 },
      comentarios: [{ nombre: 'Jorge', estrellas: 5, texto: 'El recorrido por la mina fue increíble.' }]
    },
    ismael: {
      nombre: 'Ismael García', foto: 'img/guias/guia-3.jpg', pueblo: 'Mineral del Chico',
      idiomas: 'Español • English • Francés', experiencia: '6 años',
      especialidades: ['Senderismo', 'Escalada', 'Fotografía'],
      whatsapp: '527710000003',
      base: { promedio: 4.9, total: 41 },
      comentarios: [{ nombre: 'Sofía', estrellas: 5, texto: 'Nos llevó a miradores espectaculares.' }]
    }
  };

  /* ======= 2. CALIFICACIONES (se guardan en el navegador) ======= */
  const CLAVE = 'albaGuia_calificaciones';
  let guardado = {};
  try { guardado = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) {}
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(guardado)); } catch (e) {} }

  function datosGuia(id) {
    const g = GUIAS[id];
    const extra = guardado[id] || { suma: 0, total: 0, comentarios: [] };
    const total = g.base.total + extra.total;
    const promedio = (g.base.promedio * g.base.total + extra.suma) / total;
    const comentarios = extra.comentarios.slice().reverse().concat(g.comentarios);
    return { total, promedio, comentarios };
  }

  /* ======= Ayudantes ======= */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = n => '$' + n.toLocaleString('es-MX');
  const estrellas = v => `<span class="calif-estrellas" style="--p:${(v / 5) * 100}%">★★★★★</span>`;
  const foto = (src, alt, clase, extra = '') =>
    `<div class="${clase}">${extra}<img src="${src}" alt="${esc(alt)}" onerror="fotoVacia(this)"></div>`;
  const hoyFecha = new Date();
  hoyFecha.setMinutes(hoyFecha.getMinutes() - hoyFecha.getTimezoneOffset());
  const hoy = hoyFecha.toISOString().slice(0, 10);

  /* ======= 3. SLIDER DE PORTADA ======= */
  const slides = document.querySelectorAll('.slide');
  const puntos = document.querySelector('.slider-puntos');
  let actual = 0, timer;
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Ver pueblo ' + (i + 1));
    b.addEventListener('click', () => { mostrar(i); reiniciar(); });
    puntos.appendChild(b);
  });
  function mostrar(i) {
    slides[actual].classList.remove('activo');
    puntos.children[actual].classList.remove('activo');
    actual = (i + slides.length) % slides.length;
    slides[actual].classList.add('activo');
    puntos.children[actual].classList.add('activo');
  }
  function reiniciar() {
    clearInterval(timer);
    timer = setInterval(() => {
      // Si la persona activó "Detener animaciones", el carrusel no avanza solo
      if (!document.documentElement.classList.contains('a11y-pausa')) mostrar(actual + 1);
    }, 6000);
  }
  document.querySelector('.slider-flecha.izq').addEventListener('click', () => { mostrar(actual - 1); reiniciar(); });
  document.querySelector('.slider-flecha.der').addEventListener('click', () => { mostrar(actual + 1); reiniciar(); });
  mostrar(0); reiniciar();

  /* ======= 4. ¿A DÓNDE IRÁS HOY? ======= */
  const panel = document.getElementById('panel-pueblo');
  const tabs = document.querySelectorAll('.tab-pueblo');
  let puebloActual = 'huasca';

  function renderPanel(id) {
    puebloActual = id;
    const p = PUEBLOS[id], h = p.hotel, r = p.restaurante, g = GUIAS[p.guia], dg = datosGuia(p.guia);
    tabs.forEach(t => t.classList.toggle('activo', t.dataset.pueblo === id));
    panel.innerHTML = `
      <div class="panel-intro">
        ${foto(p.foto, p.nombre, 'foto panel-foto')}
        <div class="panel-info">
          <span class="pastilla">✨ PUEBLO MÁGICO</span>
          <h3>${p.nombre}</h3>
          <p class="frase-pueblo">${p.frase}</p>
          <p>${p.desc}</p>
          <div class="datos-pueblo">${p.datos.map(d => `<span>${d}</span>`).join('')}</div>
          <p class="imperdibles-titulo">Imperdibles:</p>
          <ul class="imperdibles">${p.imperdibles.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="panel-tarjetas">
        <article class="card">
          ${foto(h.foto, h.nombre, 'foto', '<span class="badge">Recomendado</span>')}
          <div class="card-cuerpo">
            <span class="card-tipo">🛏️ Dónde dormir</span>
            <h3>${h.nombre}</h3>
            <div class="estrellas">${estrellas(h.calif)} ${h.calif} (${h.resenas} reseñas)</div>
            <div class="etiquetas">${h.etiquetas.map(e => `<span class="etiqueta">${e}</span>`).join('')}</div>
            <div class="card-pie">
              <p class="precio">desde <strong>${dinero(h.precio)}</strong> / noche</p>
              <button class="btn" data-reservar="${id}">Reservar</button>
            </div>
          </div>
        </article>

        <article class="card">
          ${foto(r.foto, r.nombre, 'foto', '<span class="badge verde">Cerca de ti</span>')}
          <div class="card-cuerpo">
            <span class="card-tipo">🍽️ Restaurante cercano</span>
            <h3>${r.nombre}</h3>
            <p class="card-desc">${r.especialidad}</p>
            <p class="ubicacion">🚶 ${r.distancia}</p>
            <p class="ubicacion">🕒 ${r.horario}</p>
            <button class="btn btn-bloque" style="margin-top:auto" data-restaurante="${id}">Ver información</button>
          </div>
        </article>

        <article class="card">
          ${foto(g.foto, g.nombre, 'foto avatar')}
          <div class="card-cuerpo card-centro">
            <span class="card-tipo">🧭 Tu guía local</span>
            <h3>${g.nombre}</h3>
            <div class="guia-calif">${estrellas(dg.promedio)} <strong>${dg.promedio.toFixed(1)}</strong> <span>(${dg.total} reseñas)</span></div>
            <p class="card-desc">${g.especialidades.join(' • ')}</p>
            <div class="dos-botones">
              <button class="btn btn-borde" data-ver-guia="${p.guia}">Ver perfil</button>
              <button class="btn" data-calificar="${p.guia}">⭐ Calificar</button>
            </div>
          </div>
        </article>
      </div>`;
    panel.classList.remove('animar'); void panel.offsetWidth; panel.classList.add('animar');
  }
  tabs.forEach(t => t.addEventListener('click', () => renderPanel(t.dataset.pueblo)));

  /* ======= 5. TARJETAS DE GUÍAS ======= */
  const listaGuias = document.getElementById('lista-guias');
  function renderGuias() {
    listaGuias.innerHTML = Object.keys(GUIAS).map(id => {
      const g = GUIAS[id], d = datosGuia(id), c = d.comentarios[0];
      const colores = ['terracota', 'olivo', ''];
      return `
        <article class="card guia-card" id="guia-${id}">
          ${foto(g.foto, g.nombre, 'foto avatar')}
          <div class="card-cuerpo card-centro">
            <h3>${g.nombre}</h3>
            <p class="guia-pueblo">📍 Guía en ${g.pueblo}</p>
            <div class="guia-calif">${estrellas(d.promedio)} <strong>${d.promedio.toFixed(1)}</strong> <span>(${d.total} reseñas)</span></div>
            <ul class="guia-datos">
              <li>🌐 ${g.idiomas}</li>
              <li>🏅 ${g.experiencia} de experiencia</li>
              <li>✅ Guía certificado</li>
            </ul>
            <div class="etiquetas" style="justify-content:center">
              ${g.especialidades.map((e, i) => `<span class="etiqueta ${colores[i] || ''}">${e}</span>`).join('')}
            </div>
            ${c ? `<blockquote class="guia-comentario">“${esc(c.texto)}”<span>— ${esc(c.nombre)} · ${'★'.repeat(c.estrellas)}</span></blockquote>` : ''}
            <div class="dos-botones">
              <button class="btn" data-calificar="${id}">⭐ Calificar</button>
              <a class="btn btn-borde" href="https://wa.me/${g.whatsapp}" target="_blank" rel="noopener">💬 Contactar</a>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  /* ======= 6. VENTANA EMERGENTE ======= */
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('modal-contenido');
  function abrirModal(html) { contenido.innerHTML = html; modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function cerrarModal() { modal.hidden = true; document.body.style.overflow = ''; }
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-cerrar]')) cerrarModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) cerrarModal(); });

  const toast = document.getElementById('toast');
  function aviso(texto) {
    toast.textContent = texto;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  /* ---- Reservar hospedaje ---- */
  function abrirReserva(id, pre = {}) {
    const p = PUEBLOS[id], h = p.hotel;
    const huespedes = pre.huespedes || 2;
    abrirModal(`
      ${foto(h.foto, h.nombre, 'foto modal-foto')}
      <h3>Reservar en ${h.nombre}</h3>
      <p class="modal-sub">📍 ${p.nombre} · desde ${dinero(h.precio)} / noche</p>
      <form id="form-reserva" class="form-grid">
        <div class="campo"><label>Llegada</label><input type="date" name="llegada" min="${hoy}" value="${pre.llegada || ''}" required></div>
        <div class="campo"><label>Salida</label><input type="date" name="salida" min="${hoy}" value="${pre.salida || ''}" required></div>
        <div class="campo"><label>Huéspedes</label>
          <select name="huespedes">${[1, 2, 3, 4, 5, 6].map(n => `<option ${n == huespedes ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="campo"><label>Teléfono</label><input type="tel" name="telefono" placeholder="771 123 4567" required></div>
        <div class="campo completo"><label>Nombre completo</label><input name="nombre" placeholder="Tu nombre" required></div>
        <p class="resumen completo" id="resumen"></p>
        <button class="btn btn-bloque completo" type="submit">Confirmar reservación</button>
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
      const nombre = esc(form.nombre.value.trim().split(' ')[0]);
      contenido.innerHTML = `
        <div class="exito centrado">
          <div class="exito-icono">✅</div>
          <h3>¡Listo, ${nombre}!</h3>
          <p>Tu solicitud en <strong>${h.nombre}</strong> por ${n} noche${n > 1 ? 's' : ''}
             (${dinero(n * h.precio)}) fue enviada.<br>Te llamaremos al ${esc(form.telefono.value)} para confirmar.</p>
          <button class="btn" data-cerrar>Seguir explorando</button>
        </div>`;
    });
  }

  /* ---- Información del restaurante ---- */
  function abrirRestaurante(id) {
    const p = PUEBLOS[id], r = p.restaurante;
    const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.nombre + ', ' + p.nombre + ', Hidalgo');
    abrirModal(`
      ${foto(r.foto, r.nombre, 'foto modal-foto')}
      <h3>${r.nombre}</h3>
      <p class="modal-sub">🍽️ ${r.especialidad}</p>
      <ul class="info-lista">
        <li>📍 ${r.direccion}</li>
        <li>🚶 ${r.distancia}</li>
        <li>🕒 ${r.horario}</li>
        <li>💲 ${r.precio}</li>
        <li>📞 ${r.telefono}</li>
      </ul>
      <div class="dos-botones">
        <a class="btn" href="${mapa}" target="_blank" rel="noopener">🗺️ Cómo llegar</a>
        <a class="btn btn-borde" href="tel:${r.telefono.replace(/\s/g, '')}">📞 Llamar</a>
      </div>`);
  }

  /* ---- Calificar a un guía ---- */
  const textos = ['', 'Mala 😞', 'Regular 😐', 'Buena 🙂', 'Muy buena 😄', '¡Excelente! 🤩'];
  function abrirCalificar(id) {
    const g = GUIAS[id];
    let valor = 0;
    abrirModal(`
      <div class="centrado">
        ${foto(g.foto, g.nombre, 'foto avatar')}
        <h3 style="margin-top:1rem">Califica a ${g.nombre}</h3>
        <p class="modal-sub">¿Cómo fue tu experiencia en ${g.pueblo}?</p>
      </div>
      <form id="form-calif">
        <div class="estrellas-input">
          ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="estrella-btn" data-valor="${n}" aria-label="${n} estrellas">★</button>`).join('')}
        </div>
        <p class="estrellas-texto" id="estrellas-texto">Toca las estrellas</p>
        <div class="form-grid">
          <div class="campo completo"><label>Tu nombre</label><input name="nombre" placeholder="Ej. Andrea" required></div>
          <div class="campo completo"><label>Cuéntanos tu experiencia</label>
            <textarea name="comentario" rows="3" placeholder="¿Qué fue lo que más te gustó?"></textarea></div>
          <button class="btn btn-bloque completo" type="submit">Enviar calificación</button>
        </div>
      </form>`);

    const form = document.getElementById('form-calif');
    const btns = form.querySelectorAll('.estrella-btn');
    const txt = document.getElementById('estrellas-texto');
    const pintar = v => btns.forEach(b => b.classList.toggle('on', +b.dataset.valor <= v));
    btns.forEach(b => {
      b.addEventListener('mouseenter', () => pintar(+b.dataset.valor));
      b.addEventListener('click', () => { valor = +b.dataset.valor; pintar(valor); txt.textContent = textos[valor]; });
    });
    form.querySelector('.estrellas-input').addEventListener('mouseleave', () => pintar(valor));

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!valor) { txt.textContent = '⚠️ Elige de 1 a 5 estrellas'; return; }
      const extra = guardado[id] || (guardado[id] = { suma: 0, total: 0, comentarios: [] });
      extra.suma += valor;
      extra.total += 1;
      extra.comentarios.push({
        nombre: form.nombre.value.trim(),
        estrellas: valor,
        texto: form.comentario.value.trim() || textos[valor]
      });
      guardar();
      renderGuias();
      renderPanel(puebloActual);
      cerrarModal();
      aviso(`⭐ ¡Gracias! Calificaste a ${g.nombre} con ${valor} estrella${valor > 1 ? 's' : ''}`);
    });
  }

  /* ======= 7. CLICS EN TODOS LOS BOTONES ======= */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-reservar],[data-restaurante],[data-calificar],[data-ir],[data-ver-guia]');
    if (!t) return;
    if (t.dataset.reservar) { e.preventDefault(); abrirReserva(t.dataset.reservar); }
    else if (t.dataset.restaurante) abrirRestaurante(t.dataset.restaurante);
    else if (t.dataset.calificar) abrirCalificar(t.dataset.calificar);
    else if (t.dataset.ir) renderPanel(t.dataset.ir);
    else if (t.dataset.verGuia) {
      const tarjeta = document.getElementById('guia-' + t.dataset.verGuia);
      tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tarjeta.classList.add('resaltar');
      setTimeout(() => tarjeta.classList.remove('resaltar'), 1600);
    }
  });

  /* ======= 8. BUSCADOR ======= */
  const buscador = document.getElementById('buscador');
  buscador.llegada.min = hoy;
  buscador.salida.min = hoy;
  buscador.addEventListener('submit', e => {
    e.preventDefault();
    abrirReserva(buscador.destino.value, {
      llegada: buscador.llegada.value,
      salida: buscador.salida.value,
      huespedes: buscador.huespedes.value
    });
  });

  renderPanel('huasca');
  renderGuias();
})();