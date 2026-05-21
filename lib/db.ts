// lib/db.ts
// MySQL connection pool for Next.js (singleton).
// Ensure you have installed mysql2: npm install mysql2

import mysql from 'mysql2/promise';

// Create a pool that will be shared across the application.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // adjust as needed for your environment
  queueLimit: 0,
});

export default pool;
