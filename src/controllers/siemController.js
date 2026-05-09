const SecurityEvent = require('../models/SecurityEvent');

const registrarEvento = async (type, description, severity, userId, ip) => {
  try {
    const evento = await new SecurityEvent({ type, description, severity, userId, ip }).save();
    console.log('Evento guardado:', type);
  } catch (e) {
    console.log('Error SIEM:', e.message);
  }
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
