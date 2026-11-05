const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const clienteRoutes = require('./routes/cliente.routes');
const consultaRoutes = require('./routes/consulta.routes');
const { AppError, notFound, errorHandler } = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError(403, 'Origen no permitido por la política CORS.', 'CORS_ORIGIN_DENIED'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/clientes', clienteRoutes);
app.use('/api/consultas', consultaRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
