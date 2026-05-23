-- ============================================================
--  Puerto Habana Cevicheria — Base de Datos Completa
--  Archivo: db/puerto_habana.sql
--
--  Uso en MySQL Workbench:
--    1. File → Open SQL Script → seleccionar este archivo
--    2. Ejecutar con Ctrl+Shift+Enter  (o botón ⚡ "Execute All")
--
--  Desde terminal:
--    mysql -u root -p < db/puerto_habana.sql
--
--  AUTENTICACIÓN:
--    El personal NO tiene contraseña.
--    El admin crea a cada empleado con su Gmail.
--    El empleado entra poniendo ese mismo Gmail — sin clave.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Base de datos ─────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS `SistemaPuertoHabana`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `SistemaPuertoHabana`;

-- ── USUARIOS / PERSONAL ───────────────────────────────────────────────────────
--  Sin campo password — el acceso es solo por Gmail registrado por el admin.
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id`            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  `nombre`        VARCHAR(255)  NOT NULL,
  `email`         VARCHAR(255)  DEFAULT NULL          COMMENT 'Gmail registrado por el admin. Es la clave de acceso.',
  `dni`           VARCHAR(20)   DEFAULT NULL,
  `rol`           ENUM('admin','mozo','cocina','ayudante_cocina','lavaplato')
                  NOT NULL DEFAULT 'mozo',
  `salario_monto` DECIMAL(10,2) DEFAULT NULL,
  `salario_tipo`  ENUM('diario','semanal','mensual')  DEFAULT NULL,
  `foto_url`      TEXT          DEFAULT NULL,
  `activo`        TINYINT(1)    NOT NULL DEFAULT 1    COMMENT '1 = activo, 0 = desactivado por el admin',
  `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Personal del restaurante. Login = Gmail sin contraseña.';

-- ── MESAS ─────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `mesas`;
CREATE TABLE `mesas` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `nombre`     VARCHAR(100) NOT NULL,
  `sillas`     INT          NOT NULL DEFAULT 4,
  `estado`     ENUM('disponible','ocupada','reservada') NOT NULL DEFAULT 'disponible',
  `unida_con`  JSON         DEFAULT NULL               COMMENT 'IDs de mesas unidas (array JSON)',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── RESERVAS ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `reservas`;
CREATE TABLE `reservas` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `mesa_id`    INT          DEFAULT NULL,
  `cliente`    VARCHAR(255) NOT NULL,
  `telefono`   VARCHAR(50)  DEFAULT NULL,
  `fecha`      DATE         NOT NULL,
  `hora`       TIME         NOT NULL,
  `personas`   INT          NOT NULL DEFAULT 2,
  `notas`      TEXT         DEFAULT NULL,
  `estado`     ENUM('pendiente','confirmada','cancelada','completada')
               NOT NULL DEFAULT 'pendiente',
  `mozo_id`    VARCHAR(36)  DEFAULT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_reservas_mesa` (`mesa_id`),
  KEY `fk_reservas_mozo` (`mozo_id`),
  CONSTRAINT `fk_reservas_mesa` FOREIGN KEY (`mesa_id`)
    REFERENCES `mesas`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reservas_mozo` FOREIGN KEY (`mozo_id`)
    REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── COMANDAS ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `comandas`;
CREATE TABLE `comandas` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `mesa_id`     INT           DEFAULT NULL,
  `mesa_nombre` VARCHAR(100)  NOT NULL,
  `mozo_id`     VARCHAR(36)   DEFAULT NULL,
  `mozo_nombre` VARCHAR(255)  DEFAULT NULL,
  `estado`      ENUM('Pendiente','Preparando','Listo','Entregado','Cancelado')
                NOT NULL DEFAULT 'Pendiente',
  `total`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `fecha`       DATE          NOT NULL,
  `hora`        VARCHAR(20)   NOT NULL,
  `notas`       TEXT          DEFAULT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comandas_mesa`  (`mesa_id`),
  KEY `fk_comandas_mozo`  (`mozo_id`),
  KEY `idx_comandas_fecha`(`fecha`),
  CONSTRAINT `fk_comandas_mesa` FOREIGN KEY (`mesa_id`)
    REFERENCES `mesas`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_comandas_mozo` FOREIGN KEY (`mozo_id`)
    REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ITEMS DE COMANDA ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `comanda_items`;
CREATE TABLE `comanda_items` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `comanda_id` INT           NOT NULL,
  `nombre`     VARCHAR(255)  NOT NULL,
  `cantidad`   INT           NOT NULL DEFAULT 1,
  `precio`     DECIMAL(10,2) NOT NULL,
  `categoria`  ENUM('comida','bebidas') NOT NULL DEFAULT 'comida',
  `notas`      TEXT          DEFAULT NULL,
  `estado`     ENUM('Pendiente','Preparando','Listo','Entregado')
               NOT NULL DEFAULT 'Pendiente',
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_items_comanda` (`comanda_id`),
  CONSTRAINT `fk_items_comanda` FOREIGN KEY (`comanda_id`)
    REFERENCES `comandas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── INVENTARIO ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `inventario`;
CREATE TABLE `inventario` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `seccion`    ENUM('comida','bebidas','tapers','insumos') NOT NULL DEFAULT 'comida',
  `nombre`     VARCHAR(255)  NOT NULL,
  `categoria`  VARCHAR(100)  DEFAULT NULL,
  `tipo`       VARCHAR(100)  DEFAULT NULL,
  `precio`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cantidad`   INT           NOT NULL DEFAULT 0,
  `unidad`     VARCHAR(50)   NOT NULL DEFAULT 'unidad',
  `minimo`     INT           NOT NULL DEFAULT 5,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventario_seccion` (`seccion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── GASTOS ────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `gastos`;
CREATE TABLE `gastos` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(500)  NOT NULL,
  `categoria`   VARCHAR(100)  NOT NULL DEFAULT 'Otros',
  `monto`       DECIMAL(10,2) NOT NULL,
  `fecha`       DATE          NOT NULL,
  `usuario_id`  VARCHAR(36)   DEFAULT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_gastos_usuario` (`usuario_id`),
  KEY `idx_gastos_fecha`  (`fecha`),
  CONSTRAINT `fk_gastos_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── PAGOS A PERSONAL ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `pagos_personal`;
CREATE TABLE `pagos_personal` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `usuario_id` VARCHAR(36)   DEFAULT NULL,
  `nombre`     VARCHAR(255)  NOT NULL,
  `monto`      DECIMAL(10,2) NOT NULL,
  `concepto`   VARCHAR(255)  NOT NULL DEFAULT 'Pago Jornal',
  `fecha`      DATE          NOT NULL,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pagos_usuario` (`usuario_id`),
  KEY `idx_pagos_fecha`  (`fecha`),
  CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── MERMAS / DESPERDICIOS ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS `mermas`;
CREATE TABLE `mermas` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(500)  NOT NULL,
  `costo`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `fecha`       DATE          NOT NULL,
  `usuario_id`  VARCHAR(36)   DEFAULT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mermas_usuario` (`usuario_id`),
  CONSTRAINT `fk_mermas_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── VENTAS DIARIAS (pronósticos reales) ───────────────────────────────────────
DROP TABLE IF EXISTS `ventas_diarias`;
CREATE TABLE `ventas_diarias` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `fecha`          DATE          NOT NULL,
  `total_comandas` INT           NOT NULL DEFAULT 0,
  `total_ingresos` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_comida`   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_bebidas`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ventas_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Resumen diario. Se usa para calcular pronósticos reales tras la primera semana.';

-- ── CONFIGURACION ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `configuracion`;
CREATE TABLE `configuracion` (
  `clave`      VARCHAR(100) NOT NULL,
  `valor`      TEXT         DEFAULT NULL,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  DATOS INICIALES
-- ============================================================

-- 8 mesas por defecto
INSERT INTO `mesas` (`id`, `nombre`, `sillas`) VALUES
  (1,'Mesa 1',4),(2,'Mesa 2',4),(3,'Mesa 3',4),(4,'Mesa 4',4),
  (5,'Mesa 5',4),(6,'Mesa 6',6),(7,'Mesa 7',6),(8,'Mesa 8',2);

-- Inventario inicial
INSERT INTO `inventario` (`seccion`,`nombre`,`categoria`,`precio`,`cantidad`,`unidad`,`minimo`) VALUES
  ('comida', 'Ceviche de Pescado', 'Ceviches',       42.00, 20,'plato',   5),
  ('comida', 'Ceviche Mixto',      'Ceviches',       45.00, 15,'plato',   5),
  ('comida', 'Arroz con Mariscos', 'Platos Fuertes', 38.00, 18,'plato',   5),
  ('comida', 'Lomo Saltado',       'Platos Fuertes', 32.00, 12,'plato',   5),
  ('comida', 'Jalea Mixta',        'Platos Fuertes', 40.00, 10,'plato',   5),
  ('comida', 'Leche de Tigre',     'Entradas',       20.00, 25,'plato',   5),
  ('bebidas','Cerveza Pilsner',    'Cervezas',       12.00, 48,'botella',10),
  ('bebidas','Inca Kola',          'Refrescos',       5.00, 36,'botella',10),
  ('bebidas','Chicha Morada',      'Jugos',           8.00, 20,'vaso',    5),
  ('bebidas','Jugo de Naranja',    'Jugos',           8.00, 15,'vaso',    5),
  ('tapers', 'Taper Grande',       'Envase',          2.50,100,'unidad', 20),
  ('tapers', 'Taper Mediano',      'Envase',          1.50,150,'unidad', 20),
  ('tapers', 'Bolsa Kraft',        'Empaque',         0.80,200,'unidad', 30);

-- Configuración por defecto
INSERT INTO `configuracion` (`clave`,`valor`) VALUES
  ('nombreEmpresa','Puerto Habana Cevicheria'),
  ('direccion',    'Av. Principal 123'),
  ('telefono',     '+51 123 456 789'),
  ('email',        'contacto@puertohabana.com'),
  ('horarioMañana','09:00 - 14:00'),
  ('horarioTarde', '15:00 - 23:00'),
  ('sidebarDesign','normal'),
  ('navbarStyle',  'original'),
  ('ruc',          '20XXXXXXXXX')
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  CÓMO FUNCIONA EL LOGIN (sin contraseña)
-- ============================================================
--
--  1. Admin crea empleado en /admin/personal con su Gmail.
--     Ejemplo: nombre="María García", email="maria@gmail.com", rol="mozo"
--
--  2. María entra a /login-mozo y escribe: maria@gmail.com
--     El sistema busca ese email en ph_personal (localStorage)
--     y si el rol coincide, crea la sesión.
--
--  3. Para agregar un empleado de ejemplo:
--     INSERT INTO usuarios (nombre, email, rol, salario_monto, salario_tipo)
--     VALUES ('María García', 'maria@gmail.com', 'mozo', 1200.00, 'mensual');
--
--  4. Para desactivar un empleado (sin borrarlo):
--     UPDATE usuarios SET activo = 0 WHERE email = 'maria@gmail.com';
--
-- ============================================================
--  TABLAS CREADAS:
--    usuarios        — Personal (sin contraseña, login por Gmail)
--    mesas           — Mesas del restaurante
--    reservas        — Reservas de mesas
--    comandas        — Pedidos/comandas (Mozo → Cocina)
--    comanda_items   — Ítems de cada comanda
--    inventario      — Comida, bebidas, tapers, insumos
--    gastos          — Gastos del negocio
--    pagos_personal  — Pagos a empleados
--    mermas          — Desperdicios
--    ventas_diarias  — Resumen diario (pronósticos reales)
--    configuracion   — Configuración del sistema
-- ============================================================
