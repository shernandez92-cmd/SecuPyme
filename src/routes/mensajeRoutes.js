const express = require('express');
const router = express.Router();
const { enviarMensaje, obtenerMensajes } = require('../controllers/mensajeController');
const { verificarToken } = require('../middleware/auth');

router.post('/:reporteId', verificarToken, enviarMensaje);
router.get('/:reporteId', verificarToken, obtenerMensajes);

module.exports = router;
