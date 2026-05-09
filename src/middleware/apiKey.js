const Usuario = require('../models/Usuario');

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ mensaje: 'API key requerida' });
  const usuario = await Usuario.findOne({ apiKey });
  if (!usuario) return res.status(401).json({ mensaje: 'API key inválida' });
  req.usuario = { id: usuario._id, rol: usuario.rol, plan: usuario.plan };
  next();
};

module.exports = apiKeyAuth;

apiKey: { type: String, unique: true, sparse: true }

