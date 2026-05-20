const logger = require('../utils/logger');
const SecurityEvent = require('../models/SecurityEvent');
const { actualizarRisk } = require('./riskController');

const registrarEvento = async (type, description, severity, userId, ip) => {
  try {
    await new SecurityEvent({ type, description, severity, userId, ip, source: 'internal' }).save();
    logger.info(`[SIEM] ${severity.toUpperCase()} — ${type}: ${description}`);
  } catch (e) {
    logger.error('Error SIEM:', e.message);
  }
};

const recibirEventoExterno = async (req, res, next) => {
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
    next(error);
  }
};

const obtenerEventos = async (req, res, next) => {
  try {
    const { tipo, severidad, userId } = req.query;
    let filtro = {};
    if (tipo) filtro.type = tipo;
    if (severidad) filtro.severity = severidad;
    if (userId) filtro.userId = userId;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [eventos, total] = await Promise.all([
      SecurityEvent.find(filtro).populate('userId', 'nombre email empresa')
        .sort({ timestamp: -1 }).skip(skip).limit(limit),
      SecurityEvent.countDocuments(filtro)
    ]);

    res.json({ eventos, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const obtenerEstadisticas = async (req, res, next) => {
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
    next(error);
  }
};

const cronMonitoreo = async (req, res, next) => {
  try {
    const secret = req.headers['x-cron-secret'];
    if (!secret || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ mensaje: 'No autorizado' });
    }
    const { ejecutarMonitoreo } = require('../jobs/monitoreoIPs');
    await ejecutarMonitoreo();
    res.json({ mensaje: 'Monitoreo ejecutado correctamente', timestamp: new Date() });
  } catch (error) {
    next(error);
  }
};

module.exports = { registrarEvento, recibirEventoExterno, obtenerEventos, obtenerEstadisticas, cronMonitoreo };
