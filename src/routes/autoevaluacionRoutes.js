const express = require('express');
const router  = express.Router();
const {
  obtenerPreguntas,
  obtenerTodasPreguntas,
  crearPregunta,
  editarPregunta,
  togglePregunta,
  crearAutoevaluacion,
  obtenerAutoevaluaciones
} = require('../controllers/autoevaluacionController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');
const checkPlan = require('../middleware/checkPlan');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.get('/preguntas',              verificarToken, obtenerPreguntas);
router.get('/preguntas/todas',        verificarToken, verificarAdmin, obtenerTodasPreguntas);
router.post('/preguntas',             verificarToken, verificarAdmin, validate(s.crearPregunta), crearPregunta);
router.put('/preguntas/:id',        verificarToken, verificarAdmin, validate(s.editarPregunta), editarPregunta);
router.put('/preguntas/:id/toggle',   verificarToken, verificarAdmin, togglePregunta);
router.post('/',                      verificarToken, checkPlan('autoevaluaciones'), validate(s.respuestas), crearAutoevaluacion);
router.get('/',                       verificarToken, obtenerAutoevaluaciones);

module.exports = router;
