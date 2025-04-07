const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createPool({
  connectionLimit: 20,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  connectTimeout: 10000,
});

connection.getConnection((err, conn) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
    return;
  }
  conn.query('SELECT DATABASE() AS db_name', (error, results) => {
    if (error) {
      console.error('Error fetching database name:', error.stack);
    } else {
      console.log(`Connected to database: ${results[0].db_name} (Connection ID: ${conn.threadId})`);
    }
    conn.release();
  });
});

module.exports = connection;
