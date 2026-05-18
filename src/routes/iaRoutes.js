const express = require('express');
const router = express.Router();
const { explicarEvento, analizarRisk, asistente, resumenSemanal } = require('../controllers/iaController');
const { verificarToken } = require('../middleware/auth');

router.post('/explicar', verificarToken, explicarEvento);
router.post('/analizar-risk', verificarToken, analizarRisk);
router.post('/asistente', verificarToken, asistente);
router.get('/resumen-semanal', verificarToken, resumenSemanal);

module.exports = router;
