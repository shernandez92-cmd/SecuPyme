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

module.exports = { registrarEvento, obtenerEventos };
