// Muestra "Iniciar sesión" o "Hola, Nombre · Salir" en el botón del encabezado
// y muestra u oculta elementos según el rol.
//
// En el HTML:
//   <a id="btn-sesion" class="..." href="php/login.php">Iniciar sesión</a>
//   <script src="js/sesion.js" data-base=""></script>      (páginas en la raíz)
//
// Elementos por rol (empiezan ocultos):
//   <a href="verificar.php" data-rol="recepcion,admin" hidden>Check-in</a>
(function () {
  var base = (document.currentScript && document.currentScript.dataset.base) || '';
  var btn = document.getElementById('btn-sesion');

  window.RDE_SESION = fetch(base + 'php/sesion.php', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .catch(function () { return { logueado: false }; });

  window.RDE_SESION.then(function (s) {
    if (btn) {
      if (s.logueado) {
        btn.textContent = 'Hola, ' + s.nombre.split(' ')[0] + ' · Salir';
        btn.href = base + 'php/logout.php';
      } else {
        btn.textContent = 'Iniciar sesión';
        btn.href = base + 'php/login.php';
      }
    }
    document.querySelectorAll('[data-rol]').forEach(function (el) {
      var roles = el.dataset.rol.split(',');
      el.hidden = !(s.logueado && roles.indexOf(s.rol) !== -1);
    });
  });
})();
