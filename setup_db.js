/**
 * setup_db.js — Puerto Habana
 * Crea la base de datos MySQL y todas las tablas del sistema.
 *
 * Uso:
 *   node setup_db.js
 *
 * Lee las variables de .env.local automáticamente.
 * Si no existe, usa los valores por defecto (localhost, root, sin contraseña).
 */

const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

/* ── Leer .env.local sin dependencias externas ─────────────────────────── */
function loadEnv(file = '.env.local') {
  const env = {};
  try {
    const lines = fs.readFileSync(path.resolve(file), 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  } catch {
    // archivo no encontrado — se usan defaults
  }
  return env;
}

const env = loadEnv();

const DB_HOST     = env.DB_HOST     || process.env.DB_HOST     || 'localhost';
const DB_PORT     = Number(env.DB_PORT || process.env.DB_PORT  || 3306);
const DB_USER     = env.DB_USER     || process.env.DB_USER     || 'root';
const DB_PASSWORD = env.DB_PASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME     = env.DB_NAME     || process.env.DB_NAME     || 'SistemaPuertoHabana';

/* ── helpers ────────────────────────────────────────────────────────────── */
async function q(conn, sql, label) {
  await conn.query(sql);
  console.log(`  ✓  ${label}`);
}

/* ── main ───────────────────────────────────────────────────────────────── */
async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Puerto Habana — Setup Base de Datos MySQL  ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  console.log(`  Host     : ${DB_HOST}:${DB_PORT}`);
  console.log(`  Usuario  : ${DB_USER}`);
  console.log(`  Base     : ${DB_NAME}\n`);

  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT,
    user: DB_USER, password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    /* ── Base de datos ─────────────────────────────────────────────────── */
    await q(conn,
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      `Base de datos '${DB_NAME}'`);

    await conn.query(`USE \`${DB_NAME}\``);
    console.log('\n  Creando tablas...\n');

    /* ── USUARIOS / PERSONAL ─────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS usuarios (
        id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
        nombre        VARCHAR(255)  NOT NULL,
        email         VARCHAR(255)  UNIQUE,
        dni           VARCHAR(20),
        password_hash VARCHAR(255),
        rol           ENUM('admin','mozo','cocina','ayudante_cocina','lavaplato')
                      NOT NULL DEFAULT 'mozo',
        salario_monto DECIMAL(10,2),
        salario_tipo  ENUM('diario','semanal','mensual'),
        foto_url      TEXT,
        activo        TINYINT(1)    NOT NULL DEFAULT 1,
        created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`, 'usuarios');

    /* ── MESAS ───────────────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS mesas (
        id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        nombre     VARCHAR(100) NOT NULL,
        sillas     INT          NOT NULL DEFAULT 4,
        estado     ENUM('disponible','ocupada','reservada')
                   NOT NULL DEFAULT 'disponible',
        unida_con  JSON,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`, 'mesas');

    /* ── RESERVAS ────────────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS reservas (
        id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        mesa_id    INT,
        cliente    VARCHAR(255) NOT NULL,
        telefono   VARCHAR(50),
        fecha      DATE         NOT NULL,
        hora       TIME         NOT NULL,
        personas   INT          NOT NULL DEFAULT 2,
        notas      TEXT,
        estado     ENUM('pendiente','confirmada','cancelada','completada')
                   NOT NULL DEFAULT 'pendiente',
        mozo_id    VARCHAR(36),
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mesa_id) REFERENCES mesas(id)    ON DELETE SET NULL,
        FOREIGN KEY (mozo_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`, 'reservas');

    /* ── COMANDAS ────────────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS comandas (
        id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        mesa_id     INT,
        mesa_nombre VARCHAR(100)  NOT NULL,
        mozo_id     VARCHAR(36),
        mozo_nombre VARCHAR(255),
        estado      ENUM('Pendiente','Preparando','Listo','Entregado','Cancelado')
                    NOT NULL DEFAULT 'Pendiente',
        total       DECIMAL(10,2) NOT NULL DEFAULT 0,
        fecha       DATE          NOT NULL,
        hora        VARCHAR(20)   NOT NULL,
        notas       TEXT,
        created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (mesa_id) REFERENCES mesas(id)    ON DELETE SET NULL,
        FOREIGN KEY (mozo_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`, 'comandas');

    /* ── ITEMS DE COMANDA ────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS comanda_items (
        id         INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        comanda_id INT           NOT NULL,
        nombre     VARCHAR(255)  NOT NULL,
        cantidad   INT           NOT NULL DEFAULT 1,
        precio     DECIMAL(10,2) NOT NULL,
        categoria  ENUM('comida','bebidas') NOT NULL DEFAULT 'comida',
        notas      TEXT,
        estado     ENUM('Pendiente','Preparando','Listo','Entregado')
                   NOT NULL DEFAULT 'Pendiente',
        created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (comanda_id) REFERENCES comandas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`, 'comanda_items');

    /* ── INVENTARIO ──────────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS inventario (
        id         INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        seccion    ENUM('comida','bebidas','tapers','insumos')
                   NOT NULL DEFAULT 'comida',
        nombre     VARCHAR(255)  NOT NULL,
        categoria  VARCHAR(100),
        tipo       VARCHAR(100),
        precio     DECIMAL(10,2) NOT NULL DEFAULT 0,
        cantidad   INT           NOT NULL DEFAULT 0,
        unidad     VARCHAR(50)   NOT NULL DEFAULT 'unidad',
        minimo     INT           NOT NULL DEFAULT 5,
        created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`, 'inventario');

    /* ── GASTOS ──────────────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS gastos (
        id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        descripcion VARCHAR(500)  NOT NULL,
        categoria   VARCHAR(100)  NOT NULL DEFAULT 'Otros',
        monto       DECIMAL(10,2) NOT NULL,
        fecha       DATE          NOT NULL,
        usuario_id  VARCHAR(36),
        created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`, 'gastos');

    /* ── PAGOS A PERSONAL ────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS pagos_personal (
        id         INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        usuario_id VARCHAR(36),
        nombre     VARCHAR(255)  NOT NULL,
        monto      DECIMAL(10,2) NOT NULL,
        concepto   VARCHAR(255)  NOT NULL DEFAULT 'Pago Jornal',
        fecha      DATE          NOT NULL,
        created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`, 'pagos_personal');

    /* ── MERMAS / DESPERDICIOS ───────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS mermas (
        id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        descripcion VARCHAR(500)  NOT NULL,
        costo       DECIMAL(10,2) NOT NULL DEFAULT 0,
        fecha       DATE          NOT NULL,
        usuario_id  VARCHAR(36),
        created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`, 'mermas');

    /* ── VENTAS DIARIAS (para pronósticos reales) ────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS ventas_diarias (
        id              INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
        fecha           DATE          NOT NULL UNIQUE,
        total_comandas  INT           NOT NULL DEFAULT 0,
        total_ingresos  DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_comida    DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_bebidas   DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`, 'ventas_diarias');

    /* ── CONFIGURACION ───────────────────────────────────────────────── */
    await q(conn, `
      CREATE TABLE IF NOT EXISTS configuracion (
        clave      VARCHAR(100) NOT NULL PRIMARY KEY,
        valor      TEXT,
        updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`, 'configuracion');

    /* ── DATOS INICIALES ─────────────────────────────────────────────── */
    console.log('\n  Insertando datos iniciales...\n');

    await q(conn, `
      INSERT IGNORE INTO mesas (id, nombre, sillas) VALUES
        (1,'Mesa 1',4),(2,'Mesa 2',4),(3,'Mesa 3',4),(4,'Mesa 4',4),
        (5,'Mesa 5',4),(6,'Mesa 6',6),(7,'Mesa 7',6),(8,'Mesa 8',2)
    `, '8 mesas por defecto');

    await q(conn, `
      INSERT IGNORE INTO inventario (seccion, nombre, categoria, precio, cantidad, unidad, minimo) VALUES
        ('comida','Ceviche de Pescado','Ceviches',       42.00, 20,'plato', 5),
        ('comida','Ceviche Mixto',     'Ceviches',       45.00, 15,'plato', 5),
        ('comida','Arroz con Mariscos','Platos Fuertes', 38.00, 18,'plato', 5),
        ('comida','Lomo Saltado',      'Platos Fuertes', 32.00, 12,'plato', 5),
        ('comida','Jalea Mixta',       'Platos Fuertes', 40.00, 10,'plato', 5),
        ('comida','Leche de Tigre',    'Entradas',       20.00, 25,'plato', 5),
        ('bebidas','Cerveza Pilsner',  'Cervezas',       12.00, 48,'botella',10),
        ('bebidas','Inca Kola',        'Refrescos',       5.00, 36,'botella',10),
        ('bebidas','Chicha Morada',    'Jugos',           8.00, 20,'vaso',   5),
        ('bebidas','Jugo de Naranja',  'Jugos',           8.00, 15,'vaso',   5),
        ('tapers', 'Taper Grande',     'Envase',          2.50,100,'unidad', 20),
        ('tapers', 'Taper Mediano',    'Envase',          1.50,150,'unidad', 20),
        ('tapers', 'Bolsa Kraft',      'Empaque',         0.80,200,'unidad', 30)
    `, 'Inventario inicial');

    await q(conn, `
      INSERT INTO configuracion (clave, valor) VALUES
        ('nombreEmpresa', 'Puerto Habana Cevicheria'),
        ('direccion',     'Av. Principal 123'),
        ('telefono',      '+51 123 456 789'),
        ('email',         'contacto@puertohabana.com'),
        ('horarioMañana', '09:00 - 14:00'),
        ('horarioTarde',  '15:00 - 23:00'),
        ('sidebarDesign', 'normal'),
        ('navbarStyle',   'original'),
        ('ruc',           '20XXXXXXXXX')
      ON DUPLICATE KEY UPDATE valor = VALUES(valor)
    `, 'Configuración por defecto');

    /* ── Resumen ─────────────────────────────────────────────────────── */
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   ✅  Base de datos lista                     ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log('  Tablas creadas:');
    console.log('    usuarios        — Personal (admin, mozo, cocina…)');
    console.log('    mesas           — Mesas del restaurante');
    console.log('    reservas        — Reservas de mesas (Mozo)');
    console.log('    comandas        — Pedidos/comandas');
    console.log('    comanda_items   — Ítems de cada comanda');
    console.log('    inventario      — Comida, bebidas, tapers, insumos');
    console.log('    gastos          — Gastos del negocio');
    console.log('    pagos_personal  — Pagos a empleados');
    console.log('    mermas          — Desperdicios');
    console.log('    ventas_diarias  — Resumen diario (pronósticos)');
    console.log('    configuracion   — Configuración del sistema\n');

  } catch (err) {
    console.error('\n  ❌  Error:', err.message, '\n');
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
