const express = require('express');
const router = express.Router();
const { obtenerEventos, obtenerEstadisticas, recibirEventoExterno, cronMonitoreo } = require('../controllers/siemController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const apiKeyAuth = require('../middleware/apiKey');
const { desbloquearEmpresa } = require('../controllers/riskController');
const RiskScore = require('../models/RiskScore');

router.get('/events', verificarToken, verificarAdmin, obtenerEventos);
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);

// Endpoint externo — protegido por API key, no por JWT
router.post('/external/events', apiKeyAuth, recibirEventoExterno);

// Endpoint para cron externo (cron-job.org) — protegido por CRON_SECRET
router.post('/cron/monitoreo', cronMonitoreo);

router.put('/bloquear/:empresaId', verificarToken, verificarAdmin, async (req, res, next) => {
  try {
    const { empresaId } = req.params;
    const { minutos = 15 } = req.body;
    await RiskScore.findOneAndUpdate(
      { empresaId },
      {
        bloqueado: true,
        bloqueoHasta: new Date(Date.now() + minutos * 60 * 1000),
        score: 85
      },
      { upsert: true }
    );
    res.json({ mensaje: `Empresa bloqueada por ${minutos} minutos` });
  } catch (error) {
    next(error);
  }
});
router.put('/desbloquear/:empresaId', verificarToken, verificarAdmin, desbloquearEmpresa);

module.exports = router;
