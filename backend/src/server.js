const app = require('./app');
const env = require('./config/env');
const pool = require('./db/pool');
const initializeDatabase = require('./db/init');
const { readAiConfig } = require('./config/ai');
const { createProvider } = require('./services/ai-provider');
const { createWorker } = require('./services/ai-worker');

async function start() {
  const config = readAiConfig();
  // Validate company knowledge before touching the database or starting the server.
  const answer = config.mode === 'gemini' ? createProvider(config) : null;
  await initializeDatabase();
  const worker = createWorker({ pool, config, answer, database: env.dbName });
  const server = app.listen(env.port, () => {
    console.log(`API escuchando en http://localhost:${env.port}`);
    console.log(config.mode === 'gemini' ? 'IA activada: se procesarán las consultas pendientes sin respuesta.' : 'IA desactivada: las consultas se guardan sin llamar al proveedor.');
    worker.start();
  });
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal}: cerrando servidor...`);
    server.close(async () => { await worker.stop(); await pool.end(); process.exit(0); });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error.message);
  process.exit(1);
});
