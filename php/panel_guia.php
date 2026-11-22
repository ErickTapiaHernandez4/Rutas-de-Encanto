<?php
require __DIR__ . '/auth.php';
require __DIR__ . '/conexion.php';
requerir_permiso('editar_mi_perfil_guia');

function panel_h($valor): string {
    return htmlspecialchars((string) $valor, ENT_QUOTES, 'UTF-8');
}

function panel_ruta_foto($ruta): ?string {
    if (!is_string($ruta)
        || strpos($ruta, '..') !== false
        || !preg_match('#^img/[a-z0-9/_-]+\.(?:jpg|jpeg|png|webp)$#iD', $ruta)) {
        return null;
    }
    return $ruta;
}

function panel_archivo_foto_subida($ruta): ?string {
    if (!is_string($ruta) || !preg_match('#^img/guias/[a-f0-9]{32}\.(?:jpg|png|webp)$#iD', $ruta)) {
        return null;
    }
    $directorio = realpath(__DIR__ . '/../img/guias');
    $archivo = realpath(__DIR__ . '/../' . $ruta);
    if ($directorio === false || $archivo === false
        || strpos($archivo, $directorio . DIRECTORY_SEPARATOR) !== 0) {
        return null;
    }
    return $archivo;
}

function panel_eliminar_archivo_foto($ruta): bool {
    $archivo = panel_archivo_foto_subida($ruta);
    return $archivo === null || !is_file($archivo) || unlink($archivo);
}

$usuario = usuario_actual();
$esAdmin = $usuario['rol'] === 'admin';
$errores = [];
$mensaje = '';
$perfil = null;
$perfilSeleccionadoPorId = false;
$usuarioDestinoId = $esAdmin ? null : $usuario['id'];
$guiaIdSeleccionado = null;

if ($esAdmin && isset($_GET['guia_id'])) {
    $idRaw = $_GET['guia_id'];
    $id = is_string($idRaw) ? filter_var($idRaw, FILTER_VALIDATE_INT) : false;
    if ($id === false || $id < 1) {
        $errores[] = 'El perfil seleccionado no es válido.';
    } else {
        $guiaIdSeleccionado = $id;
        $perfilSeleccionadoPorId = true;
        $stmt = $pdo->prepare(
            'SELECT g.*, p.nombre AS pueblo
             FROM guias g INNER JOIN pueblos p ON p.id = g.pueblo_id
             WHERE g.id = ?'
        );
        $stmt->execute([$id]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if (!$perfil) {
            $errores[] = 'No se encontró el perfil seleccionado.';
        } else {
            $usuarioDestinoId = $perfil['usuario_id'] !== null ? (int) $perfil['usuario_id'] : null;
        }
    }
} elseif ($esAdmin && isset($_GET['usuario_id'])) {
    $idRaw = $_GET['usuario_id'];
    $id = is_string($idRaw) ? filter_var($idRaw, FILTER_VALIDATE_INT) : false;
    if ($id === false || $id < 1) {
        $errores[] = 'La cuenta seleccionada no es válida.';
    } else {
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE id = ? AND rol = 'guia'");
        $stmt->execute([$id]);
        $usuarioDestinoId = $stmt->fetchColumn();
        if ($usuarioDestinoId === false) {
            $usuarioDestinoId = null;
            $errores[] = 'La cuenta seleccionada no tiene el rol de guía.';
        } else {
            $usuarioDestinoId = (int) $usuarioDestinoId;
        }
    }
}

if (!$esAdmin || ($usuarioDestinoId !== null && !$perfilSeleccionadoPorId)) {
    $stmt = $pdo->prepare(
        'SELECT g.*, p.nombre AS pueblo
         FROM guias g INNER JOIN pueblos p ON p.id = g.pueblo_id
         WHERE g.usuario_id = ?
         ORDER BY g.id ASC
         LIMIT 1'
    );
    $stmt->execute([$usuarioDestinoId]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

$pueblosStmt = $pdo->prepare('SELECT id, nombre FROM pueblos ORDER BY nombre');
$pueblosStmt->execute();
$pueblos = $pueblosStmt->fetchAll(PDO::FETCH_ASSOC);

$actividadesDisponibles = [
    'senderismo' => 'Senderismo',
    'naturaleza' => 'Naturaleza',
    'historia' => 'Historia',
    'cultura' => 'Cultura',
    'gastronomia' => 'Gastronomía',
    'haciendas' => 'Haciendas',
    'escalada' => 'Escalada',
    'fotografia' => 'Fotografía',
    'mineria' => 'Minería',
    'rutas' => 'Rutas culturales',
];

$cuentaNombre = '';
$cuentaCorreo = '';
if ($usuarioDestinoId !== null) {
    $stmt = $pdo->prepare('SELECT nombre, correo FROM usuarios WHERE id = ?');
    $stmt->execute([$usuarioDestinoId]);
    $cuenta = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $cuentaNombre = (string) ($cuenta['nombre'] ?? '');
    $cuentaCorreo = (string) ($cuenta['correo'] ?? '');
}

$formulario = [
    'nombre' => $perfil['nombre'] ?? ($usuarioDestinoId !== null ? $cuentaNombre : ''),
    'pueblo_id' => $perfil['pueblo_id'] ?? '',
    'telefono' => $perfil['telefono'] ?? '',
    'correo' => $perfil['correo'] ?? $cuentaCorreo,
    'descripcion' => $perfil['descripcion'] ?? '',
    'precio_aprox' => $perfil['precio_aprox'] ?? '',
    'actividades' => $perfil && $perfil['actividades'] !== null
        ? array_values(array_filter(array_map('trim', explode(',', $perfil['actividades']))))
        : [],
];
$consentimientoMarcado = $perfil ? (int) $perfil['consentimiento_datos'] === 1 : false;

if (($_GET['guardado'] ?? '') === 'publico') {
    $mensaje = 'Perfil guardado con consentimiento para publicarlo.';
} elseif (($_GET['guardado'] ?? '') === 'privado') {
    $mensaje = 'Perfil guardado sin consentimiento. Se mantendrá inactivo y no aparecerá en el sitio público.';
} elseif (($_GET['eliminado'] ?? '') === '1') {
    $mensaje = 'El perfil y sus datos fueron eliminados.';
}

$contexto = [];
if ($esAdmin && $perfilSeleccionadoPorId && $guiaIdSeleccionado !== null) {
    $contexto['guia_id'] = $guiaIdSeleccionado;
} elseif ($esAdmin && $usuarioDestinoId !== null) {
    $contexto['usuario_id'] = $usuarioDestinoId;
}
$queryContexto = $contexto ? '?' . http_build_query($contexto) : '';
$actionUrl = 'panel_guia.php' . $queryContexto;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_validar($_POST['csrf_token'] ?? null)) {
        http_response_code(403);
        exit('Token CSRF inválido.');
    }

    $accion = $_POST['accion'] ?? '';
    if (!is_string($accion)) {
        $errores[] = 'La acción solicitada no es válida.';
    } elseif ($accion === 'guardar_perfil') {
        foreach (['nombre', 'telefono', 'correo', 'descripcion', 'precio_aprox'] as $campo) {
            if (!isset($_POST[$campo]) || !is_string($_POST[$campo])) {
                $_POST[$campo] = '';
            }
        }
        $formulario['nombre'] = trim($_POST['nombre']);
        $formulario['pueblo_id'] = isset($_POST['pueblo_id']) && is_string($_POST['pueblo_id'])
            ? $_POST['pueblo_id']
            : '';
        $formulario['telefono'] = trim($_POST['telefono']);
        $formulario['correo'] = trim($_POST['correo']);
        $formulario['descripcion'] = trim($_POST['descripcion']);
        $formulario['precio_aprox'] = trim($_POST['precio_aprox']);
        $consentimientoMarcado = ($_POST['consentimiento_datos'] ?? '') === '1';

        $actividadesEnviadas = $_POST['actividades'] ?? [];
        if (!is_array($actividadesEnviadas)) {
            $actividadesEnviadas = [];
            $errores[] = 'Las actividades seleccionadas no son válidas.';
        }
        foreach ($actividadesEnviadas as $actividad) {
            if (!is_string($actividad) || !array_key_exists($actividad, $actividadesDisponibles)) {
                $errores[] = 'La lista de actividades contiene una opción no válida.';
                break;
            }
        }
        $actividadesSeleccionadas = array_values(array_unique(array_filter(
            $actividadesEnviadas,
            static function ($actividad) use ($actividadesDisponibles): bool {
                return is_string($actividad) && array_key_exists($actividad, $actividadesDisponibles);
            }
        )));
        $formulario['actividades'] = $actividadesSeleccionadas;

        $puebloRaw = $formulario['pueblo_id'];
        $puebloId = is_string($puebloRaw) ? filter_var($puebloRaw, FILTER_VALIDATE_INT) : false;
        if ($formulario['nombre'] === '' || mb_strlen($formulario['nombre'], 'UTF-8') > 120) {
            $errores[] = 'El nombre es obligatorio y debe tener máximo 120 caracteres.';
        }
        if ($puebloId === false || $puebloId < 1) {
            $errores[] = 'Selecciona un pueblo válido.';
        } else {
            $stmt = $pdo->prepare('SELECT id FROM pueblos WHERE id = ?');
            $stmt->execute([$puebloId]);
            if (!$stmt->fetchColumn()) {
                $errores[] = 'El pueblo seleccionado no existe.';
            }
        }
        if (!preg_match('/^\d{10}$/', $formulario['telefono'])) {
            $errores[] = 'El teléfono debe contener exactamente 10 dígitos.';
        }
        if (mb_strlen($formulario['correo'], 'UTF-8') > 150
            || !filter_var($formulario['correo'], FILTER_VALIDATE_EMAIL)) {
            $errores[] = 'Escribe un correo electrónico válido.';
        }
        if (mb_strlen($formulario['descripcion'], 'UTF-8') > 1000) {
            $errores[] = 'La descripción no puede superar 1000 caracteres.';
        }
        if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $formulario['precio_aprox'])
            || (float) $formulario['precio_aprox'] > 99999999.99) {
            $errores[] = 'El precio aproximado debe ser un número mayor o igual a cero.';
        }
        if ($usuarioDestinoId === null) {
            $errores[] = 'Selecciona una cuenta de guía antes de guardar el perfil.';
        }

        if (!$errores) {
            $consentimiento = $consentimientoMarcado ? 1 : 0;
            $activoActual = $perfil ? (int) $perfil['activo'] : 0;
            $consentimientoAnterior = $perfil ? (int) $perfil['consentimiento_datos'] : 0;
            $activo = $consentimiento === 0
                ? 0
                : (!$perfil || $consentimientoAnterior === 0 ? 1 : $activoActual);
            $actividadesTexto = implode(',', $actividadesSeleccionadas);
            $precio = number_format((float) $formulario['precio_aprox'], 2, '.', '');

            if ($perfil) {
                if ($esAdmin && $perfilSeleccionadoPorId) {
                    $stmt = $pdo->prepare(
                        'UPDATE guias
                         SET nombre = ?, pueblo_id = ?, telefono = ?, correo = ?, descripcion = ?,
                             actividades = ?, precio_aprox = ?, consentimiento_datos = ?,
                             consentimiento_fecha = IF(? = 1, NOW(), NULL), activo = ?
                         WHERE id = ?'
                    );
                    $stmt->execute([
                        $formulario['nombre'], $puebloId, $formulario['telefono'], $formulario['correo'],
                        $formulario['descripcion'], $actividadesTexto, $precio, $consentimiento,
                        $consentimiento, $activo, (int) $perfil['id'],
                    ]);
                } else {
                    $stmt = $pdo->prepare(
                        'UPDATE guias
                         SET nombre = ?, pueblo_id = ?, telefono = ?, correo = ?, descripcion = ?,
                             actividades = ?, precio_aprox = ?, consentimiento_datos = ?,
                             consentimiento_fecha = IF(? = 1, NOW(), NULL), activo = ?
                         WHERE usuario_id = ?
                         ORDER BY id ASC
                         LIMIT 1'
                    );
                    $stmt->execute([
                        $formulario['nombre'], $puebloId, $formulario['telefono'], $formulario['correo'],
                        $formulario['descripcion'], $actividadesTexto, $precio, $consentimiento,
                        $consentimiento, $activo, $usuarioDestinoId,
                    ]);
                }
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO guias (
                        usuario_id, pueblo_id, nombre, telefono, correo, descripcion, actividades,
                        precio_aprox, consentimiento_datos, consentimiento_fecha, activo
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 1, NOW(), NULL), ?)'
                );
                $stmt->execute([
                    $usuarioDestinoId, $puebloId, $formulario['nombre'], $formulario['telefono'],
                    $formulario['correo'], $formulario['descripcion'], $actividadesTexto, $precio,
                    $consentimiento, $consentimiento, $activo,
                ]);
            }

            $estadoGuardado = $consentimiento ? 'publico' : 'privado';
            $separador = $queryContexto ? '&' : '?';
            header('Location: ' . $actionUrl . $separador . 'guardado=' . $estadoGuardado);
            exit;
        }
    } elseif ($accion === 'subir_fotos') {
        if (!$perfil) {
            $errores[] = 'Guarda primero el perfil para poder agregar fotos.';
        } elseif (!isset($_FILES['fotos'])
            || !is_array($_FILES['fotos']['error'] ?? null)
            || !is_array($_FILES['fotos']['tmp_name'] ?? null)) {
            $errores[] = 'Selecciona al menos una foto.';
        } else {
            $archivos = $_FILES['fotos'];
            $pendientes = [];
            $mimeExtensiones = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM guia_fotos WHERE guia_id = ?');
            $stmt->execute([(int) $perfil['id']]);
            $existentes = (int) $stmt->fetchColumn();
            $limiteRestante = max(0, 5 - $existentes);
            $indicesSeleccionados = [];

            foreach ($archivos['error'] as $indice => $codigoError) {
                if ($codigoError !== UPLOAD_ERR_NO_FILE) {
                    $indicesSeleccionados[] = $indice;
                }
            }
            if (!$indicesSeleccionados) {
                $errores[] = 'Selecciona al menos una foto.';
            } elseif (count($indicesSeleccionados) > $limiteRestante) {
                $errores[] = 'Cada perfil puede tener un máximo de 5 fotos.';
            }

            if (!$errores) {
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                foreach ($indicesSeleccionados as $indice) {
                    $codigoError = $archivos['error'][$indice];
                    if ($codigoError !== UPLOAD_ERR_OK) {
                        $errores[] = 'La foto ' . ((int) $indice + 1) . ' no se recibió correctamente.';
                        continue;
                    }
                    $temporal = $archivos['tmp_name'][$indice] ?? '';
                    $tamano = is_string($temporal) && is_file($temporal) ? filesize($temporal) : false;
                    if (!is_string($temporal) || !is_uploaded_file($temporal)
                        || $tamano === false || $tamano < 1 || $tamano > 2 * 1024 * 1024) {
                        $errores[] = 'Cada foto debe pesar como máximo 2 MB.';
                        continue;
                    }
                    $mime = $finfo->file($temporal);
                    $imagen = @getimagesize($temporal);
                    if (!is_string($mime) || !isset($mimeExtensiones[$mime])
                        || !$imagen || ($imagen['mime'] ?? '') !== $mime) {
                        $errores[] = 'Solo se aceptan imágenes JPEG, PNG o WebP válidas.';
                        continue;
                    }
                    $pendientes[] = ['temporal' => $temporal, 'extension' => $mimeExtensiones[$mime]];
                }
            }

            if (!$errores && $pendientes) {
                $directorio = __DIR__ . '/../img/guias';
                if (!is_dir($directorio) && !mkdir($directorio, 0755, true) && !is_dir($directorio)) {
                    $errores[] = 'No se pudo preparar la carpeta de fotos.';
                } else {
                    $rutasMovidas = [];
                    foreach ($pendientes as $pendiente) {
                        $nombreArchivo = bin2hex(random_bytes(16)) . '.' . $pendiente['extension'];
                        $destino = $directorio . DIRECTORY_SEPARATOR . $nombreArchivo;
                        if (!move_uploaded_file($pendiente['temporal'], $destino)) {
                            $errores[] = 'No se pudo guardar una de las fotos seleccionadas.';
                            break;
                        }
                        $rutasMovidas[] = ['archivo' => $destino, 'ruta' => 'img/guias/' . $nombreArchivo];
                    }

                    if (!$errores) {
                        $pdo->beginTransaction();
                        try {
                            $stmt = $pdo->prepare('INSERT INTO guia_fotos (guia_id, ruta_archivo) VALUES (?, ?)');
                            foreach ($rutasMovidas as $foto) {
                                $stmt->execute([(int) $perfil['id'], $foto['ruta']]);
                            }
                            $pdo->commit();
                        } catch (PDOException $e) {
                            if ($pdo->inTransaction()) {
                                $pdo->rollBack();
                            }
                            foreach ($rutasMovidas as $foto) {
                                if (is_file($foto['archivo']) && !unlink($foto['archivo'])) {
                                    error_log('No se pudo limpiar una foto después de fallar su registro.');
                                }
                            }
                            throw $e;
                        }
                        $separador = $queryContexto ? '&' : '?';
                        header('Location: ' . $actionUrl . $separador . 'fotos=ok');
                        exit;
                    }
                    foreach ($rutasMovidas as $foto) {
                        if (is_file($foto['archivo']) && !unlink($foto['archivo'])) {
                            error_log('No se pudo limpiar una foto después de fallar su subida.');
                        }
                    }
                }
            }
        }
    } elseif ($accion === 'eliminar_foto') {
        if (!$perfil) {
            $errores[] = 'No hay un perfil seleccionado.';
        } else {
            $fotoRaw = $_POST['foto_id'] ?? '';
            $fotoId = is_string($fotoRaw) ? filter_var($fotoRaw, FILTER_VALIDATE_INT) : false;
            if ($fotoId === false || $fotoId < 1) {
                $errores[] = 'La foto seleccionada no es válida.';
            } else {
                $stmt = $pdo->prepare('SELECT ruta_archivo FROM guia_fotos WHERE id = ? AND guia_id = ?');
                $stmt->execute([$fotoId, (int) $perfil['id']]);
                $rutaFoto = $stmt->fetchColumn();
                if ($rutaFoto === false) {
                    $errores[] = 'No se encontró esa foto en este perfil.';
                } elseif (!panel_eliminar_archivo_foto($rutaFoto)) {
                    $errores[] = 'No se pudo borrar el archivo de la foto. No se eliminó su registro.';
                } else {
                    $stmt = $pdo->prepare('DELETE FROM guia_fotos WHERE id = ? AND guia_id = ?');
                    $stmt->execute([$fotoId, (int) $perfil['id']]);
                    $separador = $queryContexto ? '&' : '?';
                    header('Location: ' . $actionUrl . $separador . 'fotos=eliminada');
                    exit;
                }
            }
        }
    } elseif ($accion === 'guardar_ruta') {
        if (!$perfil) {
            $errores[] = 'Guarda primero el perfil para poder agregar una ruta.';
        } else {
            $jsonPuntos = $_POST['puntos_json'] ?? '';
            $puntosEnviados = is_string($jsonPuntos) ? json_decode($jsonPuntos, true) : null;
            if (!is_array($puntosEnviados) || json_last_error() !== JSON_ERROR_NONE) {
                $errores[] = 'Los puntos de la ruta no tienen un formato válido.';
            } elseif (count($puntosEnviados) > 15) {
                $errores[] = 'La ruta puede tener como máximo 15 puntos.';
            } else {
                $puntosValidos = [];
                foreach (array_values($puntosEnviados) as $indice => $punto) {
                    if (!is_array($punto)) {
                        $errores[] = 'El punto ' . ($indice + 1) . ' no es válido.';
                        break;
                    }
                    $nombrePunto = isset($punto['nombre']) && is_string($punto['nombre'])
                        ? trim($punto['nombre'])
                        : '';
                    $latitudRaw = $punto['latitud'] ?? null;
                    $longitudRaw = $punto['longitud'] ?? null;
                    if ($nombrePunto === '' || mb_strlen($nombrePunto, 'UTF-8') > 120
                        || !is_numeric($latitudRaw) || !is_numeric($longitudRaw)) {
                        $errores[] = 'Completa el nombre y las coordenadas del punto ' . ($indice + 1) . '.';
                        break;
                    }
                    $latitud = (float) $latitudRaw;
                    $longitud = (float) $longitudRaw;
                    if (!is_finite($latitud) || !is_finite($longitud)
                        || $latitud < -90 || $latitud > 90 || $longitud < -180 || $longitud > 180) {
                        $errores[] = 'Las coordenadas del punto ' . ($indice + 1) . ' están fuera del rango válido.';
                        break;
                    }
                    $puntosValidos[] = [
                        'nombre' => $nombrePunto,
                        'latitud' => number_format($latitud, 6, '.', ''),
                        'longitud' => number_format($longitud, 6, '.', ''),
                    ];
                }
                if (!$errores) {
                    $pdo->beginTransaction();
                    $stmt = $pdo->prepare('DELETE FROM guia_ruta_puntos WHERE guia_id = ?');
                    $stmt->execute([(int) $perfil['id']]);
                    $stmt = $pdo->prepare(
                        'INSERT INTO guia_ruta_puntos (guia_id, orden, nombre, latitud, longitud)
                         VALUES (?, ?, ?, ?, ?)'
                    );
                    foreach ($puntosValidos as $indice => $punto) {
                        $stmt->execute([
                            (int) $perfil['id'], $indice + 1, $punto['nombre'],
                            $punto['latitud'], $punto['longitud'],
                        ]);
                    }
                    $pdo->commit();
                    $separador = $queryContexto ? '&' : '?';
                    header('Location: ' . $actionUrl . $separador . 'ruta=guardada');
                    exit;
                }
            }
        }
    } elseif ($accion === 'eliminar_perfil') {
        if (!$perfil) {
            $errores[] = 'No hay un perfil para eliminar.';
        } elseif ($esAdmin && (int) ($perfil['usuario_id'] ?? 0) !== (int) $usuario['id']) {
            $errores[] = 'Desde este panel solo puedes eliminar tu propio perfil.';
        } else {
            if ($esAdmin && $perfilSeleccionadoPorId) {
                $idsPerfil = [(int) $perfil['id']];
            } else {
                $stmt = $pdo->prepare('SELECT id FROM guias WHERE usuario_id = ?');
                $stmt->execute([$usuarioDestinoId]);
                $idsPerfil = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
            }
            $rutasParaBorrar = [];
            $stmtFotos = $pdo->prepare('SELECT ruta_archivo FROM guia_fotos WHERE guia_id = ?');
            foreach ($idsPerfil as $idPerfil) {
                $stmtFotos->execute([$idPerfil]);
                $rutasParaBorrar = array_merge($rutasParaBorrar, $stmtFotos->fetchAll(PDO::FETCH_COLUMN));
            }
            $pdo->beginTransaction();
            $stmtFotosBorrar = $pdo->prepare('DELETE FROM guia_fotos WHERE guia_id = ?');
            $stmtRutaBorrar = $pdo->prepare('DELETE FROM guia_ruta_puntos WHERE guia_id = ?');
            foreach ($idsPerfil as $idPerfil) {
                $stmtFotosBorrar->execute([$idPerfil]);
                $stmtRutaBorrar->execute([$idPerfil]);
            }
            if ($esAdmin && $perfilSeleccionadoPorId) {
                $stmt = $pdo->prepare('DELETE FROM guias WHERE id = ?');
                $stmt->execute([(int) $perfil['id']]);
            } else {
                $stmt = $pdo->prepare('DELETE FROM guias WHERE usuario_id = ?');
                $stmt->execute([$usuarioDestinoId]);
            }
            $pdo->commit();

            $fallosArchivo = false;
            foreach ($rutasParaBorrar as $ruta) {
                if (!panel_eliminar_archivo_foto($ruta)) {
                    $fallosArchivo = true;
                }
            }
            if ($fallosArchivo) {
                $errores[] = 'El perfil y sus registros fueron eliminados, pero no se pudo borrar al menos un archivo de foto.';
                $perfil = null;
            } else {
                header('Location: panel_guia.php?eliminado=1');
                exit;
            }
        }
    } else {
        $errores[] = 'La acción solicitada no es válida.';
    }
}

if (($_GET['fotos'] ?? '') === 'ok') {
    $mensaje = 'Las fotos se guardaron correctamente.';
} elseif (($_GET['fotos'] ?? '') === 'eliminada') {
    $mensaje = 'La foto fue eliminada.';
} elseif (($_GET['ruta'] ?? '') === 'guardada') {
    $mensaje = 'La ruta fue guardada.';
}

$fotosPerfil = [];
$puntosRuta = [];
if ($perfil) {
    $stmt = $pdo->prepare('SELECT id, ruta_archivo FROM guia_fotos WHERE guia_id = ? ORDER BY id ASC');
    $stmt->execute([(int) $perfil['id']]);
    $fotosPerfil = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare(
        'SELECT orden, nombre, latitud, longitud
         FROM guia_ruta_puntos WHERE guia_id = ? ORDER BY orden ASC, id ASC'
    );
    $stmt->execute([(int) $perfil['id']]);
    $puntosRuta = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$listaPerfiles = [];
$cuentasGuia = [];
if ($esAdmin) {
    $stmt = $pdo->prepare(
        'SELECT g.id, g.nombre, p.nombre AS pueblo, g.usuario_id
         FROM guias g INNER JOIN pueblos p ON p.id = g.pueblo_id
         ORDER BY g.nombre, g.id'
    );
    $stmt->execute();
    $listaPerfiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare(
        "SELECT u.id, u.nombre, u.correo
         FROM usuarios u
         LEFT JOIN guias g ON g.usuario_id = u.id
         WHERE u.rol = 'guia' AND g.id IS NULL
         ORDER BY u.nombre, u.id"
    );
    $stmt->execute();
    $cuentasGuia = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$nav_texto = 'Mi perfil';
$nav_href = 'login.php';
$csrf = csrf_token();
$rutaInicial = array_map(static function (array $punto): array {
    return [
        'nombre' => (string) $punto['nombre'],
        'latitud' => (float) $punto['latitud'],
        'longitud' => (float) $punto['longitud'],
    ];
}, $puntosRuta);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mi perfil de guía | Rutas de Encanto</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="stylesheet" href="../css/accesibilidad.css">
  <link rel="stylesheet" href="../css/auth.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css">
</head>
<body class="auth">
  <?php require __DIR__ . '/_encabezado.php'; ?>
  <main class="seccion">
    <div class="contenedor">
      <div class="titulo-seccion">
        <span class="pastilla">🧭 PERFIL DE GUÍA</span>
        <h1>Mi perfil de guía</h1>
        <p>Administra tu información pública, tus fotos y la ruta que ofreces.</p>
        <div class="adorno"></div>
      </div>

      <?php if ($esAdmin): ?>
        <section class="card" style="margin-bottom:1.5rem">
          <div class="card-cuerpo">
            <h2>Seleccionar perfil</h2>
            <form method="get" class="form-grid">
              <div class="campo">
                <label for="guia_id">Perfiles existentes</label>
                <select id="guia_id" name="guia_id">
                  <option value="">Selecciona un perfil</option>
                  <?php foreach ($listaPerfiles as $item): ?>
                    <option value="<?= (int) $item['id'] ?>" <?= $guiaIdSeleccionado === (int) $item['id'] ? 'selected' : '' ?>>
                      <?= panel_h($item['nombre'] . ' · ' . $item['pueblo']) ?>
                    </option>
                  <?php endforeach; ?>
                </select>
              </div>
              <button class="btn" type="submit">Abrir perfil</button>
            </form>
            <form method="get" class="form-grid" style="margin-top:1rem">
              <div class="campo">
                <label for="usuario_id">Crear perfil para cuenta de guía</label>
                <select id="usuario_id" name="usuario_id">
                  <option value="">Selecciona una cuenta sin perfil</option>
                  <?php foreach ($cuentasGuia as $cuenta): ?>
                    <option value="<?= (int) $cuenta['id'] ?>" <?= $usuarioDestinoId === (int) $cuenta['id'] && !$perfilSeleccionadoPorId ? 'selected' : '' ?>>
                      <?= panel_h($cuenta['nombre'] . ' · ' . $cuenta['correo']) ?>
                    </option>
                  <?php endforeach; ?>
                </select>
              </div>
              <button class="btn btn-borde" type="submit">Abrir cuenta</button>
            </form>
            <p class="auth-pie"><a href="admin_guias.php">Administrar cuentas y publicación de guías</a></p>
          </div>
        </section>
      <?php endif; ?>

      <?php foreach ($errores as $error): ?>
        <p class="auth-aviso error" role="alert"><?= panel_h($error) ?></p>
      <?php endforeach; ?>
      <?php if ($mensaje !== ''): ?>
        <p class="auth-aviso ok" role="status"><?= panel_h($mensaje) ?></p>
      <?php endif; ?>

      <?php if (!$esAdmin || $perfil || $usuarioDestinoId !== null): ?>
        <?php if (!$perfil && $usuarioDestinoId === null): ?>
          <p class="auth-aviso">Selecciona un perfil o una cuenta de guía para continuar.</p>
        <?php else: ?>
          <section class="card" style="margin-bottom:1.5rem">
            <div class="card-cuerpo">
              <h2><?= $perfil ? 'Editar perfil' : 'Crear perfil' ?></h2>
              <p class="card-desc">Los campos con datos públicos solo se mostrarán si autorizas su publicación y el perfil está activo.</p>
              <form method="post" action="<?= panel_h($actionUrl) ?>">
                <input type="hidden" name="csrf_token" value="<?= panel_h($csrf) ?>">
                <input type="hidden" name="accion" value="guardar_perfil">
                <div class="form-grid">
                  <div class="campo">
                    <label for="nombre">Nombre público</label>
                    <input id="nombre" name="nombre" maxlength="120" value="<?= panel_h($formulario['nombre']) ?>" required>
                  </div>
                  <div class="campo">
                    <label for="pueblo_id">Pueblo</label>
                    <select id="pueblo_id" name="pueblo_id" required>
                      <option value="">Selecciona un pueblo</option>
                      <?php foreach ($pueblos as $pueblo): ?>
                        <option value="<?= (int) $pueblo['id'] ?>" <?= (string) $formulario['pueblo_id'] === (string) $pueblo['id'] ? 'selected' : '' ?>>
                          <?= panel_h($pueblo['nombre']) ?>
                        </option>
                      <?php endforeach; ?>
                    </select>
                  </div>
                  <div class="campo">
                    <label for="telefono">Teléfono (10 dígitos)</label>
                    <input id="telefono" name="telefono" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" value="<?= panel_h($formulario['telefono']) ?>" required>
                  </div>
                  <div class="campo">
                    <label for="correo">Correo</label>
                    <input id="correo" name="correo" type="email" maxlength="150" value="<?= panel_h($formulario['correo']) ?>" required>
                  </div>
                  <div class="campo completo">
                    <label for="descripcion">Descripción (máximo 1000 caracteres)</label>
                    <textarea id="descripcion" name="descripcion" maxlength="1000" rows="4"><?= panel_h($formulario['descripcion']) ?></textarea>
                  </div>
                  <fieldset class="completo" style="border:0">
                    <legend>Actividades</legend>
                    <div class="etiquetas">
                      <?php foreach ($actividadesDisponibles as $clave => $etiqueta): ?>
                        <label class="etiqueta">
                          <input type="checkbox" name="actividades[]" value="<?= panel_h($clave) ?>" <?= in_array($clave, $formulario['actividades'], true) ? 'checked' : '' ?>>
                          <?= panel_h($etiqueta) ?>
                        </label>
                      <?php endforeach; ?>
                    </div>
                  </fieldset>
                  <div class="campo">
                    <label for="precio_aprox">Precio aproximado (MXN)</label>
                    <input id="precio_aprox" name="precio_aprox" type="number" min="0" max="99999999.99" step="0.01" value="<?= panel_h($formulario['precio_aprox']) ?>" required>
                  </div>
                  <div class="completo">
                    <label style="display:flex;align-items:flex-start;gap:.5rem">
                      <input type="checkbox" name="consentimiento_datos" value="1" <?= $consentimientoMarcado ? 'checked' : '' ?>>
                      Autorizo publicar mi nombre, fotos, teléfono y correo en el sitio, conforme al
                      <a href="../aviso-privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a>.
                    </label>
                    <small>La autorización es necesaria para publicar el perfil. Si la desmarcas, se guardará inactivo y dejará de aparecer públicamente.</small>
                  </div>
                  <button class="btn btn-bloque completo" type="submit">Guardar perfil</button>
                </div>
              </form>
            </div>
          </section>

          <?php if ($perfil): ?>
            <section class="card" style="margin-bottom:1.5rem">
              <div class="card-cuerpo">
                <h2>Fotos del perfil (<?= count($fotosPerfil) ?>/5)</h2>
                <?php if ($fotosPerfil): ?>
                  <div class="rejilla rejilla-4">
                    <?php foreach ($fotosPerfil as $foto): ?>
                      <article class="card">
                        <?php $srcFoto = panel_ruta_foto($foto['ruta_archivo']); ?>
                        <?php if ($srcFoto !== null): ?>
                          <div class="foto"><img src="../<?= panel_h($srcFoto) ?>" alt="Foto del perfil de guía"></div>
                        <?php else: ?>
                          <p class="resumen"><?= panel_h($foto['ruta_archivo']) ?></p>
                        <?php endif; ?>
                        <div class="card-cuerpo">
                          <form method="post" action="<?= panel_h($actionUrl) ?>">
                            <input type="hidden" name="csrf_token" value="<?= panel_h($csrf) ?>">
                            <input type="hidden" name="accion" value="eliminar_foto">
                            <input type="hidden" name="foto_id" value="<?= (int) $foto['id'] ?>">
                            <button class="btn btn-borde" type="submit">Eliminar foto</button>
                          </form>
                        </div>
                      </article>
                    <?php endforeach; ?>
                  </div>
                <?php endif; ?>
                <?php if (count($fotosPerfil) < 5): ?>
                  <form method="post" enctype="multipart/form-data" action="<?= panel_h($actionUrl) ?>" style="margin-top:1rem">
                    <input type="hidden" name="csrf_token" value="<?= panel_h($csrf) ?>">
                    <input type="hidden" name="accion" value="subir_fotos">
                    <div class="campo">
                      <label for="fotos">Agregar fotos (JPEG, PNG o WebP; máximo 2 MB cada una)</label>
                      <input id="fotos" type="file" name="fotos[]" accept="image/jpeg,image/png,image/webp" multiple required>
                    </div>
                    <button class="btn" type="submit">Subir fotos</button>
                  </form>
                <?php endif; ?>
              </div>
            </section>

            <section class="card" style="margin-bottom:1.5rem">
              <div class="card-cuerpo">
                <h2>Ruta del guía</h2>
                <p class="card-desc">Haz clic en el mapa para agregar un punto. Puedes cambiar su nombre, moverlo o eliminarlo. Máximo 15 puntos.</p>
                <div id="mapa-ruta-guia" role="region" aria-label="Mapa para editar la ruta" style="height:340px;border-radius:14px"></div>
                <p id="estado-ruta-guia" class="resumen" role="status" aria-live="polite">Cargando mapa...</p>
                <form id="form-ruta-guia" method="post" action="<?= panel_h($actionUrl) ?>">
                  <input type="hidden" name="csrf_token" value="<?= panel_h($csrf) ?>">
                  <input type="hidden" name="accion" value="guardar_ruta">
                  <input type="hidden" id="puntos_json" name="puntos_json" value="<?= panel_h(json_encode($rutaInicial, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)) ?>">
                  <ol id="lista-puntos-ruta" class="info-lista"></ol>
                  <button class="btn" type="submit">Guardar ruta</button>
                </form>
              </div>
            </section>

            <?php if (!$esAdmin || (int) ($perfil['usuario_id'] ?? 0) === (int) $usuario['id']): ?>
              <section class="card">
                <div class="card-cuerpo">
                  <h2>Derecho de baja</h2>
                  <p class="card-desc">Se eliminarán el perfil, las fotos asociadas y todos los puntos de la ruta.</p>
                  <form method="post" action="<?= panel_h($actionUrl) ?>" onsubmit="return confirm('¿Eliminar tu perfil y todos sus datos? Esta acción no se puede deshacer.');">
                    <input type="hidden" name="csrf_token" value="<?= panel_h($csrf) ?>">
                    <input type="hidden" name="accion" value="eliminar_perfil">
                    <button class="btn btn-borde" type="submit">Eliminar mi perfil y mis datos</button>
                  </form>
                </div>
              </section>
            <?php endif; ?>
          <?php endif; ?>
        <?php endif; ?>
      <?php endif; ?>
    </div>
  </main>
  <script>
    window.RDE_PUNTOS_INICIALES = <?= json_encode($rutaInicial, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <script src="../js/panel-guia.js"></script>
  <script src="../js/main.js"></script>
  <script src="../js/accesibilidad.js"></script>
  <script src="../js/sesion.js" data-base="../"></script>
</body>
</html>
