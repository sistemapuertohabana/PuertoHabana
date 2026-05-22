const mysql = require('mysql2/promise');

async function setupDB() {
  // Conectarse sin base de datos para poder crearla si no existe
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS puerto_habana`);
    console.log("Database 'puerto_habana' ensured.");
    
    await connection.query(`USE puerto_habana`);
    
    // Tabla de inventario
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        cantidad INT NOT NULL,
        unidad VARCHAR(50) NOT NULL,
        minimo INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Table 'inventario' ensured.");

    // Tabla de pagos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mozoNombre VARCHAR(255) NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        concepto VARCHAR(255) NOT NULL,
        fecha DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table 'pagos' ensured.");
    
    // Tabla de pedidos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item VARCHAR(255) NOT NULL,
        cantidad INT NOT NULL,
        mesa VARCHAR(100) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        hora VARCHAR(50) NOT NULL,
        fecha VARCHAR(50) NOT NULL,
        notas TEXT,
        mozoNombre VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table 'pedidos' ensured.");

    console.log("Database setup completed successfully.");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await connection.end();
  }
}

setupDB();
