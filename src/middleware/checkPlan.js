const logger = require('../utils/logger');
const Reporte = require('../models/Reporte');
const Autoevaluacion = require('../models/Autoevaluacion');

const LIMITES = {
  free:    { reportes: 3,        autoevaluaciones: 1,  ia: false },
  basico:  { reportes: 20,       autoevaluaciones: 10, ia: true  },
  premium: { reportes: Infinity, autoevaluaciones: Infinity, ia: true },
};

const checkPlan = (recurso) => async (req, res, next) => {
  try {
    if (req.usuario.rol === 'admin') return next();

    const plan   = req.usuario.plan || 'free';
    const limite = LIMITES[plan] || LIMITES.free;

    if (recurso === 'reportes') {
      const total = await Reporte.countDocuments({ usuario: req.usuario.id });
      if (total >= limite.reportes) {
        return res.status(403).json({
          mensaje: `Tu plan ${plan} permite máximo ${limite.reportes} reportes. Actualiza tu membresía.`,
          upgrade: true
        });
      }
    }

    if (recurso === 'autoevaluaciones') {
      const total = await Autoevaluacion.countDocuments({ usuario: req.usuario.id });
      if (total >= limite.autoevaluaciones) {
        return res.status(403).json({
          mensaje: `Tu plan ${plan} permite máximo ${limite.autoevaluaciones} autoevaluaciones. Actualiza tu membresía.`,
          upgrade: true
        });
      }
    }

    if (recurso === 'ia') {
      if (!limite.ia) {
        return res.status(403).json({
          mensaje: `El plan ${plan} no incluye acceso al asistente IA. Actualiza tu membresía.`,
          upgrade: true
        });
      }
    }

    next();
  } catch (error) {
    logger.error('checkPlan error:', error.message);
    res.status(500).json({ mensaje: 'Error verificando plan', error });
  }
};

module.exports = checkPlan;
