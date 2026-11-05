const app = require('./app');
const env = require('./config/env');
const pool = require('./db/pool');
const initializeDatabase = require('./db/init');

async function start() {
  await initializeDatabase();
  const server = app.listen(env.port, () => console.log(`API escuchando en http://localhost:${env.port}`));
  const shutdown = (signal) => {
    console.log(`${signal}: cerrando servidor...`);
    server.close(async () => { await pool.end(); process.exit(0); });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error.message);
  process.exit(1);
});
