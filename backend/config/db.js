import mysql from 'mysql2/promise'

// Konfigurasi lokal lama (di-comment):
// const db = mysql.createPool({
//   host: process.env.MYSQL_HOST,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DB,

//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 10000,

//   connectTimeout: 10000
// })

// Konfigurasi Cloud (TiDB Cloud):
const db = mysql.createPool(process.env.DB_URI);

export default db;