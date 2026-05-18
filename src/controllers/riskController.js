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
    console.log('Error actualizando risk:', e.message);
  }
};

const obtenerRiskScores = async (req, res) => {
  try {
    const scores = await RiskScore.find()
      .populate('empresaId', 'nombre empresa email rol')
      .sort({ score: -1 });
    res.json(scores);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};

const obtenerRiskEmpresa = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const score = await RiskScore.findOne({ empresaId: userId });
    res.json(score || { score: 0, nivel: 'normal' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};

const desbloquearEmpresa = async (req, res) => {
  try {
    const { empresaId } = req.params;
    await RiskScore.findOneAndUpdate(
      { empresaId },
      { bloqueado: false, bloqueoHasta: null, score: 50 }
    );
    res.json({ mensaje: 'Empresa desbloqueada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error', error });
  }
};

module.exports = { actualizarRisk, obtenerRiskScores, obtenerRiskEmpresa, desbloquearEmpresa };
