(function () {
  const lista = document.getElementById('lista-guias');
  if (!lista || !lista.dataset.api) return;

  const estado = document.getElementById('estado-guias');
  const filtroPueblo = document.getElementById('filtro-pueblo');
  const filtroActividad = document.getElementById('filtro-actividad');
  const paginaGuias = Boolean(filtroPueblo && filtroActividad);
  const fotosGuiasEjemplo = {
    'Lía Viento de Huasca': 'img/guias/lia-viento-de-huasca.png',
    'Elian Bosque Chico': 'img/guias/elian-bosque-chico.png',
    'Mara Mina Serena': 'img/guias/mara-mina-serena.png'
  };
  let filtrosCargados = false;
  let solicitudLista = 0;

  function texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor);
  }

  function agregarTexto(etiqueta, contenido, clase) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    elemento.textContent = contenido;
    return elemento;
  }

  function formatoPrecio(valor) {
    const precio = Number(valor);
    return Number.isFinite(precio) && precio >= 0
      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(precio)
      : 'Consultar';
  }

  function rutaImagenValida(ruta) {
    return typeof ruta === 'string'
      && /^img\/[a-z0-9/_-]+\.(?:jpg|jpeg|png|webp)$/i.test(ruta)
      && !ruta.includes('..');
  }

  function fotoGuia(guia, ruta) {
    return /^img\/guias\/guia-[123]\.(?:jpg|png)$/i.test(texto(ruta))
      ? fotosGuiasEjemplo[texto(guia.nombre)] || ruta
      : ruta;
  }

  function agregarFoto(caja, ruta, alt) {
    if (!rutaImagenValida(ruta)) {
      caja.dataset.ruta = 'Foto no disponible';
      caja.classList.add('sin-foto');
      return;
    }

    const imagen = document.createElement('img');
    imagen.src = ruta;
    imagen.alt = alt;
    let intentoPng = false;
    imagen.addEventListener('error', function () {
      if (!intentoPng && /\.jpe?g$/i.test(ruta)) {
        intentoPng = true;
        imagen.src = ruta.replace(/\.jpe?g$/i, '.png');
        return;
      }
      caja.dataset.ruta = ruta;
      caja.classList.add('sin-foto');
      imagen.remove();
    });
    caja.append(imagen);
  }

  function crearTarjeta(guia) {
    const articulo = document.createElement('article');
    articulo.className = 'card guia-card';

    const foto = document.createElement('div');
    foto.className = 'foto';
    agregarFoto(foto, fotoGuia(guia, guia.foto), 'Foto de ' + texto(guia.nombre));
    articulo.append(foto);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'card-cuerpo card-centro';
    cuerpo.append(agregarTexto('h3', texto(guia.nombre)));
    cuerpo.append(agregarTexto('p', '📍 ' + texto(guia.pueblo), 'guia-pueblo'));
    cuerpo.append(agregarTexto('p', texto(guia.descripcion), 'card-desc'));
    cuerpo.append(agregarTexto('p', 'Desde ' + formatoPrecio(guia.precio_aprox) + ' por recorrido', 'precio'));

    const etiquetas = document.createElement('div');
    etiquetas.className = 'etiquetas';
    etiquetas.style.justifyContent = 'center';
    texto(guia.actividades).split(/[,;]+/).map(item => item.trim()).filter(Boolean).forEach(function (actividad, indice) {
      const etiqueta = agregarTexto('span', actividad, 'etiqueta ' + (indice % 2 ? 'olivo' : 'terracota'));
      etiquetas.append(etiqueta);
    });
    cuerpo.append(etiquetas);

    if (paginaGuias) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn';
      boton.textContent = 'Ver guía y ruta';
      boton.dataset.verDetalle = String(guia.id);
      cuerpo.append(boton);
    } else {
      const enlace = document.createElement('a');
      enlace.className = 'btn';
      enlace.textContent = 'Ver guía';
      enlace.href = 'guia.html?id=' + encodeURIComponent(String(guia.id));
      cuerpo.append(enlace);
    }

    articulo.append(cuerpo);
    return articulo;
  }

  function poblarFiltros(guias) {
    if (filtrosCargados || !paginaGuias) return;
    const pueblos = new Map();
    const actividades = new Set();
    guias.forEach(function (guia) {
      pueblos.set(String(guia.pueblo_id), texto(guia.pueblo));
      texto(guia.actividades).split(/[,;]+/).map(item => item.trim()).filter(Boolean).forEach(item => {
        actividades.add(item);
      });
    });

    Array.from(pueblos.entries()).sort((a, b) => a[1].localeCompare(b[1], 'es')).forEach(function (par) {
      const opcion = document.createElement('option');
      opcion.value = par[0];
      opcion.textContent = par[1];
      filtroPueblo.append(opcion);
    });
    Array.from(actividades).sort((a, b) => a.localeCompare(b, 'es')).forEach(function (actividad) {
      const opcion = document.createElement('option');
      opcion.value = actividad;
      opcion.textContent = actividad;
      filtroActividad.append(opcion);
    });
    filtrosCargados = true;
  }

  async function cargarGuias() {
    const numeroSolicitud = ++solicitudLista;
    const url = new URL(lista.dataset.api, window.location.href);
    if (filtroPueblo && filtroPueblo.value) url.searchParams.set('pueblo_id', filtroPueblo.value);
    if (filtroActividad && filtroActividad.value) url.searchParams.set('actividad', filtroActividad.value);
    estado.textContent = 'Cargando guías...';

    try {
      const respuesta = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        throw new Error(resultado.error || 'No se pudieron cargar las guías.');
      }
      if (numeroSolicitud !== solicitudLista) return;

      const guias = Array.isArray(resultado.guias) ? resultado.guias : [];
      poblarFiltros(guias);
      lista.replaceChildren();
      const guiasVisibles = paginaGuias ? guias : guias.slice(0, 3);
      guiasVisibles.forEach(guia => lista.append(crearTarjeta(guia)));
      estado.textContent = guiasVisibles.length ? '' : 'No hay guías que coincidan con los filtros.';
    } catch (error) {
      if (numeroSolicitud !== solicitudLista) return;
      lista.replaceChildren();
      estado.textContent = error.message || 'No se pudieron cargar las guías. Inténtalo de nuevo.';
    }
  }

  function contacto(guia, contenedor) {
    const tieneContacto = Object.prototype.hasOwnProperty.call(guia, 'telefono')
      && Object.prototype.hasOwnProperty.call(guia, 'correo');
    if (!tieneContacto) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso-contacto';
      aviso.append(agregarTexto('p', 'Inicia sesión para ver el teléfono y el correo de este guía.'));

      const acciones = document.createElement('div');
      acciones.className = 'aviso-contacto__acciones';
      const iniciar = document.createElement('a');
      iniciar.className = 'btn';
      iniciar.href = 'php/login.php?volver=guia.html';
      iniciar.textContent = 'Iniciar sesión';
      const registro = document.createElement('a');
      registro.className = 'btn-secundario';
      registro.href = 'php/registro.php?volver=guia.html';
      registro.textContent = 'Crear cuenta';
      acciones.append(iniciar, registro);
      aviso.append(acciones);
      contenedor.append(aviso);
      return;
    }

    const botones = document.createElement('div');
    botones.className = 'dos-botones';
    const telefono = texto(guia.telefono);
    const digitos = telefono.replace(/\D/g, '');
    if (digitos) {
      const enlaceTelefono = document.createElement('a');
      enlaceTelefono.className = 'btn';
      enlaceTelefono.href = 'tel:' + digitos;
      enlaceTelefono.textContent = 'Llamar: ' + telefono;
      botones.append(enlaceTelefono);
    }
    const correo = texto(guia.correo);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      const enlaceCorreo = document.createElement('a');
      enlaceCorreo.className = 'btn btn-secundario';
      enlaceCorreo.href = 'mailto:' + correo;
      enlaceCorreo.textContent = 'Correo: ' + correo;
      botones.append(enlaceCorreo);
    }
    contenedor.append(botones);
  }

  function dibujarMapa(caja, puntos) {
    if (!window.L) {
      caja.textContent = 'No se pudo cargar el mapa.';
      return;
    }
    const validos = puntos.map(function (punto) {
      return { punto, lat: Number(punto.latitud), lng: Number(punto.longitud) };
    }).filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng)
      && item.lat >= -90 && item.lat <= 90 && item.lng >= -180 && item.lng <= 180);

    if (!validos.length) {
      caja.textContent = 'Este guía todavía no tiene puntos de ruta.';
      return;
    }

    const mapa = L.map(caja, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapa);

    const coordenadas = validos.map(item => [item.lat, item.lng]);
    L.polyline(coordenadas, { color: '#B5642F', weight: 4 }).addTo(mapa);
    validos.forEach(function (item, indice) {
      const numero = indice + 1;
      const icono = L.divIcon({
        className: '',
        html: '<span class="marcador-ruta-numero">' + numero + '</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([item.lat, item.lng], { icon: icono }).addTo(mapa);
    });
    mapa.fitBounds(coordenadas, { padding: [24, 24] });
    requestAnimationFrame(() => mapa.invalidateSize());
  }

  async function verDetalle(id) {
    if (!window.AlbaModal) {
      estado.textContent = 'No se pudo abrir el detalle del guía.';
      return;
    }
    if (!Number.isInteger(Number(id)) || Number(id) < 1) return;

    window.AlbaModal.abrir('<p class="modal-sub">Cargando información del guía...</p>');
    try {
      const respuesta = await fetch('php/guia.php?id=' + encodeURIComponent(String(id)), {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        throw new Error(resultado.error || 'No se pudo cargar el detalle del guía.');
      }

      const guia = resultado.guia;
      const contenido = document.getElementById('modal-contenido');
      contenido.replaceChildren();
      contenido.append(agregarTexto('h3', texto(guia.nombre)));
      contenido.append(agregarTexto('p', '📍 ' + texto(guia.pueblo), 'modal-sub'));
      contenido.append(agregarTexto('p', texto(guia.descripcion), 'card-desc'));
      contenido.append(agregarTexto('p', 'Actividades: ' + texto(guia.actividades), 'guia-pueblo'));
      contenido.append(agregarTexto('p', 'Precio aproximado: ' + formatoPrecio(guia.precio_aprox) + ' por recorrido', 'modal-sub'));

      const galeria = document.createElement('div');
      galeria.className = 'rejilla rejilla-4';
      (Array.isArray(guia.fotos) ? guia.fotos : []).forEach(function (ruta, indice) {
        const marco = document.createElement('div');
        marco.className = 'foto';
        agregarFoto(marco, fotoGuia(guia, ruta), 'Foto ' + (indice + 1) + ' de ' + texto(guia.nombre));
        galeria.append(marco);
      });
      if (galeria.childElementCount) contenido.append(galeria);

      const puntos = Array.isArray(guia.puntos) ? guia.puntos : [];
      contenido.append(agregarTexto('h4', 'Ruta del guía'));
      const mapa = document.createElement('div');
      mapa.setAttribute('role', 'region');
      mapa.setAttribute('aria-label', 'Mapa de la ruta del guía');
      mapa.style.height = '320px';
      mapa.style.borderRadius = '14px';
      mapa.style.margin = '1rem 0';
      contenido.append(mapa);
      dibujarMapa(mapa, puntos);

      if (puntos.length) {
        const listaPuntos = document.createElement('ol');
        listaPuntos.className = 'info-lista';
        puntos.forEach(function (punto, indice) {
          listaPuntos.append(agregarTexto('li', (indice + 1) + '. ' + texto(punto.nombre)));
        });
        contenido.append(listaPuntos);
      }

      contacto(guia, contenido);
    } catch (error) {
      const contenido = document.getElementById('modal-contenido');
      contenido.replaceChildren(agregarTexto('p', error.message || 'No se pudo cargar el detalle del guía.', 'resumen'));
    }
  }

  if (filtroPueblo) filtroPueblo.addEventListener('change', cargarGuias);
  if (filtroActividad) filtroActividad.addEventListener('change', cargarGuias);
  lista.addEventListener('click', function (evento) {
    const boton = evento.target.closest('[data-ver-detalle]');
    if (boton) verDetalle(boton.dataset.verDetalle);
  });

  cargarGuias().then(function () {
    if (paginaGuias) {
      const id = new URLSearchParams(window.location.search).get('id');
      if (id) verDetalle(id);
    }
  });
})();
