class AppError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function notFound(req, res, next) {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Error interno del servidor.';
  if (error.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'El cuerpo JSON no tiene un formato válido.';
  }
  if (error.code === 'ER_DUP_ENTRY') {
    status = 409; code = 'CONFLICT'; message = 'El registro entra en conflicto con datos existentes.';
  }
  if (error.code === 'ER_BAD_NULL_ERROR' || error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    status = 400; code = 'CONSTRAINT_VIOLATION'; message = 'Los datos incumplen una regla de la base de datos.';
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400; code = 'INVALID_REFERENCE'; message = 'El cliente indicado no existe.';
  }
  const payload = { error: { code, message } };
  if (error.details) payload.error.details = error.details;
  if (status >= 500) console.error(error);
  res.status(status).json(payload);
}

module.exports = { AppError, notFound, errorHandler };
