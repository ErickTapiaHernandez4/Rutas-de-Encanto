<?php
session_start();
require __DIR__ . '/conexion.php';

$errores = [];
$nombre = '';
$correo = '';
$volverPermitidos = ['index.html', 'hospedaje.html', 'restaurantes.html', 'guia.html', 'planificar.html'];
$volver = in_array($_GET['volver'] ?? '', $volverPermitidos, true) ? $_GET['volver'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre   = trim($_POST['nombre'] ?? '');
    $correo   = trim($_POST['correo'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($nombre === '' || mb_strlen($nombre) > 100) {
        $errores[] = 'Escribe tu nombre (máximo 100 caracteres).';
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'El correo no es válido.';
    }
    if (strlen($password) < 8) {
        $errores[] = 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (!$errores) {
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE correo = ?');
        $stmt->execute([$correo]);
        if ($stmt->fetch()) {
            $errores[] = 'Ese correo ya está registrado.';
        }
    }

    if (!$errores) {
        // El rol NUNCA viene del formulario: todo registro público es turista.
        $stmt = $pdo->prepare(
            'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, "turista")'
        );
        $stmt->execute([$nombre, $correo, password_hash($password, PASSWORD_DEFAULT)]);
        header('Location: login.php?registro=ok' . ($volver !== '' ? '&volver=' . rawurlencode($volver) : ''));
        exit;
    }
}
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
        <section class="auth-card">
            <h1>Crear cuenta</h1>
            <p class="sub">Únete para organizar tus próximas rutas.</p>
            <?php if ($errores): ?>
                <div class="auth-aviso error" role="alert">
                    <ul>
                        <?php foreach ($errores as $e): ?>
                            <li><?= htmlspecialchars($e, ENT_QUOTES, 'UTF-8') ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <form method="post">
                <div class="campo">
                    <label for="nombre">Nombre</label>
                    <input id="nombre" type="text" name="nombre" value="<?= htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') ?>" autocomplete="name" required>
                </div>
                <div class="campo">
                    <label for="correo">Correo</label>
                    <input id="correo" type="email" name="correo" value="<?= htmlspecialchars($correo, ENT_QUOTES, 'UTF-8') ?>" autocomplete="email" required>
                </div>
                <div class="campo">
                    <label for="password">Contraseña (mínimo 8 caracteres)</label>
                    <input id="password" type="password" name="password" autocomplete="new-password" required>
                </div>
                <button class="btn btn-bloque" type="submit">Registrarme</button>
            </form>
            <p class="auth-pie">¿Ya tienes cuenta? <a href="login.php">Inicia sesión</a></p>
        </section>
    </main>
    <script src="../js/main.js"></script>
    <script src="../js/accesibilidad.js"></script>
    <script src="../js/sesion.js" data-base="../"></script>
</body>
</html>
