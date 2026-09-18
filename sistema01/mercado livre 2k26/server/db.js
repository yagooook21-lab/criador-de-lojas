import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u825872693_ml4455',
  password: process.env.DB_PASSWORD || '@Yan84714511',
  database: process.env.DB_NAME || 'u825872693_ml4455',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  decimalNumbers: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

export default pool;
