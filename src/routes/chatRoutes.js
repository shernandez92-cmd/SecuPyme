const express = require('express');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');
const router = express.Router();
const { enviarMensaje, obtenerMensajes, obtenerReportesUsuario, borrarChat, marcarLeido } = require('../controllers/chatController');
const { verificarToken } = require('../middleware/auth');

router.post('/', verificarToken, validate(s.enviarMensaje), enviarMensaje);
router.get('/', verificarToken, obtenerMensajes);
router.get('/reportes', verificarToken, obtenerReportesUsuario);
router.delete('/borrar', verificarToken, borrarChat);
router.put("/leido/:conversacionId", verificarToken, marcarLeido);

module.exports = router;
