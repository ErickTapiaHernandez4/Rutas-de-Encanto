(function () {
  const nombreValido = /^[\p{L}\p{M} '\u2019.-]+$/u;
  const extensionesFoto = new Set(['jpg', 'jpeg', 'png', 'webp']);
  const tiposFoto = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const tamanoMaximoFoto = 2 * 1024 * 1024;

  function longitud(texto) {
    return Array.from(texto).length;
  }

  function contenedorCampo(campo) {
    return campo.closest('.campo') || campo.parentElement;
  }

  function claveCampo(campo) {
    return campo.id || campo.name.replace(/\[\]$/, '');
  }

  function nodoError(campo, crear) {
    const contenedor = contenedorCampo(campo);
    if (!contenedor) return null;
    const clave = claveCampo(campo);
    let error = [...contenedor.querySelectorAll('.error-campo')]
      .find(nodo => nodo.dataset.errorPara === clave || nodo.id === clave + '-error');
    if (!error && crear) {
      error = document.createElement('small');
      error.className = 'error-campo';
      error.id = clave + '-error';
      error.dataset.errorPara = clave;
      contenedor.append(error);
    }
    return error;
  }

  function actualizarDescripcion(campo, id, agregar) {
    const ids = new Set((campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    if (agregar) ids.add(id);
    else ids.delete(id);
    if (ids.size) campo.setAttribute('aria-describedby', [...ids].join(' '));
    else campo.removeAttribute('aria-describedby');
  }

  function mostrarError(campo, mensaje) {
    const error = nodoError(campo, true);
    if (!error) return;
    error.textContent = mensaje;
    error.setAttribute('role', 'alert');
    campo.setAttribute('aria-invalid', 'true');
    actualizarDescripcion(campo, error.id, true);
  }

  function limpiarError(campo) {
    const error = nodoError(campo, false);
    if (!error) return;
    actualizarDescripcion(campo, error.id, false);
    error.remove();
    campo.removeAttribute('aria-invalid');
  }

  function validarCampo(campo) {
    const tipo = campo.dataset.validacion;
    const valor = campo.value.trim();
    const form = campo.form;
    let mensaje = '';

    if (campo.required && (campo.type === 'file' ? !campo.files.length : valor === '')) {
      mensaje = 'Completa este campo.';
    } else if (valor !== '') {
      switch (tipo) {
        case 'nombre': {
          const cantidad = longitud(valor);
          if (cantidad < 2 || cantidad > 100 || !nombreValido.test(valor)) {
            mensaje = 'Usa de 2 a 100 letras, espacios, apóstrofos, puntos o guiones.';
          }
          break;
        }
        case 'correo':
          if (longitud(valor) > 150 || campo.validity.typeMismatch) {
            mensaje = 'Escribe un correo válido de hasta 150 caracteres.';
          }
          break;
        case 'password':
          if (longitud(campo.value) < 8 || longitud(campo.value) > 72
            || !/\p{L}/u.test(campo.value) || !/[0-9]/.test(campo.value)) {
            mensaje = 'Usa de 8 a 72 caracteres, con al menos una letra y un número.';
          }
          break;
        case 'password-login':
          if (campo.value.length === 0) mensaje = 'Escribe tu contraseña.';
          break;
        case 'confirmar-password':
          if (campo.value !== form.elements.password.value) {
            mensaje = 'Las contraseñas no coinciden.';
          }
          break;
        case 'telefono':
          if (!/^\d{10}$/.test(campo.value)) mensaje = 'Escribe exactamente 10 dígitos, sin espacios ni guiones.';
          break;
        case 'descripcion':
          if (longitud(campo.value) > 1000) mensaje = 'La descripción no puede superar 1000 caracteres.';
          break;
        case 'precio':
          if (!/^\d+(?:\.\d{1,2})?$/.test(valor) || Number(valor) < 0) {
            mensaje = 'Escribe un precio mayor o igual a 0, con hasta dos decimales.';
          }
          break;
        case 'huespedes': {
          const cantidad = Number(valor);
          if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) {
            mensaje = 'Elige de 1 a 10 huéspedes.';
          }
          break;
        }
        case 'llegada': {
          const hoy = new Date();
          hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
          const fechaHoy = hoy.toISOString().slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor < fechaHoy) {
            mensaje = 'La llegada no puede ser anterior a hoy.';
          }
          break;
        }
        case 'salida': {
          const llegada = form.elements.llegada.value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !llegada || valor <= llegada) {
            mensaje = 'La salida debe ser posterior a la llegada.';
          } else if ((Date.parse(valor) - Date.parse(llegada)) / 86400000 > 30) {
            mensaje = 'La estancia máxima es de 30 noches.';
          }
          break;
        }
        case 'tipo-cuenta':
          if (!['turista', 'guia'].includes(valor)) mensaje = 'Selecciona Turista o Guía local.';
          break;
        case 'pueblo':
          if (!/^\d+$/.test(valor)) mensaje = 'Selecciona un pueblo.';
          break;
        case 'fotos': {
          const archivos = [...campo.files];
          const maximo = Number(campo.dataset.maxFiles || 5);
          if (archivos.length > maximo) {
            mensaje = `Puedes subir hasta ${maximo} fotos.`;
          } else {
            const invalido = archivos.find(archivo => {
              const extension = archivo.name.split('.').pop().toLowerCase();
              return !extensionesFoto.has(extension) || !tiposFoto.has(archivo.type)
                || archivo.size > tamanoMaximoFoto;
            });
            if (invalido) {
              mensaje = invalido.size > tamanoMaximoFoto
                ? 'Cada foto debe pesar como máximo 2 MB.'
                : 'Solo se aceptan fotos JPEG, PNG o WebP con extensión .jpg, .jpeg, .png o .webp.';
            }
          }
          break;
        }
        default:
          if (campo.validity.typeMismatch) mensaje = 'Revisa el formato de este campo.';
      }
    }

    if (mensaje) mostrarError(campo, mensaje);
    else limpiarError(campo);
    return !mensaje;
  }

  function validarFormulario(form) {
    const campos = [...form.elements].filter(campo => campo.dataset && campo.dataset.validacion);
    const invalidos = campos.filter(campo => !validarCampo(campo));
    if (invalidos.length) invalidos[0].focus();
    return invalidos.length === 0;
  }

  function mostrarErrores(form, errores) {
    const mensajesNoAsignados = [];
    if (Array.isArray(errores)) return errores.map(String);
    if (!errores || typeof errores !== 'object') return mensajesNoAsignados;

    Object.entries(errores).forEach(([clave, mensaje]) => {
      const campo = [...form.elements].find(elemento =>
        elemento.name === clave || elemento.id === clave
      );
      if (campo && campo.type !== 'hidden') mostrarError(campo, String(mensaje));
      else mensajesNoAsignados.push(String(mensaje));
    });
    return mensajesNoAsignados;
  }

  function actualizarContador(campo) {
    const contador = document.getElementById(campo.dataset.contadorCaracteres);
    const limite = Number(campo.dataset.limiteCaracteres || campo.maxLength);
    if (contador) contador.textContent = `${longitud(campo.value)}/${limite} caracteres`;
  }

  document.addEventListener('focusout', evento => {
    const campo = evento.target;
    if (campo instanceof HTMLElement && campo.dataset.validacion
      && campo.form && campo.form.matches('[data-validar-form]')) {
      validarCampo(campo);
      const salida = campo.dataset.validacion === 'llegada' && campo.form.elements.salida;
      if (salida && salida.value) {
        validarCampo(salida);
      }
    }
  });

  document.addEventListener('input', evento => {
    const campo = evento.target;
    if (!(campo instanceof HTMLElement)) return;
    if (campo.dataset.contadorCaracteres) actualizarContador(campo);
    if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
    if (campo.name === 'password' && campo.form) {
      const confirmacion = campo.form.elements.confirmar_password;
      if (confirmacion && confirmacion.getAttribute('aria-invalid') === 'true') validarCampo(confirmacion);
    }
  });

  document.addEventListener('change', evento => {
    const campo = evento.target;
    if (campo instanceof HTMLElement && campo.dataset.validacion === 'fotos'
      && campo.form && campo.form.matches('[data-validar-form]')) {
      validarCampo(campo);
    }
  });

  document.addEventListener('submit', evento => {
    const form = evento.target;
    if (form instanceof HTMLFormElement && form.matches('[data-validar-form]')
      && !validarFormulario(form)) {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      const primerError = [...form.elements].find(campo => campo.getAttribute('aria-invalid') === 'true');
      if (primerError) requestAnimationFrame(() => primerError.focus());
    }
  }, true);

  document.addEventListener('click', evento => {
    const boton = evento.target instanceof Element
      ? evento.target.closest('[data-toggle-password]')
      : null;
    if (!boton) return;
    const campo = document.getElementById(boton.dataset.togglePassword);
    if (!campo) return;
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    boton.textContent = mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña';
    boton.setAttribute('aria-pressed', mostrar ? 'true' : 'false');
  });

  document.querySelectorAll('[data-contador-caracteres]').forEach(actualizarContador);
  window.RDE_VALIDACION = { validarCampo, validarFormulario, mostrarErrores };
})();
