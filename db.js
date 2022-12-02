require('dotenv').config();
const mysql = require('mysql2');

const { DB_HOST, DB_NAME, DB_USER, DB_PASS } = process.env;

const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  database: DB_NAME,
  password: DB_PASS,
});

module.exports = connection;
