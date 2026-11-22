<?php
// Lo consulta js/sesion.js para saber si hay alguien con sesión iniciada.
require __DIR__ . '/auth.php';

$u = usuario_actual();
responder(200, [
    'logueado' => (bool) $u,
    'nombre'   => $u['nombre'] ?? null,
    'rol'      => $u['rol'] ?? null,
    'permisos' => $u ? (PERMISOS[$u['rol']] ?? []) : [],
]);
