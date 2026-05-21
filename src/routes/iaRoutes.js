const express = require('express');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');
const router = express.Router();
const { explicarEvento, analizarRisk, asistente, resumenSemanal } = require('../controllers/iaController');
const { verificarToken } = require('../middleware/auth');
const checkPlan = require('../middleware/checkPlan');
const rateLimit = require('express-rate-limit');

const iaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas solicitudes a IA. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/explicar', verificarToken, iaLimiter, checkPlan('ia'), validate(s.explicarEvento), explicarEvento);
router.post('/analizar-risk', verificarToken, iaLimiter, checkPlan('ia'), validate(s.analizarRisk), analizarRisk);
router.post('/asistente', verificarToken, iaLimiter, checkPlan('ia'), validate(s.asistente), asistente);
router.get('/resumen-semanal', verificarToken, iaLimiter, checkPlan('ia'), resumenSemanal);

module.exports = router;
