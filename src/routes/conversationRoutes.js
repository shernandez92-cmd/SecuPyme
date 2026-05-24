const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  getConversaciones,
  getConversacionActual,
  crearConversacion,
} = require('../controllers/conversationController');

router.get('/', verificarToken, getConversaciones);
router.get('/actual', verificarToken, getConversacionActual);
router.post('/', verificarToken, crearConversacion);

module.exports = router;
