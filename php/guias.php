<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';

$puebloId = null;
$puebloRaw = $_GET['pueblo_id'] ?? '';
if ($puebloRaw !== '') {
    if (!is_string($puebloRaw) && !is_int($puebloRaw)) {
        responder(400, ['ok' => false, 'error' => 'El pueblo no es válido.']);
    }
    $puebloId = filter_var((string) $puebloRaw, FILTER_VALIDATE_INT);
    if ($puebloId === false || $puebloId < 1) {
        responder(400, ['ok' => false, 'error' => 'El pueblo no es válido.']);
    }
}

$actividad = $_GET['actividad'] ?? '';
if (!is_string($actividad) || mb_strlen($actividad, 'UTF-8') > 100) {
    responder(400, ['ok' => false, 'error' => 'La actividad no es válida.']);
}
$actividad = trim($actividad);

$sql = "
    SELECT g.id, g.pueblo_id, g.nombre, g.descripcion, g.actividades,
           g.precio_aprox, p.nombre AS pueblo,
           (
               SELECT gf.ruta_archivo
               FROM guia_fotos gf
               WHERE gf.guia_id = g.id
               ORDER BY gf.id ASC
               LIMIT 1
           ) AS foto
    FROM guias g
    INNER JOIN pueblos p ON p.id = g.pueblo_id
    WHERE g.activo = 1 AND g.consentimiento_datos = 1
";
$parametros = [];

if ($puebloId !== null) {
    $sql .= ' AND g.pueblo_id = ?';
    $parametros[] = $puebloId;
}
if ($actividad !== '') {
    $sql .= ' AND g.actividades LIKE ?';
    $parametros[] = '%' . $actividad . '%';
}
$sql .= ' ORDER BY g.id ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($parametros);
$guias = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($guias as &$guia) {
    $descripcion = $guia['descripcion'] ?? '';
    $guia['descripcion'] = mb_strlen($descripcion, 'UTF-8') > 180
        ? mb_substr($descripcion, 0, 177, 'UTF-8') . '...'
        : $descripcion;
    $guia['id'] = (int) $guia['id'];
    $guia['pueblo_id'] = (int) $guia['pueblo_id'];
    $guia['precio_aprox'] = $guia['precio_aprox'] !== null ? (float) $guia['precio_aprox'] : null;
}
unset($guia);

responder(200, ['ok' => true, 'guias' => $guias]);
