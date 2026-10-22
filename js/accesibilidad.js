/* =========================================================
   ALBA GUÍA — Accesibilidad e inclusión
   Visual · Auditiva · Motriz · Cognitiva
   ========================================================= */
(function () {
  const raiz = document.documentElement;
  const CLAVE = 'albaGuia_accesibilidad';
  let ajustes = { texto: 100 };
  try { ajustes = Object.assign(ajustes, JSON.parse(localStorage.getItem(CLAVE)) || {}); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(ajustes)); } catch (e) {} };

  /* ---------- Opciones del panel ---------- */
  const OPCIONES = [
    { grupo: '👁️ Visual', items: [
      { id: 'contraste', icono: '🌗', texto: 'Alto contraste' },
      { id: 'cursor', icono: '➚', texto: 'Cursor grande' },
      { id: 'voz', icono: '🔊', texto: 'Lectura en voz alta' },
      { id: 'enlaces', icono: '🔗', texto: 'Resaltar enlaces' }
    ]},
    { grupo: '👂 Auditiva', items: [
      { id: 'avisos', icono: '💡', texto: 'Avisos visuales' },
      { id: 'lsm', icono: '🤟', texto: 'Video en Lengua de Señas', accion: true }
    ]},
    { grupo: '🖐️ Motriz', items: [
      { id: 'botones', icono: '👆', texto: 'Botones grandes' },
      { id: 'foco', icono: '⌨️', texto: 'Resaltar teclado' }
    ]},
    { grupo: '🧠 Cognitiva', items: [
      { id: 'lectura', icono: '📖', texto: 'Lectura fácil' },
      { id: 'regla', icono: '📏', texto: 'Guía de lectura' },
      { id: 'pausa', icono: '⏸️', texto: 'Detener animaciones' }
    ]}
  ];

  /* ---------- Enlace "Saltar al contenido" (teclado y lectores de pantalla) ---------- */
  const principal = document.querySelector('.cabecera-pagina') || document.getElementById('explorar') || document.querySelector('main, section');
  if (principal) { principal.id = principal.id || 'contenido'; principal.tabIndex = -1; }
  const saltar = document.createElement('a');
  saltar.href = '#' + (principal ? principal.id : '');
  saltar.className = 'a11y-saltar';
  saltar.textContent = 'Saltar al contenido';
  document.body.prepend(saltar);

  /* ---------- Botón flotante y panel ---------- */
  const boton = document.createElement('button');
  boton.className = 'a11y-boton';
  boton.setAttribute('aria-label', 'Opciones de accesibilidad (Alt + A)');
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', 'a11y-panel');
  boton.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4" r="2.2"/><path d="M3.5 8.2 4.3 6.4 12 8l7.7-1.6.8 1.8-5.8 1.6v4.4l2.1 7.4-1.9.6L12 15.1l-2.9 7.1-1.9-.6 2.1-7.4V9.8z"/></svg>';

  const panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.className = 'a11y-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Opciones de accesibilidad');
  panel.innerHTML = `
    <div class="a11y-cabeza">
      <h2>♿ Accesibilidad</h2>
      <button class="a11y-cerrar" aria-label="Cerrar panel">×</button>
    </div>
    <div class="a11y-texto">
      <span>Tamaño de texto</span>
      <div>
        <button data-texto="-10" aria-label="Reducir texto">A−</button>
        <output id="a11y-pct">100%</output>
        <button data-texto="10" aria-label="Aumentar texto">A+</button>
      </div>
    </div>
    ${OPCIONES.map(g => `
      <fieldset>
        <legend>${g.grupo}</legend>
        <div class="a11y-opciones">
          ${g.items.map(o => `<button class="a11y-op" data-op="${o.id}" ${o.accion ? '' : 'aria-pressed="false"'}><span aria-hidden="true">${o.icono}</span>${o.texto}</button>`).join('')}
        </div>
      </fieldset>`).join('')}
    <button class="a11y-reset">↺ Restablecer todo</button>`;

  const banda = document.createElement('div');           // guía de lectura
  banda.className = 'a11y-banda';
  banda.setAttribute('aria-hidden', 'true');
  const vivo = document.createElement('div');            // avisos para lectores de pantalla
  vivo.className = 'a11y-oculto';
  vivo.setAttribute('aria-live', 'polite');
  document.body.append(boton, panel, banda, vivo);
  document.addEventListener('mousemove', e => { banda.style.top = (e.clientY - 24) + 'px'; });

  /* ---------- Avisos (texto + destello visual para personas sordas) ---------- */
  function avisar(texto) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.append(t); }
    t.textContent = texto;
    t.classList.add('visible');
    vivo.textContent = texto;
    if (ajustes.avisos) { raiz.classList.remove('a11y-destello'); void raiz.offsetWidth; raiz.classList.add('a11y-destello'); }
    if (navigator.vibrate) navigator.vibrate(150);
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => t.classList.remove('visible'), 3500);
  }
  window.AlbaAviso = avisar;

  /* ---------- Ventana emergente compartida ---------- */
  let ultimoFoco;
  function asegurarModal() {
    let m = document.getElementById('modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'modal'; m.className = 'modal'; m.hidden = true;
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      m.innerHTML = '<div class="modal-caja"><button class="modal-cerrar" data-cerrar aria-label="Cerrar">×</button><div id="modal-contenido"></div></div>';
      document.body.append(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-cerrar]')) cerrarModal(); });
    }
    return m;
  }
  function abrirModal(html) {
    const m = asegurarModal();
    ultimoFoco = document.activeElement;
    m.querySelector('#modal-contenido').innerHTML = html;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    m.querySelector('.modal-cerrar').focus();
  }
  function cerrarModal() {
    const m = document.getElementById('modal');
    if (!m || m.hidden) return;
    m.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }
  window.AlbaModal = { abrir: abrirModal, cerrar: cerrarModal };

  /* ---------- Lectura en voz alta ---------- */
  const puedeHablar = 'speechSynthesis' in window;
  function hablar(texto, b) {
    if (!puedeHablar) return avisar('Tu navegador no permite la lectura en voz alta');
    const yaSonaba = b && b.classList.contains('sonando');
    speechSynthesis.cancel();
    document.querySelectorAll('.a11y-escuchar.sonando').forEach(x => { x.classList.remove('sonando'); x.textContent = '🔊 Escuchar'; });
    if (yaSonaba) return;
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'es-MX';
    voz.rate = 0.95;
    if (b) {
      b.classList.add('sonando');
      b.textContent = '⏹️ Detener';
      voz.onend = () => { b.classList.remove('sonando'); b.textContent = '🔊 Escuchar'; };
    }
    speechSynthesis.speak(voz);
  }
  window.AlbaHablar = hablar;
  function textoDe(el) {
    const copia = el.cloneNode(true);
    copia.querySelectorAll('button, .btn, .badge, svg').forEach(x => x.remove());
    return copia.textContent.replace(/[★☆]/g, '').replace(/\s+/g, ' ').trim();
  }
  const ZONAS_VOZ = '.card, .cabecera-pagina .contenedor, .titulo-seccion, .panel-info, .inclusion-card';
  function ponerBotonesVoz() {
    if (!ajustes.voz) {
      document.querySelectorAll('.a11y-escuchar').forEach(b => b.remove());
      if (puedeHablar) speechSynthesis.cancel();
      return;
    }
    document.querySelectorAll(ZONAS_VOZ).forEach(zona => {
      const destino = zona.querySelector(':scope > .card-cuerpo') || zona;
      if (destino.querySelector(':scope > .a11y-escuchar')) return;   // ya tiene botón
      if (zona.closest('.a11y-panel, .modal')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'a11y-escuchar';
      b.textContent = '🔊 Escuchar';
      b.setAttribute('aria-label', 'Escuchar esta sección');
      b.addEventListener('click', e => { e.stopPropagation(); hablar(textoDe(zona), b); });
      destino.prepend(b);
    });
  }
  // Si la página cambia (pestañas, calificaciones...), vuelve a poner los botones
  new MutationObserver(() => { if (ajustes.voz) ponerBotonesVoz(); })
    .observe(document.body, { childList: true, subtree: true });

  /* ---------- Video en Lengua de Señas Mexicana ---------- */
  function abrirLSM() {
    abrirModal(`
      <h3>🤟 Bienvenida en Lengua de Señas Mexicana</h3>
      <p class="modal-sub">Video con intérprete de LSM y transcripción en texto.</p>
      <div class="foto a11y-video">
        <video src="video/lsm-bienvenida.mp4" controls playsinline onerror="fotoVacia(this)"></video>
      </div>
      <details open class="a11y-transcripcion">
        <summary>📝 Transcripción del video</summary>
        <p>¡Bienvenido a Alba Guía! Aquí encuentras hospedaje, restaurantes y guías en los Pueblos Mágicos
           de Hidalgo. Todos los negocios pueden atenderte por mensaje de texto o WhatsApp,
           y algunos cuentan con personal que se comunica en Lengua de Señas Mexicana.</p>
      </details>`);
  }

  /* ---------- Aplicar ajustes ---------- */
  function aplicar() {
    raiz.style.fontSize = ajustes.texto + '%';
    panel.querySelector('#a11y-pct').textContent = ajustes.texto + '%';
    OPCIONES.forEach(g => g.items.forEach(o => {
      if (o.accion) return;
      raiz.classList.toggle('a11y-' + o.id, !!ajustes[o.id]);
      panel.querySelector(`[data-op="${o.id}"]`).setAttribute('aria-pressed', String(!!ajustes[o.id]));
    }));
    document.querySelectorAll('[data-a11y]').forEach(b => {
      if (b.dataset.a11y in ajustes || OPCIONES.some(g => g.items.some(o => o.id === b.dataset.a11y && !o.accion)))
        b.setAttribute('aria-pressed', String(!!ajustes[b.dataset.a11y]));
    });
    ponerBotonesVoz();
    guardar();
  }

  function alternarPanel(abrir = panel.hidden) {
    panel.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
    if (abrir) panel.querySelector('.a11y-cerrar').focus();
  }

  boton.addEventListener('click', () => alternarPanel());
  panel.querySelector('.a11y-cerrar').addEventListener('click', () => { alternarPanel(false); boton.focus(); });
  function accion(id, b) {
    if (id === 'lsm') return abrirLSM();
    if (id === 'panel') return alternarPanel(true);
    if (id === 'texto+' || id === 'texto-') {
      ajustes.texto = Math.min(160, Math.max(80, ajustes.texto + (id === 'texto+' ? 10 : -10)));
      aplicar();
      return avisar('Texto al ' + ajustes.texto + '%');
    }
    ajustes[id] = !ajustes[id];
    aplicar();
    const nombre = OPCIONES.flatMap(g => g.items).find(o => o.id === id);
    avisar((nombre ? nombre.texto : id) + (ajustes[id] ? ': activado' : ': desactivado'));
  }
  window.AlbaA11y = { accion };

  panel.addEventListener('click', e => {
    const tx = e.target.closest('[data-texto]');
    const op = e.target.closest('[data-op]');
    if (tx) accion(Number(tx.dataset.texto) > 0 ? 'texto+' : 'texto-');
    if (op) accion(op.dataset.op);
  });
  // Botones en la página con data-a11y="contraste", "voz", "lsm", "texto+", "panel"...
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a11y]');
    if (b) accion(b.dataset.a11y, b);
  });
  panel.querySelector('.a11y-reset').addEventListener('click', () => {
    ajustes = { texto: 100 };
    aplicar();
    avisar('Ajustes restablecidos');
  });
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'a') { e.preventDefault(); alternarPanel(); }
    if (e.key === 'Escape') {
      if (!panel.hidden) { alternarPanel(false); boton.focus(); }
      else cerrarModal();
    }
  });

  aplicar();
})();