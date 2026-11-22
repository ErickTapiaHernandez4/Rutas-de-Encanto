<?php
// Incluir este archivo al INICIO de cualquier página PHP que use sesión o permisos.
// Reemplaza a session_start().

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,      // JS no puede leer la cookie de sesión
        'samesite' => 'Lax',     // mitiga CSRF básico
        'path'     => '/',
    ]);
    session_start();
}
date_default_timezone_set('America/Mexico_City');

/**
 * Matriz de permisos por rol. Todo lo que no esté aquí se niega.
 * 'admin' tiene '*' (todo).
 */
const PERMISOS = [
    'turista'   => ['reservar', 'ver_guias', 'planificar_viaje'],
    'recepcion' => ['validar_checkin'],
    'guia'      => ['ver_guias', 'editar_mi_perfil_guia'],
    'admin'     => ['*'],
];

function usuario_actual(): ?array {
    if (empty($_SESSION['usuario_id'])) {
        return null;
    }
    return [
        'id'     => (int) $_SESSION['usuario_id'],
        'nombre' => $_SESSION['nombre'] ?? '',
        'rol'    => $_SESSION['rol'] ?? '',
    ];
}

function csrf_token(): string {
    if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token']) || strlen($_SESSION['csrf_token']) !== 64) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_validar($token): bool {
    return is_string($token)
        && isset($_SESSION['csrf_token'])
        && is_string($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function tiene_permiso(string $permiso): bool {
    $u = usuario_actual();
    if (!$u) return false;
    $lista = PERMISOS[$u['rol']] ?? [];
    return in_array('*', $lista, true) || in_array($permiso, $lista, true);
}

/** Para páginas PHP completas: manda al login si no hay sesión, o 403 si no tiene permiso. */
function requerir_permiso(string $permiso): void {
    if (!usuario_actual()) {
        $enPhp = basename(dirname($_SERVER['SCRIPT_NAME'] ?? '')) === 'php';
        $pagina = basename($_SERVER['SCRIPT_NAME'] ?? '');
        $permitidas = ['panel_guia.php', 'admin_guias.php', 'verificar.php'];
        $volver = in_array($pagina, $permitidas, true) ? $pagina : 'verificar.php';
        header('Location: ' . ($enPhp ? 'login.php' : 'php/login.php') . '?volver=' . rawurlencode($volver));
        exit;
    }
    if (!tiene_permiso($permiso)) {
        http_response_code(403);
        exit('No tienes permiso para ver esta página.');
    }
}

/** Para endpoints que responden JSON (fetch desde JS). */
function responder(int $codigo, array $datos): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function requerir_permiso_json(string $permiso): void {
    if (!usuario_actual()) {
        responder(401, ['ok' => false, 'error' => 'Inicia sesión para continuar.']);
    }
    if (!tiene_permiso($permiso)) {
        responder(403, ['ok' => false, 'error' => 'Tu cuenta no tiene permiso para esta acción.']);
    }
}
