<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';

$volverPermitidos = ['index.html', 'hospedaje.html', 'restaurantes.html', 'guia.html', 'planificar.html', 'panel_guia.php', 'admin_guias.php', 'verificar.php'];
$volver = in_array($_GET['volver'] ?? '', $volverPermitidos, true) ? $_GET['volver'] : '';
$erroresCampo = [];
$correo = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_validar($_POST['csrf_token'] ?? null)) {
        http_response_code(403);
        exit('Token CSRF inválido.');
    }

    $correo = isset($_POST['correo']) && is_string($_POST['correo']) ? trim($_POST['correo']) : '';
    $password = isset($_POST['password']) && is_string($_POST['password']) ? $_POST['password'] : '';
    if (mb_strlen($correo, 'UTF-8') > 150 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $erroresCampo['correo'] = 'Escribe un correo válido de hasta 150 caracteres.';
    }
    if ($password === '') {
        $erroresCampo['password'] = 'Escribe tu contraseña.';
    }

    if (!$erroresCampo) {
        $stmt = $pdo->prepare('SELECT id, nombre, password_hash, rol FROM usuarios WHERE correo = ?');
        $stmt->execute([$correo]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($usuario && password_verify($password, $usuario['password_hash'])) {
            session_regenerate_id(true);   // evita fijación de sesión
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['nombre']     = $usuario['nombre'];
            $_SESSION['rol']        = $usuario['rol'];

            if ($usuario['rol'] === 'guia') {
                $stmt = $pdo->prepare('SELECT id FROM guias WHERE usuario_id = ? LIMIT 1');
                $stmt->execute([$usuario['id']]);
                if ($stmt->fetchColumn() === false) {
                    header('Location: panel_guia.php');
                    exit;
                }
            }

            if ($usuario['rol'] === 'recepcion') {
                header('Location: ../verificar.php');
            } elseif ($volver === 'verificar.php') {
                header('Location: ../verificar.php');
            } elseif (in_array($volver, ['panel_guia.php', 'admin_guias.php'], true)) {
                header('Location: ' . $volver);
            } elseif (in_array($volver, $volverPermitidos, true)) {
                header('Location: ../' . $volver);
            } else {
                header('Location: ../index.html');
            }
            exit;
        }
        $erroresCampo['password'] = 'Correo o contraseña incorrectos.';
    }
}
$csrf = csrf_token();
$nav_texto = 'Crear cuenta';
$nav_href = 'registro.php' . ($volver !== '' ? '?volver=' . rawurlencode($volver) : '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Iniciar sesión - Rutas de Encanto</title>
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
                <h1>Iniciar sesión</h1>
                <p class="sub">Accede para reservar tu próxima experiencia.</p>
                <?php if (($_GET['registro'] ?? '') === 'ok'): ?>
                    <p class="auth-aviso ok" role="status">Cuenta creada. Ya puedes iniciar sesión.</p>
                <?php endif; ?>

                <form method="post" data-validar-form novalidate>
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
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
                        <input id="password" type="password" name="password" placeholder="Escribe tu contraseña" autocomplete="current-password" data-validacion="password-login" required aria-describedby="ayuda-password<?= isset($erroresCampo['password']) ? ' password-error' : '' ?>">
                        <small class="ayuda" id="ayuda-password">Introduce tu contraseña actual; distingue mayúsculas y minúsculas.</small>
                        <?php if (isset($erroresCampo['password'])): ?>
                            <small class="error-campo" id="password-error" role="alert"><?= htmlspecialchars($erroresCampo['password'], ENT_QUOTES, 'UTF-8') ?></small>
                        <?php endif; ?>
                        <button class="btn-secundario btn-sm" type="button" data-toggle-password="password" aria-controls="password" aria-pressed="false">Mostrar contraseña</button>
                    </div>
                    <button class="btn btn-bloque" type="submit">Entrar</button>
                </form>
                <p class="auth-pie">¿No tienes cuenta? <a href="registro.php">Regístrate</a></p>
            </div>
        </section>
    </main>
    <script src="../js/validacion-formularios.js"></script>
    <script src="../js/main.js"></script>
    <script src="../js/accesibilidad.js"></script>
    <script src="../js/sesion.js" data-base="../"></script>
</body>
</html>
