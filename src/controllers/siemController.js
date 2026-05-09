const SecurityEvent = require('../models/SecurityEvent');

const registrarEvento = async (type, description, severity, userId, ip) => {
  try {
    await new SecurityEvent({ type, description, severity, userId, ip }).save();
  } catch (e) {}
};

const obtenerEventos = async (req, res) => {
  try {
    const eventos = await SecurityEvent.find()
      .populate('userId', 'nombre email empresa')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};

module.exports = { registrarEvento, obtenerEventos };
