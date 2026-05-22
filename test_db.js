const pool = require('./src/lib/db').default;

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Successfully connected to MySQL using the pool in db.ts");
    
    // Test a simple query
    const [rows] = await connection.query('SHOW TABLES');
    console.log("Tables in database:", rows);
    
    connection.release();
  } catch (error) {
    console.error("Error connecting to MySQL:", error);
  } finally {
    pool.end();
  }
}

testConnection();
