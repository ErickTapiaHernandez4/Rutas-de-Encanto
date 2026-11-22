<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';

$idRaw = $_GET['id'] ?? '';
if (!is_string($idRaw) && !is_int($idRaw)) {
    responder(400, ['ok' => false, 'error' => 'El identificador del guía no es válido.']);
}
$id = filter_var((string) $idRaw, FILTER_VALIDATE_INT);
if ($id === false || $id === null || $id < 1) {
    responder(400, ['ok' => false, 'error' => 'El identificador del guía no es válido.']);
}

$stmt = $pdo->prepare(
    'SELECT g.id, g.pueblo_id, g.nombre, g.descripcion, g.actividades, g.precio_aprox,
            p.nombre AS pueblo
     FROM guias g
     INNER JOIN pueblos p ON p.id = g.pueblo_id
     WHERE g.id = ? AND g.activo = 1 AND g.consentimiento_datos = 1'
);
$stmt->execute([$id]);
$guia = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$guia) {
    responder(404, ['ok' => false, 'error' => 'No se encontró el guía solicitado.']);
}

$stmtFotos = $pdo->prepare(
    'SELECT ruta_archivo FROM guia_fotos WHERE guia_id = ? ORDER BY id ASC'
);
$stmtFotos->execute([$id]);
$fotos = $stmtFotos->fetchAll(PDO::FETCH_COLUMN);

$stmtPuntos = $pdo->prepare(
    'SELECT orden, nombre, latitud, longitud
     FROM guia_ruta_puntos
     WHERE guia_id = ?
     ORDER BY orden ASC, id ASC'
);
$stmtPuntos->execute([$id]);
$puntos = $stmtPuntos->fetchAll(PDO::FETCH_ASSOC);

$guia['id'] = (int) $guia['id'];
$guia['pueblo_id'] = (int) $guia['pueblo_id'];
$guia['precio_aprox'] = $guia['precio_aprox'] !== null ? (float) $guia['precio_aprox'] : null;
$guia['fotos'] = $fotos;
$guia['puntos'] = array_map(static function (array $punto): array {
    return [
        'orden' => (int) $punto['orden'],
        'nombre' => $punto['nombre'] ?? '',
        'latitud' => (float) $punto['latitud'],
        'longitud' => (float) $punto['longitud'],
    ];
}, $puntos);

if (usuario_actual() !== null) {
    $stmtContacto = $pdo->prepare('SELECT telefono, correo FROM guias WHERE id = ?');
    $stmtContacto->execute([$id]);
    $contacto = $stmtContacto->fetch(PDO::FETCH_ASSOC);
    if ($contacto) {
        $guia['telefono'] = $contacto['telefono'];
        $guia['correo'] = $contacto['correo'];
    }
}

responder(200, ['ok' => true, 'guia' => $guia]);
