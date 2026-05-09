const Reporte = require('../models/Reporte');

const checkPlan = async (req, res, next) => {
  try {
    if (req.usuario.rol === 'admin') return next();
    
    const plan = req.usuario.plan || 'free';
    const limites = { free: 3, basico: 20, premium: Infinity };
    const limite = limites[plan];
    
    const total = await Reporte.countDocuments({ usuario: req.usuario.id });
    
    if (total >= limite) {
      return res.status(403).json({ 
        mensaje: `Tu plan ${plan} permite máximo ${limite} reportes. Actualiza tu membresía.` 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ mensaje: 'Error verificando plan', error });
  }
};

module.exports = checkPlan;
