const SecurityEvent = require('../models/SecurityEvent');
const { actualizarRisk } = require('./riskController');

const registrarEvento = async (type, description, severity, userId, ip) => {
  try {
    await new SecurityEvent({ type, description, severity, userId, ip, source: 'internal' }).save();
    console.log(`[SIEM] ${severity.toUpperCase()} — ${type}: ${description}`);
  } catch (e) {
    console.log('Error SIEM:', e.message);
  }
};

const recibirEventoExterno = async (req, res) => {
  try {
    const { type, description, severity, ip, timestamp } = req.body;

    if (!description || !severity) {
      return res.status(400).json({ mensaje: 'description y severity son requeridos' });
    }

    const severidadesValidas = ['low', 'medium', 'high'];
    if (!severidadesValidas.includes(severity)) {
      return res.status(400).json({ mensaje: 'severity debe ser low, medium o high' });
    }

    const evento = await SecurityEvent.create({
      type: 'external',
      description,
      severity,
      userId: req.usuario.id,
      ip: ip || req.ip,
      source: 'external',
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    // Conectar al recálculo del risk score según severidad
    const tipoRisk = severity === 'high'
      ? 'nuevo_reporte_malware'
      : severity === 'medium'
      ? 'nuevo_reporte_phishing'
      : null;

    if (tipoRisk) {
      await actualizarRisk(req.usuario.id.toString(), tipoRisk);
    }

    res.status(201).json({
      mensaje: 'Evento registrado correctamente',
      id: evento._id,
      timestamp: evento.timestamp
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error registrando evento', error: error.message });
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

module.exports = { registrarEvento, recibirEventoExterno, obtenerEventos, obtenerEstadisticas };
