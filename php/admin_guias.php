<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';
requerir_permiso('*');

function admin_guias_h($valor): string {
    return htmlspecialchars((string) $valor, ENT_QUOTES, 'UTF-8');
}

$errores = [];
$mensaje = '';
$passwordTemporal = null;
$nuevoUsuarioId = null;
$nombreFormulario = '';
$correoFormulario = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_validar($_POST['csrf_token'] ?? null)) {
        http_response_code(403);
        exit('Token CSRF inválido.');
    }

    $accion = $_POST['accion'] ?? '';
    if (!is_string($accion)) {
        $errores[] = 'La acción solicitada no es válida.';
    } elseif ($accion === 'crear_cuenta_guia') {
        $nombreFormulario = isset($_POST['nombre']) && is_string($_POST['nombre'])
            ? trim($_POST['nombre'])
            : '';
        $correoFormulario = isset($_POST['correo']) && is_string($_POST['correo'])
            ? trim($_POST['correo'])
            : '';

        if ($nombreFormulario === '' || mb_strlen($nombreFormulario, 'UTF-8') > 100) {
            $errores[] = 'El nombre es obligatorio y debe tener máximo 100 caracteres.';
        }
        if (mb_strlen($correoFormulario, 'UTF-8') > 150
            || !filter_var($correoFormulario, FILTER_VALIDATE_EMAIL)) {
            $errores[] = 'Escribe un correo electrónico válido.';
        }
        if (!$errores) {
            $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE correo = ?');
            $stmt->execute([$correoFormulario]);
            if ($stmt->fetchColumn()) {
                $errores[] = 'Ya existe una cuenta con ese correo.';
            }
        }
        if (!$errores) {
            $passwordTemporal = bin2hex(random_bytes(24));
            $hash = password_hash($passwordTemporal, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare(
                'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$nombreFormulario, $correoFormulario, $hash, 'guia']);
            $nuevoUsuarioId = (int) $pdo->lastInsertId();
            $mensaje = 'La cuenta de guía se creó correctamente.';
            $nombreFormulario = '';
            $correoFormulario = '';
        }
    } elseif ($accion === 'cambiar_estado') {
        $guiaRaw = $_POST['guia_id'] ?? '';
        $estadoRaw = $_POST['activo'] ?? '';
        $guiaId = is_string($guiaRaw) ? filter_var($guiaRaw, FILTER_VALIDATE_INT) : false;
        $activo = is_string($estadoRaw) ? filter_var($estadoRaw, FILTER_VALIDATE_INT) : false;
        if ($guiaId === false || $guiaId < 1 || !in_array($activo, [0, 1], true)) {
            $errores[] = 'El perfil o el estado seleccionado no es válido.';
        } else {
            $stmt = $pdo->prepare('SELECT consentimiento_datos FROM guias WHERE id = ?');
            $stmt->execute([$guiaId]);
            $consentimiento = $stmt->fetchColumn();
            if ($consentimiento === false) {
                $errores[] = 'No se encontró el perfil seleccionado.';
            } elseif ($activo === 1 && (int) $consentimiento !== 1) {
                $errores[] = 'No se puede activar un perfil sin consentimiento de publicación.';
            } else {
                $stmt = $pdo->prepare('UPDATE guias SET activo = ? WHERE id = ?');
                $stmt->execute([$activo, $guiaId]);
                $mensaje = $activo ? 'El perfil quedó activo.' : 'El perfil quedó inactivo.';
            }
        }
    } else {
        $errores[] = 'La acción solicitada no es válida.';
    }
}

$stmt = $pdo->prepare(
    'SELECT g.id, g.nombre, g.telefono, g.correo, g.consentimiento_datos,
            g.consentimiento_fecha, g.activo, p.nombre AS pueblo
     FROM guias g
     INNER JOIN pueblos p ON p.id = g.pueblo_id
     ORDER BY g.nombre, g.id'
);
$stmt->execute();
$perfiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

$nav_texto = 'Mi cuenta';
$nav_href = 'login.php';
$csrf = csrf_token();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Administrar guías | Rutas de Encanto</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="stylesheet" href="../css/accesibilidad.css">
  <link rel="stylesheet" href="../css/auth.css">
</head>
<body class="auth">
  <?php require __DIR__ . '/_encabezado.php'; ?>
  <main class="seccion">
    <div class="contenedor">
      <div class="titulo-seccion titulo-pagina">
        <span class="pastilla">⚙️ ADMINISTRACIÓN</span>
        <h1>Administrar guías</h1>
        <p>Crea cuentas de guía y controla qué perfiles se publican.</p>
        <div class="adorno"></div>
      </div>
      <?php foreach ($errores as $error): ?>
        <p class="auth-aviso error" role="alert"><?= admin_guias_h($error) ?></p>
      <?php endforeach; ?>
      <?php if ($mensaje !== ''): ?>
        <p class="auth-aviso ok" role="status"><?= admin_guias_h($mensaje) ?></p>
      <?php endif; ?>
      <?php if ($passwordTemporal !== null): ?>
        <div class="auth-aviso ok" role="status">
          <strong>Contraseña temporal (se muestra solo ahora):</strong>
          <code><?= admin_guias_h($passwordTemporal) ?></code>
          <p>Entrégala al guía de forma segura. No vuelvas a cargar esta página antes de copiarla.</p>
          <a class="btn" href="panel_guia.php?usuario_id=<?= (int) $nuevoUsuarioId ?>">Crear su perfil de guía</a>
        </div>
      <?php endif; ?>

      <section class="card stack-card">
        <div class="card-cuerpo">
          <h2>Crear cuenta de guía</h2>
          <p class="card-desc">La cuenta recibe el rol de guía desde el servidor. La contraseña temporal se genera y se muestra una sola vez.</p>
          <form method="post">
            <input type="hidden" name="csrf_token" value="<?= admin_guias_h($csrf) ?>">
            <input type="hidden" name="accion" value="crear_cuenta_guia">
            <div class="form-grid">
              <div class="campo">
                <label for="nombre">Nombre</label>
                <input id="nombre" name="nombre" maxlength="100" value="<?= admin_guias_h($nombreFormulario) ?>" required>
              </div>
              <div class="campo">
                <label for="correo">Correo</label>
                <input id="correo" name="correo" type="email" maxlength="150" value="<?= admin_guias_h($correoFormulario) ?>" required>
              </div>
              <button class="btn" type="submit">Crear cuenta</button>
            </div>
          </form>
        </div>
      </section>

      <section class="card">
        <div class="card-cuerpo">
          <h2>Perfiles de guía</h2>
          <?php if (!$perfiles): ?>
            <p class="card-desc">Todavía no hay perfiles registrados.</p>
          <?php else: ?>
            <div class="rejilla">
              <?php foreach ($perfiles as $perfil): ?>
                <article class="card">
                  <div class="card-cuerpo">
                    <h3><?= admin_guias_h($perfil['nombre']) ?></h3>
                    <p class="guia-pueblo"><?= admin_guias_h($perfil['pueblo']) ?></p>
                    <p><?= (int) $perfil['consentimiento_datos'] === 1 ? 'Consentimiento registrado' : 'Sin consentimiento' ?></p>
                    <p><?= (int) $perfil['activo'] === 1 ? 'Activo' : 'Inactivo' ?></p>
                    <div class="dos-botones">
                      <a class="btn-secundario" href="panel_guia.php?guia_id=<?= (int) $perfil['id'] ?>">Editar perfil</a>
                      <form method="post">
                        <input type="hidden" name="csrf_token" value="<?= admin_guias_h($csrf) ?>">
                        <input type="hidden" name="accion" value="cambiar_estado">
                        <input type="hidden" name="guia_id" value="<?= (int) $perfil['id'] ?>">
                        <input type="hidden" name="activo" value="<?= (int) $perfil['activo'] === 1 ? '0' : '1' ?>">
                        <button class="btn" type="submit">
                          <?= (int) $perfil['activo'] === 1 ? 'Desactivar' : 'Activar' ?>
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>
      </section>
    </div>
  </main>
  <script src="../js/main.js"></script>
  <script src="../js/accesibilidad.js"></script>
  <script src="../js/sesion.js" data-base="../"></script>
</body>
</html>
