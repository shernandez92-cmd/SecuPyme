const SecurityEvent = require('../models/SecurityEvent');

const registrarEvento = async (type, description, severity, userId, ip) => {
  try {
    await new SecurityEvent({ type, description, severity, userId, ip }).save();
    console.log(`[SIEM] ${severity.toUpperCase()} — ${type}: ${description}`);
  } catch (e) {
    console.log('Error SIEM:', e.message);
  }
};

const obtenerEventos = async (req, res) => {
  try {
    const { tipo, severidad, userId } = req.query;
    let filtro = {};
    if (tipo) filtro.type = tipo;
    if (severidad) filtro.severity = severidad;
    if (userId) filtro.userId = userId;

    const eventos = await SecurityEvent.find(filtro)
      .populate('userId', 'nombre email empresa')
      .sort({ timestamp: -1 })
      .limit(200);
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};


const obtenerEstadisticas = async (req, res) => {
  try {
    const total = await SecurityEvent.countDocuments();
    const altos = await SecurityEvent.countDocuments({ severity: 'high' });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyCount = await SecurityEvent.countDocuments({ timestamp: { $gte: hoy } });
    const porTipo = await SecurityEvent.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    res.json({ total, altos, hoy: hoyCount, porTipo });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};

module.exports = { registrarEvento, obtenerEventos, obtenerEstadisticas };
