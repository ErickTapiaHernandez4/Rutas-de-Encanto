(function () {
  const mapaElemento = document.getElementById('mapa-ruta-guia');
  if (!mapaElemento) return;

  const lista = document.getElementById('lista-puntos-ruta');
  const campoPuntos = document.getElementById('puntos_json');
  const estado = document.getElementById('estado-ruta-guia');
  const formulario = document.getElementById('form-ruta-guia');
  const puntos = Array.isArray(window.RDE_PUNTOS_INICIALES)
    ? window.RDE_PUNTOS_INICIALES.map(punto => ({
      nombre: String(punto.nombre || ''),
      latitud: Number(punto.latitud),
      longitud: Number(punto.longitud)
    }))
    : [];
  let mapa = null;
  let capaRuta = null;

  function sincronizar() {
    campoPuntos.value = JSON.stringify(puntos);
  }

  function dibujarLista() {
    lista.replaceChildren();
    puntos.forEach(function (punto, indice) {
      const elemento = document.createElement('li');
      elemento.className = 'card';
      elemento.style.padding = '.7rem';
      elemento.style.marginBottom = '.5rem';

      const nombre = document.createElement('input');
      nombre.type = 'text';
      nombre.maxLength = 120;
      nombre.value = punto.nombre;
      nombre.setAttribute('aria-label', 'Nombre del punto ' + (indice + 1));
      nombre.dataset.nombrePunto = String(indice);
      elemento.append(nombre);

      const coordenadas = document.createElement('span');
      coordenadas.textContent = punto.latitud.toFixed(5) + ', ' + punto.longitud.toFixed(5);
      elemento.append(coordenadas);

      const acciones = document.createElement('div');
      acciones.className = 'dos-botones';
      const subir = document.createElement('button');
      subir.type = 'button';
      subir.className = 'btn btn-secundario';
      subir.textContent = 'Subir';
      subir.disabled = indice === 0;
      subir.dataset.moverPunto = String(indice - 1);
      subir.setAttribute('aria-label', 'Subir punto ' + (indice + 1));
      const bajar = document.createElement('button');
      bajar.type = 'button';
      bajar.className = 'btn btn-secundario';
      bajar.textContent = 'Bajar';
      bajar.disabled = indice === puntos.length - 1;
      bajar.dataset.moverPunto = String(indice + 1);
      bajar.setAttribute('aria-label', 'Bajar punto ' + (indice + 1));
      const eliminar = document.createElement('button');
      eliminar.type = 'button';
      eliminar.className = 'btn btn-secundario';
      eliminar.textContent = 'Eliminar';
      eliminar.dataset.eliminarPunto = String(indice);
      eliminar.setAttribute('aria-label', 'Eliminar punto ' + (indice + 1));
      acciones.append(subir, bajar, eliminar);
      elemento.append(acciones);
      lista.append(elemento);
    });
    sincronizar();
  }

  function dibujarPuntosEnMapa() {
    if (!mapa || !capaRuta) return;
    capaRuta.clearLayers();
    const coordenadas = [];
    puntos.forEach(function (punto, indice) {
      const lat = Number(punto.latitud);
      const lng = Number(punto.longitud);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)
        || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
      coordenadas.push([lat, lng]);
      const numero = indice + 1;
      const icono = L.divIcon({
        className: '',
        html: '<span class="marcador-ruta-numero">' + numero + '</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([lat, lng], { icon: icono }).addTo(capaRuta);
    });
    if (coordenadas.length) {
      L.polyline(coordenadas, { color: '#B5642F', weight: 4 }).addTo(capaRuta);
      mapa.fitBounds(coordenadas, { padding: [24, 24] });
    }
  }

  dibujarLista();

  if (!window.L) {
    estado.textContent = 'No se pudo cargar el mapa; puedes editar y guardar los puntos existentes.';
  } else {
    mapa = L.map(mapaElemento, { scrollWheelZoom: false }).setView([20.5, -98.9], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapa);
    capaRuta = L.featureGroup().addTo(mapa);
    estado.textContent = 'Haz clic en el mapa para agregar un punto. Puedes editar su nombre y orden en la lista.';
    dibujarPuntosEnMapa();
    mapa.on('click', function (evento) {
      if (puntos.length >= 15) {
        estado.textContent = 'La ruta ya tiene el máximo de 15 puntos.';
        return;
      }
      puntos.push({
        nombre: 'Punto ' + (puntos.length + 1),
        latitud: evento.latlng.lat,
        longitud: evento.latlng.lng
      });
      dibujarLista();
      dibujarPuntosEnMapa();
    });
  }

  lista.addEventListener('input', function (evento) {
    const campo = evento.target.closest('[data-nombre-punto]');
    if (!campo) return;
    const indice = Number(campo.dataset.nombrePunto);
    if (!Number.isInteger(indice) || !puntos[indice]) return;
    puntos[indice].nombre = campo.value;
    sincronizar();
  });

  lista.addEventListener('click', function (evento) {
    const mover = evento.target.closest('[data-mover-punto]');
    const eliminar = evento.target.closest('[data-eliminar-punto]');
    if (mover) {
      const destino = Number(mover.dataset.moverPunto);
      const origen = Number(mover.closest('li').querySelector('[data-nombre-punto]').dataset.nombrePunto);
      if (Number.isInteger(destino) && destino >= 0 && destino < puntos.length) {
        const [punto] = puntos.splice(origen, 1);
        puntos.splice(destino, 0, punto);
        dibujarLista();
        dibujarPuntosEnMapa();
      }
    } else if (eliminar) {
      const indice = Number(eliminar.dataset.eliminarPunto);
      if (Number.isInteger(indice) && indice >= 0 && indice < puntos.length) {
        puntos.splice(indice, 1);
        dibujarLista();
        dibujarPuntosEnMapa();
      }
    }
  });

  formulario.addEventListener('submit', function (evento) {
    if (puntos.some(punto => !punto.nombre.trim())) {
      estado.textContent = 'Escribe un nombre para cada punto antes de guardar.';
      evento.preventDefault();
      return;
    }
    sincronizar();
  });
})();
