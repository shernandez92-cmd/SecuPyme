const express = require('express');
const router = express.Router();
const { obtenerRiskScores, obtenerRiskEmpresa, desbloquearEmpresa } = require('../controllers/riskController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/', verificarToken, verificarAdmin, obtenerRiskScores);
router.get('/mi-score', verificarToken, obtenerRiskEmpresa);
router.put('/desbloquear/:empresaId', verificarToken, verificarAdmin, desbloquearEmpresa);

module.exports = router;
