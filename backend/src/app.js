const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const clienteRoutes = require('./routes/cliente.routes');
const consultaRoutes = require('./routes/consulta.routes');
const avatarRoutes = require('./routes/avatar.routes');
const { AppError, notFound, errorHandler } = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http://localhost:4000", "https:"],
      connectSrc: ["'self'", "http://localhost:4000", "https:"],
    }
  }
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError(403, 'Origen no permitido por la política CORS.', 'CORS_ORIGIN_DENIED'));
  },
}));
app.use(express.json({ limit: '1mb' }));
// Informa si el servidor API está activo; no consulta la base de datos.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/ia/status', (req, res) => {
  // Configuration only; this does not test provider access or reveal credentials.
  const { readAiConfig } = require('./config/ai');
  const config = readAiConfig();
  res.json({ data: { enabled: config.mode === 'gemini', provider: config.mode, companyKnowledgeConfigured: Boolean(config.knowledgeFile) } });
});
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/clientes', clienteRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/clientes/:id/avatar', avatarRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
