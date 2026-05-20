const logger = require('../utils/logger');
const AuditLog = require('../models/AuditLog');
const { registrarEvento } = require('./siemController');

// Helper reutilizable desde otros controllers
const registrarAudit = async ({ adminId, adminNombre, accion, targetUserId, targetNombre, detalle }) => {
  try {
    await AuditLog.create({ adminId, adminNombre, accion, targetUserId, targetNombre, detalle });

    // Reflejar en SIEM
    const severity = ['eliminar_usuario', 'bloqueo_manual'].includes(accion) ? 'high' : 'medium';
    await registrarEvento(
      `audit_${accion}`,
      `[AUDIT] ${adminNombre} → ${accion} sobre ${targetNombre || targetUserId} — ${detalle || ''}`,
      severity,
      adminId,
      'panel-admin'
    );
  } catch (e) {
    logger.error('registrarAudit error:', e.message);
  }
};

// GET /api/audit — solo admin
const obtenerLogs = async (req, res, next) => {
  try {
    const { accion, adminId, desde, hasta, limit = 50, page = 1 } = req.query;
    const filtro = {};
    if (accion)   filtro.accion   = accion;
    if (adminId)  filtro.adminId  = adminId;
    if (desde || hasta) {
      filtro.timestamp = {};
      if (desde) filtro.timestamp.$gte = new Date(desde);
      if (hasta) filtro.timestamp.$lte = new Date(hasta);
    }

    const total = await AuditLog.countDocuments(filtro);
    const logs  = await AuditLog.find(filtro)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = { registrarAudit, obtenerLogs };
