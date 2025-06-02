import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '37.140.192.16',
  user: 'u2583244_numicprj',
  password: 'fU0eO5lB9stS3eM8',
  database: 'u2583244_numicprj',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool; 