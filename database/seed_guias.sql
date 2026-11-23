-- Datos ficticios de ejemplo. Importar después de seed_hoteles.sql.
INSERT INTO guias (
  usuario_id, pueblo_id, nombre, telefono, correo, descripcion, actividades,
  precio_aprox, consentimiento_datos, activo
) VALUES
  (
    NULL,
    (SELECT id FROM pueblos WHERE nombre = 'Huasca de Ocampo' ORDER BY id LIMIT 1),
    'Lía Viento de Huasca',
    '7710000000',
    'lia.huasca@example.com',
    'Guía de ejemplo para recorridos por bosques, haciendas y Prismas Basálticos.',
    'senderismo,haciendas,naturaleza',
    650.00,
    1,
    1
  ),
  (
    NULL,
    (SELECT id FROM pueblos WHERE nombre = 'Mineral del Chico' ORDER BY id LIMIT 1),
    'Elian Bosque Chico',
    '7710000000',
    'elian.chico@example.com',
    'Guía de ejemplo para caminatas y miradores del Parque Nacional El Chico.',
    'senderismo,escalada,naturaleza',
    750.00,
    1,
    1
  ),
  (
    NULL,
    (SELECT id FROM pueblos WHERE nombre = 'Real del Monte' ORDER BY id LIMIT 1),
    'Mara Mina Serena',
    '7710000000',
    'mara.real@example.com',
    'Guía de ejemplo para descubrir minas, historia y el Panteón Inglés.',
    'historia,minería,cultura',
    600.00,
    1,
    1
  );

INSERT INTO guia_fotos (guia_id, ruta_archivo) VALUES
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 'img/guias/lia-viento-de-huasca.png'),
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 'img/pueblos/huasca.jpg'),
  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 'img/guias/elian-bosque-chico.png'),
  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 'img/pueblos/mineral-del-chico.jpg'),
  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 'img/guias/mara-mina-serena.png'),
  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 'img/pueblos/real-del-monte.jpg');

INSERT INTO guia_ruta_puntos (guia_id, orden, nombre, latitud, longitud) VALUES
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 1, 'Plaza principal de Huasca', 20.203500, -98.575500),
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 2, 'Iglesia de San Juan Bautista', 20.203700, -98.575200),
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 3, 'Hacienda Santa María Regla', 20.207300, -98.561800),
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 4, 'Bosque de las Truchas', 20.211000, -98.563000),
  ((SELECT id FROM guias WHERE nombre = 'Lía Viento de Huasca' ORDER BY id DESC LIMIT 1), 5, 'Prismas Basálticos', 20.204700, -98.565500),

  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 1, 'Plaza principal de Mineral del Chico', 20.216700, -98.731500),
  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 2, 'Acceso al Parque Nacional El Chico', 20.205000, -98.729000),
  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 3, 'Presa El Cedral', 20.181700, -98.728300),
  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 4, 'Mirador Peña del Cuervo', 20.200500, -98.752000),
  ((SELECT id FROM guias WHERE nombre = 'Elian Bosque Chico' ORDER BY id DESC LIMIT 1), 5, 'Centro ecoturístico', 20.193500, -98.735500),

  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 1, 'Plaza principal de Real del Monte', 20.138400, -98.673500),
  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 2, 'Mina de Acosta', 20.123000, -98.666500),
  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 3, 'Museo de Sitio Mina La Dificultad', 20.127500, -98.669000),
  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 4, 'Panteón Inglés', 20.145500, -98.669000),
  ((SELECT id FROM guias WHERE nombre = 'Mara Mina Serena' ORDER BY id DESC LIMIT 1), 5, 'Portal del comercio', 20.138000, -98.673000);
