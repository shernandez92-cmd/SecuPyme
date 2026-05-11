const Usuario = require('../models/Usuario');
const { sendErrorResponse } = require('../utils/errorHandler');
const validators = require('../utils/validators');

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return sendErrorResponse(res, 401, 'API key requerida en header x-api-key', 'NO_API_KEY');
    }

    // Validate API key format
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      return sendErrorResponse(res, 401, 'API key inválida', 'INVALID_API_KEY');
    }

    const usuario = await Usuario.findOne({ apiKey });

    if (!usuario) {
      return sendErrorResponse(res, 401, 'API key no autorizada', 'UNAUTHORIZED_API_KEY');
    }

    if (usuario.activo === false) {
      return sendErrorResponse(res, 403, 'Usuario inactivo', 'USER_INACTIVE');
    }

    req.usuario = { 
      id: usuario._id, 
      rol: usuario.rol, 
      plan: usuario.plan,
      email: usuario.email
    };
    next();
  } catch (error) {
    console.error('API Key auth error:', error.message);
    sendErrorResponse(res, 500, 'Error al validar API key', 'AUTH_ERROR');
  }
};

module.exports = apiKeyAuth;

