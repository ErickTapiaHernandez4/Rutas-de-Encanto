<?php
// Recibe la reservación (POST) y valida TODO en el servidor.
// Las validaciones del navegador se pueden saltar; estas no.
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

requerir_permiso_json('reservar');       // 401 si no hay sesión, 403 si el rol no puede
$usuario = usuario_actual();

$hotel_id   = filter_var($_POST['hotel_id'] ?? '', FILTER_VALIDATE_INT);
$llegada    = $_POST['llegada'] ?? '';
$salida     = $_POST['salida'] ?? '';
$huespedes  = filter_var($_POST['huespedes'] ?? '', FILTER_VALIDATE_INT);
$telefono   = preg_replace('/\D/', '', $_POST['telefono'] ?? '');

$errores = [];

// Fechas reales en formato AAAA-MM-DD
$fLlegada = DateTime::createFromFormat('!Y-m-d', $llegada);
$fSalida  = DateTime::createFromFormat('!Y-m-d', $salida);
$okLlegada = $fLlegada && $fLlegada->format('Y-m-d') === $llegada;
$okSalida  = $fSalida  && $fSalida->format('Y-m-d')  === $salida;

if (!$okLlegada || !$okSalida) {
    $errores[] = 'Las fechas no son válidas.';
} else {
    $hoy = new DateTime('today');
    if ($fLlegada < $hoy) {
        $errores[] = 'La llegada no puede ser anterior a hoy.';
    }
    if ($fSalida <= $fLlegada) {
        $errores[] = 'La salida debe ser después de la llegada.';
    }
    if ($fLlegada <= $fSalida && $fLlegada->diff($fSalida)->days > 30) {
        $errores[] = 'La estancia máxima es de 30 noches.';
    }
}
if ($huespedes === false || $huespedes < 1 || $huespedes > 10) {
    $errores[] = 'El número de huéspedes debe estar entre 1 y 10.';
}
if (!preg_match('/^\d{10}$/', $telefono)) {
    $errores[] = 'El teléfono debe tener 10 dígitos.';
}
if ($hotel_id === false || $hotel_id < 1) {
    $errores[] = 'Hospedaje no válido.';
} else {
    $stmt = $pdo->prepare('SELECT id FROM hoteles WHERE id = ?');
    $stmt->execute([$hotel_id]);
    if (!$stmt->fetch()) {
        $errores[] = 'El hospedaje no existe.';
    }
}

if ($errores) {
    responder(422, ['ok' => false, 'errores' => $errores]);
}

// El nombre y el usuario salen de la SESIÓN, nunca del formulario.
$stmt = $pdo->prepare(
    'INSERT INTO reservaciones (usuario_id, hotel_id, fecha_entrada, fecha_salida, huespedes, telefono)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$usuario['id'], $hotel_id, $llegada, $salida, $huespedes, $telefono]);

responder(201, [
    'ok' => true,
    'reservacion_id' => (int) $pdo->lastInsertId(),
    'nombre' => $usuario['nombre'],
]);
