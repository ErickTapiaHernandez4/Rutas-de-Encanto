<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';

$volverPermitidos = ['index.html', 'hospedaje.html', 'restaurantes.html', 'guia.html', 'planificar.html', 'panel_guia.php', 'admin_guias.php', 'verificar.php'];
$volver = in_array($_GET['volver'] ?? '', $volverPermitidos, true) ? $_GET['volver'] : '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correo   = trim($_POST['correo'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare('SELECT id, nombre, password_hash, rol FROM usuarios WHERE correo = ?');
    $stmt->execute([$correo]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario && password_verify($password, $usuario['password_hash'])) {
        session_regenerate_id(true);   // evita fijación de sesión
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['nombre']     = $usuario['nombre'];
        $_SESSION['rol']        = $usuario['rol'];
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
    // Mismo mensaje si falla el correo o la contraseña
    $error = 'Correo o contraseña incorrectos.';
}
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
        <section class="auth-card">
            <h1>Iniciar sesión</h1>
            <p class="sub">Accede para reservar tu próxima experiencia.</p>
            <?php if (($_GET['registro'] ?? '') === 'ok'): ?>
                <p class="auth-aviso ok" role="status">Cuenta creada. Ya puedes iniciar sesión.</p>
            <?php endif; ?>
            <?php if ($error): ?>
                <p class="auth-aviso error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
            <?php endif; ?>

            <form method="post">
                <div class="campo">
                    <label for="correo">Correo</label>
                    <input id="correo" type="email" name="correo" autocomplete="email" required>
                </div>
                <div class="campo">
                    <label for="password">Contraseña</label>
                    <input id="password" type="password" name="password" autocomplete="current-password" required>
                </div>
                <button class="btn btn-bloque" type="submit">Entrar</button>
            </form>
            <p class="auth-pie">¿No tienes cuenta? <a href="registro.php">Regístrate</a></p>
        </section>
    </main>
    <script src="../js/main.js"></script>
    <script src="../js/accesibilidad.js"></script>
    <script src="../js/sesion.js" data-base="../"></script>
</body>
</html>
