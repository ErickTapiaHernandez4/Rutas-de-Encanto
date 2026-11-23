<?php
// API pública de restaurantes (solo lectura, sin login). La usa js/restaurantes.js
//   GET php/restaurantes.php          → lista de restaurantes activos
//   GET php/restaurantes.php?id=3     → un restaurante con su menú completo
// Los datos se capturan en phpMyAdmin (tablas restaurantes y restaurante_menu).
require __DIR__ . '/auth.php';      // solo por responder(); no pide sesión
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

/* Convierte "wifi, terraza" en ['wifi', 'terraza'] */
function rest_lista_caracteristicas(?string $texto): array {
    if ($texto === null || trim($texto) === '') return [];
    return array_values(array_filter(array_map(
        fn($c) => mb_strtolower(trim($c), 'UTF-8'),
        explode(',', $texto)
    )));
}

/* Solo deja pasar enlaces http(s) para redes sociales */
function rest_url_segura(?string $url): ?string {
    if (!$url) return null;
    return preg_match('#\Ahttps?://#i', $url) ? $url : null;
}

function rest_formatear(array $r): array {
    $r['id'] = (int) $r['id'];
    $r['caracteristicas'] = rest_lista_caracteristicas($r['caracteristicas']);
    $r['whatsapp'] = $r['whatsapp'] ? preg_replace('/\D/', '', $r['whatsapp']) : null;
    $r['facebook'] = rest_url_segura($r['facebook']);
    $r['instagram'] = rest_url_segura($r['instagram']);
    return $r;
}

$columnas = 'id, nombre, pueblo, descripcion, foto, direccion, horario, telefono,
             whatsapp, correo, facebook, instagram, caracteristicas';

try {
    /* ---------- Un restaurante con su menú ---------- */
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT $columnas FROM restaurantes WHERE id = ? AND activo = 1");
        $stmt->execute([(int) $_GET['id']]);
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$r) responder(404, ['ok' => false, 'error' => 'Restaurante no encontrado.']);

        $stmt = $pdo->prepare(
            'SELECT seccion, platillo, descripcion, precio
             FROM restaurante_menu WHERE restaurante_id = ? ORDER BY orden, id'
        );
        $stmt->execute([$r['id']]);

        // Agrupa el menú por sección conservando el orden
        $menu = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
            $menu[$p['seccion']][] = [
                'platillo' => $p['platillo'],
                'descripcion' => $p['descripcion'],
                'precio' => $p['precio'] !== null ? (float) $p['precio'] : null,
            ];
        }
        $r = rest_formatear($r);
        $r['menu'] = array_map(fn($s, $platillos) => ['seccion' => $s, 'platillos' => $platillos],
                               array_keys($menu), $menu);

        responder(200, ['ok' => true, 'restaurante' => $r]);
    }

    /* ---------- Lista ---------- */
    $lista = $pdo->query(
        "SELECT $columnas FROM restaurantes WHERE activo = 1 ORDER BY orden, nombre"
    )->fetchAll(PDO::FETCH_ASSOC);
    $lista = array_map('rest_formatear', $lista);

    $pueblos = array_values(array_unique(array_column($lista, 'pueblo')));
    sort($pueblos);

    responder(200, ['ok' => true, 'total' => count($lista), 'pueblos' => $pueblos, 'restaurantes' => $lista]);
} catch (PDOException $e) {
    responder(500, ['ok' => false, 'error' => 'No se pudieron cargar los restaurantes. ¿Importaste database/restaurantes.sql?']);
}