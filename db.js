import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '161.132.53.196',
  user: 'testuser',
  password: 'testpass',
  database: 'testdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});