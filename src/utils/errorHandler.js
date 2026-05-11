/**
 * Error handling utilities
 */

/**
 * Send safe error response (never expose stack traces)
 */
const sendErrorResponse = (res, statusCode, message, errorCode = null) => {
  const response = {
    mensaje: message,
    ...(errorCode && { errorCode })
  };

  // Log full error server-side for debugging
  console.error(`[${statusCode}] ${message}`);

  return res.status(statusCode).json(response);
};

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendErrorResponse(
      res,
      400,
      'Error de validación en los datos proporcionados',
      'VALIDATION_ERROR'
    );
  }

  // Handle MongoDB cast errors
  if (err.name === 'CastError') {
    return sendErrorResponse(
      res,
      400,
      'ID inválido',
      'INVALID_ID'
    );
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendErrorResponse(
      res,
      409,
      `${field} ya existe`,
      'DUPLICATE_FIELD'
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendErrorResponse(
      res,
      401,
      'Token inválido',
      'INVALID_TOKEN'
    );
  }

  if (err.name === 'TokenExpiredError') {
    return sendErrorResponse(
      res,
      401,
      'Token expirado',
      'TOKEN_EXPIRED'
    );
  }

  // Default 500 error
  sendErrorResponse(
    res,
    500,
    'Error interno del servidor',
    'INTERNAL_SERVER_ERROR'
  );
};

/**
 * Async route wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  sendErrorResponse,
  errorHandler,
  asyncHandler
};
