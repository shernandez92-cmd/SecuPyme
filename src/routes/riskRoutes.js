const express = require('express');
const router = express.Router();
const { obtenerRiskScores, obtenerRiskEmpresa, desbloquearEmpresa, bloquearEmpresa, obtenerHistorialEmpresa } = require('../controllers/riskController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/', verificarToken, verificarAdmin, obtenerRiskScores);
router.get('/mi-score', verificarToken, obtenerRiskEmpresa);
router.get('/mi-historial', verificarToken, obtenerHistorialEmpresa);
router.put('/desbloquear/:empresaId', verificarToken, verificarAdmin, desbloquearEmpresa);
router.put('/bloquear/:empresaId', verificarToken, verificarAdmin, bloquearEmpresa);

module.exports = router;
