// Validación de fechas de reservación en el navegador.
// (La validación que de verdad protege está en php/reservar.php.)
//
// Uso, con los inputs <input type="date"> de llegada y salida:
//   const validar = configurarFechas(inputLlegada, inputSalida);
//   // al enviar la reserva:
//   const error = validar();
//   if (error) { mostrarMensaje(error); return; }

function configurarFechas(inLlegada, inSalida) {
  function fmt(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  var hoy = fmt(new Date());
  inLlegada.min = hoy;
  inSalida.min = hoy;

  function ajustar() {
    if (!inLlegada.value) { inSalida.min = hoy; return; }
    // La salida mínima es el día siguiente a la llegada
    var sig = new Date(inLlegada.value + 'T00:00:00');
    sig.setDate(sig.getDate() + 1);
    inSalida.min = fmt(sig);
    // Si la salida que había quedó inválida, se limpia
    if (inSalida.value && inSalida.value <= inLlegada.value) {
      inSalida.value = '';
    }
  }
  inLlegada.addEventListener('change', ajustar);
  ajustar();

  // El atributo min solo limita el calendario; escribir a mano lo evita,
  // por eso también se comprueba al enviar:
  return function validar() {
    if (!inLlegada.value || !inSalida.value) return 'Elige las fechas de llegada y salida.';
    if (inLlegada.value < hoy) return 'La llegada no puede ser anterior a hoy.';
    if (inSalida.value <= inLlegada.value) return 'La salida debe ser después de la llegada.';
    return '';
  };
}
