const express = require('express');
const router = express.Router();
const { obtenerEventos, obtenerEstadisticas, recibirEventoExterno } = require('../controllers/siemController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const apiKeyAuth = require('../middleware/apiKey');
const { desbloquearEmpresa } = require('../controllers/riskController');
const RiskScore = require('../models/RiskScore');

router.get('/events', verificarToken, verificarAdmin, obtenerEventos);
router.get('/estadisticas', verificarToken, verificarAdmin, obtenerEstadisticas);

// Endpoint externo — protegido por API key, no por JWT
router.post('/external/events', apiKeyAuth, recibirEventoExterno);

router.put('/bloquear/:empresaId', verificarToken, verificarAdmin, async (req, res) => {
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
    res.status(500).json({ mensaje: 'Error', error });
  }
});
router.put('/desbloquear/:empresaId', verificarToken, verificarAdmin, desbloquearEmpresa);

module.exports = router;
