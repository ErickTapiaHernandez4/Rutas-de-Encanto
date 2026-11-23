-- =========================================================
--  RUTAS DE ENCANTO — Restaurantes y sus menús
--  Impórtalo en phpMyAdmin dentro de la MISMA base de datos
--  que usa el proyecto (la que dice php/config.php).
--  No toca las tablas de usuarios, guías ni hoteles.
--
--  Para agregar o cambiar restaurantes después:
--  phpMyAdmin → tabla "restaurantes" o "restaurante_menu" → Insertar / Editar
-- =========================================================
SET NAMES utf8mb4;

DROP TABLE IF EXISTS restaurante_menu;
DROP TABLE IF EXISTS restaurantes;

-- ---------- Restaurantes ----------
CREATE TABLE restaurantes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  pueblo          VARCHAR(80)  NOT NULL,
  descripcion     TEXT NULL,
  foto            VARCHAR(200) NULL,          -- ej. img/restaurantes/la-esquina-santa.jpg

  -- Contacto
  direccion       VARCHAR(200) NULL,
  horario         VARCHAR(120) NULL,
  telefono        VARCHAR(20)  NULL,
  whatsapp        VARCHAR(15)  NULL,          -- solo números con lada: 527711234567
  correo          VARCHAR(150) NULL,
  facebook        VARCHAR(200) NULL,          -- enlace completo https://facebook.com/...
  instagram       VARCHAR(200) NULL,          -- enlace completo https://instagram.com/...

  -- Características, separadas por coma. Valores que reconoce la página:
  -- wifi, estacionamiento, pet-friendly, terraza, accesible, tarjeta,
  -- vegetariano, para-llevar, familiar, musica, reservaciones
  caracteristicas VARCHAR(255) NULL,

  activo          TINYINT(1)   NOT NULL DEFAULT 1,   -- 0 = no se muestra en la página
  orden           INT          NOT NULL DEFAULT 0    -- para acomodarlos (menor = primero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Menú de cada restaurante ----------
CREATE TABLE restaurante_menu (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  restaurante_id  INT NOT NULL,
  seccion         VARCHAR(60)  NOT NULL,      -- Entradas, Platillos, Bebidas, Postres...
  platillo        VARCHAR(120) NOT NULL,
  descripcion     VARCHAR(255) NULL,
  precio          DECIMAL(8,2) NULL,
  orden           INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_menu_restaurante FOREIGN KEY (restaurante_id)
    REFERENCES restaurantes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
--  DATOS DE EJEMPLO (cámbialos por los reales)
-- =========================================================
INSERT INTO restaurantes
(id, nombre, pueblo, descripcion, foto, direccion, horario, telefono, whatsapp, correo, facebook, instagram, caracteristicas, orden) VALUES
(1, 'La Esquina Santa', 'Huasca de Ocampo',
 'Cocina casera hidalguense en una casona del centro, ideal para comer después de visitar los Prismas.',
 'img/restaurantes/la-esquina-santa.jpg',
 'Centro, Huasca de Ocampo, Hgo.', 'Lunes a domingo · 9:00 – 19:00',
 '771 000 0001', '527710000001', 'contacto@laesquinasanta.mx',
 'https://facebook.com/', 'https://instagram.com/',
 'wifi,estacionamiento,familiar,tarjeta', 1),

(2, 'Fonda La Hacienda', 'Huasca de Ocampo',
 'Barbacoa de borrego los fines de semana y comida corrida entre semana.',
 'img/restaurantes/restaurante-1.png',
 'Calle Principal s/n, Huasca de Ocampo, Hgo.', 'Lunes a domingo · 8:00 – 18:00',
 '771 000 0002', '527710000002', NULL, 'https://facebook.com/', NULL,
 'estacionamiento,terraza,familiar,para-llevar', 2),

(3, 'Pastes El Portal', 'Real del Monte',
 'Pastes recién horneados con la receta minera de siempre, frente a la plaza.',
 NULL,
 'Plaza Principal, Real del Monte, Hgo.', 'Todos los días · 9:00 – 20:00',
 '771 000 0003', '527710000003', NULL, NULL, 'https://instagram.com/',
 'para-llevar,vegetariano,tarjeta', 3),

(4, 'Cocina El Pinar', 'Mineral del Chico',
 'Truchas frescas de criadero local con vista al bosque.',
 NULL,
 'Av. Corona s/n, Mineral del Chico, Hgo.', 'Viernes a domingo · 9:00 – 18:00',
 '771 000 0004', '527710000004', NULL, NULL, NULL,
 'terraza,pet-friendly,estacionamiento,accesible', 4);

INSERT INTO restaurante_menu (restaurante_id, seccion, platillo, descripcion, precio, orden) VALUES
-- La Esquina Santa
(1, 'Desayunos', 'Enchiladas hidalguenses', 'Con cecina, queso y crema', 120, 1),
(1, 'Desayunos', 'Chilaquiles rojos o verdes', 'Con huevo o pollo', 95, 2),
(1, 'Platillos', 'Mixiote de carnero', 'Con arroz y frijoles', 160, 3),
(1, 'Platillos', 'Sopa de hongos', 'Hongos de temporada del bosque', 85, 4),
(1, 'Bebidas', 'Café de olla', NULL, 35, 5),
(1, 'Bebidas', 'Agua fresca del día', NULL, 30, 6),
(1, 'Postres', 'Pan de pulque con nata', NULL, 45, 7),
-- Fonda La Hacienda
(2, 'Platillos', 'Barbacoa de borrego (kilo)', 'Con tortillas, salsa y cebolla', 520, 1),
(2, 'Platillos', 'Taco de barbacoa', NULL, 30, 2),
(2, 'Platillos', 'Consomé', 'Chico o grande', 45, 3),
(2, 'Bebidas', 'Pulque natural (litro)', NULL, 60, 4),
(2, 'Bebidas', 'Refresco', NULL, 25, 5),
-- Pastes El Portal
(3, 'Pastes salados', 'Paste de papa con carne', 'El tradicional', 28, 1),
(3, 'Pastes salados', 'Paste de mole verde', NULL, 30, 2),
(3, 'Pastes salados', 'Paste de frijol con queso', 'Opción vegetariana', 26, 3),
(3, 'Pastes dulces', 'Paste de piña', NULL, 25, 4),
(3, 'Pastes dulces', 'Paste de arroz con leche', NULL, 25, 5),
(3, 'Bebidas', 'Atole de temporada', NULL, 30, 6),
-- Cocina El Pinar
(4, 'Truchas', 'Trucha al ajillo', 'Con ensalada y arroz', 180, 1),
(4, 'Truchas', 'Trucha empapelada', 'Con verduras y epazote', 190, 2),
(4, 'Antojitos', 'Quesadillas de hongos', 'Orden de 3', 90, 3),
(4, 'Bebidas', 'Café de olla', NULL, 35, 4);