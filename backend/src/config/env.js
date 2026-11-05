require('dotenv').config();

const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME || 'cursoia',
  dbSsl: process.env.DB_SSL !== 'false',
  dbSslCa: process.env.DB_SSL_CA,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3001')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
};

for (const key of ['dbHost', 'dbUser', 'dbPassword']) {
  if (!env[key]) throw new Error(`Falta la variable obligatoria ${key}.`);
}
module.exports = env;
