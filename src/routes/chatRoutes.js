const express = require('express');
const router = express.Router();
const { enviarMensaje, obtenerMensajes, obtenerReportesUsuario, borrarChat, marcarLeido } = require('../controllers/chatController');
const { verificarToken } = require('../middleware/auth');

router.post('/', verificarToken, enviarMensaje);
router.get('/', verificarToken, obtenerMensajes);
router.get('/reportes', verificarToken, obtenerReportesUsuario);
router.delete('/borrar', verificarToken, borrarChat);
router.put("/leido/:conversacionId", verificarToken, marcarLeido);

module.exports = router;
