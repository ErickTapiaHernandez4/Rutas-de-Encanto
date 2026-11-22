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

$hotelRaw = $_POST['hotel_id'] ?? '';
$llegadaRaw = $_POST['llegada'] ?? '';
$salidaRaw = $_POST['salida'] ?? '';
$huespedesRaw = $_POST['huespedes'] ?? '';
$telefonoRaw = $_POST['telefono'] ?? '';
$hotel_id = is_string($hotelRaw) ? filter_var($hotelRaw, FILTER_VALIDATE_INT) : false;
$llegada = is_string($llegadaRaw) ? $llegadaRaw : '';
$salida = is_string($salidaRaw) ? $salidaRaw : '';
$huespedes = is_string($huespedesRaw) ? filter_var($huespedesRaw, FILTER_VALIDATE_INT) : false;
$telefono = is_string($telefonoRaw) ? $telefonoRaw : '';

$errores = [];

// Fechas reales en formato AAAA-MM-DD
$fLlegada = DateTime::createFromFormat('!Y-m-d', $llegada);
$fSalida  = DateTime::createFromFormat('!Y-m-d', $salida);
$okLlegada = $fLlegada && $fLlegada->format('Y-m-d') === $llegada;
$okSalida  = $fSalida  && $fSalida->format('Y-m-d')  === $salida;

if (!$okLlegada || !$okSalida) {
    if (!$okLlegada) {
        $errores['llegada'] = 'Escribe una fecha de llegada válida.';
    }
    if (!$okSalida) {
        $errores['salida'] = 'Escribe una fecha de salida válida.';
    }
} else {
    $hoy = new DateTime('today');
    if ($fLlegada < $hoy) {
        $errores['llegada'] = 'La llegada no puede ser anterior a hoy.';
    }
    if ($fSalida <= $fLlegada) {
        $errores['salida'] = 'La salida debe ser posterior a la llegada.';
    }
    if ($fLlegada <= $fSalida && $fLlegada->diff($fSalida)->days > 30) {
        $errores['salida'] = 'La estancia máxima es de 30 noches.';
    }
}
if ($huespedes === false || $huespedes < 1 || $huespedes > 10) {
    $errores['huespedes'] = 'El número de huéspedes debe estar entre 1 y 10.';
}
if (!preg_match('/^\d{10}$/', $telefono)) {
    $errores['telefono'] = 'El teléfono debe contener exactamente 10 dígitos, sin espacios ni guiones.';
}
if ($hotel_id === false || $hotel_id < 1) {
    $errores['hotel_id'] = 'Hospedaje no válido.';
} else {
    $stmt = $pdo->prepare('SELECT id FROM hoteles WHERE id = ?');
    $stmt->execute([$hotel_id]);
    if (!$stmt->fetch()) {
        $errores['hotel_id'] = 'El hospedaje no existe.';
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
