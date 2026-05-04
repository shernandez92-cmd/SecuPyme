const express = require('express');
const router = express.Router();
const { crearAutoevaluacion, obtenerAutoevaluaciones } = require('../controllers/autoevaluacionController');
const { verificarToken } = require('../middleware/auth');

router.post('/', verificarToken, crearAutoevaluacion);
router.get('/', verificarToken, obtenerAutoevaluaciones);

module.exports = router;
