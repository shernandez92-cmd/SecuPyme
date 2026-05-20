const logger = require('../utils/logger');

// Helper para lanzar errores HTTP desde controllers
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Middleware de error centralizado — debe ir último en index.js
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Siempre loggear internamente
  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${err.message}`);
  }

  // Responder al cliente sin exponer internals en producción
  res.status(status).json({
    mensaje: err.isOperational ? err.message : 'Error interno del servidor',
    ...(isProduction ? {} : { detalle: err.message, stack: err.stack })
  });
};

module.exports = { errorHandler, AppError };
