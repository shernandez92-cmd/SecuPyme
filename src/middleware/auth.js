const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');

const verificarToken = async (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado, token requerido' });
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el token no esté revocado
    const revocado = await TokenBlacklist.findOne({ token });
    if (revocado) {
      return res.status(401).json({ mensaje: 'Sesión invalidada. Inicia sesión nuevamente.' });
    }

    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

const verificarAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado, se requiere rol admin' });
  }
  next();
};

// Helper reutilizable — úsalo desde cualquier controller
const revocarToken = async (token) => {
  try {
    if (!token) return;
    const payload = jwt.decode(token);
    if (!payload || !payload.exp) return;
    const expiresAt = new Date(payload.exp * 1000);
    // Solo insertar si aún no expiró (no tiene sentido blacklistear tokens ya vencidos)
    if (expiresAt > new Date()) {
      await TokenBlacklist.create({ token, expiresAt });
    }
  } catch (e) {
    // ignore duplicate key errors — el token ya estaba revocado
    if (e.code !== 11000) console.error('revocarToken error:', e.message);
  }
};

module.exports = { verificarToken, verificarAdmin, revocarToken };
