<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';

$erroresCampo = [];
$nombre = '';
$correo = '';
$tipoCuenta = 'turista';
$volverPermitidos = ['index.html', 'hospedaje.html', 'restaurantes.html', 'guia.html', 'planificar.html'];
$volver = in_array($_GET['volver'] ?? '', $volverPermitidos, true) ? $_GET['volver'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_validar($_POST['csrf_token'] ?? null)) {
        http_response_code(403);
        exit('Token CSRF inválido.');
    }

    $nombre = isset($_POST['nombre']) && is_string($_POST['nombre']) ? trim($_POST['nombre']) : '';
    $correo = isset($_POST['correo']) && is_string($_POST['correo']) ? trim($_POST['correo']) : '';
    $password = isset($_POST['password']) && is_string($_POST['password']) ? $_POST['password'] : '';
    $repetirPassword = isset($_POST['repetir_password']) && is_string($_POST['repetir_password'])
        ? $_POST['repetir_password']
        : '';
    $tipoRaw = $_POST['tipo_cuenta'] ?? null;
    $tipoCuenta = is_string($tipoRaw) ? $tipoRaw : '';

    $nombreCorrecto = preg_match('/\A[\p{L}\p{M} \'\x{2019}.-]+\z/u', $nombre) === 1;
    $longitudNombre = mb_strlen($nombre, 'UTF-8');
    if ($longitudNombre < 2 || $longitudNombre > 100 || !$nombreCorrecto) {
        $erroresCampo['nombre'] = 'Usa de 2 a 100 letras, espacios, apóstrofos, puntos o guiones.';
    }
    if (mb_strlen($correo, 'UTF-8') > 150 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $erroresCampo['correo'] = 'Escribe un correo válido de hasta 150 caracteres.';
    }
    $longitudPassword = mb_strlen($password, 'UTF-8');
    if ($longitudPassword < 8 || $longitudPassword > 72
        || preg_match('/\p{L}/u', $password) !== 1
        || preg_match('/[0-9]/', $password) !== 1) {
        $erroresCampo['password'] = 'Usa de 8 a 72 caracteres, con al menos una letra y un número.';
    }
    if ($repetirPassword !== $password) {
        $erroresCampo['repetir_password'] = 'Las contraseñas no coinciden.';
    }
    if (!in_array($tipoCuenta, ['turista', 'guia'], true)) {
        $erroresCampo['tipo_cuenta'] = 'Selecciona Turista o Guía local.';
    }

    if (!$erroresCampo) {
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE correo = ?');
        $stmt->execute([$correo]);
        if ($stmt->fetch()) {
            $erroresCampo['correo'] = 'Ese correo ya está registrado.';
        }
    }

    if (!$erroresCampo) {
        $stmt = $pdo->prepare(
            'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$nombre, $correo, password_hash($password, PASSWORD_DEFAULT), $tipoCuenta]);
        header('Location: login.php?registro=ok' . ($volver !== '' ? '&volver=' . rawurlencode($volver) : ''));
        exit;
    }
}
$csrf = csrf_token();
$nav_texto = 'Iniciar sesión';
$nav_href = 'login.php' . ($volver !== '' ? '?volver=' . rawurlencode($volver) : '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Crear cuenta - Rutas de Encanto</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../css/accesibilidad.css">
    <link rel="stylesheet" href="../css/auth.css">
</head>
<body class="auth">
    <?php require __DIR__ . '/_encabezado.php'; ?>
    <main class="auth-main">
        <section class="card auth-card">
            <div class="card-cuerpo">
                <h1>Crear cuenta</h1>
                <p class="sub">Únete para organizar tus próximas rutas.</p>

                <form method="post" data-validar-form novalidate>
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
                    <div class="campo">
                        <label for="tipo_cuenta">Tipo de cuenta</label>
                        <select id="tipo_cuenta" name="tipo_cuenta" data-validacion="tipo-cuenta" required aria-describedby="ayuda-tipo_cuenta<?= isset($erroresCampo['tipo_cuenta']) ? ' tipo_cuenta-error' : '' ?>">
                            <option value="turista" <?= $tipoCuenta === 'turista' ? 'selected' : '' ?>>Turista</option>
                            <option value="guia" <?= $tipoCuenta === 'guia' ? 'selected' : '' ?>>Guía local</option>
                        </select>
                        <small class="ayuda" id="ayuda-tipo_cuenta">Elige el tipo de cuenta; solo se permite turista o guía local.</small>
                        <?php if (isset($erroresCampo['tipo_cuenta'])): ?>
                            <small class="error-campo" id="tipo_cuenta-error" role="alert"><?= htmlspecialchars($erroresCampo['tipo_cuenta'], ENT_QUOTES, 'UTF-8') ?></small>
                        <?php endif; ?>
                    </div>
                    <div class="campo">
                        <label for="nombre">Nombre</label>
                        <input id="nombre" type="text" name="nombre" value="<?= htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') ?>" placeholder="Ej. María Fernanda López Cruz" minlength="2" maxlength="200" autocomplete="name" data-validacion="nombre" required aria-describedby="ayuda-nombre<?= isset($erroresCampo['nombre']) ? ' nombre-error' : '' ?>">
                        <small class="ayuda" id="ayuda-nombre">Letras y espacios, de 2 a 100 caracteres; se permiten apóstrofo, punto y guion.</small>
                        <?php if (isset($erroresCampo['nombre'])): ?>
                            <small class="error-campo" id="nombre-error" role="alert"><?= htmlspecialchars($erroresCampo['nombre'], ENT_QUOTES, 'UTF-8') ?></small>
                        <?php endif; ?>
                    </div>
                    <div class="campo">
                        <label for="correo">Correo</label>
                        <input id="correo" type="email" name="correo" value="<?= htmlspecialchars($correo, ENT_QUOTES, 'UTF-8') ?>" placeholder="ejemplo@correo.com" maxlength="150" autocomplete="email" data-validacion="correo" required aria-describedby="ayuda-correo<?= isset($erroresCampo['correo']) ? ' correo-error' : '' ?>">
                        <small class="ayuda" id="ayuda-correo">Usa un correo válido, de máximo 150 caracteres.</small>
                        <?php if (isset($erroresCampo['correo'])): ?>
                            <small class="error-campo" id="correo-error" role="alert"><?= htmlspecialchars($erroresCampo['correo'], ENT_QUOTES, 'UTF-8') ?></small>
                        <?php endif; ?>
                    </div>
                    <div class="campo">
                        <label for="password">Contraseña</label>
                        <input id="password" type="password" name="password" placeholder="Crea una contraseña" minlength="8" maxlength="144" autocomplete="new-password" data-validacion="password" required aria-describedby="ayuda-password<?= isset($erroresCampo['password']) ? ' password-error' : '' ?>">
                        <small class="ayuda" id="ayuda-password">Mínimo 8 y máximo 72 caracteres, con al menos una letra y un número.</small>
                        <?php if (isset($erroresCampo['password'])): ?>
                            <small class="error-campo" id="password-error" role="alert"><?= htmlspecialchars($erroresCampo['password'], ENT_QUOTES, 'UTF-8') ?></small>
                        <?php endif; ?>
                        <button class="btn-secundario btn-sm" type="button" data-toggle-password="password" aria-controls="password" aria-pressed="false">Mostrar contraseña</button>
                    </div>
                    <div class="campo">
                        <label for="repetir_password">Repite la contraseña</label>
                        <input id="repetir_password" type="password" name="repetir_password" placeholder="Escribe de nuevo tu contraseña" maxlength="144" autocomplete="new-password" data-validacion="confirmar-password" required aria-describedby="ayuda-repetir_password<?= isset($erroresCampo['repetir_password']) ? ' repetir_password-error' : '' ?>">
                        <small class="ayuda" id="ayuda-repetir_password">Debe coincidir con la contraseña anterior.</small>
                        <?php if (isset($erroresCampo['repetir_password'])): ?>
                            <small class="error-campo" id="repetir_password-error" role="alert"><?= htmlspecialchars($erroresCampo['repetir_password'], ENT_QUOTES, 'UTF-8') ?></small>
                        <?php endif; ?>
                        <button class="btn-secundario btn-sm" type="button" data-toggle-password="repetir_password" aria-controls="repetir_password" aria-pressed="false">Mostrar contraseña</button>
                    </div>
                    <button class="btn btn-bloque" type="submit">Registrarme</button>
                </form>
                <p class="auth-pie">¿Ya tienes cuenta? <a href="login.php">Inicia sesión</a></p>
            </div>
        </section>
    </main>
    <script src="../js/validacion-formularios.js"></script>
    <script src="../js/main.js"></script>
    <script src="../js/accesibilidad.js"></script>
    <script src="../js/sesion.js" data-base="../"></script>
</body>
</html>
