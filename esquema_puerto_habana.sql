-- MySQL Schema for Sistema Puerto Habana
-- Enhanced with full project data structure (LocalStorage mapping)
-- Generated on: 2026-05-22

CREATE DATABASE IF NOT EXISTS SistemaPuertoHabana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE SistemaPuertoHabana;

-- =====================================================
-- 1. Usuarios / Personal (Admin, Mozo, Cocina, etc.)
-- =====================================================
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    email VARCHAR(200) NOT NULL UNIQUE,
    rol ENUM('admin', 'mozo', 'cocina', 'ayudante_cocina', 'lavaplato') NOT NULL,
    salario_monto DECIMAL(10,2),
    salario_tipo ENUM('diario', 'semanal', 'mensual'),
    foto_url TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Pagos al Personal (Refleja hook usePayments)
-- =====================================================
CREATE TABLE pagos_personal (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    mozoNombre VARCHAR(150), -- Nombre literal guardado en storage (opcional)
    monto DECIMAL(10,2) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    fecha DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Mesas (Configuración y mapeo para uniones)
-- =====================================================
CREATE TABLE mesas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    nombre VARCHAR(100),
    sillas INT DEFAULT 4,
    unida_con VARCHAR(255), -- Arreglo serializado de mesas unidas, e.g. "mesa-2,mesa-3"
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Inventario / Menú (Comidas y Bebidas)
-- =====================================================
CREATE TABLE inventario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    categoria ENUM('comida', 'bebidas', 'insumos') NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    unidad VARCHAR(50) NOT NULL,
    minimo INT NOT NULL DEFAULT 0,
    precio DECIMAL(10,2), -- Usado solo para ítems del menú
    es_menu BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Gastos Generales (Admin Dashboard)
-- =====================================================
CREATE TABLE gastos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. Comandas (Pedidos Maestro)
-- =====================================================
CREATE TABLE comandas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mesa_id INT UNSIGNED,
    mesa_nombre VARCHAR(100) NOT NULL,
    mozo_id INT UNSIGNED,
    mozo_nombre VARCHAR(150),
    hora TIME NOT NULL,
    fecha DATE NOT NULL,
    estado ENUM('Pendiente', 'Preparando', 'Listo', 'Entregado') NOT NULL DEFAULT 'Pendiente',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago ENUM('efectivo', 'tarjeta', 'yape', 'plin', 'pendiente') DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_comanda_mesa FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL,
    CONSTRAINT fk_comanda_mozo FOREIGN KEY (mozo_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_comanda_fecha (fecha),
    INDEX idx_comanda_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. Comanda Items (Detalle del Pedido)
-- =====================================================
CREATE TABLE comanda_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comanda_id INT UNSIGNED NOT NULL,
    item_nombre VARCHAR(200) NOT NULL,
    categoria ENUM('comida', 'bebidas') NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio DECIMAL(10,2) NOT NULL,
    notas TEXT,
    estado ENUM('Pendiente', 'Preparando', 'Entregado') DEFAULT 'Pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_comanda FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE CASCADE,
    CHECK (cantidad > 0 AND precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. Triggers (Total en Tiempo Real)
-- =====================================================
DELIMITER $$
CREATE TRIGGER trg_comanda_items_after_insert
AFTER INSERT ON comanda_items
FOR EACH ROW
BEGIN
    UPDATE comandas
    SET total = total + (NEW.cantidad * NEW.precio)
    WHERE id = NEW.comanda_id;
END$$

CREATE TRIGGER trg_comanda_items_after_update
AFTER UPDATE ON comanda_items
FOR EACH ROW
BEGIN
    UPDATE comandas
    SET total = total - (OLD.cantidad * OLD.precio) + (NEW.cantidad * NEW.precio)
    WHERE id = NEW.comanda_id;
END$$

CREATE TRIGGER trg_comanda_items_after_delete
AFTER DELETE ON comanda_items
FOR EACH ROW
BEGIN
    UPDATE comandas
    SET total = total - (OLD.cantidad * OLD.precio)
    WHERE id = OLD.comanda_id;
END$$
DELIMITER ;

-- =====================================================
-- 9. Inserción de Datos Maestros (Seed)
-- =====================================================
INSERT INTO usuarios (nombre, email, rol, salario_monto, salario_tipo) VALUES
    ('Admin Principal', 'admin@puertohabana.pe', 'admin', 5000.00, 'mensual'),
    ('Juan Pérez', 'juan.perez@puertohabana.pe', 'mozo', 1200.00, 'mensual'),
    ('Carlos Rodríguez', 'cocina.jefe@puertohabana.pe', 'cocina', 3500.00, 'mensual');

INSERT INTO mesas (numero, nombre, sillas) VALUES 
    (1, 'Mesa 1', 4), (2, 'Mesa 2', 4), (3, 'Mesa 3', 4), (4, 'Mesa 4', 4),
    (5, 'Mesa 5', 4), (6, 'Mesa 6', 4), (7, 'Mesa 7', 4), (8, 'Mesa 8', 4);

INSERT INTO inventario (item, categoria, cantidad, unidad, minimo, precio, es_menu) VALUES
    ('Ceviche Mixto', 'comida', 100, 'porcion', 10, 45.00, TRUE),
    ('Ceviche de Pescado', 'comida', 100, 'porcion', 10, 42.00, TRUE),
    ('Arroz con Mariscos', 'comida', 100, 'porcion', 10, 38.00, TRUE),
    ('Cerveza Pilsner', 'bebidas', 50, 'botella', 24, 12.00, TRUE),
    ('Inca Kola', 'bebidas', 100, 'botella', 24, 5.00, TRUE);
