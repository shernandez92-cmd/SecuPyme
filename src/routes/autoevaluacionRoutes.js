const express = require('express');
const router  = express.Router();
const {
  obtenerPreguntas,
  obtenerTodasPreguntas,
  crearPregunta,
  togglePregunta,
  crearAutoevaluacion,
  obtenerAutoevaluaciones
} = require('../controllers/autoevaluacionController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/preguntas',              verificarToken, obtenerPreguntas);
router.get('/preguntas/todas',        verificarToken, verificarAdmin, obtenerTodasPreguntas);
router.post('/preguntas',             verificarToken, verificarAdmin, crearPregunta);
router.put('/preguntas/:id/toggle',   verificarToken, verificarAdmin, togglePregunta);
router.post('/',                      verificarToken, crearAutoevaluacion);
router.get('/',                       verificarToken, obtenerAutoevaluaciones);

module.exports = router;
