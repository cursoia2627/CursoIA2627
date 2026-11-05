const mysql = require('mysql2/promise');
const fs = require('node:fs');
const path = require('node:path');
const env = require('../config/env');

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  ssl: env.dbSsl ? (env.dbSslCa ? {
    ca: fs.readFileSync(path.resolve(process.cwd(), env.dbSslCa)),
    rejectUnauthorized: true,
  } : { rejectUnauthorized: false }) : undefined,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

module.exports = pool;
