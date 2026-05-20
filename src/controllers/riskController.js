const logger = require('../utils/logger');
const RiskScore = require('../models/RiskScore');
const SecurityEvent = require('../models/SecurityEvent');

const PESOS = {
  login_fallido: 15,
  login_exitoso: -2,
  nuevo_reporte_phishing: 20,
  nuevo_reporte_malware: 25,
  nuevo_reporte_acceso_no_autorizado: 20,
  nuevo_reporte_fuga_de_datos: 30,
  autoevaluacion_alto: 30,
  autoevaluacion_medio: 10,
  autoevaluacion_bajo: -10,
  shodan_puerto_critico: 10,
  virustotal_malicioso: 40,
  cambio_rol: 5
};

const getNivel = (score) => {
  if (score <= 30) return 'normal';
  if (score <= 60) return 'monitoreo';
  if (score <= 80) return 'alerta';
  return 'critico';
};

const actualizarRisk = async (empresaId, tipoEvento, io = null) => {
  try {
    if (!empresaId) return;
    const cambio = PESOS[tipoEvento] || 0;
    if (cambio === 0) return;

    let riskDoc = await RiskScore.findOne({ empresaId });
    if (!riskDoc) {
      riskDoc = new RiskScore({ empresaId, score: 0 });
    }

    riskDoc.score = Math.max(0, Math.min(100, riskDoc.score + cambio));
    riskDoc.nivel = getNivel(riskDoc.score);
    riskDoc.ultimaActualizacion = new Date();
    riskDoc.historial.push({ evento: tipoEvento, cambio });

    if (riskDoc.score > 80 && !riskDoc.bloqueado) {
      riskDoc.bloqueado = true;
      riskDoc.bloqueoHasta = new Date(Date.now() + 15 * 60 * 1000);
      await SecurityEvent.create({
        type: 'bloqueo_automatico',
        description: `Usuario bloqueado automáticamente. Score: ${riskDoc.score}`,
        severity: 'high',
        userId: empresaId,
        ip: 'sistema'
      });
      if (io) io.emit('alertaCritica', {
        empresaId,
        mensaje: `Empresa bloqueada automáticamente. Risk score: ${riskDoc.score}`,
        nivel: 'critico'
      });
    }

    await riskDoc.save();
    if (io) io.emit('riskUpdate', { empresaId, score: riskDoc.score, nivel: riskDoc.nivel });
    return riskDoc;
  } catch (e) {
    logger.info('Error actualizando risk:', e.message);
  }
};

const obtenerRiskScores = async (req, res, next) => {
  try {
    const scores = await RiskScore.find()
      .populate('empresaId', 'nombre empresa email rol')
      .sort({ score: -1 });
    res.json(scores);
  } catch (error) {
    next(error);
  }
};

const obtenerRiskEmpresa = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const score = await RiskScore.findOne({ empresaId: userId });
    res.json(score || { score: 0, nivel: 'normal' });
  } catch (error) {
    next(error);
  }
};

const desbloquearEmpresa = async (req, res, next) => {
  try {
    const { empresaId } = req.params;
    const { registrarAudit } = require('./auditController');

    const target = await require('../models/Usuario').findById(empresaId).select('nombre email');

    await RiskScore.findOneAndUpdate(
      { empresaId },
      { bloqueado: false, bloqueoHasta: null, score: 50 }
    );

    await registrarAudit({
      adminId:     req.usuario.id,
      adminNombre: req.usuario.nombre || req.usuario.id,
      accion:      'desbloqueo_manual',
      targetUserId: empresaId,
      targetNombre: target ? target.nombre : empresaId,
      detalle:     `Empresa desbloqueada manualmente. Score reseteado a 50.`
    });

    res.json({ mensaje: 'Empresa desbloqueada' });
  } catch (error) {
    next(error);
  }
};

const bloquearEmpresa = async (req, res, next) => {
  try {
    const { empresaId } = req.params;
    const { registrarAudit } = require('./auditController');

    const target = await require('../models/Usuario').findById(empresaId).select('nombre email');

    await RiskScore.findOneAndUpdate(
      { empresaId },
      { bloqueado: true, bloqueoHasta: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { upsert: true }
    );

    await registrarAudit({
      adminId:     req.usuario.id,
      adminNombre: req.usuario.nombre || req.usuario.id,
      accion:      'bloqueo_manual',
      targetUserId: empresaId,
      targetNombre: target ? target.nombre : empresaId,
      detalle:     `Empresa bloqueada manualmente por 24 horas.`
    });

    res.json({ mensaje: 'Empresa bloqueada' });
  } catch (error) {
    next(error);
  }
};


const obtenerHistorialEmpresa = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const score = await RiskScore.findOne({ empresaId: userId });
    if (!score) return res.json({ score: 0, nivel: 'normal', historial: [] });

    const etiquetas = {
      login_fallido:                      { label: 'Intento de login fallido',           icono: '🔐' },
      login_exitoso:                      { label: 'Login exitoso',                      icono: '✅' },
      nuevo_reporte_phishing:             { label: 'Reporte de phishing',                icono: '🎣' },
      nuevo_reporte_malware:              { label: 'Reporte de malware',                 icono: '🦠' },
      nuevo_reporte_acceso_no_autorizado: { label: 'Acceso no autorizado reportado',     icono: '🚨' },
      nuevo_reporte_fuga_de_datos:        { label: 'Fuga de datos reportada',            icono: '💧' },
      autoevaluacion_alto:                { label: 'Autoevaluacion - riesgo alto',        icono: '📋' },
      autoevaluacion_medio:               { label: 'Autoevaluacion - riesgo medio',       icono: '📋' },
      autoevaluacion_bajo:                { label: 'Autoevaluacion - riesgo bajo',        icono: '📋' },
      shodan_puerto_critico:              { label: 'Puerto critico detectado (Shodan)',   icono: '🔍' },
      virustotal_malicioso:               { label: 'Archivo malicioso detectado (VT)',    icono: '☣' },
      cambio_rol:                         { label: 'Cambio de rol de usuario',            icono: '👤' },
      bloqueo_automatico:                 { label: 'Bloqueo automatico del sistema',      icono: '🔒' }
    };

    const historialOrdenado = [...score.historial]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 50)
      .map(h => {
        const meta = etiquetas[h.evento] || { label: h.evento, icono: '📌' };
        return {
          evento: h.evento,
          label: meta.label,
          icono: meta.icono,
          cambio: h.cambio,
          fecha: h.fecha
        };
      });

    res.json({
      score: score.score,
      nivel: score.nivel,
      bloqueado: score.bloqueado,
      ultimaActualizacion: score.ultimaActualizacion,
      historial: historialOrdenado
    });
  } catch (error) {
    next(error);
  }
};
module.exports = { actualizarRisk, obtenerRiskScores, obtenerRiskEmpresa, desbloquearEmpresa, bloquearEmpresa, obtenerHistorialEmpresa };
