const jwt = require('jsonwebtoken');
const { sendErrorResponse } = require('../utils/errorHandler');

const verificarToken = (req, res, next) => {
  // Extract token from Authorization header (Bearer token)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return sendErrorResponse(res, 401, 'Acceso denegado, token requerido', 'NO_TOKEN');
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not configured');
    return sendErrorResponse(res, 500, 'Error interno del servidor', 'CONFIG_ERROR');
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    if (!verificado.id && !verificado._id) {
      return sendErrorResponse(res, 401, 'Token inválido - sin usuario', 'INVALID_TOKEN');
    }
    req.usuario = verificado;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendErrorResponse(res, 401, 'Token expirado', 'TOKEN_EXPIRED');
    }
    return sendErrorResponse(res, 401, 'Token inválido', 'INVALID_TOKEN');
  }
};

const verificarAdmin = (req, res, next) => {
  if (!req.usuario) {
    return sendErrorResponse(res, 401, 'Usuario no autenticado', 'NO_AUTH');
  }
  
  if (req.usuario.rol !== 'admin') {
    return sendErrorResponse(res, 403, 'Acceso denegado, se requiere rol admin', 'INSUFFICIENT_PERMISSIONS');
  }
  next();
};

module.exports = { verificarToken, verificarAdmin };